import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { AIService } from "@/lib/ai/client";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDB();
    const currentUser = await getCurrentUser();

    const material = await db
      .prepare(
        `SELECT m.*, u.full_name as uploader_name, 
                mv.id as version_id, mv.filename, mv.extracted_markdown, mv.extracted_text
         FROM materials m
         JOIN users u ON m.uploader_id = u.id
         LEFT JOIN material_versions mv ON m.current_version_id = mv.id
         WHERE m.id = ?`
      )
      .bind(id)
      .first<any>();

    if (!material) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    const documentText = material.extracted_text || material.extracted_markdown || material.title;

    // Generate AI Study Pack summary, revision notes & practice questions
    const studyPackData = await AIService.generateStudyPack(
      documentText,
      material.id,
      material.version_id || "v1"
    );

    // Fetch existing extracted questions from DB
    const { results: existingQuestions } = await db
      .prepare(
        `SELECT id, question_text, options_json, correct_answer, explanation, difficulty, topic, status 
         FROM questions 
         WHERE source_material_id = ?`
      )
      .bind(id)
      .all<any>();

    const formattedExtracted = existingQuestions.map((q) => ({
      ...q,
      options: JSON.parse(q.options_json || "[]"),
    }));

    return NextResponse.json({
      success: true,
      study_pack: {
        material: {
          id: material.id,
          title: material.title,
          subject: material.subject,
          aircraft: material.aircraft,
          airline: material.airline,
          material_type: material.material_type,
          uploader_name: material.uploader_name,
        },
        extracted_markdown: material.extracted_markdown,
        extracted_text: material.extracted_text,
        extracted_questions: formattedExtracted,
        summary: studyPackData.summary,
        revision_notes: studyPackData.revision_notes,
        practice_questions: studyPackData.practice_questions,
      },
    });
  } catch (err: any) {
    console.error("GET Study Pack Error:", err);
    return NextResponse.json({ error: err.message || "Failed to generate study pack" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDB();
    const body = await request.json();
    const { questions, summary, revision_notes } = body;

    const material = await db
      .prepare(`SELECT * FROM materials WHERE id = ?`)
      .bind(id)
      .first<any>();

    if (!material) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    // Persist questions to questions table as pending_review
    if (Array.isArray(questions) && questions.length > 0) {
      for (const q of questions) {
        const qId = `q_sp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        await db
          .prepare(
            `INSERT INTO questions (id, question_text, options_json, correct_answer, explanation, difficulty, topic, aircraft, subject, source_material_id, source_version_id, ai_generated, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'pending_review')`
          )
          .bind(
            qId,
            q.question_text,
            JSON.stringify(q.options || []),
            q.correct_answer || q.options?.[0] || "",
            q.explanation || "Grounded question from study pack",
            q.difficulty || "Medium",
            material.subject,
            material.aircraft || "Q400",
            material.subject,
            material.id,
            material.current_version_id
          )
          .run();
      }
    }

    return NextResponse.json({
      success: true,
      message: `Persisted ${questions?.length || 0} candidate questions to question bank (pending review).`,
    });
  } catch (err: any) {
    console.error("POST Study Pack Error:", err);
    return NextResponse.json({ error: err.message || "Failed to save study pack" }, { status: 500 });
  }
}
