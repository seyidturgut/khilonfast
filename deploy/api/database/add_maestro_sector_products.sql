-- Migration: Add Maestro AI sector-specific products
-- Run this script to add the 7 new Maestro AI sector pages to the admin products table.
-- Each sector gets its own parent product + 2 packages (Kredili / Sınırsız).
--
-- Admin'de her sektör için ayrı bir Maestro AI ürünü oluşturulur.
-- Bu sayede her sektörün satış ve kullanım takibi bağımsız yapılabilir.

-- ─────────────────────────────────────────────────────────────
-- 1. B2B
-- ─────────────────────────────────────────────────────────────
INSERT INTO products (product_key, name, name_en, slug, slug_en, price, currency, category, type, is_active,
    description, description_en, meta_title, meta_title_en, meta_description, meta_description_en)
VALUES (
    'service-maestro-ai-b2b',
    'Maestro AI (B2B)',
    'Maestro AI (B2B)',
    'urunler/maestro-ai-b2b',
    'products/maestro-ai-b2b',
    1200, 'TRY', 'Ürünler', 'subscription', 1,
    'B2B sektörüne özel Maestro AI pazarlama stratejisti.',
    'Maestro AI marketing strategist specialized for the B2B sector.',
    'B2B Pazarlama Stratejinizi Maestro AI ile Yönetin – Khilonfast',
    'Manage Your B2B Marketing Strategy with Maestro AI – Khilonfast',
    'B2B sektörü için özelleştirilmiş Maestro AI ile pazarlama kararlarınızı hızlandırın.',
    'Accelerate your marketing decisions with Maestro AI specialized for the B2B sector.'
);

INSERT INTO products (product_key, name, name_en, price, currency, category, type, is_active, parent_id,
    description, description_en)
SELECT
    'maestro-b2b-kredili', 'Kredili Maestro (B2B)', 'Credited Maestro (B2B)',
    1200, 'TRY', 'Ürünler', 'subscription', 1, id,
    'B2B sektörüne özel Kredili Maestro paketi.', 'Credited Maestro package for B2B sector.'
FROM products WHERE product_key = 'service-maestro-ai-b2b' LIMIT 1;

INSERT INTO products (product_key, name, name_en, price, currency, category, type, is_active, parent_id,
    description, description_en)
SELECT
    'maestro-b2b-sinirsiz', 'Sınırsız Maestro (B2B)', 'Unlimited Maestro (B2B)',
    2000, 'TRY', 'Ürünler', 'subscription', 1, id,
    'B2B sektörüne özel Sınırsız Maestro paketi.', 'Unlimited Maestro package for B2B sector.'
FROM products WHERE product_key = 'service-maestro-ai-b2b' LIMIT 1;

-- ─────────────────────────────────────────────────────────────
-- 2. Ödeme Sistemleri
-- ─────────────────────────────────────────────────────────────
INSERT INTO products (product_key, name, name_en, slug, slug_en, price, currency, category, type, is_active,
    description, description_en, meta_title, meta_title_en, meta_description, meta_description_en)
VALUES (
    'service-maestro-ai-odeme-sistemleri',
    'Maestro AI (Ödeme Sistemleri)',
    'Maestro AI (Payment Systems)',
    'urunler/maestro-ai-odeme-sistemleri',
    'products/maestro-ai-payment-systems',
    1200, 'TRY', 'Ürünler', 'subscription', 1,
    'Ödeme sistemleri sektörüne özel Maestro AI pazarlama stratejisti.',
    'Maestro AI marketing strategist specialized for the payment systems sector.',
    'Ödeme Sistemleri Pazarlama Stratejinizi Maestro AI ile Yönetin – Khilonfast',
    'Manage Your Payment Systems Marketing Strategy with Maestro AI – Khilonfast',
    'Ödeme sistemleri sektörü için özelleştirilmiş Maestro AI ile pazarlama kararlarınızı hızlandırın.',
    'Accelerate your marketing decisions with Maestro AI specialized for the payment systems sector.'
);

INSERT INTO products (product_key, name, name_en, price, currency, category, type, is_active, parent_id,
    description, description_en)
SELECT
    'maestro-odeme-kredili', 'Kredili Maestro (Ödeme Sistemleri)', 'Credited Maestro (Payment Systems)',
    1200, 'TRY', 'Ürünler', 'subscription', 1, id,
    'Ödeme sistemleri sektörüne özel Kredili Maestro paketi.', 'Credited Maestro package for payment systems sector.'
