import { NextResponse } from "next/server";
import { getDB, generateId } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAuth("ADMIN");
    const { id: sessionId } = await params;
    const db = await getDB();

    await db.prepare("DELETE FROM sessions WHERE id = ?").bind(sessionId).run();

    try {
      const logId = generateId("log");
      await db
        .prepare(
          `INSERT INTO audit_logs (id, actor_id, action, target_type, target_id)
           VALUES (?, ?, 'TERMINATE_SESSION', 'SESSION', ?)`
        )
        .bind(logId, admin.id, sessionId)
        .run();
    } catch (_) {}

    return NextResponse.json({ success: true, message: "Session revoked." });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to terminate session" },
      { status: 500 }
    );
  }
}
