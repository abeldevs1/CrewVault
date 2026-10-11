import { NextResponse } from "next/server";
import { getDB, generateId } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const admin = await requireAuth("ADMIN");
    const body = await request.json();
    const { user_id, role } = body;

    if (!user_id || !role) {
      return NextResponse.json({ error: "user_id and role are required" }, { status: 400 });
    }

    const validRoles = ["MEMBER", "MANAGER", "ADMIN"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role '${role}'. Must be one of: ${validRoles.join(", ")}` },
        { status: 400 }
      );
    }

    const db = await getDB();

    const targetUser = await db
      .prepare("SELECT id, email, full_name, role FROM users WHERE id = ?")
      .bind(user_id)
      .first<any>();

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Safety check: Cannot demote oneself from ADMIN if only one admin exists
    if (targetUser.id === admin.id && role !== "ADMIN") {
      const adminCount = await db
        .prepare("SELECT COUNT(*) as count FROM users WHERE role = 'ADMIN'")
        .first<{ count: number }>();
      if (adminCount && adminCount.count <= 1) {
        return NextResponse.json(
          { error: "Cannot demote the only remaining Primary Administrator." },
          { status: 400 }
        );
      }
    }

    // Update user role
    await db
      .prepare("UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .bind(role, user_id)
      .run();

    // Audit log
    try {
      const logId = generateId("log");
      await db
        .prepare(
          `INSERT INTO audit_logs (id, actor_id, action, target_type, target_id)
           VALUES (?, ?, ?, 'USER', ?)`
        )
        .bind(
          logId,
          admin.id,
          `CHANGE_ROLE_TO_${role}`,
          targetUser.id
        )
        .run();
    } catch (e) {
      console.warn("Audit log error:", e);
    }

    return NextResponse.json({
      success: true,
      message: `User ${targetUser.full_name} successfully updated to ${role}.`,
      user: {
        id: targetUser.id,
        full_name: targetUser.full_name,
        email: targetUser.email,
        role,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update user role" },
      { status: 500 }
    );
  }
}
