import express from 'express';
import multer from 'multer';
import { fileURLToPath } from 'url';
import path from 'path';
import { promises as fs } from 'fs';
import db from '../config/database.js';
import { authMiddleware as authenticateToken } from '../middleware/auth.js';
import adminMiddleware from '../middleware/admin.js';
import { sendCustomMail } from '../services/emailService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../../');

const router = express.Router();

const pdfUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype === 'application/pdf') cb(null, true);
        else cb(new Error('Sadece PDF dosyası yüklenebilir'));
    }
});

const safeFilename = (s, fallback) => String(s || fallback)
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9-_]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || fallback;

// Schema check cache
let _eyeSchemaChecked = false;
let _hasLastRenewalCol = false;
let _hasUsageQuotaCol = false;
async function ensureEyeSchema() {
    if (_eyeSchemaChecked) return;
    try {
        const [rA] = await db.query("SHOW COLUMNS FROM subscriptions LIKE 'last_renewal_at'");
        _hasLastRenewalCol = rA.length > 0;
        const [rB] = await db.query("SHOW COLUMNS FROM products LIKE 'usage_quota'");
        _hasUsageQuotaCol = rB.length > 0;
        if (!_hasUsageQuotaCol) {
            try { await db.query("ALTER TABLE products ADD COLUMN usage_quota INT NULL AFTER duration_days"); _hasUsageQuotaCol = true; } catch (_) {}
        }
        await db.query(`CREATE TABLE IF NOT EXISTS eye_tracking_uploads (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            subscription_id INT NULL,
            order_id INT NULL,
            order_item_id INT NULL,
            product_key VARCHAR(64) NOT NULL,
            image_url VARCHAR(512) NOT NULL,
            original_filename VARCHAR(255) NULL,
            status ENUM('pending','reviewed','sent') DEFAULT 'pending',
            admin_notes TEXT NULL,
            report_pdf_url VARCHAR(512) NULL,
            sent_at DATETIME NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_user (user_id),
            INDEX idx_sub (subscription_id),
            INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
        _eyeSchemaChecked = true;
    } catch (e) {
        console.error('[eye-tracking schema] ', e.message);
    }
}

// Aktif eye-* subscription'larını + her birinin bu dönem kullanım sayısını döner
async function getUserEyePackages(userId) {
    await ensureEyeSchema();
    const renewalSelect = _hasLastRenewalCol ? 's.last_renewal_at' : 'NULL AS last_renewal_at';
    const quotaSelect   = _hasUsageQuotaCol  ? 'p.usage_quota'    : 'NULL AS usage_quota';
    const [rows] = await db.query(
        `SELECT s.id AS subscription_id, s.product_id, s.status, s.starts_at, s.expires_at, ${renewalSelect},
                p.product_key, p.name, ${quotaSelect}, p.duration_days
         FROM subscriptions s
         JOIN products p ON p.id = s.product_id
         WHERE s.user_id = ?
           AND p.product_key LIKE 'eye-%'
           AND s.status = 'active'
           AND (s.expires_at IS NULL OR s.expires_at > NOW())`,
        [userId]
    );
    const packages = [];
    for (const r of rows) {
        const periodStart = r.last_renewal_at || r.starts_at;
        const [usedRows] = await db.query(
            `SELECT COUNT(*) AS used FROM eye_tracking_uploads
             WHERE user_id = ? AND subscription_id = ? AND created_at >= ?`,
            [userId, r.subscription_id, periodStart]
        );
        const used = Number(usedRows[0]?.used || 0);
        const quota = Number(r.usage_quota || 0);
        packages.push({
            subscription_id: r.subscription_id,
            product_key: r.product_key,
            name: r.name,
            quota,
            used,
            remaining: Math.max(0, quota - used),
            period_started_at: periodStart,
            period_ends_at: r.expires_at
        });
    }
    return packages;
}

// POST /api/eye-tracking/upload — kullanıcı görsel yükler
router.post('/upload', authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Yetki yok' });

        const { dataUrl, filename } = req.body || {};
        if (!dataUrl || typeof dataUrl !== 'string') {
            return res.status(400).json({ error: 'Görsel verisi eksik' });
        }
        const m = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
        if (!m) return res.status(400).json({ error: 'Geçersiz görsel formatı' });
        const mime = m[1].toLowerCase();
        const extMap = { 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };
        const ext = extMap[mime];
        if (!ext) return res.status(400).json({ error: 'Desteklenmeyen görsel tipi' });

        const buf = Buffer.from(m[2], 'base64');
        if (buf.length > 15 * 1024 * 1024) {
            return res.status(400).json({ error: 'Görsel 15 MB üzerinde olamaz' });
        }

        // Kalan hak kontrol
        const packages = await getUserEyePackages(userId);
        const usable = packages.find(p => p.remaining > 0);
        if (!usable) {
            return res.status(403).json({ error: 'Bu dönem için kullanım hakkınız kalmadı veya aktif bir paket bulunamadı.' });
        }

        const safe = safeFilename(filename, 'gorsel');
        const finalName = `${userId}-${Date.now()}-${safe}.${ext}`;
        const uploadDir = path.join(projectRoot, 'public', 'uploads', 'eye-tracking');
        await fs.mkdir(uploadDir, { recursive: true });
        await fs.writeFile(path.join(uploadDir, finalName), buf);

        const imageUrl = `/uploads/eye-tracking/${finalName}`;
        await db.query(
            `INSERT INTO eye_tracking_uploads
             (user_id, subscription_id, product_key, image_url, original_filename, status)
             VALUES (?, ?, ?, ?, ?, 'pending')`,
            [userId, usable.subscription_id, usable.product_key, imageUrl, filename || finalName]
        );

        // Admin'e bildirim maili
        try {
            const [userRows] = await db.query('SELECT email, first_name, last_name FROM users WHERE id = ? LIMIT 1', [userId]);
            const u = userRows[0] || {};
            const [setRows] = await db.query("SELECT value FROM settings WHERE `key` = 'contact_email' LIMIT 1");
            const adminEmail = setRows[0]?.value || '';
            if (adminEmail) {
                const userName = [u.first_name, u.last_name].filter(Boolean).join(' ').trim() || u.email || `Kullanıcı #${userId}`;
                const imgFull = `https://khilonfast.com${imageUrl}`;
                const adminUrl = 'https://khilonfast.com/admin/eye-tracking-uploads';
                const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f4f7fb;padding:20px;margin:0;color:#102a43">
                    <div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #dde7f0;border-radius:12px;overflow:hidden">
                        <div style="background:linear-gradient(90deg,#1a3a52,#89b004);color:#fff;padding:20px 24px">
                            <h2 style="margin:0;font-size:1.15rem">Yeni Reklam Görsel Analizi Talebi</h2>
                        </div>
                        <div style="padding:24px;line-height:1.7">
                            <p><strong>Kullanıcı:</strong> ${userName} (${u.email || '-'})</p>
                            <p><strong>Paket:</strong> ${usable.product_key}</p>
                            <p><strong>Yükleme zamanı:</strong> ${new Date().toLocaleString('tr-TR')}</p>
                            <p><a href="${imgFull}" target="_blank">Görseli aç</a></p>
                            <p style="margin-top:18px">
                                <a href="${adminUrl}" style="background:#1a3a52;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Admin Panelinde Aç</a>
                            </p>
                        </div>
                    </div></body></html>`;
                await sendCustomMail({ to: adminEmail, subject: `[Khilonfast] Yeni reklam görseli yüklendi — ${userName}`, html });
            }
        } catch (e) {
            console.error('[eye upload] admin notify failed:', e.message);
        }

        const updated = await getUserEyePackages(userId);
        res.json({ ok: true, image_url: imageUrl, packages: updated });
    } catch (err) {
        console.error('eye-tracking upload error:', err);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// GET /api/eye-tracking/my-uploads
router.get('/my-uploads', authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Yetki yok' });
        await ensureEyeSchema();
        const [uploads] = await db.query(
            `SELECT id, product_key, image_url, status, admin_notes, report_pdf_url, sent_at, created_at
             FROM eye_tracking_uploads
             WHERE user_id = ?
             ORDER BY created_at DESC`,
            [userId]
        );
        const packages = await getUserEyePackages(userId);
        res.json({ uploads, packages });
    } catch (err) {
        console.error('eye-tracking my-uploads error:', err);
        res.status(500).json({ error: 'Sunucu hatası', detail: err.message });
    }
});

// GET /api/eye-tracking/:id/report.pdf — kullanıcı veya admin PDF indirir
router.get('/:id/report.pdf', authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT user_id, report_pdf_url FROM eye_tracking_uploads WHERE id = ?`,
            [req.params.id]
        );
        const row = rows[0];
        if (!row) return res.status(404).json({ error: 'Bulunamadı' });
        if (req.user.id !== row.user_id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Yetki yok' });
        }
        if (!row.report_pdf_url) return res.status(404).json({ error: 'Rapor henüz yüklenmedi' });
        const filePath = path.join(projectRoot, 'public', row.report_pdf_url.replace(/^\//, ''));
        res.sendFile(filePath);
    } catch (err) {
        console.error('eye-tracking report.pdf error:', err);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// -------- ADMIN --------
const adminRouter = express.Router();
adminRouter.use(authenticateToken, adminMiddleware);

// GET /api/admin/eye-tracking/user/:userId/packages — kullanıcının aktif eye paketleri
adminRouter.get('/user/:userId/packages', async (req, res) => {
    try {
        const userId = Number(req.params.userId);
        const packages = await getUserEyePackages(userId);
        res.json({ packages });
    } catch (err) {
        console.error('admin user packages error:', err);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// GET /api/admin/eye-tracking — tüm uploads (filter)
adminRouter.get('/', async (req, res) => {
    try {
        const status = req.query.status;
        const params = [];
        let where = '1=1';
        if (status && ['pending', 'reviewed', 'sent'].includes(status)) {
            where = 'u.status = ?';
            params.push(status);
        }
        const [rows] = await db.query(
            `SELECT u.id, u.user_id, u.subscription_id, u.product_key, u.image_url, u.original_filename,
                    u.status, u.admin_notes, u.report_pdf_url, u.sent_at, u.created_at,
                    us.email, us.first_name, us.last_name, us.phone
             FROM eye_tracking_uploads u
             LEFT JOIN users us ON us.id = u.user_id
             WHERE ${where}
             ORDER BY u.created_at DESC
             LIMIT 500`,
            params
        );
        res.json({ uploads: rows });
    } catch (err) {
        console.error('admin eye-tracking list error:', err);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// POST /api/admin/eye-tracking/:id/report — multipart PDF + notes + mail
adminRouter.post('/:id/report', (req, res, next) => {
    pdfUpload.single('file')(req, res, (err) => {
        if (err) return res.status(400).json({ error: err.message || 'Yükleme hatası' });
        next();
    });
}, async (req, res) => {
    try {
        const id = Number(req.params.id);
        const adminNotes = (req.body?.admin_notes || '').toString();
        const subjectOverride = (req.body?.subject || '').toString();

        const [rows] = await db.query(
            `SELECT u.*, us.email, us.first_name FROM eye_tracking_uploads u
             LEFT JOIN users us ON us.id = u.user_id WHERE u.id = ?`, [id]
        );
        const row = rows[0];
        if (!row) return res.status(404).json({ error: 'Yükleme bulunamadı' });
        if (!req.file) return res.status(400).json({ error: 'PDF dosyası eksik' });

        const safe = safeFilename(row.product_key, 'rapor');
        const finalName = `${row.user_id}-${id}-${Date.now()}-${safe}.pdf`;
        const uploadDir = path.join(projectRoot, 'public', 'uploads', 'eye-reports');
        await fs.mkdir(uploadDir, { recursive: true });
        const filePath = path.join(uploadDir, finalName);
        await fs.writeFile(filePath, req.file.buffer);
        const reportUrl = `/uploads/eye-reports/${finalName}`;

        await db.query(
            `UPDATE eye_tracking_uploads
             SET report_pdf_url = ?, admin_notes = ?, status = 'sent', sent_at = NOW()
             WHERE id = ?`,
            [reportUrl, adminNotes, id]
        );

        // Mail (attachment ile)
        if (row.email) {
            const subject = subjectOverride || 'Reklam Görsel Analiz Raporunuz Hazır';
            const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f4f7fb;padding:20px;margin:0;color:#102a43">
                <div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #dde7f0;border-radius:12px;overflow:hidden">
                    <div style="background:linear-gradient(90deg,#1a3a52,#89b004);color:#fff;padding:20px 24px">
                        <h2 style="margin:0;font-size:1.2rem">khilonfast — Reklam Görsel Analizi</h2>
                    </div>
                    <div style="padding:24px;line-height:1.7">
                        <p>Merhaba ${row.first_name || ''},</p>
                        <p>Yüklediğiniz reklam görseli için analiz raporunuz hazır. Detaylar ek dosyada (PDF).</p>
                        ${adminNotes ? `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin:12px 0"><strong>Analist Notu:</strong><br>${adminNotes.replace(/\n/g, '<br>')}</div>` : ''}
                        <p>Hesabımdan da bu rapora her zaman erişebilirsiniz.</p>
                        <p style="margin-top:16px">Saygılarımızla,<br>Khilonfast Ekibi</p>
                    </div>
                </div></body></html>`;
            try {
                await sendCustomMail({
                    to: row.email,
                    subject,
                    html,
                    attachments: [{ filename: `${safe}.pdf`, path: filePath }]
                });
            } catch (mailErr) {
                console.error('eye report mail error:', mailErr);
            }
        }

        res.json({ ok: true, report_url: reportUrl });
    } catch (err) {
        console.error('admin eye-tracking report error:', err);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

// PUT /api/admin/eye-tracking/:id/notes — sadece not güncelle (rapor göndermeden)
adminRouter.put('/:id/notes', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const notes = (req.body?.admin_notes || '').toString();
        await db.query(
            `UPDATE eye_tracking_uploads
             SET admin_notes = ?, status = CASE WHEN status = 'pending' THEN 'reviewed' ELSE status END
             WHERE id = ?`,
            [notes, id]
        );
        res.json({ ok: true });
    } catch (err) {
        console.error('admin eye-tracking notes error:', err);
        res.status(500).json({ error: 'Sunucu hatası' });
    }
});

export { adminRouter as adminEyeTrackingRouter };
export default router;
