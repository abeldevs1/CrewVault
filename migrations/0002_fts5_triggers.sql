-- Verified D1-Compatible FTS5 Search Table & Triggers

CREATE VIRTUAL TABLE IF NOT EXISTS materials_fts USING fts5(
    material_id UNINDEXED,
    title,
    description,
    markdown_content,
    subject,
    aircraft,
    airline,
    course
);

-- Trigger for INSERT on materials
DROP TRIGGER IF EXISTS materials_fts_insert;
CREATE TRIGGER materials_fts_insert AFTER INSERT ON materials
WHEN NEW.status = 'approved'
BEGIN
    INSERT INTO materials_fts(material_id, title, description, markdown_content, subject, aircraft, airline, course)
    SELECT NEW.id, NEW.title, NEW.description, mv.extracted_markdown, NEW.subject, NEW.aircraft, NEW.airline, NEW.course
    FROM material_versions mv WHERE mv.id = NEW.current_version_id;
END;

-- Trigger for UPDATE on materials
DROP TRIGGER IF EXISTS materials_fts_update;
CREATE TRIGGER materials_fts_update AFTER UPDATE ON materials
BEGIN
    DELETE FROM materials_fts WHERE material_id = OLD.id;
    INSERT INTO materials_fts(material_id, title, description, markdown_content, subject, aircraft, airline, course)
    SELECT NEW.id, NEW.title, NEW.description, mv.extracted_markdown, NEW.subject, NEW.aircraft, NEW.airline, NEW.course
    FROM material_versions mv WHERE mv.id = NEW.current_version_id AND NEW.status = 'approved';
END;

-- Trigger for DELETE on materials
DROP TRIGGER IF EXISTS materials_fts_delete;
CREATE TRIGGER materials_fts_delete AFTER DELETE ON materials
BEGIN
    DELETE FROM materials_fts WHERE material_id = OLD.id;
END;
