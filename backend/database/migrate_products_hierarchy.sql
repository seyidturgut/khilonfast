-- Migration: Comprehensive Hierarchical Product Structure
-- Step 1: Add parent_id if it doesn't exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS parent_id INT DEFAULT NULL;
ALTER TABLE products ADD CONSTRAINT fk_parent_id FOREIGN KEY (parent_id) REFERENCES products(id) ON DELETE CASCADE;
ALTER TABLE products ADD INDEX idx_parent_id (parent_id);

-- Step 2: Create Main Service products (Parents)
INSERT INTO products (product_key, name, description, price, currency, category, type)
VALUES 
-- Hizmetlerimiz
('service-seo', 'SEO Yönetimi', 'Arama motoru optimizasyonu hizmetleri.', 0, 'TRY', 'hizmetler', 'service'),
('service-gtm', 'Go To Market Stratejisi', 'Pazara giriş stratejisi.', 0, 'USD', 'hizmetler', 'service'),
('service-content-strategy', 'İçerik Stratejisi', 'İçerik pazarlama stratejisi.', 0, 'TRY', 'hizmetler', 'service'),
('service-integrated-marketing', 'Bütünleşik Dijital Pazarlama', 'Kapsamlı dijital pazarlama.', 0, 'TRY', 'hizmetler', 'service'),
('service-google-ads', 'Google Ads', 'Google reklam yönetimi.', 0, 'TRY', 'hizmetler', 'service'),
('service-social-ads', 'Sosyal Medya Reklamcılığı', 'Sosyal medya reklam yönetimi.', 0, 'TRY', 'hizmetler', 'service'),
('service-content-production', 'İçerik Üretimi', 'Profesyonel içerik üretimi.', 0, 'TRY', 'hizmetler', 'service'),
('service-b2b-email', 'B2B Email Pazarlama', 'B2B odaklı email pazarlama.', 0, 'TRY', 'hizmetler', 'service'),
('service-maestro-ai', 'Maestro AI', 'Yapay zeka destekli pazarlama.', 0, 'TRY', 'hizmetler', 'service'),

-- Sektörel Hizmetler
('service-b2b-360', 'B2B 360 Pazarlama Yönetimi', 'Sektör odaklı 360 derece pazarlama.', 0, 'TRY', 'sektorler', 'service'),
('service-payment-systems', 'Ödeme Sistemleri Pazarlama Yönetimi', 'Ödeme sistemlerine özel pazarlama.', 0, 'TRY', 'sektorler', 'service'),
('service-industrial-food', 'Endüstriyel Gıda Şef Çözümleri Pazarlama', 'Gıda sektörüne özel pazarlama.', 0, 'TRY', 'sektorler', 'service'),
('service-fintech-360', 'Fintech 360 Pazarlama Yönetimi', 'Fintech dünyasına özel pazarlama.', 0, 'TRY', 'sektorler', 'service'),
('service-tech-software', 'Teknoloji Yazılım 360 Pazarlama', 'Teknoloji ve yazılım firmaları için.', 0, 'TRY', 'sektorler', 'service'),
('service-energy', 'Enerji Firmaları 360 Pazarlama', 'Enerji sektörüne özel pazarlama.', 0, 'TRY', 'sektorler', 'service'),
('service-interior-design', 'Ofis Kurumsal İç Tasarım 360 Pazarlama', 'İç tasarım firmalarına özel.', 0, 'TRY', 'sektorler', 'service'),
('service-fleet-rental', 'Filo Kiralama Firmaları 360 Pazarlama', 'Filo kiralama sektörüne özel.', 0, 'TRY', 'sektorler', 'service'),
('service-manufacturing', 'Üretim Sektörü Firmaları 360 Pazarlama', 'Üretim sektörüne özel pazarlama.', 0, 'TRY', 'sektorler', 'service')
ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), category=VALUES(category);

-- Step 3: Populate packages for each service
-- Hizmetler
INSERT IGNORE INTO products (product_key, name, price, currency, category, parent_id)
SELECT CONCAT(p.product_key, '-core'), CONCAT(p.name, ' - Core'), 32000, 'TRY', p.category, p.id FROM products p WHERE p.product_key IN ('service-seo', 'service-google-ads', 'service-social-ads', 'service-maestro-ai', 'service-b2b-email', 'service-content-production', 'service-content-strategy', 'service-integrated-marketing');

INSERT IGNORE INTO products (product_key, name, price, currency, category, parent_id)
SELECT CONCAT(p.product_key, '-growth'), CONCAT(p.name, ' - Growth'), 48000, 'TRY', p.category, p.id FROM products p WHERE p.product_key IN ('service-seo', 'service-google-ads', 'service-social-ads', 'service-maestro-ai', 'service-b2b-email', 'service-content-production', 'service-content-strategy', 'service-integrated-marketing');

INSERT IGNORE INTO products (product_key, name, price, currency, category, parent_id)
SELECT CONCAT(p.product_key, '-ultimate'), CONCAT(p.name, ' - Ultimate'), 85000, 'TRY', p.category, p.id FROM products p WHERE p.product_key IN ('service-seo', 'service-google-ads', 'service-social-ads', 'service-maestro-ai', 'service-b2b-email', 'service-content-production', 'service-content-strategy', 'service-integrated-marketing');

-- GTM (USD Prices)
INSERT IGNORE INTO products (product_key, name, price, currency, category, parent_id)
SELECT CONCAT(p.product_key, '-core'), CONCAT(p.name, ' - Core'), 9900, 'USD', p.category, p.id FROM products p WHERE p.product_key = 'service-gtm';
INSERT IGNORE INTO products (product_key, name, price, currency, category, parent_id)
SELECT CONCAT(p.product_key, '-growth'), CONCAT(p.name, ' - Growth'), 14900, 'USD', p.category, p.id FROM products p WHERE p.product_key = 'service-gtm';
INSERT IGNORE INTO products (product_key, name, price, currency, category, parent_id)
SELECT CONCAT(p.product_key, '-ultimate'), CONCAT(p.name, ' - Ultimate'), 29900, 'USD', p.category, p.id FROM products p WHERE p.product_key = 'service-gtm';

-- Sektörler (Assume same 32/48/85 TRY pricing for now, user can adjust in admin)
INSERT IGNORE INTO products (product_key, name, price, currency, category, parent_id)
SELECT CONCAT(p.product_key, '-core'), CONCAT(p.name, ' - Core'), 32000, 'TRY', p.category, p.id FROM products p WHERE p.category = 'sektorler' AND p.type = 'service';

INSERT IGNORE INTO products (product_key, name, price, currency, category, parent_id)
SELECT CONCAT(p.product_key, '-growth'), CONCAT(p.name, ' - Growth'), 48000, 'TRY', p.category, p.id FROM products p WHERE p.category = 'sektorler' AND p.type = 'service';

INSERT IGNORE INTO products (product_key, name, price, currency, category, parent_id)
SELECT CONCAT(p.product_key, '-ultimate'), CONCAT(p.name, ' - Ultimate'), 85000, 'TRY', p.category, p.id FROM products p WHERE p.category = 'sektorler' AND p.type = 'service';
