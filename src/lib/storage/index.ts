import { getCloudflareBindings } from "../cloudflare-env";
import { D1Database } from "../db";

export interface R2Object {
  key: string;
  size: number;
  etag: string;
  uploaded: Date;
  httpMetadata?: Record<string, string>;
  body?: ReadableStream | ArrayBuffer;
}

export interface R2Bucket {
  put(key: string, value: ReadableStream | ArrayBuffer | string, options?: any): Promise<R2Object>;
  get(key: string): Promise<R2Object | null>;
  delete(key: string): Promise<void>;
}

export async function getR2Bucket(): Promise<R2Bucket> {
  const bindings = await getCloudflareBindings();
  if (bindings.STORAGE) {
    return bindings.STORAGE;
  }
  throw new Error("Cloudflare R2 Bucket binding 'STORAGE' not found in environment.");
}

export function buildR2OriginalKey(materialId: string, versionId: string, filename: string): string {
  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `originals/${materialId}/${versionId}/${sanitized}`;
}

export function buildR2DerivedKey(materialId: string, versionId: string, type: 'markdown' | 'text'): string {
  const ext = type === 'markdown' ? 'md' : 'txt';
  return `derived/${materialId}/${versionId}/${type}.${ext}`;
}

// Check user upload limits & quotas
export async function checkUserUploadQuota(
  userId: string,
  newFileSizeBytes: number,
  db: D1Database
): Promise<{ allowed: boolean; reason?: string }> {
  const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB per file limit
  const MEMBER_QUOTA_BYTES = 500 * 1024 * 1024; // 500 MB per member limit
  const DAILY_MAX_UPLOADS = 5;

  if (newFileSizeBytes > MAX_FILE_SIZE_BYTES) {
    return { allowed: false, reason: `File size exceeds maximum allowed limit of 100 MB.` };
  }

  // Check daily uploads
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const dailyUploads = await db
    .prepare("SELECT COUNT(*) as count FROM materials WHERE uploader_id = ? AND created_at >= ?")
    .bind(userId, todayStart.toISOString())
    .first();

  if (dailyUploads && (dailyUploads as any).count >= DAILY_MAX_UPLOADS) {
    return { allowed: false, reason: `Daily upload limit of ${DAILY_MAX_UPLOADS} files reached. Please try again tomorrow.` };
  }

  // Check personal storage usage
  const totalStorage = await db
    .prepare(
      `SELECT SUM(mv.size_bytes) as total 
       FROM material_versions mv 
       JOIN materials m ON mv.material_id = m.id 
       WHERE m.uploader_id = ?`
    )
    .bind(userId)
    .first();

  const currentUsage = (totalStorage as any)?.total || 0;
  if (currentUsage + newFileSizeBytes > MEMBER_QUOTA_BYTES) {
    const usedMB = (currentUsage / (1024 * 1024)).toFixed(1);
    return { allowed: false, reason: `Storage quota exceeded (${usedMB} MB / 500 MB used). Delete existing files to free up space.` };
  }

  return { allowed: true };
}
