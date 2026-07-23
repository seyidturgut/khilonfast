-- GA4 e-ticaret (sunucu taraflı purchase) için orders tablosu eklentileri.
--
-- ga_client_id      : Checkout sırasında tarayıcının _ga çerezinden okunan GA4 client_id.
--                     Measurement Protocol ile gönderilen purchase event'inin doğru
--                     kullanıcıya VE trafik kaynağına (Meta reklamı vb.) atfedilmesi için ŞART.
--                     Olmadan tüm satışlar GA4'te "direct" görünür, reklam ROAS'ı ölçülemez.
-- ga4_purchase_sent_at : Idempotency. Sipariş 5 farklı yerde 'completed' olabiliyor
--                     (kart callback, admin havale onayı, abonelik yenileme, kupon, ücretsiz).
--                     Bu kolon dolu ise purchase TEKRAR gönderilmez → çift sayım imkânsız.
--                     Mevcut invoice_sent_at deseniyle bilinçli olarak aynı.

ALTER TABLE orders
  ADD COLUMN ga_client_id VARCHAR(64) NULL AFTER customer_type,
  ADD COLUMN ga4_purchase_sent_at DATETIME NULL AFTER ga_client_id;

-- Gönderilmemiş tamamlanmış siparişleri hızlı bulmak için (cron/retry senaryosu)
CREATE INDEX idx_orders_ga4_pending ON orders (status, ga4_purchase_sent_at);