FROM products WHERE product_key = 'service-maestro-ai-odeme-sistemleri' LIMIT 1;

INSERT INTO products (product_key, name, name_en, price, currency, category, type, is_active, parent_id,
    description, description_en)
SELECT
    'maestro-odeme-sinirsiz', 'Sınırsız Maestro (Ödeme Sistemleri)', 'Unlimited Maestro (Payment Systems)',
    2000, 'TRY', 'Ürünler', 'subscription', 1, id,
    'Ödeme sistemleri sektörüne özel Sınırsız Maestro paketi.', 'Unlimited Maestro package for payment systems sector.'
FROM products WHERE product_key = 'service-maestro-ai-odeme-sistemleri' LIMIT 1;

-- ─────────────────────────────────────────────────────────────
-- 3. Endüstriyel Gıda
-- ─────────────────────────────────────────────────────────────
INSERT INTO products (product_key, name, name_en, slug, slug_en, price, currency, category, type, is_active,
    description, description_en, meta_title, meta_title_en, meta_description, meta_description_en)
VALUES (
    'service-maestro-ai-endustriyel-gida',
    'Maestro AI (Endüstriyel Gıda)',
    'Maestro AI (Industrial Food)',
    'urunler/maestro-ai-endustriyel-gida',
    'products/maestro-ai-industrial-food',
    1200, 'TRY', 'Ürünler', 'subscription', 1,
    'Endüstriyel gıda sektörüne özel Maestro AI pazarlama stratejisti.',
    'Maestro AI marketing strategist specialized for the industrial food sector.',
    'Endüstriyel Gıda Pazarlama Stratejinizi Maestro AI ile Yönetin – Khilonfast',
    'Manage Your Industrial Food Marketing Strategy with Maestro AI – Khilonfast',
    'Endüstriyel gıda sektörü için özelleştirilmiş Maestro AI ile pazarlama kararlarınızı hızlandırın.',
    'Accelerate your marketing decisions with Maestro AI specialized for the industrial food sector.'
);

INSERT INTO products (product_key, name, name_en, price, currency, category, type, is_active, parent_id,
    description, description_en)
SELECT
    'maestro-gida-kredili', 'Kredili Maestro (Endüstriyel Gıda)', 'Credited Maestro (Industrial Food)',
    1200, 'TRY', 'Ürünler', 'subscription', 1, id,
    'Endüstriyel gıda sektörüne özel Kredili Maestro paketi.', 'Credited Maestro package for industrial food sector.'
FROM products WHERE product_key = 'service-maestro-ai-endustriyel-gida' LIMIT 1;

INSERT INTO products (product_key, name, name_en, price, currency, category, type, is_active, parent_id,
    description, description_en)
SELECT
    'maestro-gida-sinirsiz', 'Sınırsız Maestro (Endüstriyel Gıda)', 'Unlimited Maestro (Industrial Food)',
    2000, 'TRY', 'Ürünler', 'subscription', 1, id,
    'Endüstriyel gıda sektörüne özel Sınırsız Maestro paketi.', 'Unlimited Maestro package for industrial food sector.'
FROM products WHERE product_key = 'service-maestro-ai-endustriyel-gida' LIMIT 1;

-- ─────────────────────────────────────────────────────────────
-- 4. FinTech
-- ─────────────────────────────────────────────────────────────
INSERT INTO products (product_key, name, name_en, slug, slug_en, price, currency, category, type, is_active,
    description, description_en, meta_title, meta_title_en, meta_description, meta_description_en)
VALUES (
    'service-maestro-ai-fintech',
    'Maestro AI (FinTech)',
    'Maestro AI (FinTech)',
    'urunler/maestro-ai-fintech',
    'products/maestro-ai-fintech',
    1200, 'TRY', 'Ürünler', 'subscription', 1,
    'FinTech sektörüne özel Maestro AI pazarlama stratejisti.',
    'Maestro AI marketing strategist specialized for the FinTech sector.',
    'FinTech Pazarlama Stratejinizi Maestro AI ile Yönetin – Khilonfast',
    'Manage Your FinTech Marketing Strategy with Maestro AI – Khilonfast',
    'FinTech sektörü için özelleştirilmiş Maestro AI ile pazarlama kararlarınızı hızlandırın.',
    'Accelerate your marketing decisions with Maestro AI specialized for the FinTech sector.'
);

