import { NextResponse } from "next/server";
import { getDB, generateId } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const user = await requireAuth();
    const { conversationId } = await params;
    const db = await getDB();

    // Verify user belongs to conversation
    const conv = await db
      .prepare(`SELECT * FROM conversations WHERE id = ? AND (user_1_id = ? OR user_2_id = ?)`)
      .bind(conversationId, user.id, user.id)
      .first<any>();

    if (!conv) {
      return NextResponse.json({ error: "Conversation not found or access denied." }, { status: 403 });
    }

    const { results } = await db
      .prepare(
        `SELECT dm.*, u.full_name as sender_name
         FROM direct_messages dm
         JOIN users u ON dm.sender_id = u.id
         WHERE dm.conversation_id = ?
         ORDER BY dm.created_at ASC`
      )
      .bind(conversationId)
      .all<any>();

    // Mark unread messages as read
    await db
      .prepare(`UPDATE direct_messages SET is_read = 1 WHERE conversation_id = ? AND recipient_id = ?`)
      .bind(conversationId, user.id)
      .run();

    return NextResponse.json({ success: true, messages: results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch conversation" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const user = await requireAuth();
    const { conversationId } = await params;
    const db = await getDB();

    const conv = await db
      .prepare(`SELECT * FROM conversations WHERE id = ? AND (user_1_id = ? OR user_2_id = ?)`)
      .bind(conversationId, user.id, user.id)
      .first<any>();

    if (!conv) {
      return NextResponse.json({ error: "Conversation not found or access denied." }, { status: 403 });
    }

    const body = await request.json();
    const content = body.content?.trim();

    if (!content) {
      return NextResponse.json({ error: "Message content cannot be empty." }, { status: 400 });
    }

    const recipientId = conv.user_1_id === user.id ? conv.user_2_id : conv.user_1_id;
    const now = new Date().toISOString();
    const msgId = generateId("msg");

    await db
      .prepare(
        `INSERT INTO direct_messages (id, conversation_id, sender_id, recipient_id, content, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(msgId, conversationId, user.id, recipientId, content, now)
      .run();

    await db
      .prepare(`UPDATE conversations SET last_message_at = ? WHERE id = ?`)
      .bind(now, conversationId)
      .run();

    return NextResponse.json({
      success: true,
      message: {
        id: msgId,
        conversation_id: conversationId,
        sender_id: user.id,
        recipient_id: recipientId,
        content,
        created_at: now,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to send message" }, { status: 500 });
  }
}
