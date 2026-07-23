-- Danışmanlık Başvurusu LP — CRM liste + public form seed
-- Çalıştırma (Türkçe karakter için charset ZORUNLU):
--   mysql --default-character-set=utf8mb4 -u <user> -p <db> < danismanlik_basvuru_form.sql
-- İdempotent + oturum değişkenine bağımsız (list_id slug alt-sorgusuyla kesinlenir).

-- 1) Danışmanlık başvuranlarının düşeceği ayrı liste
INSERT INTO crm_lists (slug, name, description, type)
VALUES ('danismanlik-basvurulari', 'Danışmanlık Başvuruları',
        'khilonfast danışmanlık başvuru landing page kayıtları', 'static')
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

-- 2) Public form: LP → /api/crm-public/form/danismanlik-basvurusu/submit
INSERT INTO crm_forms (slug, name, description, fields_json, actions_json, success_message, double_opt_in, is_active)
VALUES (
    'danismanlik-basvurusu',
    'Danışmanlık Başvurusu (LP)',
    'khilonfast danışmanlık başvuru landing page',
    JSON_ARRAY(
        JSON_OBJECT('key','first_name','label','Ad Soyad','type','text','required',true),
        JSON_OBJECT('key','role','label','Ünvan / Rol','type','text','required',false),
        JSON_OBJECT('key','company','label','Firma','type','text','required',false),
        JSON_OBJECT('key','phone','label','Telefon','type','text','required',false),
        JSON_OBJECT('key','email','label','E-posta','type','email','required',true),
        JSON_OBJECT('key','seats','label','Ekip büyüklüğü','type','text','required',false),
        JSON_OBJECT('key','programs','label','İlgilenilen sektör / alan','type','array','required',false),
        JSON_OBJECT('key','note','label','Not','type','textarea','required',false),
        JSON_OBJECT('key','kvkk','label','Gizlilik Politikası Onayı','type','text','required',false),
        JSON_OBJECT('key','etk','label','ETK / Pazarlama İzni','type','text','required',false)
    ),
    JSON_ARRAY(),
    'Teşekkürler! Danışmanlık başvurunuz alındı, en kısa sürede size dönüş yapacağız.',
    0, 1
)
ON DUPLICATE KEY UPDATE
    name            = VALUES(name),
    description     = VALUES(description),
    fields_json     = VALUES(fields_json),
    success_message = VALUES(success_message),
    double_opt_in   = 0,
    is_active       = 1;

-- 3) actions_json'u oturum değişkeninden BAĞIMSIZ kesinle (add_to_list + notify_admin)
UPDATE crm_forms
SET actions_json = JSON_ARRAY(
    JSON_OBJECT('type','add_to_list','list_id',
        (SELECT id FROM crm_lists WHERE slug = 'danismanlik-basvurulari' LIMIT 1)),
    JSON_OBJECT('type','notify_admin')
)
WHERE slug = 'danismanlik-basvurusu';

-- 4) Geçmiş başvuranları geriye dönük listeye ekle
INSERT IGNORE INTO crm_list_contacts (list_id, contact_id)
SELECT (SELECT id FROM crm_lists WHERE slug = 'danismanlik-basvurulari' LIMIT 1), s.contact_id
FROM crm_form_submissions s
JOIN crm_forms f ON f.id = s.form_id
WHERE f.slug = 'danismanlik-basvurusu' AND s.contact_id IS NOT NULL AND s.status = 'confirmed';

-- 5) Liste sayaç senkronu
UPDATE crm_lists
SET contact_count = (SELECT COUNT(*) FROM crm_list_contacts WHERE list_id = crm_lists.id)
WHERE slug = 'danismanlik-basvurulari' AND type = 'static';
