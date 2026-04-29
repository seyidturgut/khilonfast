-- Add per-language PDF URL columns to training_lessons
ALTER TABLE training_lessons
    ADD COLUMN IF NOT EXISTS pdf_url_tr TEXT NULL AFTER pdf_url,
    ADD COLUMN IF NOT EXISTS pdf_url_en TEXT NULL AFTER pdf_url_tr;
