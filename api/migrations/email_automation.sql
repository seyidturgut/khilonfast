-- Email Automation System Migration
-- api/migrations/email_automation.sql

CREATE TABLE IF NOT EXISTS email_sequences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    trigger_event ENUM('checkout_abandoned','purchase_completed','no_login_after_purchase') NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    restart_after_days INT NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS email_sequence_steps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sequence_id INT NOT NULL,
    step_order INT NOT NULL,
    delay_minutes INT NOT NULL,
    subject VARCHAR(500) NOT NULL,
    body_html TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sequence_id) REFERENCES email_sequences(id) ON DELETE CASCADE,
    INDEX idx_steps_sequence (sequence_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS email_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_type ENUM('checkout_email_entered','purchase_completed','login') NOT NULL,
    email VARCHAR(255) NOT NULL,
    user_id INT NULL,
    cart_data JSON NULL,
    metadata JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email_events_email (email),
    INDEX idx_email_events_type_created (event_type, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS email_queue (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    user_id INT NULL,
    sequence_id INT NULL,
    step_id INT NULL,
    event_id INT NULL,
    subject VARCHAR(500) NOT NULL,
    body_html TEXT NOT NULL,
    status ENUM('pending','sent','failed','cancelled') NOT NULL DEFAULT 'pending',
    scheduled_at TIMESTAMP NOT NULL,
    sent_at TIMESTAMP NULL,
    error_message TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email_queue_status_scheduled (status, scheduled_at),
    INDEX idx_email_queue_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS email_unsubscribes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
