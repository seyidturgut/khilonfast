-- CRM liste sayaç düzeltmesi (tek seferlik)
-- Sorun: contact silinince crm_list_contacts üyeliği öksüz kalıyordu ve
--        liste "kişi" sayacı düşmüyordu. Bu script mevcut veriyi düzeltir.
-- Çalıştırma:
--   mysql --default-character-set=utf8mb4 -u <user> -p <db> < crm_recount_fix.sql
-- İdempotent (tekrar çalıştırılabilir).

-- 1) Öksüz liste üyeliklerini temizle (contact'ı silinmiş kayıtlar)
DELETE lc FROM crm_list_contacts lc
LEFT JOIN crm_contacts c ON c.id = lc.contact_id
WHERE c.id IS NULL;

-- 2) Tüm static liste sayaçlarını gerçek üye sayısına eşitle
UPDATE crm_lists
SET contact_count = (SELECT COUNT(*) FROM crm_list_contacts WHERE list_id = crm_lists.id)
WHERE type = 'static';

-- (Bonus) Etiket sayaçlarını da düzelt — aynı öksüz sorunu tag'lerde varsa
DELETE ct FROM crm_contact_tags ct
LEFT JOIN crm_contacts c ON c.id = ct.contact_id
WHERE c.id IS NULL;
UPDATE crm_tags
SET contact_count = (SELECT COUNT(*) FROM crm_contact_tags WHERE tag_id = crm_tags.id);
