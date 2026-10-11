import { NextResponse } from "next/server";
import { getDB, generateId } from "@/lib/db";
import { requireAuth, getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const aircraft = searchParams.get("aircraft");
    const subject = searchParams.get("subject");
    const topic = searchParams.get("topic");
    const status = searchParams.get("status") || "approved";

    const db = await getDB();
    let query = `
      SELECT q.id, q.question_text, q.options_json, q.correct_answer, q.explanation, 
             q.difficulty, q.topic, q.aircraft, q.subject, q.source_material_id, 
             q.ai_generated, q.status, q.created_at
      FROM questions q
      WHERE q.status = ?
    `;

    const bindings: any[] = [status];

    if (aircraft) {
      query += " AND q.aircraft = ?";
      bindings.push(aircraft);
    }
    if (subject) {
      query += " AND q.subject = ?";
      bindings.push(subject);
    }
    if (topic) {
      query += " AND q.topic = ?";
      bindings.push(topic);
    }

    query += " ORDER BY q.created_at DESC LIMIT 100";

    const { results } = await db.prepare(query).bind(...bindings).all<any>();

    const formatted = results.map((q) => ({
      ...q,
      options: JSON.parse(q.options_json || "[]"),
    }));

    return NextResponse.json({ success: true, questions: formatted });
  } catch (err: any) {
    console.error("GET Questions Error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch questions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { question_text, options, correct_answer, explanation, difficulty, topic, aircraft, subject, source_material_id } = body;

    if (!question_text || !options || options.length < 2 || !correct_answer || !topic) {
      return NextResponse.json({ error: "Missing required question fields" }, { status: 400 });
    }

    const db = await getDB();
    const questionId = generateId("q");
    const initialStatus = user.role === "MANAGER" || user.role === "ADMIN" ? "approved" : "pending_review";

    await db
      .prepare(
        `INSERT INTO questions 
         (id, question_text, options_json, correct_answer, explanation, difficulty, topic, aircraft, subject, source_material_id, ai_generated, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        questionId,
        question_text,
        JSON.stringify(options),
        correct_answer,
        explanation || null,
        difficulty || "Medium",
        topic,
        aircraft || "Q400",
        subject || "Flight Deck",
        source_material_id || null,
        0,
        initialStatus
      )
      .run();

    return NextResponse.json({
      success: true,
      question_id: questionId,
      status: initialStatus,
      message: initialStatus === "approved" ? "Question added to bank" : "Question submitted for manager approval",
    });
  } catch (err: any) {
    console.error("POST Question Error:", err);
    return NextResponse.json({ error: err.message || "Failed to create question" }, { status: 500 });
  }
}
