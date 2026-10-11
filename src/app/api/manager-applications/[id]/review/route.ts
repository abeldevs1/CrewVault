import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireRole(["ADMIN"]);
    const { id } = await params;
    const body = await request.json();
    const { action, review_notes } = body; // action: 'approve' | 'reject'

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action. Must be approve or reject." }, { status: 400 });
    }

    const db = await getDB();
    const app = await db
      .prepare(`SELECT * FROM manager_applications WHERE id = ?`)
      .bind(id)
      .first<any>();

    if (!app) {
      return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }

    if (app.user_id === admin.id) {
      return NextResponse.json({ error: "You cannot approve your own application." }, { status: 400 });
    }

    const newStatus = action === "approve" ? "approved" : "rejected";
    const now = new Date().toISOString();

    await db
      .prepare(
        `UPDATE manager_applications 
         SET status = ?, reviewer_id = ?, review_notes = ?, reviewed_at = ?, updated_at = ?
         WHERE id = ?`
      )
      .bind(newStatus, admin.id, review_notes || null, now, now, id)
      .run();

    if (action === "approve") {
      await db
        .prepare(`UPDATE users SET role = 'MANAGER', updated_at = ? WHERE id = ?`)
        .bind(now, app.user_id)
        .run();
    }

    // Insert Audit Log
    await db
      .prepare(
        `INSERT INTO audit_logs (id, actor_id, action, target_type, target_id, details_json)
         VALUES (?, ?, ?, 'manager_application', ?, ?)`
      )
      .bind(
        `audit_${Date.now()}`,
        admin.id,
        `MANAGER_APP_${action.toUpperCase()}`,
        id,
        JSON.stringify({ applicant_id: app.user_id, status: newStatus, notes: review_notes })
      )
      .run();

    return NextResponse.json({
      success: true,
      message: `Application ${newStatus} successfully.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to process review" }, { status: 500 });
  }
}
