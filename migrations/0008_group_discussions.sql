-- 0008_group_discussions.sql
-- Group discussions messages and index

CREATE TABLE IF NOT EXISTS group_messages (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_group_messages_group ON group_messages(group_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_group_memberships_user ON group_memberships(user_id, group_id);
