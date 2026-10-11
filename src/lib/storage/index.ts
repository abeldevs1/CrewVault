import { getCloudflareBindings } from "../cloudflare-env";
import { D1Database } from "../db";

export interface R2Object {
  key: string;
  size: number;
  etag: string;
  uploaded: Date;
  httpMetadata?: Record<string, string>;
  body?: ReadableStream | ArrayBuffer | Buffer;
}

export interface R2Bucket {
  put(key: string, value: ReadableStream | ArrayBuffer | string | Buffer, options?: any): Promise<R2Object>;
  get(key: string): Promise<R2Object | null>;
  delete(key: string): Promise<void>;
}

/**
 * Fallback D1-backed storage when Cloudflare R2 is not enabled (e.g. no credit card on account).
 * Stores files as base64 in the `file_blobs` table in D1 SQLite.
 */
export class D1StorageBucket implements R2Bucket {
  private dbPromise: Promise<D1Database>;

  constructor(db?: D1Database) {
    if (db) {
      this.dbPromise = Promise.resolve(db);
    } else {
      this.dbPromise = import("../db").then((m) => m.getDB());
    }
  }

  async put(key: string, value: ReadableStream | ArrayBuffer | string | Buffer, options?: any): Promise<R2Object> {
    const db = await this.dbPromise;
    let base64Data: string;
    let size = 0;

    if (typeof value === "string") {
      base64Data = Buffer.from(value, "utf-8").toString("base64");
      size = Buffer.byteLength(value, "utf-8");
    } else if (Buffer.isBuffer(value)) {
      base64Data = value.toString("base64");
      size = value.byteLength;
    } else if (value instanceof ArrayBuffer) {
      const buf = Buffer.from(value);
      base64Data = buf.toString("base64");
      size = buf.byteLength;
    } else if (value && typeof (value as any).getReader === "function") {
      const reader = (value as ReadableStream).getReader();
      const chunks: Uint8Array[] = [];
      while (true) {
        const { done, value: chunk } = await reader.read();
        if (done) break;
        if (chunk) chunks.push(chunk);
      }
      const combined = Buffer.concat(chunks);
      base64Data = combined.toString("base64");
      size = combined.byteLength;
    } else {
      base64Data = "";
      size = 0;
    }

    const mime = options?.httpMetadata?.contentType || "application/octet-stream";

    await db
      .prepare(
        "INSERT INTO file_blobs (key, data, mime_type, size) VALUES (?, ?, ?, ?) ON CONFLICT(key) DO UPDATE SET data = excluded.data, mime_type = excluded.mime_type, size = excluded.size"
      )
      .bind(key, base64Data, mime, size)
      .run();

    const buf = Buffer.from(base64Data, "base64");
    return {
      key,
      size,
      etag: `d1-${Date.now()}`,
      uploaded: new Date(),
      httpMetadata: { contentType: mime },
      body: buf,
      text: async () => buf.toString("utf-8"),
      arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
      blob: async () => new Blob([buf], { type: mime }),
    } as any;
  }

  async get(key: string): Promise<R2Object | null> {
    const db = await this.dbPromise;
    const row = await db
      .prepare("SELECT data, mime_type, size, created_at FROM file_blobs WHERE key = ?")
      .bind(key)
      .first<{ data: string; mime_type: string; size: number; created_at: string }>();

    if (!row || !row.data) return null;

    const buf = Buffer.from(row.data, "base64");
    return {
      key,
      size: row.size || buf.byteLength,
      etag: "d1",
      uploaded: new Date(row.created_at || Date.now()),
      httpMetadata: { contentType: row.mime_type || "application/octet-stream" },
      body: buf,
      text: async () => buf.toString("utf-8"),
      arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
      blob: async () => new Blob([buf], { type: row.mime_type || "application/octet-stream" }),
    } as any;
  }

  async delete(key: string): Promise<void> {
    const db = await this.dbPromise;
    await db.prepare("DELETE FROM file_blobs WHERE key = ?").bind(key).run();
  }
}

export async function getR2Bucket(): Promise<R2Bucket> {
  const bindings = await getCloudflareBindings();
  if (bindings.STORAGE) {
    return bindings.STORAGE;
  }
  return new D1StorageBucket(bindings.DB);
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
