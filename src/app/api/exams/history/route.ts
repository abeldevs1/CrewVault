import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireAuth();
    const db = await getDB();

    const { results } = await db
      .prepare(
        `SELECT es.*, e.title as exam_title, e.aircraft as exam_aircraft, e.subject as exam_subject
         FROM exam_sessions es
         LEFT JOIN exams e ON es.exam_id = e.id
         WHERE es.user_id = ?
         ORDER BY es.start_time DESC
         LIMIT 20`
      )
      .bind(user.id)
      .all<any>();

    return NextResponse.json({ success: true, sessions: results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Unauthorized" }, { status: 401 });
  }
}
