import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { getCurrentUser, requireRole } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    const db = await getDB();

    const curriculum = await db
      .prepare(
        `SELECT c.*, u.full_name as creator_name
         FROM curricula c
         JOIN users u ON c.created_by = u.id
         WHERE c.id = ?`
      )
      .bind(id)
      .first<any>();

    if (!curriculum) {
      return NextResponse.json({ error: "Curriculum not found" }, { status: 404 });
    }

    const rawModules = JSON.parse(curriculum.modules_json || "[]");

    // Gather all material IDs to resolve titles in a single query
    const allMaterialIds: string[] = [];
    const allExamIds: string[] = [];

    rawModules.forEach((m: any) => {
      if (Array.isArray(m.material_ids)) allMaterialIds.push(...m.material_ids);
      if (m.quiz_exam_id) allExamIds.push(m.quiz_exam_id);
    });

    if (curriculum.safety_final_exam_id) allExamIds.push(curriculum.safety_final_exam_id);
    if (curriculum.service_final_exam_id) allExamIds.push(curriculum.service_final_exam_id);
    if (curriculum.school_final_exam_id) allExamIds.push(curriculum.school_final_exam_id);

    // Fetch resolved material records
    const materialMap: Record<string, any> = {};
    if (allMaterialIds.length > 0) {
      const placeholders = allMaterialIds.map(() => "?").join(", ");
      const { results } = await db
        .prepare(`SELECT id, title, material_type, subject, aircraft FROM materials WHERE id IN (${placeholders})`)
        .bind(...allMaterialIds)
        .all<any>();
      (results || []).forEach((m) => {
        materialMap[m.id] = m;
      });
    }

    // Fetch resolved exam records
    const examMap: Record<string, any> = {};
    if (allExamIds.length > 0) {
      const placeholders = allExamIds.map(() => "?").join(", ");
      const { results } = await db
        .prepare(`SELECT id, title, subject, aircraft, total_questions, time_limit_minutes FROM exams WHERE id IN (${placeholders})`)
        .bind(...allExamIds)
        .all<any>();
      (results || []).forEach((e) => {
        examMap[e.id] = e;
      });
    }

    // Attach resolved objects to modules
    const resolvedModules = rawModules.map((m: any) => ({
      ...m,
      materials: (m.material_ids || []).map((mId: string) => materialMap[mId] || { id: mId, title: "Study Document" }),
      quiz: m.quiz_exam_id ? examMap[m.quiz_exam_id] || { id: m.quiz_exam_id, title: "Module Quiz" } : null,
    }));

    // Fetch user progress if authenticated
    let userProgress: any = null;
    if (user) {
      const prog = await db
        .prepare(`SELECT * FROM user_curriculum_progress WHERE user_id = ? AND curriculum_id = ?`)
        .bind(user.id, id)
        .first<any>();

      if (prog) {
        const completedMats = JSON.parse(prog.completed_material_ids_json || "[]");
        const completedQuizzes = JSON.parse(prog.completed_quiz_ids_json || "[]");

        let totalItems = allMaterialIds.length + (rawModules.filter((m: any) => m.quiz_exam_id).length);
        if (curriculum.has_safety_final) totalItems += 1;
        if (curriculum.has_service_final) totalItems += 1;
        if (curriculum.has_school_final) totalItems += 1;

        let completedItems = completedMats.length + completedQuizzes.length;
        if (prog.safety_final_score !== null && prog.safety_final_score !== undefined) completedItems += 1;
        if (prog.service_final_score !== null && prog.service_final_score !== undefined) completedItems += 1;
        if (prog.school_final_score !== null && prog.school_final_score !== undefined) completedItems += 1;

        const progressPct = totalItems > 0 ? Math.min(100, Math.round((completedItems / totalItems) * 100)) : 0;

        userProgress = {
          id: prog.id,
          status: prog.status,
          completed_materials: completedMats,
          completed_quizzes: completedQuizzes,
          safety_final_score: prog.safety_final_score,
          service_final_score: prog.service_final_score,
          school_final_score: prog.school_final_score,
          graduated_at: prog.graduated_at,
          progress_percentage: prog.status === "completed" ? 100 : progressPct,
        };
      }
    }

    return NextResponse.json({
      success: true,
      curriculum: {
        ...curriculum,
        modules: resolvedModules,
        safety_final: curriculum.safety_final_exam_id ? examMap[curriculum.safety_final_exam_id] || null : null,
        service_final: curriculum.service_final_exam_id ? examMap[curriculum.service_final_exam_id] || null : null,
        school_final: curriculum.school_final_exam_id ? examMap[curriculum.school_final_exam_id] || null : null,
        has_safety_final: !!curriculum.has_safety_final,
        has_service_final: !!curriculum.has_service_final,
        has_school_final: !!curriculum.has_school_final,
        user_progress: userProgress,
      },
    });
  } catch (err: any) {
    console.error("GET Curriculum Details Error:", err);
    return NextResponse.json({ error: err.message || "Failed to load curriculum" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(["ADMIN", "MANAGER"]);
    const { id } = await params;
    const db = await getDB();

    await db.prepare(`DELETE FROM curricula WHERE id = ?`).bind(id).run();

    return NextResponse.json({ success: true, message: "Curriculum deleted successfully" });
  } catch (err: any) {
    console.error("DELETE Curriculum Error:", err);
    return NextResponse.json({ error: err.message || "Failed to delete curriculum" }, { status: 500 });
  }
}
