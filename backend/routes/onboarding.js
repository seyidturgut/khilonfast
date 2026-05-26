import express from 'express';
import db from '../config/database.js';
import { authMiddleware as authenticateToken } from '../middleware/auth.js';
import { sendOnboardingFormAdminEmail, sendOnboardingFormConfirmationEmail } from '../services/emailService.js';
import PDFDocument from 'pdfkit';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONT_PATH = path.join(__dirname, '../fonts/NotoSans.ttf');

const router = express.Router();

// DB migration: onboarding_forms tablosu
async function ensureTable() {
    await db.query(`
        CREATE TABLE IF NOT EXISTS onboarding_forms (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            order_id INT NOT NULL,
            product_names TEXT,
            form_data JSON NOT NULL,
            status ENUM('new','reviewed') DEFAULT 'new',
            submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (order_id) REFERENCES orders(id),
            INDEX idx_user_id (user_id),
            INDEX idx_order_id (order_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    // status kolonu yoksa ekle (mevcut tablolar için migration)
    const [cols] = await db.query("SHOW COLUMNS FROM onboarding_forms LIKE 'status'");
    if (cols.length === 0) {
        await db.query("ALTER TABLE onboarding_forms ADD COLUMN status ENUM('new','reviewed') DEFAULT 'new' AFTER form_data");
    }
    // order_item_id kolonu (ürün-bazlı form)
    const [oiCols] = await db.query("SHOW COLUMNS FROM onboarding_forms LIKE 'order_item_id'");
    if (oiCols.length === 0) {
        await db.query("ALTER TABLE onboarding_forms ADD COLUMN order_item_id INT NULL AFTER order_id");
        await db.query("ALTER TABLE onboarding_forms ADD INDEX idx_order_item_id (order_item_id)");
    }
}
ensureTable().catch(console.error);

// POST /api/onboarding-form — form kaydet + email gönder
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { order_id, order_item_id, form_data, product_names } = req.body;
        const user_id = req.user.id;

        if (!order_id || !order_item_id || !form_data) {
            return res.status(400).json({ error: 'order_id, order_item_id ve form_data zorunlu' });
        }

        // order_item siparişe ve kullanıcıya ait mi?
        const [[itemRow]] = await db.query(
            `SELECT oi.id, oi.product_id, o.user_id
             FROM order_items oi JOIN orders o ON o.id = oi.order_id
             WHERE oi.id = ? AND oi.order_id = ?`,
            [order_item_id, order_id]
        );
        if (!itemRow || itemRow.user_id !== user_id) {
            return res.status(403).json({ error: 'Sipariş kalemi yetkisiz' });
        }

        // Zaten doldurulmuş mu? (kalem bazlı)
        const [existing] = await db.query(
            'SELECT id FROM onboarding_forms WHERE order_item_id = ? AND user_id = ?',
            [order_item_id, user_id]
        );
        if (existing.length) {
            return res.status(409).json({ error: 'Bu ürün için form zaten dolduruldu' });
        }

        // Kullanıcı bilgisi
        const [[user]] = await db.query(
            'SELECT first_name, last_name, email FROM users WHERE id = ?',
            [user_id]
        );

        // Kaydet
        const [result] = await db.query(
            'INSERT INTO onboarding_forms (user_id, order_id, order_item_id, product_names, form_data) VALUES (?, ?, ?, ?, ?)',
            [user_id, order_id, order_item_id, product_names || '', JSON.stringify(form_data)]
        );

        // Admin email
        const [settingsRows] = await db.query(
            "SELECT setting_value FROM settings WHERE setting_key = 'contact_email'"
        );
        const adminEmail = settingsRows[0]?.setting_value;
        if (adminEmail) {
            await sendOnboardingFormAdminEmail({
                to: adminEmail,
                userName: `${user.first_name} ${user.last_name}`,
                userEmail: user.email,
                productNames: product_names,
                formData: form_data
            }).catch(console.error);
        }

        // Müşteri email
        await sendOnboardingFormConfirmationEmail({
            to: user.email,
            firstName: user.first_name,
            productNames: product_names,
            formData: form_data
        }).catch(console.error);

        res.json({ success: true, form_id: result.insertId });
    } catch (err) {
        console.error('Onboarding form error:', err);
        res.status(500).json({ error: 'Form kaydedilemedi' });
    }
});

// GET /api/onboarding-form/order/:orderId — geri uyum: ilk form-required kalem
router.get('/order/:orderId', authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT id, submitted_at, status, order_item_id FROM onboarding_forms WHERE order_id = ? AND user_id = ? ORDER BY id ASC LIMIT 1',
            [req.params.orderId, req.user.id]
        );
        res.json({ exists: rows.length > 0, form: rows[0] || null });
    } catch (err) {
        res.status(500).json({ error: 'Sorgu hatası' });
    }
});

// GET /api/onboarding-form/order/:orderId/items — siparişteki her form-required kalem için durum
router.get('/order/:orderId/items', authenticateToken, async (req, res) => {
    try {
        const orderId = parseInt(req.params.orderId, 10);
        // Siparişin kullanıcıya ait olduğunu doğrula
        const [[order]] = await db.query(
            'SELECT id, user_id FROM orders WHERE id = ?',
            [orderId]
        );
        if (!order || order.user_id !== req.user.id) {
            return res.status(404).json({ error: 'Sipariş bulunamadı' });
        }
        const [items] = await db.query(
            `SELECT oi.id AS order_item_id, oi.product_id, p.name AS product_name,
                    p.product_key, COALESCE(p.requires_onboarding,0) AS requires_onboarding,
                    ofm.id AS form_id, ofm.status, ofm.submitted_at
             FROM order_items oi
             JOIN products p ON p.id = oi.product_id
             LEFT JOIN onboarding_forms ofm
                    ON ofm.order_item_id = oi.id AND ofm.user_id = ?
             WHERE oi.order_id = ?
             ORDER BY oi.id ASC`,
            [req.user.id, orderId]
        );
        res.json({
            items: items.map(r => ({
                order_item_id: r.order_item_id,
                product_id: r.product_id,
                product_name: r.product_name,
                product_key: r.product_key,
                requires_onboarding: !!r.requires_onboarding,
                exists: !!r.form_id,
                form_id: r.form_id || null,
                status: r.status || null,
                submitted_at: r.submitted_at || null
            }))
        });
    } catch (err) {
        console.error('onboarding items error:', err);
        res.status(500).json({ error: 'Sorgu hatası' });
    }
});

// GET /api/onboarding-form/admin/user/:userId — admin: kullanıcının formu
router.get('/admin/user/:userId', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Yetkisiz' });
        const [rows] = await db.query(
            `SELECT ofm.*, o.order_number
             FROM onboarding_forms ofm
             JOIN orders o ON o.id = ofm.order_id
             WHERE ofm.user_id = ?
             ORDER BY ofm.submitted_at DESC`,
            [req.params.userId]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Sorgu hatası' });
    }
});

// GET /api/onboarding-form/admin/:formId/pdf — PDF indir
router.get('/admin/:formId/pdf', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Yetkisiz' });

        const [[form]] = await db.query(
            `SELECT ofm.*, u.first_name, u.last_name, u.email, o.order_number
             FROM onboarding_forms ofm
             JOIN users u ON u.id = ofm.user_id
             JOIN orders o ON o.id = ofm.order_id
             WHERE ofm.id = ?`,
            [req.params.formId]
        );
        if (!form) return res.status(404).json({ error: 'Form bulunamadı' });

        const data = typeof form.form_data === 'string' ? JSON.parse(form.form_data) : form.form_data;
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        doc.registerFont('NotoSans', FONT_PATH);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="onboarding-${form.order_number}.pdf"`);
        doc.pipe(res);

        // Başlık
        doc.font('NotoSans').fontSize(18).fillColor('#0f766e').text('B2B GROWTH ONBOARDING FORM', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(11).fillColor('#334e68').text(`Müşteri: ${form.first_name} ${form.last_name} (${form.email})`, { align: 'center' });
        doc.text(`Sipariş: ${form.order_number} | Tarih: ${new Date(form.submitted_at).toLocaleDateString('tr-TR')}`, { align: 'center' });
        doc.moveDown(1);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e2e8f0').stroke();
        doc.moveDown(1);

        const sections = [
            { key: 'bolum1', title: 'BÖLÜM 1: TEMEL BİLGİLER' },
            { key: 'bolum2', title: 'BÖLÜM 2: İŞ & ÜRÜN TANIMI' },
            { key: 'bolum3', title: 'BÖLÜM 3: REKABET' },
            { key: 'bolum4', title: 'BÖLÜM 4: HEDEF KİTLE & ORGANİZASYON' },
            { key: 'bolum5', title: 'BÖLÜM 5: MÜŞTERİ İHTİYAÇ & PROBLEM HARİTASI' },
            { key: 'bolum6', title: 'BÖLÜM 6: DEĞER ÖNERİLERİ' },
            { key: 'bolum7', title: 'BÖLÜM 7: SATIN ALMA DAVRANIŞI' },
            { key: 'bolum8', title: 'BÖLÜM 8: BEKLENTİ & SONUÇ' },
            { key: 'bolum9', title: 'BÖLÜM 9: KANAL & PERFORMANS' },
            { key: 'bolum10', title: 'BÖLÜM 10: TEKNOLOJİ & ALTYAPI' },
            { key: 'bolum11', title: 'BÖLÜM 11: OPERASYON SÜRECİ' },
            { key: 'bolum12', title: 'BÖLÜM 12: STRATEJİK GERÇEKLER' },
        ];

        for (const section of sections) {
            const sectionData = data[section.key];
            if (!sectionData) continue;

            doc.font('NotoSans').fontSize(12).fillColor('#0f766e').text(section.title);
            doc.moveDown(0.3);

            for (const [field, value] of Object.entries(sectionData)) {
                if (!value) continue;
                const label = fieldLabels[field] || field;
                doc.font('NotoSans').fontSize(9).fillColor('#64748b').text(label + ':');
                doc.font('NotoSans').fontSize(10).fillColor('#1e293b').text(String(value), { indent: 10 });
                doc.moveDown(0.3);
            }
            doc.moveDown(0.5);
            if (doc.y > 700) doc.addPage();
        }

        doc.end();
    } catch (err) {
        console.error('PDF error:', err);
        res.status(500).json({ error: 'PDF oluşturulamadı' });
    }
});

