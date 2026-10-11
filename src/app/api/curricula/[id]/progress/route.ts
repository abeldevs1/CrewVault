import { NextResponse } from "next/server";
import { getDB, generateId } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: curriculumId } = await params;
    const body = await request.json();
    const { action, material_id, quiz_exam_id, final_type, score } = body;

    const db = await getDB();

    // Verify curriculum exists
    const curriculum = await db
      .prepare(`SELECT * FROM curricula WHERE id = ?`)
      .bind(curriculumId)
      .first<any>();

    if (!curriculum) {
      return NextResponse.json({ error: "Curriculum not found" }, { status: 404 });
    }

    // Get or auto-create user enrollment progress
    let prog = await db
      .prepare(`SELECT * FROM user_curriculum_progress WHERE user_id = ? AND curriculum_id = ?`)
      .bind(user.id, curriculumId)
      .first<any>();

    if (!prog) {
      const newProgId = generateId("prog");
      await db
        .prepare(
          `INSERT INTO user_curriculum_progress 
           (id, user_id, curriculum_id, completed_material_ids_json, completed_quiz_ids_json, status)
           VALUES (?, ?, ?, '[]', '[]', 'in_progress')`
        )
        .bind(newProgId, user.id, curriculumId)
        .run();

      prog = await db
        .prepare(`SELECT * FROM user_curriculum_progress WHERE id = ?`)
        .bind(newProgId)
        .first<any>();
    }

    const completedMats: string[] = JSON.parse(prog.completed_material_ids_json || "[]");
    const completedQuizzes: string[] = JSON.parse(prog.completed_quiz_ids_json || "[]");
    let safetyScore = prog.safety_final_score;
    let serviceScore = prog.service_final_score;
    let schoolScore = prog.school_final_score;

    if (action === "complete_material" && material_id) {
      if (!completedMats.includes(material_id)) {
        completedMats.push(material_id);
      }
    } else if (action === "record_quiz" && quiz_exam_id) {
      if (!completedQuizzes.includes(quiz_exam_id)) {
        completedQuizzes.push(quiz_exam_id);
      }
    } else if (action === "record_final" && final_type) {
      const finalScoreNum = parseInt(score, 10) || 80;
      if (final_type === "safety") safetyScore = finalScoreNum;
      else if (final_type === "service") serviceScore = finalScoreNum;
      else if (final_type === "school") schoolScore = finalScoreNum;
    }

    // Check if ready for graduation
    const modules = JSON.parse(curriculum.modules_json || "[]");
    const allRequiredMatIds: string[] = [];
    const allRequiredQuizIds: string[] = [];

    modules.forEach((m: any) => {
      if (Array.isArray(m.material_ids)) allRequiredMatIds.push(...m.material_ids);
      if (m.quiz_exam_id) allRequiredQuizIds.push(m.quiz_exam_id);
    });

    const matsDone = allRequiredMatIds.every((id) => completedMats.includes(id));
    const quizzesDone = allRequiredQuizIds.every((id) => completedQuizzes.includes(id));
    const passingPct = curriculum.passing_percentage || 80;

    const safetyDone = !curriculum.has_safety_final || (safetyScore !== null && safetyScore >= passingPct);
    const serviceDone = !curriculum.has_service_final || (serviceScore !== null && serviceScore >= passingPct);
    const schoolDone = !curriculum.has_school_final || (schoolScore !== null && schoolScore >= passingPct);

    let newStatus = prog.status;
    let graduatedAt = prog.graduated_at;

    if (matsDone && quizzesDone && safetyDone && serviceDone && schoolDone) {
      newStatus = "completed";
      if (!graduatedAt) graduatedAt = new Date().toISOString();
    } else {
      newStatus = "in_progress";
    }

    await db
      .prepare(
        `UPDATE user_curriculum_progress 
         SET completed_material_ids_json = ?, completed_quiz_ids_json = ?,
             safety_final_score = ?, service_final_score = ?, school_final_score = ?,
             status = ?, graduated_at = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      )
      .bind(
        JSON.stringify(completedMats),
        JSON.stringify(completedQuizzes),
        safetyScore,
        serviceScore,
        schoolScore,
        newStatus,
        graduatedAt,
        prog.id
      )
      .run();

    return NextResponse.json({
      success: true,
      status: newStatus,
      graduated: newStatus === "completed",
      completed_materials_count: completedMats.length,
      completed_quizzes_count: completedQuizzes.length,
    });
  } catch (err: any) {
    console.error("Update Curriculum Progress Error:", err);
    return NextResponse.json({ error: err.message || "Failed to update progress" }, { status: 500 });
  }
}
