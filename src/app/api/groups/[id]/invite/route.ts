import { NextResponse } from "next/server";
import { getDB, generateId } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const inviter = await requireAuth();
    const { id: groupId } = await params;
    const db = await getDB();
    const isAdmin = inviter.role === "ADMIN";

    const group = await db
      .prepare(`SELECT * FROM groups WHERE id = ?`)
      .bind(groupId)
      .first<any>();

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Must be member or admin to invite
    const membership = await db
      .prepare(`SELECT * FROM group_memberships WHERE group_id = ? AND user_id = ?`)
      .bind(groupId, inviter.id)
      .first<any>();

    if (!membership && !isAdmin) {
      return NextResponse.json(
        { error: "You must be a member or admin to invite others to this group." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { user_id, email } = body;

    if (!user_id && !email) {
      return NextResponse.json(
        { error: "Provide either a user ID or email address to invite." },
        { status: 400 }
      );
    }

    let targetUser: any = null;
    if (user_id) {
      targetUser = await db
        .prepare(`SELECT id, full_name, email FROM users WHERE id = ?`)
        .bind(user_id)
        .first<any>();
    } else if (email) {
      targetUser = await db
        .prepare(`SELECT id, full_name, email FROM users WHERE LOWER(email) = LOWER(?)`)
        .bind(email.trim())
        .first<any>();
    }

    if (!targetUser) {
      return NextResponse.json(
        { error: "No user found with the provided details." },
        { status: 404 }
      );
    }

    // Check if already a member
    const existingMember = await db
      .prepare(`SELECT * FROM group_memberships WHERE group_id = ? AND user_id = ?`)
      .bind(groupId, targetUser.id)
      .first<any>();

    if (existingMember) {
      return NextResponse.json(
        { error: `${targetUser.full_name} is already a member of this group.` },
        { status: 400 }
      );
    }

    // Add to group_memberships
    const membershipId = generateId("gm");
    await db
      .prepare(
        `INSERT INTO group_memberships (id, group_id, user_id, role)
         VALUES (?, ?, ?, 'member')`
      )
      .bind(membershipId, groupId, targetUser.id)
      .run();

    // Create notification for the invited user
    try {
      const notifId = generateId("notif");
      await db
        .prepare(
          `INSERT INTO notifications (id, user_id, type, title, message, link)
           VALUES (?, ?, 'group_invite', ?, ?, ?)`
        )
        .bind(
          notifId,
          targetUser.id,
          "Group Invitation",
          `${inviter.full_name} added you to the study group "${group.name}".`,
          `/discussions?group=${group.id}`
        )
        .run();
    } catch (e) {
      console.warn("Could not insert notification:", e);
    }

    return NextResponse.json({
      success: true,
      message: `${targetUser.full_name} was successfully invited and added to the group!`,
      user: {
        id: targetUser.id,
        full_name: targetUser.full_name,
        email: targetUser.email,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to invite trainee to group" },
      { status: 500 }
    );
  }
}
