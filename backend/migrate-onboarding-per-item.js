// backend/migrate-onboarding-per-item.js
// Ürün-bazlı onboarding formu mimarisine geçiş migration'ı.
// 1) products.requires_onboarding kolonu ekle
// 2) onboarding_forms.order_item_id kolonu ekle
// 3) Form-required ürünleri işaretle (8 hizmet + sektörel bütünleşik + ihtiyaca özel paketler)
// 4) Eski onboarding_forms kayıtlarını order'ın ilk form-required kalemine bağla

import pool from './config/database.js';

const SERVICE_PARENT_KEYS = [
    'service-gtm',
    'service-content-strategy',
    'service-integrated-marketing',
    'service-google-ads',
    'service-social-ads',
    'service-seo',
    'service-content-production',
    'service-b2b-email'
];

async function columnExists(table, column) {
    const [rows] = await pool.query(`SHOW COLUMNS FROM ${table} LIKE ?`, [column]);
    return rows.length > 0;
}

async function run() {
    console.log('→ Migration başladı');

    // 1) products.requires_onboarding
    if (!(await columnExists('products', 'requires_onboarding'))) {
        await pool.query(
            "ALTER TABLE products ADD COLUMN requires_onboarding TINYINT(1) NOT NULL DEFAULT 0 AFTER is_active"
        );
        console.log('  ✓ products.requires_onboarding eklendi');
    } else {
        console.log('  • products.requires_onboarding zaten var');
    }

    // 2) onboarding_forms.order_item_id
    // Tablo runtime'da ensureTable ile oluşur; yine de varsa kolonu ekle
    const [tblRows] = await pool.query("SHOW TABLES LIKE 'onboarding_forms'");
    if (tblRows.length > 0) {
        if (!(await columnExists('onboarding_forms', 'order_item_id'))) {
            await pool.query(
                "ALTER TABLE onboarding_forms ADD COLUMN order_item_id INT NULL AFTER order_id"
            );
            await pool.query("ALTER TABLE onboarding_forms ADD INDEX idx_order_item_id (order_item_id)");
            console.log('  ✓ onboarding_forms.order_item_id eklendi');
        } else {
            console.log('  • onboarding_forms.order_item_id zaten var');
        }
    } else {
        console.log('  • onboarding_forms tablosu henüz yok (runtime ensureTable hazırlayacak)');
    }

    // 3) Form-required ürünleri işaretle
    // 3a) 8 hizmet parent + child'ları
    const placeholders = SERVICE_PARENT_KEYS.map(() => '?').join(',');
    const [r1] = await pool.query(
        `UPDATE products SET requires_onboarding = 1 WHERE product_key IN (${placeholders})`,
        SERVICE_PARENT_KEYS
    );
    console.log(`  ✓ Ana hizmet işaretlendi: ${r1.affectedRows}`);

    const [r2] = await pool.query(
        `UPDATE products SET requires_onboarding = 1
         WHERE parent_id IN (SELECT id FROM (SELECT id FROM products WHERE product_key IN (${placeholders})) AS x)`,
        SERVICE_PARENT_KEYS
    );
    console.log(`  ✓ Hizmet child paketleri işaretlendi: ${r2.affectedRows}`);

    // 3b) Sektörel "bütünleşik dijital pazarlama" / 360° paketleri
    // Slug pattern: %butunlesik-dijital-pazarlama%, ya da product_key %-360 ile biten parent'ların child'ları
    const [r3] = await pool.query(
        `UPDATE products SET requires_onboarding = 1
         WHERE product_key LIKE '%butunlesik-dijital-pazarlama%'
            OR product_key LIKE '%360-pazarlama%'
            OR name LIKE '%360%' AND category = 'sektorler'`
    );
    console.log(`  ✓ Sektörel 360/bütünleşik paketler işaretlendi: ${r3.affectedRows}`);

    // 3c) Sektörel "ihtiyaca özel çözüm" paketleri (sektör adıyla başlayan ana hizmet varyantları)
    // Bunlar genelde sektör paketinin altında child ürün olarak duruyor; kategori='sektorler' ve
    // adında bilinen hizmet ifadelerinden biri geçen ürünler form ister.
    const [r4] = await pool.query(
        `UPDATE products SET requires_onboarding = 1
         WHERE category = 'sektorler'
           AND requires_onboarding = 0
           AND (
                name LIKE '%Google Ads%' OR name LIKE '%Sosyal Medya%' OR
                name LIKE '%SEO%' OR name LIKE '%İçerik Üretim%' OR
                name LIKE '%B2B Email%' OR name LIKE '%İçerik Stratej%' OR
                name LIKE '%Go To Market%'
           )`
    );
    console.log(`  ✓ Sektörel ihtiyaca özel paketler işaretlendi: ${r4.affectedRows}`);

    // 3d) İstisna: Strateji/Danışmanlık + eye-* + maestro* + training-* + subscription-*
    const [r5] = await pool.query(
        `UPDATE products SET requires_onboarding = 0
         WHERE product_key LIKE 'eye-%'
            OR product_key LIKE '%maestro%'
            OR product_key LIKE 'training-%'
            OR product_key LIKE 'subscription-%'
            OR product_key LIKE '%strategy-advisory%'
            OR product_key LIKE '%danismanlik%'
            OR name LIKE '%Strateji / Danışmanlık%'
            OR name LIKE '%Reklam Görsel Analiz%'`
    );
    console.log(`  ✓ İstisna ürünler temizlendi: ${r5.affectedRows}`);

    // 4) Eski onboarding_forms kayıtlarını ilk form-required kaleme bağla
    if (tblRows.length > 0) {
        const [r6] = await pool.query(
            `UPDATE onboarding_forms ofm
             JOIN (
                 SELECT oi.order_id, MIN(oi.id) AS first_item_id
                 FROM order_items oi
                 JOIN products p ON p.id = oi.product_id
                 WHERE p.requires_onboarding = 1
                 GROUP BY oi.order_id
             ) x ON x.order_id = ofm.order_id
             SET ofm.order_item_id = x.first_item_id
             WHERE ofm.order_item_id IS NULL`
        );
        console.log(`  ✓ Eski onboarding_forms kayıtları kaleme bağlandı: ${r6.affectedRows}`);

        const [orphans] = await pool.query(
            "SELECT COUNT(*) AS n FROM onboarding_forms WHERE order_item_id IS NULL"
        );
        if (orphans[0].n > 0) {
            console.warn(`  ⚠ ${orphans[0].n} form hâlâ order_item_id'siz (siparişte form-required kalem yok)`);
        }
    }

    // 5) Özet
    const [summary] = await pool.query(
        "SELECT COUNT(*) AS n FROM products WHERE requires_onboarding = 1"
    );
    console.log(`→ Toplam form-required ürün: ${summary[0].n}`);

    const [byCat] = await pool.query(
        `SELECT category, COUNT(*) AS n FROM products
         WHERE requires_onboarding = 1 GROUP BY category`
    );
    console.table(byCat);

    console.log('✓ Migration tamamlandı');
    await pool.end();
}

run().catch(err => {
    console.error('✗ Migration başarısız:', err);
    process.exit(1);
});
