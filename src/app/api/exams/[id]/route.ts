import { NextResponse } from "next/server";
import { getDB, generateId } from "@/lib/db";
import { requireAuth, getCurrentUser } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDB();

    const exam = await db
      .prepare(
        `SELECT e.*, u.full_name as creator_name
         FROM exams e
         JOIN users u ON e.created_by = u.id
         WHERE e.id = ?`
      )
      .bind(id)
      .first<any>();

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    const { results: questions } = await db
      .prepare(
        `SELECT q.id, q.question_text, q.options_json, q.correct_answer, q.explanation, q.difficulty, q.topic
         FROM exam_questions eq
         JOIN questions q ON eq.question_id = q.id
         WHERE eq.exam_id = ?
         ORDER BY eq.question_order ASC`
      )
      .bind(id)
      .all<any>();

    return NextResponse.json({
      success: true,
      exam: {
        ...exam,
        questions: (questions || []).map((q) => ({
          ...q,
          options: JSON.parse(q.options_json || "[]"),
        })),
      },
    });
  } catch (err: any) {
    console.error("GET Exam Details Error:", err);
    return NextResponse.json({ error: err.message || "Failed to load exam" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth("MANAGER"); // Admins and Managers
    const { id } = await params;
    const db = await getDB();

    const existing = await db
      .prepare("SELECT id, title, created_by FROM exams WHERE id = ?")
      .bind(id)
      .first<any>();

    if (!existing) {
      return NextResponse.json({ error: "Exam not found or already deleted" }, { status: 404 });
    }

    // 1. Delete associated exam questions links
    await db.prepare("DELETE FROM exam_questions WHERE exam_id = ?").bind(id).run();

    // 2. Delete associated student exam sessions
    await db.prepare("DELETE FROM exam_sessions WHERE exam_id = ?").bind(id).run();

    // 3. Delete the exam record
    await db.prepare("DELETE FROM exams WHERE id = ?").bind(id).run();

    // 4. Log in audit logs
    try {
      await db
        .prepare(
          `INSERT INTO audit_logs (id, actor_id, action, target_type, target_id, details_json)
           VALUES (?, ?, 'DELETE_EXAM', 'exam', ?, ?)`
        )
        .bind(
          generateId("audit"),
          user.id,
          id,
          JSON.stringify({ title: existing.title, deleted_by: user.email })
        )
        .run();
    } catch (_) {}

    return NextResponse.json({
      success: true,
      message: `Exam "${existing.title}" deleted permanently from system and database.`,
      deleted_id: id,
    });
  } catch (err: any) {
    console.error("DELETE Exam Error:", err);
    return NextResponse.json({ error: err.message || "Failed to delete exam" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth("MANAGER");
    const { id } = await params;
    const body = await request.json();
    const { is_published, school_final_track, title, time_limit_minutes, passing_percentage } = body;

    const db = await getDB();
    const existing = await db.prepare("SELECT * FROM exams WHERE id = ?").bind(id).first<any>();

    if (!existing) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    const updates: string[] = [];
    const bindings: any[] = [];

    if (is_published !== undefined) {
      updates.push("is_published = ?");
      bindings.push(is_published ? 1 : 0);
    }
    if (school_final_track !== undefined) {
      updates.push("school_final_track = ?");
      bindings.push(school_final_track || null);
    }
    if (title) {
      updates.push("title = ?");
      bindings.push(title.trim());
    }
    if (time_limit_minutes) {
      updates.push("time_limit_minutes = ?");
      bindings.push(parseInt(time_limit_minutes, 10));
    }
    if (passing_percentage) {
      updates.push("passing_percentage = ?");
      bindings.push(parseInt(passing_percentage, 10));
    }

    if (updates.length > 0) {
      bindings.push(id);
      await db.prepare(`UPDATE exams SET ${updates.join(", ")} WHERE id = ?`).bind(...bindings).run();
    }

    return NextResponse.json({
      success: true,
      message: "Exam updated successfully.",
      updated_id: id,
    });
  } catch (err: any) {
    console.error("PATCH Exam Error:", err);
    return NextResponse.json({ error: err.message || "Failed to update exam" }, { status: 500 });
  }
}
