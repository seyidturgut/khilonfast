CREATE TABLE IF NOT EXISTS training_access_pages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(255) NOT NULL UNIQUE,
    product_key VARCHAR(100) NOT NULL,
    title_tr VARCHAR(255) DEFAULT NULL,
    title_en VARCHAR(255) DEFAULT NULL,
    description_tr TEXT DEFAULT NULL,
    description_en TEXT DEFAULT NULL,
    vimeo_url_tr TEXT DEFAULT NULL,
    vimeo_url_en TEXT DEFAULT NULL,
    canva_url_tr TEXT DEFAULT NULL,
    canva_url_en TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_training_access_pages_product_key (product_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE training_access_pages
    ADD COLUMN title_tr VARCHAR(255) DEFAULT NULL,
    ADD COLUMN title_en VARCHAR(255) DEFAULT NULL,
    ADD COLUMN description_tr TEXT DEFAULT NULL,
    ADD COLUMN description_en TEXT DEFAULT NULL,
    ADD COLUMN vimeo_url_tr TEXT DEFAULT NULL,
    ADD COLUMN vimeo_url_en TEXT DEFAULT NULL,
    ADD COLUMN canva_url_tr TEXT DEFAULT NULL,
    ADD COLUMN canva_url_en TEXT DEFAULT NULL;

UPDATE training_access_pages
SET vimeo_url_tr = COALESCE(NULLIF(vimeo_url_tr, ''), vimeo_url)
WHERE vimeo_url IS NOT NULL AND vimeo_url <> '';

UPDATE training_access_pages
SET canva_url_tr = COALESCE(NULLIF(canva_url_tr, ''), canva_url)
WHERE canva_url IS NOT NULL AND canva_url <> '';