const fieldLabels = {
    firma_unvani: 'Firma Ünvanı', web_sitesi: 'Web Sitesi', iletisim_kisi: 'İletişim Kişisi / Ünvan', email: 'Email',
    firma_tanimi: 'Firma Tanımı', gelir_getiren_urun: 'En Çok Gelir Getiren Ürün/Hizmet', rakiplerden_fark: 'Rakiplerden Fark',
    rakip1: 'Rakip 1', rakip1_site: 'Rakip 1 Web Sitesi', rakip2: 'Rakip 2', rakip2_site: 'Rakip 2 Web Sitesi',
    rakip3: 'Rakip 3', rakip3_site: 'Rakip 3 Web Sitesi', rakip_guclu: 'Rakiplerin Güçlü Alanları', rakip_zayif: 'Rakiplerin Zayıf Alanları',
    hedef_sektorler: 'Hedef Sektörler', sirket_buyuklugu: 'Hedef Şirket Büyüklüğü',
    karar_pozisyon: 'Karar Verici Pozisyon', karar_departman: 'Karar Verici Departman', karar_sorumluluk: 'Sorumluluk ve Yetkileri',
    onaylayici_pozisyon: 'Onaylayıcı Pozisyon', onaylayici_departman: 'Onaylayıcı Departman', onaylayici_sorumluluk: 'Onaylayıcı Sorumlulukları',
    temel_ihtiyaclar: 'Temel İhtiyaçlar', ana_problemler: 'Ana Problemler', cozum_aranan: 'Çözüm Aradıkları Konular',
    iletisim_araclari: 'Kullanılan İletişim Araçları', satin_alma_faktörleri: 'Satın Alma Kararlarını Etkileyen Faktörler',
    ana_sorun: 'Çözülen Ana Sorun', ikincil_sorun: 'İkincil Sorun', diger_problemler: 'Diğer Problemler',
    ana_fayda: 'Ana Fayda', ikincil_fayda: 'İkincil Fayda', diger_faydalar: 'Diğer Faydalar',
    satin_alma_adimlari: 'Satın Alma Süreci Adımları', karar_faktörleri: 'Karar Faktörleri',
    gerekli_belgeler: 'Gerekli Bilgi/Belgeler', referans_turleri: 'Önem Verilen Referans Türleri',
    hizmet_sonrasi_beklenti: 'Hizmet Sonrası Beklenti', kpi_iyilestirme: 'İyileştirilmek İstenen KPI\'lar',
    onceki_kanallar: 'Daha Önce Kullanılan Kanallar', en_iyi_kanal: 'En İyi Performans Gelen Kanal', aylik_lead: 'Aylık Lead Sayısı',
    crm_kullanimi: 'CRM Kullanımı', analytics_kurulum: 'Analytics Kurulumu', conversion_tracking: 'Conversion Tracking',
    iletisim_kisi_operasyon: 'İletişimde Olacak Kişi', onay_suresi: 'Onay Süresi',
    buyume_engeli: 'Büyümenin Önündeki En Büyük Engel', pazarlama_problemi: 'Pazarlamada Yaşanan En Büyük Problem', is_birligi_beklenti: 'İş Birliğinden Beklenti'
};

