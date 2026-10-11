import { NextResponse } from "next/server";
import { getDB, generateId } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { checkUserUploadQuota, buildR2OriginalKey } from "@/lib/storage";

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
  "text/plain",
  "text/markdown",
  "image/png",
  "image/jpeg",
  "text/csv",
];

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { filename, mime_type, size_bytes, is_new_version, existing_material_id } = body;

    if (!filename || !mime_type || !size_bytes) {
      return NextResponse.json({ error: "Missing filename, mime_type, or size_bytes" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(mime_type) && !filename.match(/\.(pdf|docx|pptx|txt|md|png|jpg|jpeg|csv)$/i)) {
      return NextResponse.json(
        { error: "Unsupported file type. Allowed formats: PDF, DOCX, PPTX, TXT, MD, Images, CSV." },
        { status: 400 }
      );
    }

    const db = await getDB();
    const quotaCheck = await checkUserUploadQuota(user.id, size_bytes, db);
    if (!quotaCheck.allowed) {
      return NextResponse.json({ error: quotaCheck.reason }, { status: 403 });
    }

    const materialId = is_new_version && existing_material_id ? existing_material_id : generateId("mat");
    const versionId = generateId("ver");
    const r2Key = buildR2OriginalKey(materialId, versionId, filename);

    return NextResponse.json({
      success: true,
      material_id: materialId,
      version_id: versionId,
      r2_key_original: r2Key,
      upload_token: `${materialId}:${versionId}`,
    });
  } catch (err: any) {
    console.error("Upload URL Error:", err);
    return NextResponse.json({ error: err.message || "Failed to authorize upload" }, { status: 500 });
  }
}
