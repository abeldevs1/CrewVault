import { NextResponse } from "next/server";
import { getDB, generateId } from "@/lib/db";
import { requireAuth, getCurrentUser } from "@/lib/auth";
import { getR2Bucket, buildR2OriginalKey, buildR2DerivedKey } from "@/lib/storage";
import { processUploadedFile } from "@/lib/parser";
import { AIService } from "@/lib/ai/client";
import { sendTargetedNotification } from "@/lib/notifications";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const aircraft = searchParams.get("aircraft");
    const airline = searchParams.get("airline");
    const subject = searchParams.get("subject");
    const material_type = searchParams.get("material_type");
    const difficulty = searchParams.get("difficulty");
    const mineOnly = searchParams.get("mine") === "true";
    const statusParam = searchParams.get("status");
    const schoolFinalCategory = searchParams.get("school_final_category");

    const db = await getDB();
    const currentUser = await getCurrentUser();

    let query = `
      SELECT m.id, m.title, m.description, m.material_type, m.subject, m.aircraft, 
             m.airline, m.course, m.difficulty, m.year, m.uploader_id, m.current_version_id, 
             m.status, m.visibility, m.views_count, m.downloads_count, m.created_at, m.updated_at,
             m.school_final_category,
             u.full_name as uploader_name,
             mv.filename, mv.mime_type, mv.size_bytes, mv.extracted_markdown,
             mv.bundle_file_count, mv.bundle_files_meta_json
      FROM materials m
      JOIN users u ON m.uploader_id = u.id
      LEFT JOIN material_versions mv ON m.current_version_id = mv.id
      WHERE 1=1
    `;

    const bindings: any[] = [];

    // Filter by ownership or visibility
    if (mineOnly) {
      if (!currentUser) {
        return NextResponse.json({ success: true, materials: [] });
      }
      query += " AND m.uploader_id = ?";
      bindings.push(currentUser.id);
    } else if (currentUser?.role === "ADMIN" || currentUser?.role === "MANAGER") {
      if (statusParam) {
        query += " AND m.status = ?";
        bindings.push(statusParam);
      }
    } else if (currentUser) {
      // Authenticated members see approved materials OR their own materials
      query += " AND ((m.status = 'approved' AND (m.is_published = 1 OR m.is_published IS NULL)) OR m.uploader_id = ?)";
      bindings.push(currentUser.id);
    } else {
      // Unauthenticated guests only see approved public materials
      query += " AND m.status = 'approved' AND (m.is_published = 1 OR m.is_published IS NULL) AND (m.visibility = 'public' OR m.visibility IS NULL)";
    }

    // Check if boilerplate materials should be hidden from regular members
    try {
      const hideBpRow = await db
        .prepare("SELECT value FROM system_settings WHERE key = 'hide_boilerplate'")
        .first<any>();
      if (hideBpRow && hideBpRow.value === "true") {
        if (!currentUser || currentUser.role === "MEMBER") {
          query += " AND (m.is_boilerplate = 0 OR m.is_boilerplate IS NULL)";
        }
      }
    } catch (e) {}

    if (aircraft) {
      query += " AND m.aircraft = ?";
      bindings.push(aircraft);
    }
    if (airline) {
      query += " AND m.airline = ?";
      bindings.push(airline);
    }
    if (subject) {
      query += " AND m.subject = ?";
      bindings.push(subject);
    }
    if (material_type) {
      query += " AND m.material_type = ?";
      bindings.push(material_type);
    }
    if (difficulty) {
      query += " AND m.difficulty = ?";
      bindings.push(difficulty);
    }
    if (search) {
      query += " AND (m.title LIKE ? OR m.description LIKE ? OR m.subject LIKE ?)";
      bindings.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (schoolFinalCategory) {
      query += " AND m.school_final_category = ?";
      bindings.push(schoolFinalCategory);
    }

    query += " ORDER BY m.created_at DESC LIMIT 50";

    const { results } = await db.prepare(query).bind(...bindings).all<any>();

    return NextResponse.json({ success: true, materials: results });
  } catch (err: any) {
    console.error("GET Materials Error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch materials" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const formData = await request.formData();

    const incomingFiles = formData.getAll("files") as File[];
    const singleFile = formData.get("file") as File | null;
    const allFiles = incomingFiles.length > 0 ? incomingFiles : singleFile ? [singleFile] : [];

    const title = formData.get("title") as string;
    const description = (formData.get("description") as string) || "";
    const material_type = (formData.get("material_type") as string) || "Study Notes";
    const subject = (formData.get("subject") as string) || "General Aviation";
    const aircraft = (formData.get("aircraft") as string) || "Q400";
    const airline = (formData.get("airline") as string) || "Global Aviation";
    const course = (formData.get("course") as string) || "";
    const difficulty = (formData.get("difficulty") as string) || "All Levels";
    const yearStr = formData.get("year") as string;
    const year = yearStr ? parseInt(yearStr, 10) : new Date().getFullYear();
    const school_final_category = (formData.get("school_final_category") as string) || null;

    if (allFiles.length === 0 || !title) {
      return NextResponse.json({ error: "File and title are required" }, { status: 400 });
    }

    const primaryFile = allFiles[0];
    const fileBuffer = await primaryFile.arrayBuffer();
    const materialId = generateId("mat");
    const versionId = generateId("ver");
    const r2KeyOriginal = buildR2OriginalKey(materialId, versionId, primaryFile.name);
    const r2KeyMarkdown = buildR2DerivedKey(materialId, versionId, "markdown");
    const r2KeyText = buildR2DerivedKey(materialId, versionId, "text");

    // 1. Save ALL files to R2 individually and track bundle metadata
    const bundleFilesMeta: {
      name: string;
      mime: string;
      size: number;
      r2_key: string;
      index: number;
      extracted_markdown?: string;
      extracted_text?: string;
    }[] = [];
    try {
      const bucket = await getR2Bucket();
      for (let i = 0; i < allFiles.length; i++) {
        const f = allFiles[i];
        const fKey = i === 0 ? r2KeyOriginal : buildR2OriginalKey(materialId, versionId, `${i}_${f.name}`);
        const fBuf = await f.arrayBuffer();
        await bucket.put(fKey, fBuf, { httpMetadata: { contentType: f.type || "application/octet-stream" } });
        bundleFilesMeta.push({ name: f.name, mime: f.type || "application/octet-stream", size: f.size, r2_key: fKey, index: i });
      }
    } catch (r2Err) {
      console.warn("R2 upload fallback mode:", r2Err);
      // Still record metadata even if R2 not available
      allFiles.forEach((f, i) => {
        const fKey = i === 0 ? r2KeyOriginal : buildR2OriginalKey(materialId, versionId, `${i}_${f.name}`);
        bundleFilesMeta.push({ name: f.name, mime: f.type || "application/octet-stream", size: f.size, r2_key: fKey, index: i });
      });
    }

    // 2. Process Files Pipeline (single file or ordered multi-file bundle)
    let parsed: any;
    if (allFiles.length === 1) {
      parsed = await processUploadedFile(fileBuffer, primaryFile.name, primaryFile.type);
      if (bundleFilesMeta[0]) {
        bundleFilesMeta[0].extracted_markdown = parsed.extracted_markdown;
        bundleFilesMeta[0].extracted_text = parsed.extracted_text;
      }
    } else {
      // Process each file in the user's specified sequence and concatenate markdown/text
      const mdSections: string[] = [`# ${title}\n\n*(Multi-page bundle containing ${allFiles.length} ordered files)*\n`];
      const textSections: string[] = [];
      const aggregatedQuestions: any[] = [];
      let totalWords = 0;

      for (let i = 0; i < allFiles.length; i++) {
        const f = allFiles[i];
        const buf = await f.arrayBuffer();
        const p = await processUploadedFile(buf, f.name, f.type);
        mdSections.push(`## Section ${i + 1}: ${f.name.replace(/\.[^/.]+$/, "")}\n\n${p.extracted_markdown}`);
        textSections.push(p.extracted_text);
        if (p.detected_questions && p.detected_questions.length > 0) {
          aggregatedQuestions.push(...p.detected_questions);
        }
        totalWords += p.metadata?.word_count || 0;
        if (bundleFilesMeta[i]) {
          bundleFilesMeta[i].extracted_markdown = p.extracted_markdown;
          bundleFilesMeta[i].extracted_text = p.extracted_text;
        }
      }

      parsed = {
        extracted_text: textSections.join("\n\n"),
        extracted_markdown: mdSections.join("\n\n---\n\n"),
        detected_questions: aggregatedQuestions,
        metadata: {
          word_count: totalWords,
          has_images: allFiles.some((f) => f.type.startsWith("image/")),
          quality_status: "processed",
        },
      };
    }

    // Save derived files to R2 if available
    try {
      const bucket = await getR2Bucket();
      await bucket.put(r2KeyMarkdown, parsed.extracted_markdown, {
        httpMetadata: { contentType: "text/markdown" },
      });
      await bucket.put(r2KeyText, parsed.extracted_text, {
        httpMetadata: { contentType: "text/plain" },
      });
    } catch (e) {}

    const db = await getDB();

    // Default status: Managers/Admins auto-approve, Members submit to pending queue
    const initialStatus = user.role === "MANAGER" || user.role === "ADMIN" ? "approved" : "pending";

    // 3. Create Material record
    await db
      .prepare(
        `INSERT INTO materials 
         (id, title, description, material_type, subject, aircraft, airline, course, difficulty, year, uploader_id, current_version_id, status, school_final_category)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        materialId,
        title,
        description,
        material_type,
        subject,
        aircraft,
        airline,
        course,
        difficulty,
        year,
        user.id,
        versionId,
        initialStatus,
        school_final_category
      )
      .run();

    // 4. Create Material Version record
    await db
      .prepare(
        `INSERT INTO material_versions 
         (id, material_id, version_number, r2_key_original, r2_key_markdown, r2_key_text, filename, mime_type, size_bytes, extracted_markdown, extracted_text, processing_status, uploader_id, bundle_file_count, bundle_files_meta_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        versionId,
        materialId,
        1,
        r2KeyOriginal,
        r2KeyMarkdown,
        r2KeyText,
        allFiles.length === 1 ? primaryFile.name : `${primaryFile.name} (+${allFiles.length - 1} files)`,
        primaryFile.type || "application/octet-stream",
        allFiles.reduce((acc, f) => acc + f.size, 0),
        parsed.extracted_markdown,
        parsed.extracted_text,
        "completed",
        user.id,
        allFiles.length,
        JSON.stringify(bundleFilesMeta)
      )
      .run();

    // 5. Save Extracted Document Questions into Question Bank
    if (parsed.detected_questions.length > 0) {
      const qStatements = parsed.detected_questions.map((q: any) => {
        const qId = generateId("q");
        return db
          .prepare(
            `INSERT INTO questions 
             (id, question_text, options_json, correct_answer, explanation, difficulty, topic, aircraft, subject, source_material_id, source_version_id, ai_generated, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .bind(
            qId,
            q.question_text,
            JSON.stringify(q.options),
            q.correct_answer,
            q.explanation || "Extracted from document",
            "Medium",
            subject,
            aircraft,
            subject,
            materialId,
            versionId,
            0,
            initialStatus === "approved" ? "approved" : "pending_review"
          );
      });
      await db.batch(qStatements);
    }

    // 6. Automatic AI question extraction for "Previous Exam" or "Question Bank" materials
    if (
      (material_type === "Previous Exam" || material_type === "Question Bank") &&
      parsed.extracted_text &&
      parsed.extracted_text.trim().length > 50
    ) {
      try {
        const aiQuestions = await AIService.extractQuestions(
          parsed.extracted_text,
          materialId,
          versionId
        );

        if (aiQuestions.length > 0) {
          const aiStatements = aiQuestions.map((q) => {
            const qId = generateId("q_ai");
            return db
              .prepare(
                `INSERT INTO questions 
                 (id, question_text, options_json, correct_answer, explanation, difficulty, topic, aircraft, subject, source_material_id, source_version_id, source_section, ai_generated, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`
              )
              .bind(
                qId,
                q.question_text,
                JSON.stringify(q.options || []),
                q.correct_answer || "",
                q.explanation || `AI-extracted question from ${title}`,
                q.difficulty || "Medium",
                q.topic || subject,
                aircraft,
                subject,
                materialId,
                versionId,
                q.source_section || "Document Text",
                initialStatus === "approved" ? "approved" : "pending_review"
              );
          });
          await db.batch(aiStatements);
        }
      } catch (aiErr) {
        console.warn("AI Question extraction failed on upload, skipping non-fatal:", aiErr);
      }
    }

    // 7. Send Targeted Notification if approved
    if (initialStatus === "approved") {
      await sendTargetedNotification({
        target_type: "aircraft",
        target_value: aircraft,
        title: `New ${aircraft} Study Material Uploaded`,
        message: `${title} (${material_type}) is now available in the library.`,
        category: "material",
        link: `/materials/${materialId}`,
      });
    }

    return NextResponse.json({
      success: true,
      material_id: materialId,
      version_id: versionId,
      status: initialStatus,
      message:
        initialStatus === "approved"
          ? "Material published successfully!"
          : "Material uploaded and submitted for manager review.",
    });
  } catch (err: any) {
    console.error("Upload Material Error:", err);
    return NextResponse.json({ error: err.message || "Failed to process upload" }, { status: 500 });
  }
}
