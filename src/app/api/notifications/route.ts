import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { getUserNotifications } from "@/lib/notifications";

export async function GET() {
  try {
    const user = await requireAuth();
    const notifications = await getUserNotifications(user.id);
    return NextResponse.json({ success: true, notifications });
  } catch (err: any) {
    console.error("GET Notifications Error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { notification_id } = body;

    const db = await getDB();
    if (notification_id) {
      await db
        .prepare("UPDATE user_notifications SET is_read = 1 WHERE notification_id = ? AND user_id = ?")
        .bind(notification_id, user.id)
        .run();
    } else {
      // Mark all as read
      await db
        .prepare("UPDATE user_notifications SET is_read = 1 WHERE user_id = ?")
        .bind(user.id)
        .run();
    }

    return NextResponse.json({ success: true, message: "Notifications updated" });
  } catch (err: any) {
    console.error("POST Notification Read Error:", err);
    return NextResponse.json({ error: err.message || "Failed to update notification" }, { status: 500 });
  }
}
