-- Danışmanlar tablosu
CREATE TABLE IF NOT EXISTS consultants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    title VARCHAR(200),
    bio TEXT,
    photo_url VARCHAR(500),
    stars DECIMAL(2,1) DEFAULT 5.0,
    review_count INT DEFAULT 0,
    sectors JSON COMMENT 'Array of sector slugs e.g. ["fintech","filo-kiralama"]',
    ical_url VARCHAR(500) NULL,
    ical_sync_enabled TINYINT(1) NOT NULL DEFAULT 0,
    ical_last_sync TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- iCal senkronizasyon alanları (migration — mevcut tabloya ekle)
-- ALTER TABLE consultants
--   ADD COLUMN ical_url VARCHAR(500) NULL AFTER sectors,
--   ADD COLUMN ical_sync_enabled TINYINT(1) NOT NULL DEFAULT 0 AFTER ical_url,
--   ADD COLUMN ical_last_sync TIMESTAMP NULL AFTER ical_sync_enabled;

-- Danışman hizmetleri
CREATE TABLE IF NOT EXISTS consultant_services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    consultant_id INT NOT NULL,
    category ENUM('hizli','strateji','ust_duzey') NOT NULL,
    parent_service_id INT DEFAULT NULL,
    title VARCHAR(300) NOT NULL,
    title_en VARCHAR(300),
    description TEXT,
    description_en TEXT,
    scope_items JSON COMMENT 'Array of scope bullet points',
    scope_items_en JSON,
    duration_text VARCHAR(100),
    sessions_text VARCHAR(100),
    price DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'TRY',
    plus_vat BOOLEAN DEFAULT TRUE,
    cta_text VARCHAR(100) DEFAULT 'Randevu Al',
    cta_text_en VARCHAR(100) DEFAULT 'Book Now',
    badge_text VARCHAR(100),
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (consultant_id) REFERENCES consultants(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_service_id) REFERENCES consultant_services(id) ON DELETE SET NULL,
    INDEX idx_consultant (consultant_id),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Takvim slotları
CREATE TABLE IF NOT EXISTS consultant_availability (
    id INT AUTO_INCREMENT PRIMARY KEY,
    consultant_id INT NOT NULL,
    service_id INT DEFAULT NULL,
    available_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status ENUM('available','held','booked') DEFAULT 'available',
    held_until TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (consultant_id) REFERENCES consultants(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES consultant_services(id) ON DELETE SET NULL,
    INDEX idx_consultant_date (consultant_id, available_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Rezervasyon talepleri
CREATE TABLE IF NOT EXISTS consultant_bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    consultant_id INT NOT NULL,
    service_id INT NOT NULL,
    availability_id INT DEFAULT NULL,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(200) NOT NULL,
    phone VARCHAR(50),
    company VARCHAR(200),
    topic TEXT,
    status ENUM('pending','confirmed','cancelled','completed') DEFAULT 'pending',
    meeting_link VARCHAR(500),
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (consultant_id) REFERENCES consultants(id),
    FOREIGN KEY (service_id) REFERENCES consultant_services(id),
    FOREIGN KEY (availability_id) REFERENCES consultant_availability(id) ON DELETE SET NULL,
    INDEX idx_consultant (consultant_id),
    INDEX idx_status (status),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
