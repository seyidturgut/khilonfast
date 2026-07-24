-- crm_email_tracking.campaign_id backfill (tek seferlik)
--
-- SORUN: Brevo webhook'u crm_email_tracking'e yazarken campaign_id kolonunu hiç
--        doldurmuyordu (hep NULL). "Tıklayanlardan/Açanlardan Liste Oluştur"
--        sorguları WHERE campaign_id = ? kullandığı için listeler HEP 0 çıkıyordu.
--        (Kampanya kartındaki "77 tıklandı" ise crm_campaign_recipients.clicked_at'ten
--         okunduğu için doğru görünüyordu — iki farklı kaynak.)
--
-- KOD FIX: api/routes/crm-public.php + backend/routes/crm-public.js artık
--          message_id üzerinden campaign_id çözüp yazıyor (yeni olaylar için).
-- BU SCRIPT: geçmiş satırları message_id eşleşmesiyle geriye dönük doldurur.
--
-- Çalıştırma:
--   mysql --default-character-set=utf8mb4 -u <user> -p <db> < crm_tracking_campaign_backfill.sql
-- İdempotent (sadece campaign_id IS NULL olanlara dokunur).
-- NOT: Büyük tabloda 2. adım biraz sürebilir (REPLACE indeks kullanmaz).

-- 1) Hızlı yol: birebir message_id eşleşmesi (indeks kullanır)
UPDATE crm_email_tracking t
JOIN crm_campaign_recipients r ON r.message_id = t.message_id
SET t.campaign_id = r.campaign_id
WHERE t.campaign_id IS NULL
  AND t.message_id IS NOT NULL AND t.message_id <> ''
  AND r.campaign_id IS NOT NULL;

-- 2) Kalanlar: açılı parantez (<...>) farkı olan message_id'ler
UPDATE crm_email_tracking t
JOIN crm_campaign_recipients r
  ON REPLACE(REPLACE(r.message_id, '<', ''), '>', '') = REPLACE(REPLACE(t.message_id, '<', ''), '>', '')
SET t.campaign_id = r.campaign_id
WHERE t.campaign_id IS NULL
  AND t.message_id IS NOT NULL AND t.message_id <> ''
  AND r.campaign_id IS NOT NULL;

-- 3) Kontrol: kaç tracking satırı kampanyaya bağlandı?
SELECT
  COUNT(*)                                   AS toplam_tracking,
  SUM(campaign_id IS NOT NULL)               AS kampanyaya_bagli,
  SUM(campaign_id IS NULL)                   AS bagsiz_kalan,
  SUM(event = 'clicked' AND campaign_id IS NOT NULL) AS bagli_tiklama
FROM crm_email_tracking;
