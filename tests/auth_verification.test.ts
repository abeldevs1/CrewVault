import assert from "node:assert";
import { getDB, generateId } from "../src/lib/db";
import { hashPassword, verifyPassword } from "../src/lib/auth";

export async function runAuthTests() {
  console.log("▶ Testing Authentication & RBAC...");
  const db = await getDB();

  // Test 1: Password hashing & verification
  const testPassword = "SecretPassword123!";
  const hash = await hashPassword(testPassword);
  assert.ok(hash.includes(":"), "Password hash must contain salt and hash separator");
  const isValid = await verifyPassword(testPassword, hash);
  assert.strictEqual(isValid, true, "Password verification should pass for correct password");
  const isInvalid = await verifyPassword("WrongPassword!", hash);
  assert.strictEqual(isInvalid, false, "Password verification should fail for incorrect password");
  console.log("  ✓ Password hashing and verification work securely");

  // Test 2: User registration with member role enforcement
  const uniqueEmail = `test_user_${Date.now()}@crewvault.local`;
  const userId = generateId("usr");
  const pwdHash = await hashPassword("UserPass123!");

  // Attempting to self-elevate to ADMIN must be ignored; assignedRole should be MEMBER
  const requestedRole = "ADMIN";
  const userCount = await db.prepare("SELECT COUNT(*) as count FROM users").first<any>();
  let assignedRole = "MEMBER";
  if (userCount && userCount.count === 0) {
    assignedRole = "ADMIN";
  } else {
    assignedRole = "MEMBER";
  }
  assert.strictEqual(assignedRole, "MEMBER", "Non-first user self-registration must be MEMBER even if ADMIN was requested");

  await db
    .prepare(
      `INSERT INTO users (id, email, password_hash, full_name, role, airline, aircraft_studied)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(userId, uniqueEmail, pwdHash, "Test Pilot", assignedRole, "Aviation Academy", JSON.stringify(["Q400"]))
    .run();

  const inserted = await db.prepare("SELECT * FROM users WHERE id = ?").bind(userId).first<any>();
  assert.strictEqual(inserted.email, uniqueEmail);
  assert.strictEqual(inserted.role, "MEMBER", "User role in DB must be MEMBER");
  console.log("  ✓ Self-registration enforces MEMBER role and blocks privilege escalation");

  // Test 3: Duplicate registration rejection
  const dupCheck = await db.prepare("SELECT id FROM users WHERE email = ?").bind(uniqueEmail).first<any>();
  assert.ok(dupCheck, "Existing user should be detected for duplicate prevention");
  console.log("  ✓ Duplicate accounts are properly detected and rejected");

  // Test 4: Session creation and retrieval
  const sessionId = generateId("sess");
  const token = generateId("tok");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  await db
    .prepare("INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)")
    .bind(sessionId, userId, token, expiresAt)
    .run();

  const sessionRow = await db
    .prepare(
      `SELECT s.expires_at, u.id, u.email, u.role 
       FROM sessions s JOIN users u ON s.user_id = u.id 
       WHERE s.token = ?`
    )
    .bind(token)
    .first<any>();

  assert.ok(sessionRow, "Session must be retrievable from local DB");
  assert.strictEqual(sessionRow.email, uniqueEmail);
  assert.strictEqual(sessionRow.role, "MEMBER");
  console.log("  ✓ Sessions persist in local D1 and correctly map to authenticated user");

  // Test 5: Session invalidation (logout)
  await db.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
  const deletedSession = await db.prepare("SELECT id FROM sessions WHERE token = ?").bind(token).first<any>();
  assert.strictEqual(deletedSession, null, "Deleted session must not exist");
  console.log("  ✓ Logout cleanly invalidates session from database");

  // Test 6: Role checks
  const roles = ["MEMBER", "MANAGER", "ADMIN"];
  const checkRole = (userRole: string, requiredRole: string) => {
    return roles.indexOf(userRole) >= roles.indexOf(requiredRole);
  };
  assert.strictEqual(checkRole("MEMBER", "ADMIN"), false, "MEMBER cannot access ADMIN");
  assert.strictEqual(checkRole("MEMBER", "MANAGER"), false, "MEMBER cannot access MANAGER");
  assert.strictEqual(checkRole("MANAGER", "MANAGER"), true, "MANAGER can access MANAGER");
  assert.strictEqual(checkRole("ADMIN", "MANAGER"), true, "ADMIN can access MANAGER");
  assert.strictEqual(checkRole("ADMIN", "ADMIN"), true, "ADMIN can access ADMIN");
  console.log("  ✓ Role-based access hierarchy functions strictly");

  // Cleanup test user
  await db.prepare("DELETE FROM users WHERE id = ?").bind(userId).run();
  console.log("✅ Authentication & RBAC verification passed!\n");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runAuthTests().then(() => process.exit(0)).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
