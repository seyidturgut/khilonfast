// backend/migrate-services-to-subscriptions.js
// Aşama 1: 8 hizmet + Core/Growth/Ultimate paketlerini aylık aboneliğe geçir.
// 1) subscriptions tablosuna renewal_card_id + cancellation alanları ekle (idempotent)
// 2) İlgili 29 ürünü type='subscription' + duration_days=30 yap
// 3) user_cards tablosunu doğrula (Lidio tokenization için)

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

async function tableExists(table) {
    const [rows] = await pool.query(`SHOW TABLES LIKE ?`, [table]);
    return rows.length > 0;
}

async function run() {
    console.log('→ Subscription migration başladı');

    // 1) user_cards tablosu (Lidio tokenization)
    if (!(await tableExists('user_cards'))) {
        await pool.query(`
            CREATE TABLE user_cards (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                lidio_token VARCHAR(255) NOT NULL,
                masked_number VARCHAR(20),
                card_brand VARCHAR(30),
                expire_month INT,
                expire_year INT,
                card_holder_name VARCHAR(255),
                is_default TINYINT(1) DEFAULT 0,
                is_active TINYINT(1) DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_user_id (user_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('  ✓ user_cards tablosu oluşturuldu');
    } else {
        console.log('  • user_cards tablosu zaten var');
    }

    // 2) subscriptions tablosu — eksik kolonları ekle
    const ensureSubsCol = async (name, ddl) => {
        if (!(await columnExists('subscriptions', name))) {
            await pool.query(`ALTER TABLE subscriptions ADD COLUMN ${ddl}`);
            console.log(`  ✓ subscriptions.${name} eklendi`);
        }
    };
    await ensureSubsCol('renewal_card_id', 'renewal_card_id INT NULL AFTER auto_renew');
    await ensureSubsCol('payment_method', "payment_method ENUM('credit_card','manual_transfer') NULL AFTER renewal_card_id");
    await ensureSubsCol('cancellation_requested_at', 'cancellation_requested_at TIMESTAMP NULL DEFAULT NULL AFTER updated_at');
    await ensureSubsCol('cancelled_at', 'cancelled_at TIMESTAMP NULL DEFAULT NULL AFTER cancellation_requested_at');
    await ensureSubsCol('last_renewal_at', 'last_renewal_at TIMESTAMP NULL DEFAULT NULL AFTER cancelled_at');
    await ensureSubsCol('renewal_attempts', 'renewal_attempts INT NOT NULL DEFAULT 0 AFTER last_renewal_at');

    // İndex
    try {
        await pool.query("ALTER TABLE subscriptions ADD INDEX idx_next_renewal (next_renewal_at, status, auto_renew)");
        console.log('  ✓ subscriptions idx_next_renewal eklendi');
    } catch (e) {
        // index zaten varsa MySQL 1061 fırlatır — yutuyoruz
    }

    // 3) Ürünleri subscription'a çevir: 8 parent + child paketler
    const placeholders = SERVICE_PARENT_KEYS.map(() => '?').join(',');
    const [r1] = await pool.query(
        `UPDATE products
         SET type = 'subscription', duration_days = 30
         WHERE (product_key IN (${placeholders})
            OR parent_id IN (SELECT id FROM (SELECT id FROM products WHERE product_key IN (${placeholders})) AS x))
           AND category = 'hizmetler'`,
        [...SERVICE_PARENT_KEYS, ...SERVICE_PARENT_KEYS]
    );
    console.log(`  ✓ Subscription'a çevrilen ürün: ${r1.affectedRows}`);

    // 4) Doğrulama
    const [verify] = await pool.query(
        `SELECT product_key, name, type, duration_days
         FROM products
         WHERE (product_key IN (${placeholders})
            OR parent_id IN (SELECT id FROM (SELECT id FROM products WHERE product_key IN (${placeholders})) AS x))
           AND category = 'hizmetler'
         ORDER BY product_key`,
        [...SERVICE_PARENT_KEYS, ...SERVICE_PARENT_KEYS]
    );
    console.log(`→ Toplam subscription ürün: ${verify.length}`);
    const wrong = verify.filter(p => p.type !== 'subscription' || p.duration_days !== 30);
    if (wrong.length) {
        console.warn(`  ⚠ ${wrong.length} ürün hâlâ subscription değil:`, wrong.map(p => p.product_key));
    }

    console.log('✓ Migration tamamlandı');
    await pool.end();
}

run().catch(err => {
    console.error('✗ Migration başarısız:', err);
    process.exit(1);
});
