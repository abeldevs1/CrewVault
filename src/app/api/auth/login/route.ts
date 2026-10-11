import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const db = await getDB();
    const userRow = await db
      .prepare(
        `SELECT id, email, password_hash, full_name, role, airline, 
                aircraft_studied, subjects_studied, avatar_url, is_suspended 
         FROM users WHERE email = ?`
      )
      .bind(email.toLowerCase().trim())
      .first<any>();

    if (!userRow) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (userRow.is_suspended) {
      return NextResponse.json({ error: "Account suspended. Please contact platform administration." }, { status: 403 });
    }

    const validPassword = await verifyPassword(password, userRow.password_hash);
    if (!validPassword) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = await createSession(userRow.id);

    const userObj = {
      id: userRow.id,
      email: userRow.email,
      full_name: userRow.full_name,
      role: userRow.role,
      airline: userRow.airline,
      aircraft_studied: userRow.aircraft_studied ? JSON.parse(userRow.aircraft_studied) : [],
      subjects_studied: userRow.subjects_studied ? JSON.parse(userRow.subjects_studied) : [],
      avatar_url: userRow.avatar_url,
      is_suspended: Boolean(userRow.is_suspended),
    };

    return NextResponse.json({ success: true, user: userObj, token });
  } catch (err: any) {
    console.error("Login Error:", err);
    return NextResponse.json({ error: err.message || "Failed to log in" }, { status: 500 });
  }
}
