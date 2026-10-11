import { NextResponse } from "next/server";
import { getDB, generateId } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const admin = await requireRole(["ADMIN"]);
    const db = await getDB();
    const { results } = await db
      .prepare(
        `SELECT ma.*, u.full_name as applicant_name, u.email as applicant_email, u.role as current_role
         FROM manager_applications ma
         JOIN users u ON ma.user_id = u.id
         ORDER BY ma.created_at DESC`
      )
      .all<any>();

    return NextResponse.json({ success: true, applications: results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { reason, experience, requested_responsibilities, supporting_info } = body;

    if (!reason || !experience) {
      return NextResponse.json({ error: "Reason and experience are required." }, { status: 400 });
    }

    const db = await getDB();

    // Check existing pending application
    const existing = await db
      .prepare(`SELECT id FROM manager_applications WHERE user_id = ? AND status = 'pending'`)
      .bind(user.id)
      .first();

    if (existing) {
      return NextResponse.json(
        { error: "You already have a pending manager application." },
        { status: 400 }
      );
    }

    const appId = generateId("app");
    await db
      .prepare(
        `INSERT INTO manager_applications (id, user_id, reason, experience, requested_responsibilities, supporting_info, status)
         VALUES (?, ?, ?, ?, ?, ?, 'pending')`
      )
      .bind(appId, user.id, reason, experience, requested_responsibilities || null, supporting_info || null)
      .run();

    return NextResponse.json({
      success: true,
      application_id: appId,
      message: "Manager application submitted successfully.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to submit application" }, { status: 500 });
  }
}
