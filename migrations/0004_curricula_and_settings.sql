-- 0. System Settings (e.g., hide_boilerplate, allow_registration)
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Default setting: show boilerplate materials initially
INSERT OR IGNORE INTO system_settings (key, value) VALUES ('hide_boilerplate', 'false');

-- 1. Add boilerplate and sort order flags to materials if not present
-- Note: SQLite allows ALTER TABLE ADD COLUMN
ALTER TABLE materials ADD COLUMN is_boilerplate BOOLEAN DEFAULT 0;
ALTER TABLE materials ADD COLUMN sort_order INTEGER DEFAULT 0;

-- 2. Curricula Table
CREATE TABLE IF NOT EXISTS curricula (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    aircraft TEXT,
    airline TEXT,
    category TEXT DEFAULT 'Initial Training',
    estimated_duration TEXT DEFAULT '4 Weeks',
    modules_json TEXT NOT NULL DEFAULT '[]',
    safety_final_exam_id TEXT,
    service_final_exam_id TEXT,
    school_final_exam_id TEXT,
    has_safety_final BOOLEAN DEFAULT 1,
    has_service_final BOOLEAN DEFAULT 1,
    has_school_final BOOLEAN DEFAULT 1,
    passing_percentage INTEGER DEFAULT 80,
    is_published BOOLEAN DEFAULT 1,
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. User Curriculum Progress & Graduation
CREATE TABLE IF NOT EXISTS user_curriculum_progress (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    curriculum_id TEXT NOT NULL REFERENCES curricula(id) ON DELETE CASCADE,
    completed_material_ids_json TEXT DEFAULT '[]',
    completed_quiz_ids_json TEXT DEFAULT '[]',
    safety_final_score INTEGER,
    service_final_score INTEGER,
    school_final_score INTEGER,
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('enrolled', 'in_progress', 'completed')),
    graduated_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, curriculum_id)
);
