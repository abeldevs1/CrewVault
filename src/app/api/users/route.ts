import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const currentUser = await requireAuth();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    const db = await getDB();
    let sql = `
      SELECT id, full_name, email, role, airline, aircraft_studied
      FROM users
      WHERE id != ?
    `;
    const params: any[] = [currentUser.id];

    if (query.trim()) {
      sql += ` AND (full_name LIKE ? OR email LIKE ? OR airline LIKE ?)`;
      const term = `%${query.trim()}%`;
      params.push(term, term, term);
    }

    sql += ` ORDER BY full_name ASC LIMIT 50`;

    const { results } = await db.prepare(sql).bind(...params).all<any>();

    const users = (results || []).map((u) => ({
      id: u.id,
      full_name: u.full_name,
      email: u.email,
      role: u.role,
      airline: u.airline,
      aircraft_studied: u.aircraft_studied ? JSON.parse(u.aircraft_studied) : [],
    }));

    return NextResponse.json({ success: true, users });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to fetch users" },
      { status: 500 }
    );
  }
}
