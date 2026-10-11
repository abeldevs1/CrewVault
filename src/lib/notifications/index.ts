import { getDB, generateId } from "@/lib/db";
import { Notification } from "@/types";

export interface CreateNotificationInput {
  target_type: 'all' | 'aircraft' | 'airline' | 'course' | 'subject' | 'user';
  target_value?: string;
  title: string;
  message: string;
  category: 'material' | 'exam' | 'announcement' | 'approval' | 'result' | 'recommendation' | 'system';
  link?: string;
}

export async function sendTargetedNotification(input: CreateNotificationInput): Promise<string> {
  const db = await getDB();
  const notificationId = generateId("notif");

  // Insert master notification record
  await db
    .prepare(
      `INSERT INTO notifications (id, target_type, target_value, title, message, category, link)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      notificationId,
      input.target_type,
      input.target_value || null,
      input.title,
      input.message,
      input.category,
      input.link || null
    )
    .run();

  // Find recipient user IDs matching targeting rules & preferences
  let query = "SELECT u.id, np.notify_new_exams, np.notify_new_materials, np.notify_announcements, np.notify_recommended, np.notify_results FROM users u LEFT JOIN notification_preferences np ON u.id = np.user_id WHERE u.is_suspended = 0";
  const bindings: any[] = [];

  if (input.target_type === "user" && input.target_value) {
    query += " AND u.id = ?";
    bindings.push(input.target_value);
  } else if (input.target_type === "aircraft" && input.target_value) {
    query += " AND u.aircraft_studied LIKE ?";
    bindings.push(`%${input.target_value}%`);
  } else if (input.target_type === "airline" && input.target_value) {
    query += " AND u.airline = ?";
    bindings.push(input.target_value);
  }

  const { results: users } = await db.prepare(query).bind(...bindings).all<any>();

  // Filter based on user preferences
  const statements = [];
  for (const user of users) {
    let allowed = true;

    if (input.category === "exam" && user.notify_new_exams === 0) allowed = false;
    if (input.category === "material" && user.notify_new_materials === 0) allowed = false;
    if (input.category === "announcement" && user.notify_announcements === 0) allowed = false;
    if (input.category === "recommendation" && user.notify_recommended === 0) allowed = false;
    if (input.category === "result" && user.notify_results === 0) allowed = false;

    if (allowed) {
      const userNotifId = generateId("unotif");
      statements.push(
        db
          .prepare("INSERT OR IGNORE INTO user_notifications (id, notification_id, user_id) VALUES (?, ?, ?)")
          .bind(userNotifId, notificationId, user.id)
      );
    }
  }

  if (statements.length > 0) {
    await db.batch(statements);
  }

  return notificationId;
}

export async function getUserNotifications(userId: string): Promise<Notification[]> {
  const db = await getDB();
  const { results } = await db
    .prepare(
      `SELECT n.id, n.target_type, n.target_value, n.title, n.message, n.category, n.link, 
              un.is_read, un.created_at
       FROM user_notifications un
       JOIN notifications n ON un.notification_id = n.id
       WHERE un.user_id = ?
       ORDER BY un.created_at DESC
       LIMIT 50`
    )
    .bind(userId)
    .all<any>();

  return results.map(row => ({
    id: row.id,
    target_type: row.target_type,
    target_value: row.target_value,
    title: row.title,
    message: row.message,
    category: row.category,
    link: row.link,
    is_read: Boolean(row.is_read),
    created_at: row.created_at,
  }));
}
