-- Eğitim Başvurusu LP — CRM liste + public form seed
-- Çalıştırma (Türkçe karakterler için charset ZORUNLU):
--   mysql --default-character-set=utf8mb4 -u <user> -p <db> < api/migrations/egitim_lp_form.sql
-- İdempotent: tekrar çalıştırılabilir (ON DUPLICATE KEY UPDATE).

-- 1) Başvuranların otomatik düşeceği ayrı liste
INSERT INTO crm_lists (slug, name, description, type)
VALUES ('egitim-basvurulari-lp', 'Eğitim Başvuruları – LP',
        'khilonfast Academy eğitim başvuru landing page formundan gelen kayıtlar', 'static')
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

SET @list_id = (SELECT id FROM crm_lists WHERE slug = 'egitim-basvurulari-lp' LIMIT 1);

-- 2) Public form: LP bu slug'a POST eder → /api/crm-public/form/egitim-basvurusu/submit
INSERT INTO crm_forms (slug, name, description, fields_json, actions_json, success_message, double_opt_in, is_active)
VALUES (
    'egitim-basvurusu',
    'Eğitim Başvurusu (LP)',
    'khilonfast Academy eğitim başvuru landing page formu',
    JSON_ARRAY(
        JSON_OBJECT('key','first_name','label','Ad Soyad','type','text','required',true),
        JSON_OBJECT('key','role','label','Ünvan / Rol','type','text','required',false),
        JSON_OBJECT('key','company','label','Firma','type','text','required',false),
        JSON_OBJECT('key','phone','label','Telefon','type','text','required',false),
        JSON_OBJECT('key','email','label','E-posta','type','email','required',true),
        JSON_OBJECT('key','seats','label','Katılımcı sayısı','type','text','required',false),
        JSON_OBJECT('key','programs','label','İlgilenilen programlar','type','array','required',true),
        JSON_OBJECT('key','note','label','Not','type','textarea','required',false),
        JSON_OBJECT('key','kvkk','label','KVKK Onayı','type','text','required',false)
    ),
    JSON_ARRAY(
        JSON_OBJECT('type','add_to_list','list_id',@list_id),
        JSON_OBJECT('type','notify_admin')
    ),
    'Teşekkürler! Başvurunuz alındı, en kısa sürede size dönüş yapacağız.',
    0, 1
)
ON DUPLICATE KEY UPDATE
    name            = VALUES(name),
    description     = VALUES(description),
    fields_json     = VALUES(fields_json),
    actions_json    = VALUES(actions_json),
    success_message = VALUES(success_message),
    double_opt_in   = 0,
    is_active       = 1;
