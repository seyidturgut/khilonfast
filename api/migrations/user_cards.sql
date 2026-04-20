-- user_cards: Lidio kart token saklama
-- Kart Saklama Modeli: Firmaya Özel

CREATE TABLE IF NOT EXISTS user_cards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    lidio_token VARCHAR(255) NOT NULL,
    masked_number VARCHAR(20) NOT NULL,
    card_brand VARCHAR(30) NULL DEFAULT NULL,
    expire_month INT NOT NULL,
    expire_year INT NOT NULL,
    card_holder_name VARCHAR(255) NULL DEFAULT NULL,
    is_default TINYINT(1) NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_cards_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_cards_user (user_id),
    UNIQUE KEY uniq_user_token (user_id, lidio_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- subscriptions tablosuna yenileme alanları
ALTER TABLE subscriptions
    ADD COLUMN IF NOT EXISTS renewal_card_id INT NULL DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS next_renewal_at TIMESTAMP NULL DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS auto_renew TINYINT(1) NOT NULL DEFAULT 0;

-- FK ayrı çünkü tablo henüz yoksa ALTER TABLE IF NOT EXISTS FK ekleyemez
SET @fk_exists = (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'subscriptions'
      AND CONSTRAINT_NAME = 'fk_subscriptions_card'
);
SET @sql = IF(@fk_exists = 0,
    'ALTER TABLE subscriptions ADD CONSTRAINT fk_subscriptions_card FOREIGN KEY (renewal_card_id) REFERENCES user_cards(id) ON DELETE SET NULL',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Cron key için settings kaydı (yoksa ekle)
INSERT IGNORE INTO settings (setting_key, setting_value, setting_type, label, description)
VALUES (
    'subscription_cron_key',
    SHA2(CONCAT('khilon', UNIX_TIMESTAMP(), RAND()), 256),
    'text',
    'Abonelik Yenileme Cron Key',
    'POST /api/subscription-renewal/run endpointini koruma altına alan gizli key. cPanel cron Header olarak gönderilmeli: X-Cron-Key: <değer>'
);
