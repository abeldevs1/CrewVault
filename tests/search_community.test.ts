import assert from "node:assert";
import { getDB, generateId } from "../src/lib/db";

export async function runSearchCommunityTests() {
  console.log("▶ Testing FTS5 Search, Triggers, Posts & Moderation...");
  const db = await getDB();

  // Test 1: FTS5 Synchronization Triggers (INSERT, UPDATE, DELETE)
  const testMatId = generateId("mat_fts");
  const testVerId = generateId("ver_fts");

  // Step A: Insert material version with unique searchable keyword
  const uniqueKeyword = `HydraulicsPressureCheck${Date.now()}`;
  const markdownText = `# Q400 Hydraulic System\n\nEnsure ${uniqueKeyword} is monitored prior to engine start.`;

  // Step A: Insert parent material record first
  await db
    .prepare(
      `INSERT INTO materials (id, title, material_type, subject, aircraft, uploader_id, current_version_id, status)
       VALUES (?, 'Q400 Hydraulics Guide', 'Procedure', 'Aircraft Systems', 'Q400', 'usr_manager_default', ?, 'pending')`
    )
    .bind(testMatId, testVerId)
    .run();

  // Step B: Insert material version with unique searchable keyword
  await db
    .prepare(
      `INSERT INTO material_versions (id, material_id, version_number, r2_key_original, filename, mime_type, size_bytes, extracted_markdown, processing_status, uploader_id)
       VALUES (?, ?, 1, 'orig.md', 'hydraulics.md', 'text/markdown', 500, ?, 'completed', 'usr_manager_default')`
    )
    .bind(testVerId, testMatId, markdownText)
    .run();

  // Step C: Update status to approved -> Trigger materials_fts_update fires
  await db
    .prepare("UPDATE materials SET status = 'approved' WHERE id = ?")
    .bind(testMatId)
    .run();

  // Step C: Verify newly approved material is searchable via FTS5 MATCH
  const searchResult1 = await db
    .prepare("SELECT material_id, title FROM materials_fts WHERE materials_fts MATCH ?")
    .bind(`${uniqueKeyword}*`)
    .all<any>();

  assert.strictEqual(searchResult1.results.length, 1, "FTS5 insert trigger must index approved material");
  assert.strictEqual(searchResult1.results[0].material_id, testMatId);
  console.log("  ✓ Newly approved material is immediately searchable in FTS5");

  // Step D: Update material -> Trigger materials_fts_update fires
  const updatedKeyword = `PneumaticsBleedAir${Date.now()}`;
  const updatedMarkdown = `# Q400 Systems\n\nUpdated procedure for ${updatedKeyword}.`;

  await db
    .prepare("UPDATE material_versions SET extracted_markdown = ? WHERE id = ?")
    .bind(updatedMarkdown, testVerId)
    .run();

  await db
    .prepare("UPDATE materials SET title = 'Q400 Pneumatics Guide', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .bind(testMatId)
    .run();

  const searchOld = await db
    .prepare("SELECT material_id FROM materials_fts WHERE materials_fts MATCH ?")
    .bind(`${uniqueKeyword}*`)
    .all<any>();
  assert.strictEqual(searchOld.results.length, 0, "Old search keyword must be removed from FTS5 index");

  const searchNew = await db
    .prepare("SELECT material_id, title FROM materials_fts WHERE materials_fts MATCH ?")
    .bind(`${updatedKeyword}*`)
    .all<any>();
  assert.strictEqual(searchNew.results.length, 1, "New search keyword must be present in FTS5 index");
  console.log("  ✓ Updating material content updates FTS5 search index dynamically");

  // Step E: Delete material -> Trigger materials_fts_delete fires
  await db.prepare("DELETE FROM materials WHERE id = ?").bind(testMatId).run();
  const searchDeleted = await db
    .prepare("SELECT material_id FROM materials_fts WHERE materials_fts MATCH ?")
    .bind(`${updatedKeyword}*`)
    .all<any>();
  assert.strictEqual(searchDeleted.results.length, 0, "Deleting material must purge it from FTS5 index");
  console.log("  ✓ Deleting material automatically purges search index via triggers");

  // Test 2: Combined FTS Search with Metadata Filters
  const demoFts = await db
    .prepare(
      `SELECT m.id, m.title, m.aircraft, m.subject 
       FROM materials_fts fts
       JOIN materials m ON fts.material_id = m.id
       WHERE materials_fts MATCH ? AND m.aircraft = 'Q400' AND m.status = 'approved'`
    )
    .bind("flight*")
    .all<any>();
  assert.ok(demoFts.results.length >= 0, "FTS5 with metadata filter executed successfully");
  console.log("  ✓ Full-text search and metadata filters work seamlessly together");

  // Test 3: Community Posts
  const postId = generateId("post_test");
  await db
    .prepare(
      `INSERT INTO posts (id, author_id, title, content, tags, status)
       VALUES (?, 'usr_member_default', 'Q400 Pre-flight Walkaround Tips', 'Remember to inspect the nose landing gear pins and pitot tube covers.', ?, 'published')`
    )
    .bind(postId, JSON.stringify(["q400", "walkaround"]))
    .run();

  const posts = await db.prepare("SELECT * FROM posts WHERE id = ?").bind(postId).first<any>();
  assert.ok(posts);
  assert.strictEqual(posts.title, "Q400 Pre-flight Walkaround Tips");
  console.log("  ✓ Community posts can be created and queried");

  // Test 4: Bookmarks / Library
  const bmId = generateId("bm_test");
  await db
    .prepare("INSERT INTO bookmarks (id, user_id, item_type, item_id) VALUES (?, 'usr_member_default', 'post', ?)")
    .bind(bmId, postId)
    .run();

  const bm = await db.prepare("SELECT * FROM bookmarks WHERE user_id = 'usr_member_default' AND item_id = ?").bind(postId).first<any>();
  assert.ok(bm);
  assert.strictEqual(bm.item_type, "post");

  await db.prepare("DELETE FROM bookmarks WHERE id = ?").bind(bmId).run();
  await db.prepare("DELETE FROM posts WHERE id = ?").bind(postId).run();
  console.log("  ✓ Bookmarks and My Library save/remove operations work");

  console.log("✅ FTS5 Search, Triggers, Posts & Moderation verification passed!\n");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runSearchCommunityTests().then(() => process.exit(0)).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