INSERT INTO products (product_key, name, name_en, price, currency, category, type, is_active, parent_id,
    description, description_en)
SELECT
    'maestro-fintech-kredili', 'Kredili Maestro (FinTech)', 'Credited Maestro (FinTech)',
    1200, 'TRY', 'Ürünler', 'subscription', 1, id,
    'FinTech sektörüne özel Kredili Maestro paketi.', 'Credited Maestro package for FinTech sector.'
FROM products WHERE product_key = 'service-maestro-ai-fintech' LIMIT 1;

INSERT INTO products (product_key, name, name_en, price, currency, category, type, is_active, parent_id,
    description, description_en)
SELECT
    'maestro-fintech-sinirsiz', 'Sınırsız Maestro (FinTech)', 'Unlimited Maestro (FinTech)',
    2000, 'TRY', 'Ürünler', 'subscription', 1, id,
    'FinTech sektörüne özel Sınırsız Maestro paketi.', 'Unlimited Maestro package for FinTech sector.'
FROM products WHERE product_key = 'service-maestro-ai-fintech' LIMIT 1;

-- ─────────────────────────────────────────────────────────────
-- 5. Enerji
-- ─────────────────────────────────────────────────────────────
INSERT INTO products (product_key, name, name_en, slug, slug_en, price, currency, category, type, is_active,
    description, description_en, meta_title, meta_title_en, meta_description, meta_description_en)
VALUES (
    'service-maestro-ai-enerji',
    'Maestro AI (Enerji)',
    'Maestro AI (Energy)',
    'urunler/maestro-ai-enerji',
    'products/maestro-ai-energy',
    1200, 'TRY', 'Ürünler', 'subscription', 1,
    'Enerji sektörüne özel Maestro AI pazarlama stratejisti.',
    'Maestro AI marketing strategist specialized for the energy sector.',
    'Enerji Sektörü Pazarlama Stratejinizi Maestro AI ile Yönetin – Khilonfast',
    'Manage Your Energy Sector Marketing Strategy with Maestro AI – Khilonfast',
    'Enerji sektörü için özelleştirilmiş Maestro AI ile pazarlama kararlarınızı hızlandırın.',
    'Accelerate your marketing decisions with Maestro AI specialized for the energy sector.'
);

INSERT INTO products (product_key, name, name_en, price, currency, category, type, is_active, parent_id,
    description, description_en)
SELECT
    'maestro-enerji-kredili', 'Kredili Maestro (Enerji)', 'Credited Maestro (Energy)',
    1200, 'TRY', 'Ürünler', 'subscription', 1, id,
    'Enerji sektörüne özel Kredili Maestro paketi.', 'Credited Maestro package for energy sector.'
FROM products WHERE product_key = 'service-maestro-ai-enerji' LIMIT 1;

INSERT INTO products (product_key, name, name_en, price, currency, category, type, is_active, parent_id,
    description, description_en)
SELECT
    'maestro-enerji-sinirsiz', 'Sınırsız Maestro (Enerji)', 'Unlimited Maestro (Energy)',
    2000, 'TRY', 'Ürünler', 'subscription', 1, id,
    'Enerji sektörüne özel Sınırsız Maestro paketi.', 'Unlimited Maestro package for energy sector.'
FROM products WHERE product_key = 'service-maestro-ai-enerji' LIMIT 1;

-- ─────────────────────────────────────────────────────────────
-- 6. Ofis & Kurumsal İç Tasarım
-- ─────────────────────────────────────────────────────────────
INSERT INTO products (product_key, name, name_en, slug, slug_en, price, currency, category, type, is_active,
    description, description_en, meta_title, meta_title_en, meta_description, meta_description_en)
VALUES (
    'service-maestro-ai-ofis-tasarim',
    'Maestro AI (Ofis & İç Tasarım)',
    'Maestro AI (Office & Interior Design)',
    'urunler/maestro-ai-ofis-tasarim',
    'products/maestro-ai-office-interior-design',
    1200, 'TRY', 'Ürünler', 'subscription', 1,
    'Ofis & kurumsal iç tasarım sektörüne özel Maestro AI pazarlama stratejisti.',
    'Maestro AI marketing strategist specialized for the office & corporate interior design sector.',
    'Ofis & Kurumsal İç Tasarım Pazarlama Stratejinizi Maestro AI ile Yönetin – Khilonfast',
    'Manage Your Office & Interior Design Marketing Strategy with Maestro AI – Khilonfast',
    'Ofis & iç tasarım sektörü için özelleştirilmiş Maestro AI ile pazarlama kararlarınızı hızlandırın.',
    'Accelerate your marketing decisions with Maestro AI specialized for the office & interior design sector.'
);

