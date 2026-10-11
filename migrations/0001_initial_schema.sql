-- CrewVault D1 Initial Schema

-- 1. Users & RBAC Roles (MEMBER, MANAGER, ADMIN)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('MEMBER', 'MANAGER', 'ADMIN')) DEFAULT 'MEMBER',
    airline TEXT,
    aircraft_studied TEXT, -- JSON array e.g. ["Q400", "A320"]
    subjects_studied TEXT, -- JSON array
    avatar_url TEXT,
    is_suspended BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. User Sessions
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Materials
CREATE TABLE IF NOT EXISTS materials (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    material_type TEXT NOT NULL, -- 'Previous Exam', 'Study Notes', 'Question Bank', 'PowerPoint', 'Training Manual', 'Procedure', 'Study Guide', 'Flashcards', 'Other'
    subject TEXT NOT NULL,
    aircraft TEXT,
    airline TEXT,
    course TEXT,
    difficulty TEXT CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced', 'All Levels')) DEFAULT 'All Levels',
    year INTEGER,
    uploader_id TEXT NOT NULL REFERENCES users(id),
    current_version_id TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    rejection_reason TEXT,
    views_count INTEGER DEFAULT 0,
    downloads_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Material Versions
CREATE TABLE IF NOT EXISTS material_versions (
    id TEXT PRIMARY KEY,
    material_id TEXT NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    r2_key_original TEXT NOT NULL,
    r2_key_markdown TEXT,
    r2_key_text TEXT,
    filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    extracted_markdown TEXT,
    extracted_text TEXT,
    processing_status TEXT CHECK (processing_status IN ('processing', 'completed', 'failed')) DEFAULT 'processing',
    uploader_id TEXT NOT NULL REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(material_id, version_number)
);

-- 5. Tags & Material Tags
CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS material_tags (
    material_id TEXT NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (material_id, tag_id)
);

-- 6. Posts & Attachments
CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT,
    status TEXT NOT NULL CHECK (status IN ('published', 'hidden', 'flagged')) DEFAULT 'published',
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS post_attachments (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    material_id TEXT REFERENCES materials(id) ON DELETE SET NULL,
    file_r2_key TEXT,
    file_name TEXT,
    file_mime_type TEXT
);

-- 7. Question Banks & Master Questions
CREATE TABLE IF NOT EXISTS question_banks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    aircraft TEXT,
    subject TEXT,
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    question_bank_id TEXT REFERENCES question_banks(id) ON DELETE SET NULL,
    question_text TEXT NOT NULL,
    options_json TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    difficulty TEXT DEFAULT 'Medium',
    topic TEXT NOT NULL,
    aircraft TEXT,
    subject TEXT,
    source_material_id TEXT REFERENCES materials(id) ON DELETE SET NULL,
    source_version_id TEXT REFERENCES material_versions(id) ON DELETE SET NULL,
    source_page INTEGER,
    source_section TEXT,
    ai_generated BOOLEAN DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('pending_review', 'approved', 'rejected')) DEFAULT 'approved',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 8. Exams
CREATE TABLE IF NOT EXISTS exams (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    aircraft TEXT,
    subject TEXT,
    difficulty TEXT,
    total_questions INTEGER NOT NULL,
    time_limit_minutes INTEGER NOT NULL,
    passing_percentage INTEGER NOT NULL DEFAULT 80,
    randomize_questions BOOLEAN DEFAULT 1,
    randomize_answers BOOLEAN DEFAULT 1,
    is_official BOOLEAN DEFAULT 0,
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exam_questions (
    exam_id TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    question_order INTEGER,
    PRIMARY KEY (exam_id, question_id)
);

-- 9. Immutable Exam Sessions
CREATE TABLE IF NOT EXISTS exam_sessions (
    id TEXT PRIMARY KEY,
    exam_id TEXT REFERENCES exams(id) ON DELETE SET NULL,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exam_type TEXT NOT NULL DEFAULT 'Practice',
    status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed', 'expired')) DEFAULT 'in_progress',
    question_snapshots_json TEXT NOT NULL,
    time_limit_minutes INTEGER NOT NULL,
    passing_percentage INTEGER NOT NULL,
    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME,
    score INTEGER,
    total_score INTEGER,
    percentage REAL,
    passed BOOLEAN,
    performance_analysis_json TEXT
);

CREATE TABLE IF NOT EXISTS exam_answers (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL,
    selected_option TEXT,
    is_correct BOOLEAN,
    time_spent_seconds INTEGER DEFAULT 0,
    answered_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 10. Adaptive User Stats
CREATE TABLE IF NOT EXISTS user_question_stats (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    subject TEXT NOT NULL,
    total_attempted INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, topic, subject)
);

-- 11. Bookmarks / Library
CREATE TABLE IF NOT EXISTS bookmarks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL CHECK (item_type IN ('material', 'exam', 'post', 'question')),
    item_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, item_type, item_id)
);

-- 12. Targeted Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    target_type TEXT NOT NULL CHECK (target_type IN ('all', 'aircraft', 'airline', 'course', 'subject', 'user')),
    target_value TEXT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('material', 'exam', 'announcement', 'approval', 'result', 'recommendation', 'system')),
    link TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_notifications (
    id TEXT PRIMARY KEY,
    notification_id TEXT NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(notification_id, user_id)
);

CREATE TABLE IF NOT EXISTS notification_preferences (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    notify_new_exams BOOLEAN DEFAULT 1,
    notify_new_materials BOOLEAN DEFAULT 1,
    notify_announcements BOOLEAN DEFAULT 1,
    notify_recommended BOOLEAN DEFAULT 1,
    notify_results BOOLEAN DEFAULT 1
);

-- 13. Reports, Moderation, Audit Logs
CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    reporter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL CHECK (item_type IN ('material', 'post', 'question')),
    item_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    details TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'resolved', 'dismissed')) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS moderation_actions (
    id TEXT PRIMARY KEY,
    moderator_id TEXT NOT NULL REFERENCES users(id),
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    actor_id TEXT REFERENCES users(id),
    action TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    details_json TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
