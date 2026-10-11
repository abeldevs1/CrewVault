-- Migration 0007: Exam Deletion & Publishing controls
ALTER TABLE exams ADD COLUMN is_published BOOLEAN DEFAULT 1;
ALTER TABLE exams ADD COLUMN school_final_track TEXT;
ALTER TABLE materials ADD COLUMN is_published BOOLEAN DEFAULT 1;
