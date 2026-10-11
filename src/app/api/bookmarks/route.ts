import { NextResponse } from "next/server";
import { getDB, generateId } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireAuth();
    const db = await getDB();

    const { results } = await db
      .prepare(
        `SELECT b.id, b.item_type, b.item_id, b.created_at,
                m.title as material_title, m.material_type, m.aircraft as material_aircraft,
                e.title as exam_title, e.aircraft as exam_aircraft,
                p.title as post_title
         FROM bookmarks b
         LEFT JOIN materials m ON b.item_type = 'material' AND b.item_id = m.id
         LEFT JOIN exams e ON b.item_type = 'exam' AND b.item_id = e.id
         LEFT JOIN posts p ON b.item_type = 'post' AND b.item_id = p.id
         WHERE b.user_id = ?
         ORDER BY b.created_at DESC`
      )
      .bind(user.id)
      .all<any>();

    return NextResponse.json({ success: true, library: results });
  } catch (err: any) {
    console.error("GET Bookmarks Error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch library" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { item_type, item_id } = body;

    if (!item_type || !item_id) {
      return NextResponse.json({ error: "Missing item_type or item_id" }, { status: 400 });
    }

    const db = await getDB();

    // Check if already bookmarked
    const existing = await db
      .prepare("SELECT id FROM bookmarks WHERE user_id = ? AND item_type = ? AND item_id = ?")
      .bind(user.id, item_type, item_id)
      .first<any>();

    if (existing) {
      await db.prepare("DELETE FROM bookmarks WHERE id = ?").bind(existing.id).run();
      return NextResponse.json({ success: true, bookmarked: false, message: "Removed from library" });
    } else {
      const bookmarkId = generateId("bm");
      await db
        .prepare("INSERT INTO bookmarks (id, user_id, item_type, item_id) VALUES (?, ?, ?, ?)")
        .bind(bookmarkId, user.id, item_type, item_id)
        .run();
      return NextResponse.json({ success: true, bookmarked: true, message: "Saved to My Library" });
    }
  } catch (err: any) {
    console.error("POST Bookmark Error:", err);
    return NextResponse.json({ error: err.message || "Failed to save bookmark" }, { status: 500 });
  }
}
