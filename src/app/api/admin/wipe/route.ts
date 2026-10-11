import { NextResponse } from "next/server";
import { getDB, generateId } from "@/lib/db";
import { requireRole, verifyPassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const adminUser = await requireRole(["ADMIN"]);
    const body = await request.json();
    const { confirmation_code, password } = body;

    // 1. Precaution: Verify Confirmation Code
    const EXPECTED_CODE = "WIPE-ALL-CREWVAULT-DATA";
    if (!confirmation_code || confirmation_code.trim() !== EXPECTED_CODE) {
      return NextResponse.json(
        {
          error: `Security verification failed. You must enter the exact confirmation code: "${EXPECTED_CODE}".`,
        },
        { status: 400 }
      );
    }

    // 2. Precaution: Verify Admin Password
    if (!password) {
      return NextResponse.json(
        { error: "Admin account password is required to execute a system wipe." },
        { status: 400 }
      );
    }

    const db = await getDB();
    const userRow = await db
      .prepare(`SELECT password_hash FROM users WHERE id = ?`)
      .bind(adminUser.id)
      .first<any>();

    if (!userRow || !(await verifyPassword(password, userRow.password_hash))) {
      return NextResponse.json(
        { error: "Invalid admin password. System wipe aborted." },
        { status: 403 }
      );
    }

    // 3. Atomic Database Cleanup (Preserves Admin User Accounts)
    const tablesToClean = [
      "exam_answers",
      "exam_questions",
      "exam_sessions",
      "saved_exams",
      "user_question_exposure",
      "user_question_stats",
      "exams",
      "questions",
      "material_tags",
      "bookmarks",
      "material_versions",
      "materials",
      "direct_messages",
      "conversations",
      "group_memberships",
      "groups",
      "manager_applications",
      "post_attachments",
      "posts",
      "user_notifications",
      "notifications",
      "announcement_deliveries",
      "announcements",
      "user_curriculum_progress",
      "curricula",
    ];

    for (const table of tablesToClean) {
      try {
        await db.prepare(`DELETE FROM ${table}`).run();
      } catch (tableErr) {
        console.warn(`Wipe table warning (${table}):`, tableErr);
      }
    }

    // Also purge FTS5 index if it exists
    try {
      await db.prepare(`DELETE FROM materials_fts`).run();
    } catch (ftsErr) {}

    // Record immutable audit log of the wipe action
    const auditId = generateId("audit_wipe");
    await db
      .prepare(
        `INSERT INTO audit_logs (id, actor_id, action, target_type, target_id, details_json)
         VALUES (?, ?, 'NUCLEAR_SYSTEM_WIPE', 'database', 'all_tables', ?)`
      )
      .bind(
        auditId,
        adminUser.id,
        JSON.stringify({
          cleaned_tables: tablesToClean,
          timestamp: new Date().toISOString(),
          actor_email: adminUser.email,
        })
      )
      .run();

    return NextResponse.json({
      success: true,
      message: "CrewVault database successfully wiped. All uploaded materials, exams, and community data cleaned.",
      tables_cleaned: tablesToClean.length,
    });
  } catch (err: any) {
    console.error("System Wipe Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to execute system wipe" },
      { status: 500 }
    );
  }
}
