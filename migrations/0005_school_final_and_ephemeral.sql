-- Migration 0005: School Final, Ephemeral Expiry, and Multi-file Bundles
ALTER TABLE materials ADD COLUMN expires_at DATETIME;
ALTER TABLE materials ADD COLUMN curriculum_id TEXT;
ALTER TABLE materials ADD COLUMN module_index INTEGER;
ALTER TABLE material_versions ADD COLUMN bundle_files_json TEXT;
