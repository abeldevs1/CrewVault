import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { maskEmail } from "@/lib/validation/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { full_name, airline } = body;

    if (!full_name || typeof full_name !== "string" || full_name.trim().length < 2) {
      return NextResponse.json(
        { error: "Please provide your full registered name." },
        { status: 400 }
      );
    }

    const db = await getDB();
    const trimmedName = full_name.trim();

    let query = `
      SELECT id, email, full_name, airline, created_at
      FROM users
      WHERE LOWER(full_name) LIKE LOWER(?)
    `;
    const bindings: any[] = [`%${trimmedName}%`];

    if (airline && airline !== "All" && airline.trim().length > 0) {
      query += ` AND LOWER(airline) LIKE LOWER(?)`;
      bindings.push(`%${airline.trim()}%`);
    }

    query += ` LIMIT 5`;

    const { results } = await db.prepare(query).bind(...bindings).all<any>();

    if (!results || results.length === 0) {
      return NextResponse.json({
        success: true,
        found: false,
        message: "No account found matching the provided name and airline.",
        accounts: [],
      });
    }

    // Return safely masked email accounts
    const accounts = results.map((row) => ({
      full_name: row.full_name,
      airline: row.airline,
      masked_email: maskEmail(row.email),
      registered_year: new Date(row.created_at).getFullYear(),
    }));

    return NextResponse.json({
      success: true,
      found: true,
      accounts,
      message: `Found ${accounts.length} matching account${accounts.length > 1 ? "s" : ""}.`,
    });
  } catch (err: any) {
    console.error("Forgot Email Lookup Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to look up account" },
      { status: 500 }
    );
  }
}
