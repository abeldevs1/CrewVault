import assert from "assert";
import { getDB, generateId } from "../src/lib/db";

export async function runCrewVault2Tests() {
  console.log("\n▶ Testing CrewVault 2.0 Manager Applications, Aircraft DB, Groups & Private Messaging...");
  const db = await getDB();

  // 1. Test Manager Application Submission & Review
  const memberId = "usr_member_default";
  const adminId = "usr_admin_default";
  const appId = generateId("app_test");

  await db
    .prepare(
      `INSERT INTO manager_applications (id, user_id, reason, experience, requested_responsibilities, status)
       VALUES (?, ?, 'Lead cabin crew instructor', '5 years flight safety instructor', 'Moderating Q400 exams', 'pending')`
    )
    .bind(appId, memberId)
    .run();

  const fetchedApp = await db
    .prepare(`SELECT * FROM manager_applications WHERE id = ?`)
    .bind(appId)
    .first<any>();

  assert.strictEqual(fetchedApp.status, "pending");
  assert.strictEqual(fetchedApp.user_id, memberId);
  console.log("  ✓ Manager application creation and pending status verified");

  // Admin approves application
  await db
    .prepare(`UPDATE manager_applications SET status = 'approved', reviewer_id = ? WHERE id = ?`)
    .bind(adminId, appId)
    .run();

  const approvedApp = await db
    .prepare(`SELECT * FROM manager_applications WHERE id = ?`)
    .bind(appId)
    .first<any>();

  assert.strictEqual(approvedApp.status, "approved");
  assert.strictEqual(approvedApp.reviewer_id, adminId);
  console.log("  ✓ Manager application approval and reviewer recording verified");

  // 2. Test Aircraft Database Families & Variants
  const familiesCount = await db
    .prepare(`SELECT COUNT(*) as count FROM aircraft_families WHERE is_active = 1`)
    .first<any>();

  assert.ok(familiesCount.count >= 5, "Expected at least 5 active aircraft families in database");
  console.log(`  ✓ Found ${familiesCount.count} active aircraft families (Boeing, Airbus, De Havilland)`);

  // 3. Test Groups Creation & Memberships
  const grpId = generateId("grp_test");
  await db
    .prepare(`INSERT INTO groups (id, name, description, created_by) VALUES (?, 'Q400 Study Group', 'Dedicated for Q400 cabin crew cadets', ?)`)
    .bind(grpId, memberId)
    .run();

  await db
    .prepare(`INSERT INTO group_memberships (id, group_id, user_id, role) VALUES (?, ?, ?, 'owner')`)
    .bind(generateId("gm_test"), grpId, memberId)
    .run();

  const grp = await db.prepare(`SELECT * FROM groups WHERE id = ?`).bind(grpId).first<any>();
  assert.strictEqual(grp.name, "Q400 Study Group");
  console.log("  ✓ Study group creation and owner membership verified");

  // 4. Test 1-to-1 Direct Messaging
  const convId = generateId("conv_test_" + Date.now());
  const user1 = generateId("u1_msg");
  const user2 = generateId("u2_msg");

  await db.prepare(`INSERT INTO users (id, email, password_hash, full_name) VALUES (?, ?, 'pwd', 'User 1')`).bind(user1, `${user1}@test.local`).run();
  await db.prepare(`INSERT INTO users (id, email, password_hash, full_name) VALUES (?, ?, 'pwd', 'User 2')`).bind(user2, `${user2}@test.local`).run();

  await db
    .prepare(`INSERT INTO conversations (id, user_1_id, user_2_id) VALUES (?, ?, ?)`)
    .bind(convId, user1, user2)
    .run();

  const msgId = generateId("msg_test");
  await db
    .prepare(`INSERT INTO direct_messages (id, conversation_id, sender_id, recipient_id, content) VALUES (?, ?, ?, ?, 'Hello User 2!')`)
    .bind(msgId, convId, user1, user2)
    .run();

  const msg = await db.prepare(`SELECT * FROM direct_messages WHERE id = ?`).bind(msgId).first<any>();
  assert.strictEqual(msg.content, "Hello User 2!");
  assert.strictEqual(msg.is_read, 0);
  console.log("  ✓ 1-to-1 direct messaging and unread status verified");

  // 5. Test Anonymous Post Privacy
  const anonPostId = generateId("post_anon_test");
  await db
    .prepare(
      `INSERT INTO posts (id, author_id, title, content, status, visibility, anonymous_uploader)
       VALUES (?, ?, 'Anonymous Safety Query', 'Confidential question regarding door latching', 'published', 'public', 1)`
    )
    .bind(anonPostId, memberId)
    .run();

  const anonPost = await db.prepare(`SELECT * FROM posts WHERE id = ?`).bind(anonPostId).first<any>();
  assert.strictEqual(Boolean(anonPost.anonymous_uploader), true);
  console.log("  ✓ Anonymous post creation and identity masking flag verified");

  // 6. Test Material Persistence & My Uploads Query
  const testMatId = generateId("mat_persist_test");
  const testVerId = generateId("ver_persist_test");

  await db
    .prepare(
      `INSERT INTO materials (id, title, description, material_type, subject, aircraft, uploader_id, current_version_id, status)
       VALUES (?, 'Persistent Cabin Guide', 'Testing persistent upload lifecycle', 'Training Manual', 'Cabin Doors', 'Q400', ?, ?, 'pending')`
    )
    .bind(testMatId, memberId, testVerId)
    .run();

  await db
    .prepare(
      `INSERT INTO material_versions (id, material_id, version_number, r2_key_original, filename, mime_type, size_bytes, processing_status, uploader_id)
       VALUES (?, ?, 1, 'originals/test/test.pdf', 'test.pdf', 'application/pdf', 1024, 'completed', ?)`
    )
    .bind(testVerId, testMatId, memberId)
    .run();

  const myUploads = await db
    .prepare(`SELECT * FROM materials WHERE uploader_id = ?`)
    .bind(memberId)
    .all<any>();

  assert.ok(myUploads.results.some((m) => m.id === testMatId));
  console.log("  ✓ Material persistence and My Uploads query verified (including pending moderation status)");

  // 7. Test Study Pack Question Candidate Persistence
  const qSpId = generateId("q_sp_test");
  await db
    .prepare(
      `INSERT INTO questions (id, question_text, options_json, correct_answer, explanation, difficulty, topic, aircraft, subject, source_material_id, ai_generated, status)
       VALUES (?, 'What is the minimum oxygen duration on Q400?', '["12-15 min", "30 min", "45 min", "1 hour"]', '12-15 min', 'Standard chemical generators', 'Medium', 'Emergency Equipment', 'Q400', 'Emergency Equipment', ?, 1, 'pending_review')`
    )
    .bind(qSpId, testMatId)
    .run();

  const persistedQ = await db.prepare(`SELECT * FROM questions WHERE id = ?`).bind(qSpId).first<any>();
  assert.strictEqual(persistedQ.status, "pending_review");
  assert.strictEqual(Boolean(persistedQ.ai_generated), true);
  console.log("  ✓ Study Pack candidate questions persisted in database with pending_review status");

  // 8. Test OpenRouter Configuration Validation
  const { getOpenRouterConfig, testOpenRouterConnection } = await import("../src/lib/ai/openrouter");
  const orConfig = getOpenRouterConfig();
  assert.ok(orConfig.baseUrl.includes("openrouter.ai"));
  const connResult = await testOpenRouterConnection();
  // Without OPENROUTER_API_KEY in test environment, it should report gracefully rather than throw unhandled exception
  assert.strictEqual(typeof connResult.ok, "boolean");
  console.log(`  ✓ OpenRouter provider configuration verified (Connected: ${connResult.ok})`);

  console.log("✅ CrewVault 2.0 Features & Lifecycle verification passed!\n");
}
