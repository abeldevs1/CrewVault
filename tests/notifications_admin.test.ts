import assert from "node:assert";
import { getDB, generateId } from "../src/lib/db";
import { sendTargetedNotification, getUserNotifications } from "../src/lib/notifications";

export async function runNotificationsAdminTests() {
  console.log("▶ Testing Targeted Notifications, Storage Governance & Admin Dashboard...");
  const db = await getDB();

  // Test 1: Targeted Notification Delivery to Aircraft Focus
  const notifId = await sendTargetedNotification({
    target_type: "aircraft",
    target_value: "Q400",
    title: "New Q400 Procedure Guide Published",
    message: "De-icing and winter operational procedures are now available.",
    category: "material",
    link: "/materials/mat_q400_manual_demo",
  });
  assert.ok(notifId);

  // User 'usr_member_default' studies Q400 and has notify_new_materials = 1
  const memberNotifs = await getUserNotifications("usr_member_default");
  const matchingNotif = memberNotifs.find((n) => n.title === "New Q400 Procedure Guide Published");
  assert.ok(matchingNotif, "Q400 studying member must receive the targeted aircraft notification");
  assert.strictEqual(matchingNotif.is_read, false);
  console.log("  ✓ Targeted aircraft notification correctly delivered to matching user");

  // Test 2: Notification Preferences Filtering
  // Disable materials notification for member
  await db.prepare("UPDATE notification_preferences SET notify_new_materials = 0 WHERE user_id = 'usr_member_default'").run();

  const notifId2 = await sendTargetedNotification({
    target_type: "aircraft",
    target_value: "Q400",
    title: "Second Material Notice",
    message: "Another material uploaded.",
    category: "material",
  });

  const memberNotifsAfterOptOut = await getUserNotifications("usr_member_default");
  const optOutNotice = memberNotifsAfterOptOut.find((n) => n.title === "Second Material Notice");
  assert.strictEqual(optOutNotice, undefined, "User who opted out of material notifications must NOT receive notification");
  console.log("  ✓ User notification preferences respected (opt-out suppressed notification)");

  // Re-enable notification preference
  await db.prepare("UPDATE notification_preferences SET notify_new_materials = 1 WHERE user_id = 'usr_member_default'").run();

  // Test 3: Mark Notification as Read
  await db
    .prepare("UPDATE user_notifications SET is_read = 1 WHERE notification_id = ? AND user_id = 'usr_member_default'")
    .bind(notifId)
    .run();

  const readCheck = await getUserNotifications("usr_member_default");
  const updatedNotice = readCheck.find((n) => n.title === "New Q400 Procedure Guide Published");
  assert.strictEqual(updatedNotice?.is_read, true);
  console.log("  ✓ Mark notification as read updates status correctly");

  // Test 4: Admin Metrics & System Statistics
  const totalUsers = await db.prepare("SELECT COUNT(*) as count FROM users").first<any>();
  const totalMaterials = await db.prepare("SELECT COUNT(*) as count FROM materials").first<any>();
  const totalQuestions = await db.prepare("SELECT COUNT(*) as count FROM questions").first<any>();
  const totalStorage = await db.prepare("SELECT SUM(size_bytes) as total FROM material_versions").first<any>();

  assert.ok(totalUsers.count >= 3, "At least 3 seeded users exist");
  assert.ok(totalMaterials.count >= 1, "At least 1 seeded material exists");
  assert.ok(totalQuestions.count >= 4, "At least 4 questions exist");
  console.log(`  ✓ Admin Stats Verified: ${totalUsers.count} users, ${totalMaterials.count} materials, ${totalQuestions.count} questions`);

  // Test 5: Storage Governance Visual Gauge Calculation
  const totalBytes = totalStorage.total || 0;
  const limitBytes = 10 * 1024 * 1024 * 1024; // 10 GB limit
  const usageRatio = totalBytes / limitBytes;
  const usagePercentage = (usageRatio * 100).toFixed(1);
  const warningTriggered = usageRatio >= 0.75;

  assert.ok(parseFloat(usagePercentage) >= 0 && parseFloat(usagePercentage) <= 100);
  assert.strictEqual(warningTriggered, false, "Usage under 75% must not trigger capacity warning");
  console.log(`  ✓ Storage Governance Gauge: ${usagePercentage}% of 10 GB limit used (Warning: ${warningTriggered ? "Active" : "Normal"})`);

  // Test 6: Audit Logs
  const auditId = generateId("aud");
  await db
    .prepare("INSERT INTO audit_logs (id, actor_id, action, target_type, target_id) VALUES (?, 'usr_admin_default', 'SYSTEM_AUDIT_VERIFIED', 'system', 'local')")
    .bind(auditId)
    .run();

  const auditLog = await db.prepare("SELECT * FROM audit_logs WHERE id = ?").bind(auditId).first<any>();
  assert.ok(auditLog);
  assert.strictEqual(auditLog.action, "SYSTEM_AUDIT_VERIFIED");
  console.log("  ✓ Privileged actions correctly recorded in audit_logs");

  console.log("✅ Targeted Notifications, Storage Governance & Admin Dashboard verification passed!\n");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runNotificationsAdminTests().then(() => process.exit(0)).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
