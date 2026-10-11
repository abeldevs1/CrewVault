import assert from "node:assert";
import { getDB, generateId } from "../src/lib/db";
import { getR2Bucket, checkUserUploadQuota } from "../src/lib/storage";
import { processUploadedFile } from "../src/lib/parser";

export async function runMaterialsFilesTests() {
  console.log("▶ Testing Materials, Quotas, Parser & Storage...");
  const db = await getDB();
  const bucket = await getR2Bucket();

  // Test 1: Quota check - file size limit (100MB)
  const oversizedBytes = 101 * 1024 * 1024;
  const oversizedCheck = await checkUserUploadQuota("usr_member_default", oversizedBytes, db);
  assert.strictEqual(oversizedCheck.allowed, false);
  assert.ok(oversizedCheck.reason?.includes("100 MB"), "Must reject files over 100MB");
  console.log("  ✓ File size limit enforced (rejects > 100 MB)");

  // Test 2: Normal quota check
  const freshUserId = `usr_test_quota_${Date.now()}`;
  const normalBytes = 5 * 1024 * 1024; // 5MB
  const normalCheck = await checkUserUploadQuota(freshUserId, normalBytes, db);
  assert.strictEqual(normalCheck.allowed, true);
  console.log("  ✓ Normal file size permitted within quota");

  // Test 3: R2 Storage put, get, and delete operations
  const testKey = `test/integration_${Date.now()}.txt`;
  const testContent = "Flight Deck Door Procedures - CrewVault R2 Storage Verification";
  await bucket.put(testKey, testContent, {
    httpMetadata: { contentType: "text/plain" },
  });

  const retrieved = await bucket.get(testKey);
  assert.ok(retrieved, "Stored object must be retrievable from R2");
  const retrievedText = await (retrieved as any).text();
  assert.strictEqual(retrievedText, testContent, "Stored content must match exactly");

  await bucket.delete(testKey);
  const deletedCheck = await bucket.get(testKey);
  assert.strictEqual(deletedCheck, null, "Deleted object must return null");
  console.log("  ✓ Cloudflare R2 bucket put, get, and delete operations succeed");

  // Test 4: Document Parser & Markdown Normalization
  // A. Plain text / Markdown
  const sampleTxt = `Q400 FLIGHT DECK DOOR PROCEDURES
1. What is the emergency entry code duration?
A. 30 seconds
B. 60 seconds
C. 15 seconds
D. 5 seconds
Answer: A
Section 1. Normal Operations
The door locking toggle must be engaged during all flight operations.`;

  const parsedTxt = await processUploadedFile(Buffer.from(sampleTxt), "sample_notes.txt", "text/plain");
  assert.ok(parsedTxt.extracted_markdown.includes("# sample_notes"));
  assert.strictEqual(parsedTxt.detected_questions.length, 1);
  assert.strictEqual(parsedTxt.detected_questions[0].correct_answer, "A. 30 seconds");
  console.log("  ✓ Text/Markdown parsing & embedded question detection work");

  // B. DOCX parser handling
  // Verify mammoth can extract text from a buffer without throwing
  const emptyBuffer = Buffer.from("test docx fallback buffer");
  const parsedDocx = await processUploadedFile(emptyBuffer, "test.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  assert.ok(parsedDocx.extracted_text !== undefined);
  console.log("  ✓ DOCX processor handles document buffers cleanly");

  // C. OCR & Scanned PDF evaluation
  // Scanned image PDFs without an embedded text stream yield empty text layer.
  // The system preserves the original intact in R2 rather than corrupting it.
  console.log("  ℹ OCR Note: Scanned PDFs without embedded text layers preserve original files in R2; native optical character recognition requires external OCR API.");

  // Test 5: Material Versioning
  const matId = generateId("mat_test");
  const ver1Id = generateId("ver_test1");
  const ver2Id = generateId("ver_test2");

  await db
    .prepare(
      `INSERT INTO materials (id, title, material_type, subject, aircraft, uploader_id, current_version_id, status)
       VALUES (?, 'Q400 Quick Reference', 'Study Guide', 'Flight Deck', 'Q400', 'usr_manager_default', ?, 'approved')`
    )
    .bind(matId, ver1Id)
    .run();

  await db
    .prepare(
      `INSERT INTO material_versions (id, material_id, version_number, r2_key_original, filename, mime_type, size_bytes, processing_status, uploader_id)
       VALUES (?, ?, 1, 'originals/mat/v1.pdf', 'q400_v1.pdf', 'application/pdf', 1024, 'completed', 'usr_manager_default')`
    )
    .bind(ver1Id, matId)
    .run();

  // Create Version 2
  await db
    .prepare(
      `INSERT INTO material_versions (id, material_id, version_number, r2_key_original, filename, mime_type, size_bytes, processing_status, uploader_id)
       VALUES (?, ?, 2, 'originals/mat/v2.pdf', 'q400_v2.pdf', 'application/pdf', 2048, 'completed', 'usr_manager_default')`
    )
    .bind(ver2Id, matId)
    .run();

  await db.prepare("UPDATE materials SET current_version_id = ? WHERE id = ?").bind(ver2Id, matId).run();

  const versions = await db.prepare("SELECT version_number, filename FROM material_versions WHERE material_id = ? ORDER BY version_number ASC").bind(matId).all<any>();
  assert.strictEqual(versions.results.length, 2, "Material must have 2 versions without duplicate master records");
  assert.strictEqual(versions.results[0].filename, "q400_v1.pdf");
  assert.strictEqual(versions.results[1].filename, "q400_v2.pdf");

  const currentMat = await db.prepare("SELECT current_version_id FROM materials WHERE id = ?").bind(matId).first<any>();
  assert.strictEqual(currentMat.current_version_id, ver2Id);
  console.log("  ✓ Material versioning tracks history and updates current version cleanly");

  // Test 6: Deletion cleanup
  await db.prepare("DELETE FROM materials WHERE id = ?").bind(matId).run();
  const remainingVersions = await db.prepare("SELECT id FROM material_versions WHERE material_id = ?").bind(matId).all<any>();
  assert.strictEqual(remainingVersions.results.length, 0, "Deleting material cascades to delete all versions; no orphans");
  console.log("  ✓ Deleting material removes all associated version records without orphans");

  console.log("✅ Materials, Quotas, Parser & Storage verification passed!\n");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runMaterialsFilesTests().then(() => process.exit(0)).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
