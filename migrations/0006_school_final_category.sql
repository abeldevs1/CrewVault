-- Migration 0006: School Final Category & bundle file tracking
ALTER TABLE materials ADD COLUMN school_final_category TEXT;
-- Values: 'Safety Final', 'Service Final', 'Both', NULL (=general)
ALTER TABLE material_versions ADD COLUMN bundle_file_count INTEGER DEFAULT 1;
ALTER TABLE material_versions ADD COLUMN bundle_files_meta_json TEXT;
-- Each entry: [{"name":"file.pdf","mime":"application/pdf","size":1234,"r2_key":"..."}]
