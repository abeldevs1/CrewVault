import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireAuth();
    const db = await getDB();

    // 1. Recently Uploaded Materials
    const { results: recentMaterials } = await db
      .prepare(
        `SELECT m.id, m.title, m.material_type, m.subject, m.aircraft, m.views_count, m.created_at,
                u.full_name as uploader_name
         FROM materials m
         JOIN users u ON m.uploader_id = u.id
         WHERE m.status = 'approved'
         ORDER BY m.created_at DESC
         LIMIT 6`
      )
      .all<any>();

    // 2. Available Exams
    const { results: availableExams } = await db
      .prepare(
        `SELECT e.id, e.title, e.aircraft, e.subject, e.total_questions, e.time_limit_minutes, e.passing_percentage, e.is_official
         FROM exams e
         ORDER BY e.is_official DESC, e.created_at DESC
         LIMIT 6`
      )
      .all<any>();

    // 3. User Weak Areas calculation from user_question_stats
    const { results: userStats } = await db
      .prepare(
        `SELECT topic, subject, total_attempted, correct_count 
         FROM user_question_stats 
         WHERE user_id = ? AND total_attempted >= 3`
      )
      .bind(user.id)
      .all<any>();

    const weakTopics = userStats
      .filter((s) => s.correct_count / s.total_attempted < 0.75)
      .map((s) => s.topic);

    return NextResponse.json({
      success: true,
      recommendations: {
        user_aircraft: user.aircraft_studied || ["Q400"],
        recently_uploaded: recentMaterials,
        available_exams: availableExams,
        weak_topics: weakTopics.length > 0 ? weakTopics : ["Emergency Equipment"],
        recommended_exam: weakTopics.length > 0
          ? `15-Question Targeted Practice Test: ${weakTopics[0]}`
          : "Standard Q400 Aircraft Specific Practice Exam",
      },
    });
  } catch (err: any) {
    console.error("GET For You Error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch recommendations" }, { status: 500 });
  }
}