// GET /api/onboarding-form/admin/all — tüm formları listele (pagination + search + status filter)
router.get('/admin/all', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Yetkisiz' });
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = 20;
        const offset = (page - 1) * limit;
        const search = req.query.search ? `%${req.query.search}%` : null;
        const statusFilter = req.query.status || null;

        const conditions = [];
        const params = [];
        if (search) {
            conditions.push('(u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)');
            params.push(search, search, search);
        }
        if (statusFilter && ['new', 'reviewed'].includes(statusFilter)) {
            conditions.push('of.status = ?');
            params.push(statusFilter);
        }
        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        const [rows] = await db.query(
            `SELECT ofm.id, ofm.user_id, ofm.order_id, ofm.product_names, ofm.status, ofm.submitted_at,
                    CONCAT(u.first_name, ' ', u.last_name) AS user_name, u.email AS user_email,
                    o.order_number
             FROM onboarding_forms ofm
             JOIN users u ON u.id = ofm.user_id
             JOIN orders o ON o.id = ofm.order_id
             ${where}
             ORDER BY ofm.submitted_at DESC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        const [[{ total }]] = await db.query(
            `SELECT COUNT(*) AS total FROM onboarding_forms ofm
             JOIN users u ON u.id = ofm.user_id
             ${where}`,
            params
        );

        res.json({ forms: rows, total, page, pages: Math.ceil(total / limit) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Sorgu hatası' });
    }
});

// GET /api/onboarding-form/admin/:formId — tek form detayı (form_data dahil)
router.get('/admin/:formId', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Yetkisiz' });
        const [[form]] = await db.query(
            `SELECT ofm.*, CONCAT(u.first_name, ' ', u.last_name) AS user_name, u.email AS user_email, o.order_number
             FROM onboarding_forms ofm
             JOIN users u ON u.id = ofm.user_id
             JOIN orders o ON o.id = ofm.order_id
             WHERE ofm.id = ?`,
            [req.params.formId]
        );
        if (!form) return res.status(404).json({ error: 'Form bulunamadı' });
        if (typeof form.form_data === 'string') form.form_data = JSON.parse(form.form_data);
        res.json(form);
    } catch (err) {
        res.status(500).json({ error: 'Sorgu hatası' });
    }
});

// PUT /api/onboarding-form/admin/:formId/status — durum güncelle
router.put('/admin/:formId/status', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ error: 'Yetkisiz' });
        const { status } = req.body;
        if (!['new', 'reviewed'].includes(status)) return res.status(400).json({ error: 'Geçersiz status' });
        await db.query('UPDATE onboarding_forms SET status = ? WHERE id = ?', [status, req.params.formId]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Güncelleme hatası' });
    }
});

export default router;
