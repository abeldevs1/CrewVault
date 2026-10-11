import { NextResponse } from "next/server";
import { getDB, generateId } from "@/lib/db";
import { getCurrentUser, requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const db = await getDB();
    const isAdmin = user?.role === "ADMIN";
    const currentUserId = user?.id || "";

    // If Admin, they have full access to all groups (public and private).
    // Regular users can see public groups, groups they created, or groups they are a member of.
    let sql: string;
    let params: any[];

    if (isAdmin) {
      sql = `
        SELECT g.*, u.full_name as creator_name,
               (SELECT COUNT(*) FROM group_memberships gm WHERE gm.group_id = g.id) as member_count,
               (SELECT gm2.role FROM group_memberships gm2 WHERE gm2.group_id = g.id AND gm2.user_id = ?) as user_role,
               (SELECT 1 FROM group_memberships gm3 WHERE gm3.group_id = g.id AND gm3.user_id = ?) as is_member
        FROM groups g
        JOIN users u ON g.created_by = u.id
        ORDER BY g.created_at DESC
      `;
      params = [currentUserId, currentUserId];
    } else {
      sql = `
        SELECT g.*, u.full_name as creator_name,
               (SELECT COUNT(*) FROM group_memberships gm WHERE gm.group_id = g.id) as member_count,
               (SELECT gm2.role FROM group_memberships gm2 WHERE gm2.group_id = g.id AND gm2.user_id = ?) as user_role,
               (SELECT 1 FROM group_memberships gm3 WHERE gm3.group_id = g.id AND gm3.user_id = ?) as is_member
        FROM groups g
        JOIN users u ON g.created_by = u.id
        WHERE g.is_private = 0 
           OR g.created_by = ? 
           OR EXISTS (SELECT 1 FROM group_memberships gm WHERE gm.group_id = g.id AND gm.user_id = ?)
        ORDER BY g.created_at DESC
      `;
      params = [currentUserId, currentUserId, currentUserId, currentUserId];
    }

    const { results } = await db.prepare(sql).bind(...params).all<any>();

    const groups = (results || []).map((g) => ({
      ...g,
      is_member: Boolean(g.is_member) || (isAdmin && !g.is_member ? false : Boolean(g.is_member)),
      admin_bypass: isAdmin,
    }));

    return NextResponse.json({ success: true, groups });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch groups" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { name, description, course, aircraft, airline, is_private = false } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Group name is required." }, { status: 400 });
    }

    const db = await getDB();
    const groupId = generateId("grp");

    await db
      .prepare(
        `INSERT INTO groups (id, name, description, course, aircraft, airline, is_private, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        groupId,
        name.trim(),
        description?.trim() || null,
        course?.trim() || null,
        aircraft?.trim() || null,
        airline?.trim() || null,
        is_private ? 1 : 0,
        user.id
      )
      .run();

    // Automatically add creator as group owner
    await db
      .prepare(
        `INSERT INTO group_memberships (id, group_id, user_id, role)
         VALUES (?, ?, ?, 'owner')`
      )
      .bind(generateId("gm"), groupId, user.id)
      .run();

    return NextResponse.json({
      success: true,
      group_id: groupId,
      message: "Group created successfully.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create group" }, { status: 500 });
  }
}
