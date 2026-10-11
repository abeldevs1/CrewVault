import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { getCurrentUser, requireAuth } from "@/lib/auth";
import { getR2Bucket } from "@/lib/storage";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDB();
    const currentUser = await getCurrentUser();

    // Fetch material metadata with current version
    const material = await db
      .prepare(
        `SELECT m.*, u.full_name as uploader_name, u.role as uploader_role,
                mv.id as version_id, mv.version_number, mv.filename, mv.mime_type, 
                mv.size_bytes, mv.extracted_markdown, mv.extracted_text, 
                mv.r2_key_original, mv.r2_key_markdown, mv.r2_key_text,
                mv.bundle_file_count, mv.bundle_files_meta_json
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

    // Authorization check for non-approved status
    if (material.status !== "approved") {
      if (!currentUser) {
        return NextResponse.json({ error: "Material not found" }, { status: 404 });
      }
      if (currentUser.role === "MEMBER" && currentUser.id !== material.uploader_id) {
        return NextResponse.json({ error: "Material is pending moderation review" }, { status: 403 });
      }
    }

    // Increment views count
    await db.prepare("UPDATE materials SET views_count = views_count + 1 WHERE id = ?").bind(id).run();

    // Fetch version history
    const { results: versions } = await db
      .prepare(
        `SELECT id, version_number, filename, mime_type, size_bytes, created_at 
         FROM material_versions 
         WHERE material_id = ? 
         ORDER BY version_number DESC`
      )
      .bind(id)
      .all<any>();

    // Fetch questions extracted from this material
    const { results: extractedQuestions } = await db
      .prepare(
        `SELECT id, question_text, options_json, correct_answer, explanation, difficulty, topic, status 
         FROM questions 
         WHERE source_material_id = ? 
         LIMIT 20`
      )
      .bind(id)
      .all<any>();

    const questionsFormatted = extractedQuestions.map((q) => ({
      ...q,
      options: JSON.parse(q.options_json || "[]"),
    }));

    return NextResponse.json({
      success: true,
      material: {
        ...material,
        versions,
        extracted_questions: questionsFormatted,
      },
    });
  } catch (err: any) {
    console.error("GET Material Detail Error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch material" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAuth();
    const db = await getDB();

    const material = await db.prepare("SELECT id, uploader_id FROM materials WHERE id = ?").bind(id).first<any>();
    if (!material) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    // RBAC: Only uploader or Manager/Admin can delete
    if (user.role === "MEMBER" && user.id !== material.uploader_id) {
      return NextResponse.json({ error: "Unauthorized to delete this material" }, { status: 403 });
    }

    // Fetch all associated material version R2 keys
    const { results: versions } = await db
      .prepare("SELECT r2_key_original, r2_key_markdown, r2_key_text FROM material_versions WHERE material_id = ?")
      .bind(id)
      .all<any>();

    // Clean up R2 objects
    try {
      const bucket = await getR2Bucket();
      for (const ver of versions) {
        if (ver.r2_key_original) await bucket.delete(ver.r2_key_original).catch(() => {});
        if (ver.r2_key_markdown) await bucket.delete(ver.r2_key_markdown).catch(() => {});
        if (ver.r2_key_text) await bucket.delete(ver.r2_key_text).catch(() => {});
      }
    } catch (e) {}

    // Cascade delete database records & FTS5 search index via triggers
    await db.prepare("DELETE FROM materials WHERE id = ?").bind(id).run();

    // Log audit record
    const auditId = `aud_${Date.now()}`;
    await db
      .prepare("INSERT INTO audit_logs (id, actor_id, action, target_type, target_id) VALUES (?, ?, ?, ?, ?)")
      .bind(auditId, user.id, "DELETE_MATERIAL", "material", id)
      .run();

    return NextResponse.json({ success: true, message: "Material deleted successfully" });
  } catch (err: any) {
    console.error("DELETE Material Error:", err);
    return NextResponse.json({ error: err.message || "Failed to delete material" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await requireAuth("MANAGER");
    const db = await getDB();
    const body = await request.json();
    const { is_published, school_final_category, title } = body;

    const updates: string[] = [];
    const bindings: any[] = [];

    if (is_published !== undefined) {
      updates.push("is_published = ?");
      bindings.push(is_published ? 1 : 0);
    }
    if (school_final_category !== undefined) {
      updates.push("school_final_category = ?");
      bindings.push(school_final_category || null);
    }
    if (title) {
      updates.push("title = ?");
      bindings.push(title.trim());
    }

    if (updates.length > 0) {
      bindings.push(id);
      await db.prepare(`UPDATE materials SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(...bindings).run();
    }

    return NextResponse.json({ success: true, message: "Material updated successfully" });
  } catch (err: any) {
    console.error("PATCH Material Error:", err);
    return NextResponse.json({ error: err.message || "Failed to update material" }, { status: 500 });
  }
}
