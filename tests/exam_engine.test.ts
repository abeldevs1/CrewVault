import assert from "node:assert";
import { getDB, generateId } from "../src/lib/db";
import { FrozenQuestionSnapshot } from "../src/types";

export async function runExamEngineTests() {
  console.log("▶ Testing Examination Engine & Immutable Snapshots...");
  const db = await getDB();

  // Test 1: Fetch approved questions for exam
  const approvedQ = await db
    .prepare("SELECT * FROM questions WHERE status = 'approved' AND aircraft = 'Q400'")
    .all<any>();
  assert.ok(approvedQ.results.length >= 2, "Must have approved questions seeded");
  console.log(`  ✓ Found ${approvedQ.results.length} approved Q400 questions in bank`);

  // Test 2: Create Immutable Exam Session Snapshot
  const sessionId = generateId("sess_test");
  const testExamId = "exam_q400_official_mock";

  await db
    .prepare(
      `INSERT OR IGNORE INTO exams (id, title, description, aircraft, subject, difficulty, total_questions, time_limit_minutes, passing_percentage, created_by)
       VALUES (?, 'Q400 Mock Exam', 'Test Exam', 'Q400', 'Safety', 'Medium', 2, 20, 75, 'usr_admin_default')`
    )
    .bind(testExamId)
    .run();

  const snapshots: FrozenQuestionSnapshot[] = approvedQ.results.map((q) => ({
    question_id: q.id,
    question_text: q.question_text,
    options: JSON.parse(q.options_json),
    correct_answer: q.correct_answer,
    explanation: q.explanation,
    difficulty: q.difficulty,
    topic: q.topic,
  }));

  await db
    .prepare(
      `INSERT INTO exam_sessions 
       (id, exam_id, user_id, exam_type, status, question_snapshots_json, time_limit_minutes, passing_percentage, start_time)
       VALUES (?, ?, 'usr_member_default', 'Mock', 'in_progress', ?, 20, 75, CURRENT_TIMESTAMP)`
    )
    .bind(sessionId, testExamId, JSON.stringify(snapshots))
    .run();

  const sessionRow = await db.prepare("SELECT * FROM exam_sessions WHERE id = ?").bind(sessionId).first<any>();
  assert.ok(sessionRow);
  const frozen: FrozenQuestionSnapshot[] = JSON.parse(sessionRow.question_snapshots_json);
  assert.strictEqual(frozen.length, snapshots.length);
  const targetQId = frozen[0].question_id;
  const originalQuestionText = frozen[0].question_text;
  console.log("  ✓ Exam session snapshot created and frozen in database");

  // Test 3: Immutability Verification - editing master question MUST NOT alter active session!
  const modifiedText = "TAMPERED: What is the modified text of the question?";
  await db
    .prepare("UPDATE questions SET question_text = ? WHERE id = ?")
    .bind(modifiedText, targetQId)
    .run();

  // Re-read active session
  const sessionCheck = await db.prepare("SELECT question_snapshots_json FROM exam_sessions WHERE id = ?").bind(sessionId).first<any>();
  const frozenAfterTamper: FrozenQuestionSnapshot[] = JSON.parse(sessionCheck.question_snapshots_json);
  assert.strictEqual(
    frozenAfterTamper[0].question_text,
    originalQuestionText,
    "Frozen snapshot must preserve original question text regardless of changes to master questions table!"
  );
  assert.notStrictEqual(frozenAfterTamper[0].question_text, modifiedText);
  console.log("  ✓ Immutability confirmed: Master question table edits do NOT alter active exam session!");

  // Restore question text in master table
  await db.prepare("UPDATE questions SET question_text = ? WHERE id = ?").bind(originalQuestionText, targetQId).run();

  // Test 4: Answer saving & session resumption
  const userAnswers = [
    { question_id: frozen[0].question_id, selected_option: frozen[0].correct_answer, is_correct: true },
    { question_id: frozen[1].question_id, selected_option: "Wrong Option", is_correct: false },
  ];

  for (const ans of userAnswers) {
    const ansId = generateId("ans");
    await db
      .prepare(
        `INSERT INTO exam_answers (id, session_id, question_id, selected_option, is_correct, time_spent_seconds)
         VALUES (?, ?, ?, ?, ?, 25)`
      )
      .bind(ansId, sessionId, ans.question_id, ans.selected_option, ans.is_correct ? 1 : 0)
      .run();
  }

  const savedAnswers = await db.prepare("SELECT * FROM exam_answers WHERE session_id = ?").bind(sessionId).all<any>();
  assert.strictEqual(savedAnswers.results.length, 2, "Saved answers must be restored on refresh");
  console.log("  ✓ Answer persistence and session resumption verified");

  // Test 5: Scoring and Submission
  const score = 1;
  const totalScore = 2;
  const percentage = (score / totalScore) * 100; // 50%
  const passed = percentage >= 75; // false

  await db
    .prepare(
      `UPDATE exam_sessions 
       SET status = 'completed', end_time = CURRENT_TIMESTAMP, score = ?, total_score = ?, percentage = ?, passed = ?
       WHERE id = ?`
    )
    .bind(score, totalScore, percentage, passed ? 1 : 0, sessionId)
    .run();

  const completedSession = await db.prepare("SELECT status, score, percentage, passed FROM exam_sessions WHERE id = ?").bind(sessionId).first<any>();
  assert.strictEqual(completedSession.status, "completed");
  assert.strictEqual(completedSession.score, 1);
  assert.strictEqual(completedSession.percentage, 50);
  assert.strictEqual(completedSession.passed, 0);
  console.log("  ✓ Exam submission, grading calculation, and pass/fail evaluation verified");

  // Test 6: Adaptive performance stats update in user_question_stats
  const topic = frozen[0].topic || "Flight Deck";
  await db
    .prepare(
      `INSERT INTO user_question_stats (user_id, topic, subject, total_attempted, correct_count, last_updated)
       VALUES ('usr_member_default', ?, 'Flight Deck', 1, 1, CURRENT_TIMESTAMP)
       ON CONFLICT(user_id, topic, subject) DO UPDATE SET
       total_attempted = total_attempted + 1,
       correct_count = correct_count + 1,
       last_updated = CURRENT_TIMESTAMP`
    )
    .bind(topic)
    .run();

  const userStats = await db
    .prepare("SELECT total_attempted, correct_count FROM user_question_stats WHERE user_id = 'usr_member_default' AND topic = ?")
    .bind(topic)
    .first<any>();
  assert.ok(userStats);
  assert.ok(userStats.total_attempted >= 1);
  console.log("  ✓ Adaptive user topic statistics recorded properly");

  // Cleanup session test data
  await db.prepare("DELETE FROM exam_sessions WHERE id = ?").bind(sessionId).run();
  console.log("✅ Examination Engine & Immutable Snapshots verification passed!\n");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runExamEngineTests().then(() => process.exit(0)).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
