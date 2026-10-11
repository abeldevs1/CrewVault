import { NextResponse } from "next/server";
import { getDB, generateId } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { AIService } from "@/lib/ai/client";

// Structured Exam Category Subject Mappings
const CATEGORY_SUBJECT_MAP: Record<string, string[]> = {
  safety_final: [
    "Emergency Procedures (SEP) & Evacuation",
    "Cabin Doors, Exits & Escape Slides",
    "Emergency Equipment & Fire Fighting",
    "Survival & Ditching",
    "Flight Deck & Security Doors",
  ],
  service_final: [
    "Inflight Service & Hospitality",
    "Standard Operating Procedures (SOPs)",
    "Crew Resource Management (CRM)",
  ],
  dgr_assessment: [
    "Dangerous Goods Regulations (DGR)",
  ],
  // mixed_mock has no subject filter
};

const CATEGORY_DEFAULT_COUNTS: Record<string, number> = {
  safety_final: 15,
  service_final: 15,
  dgr_assessment: 10,
  mixed_mock: 20,
};

const CATEGORY_TITLES: Record<string, string> = {
  safety_final: "Safety Final Examination",
  service_final: "Inflight Service & Hospitality Final",
  dgr_assessment: "Dangerous Goods Regulations Assessment",
  mixed_mock: "Comprehensive Mixed Mock Examination",
};

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const {
      material_id,
      exam_category, // 'safety_final' | 'service_final' | 'dgr_assessment' | 'mixed_mock'
      mode = "bank", // 'bank' (without AI) | 'ai' (with AI)
      aircraft = "Q400",
      subject = "Flight Deck",
      question_count,
      time_limit_minutes,
      title,
    } = body;

    const db = await getDB();
    let questions: any[] = [];

    // 1. If linked to an uploaded exam material, prioritize its extracted questions
    if (material_id) {
      const matQuestions = await db
        .prepare(`SELECT * FROM questions WHERE source_material_id = ? ORDER BY id ASC`)
        .bind(material_id)
        .all<any>();
      if (matQuestions.results && matQuestions.results.length > 0) {
        questions = question_count ? matQuestions.results.slice(0, question_count) : matQuestions.results;
      }
    }

    // Determine target question count & time limit
    const targetCount = question_count || (exam_category ? CATEGORY_DEFAULT_COUNTS[exam_category] || 15 : 20);
    const targetTime = time_limit_minutes || Math.max(15, Math.round((questions.length || targetCount) * 1.5));

    if (questions.length === 0 && mode === "ai" && !exam_category) {
      // Generate questions using AI for custom exam
      const aiPromptSample = `Aircraft: ${aircraft}, Subject: ${subject}. Generate ${targetCount} multiple choice questions on cabin safety, emergency procedures, or door lockdown.`;
      const aiQuestions = await AIService.extractQuestions(aiPromptSample, "mat_ai_gen", "ver_ai_gen");

      if (aiQuestions.length > 0) {
        for (const q of aiQuestions) {
          const qId = generateId("q_ai");
          await db
            .prepare(
              `INSERT INTO questions (id, question_text, options_json, correct_answer, explanation, difficulty, topic, aircraft, subject, ai_generated, status)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'approved')`
            )
            .bind(
              qId,
              q.question_text,
              JSON.stringify(q.options),
              q.correct_answer,
              q.explanation || "AI-generated exam question",
              q.difficulty || "Medium",
              q.topic || subject,
              aircraft,
              subject
            )
            .run();
        }
      }
    }

    // 2. Fetch questions from Question Bank if not already loaded from uploaded material
    if (questions.length === 0) {
      let query = `SELECT * FROM questions WHERE status = 'approved'`;
      const bindings: any[] = [];

      if (exam_category) {
        const allowedSubjects = CATEGORY_SUBJECT_MAP[exam_category];
        if (allowedSubjects && allowedSubjects.length > 0) {
          const placeholders = allowedSubjects.map(() => "?").join(", ");
          query += ` AND (subject IN (${placeholders}) OR topic IN (${placeholders}))`;
          bindings.push(...allowedSubjects, ...allowedSubjects);
        }
      } else {
        if (aircraft && aircraft !== "All" && aircraft !== "General / All Fleet (Non-Aircraft Specific)") {
          query += ` AND (aircraft = ? OR aircraft IS NULL)`;
          bindings.push(aircraft);
        }
        if (subject && subject !== "All") {
          query += ` AND (subject = ? OR topic = ?)`;
          bindings.push(subject, subject);
        }
      }

      query += ` ORDER BY RANDOM() LIMIT ?`;
      bindings.push(targetCount);

      const { results } = await db.prepare(query).bind(...bindings).all<any>();
      questions = results || [];

      // Fallback if not enough specific questions found
      if (questions.length === 0) {
        const fallback = await db
          .prepare(`SELECT * FROM questions WHERE status = 'approved' ORDER BY RANDOM() LIMIT ?`)
          .bind(targetCount)
          .all<any>();
        questions = fallback.results || [];
      }
    }

    if (questions.length === 0) {
      return NextResponse.json({ error: "No questions available in question bank." }, { status: 400 });
    }

    // 3. Create Exam record
    const examId = generateId("exam_gen");
    const examTitle =
      title ||
      (exam_category
        ? CATEGORY_TITLES[exam_category] || "Specialized Assessment"
        : `${aircraft} ${subject} ${mode === "ai" ? "(AI-Assisted)" : "(Practice)"} Exam`);

    const examSubject = exam_category
      ? exam_category === "safety_final"
        ? "Safety & Emergency Procedures"
        : exam_category === "service_final"
        ? "Inflight Service & CRM"
        : exam_category === "dgr_assessment"
        ? "Dangerous Goods Regulations (DGR)"
        : "Mixed Aviation Subjects"
      : subject;

    const finalTrack = body.school_final_track || (exam_category === "safety_final" ? "Safety Final" : exam_category === "service_final" ? "Service Final" : null);
    const publishFlag = body.is_published !== undefined ? (body.is_published ? 1 : 0) : 1;

    await db
      .prepare(
        `INSERT INTO exams (id, title, description, aircraft, subject, difficulty, total_questions, time_limit_minutes, passing_percentage, created_by, is_published, school_final_track)
         VALUES (?, ?, ?, ?, ?, 'Medium', ?, ?, 75, ?, ?, ?)`
      )
      .bind(
        examId,
        examTitle,
        exam_category
          ? `Standardized ${examTitle} containing ${questions.length} questions.`
          : `Generated ${mode === "ai" ? "AI-assisted" : "standard"} mock exam with ${questions.length} questions.`,
        exam_category ? "Fleet Wide" : aircraft,
        examSubject,
        questions.length,
        targetTime,
        user.id,
        publishFlag,
        finalTrack
      )
      .run();

    // 4. Freeze immutable snapshot and create Exam Session
    const questionSnapshots = questions.map((q) => ({
      question_id: q.id,
      question_text: q.question_text,
      options: typeof q.options_json === "string" ? JSON.parse(q.options_json || "[]") : q.options || [],
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      topic: q.topic || q.subject || "Aviation",
      difficulty: q.difficulty || "Medium",
    }));

    const sessionId = generateId("sess_exam");
    await db
      .prepare(
        `INSERT INTO exam_sessions (id, exam_id, user_id, exam_type, status, question_snapshots_json, time_limit_minutes, passing_percentage)
         VALUES (?, ?, ?, ?, 'in_progress', ?, ?, 75)`
      )
      .bind(
        sessionId,
        examId,
        user.id,
        exam_category ? "Mock" : "Practice",
        JSON.stringify(questionSnapshots),
        targetTime
      )
      .run();

    return NextResponse.json({
      success: true,
      exam_id: examId,
      session_id: sessionId,
      message: `Exam generated with ${questions.length} questions!`,
    });
  } catch (err: any) {
    console.error("Generate Exam Error:", err);
    return NextResponse.json({ error: err.message || "Failed to generate exam" }, { status: 500 });
  }
}
