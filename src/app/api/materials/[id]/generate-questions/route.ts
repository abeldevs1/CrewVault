import { NextResponse } from "next/server";
import { getDB, generateId } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { AIService } from "@/lib/ai/client";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: materialId } = await params;
    const user = await requireAuth();
    const body = await request.json().catch(() => ({}));
    const count = Math.min(50, Math.max(3, parseInt(body.count, 10) || 10));
    const difficulty = (body.difficulty || "Medium") as "Easy" | "Medium" | "Hard";

    const db = await getDB();

    // 1. Fetch Material & Extracted Text
    const material = await db
      .prepare(`SELECT * FROM materials WHERE id = ?`)
      .bind(materialId)
      .first<any>();

    if (!material) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    const version = await db
      .prepare(`SELECT * FROM material_versions WHERE id = ?`)
      .bind(material.current_version_id)
      .first<any>();

    let contentText = version?.extracted_markdown || version?.extracted_text || material.description || "";

    // Support synthesizing questions from a specific file within a multi-file bundle
    if (body.bundle_index !== undefined && body.bundle_index !== null && version?.bundle_files_meta_json) {
      try {
        const bundle = JSON.parse(version.bundle_files_meta_json) as any[];
        const selectedFile = bundle.find((f: any) => f.index === Number(body.bundle_index)) || bundle[Number(body.bundle_index)];
        if (selectedFile?.extracted_markdown || selectedFile?.extracted_text) {
          contentText = selectedFile.extracted_markdown || selectedFile.extracted_text;
        }
      } catch (e) {}
    }

    const { isLegibleHumanText } = await import("@/lib/parser");
    if (!contentText || contentText.trim().length < 30 || !isLegibleHumanText(contentText)) {
      return NextResponse.json(
        { error: "Insufficient readable text in this document to synthesize questions. If this is a scanned diagram or graphical chart, please review using the In-Site Document Viewer." },
        { status: 400 }
      );
    }

    // 2. Synthesize Grounded Questions from this document
    const generatedQuestions = await AIService.generateQuestionsFromMaterial(
      contentText,
      count,
      difficulty,
      materialId,
      version?.id
    );

    if (generatedQuestions.length === 0) {
      return NextResponse.json(
        { error: "Unable to synthesize questions from this material at this time." },
        { status: 500 }
      );
    }

    // 3. Persist Questions in Question Bank
    const insertedIds: string[] = [];
    const questionSnapshots: any[] = [];

    for (const q of generatedQuestions) {
      const qId = generateId("q_mat");
      insertedIds.push(qId);

      const options = q.options || [];
      const correctAnswer = q.correct_answer || options[0] || "";

      await db
        .prepare(
          `INSERT INTO questions 
           (id, question_text, options_json, correct_answer, explanation, difficulty, topic, aircraft, subject, source_material_id, source_version_id, ai_generated, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'approved')`
        )
        .bind(
          qId,
          q.question_text,
          JSON.stringify(options),
          correctAnswer,
          q.explanation || `Derived directly from ${material.title}`,
          difficulty,
          material.subject,
          material.aircraft,
          material.subject,
          materialId,
          version?.id
        )
        .run();

      questionSnapshots.push({
        question_id: qId,
        question_text: q.question_text,
        options,
        correct_answer: correctAnswer,
        explanation: q.explanation || `Derived directly from ${material.title}`,
        topic: material.subject,
        difficulty,
      });
    }

    // 4. Create an Instant Practice Exam Session linked to this material
    const examId = generateId("exam_mat");
    const examTitle = `Practice Quiz: ${material.title.substring(0, 50)}`;
    const timeLimitMinutes = Math.max(10, Math.round(generatedQuestions.length * 1.5));

    await db
      .prepare(
        `INSERT INTO exams 
         (id, title, description, aircraft, subject, difficulty, total_questions, time_limit_minutes, passing_percentage, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 75, ?)`
      )
      .bind(
        examId,
        examTitle,
        `Interactive practice quiz generated specifically from "${material.title}".`,
        material.aircraft || "General / All Fleet (Non-Aircraft Specific)",
        material.subject,
        difficulty,
        generatedQuestions.length,
        timeLimitMinutes,
        user.id
      )
      .run();

    const sessionId = generateId("sess_mat");
    await db
      .prepare(
        `INSERT INTO exam_sessions 
         (id, exam_id, user_id, exam_type, status, question_snapshots_json, time_limit_minutes, passing_percentage, start_time)
         VALUES (?, ?, ?, 'Practice', 'in_progress', ?, ?, 75, CURRENT_TIMESTAMP)`
      )
      .bind(
        sessionId,
        examId,
        user.id,
        JSON.stringify(questionSnapshots),
        timeLimitMinutes
      )
      .run();

    return NextResponse.json({
      success: true,
      message: `Generated ${generatedQuestions.length} practice questions from this material!`,
      count: generatedQuestions.length,
      exam_id: examId,
      session_id: sessionId,
      questions: questionSnapshots,
    });
  } catch (err: any) {
    console.error("Generate Questions from Material Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate questions from material" },
      { status: 500 }
    );
  }
}
