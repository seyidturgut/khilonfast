import express from 'express';
import db from '../config/database.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();
let trainingAccessPagesSchemaReady = false;

const ensureTrainingAccessPagesSchema = async () => {
    if (trainingAccessPagesSchemaReady) return;

    // Ana tablo
    await db.query(`
        CREATE TABLE IF NOT EXISTS training_access_pages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            slug VARCHAR(255) NOT NULL UNIQUE,
            product_key VARCHAR(100) NOT NULL,
            title_tr VARCHAR(255) DEFAULT NULL,
            title_en VARCHAR(255) DEFAULT NULL,
            description_tr TEXT DEFAULT NULL,
            description_en TEXT DEFAULT NULL,
            vimeo_url_tr TEXT DEFAULT NULL,
            vimeo_url_en TEXT DEFAULT NULL,
            canva_url_tr TEXT DEFAULT NULL,
            canva_url_en TEXT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_training_access_pages_product_key (product_key)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Kolon migrasyonları
    const requiredColumns = [
        ['slug', 'ALTER TABLE training_access_pages ADD COLUMN slug VARCHAR(255) NOT NULL UNIQUE AFTER id'],
        ['product_key', 'ALTER TABLE training_access_pages ADD COLUMN product_key VARCHAR(100) NOT NULL AFTER slug'],
        ['title_tr', 'ALTER TABLE training_access_pages ADD COLUMN title_tr VARCHAR(255) DEFAULT NULL'],
        ['title_en', 'ALTER TABLE training_access_pages ADD COLUMN title_en VARCHAR(255) DEFAULT NULL'],
        ['description_tr', 'ALTER TABLE training_access_pages ADD COLUMN description_tr TEXT DEFAULT NULL'],
        ['description_en', 'ALTER TABLE training_access_pages ADD COLUMN description_en TEXT DEFAULT NULL'],
        ['vimeo_url_tr', 'ALTER TABLE training_access_pages ADD COLUMN vimeo_url_tr TEXT DEFAULT NULL'],
        ['vimeo_url_en', 'ALTER TABLE training_access_pages ADD COLUMN vimeo_url_en TEXT DEFAULT NULL'],
        ['canva_url_tr', 'ALTER TABLE training_access_pages ADD COLUMN canva_url_tr TEXT DEFAULT NULL'],
        ['canva_url_en', 'ALTER TABLE training_access_pages ADD COLUMN canva_url_en TEXT DEFAULT NULL'],
        ['pdf_url', 'ALTER TABLE training_access_pages ADD COLUMN pdf_url TEXT DEFAULT NULL']
    ];

    for (const [columnName, sql] of requiredColumns) {
        const [rows] = await db.query('SHOW COLUMNS FROM training_access_pages LIKE ?', [columnName]);
        if (!rows.length) {
            await db.query(sql);
        }
    }

    const [legacyVimeo] = await db.query("SHOW COLUMNS FROM training_access_pages LIKE 'vimeo_url'");
    const [legacyCanva] = await db.query("SHOW COLUMNS FROM training_access_pages LIKE 'canva_url'");

    if (legacyVimeo.length) {
        await db.query(`
            UPDATE training_access_pages
            SET vimeo_url_tr = COALESCE(NULLIF(vimeo_url_tr, ''), vimeo_url)
            WHERE vimeo_url IS NOT NULL AND vimeo_url <> ''
        `);
    }

    if (legacyCanva.length) {
        await db.query(`
            UPDATE training_access_pages
            SET canva_url_tr = COALESCE(NULLIF(canva_url_tr, ''), canva_url)
            WHERE canva_url IS NOT NULL AND canva_url <> ''
        `);
    }

    // Seyir oturumları tablosu (heartbeat için)
    await db.query(`
        CREATE TABLE IF NOT EXISTS training_watch_sessions (
            id            INT AUTO_INCREMENT PRIMARY KEY,
            user_id       INT NOT NULL,
            product_key   VARCHAR(100) NOT NULL,
            lesson_id     INT NULL,
            seconds_watched INT NOT NULL DEFAULT 0,
            session_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_tws_user_product (user_id, product_key),
            INDEX idx_tws_date (session_start)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Dersler tablosu
    await db.query(`
        CREATE TABLE IF NOT EXISTS training_lessons (
            id              INT AUTO_INCREMENT PRIMARY KEY,
            training_id     INT NOT NULL,
            title_tr        VARCHAR(255) NOT NULL,
            title_en        VARCHAR(255) DEFAULT NULL,
            description_tr  TEXT DEFAULT NULL,
            description_en  TEXT DEFAULT NULL,
            vimeo_url_tr    TEXT DEFAULT NULL,
            vimeo_url_en    TEXT DEFAULT NULL,
            pdf_url         TEXT DEFAULT NULL,
            order_index     INT NOT NULL DEFAULT 0,
            is_published    TINYINT(1) NOT NULL DEFAULT 1,
            duration_label  VARCHAR(20) DEFAULT NULL,
            created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (training_id) REFERENCES training_access_pages(id) ON DELETE CASCADE,
            INDEX idx_training_lessons_training_id (training_id),
            INDEX idx_training_lessons_order (training_id, order_index)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Seed: eğitim sayfaları
    const seedTrainings = [
        { slug: 'buyume-odakli-pazarlama-egitimi',                                       product_key: 'training-buyume-odakli-pazarlama',              title_tr: 'Büyüme Odaklı Pazarlama Eğitimi',                                            title_en: 'Growth-Oriented Marketing Training' },
        { slug: 'odeme-sistemlerinde-buyume-odakli-pazarlama-egitimi',                    product_key: 'training-odeme-sistemlerinde-buyume',            title_tr: 'Ödeme Sistemlerinde Büyüme Odaklı Pazarlama Eğitimi',                        title_en: 'Growth-Oriented Marketing Training in Payment Systems' },
        { slug: 'b2b-sektorunde-buyume-odakli-pazarlama-egitimi',                         product_key: 'training-b2b-sektorunde-buyume',                 title_tr: 'B2B Sektöründe Büyüme Odaklı Pazarlama Eğitimi',                             title_en: 'Growth-Oriented Marketing Training in the B2B Sector' },
        { slug: 'fintech-sektorunde-buyume-odakli-pazarlama-egitimi',                     product_key: 'training-fintech-sektorunde-buyume',             title_tr: 'Fintech Sektöründe Büyüme Odaklı Pazarlama Eğitimi',                        title_en: 'Growth-Oriented Marketing Training in the Fintech Sector' },
        { slug: 'teknoloji-yazilim-sektorunde-buyume-odakli-pazarlama-egitimi',           product_key: 'training-teknoloji-yazilim-buyume',              title_tr: 'Teknoloji & Yazılım Sektöründe Büyüme Odaklı Pazarlama Eğitimi',             title_en: 'Growth-Oriented Marketing Training in Tech & Software' },
        { slug: 'uretim-sektorunde-buyume-odakli-pazarlama-egitimi',                     product_key: 'training-uretim-sektorunde-buyume',              title_tr: 'Üretim Sektöründe Büyüme Odaklı Pazarlama Eğitimi',                         title_en: 'Growth-Oriented Marketing Training in the Manufacturing Sector' },
        { slug: 'enerji-sektorunde-buyume-odakli-pazarlama-egitimi',                     product_key: 'training-enerji-sektorunde-buyume',              title_tr: 'Enerji Sektöründe Büyüme Odaklı Pazarlama Eğitimi',                         title_en: 'Growth-Oriented Marketing Training in the Energy Sector' },
        { slug: 'ofis-kurumsal-ic-tasarim-sektorunde-buyume-odakli-pazarlama-egitimi',   product_key: 'training-ofis-kurumsal-ic-tasarim-buyume',       title_tr: 'Ofis & Kurumsal İç Tasarım Sektöründe Büyüme Odaklı Pazarlama Eğitimi',    title_en: 'Growth-Oriented Marketing Training in Corporate Interior Design' },
        { slug: 'filo-kiralama-sektorunde-buyume-odakli-pazarlama-egitimi',              product_key: 'training-filo-kiralama-sektorunde-buyume',       title_tr: 'Filo Kiralama Sektöründe Büyüme Odaklı Pazarlama Eğitimi',                  title_en: 'Growth-Oriented Marketing Training in Fleet Rental' },
        { slug: 'endustriyel-gida-sektorunde-buyume-odakli-pazarlama-egitimi',           product_key: 'training-endustriyel-gida-sektorunde-buyume',    title_tr: 'Endüstriyel Gıda Sektöründe Büyüme Odaklı Pazarlama Eğitimi',               title_en: 'Growth-Oriented Marketing Training in Industrial Food' },
        { slug: 'kurumsal-hediye-karti-sektorunde-buyume-odakli-pazarlama-egitimi',      product_key: 'training-kurumsal-hediye-karti-buyume',          title_tr: 'Kurumsal Hediye Kartı Sektöründe Büyüme Odaklı Pazarlama Eğitimi',         title_en: 'Growth-Oriented Marketing Training for Corporate Gift Card' },
        { slug: 'kurumsal-akaryakit-sektorunde-buyume-odakli-pazarlama-egitimi',         product_key: 'training-kurumsal-akaryakit-buyume',             title_tr: 'Kurumsal Akaryakıt Sektöründe Büyüme Odaklı Pazarlama Eğitimi',            title_en: 'Growth-Oriented Marketing Training for Corporate Fuel Solutions' }
    ];

    for (const t of seedTrainings) {
        await db.query(
            `INSERT IGNORE INTO training_access_pages (slug, product_key, title_tr, title_en) VALUES (?, ?, ?, ?)`,
            [t.slug, t.product_key, t.title_tr, t.title_en]
        );
    }

    // Seed: Ödeme Sistemleri — training seviyesinde PDF
    await db.query(
        `UPDATE training_access_pages SET pdf_url = ? WHERE slug = ? AND (pdf_url IS NULL OR pdf_url = '')`,
        ['/egitim-dokumanlar/odeme-sistemleri-turkce.pdf', 'odeme-sistemlerinde-buyume-odakli-pazarlama-egitimi']
    );

    // Seed: Ödeme Sistemleri dersleri (11 ders)
    const [odemeRows] = await db.query(
        `SELECT id FROM training_access_pages WHERE slug = 'odeme-sistemlerinde-buyume-odakli-pazarlama-egitimi' LIMIT 1`
    );
    if (odemeRows.length) {
        const trainingId = odemeRows[0].id;
        const [existingLessons] = await db.query(
            `SELECT COUNT(*) AS cnt FROM training_lessons WHERE training_id = ?`, [trainingId]
        );
        if (existingLessons[0].cnt === 0) {
            const PDF_URL = '/egitim-dokumanlar/odeme-sistemleri-turkce.pdf';
            const lessons = [
                { title_tr: 'Büyüme Odaklı Pazarlamaya Giriş',                               vimeo: 'https://player.vimeo.com/video/1115499839', order: 1, pdf: PDF_URL },
                { title_tr: 'Hedef Kitle: Karar Verici ve Onaylayıcıyı Doğru Okumak',        vimeo: 'https://player.vimeo.com/video/1148284930', order: 2, pdf: null },
                { title_tr: 'Egzersiz: Hedef Kitle Sorunlarını Not Etmek',                    vimeo: 'https://player.vimeo.com/video/1115501822', order: 3, pdf: null },
                { title_tr: 'Değer Önerisi: Ethos, Pathos, Logos ile Fark Yaratmak',          vimeo: 'https://player.vimeo.com/video/1115501855', order: 4, pdf: null },
                { title_tr: 'Değer Önerisini Sistematik Kurmak: Pain Point ve Rol Bazlı Mesaj', vimeo: 'https://player.vimeo.com/video/1115501864', order: 5, pdf: null },
                { title_tr: 'Satış Hunisi: Mesajı Zaman, Mecra ve Aşamaya Göre Uyarlamak',   vimeo: 'https://player.vimeo.com/video/1115501875', order: 6, pdf: null },
                { title_tr: 'Başlangıç Metrikleri: Büyümenin Sayısal Pusulası',               vimeo: 'https://player.vimeo.com/video/1115504044', order: 7, pdf: null },
                { title_tr: 'Pazarlamanın Üç Net Hedefi: Kazanmak, Derinleşmek, Korumak',    vimeo: 'https://player.vimeo.com/video/1115504209', order: 8, pdf: null },
                { title_tr: 'Web Sitesi ile Büyümek: Web Sitesindeki Sayfaların Görevleri',   vimeo: 'https://player.vimeo.com/video/1115504385', order: 9, pdf: null },
                { title_tr: 'Lead Sonrası Akış: Psikoloji, Zamanlama ve Çok Kanallı Temas',  vimeo: 'https://player.vimeo.com/video/1115504492', order: 10, pdf: null },
                { title_tr: 'İlk Temastan Satışa: Etkili İletişim, İtiraz Yönetimi ve Takip', vimeo: 'https://player.vimeo.com/video/1115504671', order: 11, pdf: null },
            ];
            for (const l of lessons) {
                await db.query(
                    `INSERT INTO training_lessons (training_id, title_tr, vimeo_url_tr, pdf_url, order_index) VALUES (?, ?, ?, ?, ?)`,
                    [trainingId, l.title_tr, l.vimeo, l.pdf, l.order]
                );
            }
        }
    }

    trainingAccessPagesSchemaReady = true;
};

// GET /api/training-analytics/configs — all training pages, public
router.get('/configs', async (req, res) => {
    try {
        await ensureTrainingAccessPagesSchema();
        const [rows] = await db.query('SELECT slug, product_key, title_tr, title_en FROM training_access_pages ORDER BY id ASC');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/training-analytics/config/:slug — public, no auth (lessons dahil)
router.get('/config/:slug', async (req, res) => {
    try {
        await ensureTrainingAccessPagesSchema();
        const [rows] = await db.query(
            'SELECT * FROM training_access_pages WHERE slug = ? LIMIT 1',
            [req.params.slug]
        );
        if (!rows.length) return res.status(404).json({ error: 'Not found' });
        const config = rows[0];

        // Dersleri ekle
        const [lessons] = await db.query(
            `SELECT id, title_tr, title_en, description_tr, description_en,
                    vimeo_url_tr, vimeo_url_en, pdf_url, order_index, duration_label
             FROM training_lessons
             WHERE training_id = ? AND is_published = 1
             ORDER BY order_index ASC`,
            [config.id]
        );
        config.lessons = lessons;

        res.json(config);
    } catch (err) {
        console.error('Training config error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/training-analytics/heartbeat — auth required
router.post('/heartbeat', authMiddleware, async (req, res) => {
    const { product_key, seconds_delta, lesson_id } = req.body;
    const userId = req.user.id;

    if (!product_key || !seconds_delta || seconds_delta <= 0) {
        return res.status(400).json({ error: 'Invalid data' });
    }

    try {
        await ensureTrainingAccessPagesSchema();

        // Aktif abonelik kontrolü
        const [subs] = await db.query(
            `SELECT s.id FROM subscriptions s
             JOIN products p ON p.id = s.product_id
             WHERE s.user_id = ? AND p.product_key = ? AND s.status = 'active'
             LIMIT 1`,
            [userId, product_key]
        );
        if (!subs.length) return res.status(403).json({ error: 'No active subscription' });

        const today = new Date().toISOString().slice(0, 10);
        const [existing] = await db.query(
            `SELECT id FROM training_watch_sessions
             WHERE user_id=? AND product_key=? AND DATE(session_start)=?
             ${lesson_id ? 'AND lesson_id=?' : 'AND lesson_id IS NULL'}`,
            lesson_id ? [userId, product_key, today, lesson_id] : [userId, product_key, today]
        );

        if (existing.length) {
            await db.query(
                'UPDATE training_watch_sessions SET seconds_watched = seconds_watched + ?, updated_at=NOW() WHERE id=?',
                [seconds_delta, existing[0].id]
            );
        } else {
            await db.query(
                'INSERT INTO training_watch_sessions (user_id, product_key, lesson_id, seconds_watched) VALUES (?,?,?,?)',
                [userId, product_key, lesson_id || null, seconds_delta]
            );
        }

        res.json({ success: true });
    } catch (err) {
        console.error('Heartbeat error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
