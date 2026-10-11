import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireAuth("ADMIN");
    const db = await getDB();

    const totalBytesRow = await db.prepare("SELECT SUM(size_bytes) as total FROM material_versions").first<any>();
    const totalBytes = totalBytesRow?.total || 0;
    const limitBytes = 10 * 1024 * 1024 * 1024; // 10 GB limit

    const usageRatio = totalBytes / limitBytes;
    const warning = usageRatio >= 0.75;

    const { results: topStorageUsers } = await db
      .prepare(
        `SELECT u.id, u.full_name, u.email, SUM(mv.size_bytes) as total_bytes, COUNT(m.id) as file_count
         FROM users u
         JOIN materials m ON u.id = m.uploader_id
         JOIN material_versions mv ON m.id = mv.material_id
         GROUP BY u.id
         ORDER BY total_bytes DESC
         LIMIT 10`
      )
      .all<any>();

    return NextResponse.json({
      success: true,
      storage: {
        used_bytes: totalBytes,
        used_gb: (totalBytes / (1024 * 1024 * 1024)).toFixed(2),
        limit_gb: 10,
        usage_percentage: (usageRatio * 100).toFixed(1),
        warning_triggered: warning,
      },
      top_storage_users: topStorageUsers,
    });
  } catch (err: any) {
    console.error("GET Admin Storage Error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch storage stats" }, { status: 500 });
  }
}
