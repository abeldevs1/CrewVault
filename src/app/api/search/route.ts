import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const queryTerm = searchParams.get("q") || "";
    const aircraft = searchParams.get("aircraft");
    const airline = searchParams.get("airline");
    const subject = searchParams.get("subject");
    const materialType = searchParams.get("material_type");
    const searchType = searchParams.get("type") || "all"; // all | materials | questions

    const db = await getDB();

    if (!queryTerm.trim()) {
      return NextResponse.json({ success: true, results: [], questions: [] });
    }

    // Tokenize query for Google-like multi-word AND search
    const words = queryTerm
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 1);

    if (words.length === 0) {
      return NextResponse.json({ success: true, results: [], questions: [] });
    }

    // FTS5 query: each word gets a prefix wildcard, combined with AND
    const ftsMatch = words.map((w) => `${w}*`).join(" AND ");

    let materialResults: any[] = [];
    let questionResults: any[] = [];

    // 1. Search Materials (title, description, AND full document content via markdown_content)
    if (searchType === "all" || searchType === "materials") {
      let sql = `
        SELECT m.id, m.title, m.description, m.material_type, m.subject, m.aircraft,
               m.airline, m.course, m.difficulty, m.year, m.views_count, m.created_at,
               u.full_name as uploader_name,
               snippet(materials_fts, 2, '<mark>', '</mark>', '...', 40) as content_snippet
        FROM materials_fts fts
        JOIN materials m ON fts.material_id = m.id
        JOIN users u ON m.uploader_id = u.id
        WHERE materials_fts MATCH ? AND m.status = 'approved'
      `;

      const bindings: any[] = [ftsMatch];

      if (aircraft) {
        sql += " AND m.aircraft = ?";
        bindings.push(aircraft);
      }
      if (airline) {
        sql += " AND m.airline = ?";
        bindings.push(airline);
      }
      if (subject) {
        sql += " AND m.subject = ?";
        bindings.push(subject);
      }
      if (materialType) {
        sql += " AND m.material_type = ?";
        bindings.push(materialType);
      }

      // Check if boilerplate materials should be hidden from regular members
      try {
        const { getCurrentUser } = await import("@/lib/auth");
        const currentUser = await getCurrentUser();
        const hideBpRow = await db
          .prepare("SELECT value FROM system_settings WHERE key = 'hide_boilerplate'")
          .first<any>();
        if (hideBpRow && hideBpRow.value === "true") {
          if (!currentUser || currentUser.role === "MEMBER") {
            sql += " AND (m.is_boilerplate = 0 OR m.is_boilerplate IS NULL)";
          }
        }
      } catch (e) {}

      sql += " ORDER BY rank LIMIT 30";

      try {
        const { results } = await db.prepare(sql).bind(...bindings).all<any>();
        materialResults = results;
      } catch (ftsErr) {
        // Fallback to LIKE search if FTS5 fails
        console.warn("FTS5 search failed, falling back to LIKE:", ftsErr);
        const likePattern = `%${queryTerm}%`;
        let fallbackSql = `
          SELECT m.id, m.title, m.description, m.material_type, m.subject, m.aircraft,
                 m.airline, m.course, m.difficulty, m.year, m.views_count, m.created_at,
                 u.full_name as uploader_name,
                 '' as content_snippet
          FROM materials m
          JOIN users u ON m.uploader_id = u.id
          LEFT JOIN material_versions mv ON m.current_version_id = mv.id
          WHERE m.status = 'approved'
            AND (m.title LIKE ? OR m.description LIKE ? OR m.subject LIKE ? OR mv.extracted_markdown LIKE ?)
        `;
        const fbBindings: any[] = [likePattern, likePattern, likePattern, likePattern];

        if (aircraft) { fallbackSql += " AND m.aircraft = ?"; fbBindings.push(aircraft); }
        if (subject) { fallbackSql += " AND m.subject = ?"; fbBindings.push(subject); }

        fallbackSql += " ORDER BY m.created_at DESC LIMIT 30";
        const { results } = await db.prepare(fallbackSql).bind(...fbBindings).all<any>();
        materialResults = results;
      }
    }

    // 2. Search Questions (question text, options, explanations)
    if (searchType === "all" || searchType === "questions") {
      const likeQ = `%${queryTerm}%`;
      const qSql = `
        SELECT q.id, q.question_text, q.options_json, q.correct_answer, q.explanation,
               q.difficulty, q.topic, q.aircraft, q.subject, q.ai_generated, q.status,
               q.source_material_id
        FROM questions q
        WHERE q.status IN ('approved', 'pending_review')
          AND (q.question_text LIKE ? OR q.explanation LIKE ? OR q.topic LIKE ?)
        ORDER BY q.created_at DESC
        LIMIT 20
      `;
      try {
        const { results } = await db.prepare(qSql).bind(likeQ, likeQ, likeQ).all<any>();
        questionResults = results.map((q) => ({
          ...q,
          options: JSON.parse(q.options_json || "[]"),
        }));
      } catch (e) {
        console.warn("Question search error:", e);
      }
    }

    return NextResponse.json({
      success: true,
      query: queryTerm,
      count: materialResults.length + questionResults.length,
      results: materialResults,
      questions: questionResults,
    });
  } catch (err: any) {
    console.error("Search Error:", err);
    return NextResponse.json({ error: err.message || "Search failed" }, { status: 500 });
  }
}
