import { NextResponse } from "next/server";
import { getDB, generateId } from "@/lib/db";
import { getCurrentUser, requireRole } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    const db = await getDB();

    const { results } = await db
      .prepare(
        `SELECT c.*, u.full_name as creator_name
         FROM curricula c
         JOIN users u ON c.created_by = u.id
         WHERE c.is_published = 1
         ORDER BY c.created_at DESC`
      )
      .all<any>();

    let userProgressMap: Record<string, any> = {};
    if (user) {
      const { results: progressList } = await db
        .prepare(`SELECT * FROM user_curriculum_progress WHERE user_id = ?`)
        .bind(user.id)
        .all<any>();

      (progressList || []).forEach((p) => {
        userProgressMap[p.curriculum_id] = {
          status: p.status,
          completed_materials: JSON.parse(p.completed_material_ids_json || "[]"),
          completed_quizzes: JSON.parse(p.completed_quiz_ids_json || "[]"),
          safety_final_score: p.safety_final_score,
          service_final_score: p.service_final_score,
          school_final_score: p.school_final_score,
          graduated_at: p.graduated_at,
        };
      });
    }

    const curricula = (results || []).map((row) => {
      const modules = JSON.parse(row.modules_json || "[]");
      const prog = userProgressMap[row.id];

      // Calculate progress percentage if enrolled
      let progressPct = 0;
      if (prog) {
        let totalItems = 0;
        let completedItems = 0;

        modules.forEach((m: any) => {
          totalItems += (m.material_ids || []).length;
          if (m.quiz_exam_id) totalItems += 1;
        });

        if (row.has_safety_final) totalItems += 1;
        if (row.has_service_final) totalItems += 1;
        if (row.has_school_final) totalItems += 1;

        completedItems += (prog.completed_materials || []).length;
        completedItems += (prog.completed_quizzes || []).length;
        if (prog.safety_final_score !== null && prog.safety_final_score !== undefined) completedItems += 1;
        if (prog.service_final_score !== null && prog.service_final_score !== undefined) completedItems += 1;
        if (prog.school_final_score !== null && prog.school_final_score !== undefined) completedItems += 1;

        progressPct = totalItems > 0 ? Math.min(100, Math.round((completedItems / totalItems) * 100)) : 0;
        if (prog.status === "completed") progressPct = 100;
      }

      return {
        ...row,
        modules,
        has_safety_final: !!row.has_safety_final,
        has_service_final: !!row.has_service_final,
        has_school_final: !!row.has_school_final,
        is_published: !!row.is_published,
        user_progress: prog
          ? {
              ...prog,
              progress_percentage: progressPct,
            }
          : null,
      };
    });

    return NextResponse.json({ success: true, curricula });
  } catch (err: any) {
    console.error("GET Curricula Error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch curricula" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole(["ADMIN", "MANAGER"]);
    const body = await request.json();
    const {
      title,
      description,
      aircraft,
      airline,
      category = "Initial Training",
      estimated_duration = "4 Weeks",
      modules = [],
      has_safety_final = true,
      safety_final_exam_id = null,
      has_service_final = true,
      service_final_exam_id = null,
      has_school_final = false,
      school_final_exam_id = null,
      passing_percentage = 80,
    } = body;

    if (!title || typeof title !== "string" || title.trim().length < 3) {
      return NextResponse.json({ error: "Curriculum title is required" }, { status: 400 });
    }

    const db = await getDB();
    const curriculumId = generateId("curric");

    await db
      .prepare(
        `INSERT INTO curricula 
         (id, title, description, aircraft, airline, category, estimated_duration, modules_json, 
          safety_final_exam_id, service_final_exam_id, school_final_exam_id, 
          has_safety_final, has_service_final, has_school_final, passing_percentage, is_published, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`
      )
      .bind(
        curriculumId,
        title.trim(),
        description || "",
        aircraft || "General / All Fleet (Non-Aircraft Specific)",
        airline || "Global Aviation",
        category,
        estimated_duration,
        JSON.stringify(modules),
        safety_final_exam_id,
        service_final_exam_id,
        school_final_exam_id,
        has_safety_final ? 1 : 0,
        has_service_final ? 1 : 0,
        has_school_final ? 1 : 0,
        passing_percentage,
        user.id
      )
      .run();

    return NextResponse.json({
      success: true,
      curriculum_id: curriculumId,
      message: `Curriculum "${title}" crafted and published successfully!`,
    });
  } catch (err: any) {
    console.error("POST Curriculum Error:", err);
    return NextResponse.json({ error: err.message || "Failed to create curriculum" }, { status: 500 });
  }
}
