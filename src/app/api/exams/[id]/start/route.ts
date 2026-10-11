import { NextResponse } from "next/server";
import { getDB, generateId } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { FrozenQuestionSnapshot } from "@/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAuth();
    const db = await getDB();

    // 1. Fetch Exam Definition
    const exam = await db
      .prepare("SELECT * FROM exams WHERE id = ?")
      .bind(id)
      .first<any>();

    if (!exam) {
      return NextResponse.json({ error: "Exam definition not found" }, { status: 404 });
    }

    // 2. Query Approved Questions matching Exam criteria
    let query = `
      SELECT id, question_text, options_json, correct_answer, explanation, difficulty, topic, source_material_id, source_page 
      FROM questions 
      WHERE status = 'approved'
    `;

    const bindings: any[] = [];
    if (exam.aircraft) {
      query += " AND (aircraft = ? OR aircraft = 'All Aircraft')";
      bindings.push(exam.aircraft);
    }
    if (exam.subject) {
      query += " AND subject = ?";
      bindings.push(exam.subject);
    }

    query += " ORDER BY RANDOM() LIMIT ?";
    bindings.push(exam.total_questions);

    let { results: rawQuestions } = await db.prepare(query).bind(...bindings).all<any>();

    // Fallback if not enough specific questions exist
    if (rawQuestions.length === 0) {
      const fallback = await db
        .prepare("SELECT id, question_text, options_json, correct_answer, explanation, difficulty, topic, source_material_id, source_page FROM questions WHERE status = 'approved' ORDER BY RANDOM() LIMIT ?")
        .bind(exam.total_questions)
        .all<any>();
      rawQuestions = fallback.results;
    }

    if (rawQuestions.length === 0) {
      return NextResponse.json({ error: "No approved questions available for this exam yet." }, { status: 400 });
    }

    // 3. Build Immutable Frozen Question Snapshots
    const frozenSnapshots: FrozenQuestionSnapshot[] = rawQuestions.map((q) => {
      let options: string[] = JSON.parse(q.options_json || "[]");

      // Optional Answer Order Randomization
      if (exam.randomize_answers) {
        options = [...options].sort(() => Math.random() - 0.5);
      }

      return {
        question_id: q.id,
        question_text: q.question_text,
        options,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        difficulty: q.difficulty || "Medium",
        topic: q.topic || "General Aviation",
        source_material_id: q.source_material_id,
        source_page: q.source_page,
      };
    });

    // Optional Question Order Randomization
    if (exam.randomize_questions) {
      frozenSnapshots.sort(() => Math.random() - 0.5);
    }

    // 4. Create Session Record with Immutable Snapshot JSON
    const sessionId = generateId("sess_ex");
    await db
      .prepare(
        `INSERT INTO exam_sessions 
         (id, exam_id, user_id, exam_type, status, question_snapshots_json, time_limit_minutes, passing_percentage, start_time)
         VALUES (?, ?, ?, ?, 'in_progress', ?, ?, ?, CURRENT_TIMESTAMP)`
      )
      .bind(
        sessionId,
        exam.id,
        user.id,
        exam.is_official ? "Mock" : "Practice",
        JSON.stringify(frozenSnapshots),
        exam.time_limit_minutes,
        exam.passing_percentage
      )
      .run();

    return NextResponse.json({
      success: true,
      session_id: sessionId,
      message: "Immutable exam session initialized successfully",
    });
  } catch (err: any) {
    console.error("Start Exam Error:", err);
    return NextResponse.json({ error: err.message || "Failed to start exam session" }, { status: 500 });
  }
}
