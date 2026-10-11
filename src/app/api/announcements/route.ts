import { NextResponse } from "next/server";
import { getDB, generateId } from "@/lib/db";
import { requireAuth, requireRole, getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const db = await getDB();
    const { results } = await db
      .prepare(
        `SELECT a.*, u.full_name as author_name
         FROM announcements a
         JOIN users u ON a.author_id = u.id
         WHERE a.expires_at IS NULL OR a.expires_at > CURRENT_TIMESTAMP
         ORDER BY a.is_pinned DESC, a.created_at DESC`
      )
      .all<any>();

    return NextResponse.json({ success: true, announcements: results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch announcements" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireRole(["ADMIN", "MANAGER"]);
    const body = await request.json();
    const { title, content, target_type = "all", target_value, is_pinned = false, expires_at } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required." }, { status: 400 });
    }

    const db = await getDB();
    const annId = generateId("ann");

    await db
      .prepare(
        `INSERT INTO announcements (id, title, content, author_id, target_type, target_value, is_pinned, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(annId, title, content, admin.id, target_type, target_value || null, is_pinned ? 1 : 0, expires_at || null)
      .run();

    return NextResponse.json({
      success: true,
      announcement_id: annId,
      message: "Announcement broadcasted successfully.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create announcement" }, { status: 500 });
  }
}
