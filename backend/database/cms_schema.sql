-- CMS Extensions for Khilonfast Database

-- 1. Extend Users Table for Admin Roles
-- Note: Run this only if 'role' column doesn't exist
ALTER TABLE users ADD COLUMN role ENUM('user', 'admin', 'editor') DEFAULT 'user';

-- 2. Modify Products Table for Digital & Subscriptions
-- Adding new types and duration tracking
ALTER TABLE products ADD COLUMN type ENUM('service', 'subscription', 'video_course', 'digital_download') DEFAULT 'service';
ALTER TABLE products ADD COLUMN duration_days INT DEFAULT NULL COMMENT 'Duration in days for subscriptions';
ALTER TABLE products ADD COLUMN access_content_url VARCHAR(255) DEFAULT NULL COMMENT 'URL for digital content or video page';

-- 3. CMS Tables

-- Pages Table: Stores SEO and Metadata
CREATE TABLE IF NOT EXISTS cms_pages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    meta_title VARCHAR(255),
    meta_description TEXT,
    is_active BOOLEAN DEFAULT FALSE,
    template_type VARCHAR(50) DEFAULT 'default', -- e.g., 'service', 'landing', 'blog'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Page Contents Table: Stores the Drag & Drop Structure
CREATE TABLE IF NOT EXISTS cms_page_contents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    page_id INT NOT NULL,
    version INT DEFAULT 1,
    content_json JSON NOT NULL COMMENT 'Stores the array of blocks/components',
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (page_id) REFERENCES cms_pages(id) ON DELETE CASCADE,
    INDEX idx_page_id (page_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Settings Table: Key-Value store for System Configs
CREATE TABLE IF NOT EXISTS settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT,
    setting_group VARCHAR(50) NOT NULL, -- 'payment', 'seo', 'mail'
    description VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Menus Table: For Dynamic Navigation
CREATE TABLE IF NOT EXISTS cms_menus (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL, -- 'header', 'footer'
    items_json JSON NOT NULL, -- Tree structure of menu items
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Initial Settings Data (Defaults)
INSERT INTO settings (setting_key, setting_value, setting_group, description) VALUES
('site_title', 'KhilonFast', 'general', 'Website Title'),
('google_analytics_id', '', 'seo', 'GA4 Measurement ID'),
('smtp_host', 'smtp.example.com', 'mail', 'SMTP Host'),
('smtp_port', '587', 'mail', 'SMTP Port'),
('payment_provider', 'lidio', 'payment', 'Active Payment Provider'),
('contact_email', 'info@khilonfast.com', 'general', 'Contact Email')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);
