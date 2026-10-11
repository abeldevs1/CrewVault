import { NextResponse } from "next/server";
import { getDB, generateId } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const db = await getDB();
    const { results } = await db
      .prepare(`SELECT * FROM saved_exams WHERE user_id = ? ORDER BY created_at DESC`)
      .bind(user.id)
      .all<any>();

    const formatted = results.map((se) => ({
      ...se,
      config: JSON.parse(se.config_json || "{}"),
    }));

    return NextResponse.json({ success: true, saved_exams: formatted });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { title, config } = body;

    if (!title || !config) {
      return NextResponse.json({ error: "Title and config parameters are required." }, { status: 400 });
    }

    const db = await getDB();
    const id = generateId("se");

    await db
      .prepare(`INSERT INTO saved_exams (id, user_id, title, config_json) VALUES (?, ?, ?, ?)`)
      .bind(id, user.id, title, JSON.stringify(config))
      .run();

    return NextResponse.json({
      success: true,
      saved_exam_id: id,
      message: "Exam configuration saved successfully.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to save exam config" }, { status: 500 });
  }
}
