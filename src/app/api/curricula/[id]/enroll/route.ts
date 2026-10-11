import { NextResponse } from "next/server";
import { getDB, generateId } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: curriculumId } = await params;
    const db = await getDB();

    // Verify curriculum exists
    const curriculum = await db
      .prepare(`SELECT id, title FROM curricula WHERE id = ? AND is_published = 1`)
      .bind(curriculumId)
      .first<any>();

    if (!curriculum) {
      return NextResponse.json({ error: "Curriculum not found" }, { status: 404 });
    }

    // Check if already enrolled
    const existing = await db
      .prepare(`SELECT id, status FROM user_curriculum_progress WHERE user_id = ? AND curriculum_id = ?`)
      .bind(user.id, curriculumId)
      .first<any>();

    if (existing) {
      return NextResponse.json({
        success: true,
        message: "Already enrolled in this curriculum track.",
        progress_id: existing.id,
        status: existing.status,
      });
    }

    const progressId = generateId("prog");
    await db
      .prepare(
        `INSERT INTO user_curriculum_progress 
         (id, user_id, curriculum_id, completed_material_ids_json, completed_quiz_ids_json, status)
         VALUES (?, ?, ?, '[]', '[]', 'enrolled')`
      )
      .bind(progressId, user.id, curriculumId)
      .run();

    return NextResponse.json({
      success: true,
      message: `Enrolled in "${curriculum.title}" successfully!`,
      progress_id: progressId,
      status: "enrolled",
    });
  } catch (err: any) {
    console.error("Enroll Curriculum Error:", err);
    return NextResponse.json({ error: err.message || "Failed to enroll" }, { status: 500 });
  }
}
