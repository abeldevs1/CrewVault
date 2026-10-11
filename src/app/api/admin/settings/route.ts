import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export async function GET() {
  try {
    const db = await getDB();
    const { results } = await db
      .prepare(`SELECT key, value, updated_at FROM system_settings`)
      .all<any>();

    const settingsMap: Record<string, string> = {};
    (results || []).forEach((row) => {
      settingsMap[row.key] = row.value;
    });

    return NextResponse.json({ success: true, settings: settingsMap });
  } catch (err: any) {
    console.error("GET Settings Error:", err);
    return NextResponse.json({ error: err.message || "Failed to load settings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole(["ADMIN"]);
    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: "Key and value are required" }, { status: 400 });
    }

    const db = await getDB();
    await db
      .prepare(
        `INSERT INTO system_settings (key, value, updated_at) 
         VALUES (?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`
      )
      .bind(key, String(value))
      .run();

    // Log the setting modification in audit_logs
    try {
      const { generateId } = await import("@/lib/db");
      await db
        .prepare(
          `INSERT INTO audit_logs (id, actor_id, action, target_type, target_id, details_json)
           VALUES (?, ?, 'UPDATE_SETTING', 'system_setting', ?, ?)`
        )
        .bind(generateId("audit"), user.id, key, JSON.stringify({ key, value }))
        .run();
    } catch (e) {}

    return NextResponse.json({
      success: true,
      message: `Setting "${key}" updated to "${value}"`,
      key,
      value: String(value),
    });
  } catch (err: any) {
    console.error("POST Settings Error:", err);
    return NextResponse.json({ error: err.message || "Failed to update setting" }, { status: 500 });
  }
}
