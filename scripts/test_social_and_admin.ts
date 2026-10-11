import { getDB, generateId } from "../src/lib/db";

async function run() {
  console.log("▶ Verifying Social, Discussions & Admin Exam Controls...");
  const db = await getDB();

  // 1. Verify Users Directory Query
  const testUsers = await db.prepare("SELECT id, full_name, email, role FROM users LIMIT 5").all();
  console.log(`  ✓ Found ${testUsers.results.length} users in database directory`);

  // 2. Create a test group
  const adminUser = await db.prepare("SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1").first<any>();
  const memberUser = await db.prepare("SELECT id FROM users WHERE role = 'MEMBER' LIMIT 1").first<any>();

  if (!adminUser || !memberUser) {
    throw new Error("Missing test users");
  }

  const grpId = generateId("grp_test");
  await db.prepare(
    "INSERT INTO groups (id, name, description, course, aircraft, is_private, created_by) VALUES (?, ?, ?, ?, ?, 1, ?)"
  ).bind(grpId, "Test Evacuation Squad", "Private safety drill group", "Safety", "B787-9", memberUser.id).run();

  await db.prepare(
    "INSERT INTO group_memberships (id, group_id, user_id, role) VALUES (?, ?, ?, 'owner')"
  ).bind(generateId("gm"), grpId, memberUser.id).run();

  console.log("  ✓ Created test private group with owner");

  // 3. Post a message to group discussion
  const msgId = generateId("gmsg");
  await db.prepare(
    "INSERT INTO group_messages (id, group_id, sender_id, content) VALUES (?, ?, ?, ?)"
  ).bind(msgId, grpId, memberUser.id, "Drill command: UNFASTEN SEATBELTS!").run();

  const retrievedMsg = await db.prepare("SELECT * FROM group_messages WHERE id = ?").bind(msgId).first<any>();
  if (!retrievedMsg || retrievedMsg.content !== "Drill command: UNFASTEN SEATBELTS!") {
    throw new Error("Failed to retrieve group discussion message");
  }
  console.log("  ✓ Posted and retrieved group discussion message");

  // 4. Invite Admin to group
  await db.prepare(
    "INSERT INTO group_memberships (id, group_id, user_id, role) VALUES (?, ?, ?, 'member')"
  ).bind(generateId("gm"), grpId, adminUser.id).run();
  console.log("  ✓ Successfully added invitee to group memberships");

  // 5. Test Exam deletion and cascade
  const testExamId = generateId("exam_del");
  await db.prepare(
    "INSERT INTO exams (id, title, aircraft, subject, total_questions, time_limit_minutes, created_by, is_published) VALUES (?, ?, 'Q400', 'Safety', 10, 15, ?, 1)"
  ).bind(testExamId, "Temporary Deletion Target", adminUser.id).run();

  // Add dummy question to exam
  const qId = generateId("q_del");
  await db.prepare(
    "INSERT INTO questions (id, question_text, options_json, correct_answer, topic, aircraft, subject, status) VALUES (?, 'Test?', ?, 'A', 'Misc', 'Q400', 'Safety', 'approved')"
  ).bind(qId, JSON.stringify(["A", "B", "C", "D"])).run();

  await db.prepare(
    "INSERT INTO exam_questions (exam_id, question_id, question_order) VALUES (?, ?, 1)"
  ).bind(testExamId, qId).run();

  console.log("  ✓ Created disposable test exam with linked question");

  // Delete exam and check cascade
  await db.prepare("DELETE FROM exams WHERE id = ?").bind(testExamId).run();
  const deletedExam = await db.prepare("SELECT id FROM exams WHERE id = ?").bind(testExamId).first();
  const linkedQuestions = await db.prepare("SELECT exam_id FROM exam_questions WHERE exam_id = ?").bind(testExamId).all();

  if (deletedExam || linkedQuestions.results.length > 0) {
    throw new Error("Exam or linked questions were not cleanly deleted");
  }
  console.log("  ✓ Exam cleanly deleted from DB with all cascades removed");

  // Clean up test group
  await db.prepare("DELETE FROM groups WHERE id = ?").bind(grpId).run();
  await db.prepare("DELETE FROM questions WHERE id = ?").bind(qId).run();
  console.log("  ✓ Cleaned up test group and fixtures");

  console.log("✅ All Social, Discussions & Admin controls verified successfully!");
}

run().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});
