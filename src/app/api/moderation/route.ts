import { NextResponse } from "next/server";
import { getDB, generateId } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { sendTargetedNotification } from "@/lib/notifications";

export async function GET() {
  try {
    const user = await requireAuth("MANAGER");
    const db = await getDB();

    // 1. Pending Material Uploads
    const { results: pendingMaterials } = await db
      .prepare(
        `SELECT m.id, m.title, m.material_type, m.subject, m.aircraft, m.created_at, 
                u.full_name as uploader_name, u.email as uploader_email
         FROM materials m
         JOIN users u ON m.uploader_id = u.id
         WHERE m.status = 'pending'
         ORDER BY m.created_at ASC`
      )
      .all<any>();

    // 2. Pending Questions (AI Generated or User Extracted awaiting approval)
    const { results: pendingQuestions } = await db
      .prepare(
        `SELECT q.id, q.question_text, q.options_json, q.correct_answer, q.explanation, 
                q.difficulty, q.topic, q.aircraft, q.ai_generated, q.source_material_id, q.created_at
         FROM questions q
         WHERE q.status = 'pending_review'
         ORDER BY q.created_at ASC
         LIMIT 50`
      )
      .all<any>();

    const questionsFormatted = pendingQuestions.map((q) => ({
      ...q,
      options: JSON.parse(q.options_json || "[]"),
    }));

    // 3. User Reports
    const { results: reports } = await db
      .prepare(
        `SELECT r.id, r.item_type, r.item_id, r.reason, r.details, r.status, r.created_at,
                u.full_name as reporter_name
         FROM reports r
         JOIN users u ON r.reporter_id = u.id
         WHERE r.status = 'pending'
         ORDER BY r.created_at ASC`
      )
      .all<any>();

    return NextResponse.json({
      success: true,
      pending_materials: pendingMaterials,
      pending_questions: questionsFormatted,
      reports,
    });
  } catch (err: any) {
    console.error("GET Moderation Queue Error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch moderation queue" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth("MANAGER");
    const body = await request.json();
    const { action, target_type, target_id, items, notes, rejection_reason } = body;

    if (!action) {
      return NextResponse.json({ error: "Missing action" }, { status: 400 });
    }

    const db = await getDB();

    // Support both batch items array and single target
    const targetItems: { target_type: string; target_id: string }[] =
      Array.isArray(items) && items.length > 0
        ? items
        : target_type && target_id
        ? [{ target_type, target_id }]
        : [];

    if (targetItems.length === 0) {
      return NextResponse.json({ error: "No moderation items provided" }, { status: 400 });
    }

    let processedCount = 0;

    for (const item of targetItems) {
      const modActionId = generateId("mod");
      const { target_type: tType, target_id: tId } = item;

      if (tType === "material") {
        const newStatus = action === "approve" ? "approved" : "rejected";
        await db
          .prepare("UPDATE materials SET status = ?, rejection_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
          .bind(newStatus, rejection_reason || null, tId)
          .run();

        const material = await db
          .prepare("SELECT uploader_id, title, aircraft FROM materials WHERE id = ?")
          .bind(tId)
          .first<any>();

        if (material) {
          await sendTargetedNotification({
            target_type: "user",
            target_value: material.uploader_id,
            title: `Material Upload ${action === "approve" ? "Approved" : "Rejected"}`,
            message:
              action === "approve"
                ? `Your study material "${material.title}" has been approved and published.`
                : `Your study material "${material.title}" was not approved. Reason: ${rejection_reason || "Policy compliance"}`,
            category: "approval",
            link: action === "approve" ? `/materials/${tId}` : "/materials",
          });
        }
      } else if (tType === "question") {
        const newStatus = action === "approve" ? "approved" : "rejected";
        await db
          .prepare("UPDATE questions SET status = ? WHERE id = ?")
          .bind(newStatus, tId)
          .run();
      } else if (tType === "report") {
        await db
          .prepare("UPDATE reports SET status = ? WHERE id = ?")
          .bind(action === "dismiss" ? "dismissed" : "resolved", tId)
          .run();
      }

      // Log moderation action
      await db
        .prepare(
          "INSERT INTO moderation_actions (id, moderator_id, action, target_type, target_id, notes) VALUES (?, ?, ?, ?, ?, ?)"
        )
        .bind(modActionId, user.id, action, tType, tId, notes || `Batch action: ${action}`)
        .run();

      processedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${action} action on ${processedCount} item(s) successfully`,
      count: processedCount,
    });
  } catch (err: any) {
    console.error("POST Moderation Action Error:", err);
    return NextResponse.json({ error: err.message || "Failed to process moderation action" }, { status: 500 });
  }
}
