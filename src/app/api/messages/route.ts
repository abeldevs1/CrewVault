import { NextResponse } from "next/server";
import { getDB, generateId } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const db = await getDB();

    const { results } = await db
      .prepare(
        `SELECT c.id as conversation_id, c.last_message_at,
                CASE WHEN c.user_1_id = ? THEN c.user_2_id ELSE c.user_1_id END as peer_id,
                u.full_name as peer_name, u.role as peer_role, u.airline as peer_airline,
                (SELECT content FROM direct_messages dm WHERE dm.conversation_id = c.id ORDER BY dm.created_at DESC LIMIT 1) as last_message,
                (SELECT COUNT(*) FROM direct_messages dm WHERE dm.conversation_id = c.id AND dm.recipient_id = ? AND dm.is_read = 0) as unread_count
         FROM conversations c
         JOIN users u ON u.id = (CASE WHEN c.user_1_id = ? THEN c.user_2_id ELSE c.user_1_id END)
         WHERE c.user_1_id = ? OR c.user_2_id = ?
         ORDER BY c.last_message_at DESC`
      )
      .bind(user.id, user.id, user.id, user.id, user.id)
      .all<any>();

    return NextResponse.json({ success: true, conversations: results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const sender = await requireAuth();
    const body = await request.json();
    const { recipient_id, content } = body;

    if (!recipient_id || !content) {
      return NextResponse.json({ error: "Recipient and message content are required." }, { status: 400 });
    }

    if (recipient_id === sender.id) {
      return NextResponse.json({ error: "Cannot send private message to yourself." }, { status: 400 });
    }

    const db = await getDB();
    const now = new Date().toISOString();

    // Sort IDs deterministically for unique pair conversation lookup
    const [u1, u2] = [sender.id, recipient_id].sort();

    let conv = await db
      .prepare(`SELECT id FROM conversations WHERE user_1_id = ? AND user_2_id = ?`)
      .bind(u1, u2)
      .first<any>();

    let convId = conv?.id;
    if (!convId) {
      convId = generateId("conv");
      await db
        .prepare(`INSERT INTO conversations (id, user_1_id, user_2_id, last_message_at) VALUES (?, ?, ?, ?)`)
        .bind(convId, u1, u2, now)
        .run();
    } else {
      await db
        .prepare(`UPDATE conversations SET last_message_at = ? WHERE id = ?`)
        .bind(now, convId)
        .run();
    }

    const msgId = generateId("msg");
    await db
      .prepare(
        `INSERT INTO direct_messages (id, conversation_id, sender_id, recipient_id, content)
         VALUES (?, ?, ?, ?, ?)`
      )
      .bind(msgId, convId, sender.id, recipient_id, content)
      .run();

    return NextResponse.json({
      success: true,
      message_id: msgId,
      conversation_id: convId,
      sent_at: now,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to send message" }, { status: 500 });
  }
}
