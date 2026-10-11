import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getR2Bucket } from "@/lib/storage";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const download = searchParams.get("download") === "1";
    const type = searchParams.get("type") || "original"; // 'original' | 'markdown' | 'text'

    const db = await getDB();
    const currentUser = await getCurrentUser();

    // Fetch material and current version
    const material = await db
      .prepare(
        `SELECT m.id, m.title, m.status, m.uploader_id, m.visibility,
                mv.filename, mv.mime_type, mv.r2_key_original, mv.r2_key_markdown, mv.r2_key_text, mv.bundle_files_meta_json
         FROM materials m
         LEFT JOIN material_versions mv ON m.current_version_id = mv.id
         WHERE m.id = ?`
      )
      .bind(id)
      .first<any>();

    if (!material) {
      return new NextResponse("Material not found", { status: 404 });
    }

    // Permission and Visibility check
    if (material.status !== "approved") {
      if (!currentUser) {
        return new NextResponse("Unauthorized", { status: 401 });
      }
      if (currentUser.role === "MEMBER" && currentUser.id !== material.uploader_id) {
        return new NextResponse("Forbidden: Material is pending moderation", { status: 403 });
      }
    }

    if (material.visibility === "private" && (!currentUser || (currentUser.id !== material.uploader_id && currentUser.role !== "ADMIN"))) {
      return new NextResponse("Forbidden: Private material", { status: 403 });
    }

    let targetKey = material.r2_key_original;
    let contentType = material.mime_type || "application/octet-stream";
    let filename = material.filename || "document";

    // Support serving individual files from multi-file bundles
    const bundleIndexStr = searchParams.get("bundle_index");
    if (bundleIndexStr !== null && type === "original") {
      const bundleIndex = parseInt(bundleIndexStr, 10);
      if (!isNaN(bundleIndex) && material.bundle_files_meta_json) {
        try {
          const bundleFiles = JSON.parse(material.bundle_files_meta_json) as { name: string; mime: string; r2_key: string; index: number }[];
          const bundleFile = bundleFiles.find((f) => f.index === bundleIndex) || bundleFiles[bundleIndex];
          if (bundleFile) {
            targetKey = bundleFile.r2_key;
            contentType = bundleFile.mime || "application/octet-stream";
            filename = bundleFile.name;
          }
        } catch (e) {
          // Fall through to primary file
        }
      }
    }

    if (type === "markdown") {
      targetKey = material.r2_key_markdown;
      contentType = "text/markdown; charset=utf-8";
      filename = `${material.title}.md`;
    } else if (type === "text") {
      targetKey = material.r2_key_text;
      contentType = "text/plain; charset=utf-8";
      filename = `${material.title}.txt`;
    }

    if (!targetKey) {
      return new NextResponse("File record has no storage key", { status: 404 });
    }

    const bucket = await getR2Bucket();
    const object = await bucket.get(targetKey);

    if (!object || !object.body) {
      return new NextResponse("File object not found in storage bucket", { status: 404 });
    }

    const disposition = download ? "attachment" : "inline";

    return new Response(object.body as any, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `${disposition}; filename="${encodeURIComponent(filename)}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err: any) {
    console.error("GET Material File Error:", err);
    return new NextResponse(`Failed to stream file: ${err.message}`, { status: 500 });
  }
}
