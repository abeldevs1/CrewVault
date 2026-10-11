import { NextResponse } from "next/server";
import { getDB, generateId } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth";

export async function GET() {
  try {
    const db = await getDB();
    const { results: families } = await db
      .prepare(`SELECT * FROM aircraft_families WHERE is_active = 1 ORDER BY manufacturer, family_name`)
      .all<any>();

    const { results: variants } = await db
      .prepare(`SELECT * FROM aircraft_variants WHERE is_active = 1 ORDER BY variant_name`)
      .all<any>();

    const structured = families.map((fam) => ({
      ...fam,
      variants: variants.filter((v) => v.family_id === fam.id),
    }));

    return NextResponse.json({ success: true, aircraft: structured });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch aircraft" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireRole(["ADMIN"]);
    const body = await request.json();
    const { manufacturer, family_name, description } = body;

    if (!manufacturer || !family_name) {
      return NextResponse.json({ error: "Manufacturer and family name are required." }, { status: 400 });
    }

    const db = await getDB();
    const famId = generateId("fam");

    await db
      .prepare(
        `INSERT INTO aircraft_families (id, manufacturer, family_name, description)
         VALUES (?, ?, ?, ?)`
      )
      .bind(famId, manufacturer, family_name, description || null)
      .run();

    return NextResponse.json({
      success: true,
      family_id: famId,
      message: "Aircraft family added successfully.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create aircraft family" }, { status: 500 });
  }
}
