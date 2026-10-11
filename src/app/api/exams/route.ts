import { NextResponse } from "next/server";
import { getDB, generateId } from "@/lib/db";
import { requireAuth, getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const aircraft = searchParams.get("aircraft");
    const subject = searchParams.get("subject");

    const schoolFinalTrack = searchParams.get("school_final_track");

    const currentUser = await getCurrentUser();
    const isManagerOrAdmin = currentUser?.role === "MANAGER" || currentUser?.role === "ADMIN";

    const db = await getDB();
    let query = `
      SELECT e.id, e.title, e.description, e.aircraft, e.subject, e.difficulty, 
             e.total_questions, e.time_limit_minutes, e.passing_percentage, 
             e.is_official, e.is_published, e.school_final_track, e.created_at, u.full_name as creator_name
      FROM exams e
      JOIN users u ON e.created_by = u.id
      WHERE 1=1
    `;

    const bindings: any[] = [];

    if (!isManagerOrAdmin) {
      if (currentUser) {
        query += " AND (e.is_published = 1 OR e.is_published IS NULL OR e.created_by = ?)";
        bindings.push(currentUser.id);
      } else {
        query += " AND (e.is_published = 1 OR e.is_published IS NULL)";
      }
    }

    if (aircraft) {
      query += " AND e.aircraft = ?";
      bindings.push(aircraft);
    }
    if (subject) {
      query += " AND e.subject = ?";
      bindings.push(subject);
    }
    if (schoolFinalTrack) {
      query += " AND e.school_final_track = ?";
      bindings.push(schoolFinalTrack);
    }

    query += " ORDER BY e.is_official DESC, e.created_at DESC LIMIT 50";

    const { results } = await db.prepare(query).bind(...bindings).all<any>();

    return NextResponse.json({ success: true, exams: results });
  } catch (err: any) {
    console.error("GET Exams Error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch exams" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth("MANAGER");
    const body = await request.json();
    const { title, description, aircraft, subject, difficulty, total_questions, time_limit_minutes, passing_percentage, randomize_questions, randomize_answers, is_official } = body;

    if (!title || !total_questions || !time_limit_minutes) {
      return NextResponse.json({ error: "Missing required exam fields" }, { status: 400 });
    }

    const db = await getDB();
    const examId = generateId("exam");

    await db
      .prepare(
        `INSERT INTO exams 
         (id, title, description, aircraft, subject, difficulty, total_questions, time_limit_minutes, passing_percentage, randomize_questions, randomize_answers, is_official, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        examId,
        title,
        description || null,
        aircraft || "Q400",
        subject || "Flight Deck",
        difficulty || "Medium",
        total_questions,
        time_limit_minutes,
        passing_percentage || 80,
        randomize_questions ?? 1,
        randomize_answers ?? 1,
        is_official ? 1 : 0,
        user.id
      )
      .run();

    return NextResponse.json({ success: true, exam_id: examId, message: "Exam created successfully" });
  } catch (err: any) {
    console.error("POST Exam Error:", err);
    return NextResponse.json({ error: err.message || "Failed to create exam" }, { status: 500 });
  }
}
