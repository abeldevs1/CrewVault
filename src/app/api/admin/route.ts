import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireAuth("ADMIN");
    const db = await getDB();

    const totalUsers = await db.prepare("SELECT COUNT(*) as count FROM users").first<any>();
    const totalMaterials = await db.prepare("SELECT COUNT(*) as count FROM materials").first<any>();
    const totalExams = await db.prepare("SELECT COUNT(*) as count FROM exams").first<any>();
    const totalQuestions = await db.prepare("SELECT COUNT(*) as count FROM questions").first<any>();
    const pendingModeration = await db.prepare("SELECT COUNT(*) as count FROM materials WHERE status = 'pending'").first<any>();
    const pendingQuestions = await db.prepare("SELECT COUNT(*) as count FROM questions WHERE status = 'pending_review'").first<any>();

    const totalBytesRow = await db.prepare("SELECT SUM(size_bytes) as total FROM material_versions").first<any>();
    const totalBytes = totalBytesRow?.total || 0;

    // Recent Audit Logs
    const { results: auditLogs } = await db
      .prepare(
        `SELECT a.id, a.action, a.target_type, a.target_id, a.created_at, u.full_name as actor_name
         FROM audit_logs a
         LEFT JOIN users u ON a.actor_id = u.id
         ORDER BY a.created_at DESC
         LIMIT 20`
      )
      .all<any>();

    // Users list
    const { results: usersList } = await db
      .prepare("SELECT id, email, full_name, role, airline, is_suspended, created_at FROM users ORDER BY created_at DESC LIMIT 50")
      .all<any>();

    // Exams list
    const { results: examsList } = await db
      .prepare(
        `SELECT e.id, e.title, e.description, e.aircraft, e.subject, e.difficulty,
                e.total_questions, e.time_limit_minutes, e.passing_percentage,
                e.is_official, e.is_published, e.school_final_track, e.created_at,
                u.full_name as creator_name,
                (SELECT COUNT(*) FROM exam_questions eq WHERE eq.exam_id = e.id) as question_count
         FROM exams e
         JOIN users u ON e.created_by = u.id
         ORDER BY e.created_at DESC`
      )
      .all<any>();

    // Active Logged-in Sessions
    const { results: activeSessions } = await db
      .prepare(
        `SELECT s.id as session_id, s.user_id, s.created_at as logged_in_at, s.expires_at,
                u.full_name, u.email, u.role, u.airline
         FROM sessions s
         JOIN users u ON s.user_id = u.id
         WHERE s.expires_at > CURRENT_TIMESTAMP
         ORDER BY s.created_at DESC
         LIMIT 50`
      )
      .all<any>();

    return NextResponse.json({
      success: true,
      stats: {
        total_users: totalUsers?.count || 0,
        active_sessions_count: activeSessions?.length || 0,
        total_materials: totalMaterials?.count || 0,
        total_exams: totalExams?.count || 0,
        total_questions: totalQuestions?.count || 0,
        pending_moderation: pendingModeration?.count || 0,
        pending_questions: pendingQuestions?.count || 0,
        storage_used_bytes: totalBytes,
        storage_limit_bytes: 10 * 1024 * 1024 * 1024, // 10 GB limit
      },
      audit_logs: auditLogs,
      active_sessions: activeSessions,
      users: usersList,
      exams: examsList,
    });
  } catch (err: any) {
    console.error("GET Admin Stats Error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch admin stats" }, { status: 500 });
  }
}
