import { NextResponse } from "next/server";
import { getDB, generateId } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { AIService } from "@/lib/ai/client";
import { sendTargetedNotification } from "@/lib/notifications";
import { FrozenQuestionSnapshot } from "@/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ session_id: string }> }
) {
  try {
    const { session_id } = await params;
    const user = await requireAuth();
    const db = await getDB();

    const session = await db
      .prepare(
        `SELECT s.*, e.title as exam_title, e.subject, e.aircraft
         FROM exam_sessions s
         LEFT JOIN exams e ON s.exam_id = e.id
         WHERE s.id = ? AND s.user_id = ?`
      )
      .bind(session_id, user.id)
      .first<any>();

    if (!session) {
      return NextResponse.json({ error: "Exam session not found" }, { status: 404 });
    }

    const questionSnapshots: FrozenQuestionSnapshot[] = JSON.parse(session.question_snapshots_json || "[]");

    // Fetch existing answers submitted for this session
    const { results: savedAnswers } = await db
      .prepare("SELECT question_id, selected_option, is_correct, time_spent_seconds FROM exam_answers WHERE session_id = ?")
      .bind(session_id)
      .all<any>();

    return NextResponse.json({
      success: true,
      session: {
        ...session,
        question_snapshots: questionSnapshots,
        saved_answers: savedAnswers,
        performance_analysis: session.performance_analysis_json ? JSON.parse(session.performance_analysis_json) : null,
      },
    });
  } catch (err: any) {
    console.error("GET Session Error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch session" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ session_id: string }> }
) {
  try {
    const { session_id } = await params;
    const user = await requireAuth();
    const body = await request.json();
    const { answers } = body; // Array of { question_id, selected_option, time_spent_seconds }

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: "Invalid answers payload" }, { status: 400 });
    }

    const db = await getDB();

    const session = await db
      .prepare("SELECT * FROM exam_sessions WHERE id = ? AND user_id = ?")
      .bind(session_id, user.id)
      .first<any>();

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const snapshots: FrozenQuestionSnapshot[] = JSON.parse(session.question_snapshots_json || "[]");

    let score = 0;
    const totalScore = snapshots.length;
    const answerRecords: any[] = [];

    // Evaluate answers against frozen snapshot
    for (const snap of snapshots) {
      const userAns = answers.find((a: any) => a.question_id === snap.question_id);
      const selectedOption = userAns ? userAns.selected_option : "";
      const isCorrect = selectedOption.trim() === snap.correct_answer.trim();

      if (isCorrect) score += 1;

      answerRecords.push({
        id: generateId("ans"),
        session_id,
        question_id: snap.question_id,
        selected_option: selectedOption,
        is_correct: isCorrect,
        topic: snap.topic || "General Aviation",
        time_spent_seconds: userAns ? userAns.time_spent_seconds || 0 : 0,
      });
    }

    const percentage = totalScore > 0 ? (score / totalScore) * 100 : 0;
    const passed = percentage >= session.passing_percentage;

    // Save individual answer records in DB batch
    const insertStmts = answerRecords.map((ans) =>
      db
        .prepare("INSERT INTO exam_answers (id, session_id, question_id, selected_option, is_correct, time_spent_seconds) VALUES (?, ?, ?, ?, ?, ?)")
        .bind(ans.id, ans.session_id, ans.question_id, ans.selected_option, ans.is_correct ? 1 : 0, ans.time_spent_seconds)
    );
    if (insertStmts.length > 0) {
      await db.batch(insertStmts);
    }

    // Update Adaptive User Question Stats per Topic
    for (const ans of answerRecords) {
      await db
        .prepare(
          `INSERT INTO user_question_stats (user_id, topic, subject, total_attempted, correct_count, last_updated)
           VALUES (?, ?, ?, 1, ?, CURRENT_TIMESTAMP)
           ON CONFLICT(user_id, topic, subject) DO UPDATE SET
           total_attempted = total_attempted + 1,
           correct_count = correct_count + ?,
           last_updated = CURRENT_TIMESTAMP`
        )
        .bind(user.id, ans.topic, session.subject || "General Aviation", ans.is_correct ? 1 : 0, ans.is_correct ? 1 : 0)
        .run();
    }

    // Generate AI Performance Analysis
    const performanceAnalysis = await AIService.analyzeExamResult({
      total_score: totalScore,
      score,
      percentage,
      passed,
      answers: answerRecords,
    });

    // Update Exam Session Status to Completed
    await db
      .prepare(
        `UPDATE exam_sessions 
         SET status = 'completed', end_time = CURRENT_TIMESTAMP, score = ?, total_score = ?, percentage = ?, passed = ?, performance_analysis_json = ?
         WHERE id = ?`
      )
      .bind(score, totalScore, percentage, passed ? 1 : 0, JSON.stringify(performanceAnalysis), session_id)
      .run();

    // Send Notification
    await sendTargetedNotification({
      target_type: "user",
      target_value: user.id,
      title: `Exam Graded: ${percentage.toFixed(0)}% (${passed ? "PASSED" : "FAILED"})`,
      message: `You scored ${score}/${totalScore} on your practice session.`,
      category: "result",
      link: `/results/${session_id}`,
    });

    return NextResponse.json({
      success: true,
      result: {
        session_id,
        score,
        total_score: totalScore,
        percentage,
        passed,
        performance_analysis: performanceAnalysis,
      },
    });
  } catch (err: any) {
    console.error("Submit Exam Error:", err);
    return NextResponse.json({ error: err.message || "Failed to submit exam" }, { status: 500 });
  }
}
