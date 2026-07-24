-- crm_email_tracking.campaign_id backfill — HIZLI SÜRÜM
-- (Önceki crm_tracking_campaign_backfill.sql yavaştı: recipients.message_id'de indeks yok +
--  2. adımdaki REPLACE() indeksi devre dışı bırakıyordu. Bu sürüm onu düzeltir.)
--
-- Çalıştırma sırası ÖNEMLİ. phpMyAdmin'de adımları TEK TEK çalıştır.

-- ─────────────────────────────────────────────────────────────
-- ADIM 1 — Eksik indeksi ekle (JOIN'i hızlandırır)
-- NOT: "Duplicate key name" hatası verirse indeks zaten var demektir, GEÇ.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE crm_campaign_recipients ADD INDEX idx_message_id (message_id);


-- ─────────────────────────────────────────────────────────────
-- ADIM 2 — Sadece TIKLAMA satırlarını bağla (tıklayanlar listesi için gereken tek şey)
-- Çok daha küçük veri kümesi → hızlı biter.
-- ─────────────────────────────────────────────────────────────
UPDATE crm_email_tracking t
JOIN crm_campaign_recipients r ON r.message_id = t.message_id
SET t.campaign_id = r.campaign_id
WHERE t.campaign_id IS NULL
  AND t.event = 'clicked'
  AND t.message_id IS NOT NULL AND t.message_id <> ''
  AND r.campaign_id IS NOT NULL;


-- ─────────────────────────────────────────────────────────────
-- ADIM 3 — Kontrol: tıklamalar kampanyalara bağlandı mı?
-- ─────────────────────────────────────────────────────────────
SELECT
  SUM(event = 'clicked')                              AS toplam_tiklama,
  SUM(event = 'clicked' AND campaign_id IS NOT NULL)  AS kampanyaya_bagli_tiklama,
  SUM(event = 'clicked' AND campaign_id IS NULL)      AS bagsiz_tiklama
FROM crm_email_tracking;


-- ─────────────────────────────────────────────────────────────
-- ADIM 4 (OPSİYONEL, acele değil) — Diğer olayları da bağla (opened/delivered vb.)
-- Tıklayanlar listesi için GEREKMEZ; sadece raporlama bütünlüğü için.
-- Tablo büyükse id aralığıyla parça parça çalıştır:
--   ... AND t.id BETWEEN 1 AND 200000;   sonra 200001-400000 ... şeklinde
-- ─────────────────────────────────────────────────────────────
-- UPDATE crm_email_tracking t
-- JOIN crm_campaign_recipients r ON r.message_id = t.message_id
-- SET t.campaign_id = r.campaign_id
-- WHERE t.campaign_id IS NULL
--   AND t.message_id IS NOT NULL AND t.message_id <> ''
--   AND r.campaign_id IS NOT NULL
--   AND t.id BETWEEN 1 AND 200000;