INSERT INTO products (product_key, name, name_en, price, currency, category, type, is_active, parent_id,
    description, description_en)
SELECT
    'maestro-ofis-kredili', 'Kredili Maestro (Ofis & İç Tasarım)', 'Credited Maestro (Office & Interior Design)',
    1200, 'TRY', 'Ürünler', 'subscription', 1, id,
    'Ofis & iç tasarım sektörüne özel Kredili Maestro paketi.', 'Credited Maestro package for office & interior design sector.'
FROM products WHERE product_key = 'service-maestro-ai-ofis-tasarim' LIMIT 1;

INSERT INTO products (product_key, name, name_en, price, currency, category, type, is_active, parent_id,
    description, description_en)
SELECT
    'maestro-ofis-sinirsiz', 'Sınırsız Maestro (Ofis & İç Tasarım)', 'Unlimited Maestro (Office & Interior Design)',
    2000, 'TRY', 'Ürünler', 'subscription', 1, id,
    'Ofis & iç tasarım sektörüne özel Sınırsız Maestro paketi.', 'Unlimited Maestro package for office & interior design sector.'
FROM products WHERE product_key = 'service-maestro-ai-ofis-tasarim' LIMIT 1;

-- ─────────────────────────────────────────────────────────────
-- 7. Filo Kiralama
-- ─────────────────────────────────────────────────────────────
INSERT INTO products (product_key, name, name_en, slug, slug_en, price, currency, category, type, is_active,
    description, description_en, meta_title, meta_title_en, meta_description, meta_description_en)
VALUES (
    'service-maestro-ai-filo-kiralama',
    'Maestro AI (Filo Kiralama)',
    'Maestro AI (Fleet Rental)',
    'urunler/maestro-ai-filo-kiralama',
    'products/maestro-ai-fleet-rental',
    1200, 'TRY', 'Ürünler', 'subscription', 1,
    'Filo kiralama sektörüne özel Maestro AI pazarlama stratejisti.',
    'Maestro AI marketing strategist specialized for the fleet rental sector.',
    'Filo Kiralama Pazarlama Stratejinizi Maestro AI ile Yönetin – Khilonfast',
    'Manage Your Fleet Rental Marketing Strategy with Maestro AI – Khilonfast',
    'Filo kiralama sektörü için özelleştirilmiş Maestro AI ile pazarlama kararlarınızı hızlandırın.',
    'Accelerate your marketing decisions with Maestro AI specialized for the fleet rental sector.'
);

INSERT INTO products (product_key, name, name_en, price, currency, category, type, is_active, parent_id,
    description, description_en)
SELECT
    'maestro-filo-kredili', 'Kredili Maestro (Filo Kiralama)', 'Credited Maestro (Fleet Rental)',
    1200, 'TRY', 'Ürünler', 'subscription', 1, id,
    'Filo kiralama sektörüne özel Kredili Maestro paketi.', 'Credited Maestro package for fleet rental sector.'
FROM products WHERE product_key = 'service-maestro-ai-filo-kiralama' LIMIT 1;

INSERT INTO products (product_key, name, name_en, price, currency, category, type, is_active, parent_id,
    description, description_en)
SELECT
    'maestro-filo-sinirsiz', 'Sınırsız Maestro (Filo Kiralama)', 'Unlimited Maestro (Fleet Rental)',
    2000, 'TRY', 'Ürünler', 'subscription', 1, id,
    'Filo kiralama sektörüne özel Sınırsız Maestro paketi.', 'Unlimited Maestro package for fleet rental sector.'
FROM products WHERE product_key = 'service-maestro-ai-filo-kiralama' LIMIT 1;

-- ─────────────────────────────────────────────────────────────
-- Verify: list all Maestro AI products
-- ─────────────────────────────────────────────────────────────
-- SELECT id, product_key, name, price, category, parent_id
-- FROM products
-- WHERE product_key LIKE '%maestro%'
-- ORDER BY parent_id IS NULL DESC, parent_id, id;
