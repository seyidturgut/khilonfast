-- Exit Popup (çıkış amaçlı popup) — CRM liste + public form seed
-- Çalıştırma (Türkçe karakter için charset ZORUNLU):
--   mysql --default-character-set=utf8mb4 -u <user> -p <db> < exit_popup_form.sql
-- İdempotent + oturum değişkenine bağımsız.
--
-- AÇ/KAPA: Popup, bu formun is_active=1 olup olmadığını API'den kontrol eder.
--   Admin CRM → Forms → "Exit Popup" formunu pasif yaparsa popup HİÇ gösterilmez.

-- 1) Exit popup başvuranlarının düşeceği ayrı liste
INSERT INTO crm_lists (slug, name, description, type)
VALUES ('exit-popup', 'Exit Popup',
        'Çıkış amaçlı popup üzerinden gelen bilgi talepleri', 'static')
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

-- 2) Public form: popup → /api/crm-public/form/exit-popup/submit
INSERT INTO crm_forms (slug, name, description, fields_json, actions_json, success_message, double_opt_in, is_active)
VALUES (
    'exit-popup',
    'Exit Popup',
    'Çıkış amaçlı popup bilgi formu',
    JSON_ARRAY(
        JSON_OBJECT('key','first_name','label','Ad Soyad','type','text','required',true),
        JSON_OBJECT('key','email','label','E-posta','type','email','required',true),
        JSON_OBJECT('key','phone','label','Telefon','type','text','required',false),
        JSON_OBJECT('key','source','label','Geldiği sayfa','type','text','required',false),
        JSON_OBJECT('key','kvkk','label','Gizlilik Politikası Onayı','type','text','required',false),
        JSON_OBJECT('key','etk','label','ETK / Pazarlama İzni','type','text','required',false)
    ),
    JSON_ARRAY(),
    'Teşekkürler! Bilgileriniz alındı, en kısa sürede size dönüş yapacağız.',
    0, 1
)
ON DUPLICATE KEY UPDATE
    name            = VALUES(name),
    description     = VALUES(description),
    fields_json     = VALUES(fields_json),
    success_message = VALUES(success_message),
    double_opt_in   = 0,
    is_active       = 1;

-- 3) actions_json'u oturum değişkeninden BAĞIMSIZ kesinle
UPDATE crm_forms
SET actions_json = JSON_ARRAY(
    JSON_OBJECT('type','add_to_list','list_id',
        (SELECT id FROM crm_lists WHERE slug = 'exit-popup' LIMIT 1)),
    JSON_OBJECT('type','notify_admin')
)
WHERE slug = 'exit-popup';

-- 4) Geçmiş başvuranları geriye dönük listeye ekle
INSERT IGNORE INTO crm_list_contacts (list_id, contact_id)
SELECT (SELECT id FROM crm_lists WHERE slug = 'exit-popup' LIMIT 1), s.contact_id
FROM crm_form_submissions s
JOIN crm_forms f ON f.id = s.form_id
WHERE f.slug = 'exit-popup' AND s.contact_id IS NOT NULL AND s.status = 'confirmed';

-- 5) Liste sayaç senkronu
UPDATE crm_lists
SET contact_count = (SELECT COUNT(*) FROM crm_list_contacts WHERE list_id = crm_lists.id)
WHERE slug = 'exit-popup' AND type = 'static';
