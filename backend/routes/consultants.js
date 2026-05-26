import express from 'express';
import db from '../config/database.js';
import cacheMiddleware from '../middleware/cache.js';
import { sendCustomMail } from '../services/emailService.js';
import { CONSULTANT_TPL, consultantBuildVars, consultantSendMail, consultantBookingToken } from '../services/consultantMailer.js';

const router = express.Router();

const FRONTEND_URL = (process.env.FRONTEND_URL || 'https://khilonfast.com').replace(/\/+$/, '');

// settings tablosundan tekil değer
async function getSettingValue(key, fallback = '') {
    try {
        const [r] = await db.query('SELECT setting_value FROM settings WHERE setting_key = ? LIMIT 1', [key]);
        return r[0]?.setting_value ?? fallback;
    } catch {
        return fallback;
    }
}

const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

// GET /api/consultants — aktif danışmanlar listesi
router.get('/', cacheMiddleware(300), async (req, res) => {
    try {
        const { sektor } = req.query;
        let query = 'SELECT id, slug, name, title, bio, photo_url, stars, review_count, sectors FROM consultants WHERE is_active = TRUE';
        const params = [];

        const [consultants] = await db.query(query, params);

        // Sektör filtresi (JSON array içinde arama)
        let filtered = consultants;
        if (sektor) {
            filtered = consultants.filter(c => {
                const sectors = typeof c.sectors === 'string' ? JSON.parse(c.sectors) : (c.sectors || []);
                return sectors.includes(sektor);
            });
        }

        res.json({ consultants: filtered });
    } catch (err) {
        console.error('Get consultants error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/consultants/bookings/:id — ödeme devam sayfası için booking özeti
// (':slug' route'undan ÖNCE tanımlanmalı — Express sıra ile eşler)
router.get('/bookings/:id', async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT b.id, b.name, b.email, b.status, b.service_id, b.availability_id,
                    cs.title AS service_title, cs.price, cs.currency, cs.plus_vat,
                    c.name AS consultant_name, c.slug AS consultant_slug,
                    a.available_date, a.start_time, a.end_time
             FROM consultant_bookings b
             JOIN consultant_services cs ON cs.id = b.service_id
             JOIN consultants c ON c.id = b.consultant_id
             LEFT JOIN consultant_availability a ON a.id = b.availability_id
             WHERE b.id = ?`,
            [req.params.id]
        );
        if (!rows.length) return res.status(404).json({ error: 'Booking not found' });
        res.json({ booking: rows[0] });
    } catch (err) {
        console.error('Get booking error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/consultants/:slug — danışman detayı + hizmetleri
router.get('/:slug', cacheMiddleware(300), async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM consultants WHERE slug = ? AND is_active = TRUE LIMIT 1',
            [req.params.slug]
        );
        if (!rows.length) return res.status(404).json({ error: 'Consultant not found' });

        const consultant = rows[0];

        // Tüm hizmetler (parent + alt paketler)
        const [services] = await db.query(
            `SELECT * FROM consultant_services
             WHERE consultant_id = ? AND is_active = TRUE
             ORDER BY sort_order ASC`,
            [consultant.id]
        );

        // Alt paketleri parent'a bağla
        const parentServices = services.filter(s => !s.parent_service_id);
        const childMap = {};
        services.filter(s => s.parent_service_id).forEach(s => {
            if (!childMap[s.parent_service_id]) childMap[s.parent_service_id] = [];
            childMap[s.parent_service_id].push(s);
        });
        parentServices.forEach(s => { s.sub_packages = childMap[s.id] || []; });

        consultant.services = parentServices;
        res.json({ consultant });
    } catch (err) {
        console.error('Get consultant error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/consultants/:slug/availability — müsait slotlar
router.get('/:slug/availability', async (req, res) => {
    try {
        const { service_id, month } = req.query; // month: YYYY-MM

        const [consultant] = await db.query('SELECT id FROM consultants WHERE slug = ?', [req.params.slug]);
        if (!consultant.length) return res.status(404).json({ error: 'Not found' });

        // Süresi geçmiş hold'ları serbest bırak
        await db.query(
            `UPDATE consultant_availability SET status='available', held_until=NULL
             WHERE status='held' AND held_until < NOW()`
        );

        let query = `SELECT id, DATE_FORMAT(available_date, "%Y-%m-%d") as available_date, start_time, end_time, service_id
                     FROM consultant_availability
                     WHERE consultant_id = ? AND status = 'available'`;
        const params = [consultant[0].id];

        if (service_id) {
            query += ' AND (service_id = ? OR service_id IS NULL)';
            params.push(service_id);
        }
        if (month) {
            query += ' AND DATE_FORMAT(available_date, "%Y-%m") = ?';
            params.push(month);
        }
        query += ' ORDER BY available_date, start_time';

        const [slots] = await db.query(query, params);
        res.json({ slots });
    } catch (err) {
        console.error('Get availability error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/consultants/bookings/hold — slot hold et + booking oluştur
router.post('/bookings/hold', async (req, res) => {
    const { consultant_slug, service_id, availability_id, name, email, phone, company, topic } = req.body;

    if (!consultant_slug || !service_id || !name || !email) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [consultant] = await connection.query('SELECT id FROM consultants WHERE slug = ?', [consultant_slug]);
        if (!consultant.length) return res.status(404).json({ error: 'Consultant not found' });
        const consultantId = consultant[0].id;

        // Slot hold
        if (availability_id) {
            const [slot] = await connection.query(
                `SELECT * FROM consultant_availability WHERE id = ? AND status = 'available' FOR UPDATE`,
                [availability_id]
            );
            if (!slot.length) {
                await connection.rollback();
                return res.status(409).json({ error: 'Bu slot artık müsait değil. Lütfen başka bir zaman seçin.' });
            }
            const holdUntil = new Date(Date.now() + 15 * 60 * 1000);
            await connection.query(
                `UPDATE consultant_availability SET status='held', held_until=? WHERE id=?`,
                [holdUntil, availability_id]
            );
        }

        // Booking oluştur
        const [result] = await connection.query(
            `INSERT INTO consultant_bookings (consultant_id, service_id, availability_id, name, email, phone, company, topic, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [consultantId, service_id, availability_id || null, name, email, phone || null, company || null, topic || null]
        );

        await connection.commit();

        const newBookingId = result.insertId;

        // Admin'e yeni randevu bildirimi
        try {
            const adminEmail = await getSettingValue('contact_email', '');
            if (adminEmail) {
                const v = await consultantBuildVars({ id: newBookingId, service_id, availability_id, name });
                const html = '<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f4f7fb;padding:20px;margin:0;color:#102a43">'
                    + '<div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #dde7f0;border-radius:12px;overflow:hidden">'
                    + '<div style="background:linear-gradient(90deg,#1a3a52,#89b004);color:#fff;padding:20px 24px">'
                    + '<h2 style="margin:0;font-size:1.15rem">Yeni Danışmanlık Randevusu</h2></div>'
                    + '<div style="padding:24px;line-height:1.7">'
                    + `<p><strong>Müşteri:</strong> ${escapeHtml(name)} (${escapeHtml(email)})</p>`
                    + `<p><strong>Telefon:</strong> ${escapeHtml(phone || '-')}</p>`
                    + `<p><strong>Hizmet:</strong> ${escapeHtml(v.package_name || ('#' + service_id))}</p>`
                    + `<p><strong>Seçilen Tarih & Saat:</strong> ${escapeHtml(v.appointment_datetime || 'Belirtilmedi')}</p>`
                    + `<p><strong>Konu:</strong> ${escapeHtml(topic || '-')}</p>`
                    + `<p style="margin-top:18px"><a href="${FRONTEND_URL}/admin/bookings" `
                    + 'style="background:#1a3a52;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Admin Panelinde Aç</a></p>'
                    + '</div></div></body></html>';
                await sendCustomMail({ to: adminEmail, subject: `[Khilonfast] Yeni Danışmanlık Randevusu — ${name}`, html });
            }
        } catch (e) {
            console.error('[consultants] admin notify failed:', e.message);
        }

        res.json({
            booking_id: newBookingId,
            hold_expires_at: availability_id ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null,
            message: 'Rezervasyon talebi alındı'
        });
    } catch (err) {
        await connection.rollback();
        console.error('Hold booking error:', err);
        res.status(500).json({ error: 'Server error' });
    } finally {
        connection.release();
    }
});

// POST /api/consultants/bookings/:id/confirm — ödeme sonrası onayla
router.post('/bookings/:id/confirm', async (req, res) => {
    const { order_id } = req.body;
    try {
        const [booking] = await db.query('SELECT * FROM consultant_bookings WHERE id = ?', [req.params.id]);
        if (!booking.length) return res.status(404).json({ error: 'Booking not found' });

        await db.query(
            `UPDATE consultant_bookings SET status='confirmed', order_id=? WHERE id=?`,
            [order_id || null, req.params.id]
        );

        // Slotu booked yap
        if (booking[0].availability_id) {
            await db.query(
                `UPDATE consultant_availability SET status='booked' WHERE id=?`,
                [booking[0].availability_id]
            );
        }

        // "Randevu Onaylandı" maili — tekrar göndermeyi önle
        if (!booking[0].confirmation_sent_at) {
            const vars = await consultantBuildVars(booking[0]);
            if (await consultantSendMail(CONSULTANT_TPL.CONFIRM, booking[0].email, vars)) {
                await db.query('UPDATE consultant_bookings SET confirmation_sent_at = NOW() WHERE id = ?', [req.params.id]);
            }
        }

        res.json({ success: true, message: 'Rezervasyon onaylandı' });
    } catch (err) {
        console.error('Confirm booking error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/consultants/bookings/:id/defer — "Daha Sonra Öde" → ödeme son-adım maili
router.post('/bookings/:id/defer', async (req, res) => {
    try {
        const [booking] = await db.query('SELECT * FROM consultant_bookings WHERE id = ?', [req.params.id]);
        if (!booking.length) return res.status(404).json({ error: 'Booking not found' });

        if (!booking[0].payment_reminder_sent_at) {
            const vars = await consultantBuildVars(booking[0]);
            if (await consultantSendMail(CONSULTANT_TPL.PAYMENT, booking[0].email, vars)) {
                await db.query('UPDATE consultant_bookings SET payment_reminder_sent_at = NOW() WHERE id = ?', [req.params.id]);
            }
        }
        res.json({ success: true });
    } catch (err) {
        console.error('Defer booking error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/consultants/bookings/:id/reschedule — takvim değiştir (48 saat kuralı)
router.post('/bookings/:id/reschedule', async (req, res) => {
    const { token, availability_id } = req.body;
    const bookingId = req.params.id;
    try {
        if (token !== consultantBookingToken(bookingId)) {
            return res.status(403).json({ error: 'Geçersiz bağlantı.' });
        }
        if (!availability_id) return res.status(400).json({ error: 'Yeni slot seçilmedi.' });

        const [rows] = await db.query('SELECT * FROM consultant_bookings WHERE id = ?', [bookingId]);
        if (!rows.length) return res.status(404).json({ error: 'Booking not found' });
        const booking = rows[0];
        if (['cancelled', 'completed'].includes(booking.status)) {
            return res.status(409).json({ error: 'Bu randevu güncellenemez.' });
        }

        // 48 saat kuralı
        if (booking.availability_id) {
            const [a] = await db.query(
                'SELECT TIMESTAMP(available_date, start_time) AS appt FROM consultant_availability WHERE id = ?',
                [booking.availability_id]
            );
            if (a[0]?.appt && new Date(a[0].appt).getTime() < Date.now() + 48 * 3600 * 1000) {
                return res.status(409).json({ error: 'Randevunuza 48 saatten az kaldığı için değişiklik yapılamaz.' });
            }
        }

        const [ns] = await db.query(
            `SELECT id FROM consultant_availability WHERE id = ? AND status = 'available'`,
            [availability_id]
        );
        if (!ns.length) return res.status(409).json({ error: 'Seçilen slot artık müsait değil.' });

        if (booking.availability_id) {
            await db.query(`UPDATE consultant_availability SET status='available', held_until=NULL WHERE id=?`, [booking.availability_id]);
        }
        await db.query(`UPDATE consultant_availability SET status='booked', held_until=NULL WHERE id=?`, [availability_id]);
        await db.query('UPDATE consultant_bookings SET availability_id=?, reminder_sent_at=NULL WHERE id=?', [availability_id, bookingId]);

        const vars = await consultantBuildVars({ ...booking, availability_id });
        await consultantSendMail(CONSULTANT_TPL.RESCHEDULE, booking.email, vars);

        res.json({ success: true });
    } catch (err) {
        console.error('Reschedule booking error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/consultants/bookings/:id/cancel — randevu iptali (48 saat kuralı)
router.post('/bookings/:id/cancel', async (req, res) => {
    const { token } = req.body;
    const bookingId = req.params.id;
    try {
        if (token !== consultantBookingToken(bookingId)) {
            return res.status(403).json({ error: 'Geçersiz bağlantı.' });
        }
        const [rows] = await db.query('SELECT * FROM consultant_bookings WHERE id = ?', [bookingId]);
        if (!rows.length) return res.status(404).json({ error: 'Booking not found' });
        const booking = rows[0];
        if (booking.status === 'cancelled') return res.json({ success: true });
        if (booking.status === 'completed') return res.status(409).json({ error: 'Tamamlanmış randevu iptal edilemez.' });

        if (booking.availability_id) {
            const [a] = await db.query(
                'SELECT TIMESTAMP(available_date, start_time) AS appt FROM consultant_availability WHERE id = ?',
                [booking.availability_id]
            );
            if (a[0]?.appt && new Date(a[0].appt).getTime() < Date.now() + 48 * 3600 * 1000) {
                return res.status(409).json({ error: 'Randevunuza 48 saatten az kaldığı için iptal yapılamaz.' });
            }
        }

        await db.query(`UPDATE consultant_bookings SET status='cancelled' WHERE id=?`, [bookingId]);
        if (booking.availability_id) {
            await db.query(`UPDATE consultant_availability SET status='available', held_until=NULL WHERE id=?`, [booking.availability_id]);
        }
        res.json({ success: true });
    } catch (err) {
        console.error('Cancel booking error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
