-- Migration 0009: D1 Storage Fallback (zero-credit-card deployment)
CREATE TABLE IF NOT EXISTS file_blobs (
    key TEXT PRIMARY KEY,
    data TEXT,
    mime_type TEXT,
    size INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_file_blobs_key ON file_blobs(key);
