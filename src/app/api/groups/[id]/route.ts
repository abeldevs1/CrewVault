import { NextResponse } from "next/server";
import { getDB, generateId } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: groupId } = await params;
    const db = await getDB();
    const isAdmin = user.role === "ADMIN";

    // Fetch group details
    const group = await db
      .prepare(
        `SELECT g.*, u.full_name as creator_name
         FROM groups g
         JOIN users u ON g.created_by = u.id
         WHERE g.id = ?`
      )
      .bind(groupId)
      .first<any>();

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Check membership
    const membership = await db
      .prepare(`SELECT * FROM group_memberships WHERE group_id = ? AND user_id = ?`)
      .bind(groupId, user.id)
      .first<any>();

    const isMember = Boolean(membership);

    // Access control:
    // Admin has superuser entry into ANY group.
    // Otherwise, if private, user must be a member.
    if (group.is_private && !isMember && !isAdmin && group.created_by !== user.id) {
      return NextResponse.json(
        { error: "This is a private group. You need an invite or admin privilege to view it." },
        { status: 403 }
      );
    }

    // Fetch members
    const { results: members } = await db
      .prepare(
        `SELECT gm.id as membership_id, gm.role, gm.joined_at,
                u.id as user_id, u.full_name, u.email, u.airline, u.role as platform_role
         FROM group_memberships gm
         JOIN users u ON gm.user_id = u.id
         WHERE gm.group_id = ?
         ORDER BY gm.joined_at ASC`
      )
      .bind(groupId)
      .all<any>();

    // Fetch discussion messages
    const { results: messages } = await db
      .prepare(
        `SELECT m.id, m.content, m.created_at, m.sender_id,
                u.full_name as sender_name, u.role as sender_platform_role, u.airline as sender_airline
         FROM group_messages m
         JOIN users u ON m.sender_id = u.id
         WHERE m.group_id = ?
         ORDER BY m.created_at ASC`
      )
      .bind(groupId)
      .all<any>();

    return NextResponse.json({
      success: true,
      group,
      members,
      messages,
      is_member: isMember,
      user_role: membership?.role || (isAdmin ? "admin_supervisor" : null),
      is_admin_bypass: isAdmin && !isMember,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch group details" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: groupId } = await params;
    const db = await getDB();
    const isAdmin = user.role === "ADMIN";

    const group = await db
      .prepare(`SELECT * FROM groups WHERE id = ?`)
      .bind(groupId)
      .first<any>();

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const membership = await db
      .prepare(`SELECT * FROM group_memberships WHERE group_id = ? AND user_id = ?`)
      .bind(groupId, user.id)
      .first<any>();

    const body = await request.json();
    const action = body.action || "message";

    if (action === "join") {
      if (membership) {
        return NextResponse.json({ error: "Already a member of this group." }, { status: 400 });
      }

      if (group.is_private && !isAdmin) {
        return NextResponse.json(
          { error: "Cannot join private group without an invitation." },
          { status: 403 }
        );
      }

      await db
        .prepare(
          `INSERT INTO group_memberships (id, group_id, user_id, role)
           VALUES (?, ?, ?, 'member')`
        )
        .bind(generateId("gm"), groupId, user.id)
        .run();

      return NextResponse.json({ success: true, message: "Joined group successfully." });
    }

    if (action === "leave") {
      if (!membership) {
        return NextResponse.json({ error: "Not a member of this group." }, { status: 400 });
      }

      await db
        .prepare(`DELETE FROM group_memberships WHERE group_id = ? AND user_id = ?`)
        .bind(groupId, user.id)
        .run();

      return NextResponse.json({ success: true, message: "Left group successfully." });
    }

    if (action === "message") {
      const content = body.content?.trim();
      if (!content) {
        return NextResponse.json({ error: "Message content cannot be empty." }, { status: 400 });
      }

      // Must be a member or an Admin with bypass entry
      if (!membership && !isAdmin) {
        return NextResponse.json(
          { error: "You must join this group before sending messages." },
          { status: 403 }
        );
      }

      const msgId = generateId("gmsg");
      const now = new Date().toISOString();

      await db
        .prepare(
          `INSERT INTO group_messages (id, group_id, sender_id, content, created_at)
           VALUES (?, ?, ?, ?, ?)`
        )
        .bind(msgId, groupId, user.id, content, now)
        .run();

      return NextResponse.json({
        success: true,
        message: {
          id: msgId,
          group_id: groupId,
          sender_id: user.id,
          sender_name: user.full_name,
          sender_platform_role: user.role,
          content,
          created_at: now,
        },
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to process group request" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: groupId } = await params;
    const db = await getDB();
    const isAdmin = user.role === "ADMIN";

    const group = await db
      .prepare(`SELECT * FROM groups WHERE id = ?`)
      .bind(groupId)
      .first<any>();

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    if (!isAdmin && group.created_by !== user.id) {
      return NextResponse.json(
        { error: "Only the group creator or an Administrator can delete this group." },
        { status: 403 }
      );
    }

    await db.prepare(`DELETE FROM groups WHERE id = ?`).bind(groupId).run();

    return NextResponse.json({ success: true, message: "Group deleted successfully." });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to delete group" },
      { status: 500 }
    );
  }
}
