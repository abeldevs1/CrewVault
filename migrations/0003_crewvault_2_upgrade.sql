-- 0. Visibility and Privacy Columns for Materials & Posts
ALTER TABLE materials ADD COLUMN visibility TEXT DEFAULT 'public';
ALTER TABLE materials ADD COLUMN anonymous_uploader BOOLEAN DEFAULT 0;
ALTER TABLE posts ADD COLUMN visibility TEXT DEFAULT 'public';
ALTER TABLE posts ADD COLUMN anonymous_uploader BOOLEAN DEFAULT 0;

-- 1. Manager Applications
CREATE TABLE IF NOT EXISTS manager_applications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    experience TEXT NOT NULL,
    requested_responsibilities TEXT,
    supporting_info TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')) DEFAULT 'pending',
    reviewer_id TEXT REFERENCES users(id),
    review_notes TEXT,
    reviewed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Groups & Group Memberships
CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    course TEXT,
    aircraft TEXT,
    airline TEXT,
    is_private BOOLEAN DEFAULT 0,
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS group_memberships (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('member', 'moderator', 'owner')) DEFAULT 'member',
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, user_id)
);

-- 3. Direct Messaging (1-to-1)
CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    user_1_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_2_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    last_message_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_1_id, user_2_id)
);

CREATE TABLE IF NOT EXISTS direct_messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Aircraft Families & Variants DB
CREATE TABLE IF NOT EXISTS aircraft_families (
    id TEXT PRIMARY KEY,
    manufacturer TEXT NOT NULL,
    family_name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS aircraft_variants (
    id TEXT PRIMARY KEY,
    family_id TEXT NOT NULL REFERENCES aircraft_families(id) ON DELETE CASCADE,
    variant_name TEXT NOT NULL,
    door_configuration TEXT,
    capacity_passengers TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Saved Exam Definitions & Question Exposure Tracking
CREATE TABLE IF NOT EXISTS saved_exams (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    config_json TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_question_exposure (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    times_seen INTEGER DEFAULT 1,
    times_correct INTEGER DEFAULT 0,
    last_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, question_id)
);

-- 6. OpenRouter / AI Model Configuration & Usage Logs
CREATE TABLE IF NOT EXISTS ai_models_config (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL DEFAULT 'openrouter',
    task_type TEXT NOT NULL UNIQUE,
    model_id TEXT NOT NULL,
    max_tokens INTEGER DEFAULT 2000,
    temperature REAL DEFAULT 0.2,
    is_active BOOLEAN DEFAULT 1,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_usage_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    task_type TEXT NOT NULL,
    model_id TEXT NOT NULL,
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'fallback')),
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. Announcements & Delivery
CREATE TABLE IF NOT EXISTS announcements (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id TEXT NOT NULL REFERENCES users(id),
    target_type TEXT NOT NULL CHECK (target_type IN ('all', 'course', 'aircraft', 'group', 'department')),
    target_value TEXT,
    is_pinned BOOLEAN DEFAULT 0,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS announcement_deliveries (
    announcement_id TEXT NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT 0,
    read_at DATETIME,
    PRIMARY KEY (announcement_id, user_id)
);
