import { NextResponse } from "next/server";
import { getDB, generateId } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";
import { UserRole } from "@/types";

import { isValidEmail } from "@/lib/validation/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, full_name, role, airline, aircraft_studied, subjects_studied } = body;

    if (!email || !password || !full_name) {
      return NextResponse.json({ error: "Missing required fields (email, password, full_name)" }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address with a valid domain (e.g. name@airline.com)" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 });
    }

    const db = await getDB();

    // Check if email exists
    const existing = await db.prepare("SELECT id FROM users WHERE email = ?").bind(email.toLowerCase().trim()).first();
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    // Determine initial role (First user defaults to ADMIN for system bootstrap, all others are strictly MEMBER)
    let assignedRole: UserRole = "MEMBER";
    const userCount = await db.prepare("SELECT COUNT(*) as count FROM users").first<{ count: number }>();
    if (userCount && userCount.count === 0) {
      assignedRole = "ADMIN";
    } else {
      assignedRole = "MEMBER";
    }

    const userId = generateId("usr");
    const pwdHash = await hashPassword(password);
    const aircraftJson = JSON.stringify(aircraft_studied || ["Q400", "A320"]);
    const subjectsJson = JSON.stringify(subjects_studied || ["Flight Deck", "Emergency Equipment"]);

    await db
      .prepare(
        `INSERT INTO users (id, email, password_hash, full_name, role, airline, aircraft_studied, subjects_studied) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        userId,
        email.toLowerCase().trim(),
        pwdHash,
        full_name.trim(),
        assignedRole,
        airline || "Global Aviation",
        aircraftJson,
        subjectsJson
      )
      .run();

    // Create default notification preferences
    await db
      .prepare(`INSERT INTO notification_preferences (user_id) VALUES (?)`)
      .bind(userId)
      .run();

    const token = await createSession(userId);

    const userObj = {
      id: userId,
      email: email.toLowerCase().trim(),
      full_name: full_name.trim(),
      role: assignedRole,
      airline: airline || "Global Aviation",
      aircraft_studied: JSON.parse(aircraftJson),
      subjects_studied: JSON.parse(subjectsJson),
      is_suspended: false,
    };

    return NextResponse.json({ success: true, user: userObj, token });
  } catch (err: any) {
    console.error("Register Error:", err);
    return NextResponse.json({ error: err.message || "Failed to register account" }, { status: 500 });
  }
}
