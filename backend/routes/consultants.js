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

// .ics (iCalendar) takvim daveti üretir — PHP buildIcsInvite muadili
function icsEscape(s) {
    return String(s ?? '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}
// 'YYYY-MM-DD HH:MM:SS' → 'YYYYMMDDTHHMMSS' (yerel, TZID ile birlikte kullanılır)
function icsLocalStamp(dt) {
    const m = String(dt).match(/(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
    if (!m) return null;
    return `${m[1]}${m[2]}${m[3]}T${m[4]}${m[5]}${m[6] || '00'}`;
}
function buildIcsInvite({ uid, startAt, endAt, summary, description, location, organizerEmail, attendeeEmail, sequence = 0 }) {
    const dtStart = icsLocalStamp(startAt);
    const dtEnd = icsLocalStamp(endAt);
    // DTSTAMP: sabit referans (Date.now kullanılmıyor; start baz alınır)
    const dtStamp = dtStart || '20260101T000000';
    const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//KhilonFast//Consultant Booking//TR',
        'CALSCALE:GREGORIAN',
        'METHOD:REQUEST',
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `SEQUENCE:${sequence}`,
        `DTSTAMP:${dtStamp}`,
        `DTSTART;TZID=Europe/Istanbul:${dtStart}`,
        `DTEND;TZID=Europe/Istanbul:${dtEnd}`,
        `SUMMARY:${icsEscape(summary)}`,
        `DESCRIPTION:${icsEscape(description)}`,
    ];
    if (location) lines.push(`LOCATION:${icsEscape(location)}`);
    if (organizerEmail) lines.push(`ORGANIZER:mailto:${organizerEmail}`);
    if (attendeeEmail) lines.push(`ATTENDEE;RSVP=TRUE:mailto:${attendeeEmail}`);
    lines.push('STATUS:CONFIRMED', 'END:VEVENT', 'END:VCALENDAR');
    return lines.join('\r\n');
}

// Randevu sonrası danışman + kullanıcı bildirimi (.ics davet ekli) — PHP consultantNotifyBooking muadili
async function consultantNotifyBooking(bookingId) {
    try {
        const [rows] = await db.query(
            `SELECT b.*, c.name AS consultant_name, c.email AS consultant_email,
                    s.title AS service_title, s.fixed_end_time
               FROM consultant_bookings b
               JOIN consultants c ON c.id = b.consultant_id
               LEFT JOIN consultant_services s ON s.id = b.service_id
              WHERE b.id = ? LIMIT 1`,
            [bookingId]
        );
        if (!rows.length) return;
        const b = rows[0];
        if ((b.booking_type || 'slot') === 'lead_form') return;

        // start/end çöz (availability_id fallback)
        let startAt = b.start_at, endAt = b.end_at;
        if ((!startAt || !endAt) && b.availability_id) {
            const [a] = await db.query('SELECT available_date, start_time, end_time FROM consultant_availability WHERE id=?', [b.availability_id]);
            if (a.length) {
                const d = String(a[0].available_date).slice(0, 10);
                startAt = `${d} ${a[0].start_time}`;
                endAt = `${d} ${a[0].end_time}`;
            }
        }
        if (!startAt || !endAt) return;

        const sd = String(startAt);
        const dateLabel = sd.slice(8, 10) + '.' + sd.slice(5, 7) + '.' + sd.slice(0, 4);
        const timeLabel = sd.slice(11, 16) + '–' + String(endAt).slice(11, 16);
        const svcTitle = b.service_title || 'Danışmanlık';

        const ics = buildIcsInvite({
            uid: `consultant-booking-${bookingId}@khilonfast.com`,
            startAt, endAt,
            summary: `KhilonFast — ${svcTitle}`,
            description: `Danışman: ${b.consultant_name}\\nMüşteri: ${b.name}\\nHizmet: ${svcTitle}`,
            location: 'Online / KhilonFast',
            organizerEmail: b.consultant_email || undefined,
            attendeeEmail: b.email || undefined,
        });
        const icsAtt = [{ filename: 'randevu.ics', content: ics, contentType: 'text/calendar; method=REQUEST; charset=UTF-8' }];

        const buildHtml = (title, intro) => '<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f4f7fb;padding:20px;margin:0;color:#102a43">'
            + '<div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #dde7f0;border-radius:12px;overflow:hidden">'
            + '<div style="background:linear-gradient(90deg,#1a3a52,#89b004);color:#fff;padding:20px 24px">'
            + `<h2 style="margin:0;font-size:1.15rem">${title}</h2></div>`
            + '<div style="padding:24px;line-height:1.7">'
            + `<p>${intro}</p>`
            + `<p><strong>Hizmet:</strong> ${escapeHtml(svcTitle)}</p>`
            + `<p><strong>Tarih:</strong> ${escapeHtml(dateLabel)}</p>`
            + `<p><strong>Saat:</strong> ${escapeHtml(timeLabel)}</p>`
            + `<p><strong>Danışman:</strong> ${escapeHtml(b.consultant_name)}</p>`
            + `<p><strong>Müşteri:</strong> ${escapeHtml(b.name)} (${escapeHtml(b.email)})</p>`
            + `<p><strong>Telefon:</strong> ${escapeHtml(b.phone || '-')}</p>`
            + (b.topic ? `<p><strong>Konu:</strong> ${escapeHtml(b.topic)}</p>` : '')
            + '<p style="margin-top:16px;color:#627d98;font-size:0.9rem">Takvim daveti (.ics) ektedir.</p>'
            + '</div></div></body></html>';

        // Danışmana
        if (b.consultant_email) {
            try {
                await sendCustomMail({ to: b.consultant_email, subject: `[Khilonfast] Yeni Randevu — ${b.name} (${dateLabel} ${sd.slice(11,16)})`, html: buildHtml('Yeni Randevunuz Var', `Sayın ${escapeHtml(b.consultant_name)}, aşağıdaki randevu oluşturuldu.`), attachments: icsAtt });
            } catch (e) { console.error('[consultants] consultant notify failed:', e.message); }
        }
        // Kullanıcıya
        if (b.email) {
            try {
                await sendCustomMail({ to: b.email, subject: `[Khilonfast] Randevunuz Oluşturuldu — ${dateLabel} ${sd.slice(11,16)}`, html: buildHtml('Randevunuz Oluşturuldu', `Sayın ${escapeHtml(b.name)}, randevunuz başarıyla oluşturuldu.`), attachments: icsAtt });
            } catch (e) { console.error('[consultants] user notify failed:', e.message); }
        }
    } catch (e) {
        console.error('[consultants] consultantNotifyBooking error:', e.message);
    }
}

// İki zaman aralığı çakışıyor mu (HH:MM:SS karşılaştırması)
const toSec = (t) => { const [h, m, s] = String(t).split(':').map(Number); return (h || 0) * 3600 + (m || 0) * 60 + (s || 0); };
function rangesOverlap(aStart, aEnd, bStart, bEnd) {
    return toSec(aStart) < toSec(bEnd) && toSec(aEnd) > toSec(bStart);
}

// Ürün tipine göre runtime slot üretir (PHP generateSlotsForService muadili)
async function generateSlotsForService(consultantId, service) {
    const bookingType = service.booking_type || 'slot';
    if (bookingType === 'lead_form') return [];

    const [ranges] = await db.query(
        `SELECT DATE_FORMAT(available_date, "%Y-%m-%d") as available_date, start_time, end_time
         FROM consultant_availability
         WHERE consultant_id = ? AND status = 'available' AND available_date >= CURDATE()
         ORDER BY available_date, start_time`,
        [consultantId]
    );
    const [bookings] = await db.query(
        `SELECT b.start_at, b.end_at, b.availability_id,
                DATE_FORMAT(a.available_date, "%Y-%m-%d") as a_date, a.start_time as a_start, a.end_time as a_end
         FROM consultant_bookings b
         LEFT JOIN consultant_availability a ON a.id = b.availability_id
         WHERE b.consultant_id = ? AND b.status IN ('pending','confirmed','completed')`,
        [consultantId]
    );
    const busy = {};
    for (const bk of bookings) {
        if (bk.start_at && bk.end_at) {
            const d = String(bk.start_at).slice(0, 10);
            (busy[d] ||= []).push([String(bk.start_at).slice(11, 19), String(bk.end_at).slice(11, 19)]);
        } else if (bk.a_date) {
            (busy[bk.a_date] ||= []).push([bk.a_start, bk.a_end]);
        }
    }
    const isFree = (date, start, end) => !(busy[date] || []).some(([bs, be]) => rangesOverlap(start, end, bs, be));
    const out = [];

    if (bookingType === 'fixed_day') {
        const fs = service.fixed_start_time || '10:00:00';
        const fe = service.fixed_end_time || '16:00:00';
        for (const r of ranges) {
            if (toSec(r.start_time) <= toSec(fs) && toSec(r.end_time) >= toSec(fe) && isFree(r.available_date, fs, fe)) {
                out.push({ available_date: r.available_date, start_time: fs, end_time: fe });
            }
        }
        return out;
    }

    let dur = parseInt(service.duration_minutes) || 60;
    let interval = parseInt(service.slot_interval_minutes) || 60;
    if (dur <= 0) dur = 60;
    if (interval <= 0) interval = 60;
    for (const r of ranges) {
        const startSec = toSec(r.start_time), endSec = toSec(r.end_time);
        for (let s = startSec; s + dur * 60 <= endSec; s += interval * 60) {
            const fmt = (sec) => `${String(Math.floor(sec / 3600)).padStart(2, '0')}:${String(Math.floor((sec % 3600) / 60)).padStart(2, '0')}:00`;
            const slotStart = fmt(s), slotEnd = fmt(s + dur * 60);
            if (isFree(r.available_date, slotStart, slotEnd)) {
                out.push({ available_date: r.available_date, start_time: slotStart, end_time: slotEnd });
            }
        }
    }
    return out;
}

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

        // service_id verilirse ürün tipine göre runtime slot üret (dinamik)
        if (service_id) {
            const [svc] = await db.query('SELECT * FROM consultant_services WHERE id = ?', [service_id]);
            if (!svc.length) return res.status(404).json({ error: 'Service not found' });
            const service = svc[0];
            const bookingType = service.booking_type || 'slot';
            if (bookingType === 'lead_form') return res.json({ slots: [], booking_type: 'lead_form' });
            const slots = await generateSlotsForService(consultant[0].id, service);
            return res.json({ slots, booking_type: bookingType });
        }

        // Legacy: ham müsaitlik
        let query = `SELECT id, DATE_FORMAT(available_date, "%Y-%m-%d") as available_date, start_time, end_time, service_id
                     FROM consultant_availability
                     WHERE consultant_id = ? AND status = 'available'`;
        const params = [consultant[0].id];
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
    const { consultant_slug, service_id, availability_id, start_at, name, email, phone, company, topic } = req.body;

    if (!consultant_slug || !service_id || !name || !email) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [consultant] = await connection.query('SELECT id FROM consultants WHERE slug = ?', [consultant_slug]);
        if (!consultant.length) { await connection.rollback(); return res.status(404).json({ error: 'Consultant not found' }); }
        const consultantId = consultant[0].id;

        const [svc] = await connection.query('SELECT * FROM consultant_services WHERE id = ?', [service_id]);
        if (!svc.length) { await connection.rollback(); return res.status(404).json({ error: 'Service not found' }); }
        const service = svc[0];
        const bookingType = service.booking_type || 'slot';
        if (bookingType === 'lead_form') { await connection.rollback(); return res.status(400).json({ error: 'Bu hizmet randevu değil, başvuru formu ile alınır.' }); }

        // start_at + end_at hesapla + çakışma kontrolü
        let endAt = null;
        if (start_at) {
            const startSec = new Date(start_at.replace(' ', 'T')).getTime();
            if (bookingType === 'fixed_day') {
                endAt = start_at.slice(0, 10) + ' ' + (service.fixed_end_time || '16:00:00');
            } else {
                const dur = parseInt(service.duration_minutes) || 60;
                endAt = new Date(startSec + dur * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
            }
            const [existing] = await connection.query(
                `SELECT start_at, end_at, availability_id FROM consultant_bookings
                 WHERE consultant_id = ? AND status IN ('pending','confirmed','completed')
                   AND ((start_at IS NOT NULL AND DATE(start_at)=?) OR availability_id IS NOT NULL)`,
                [consultantId, start_at.slice(0, 10)]
            );
            for (const ex of existing) {
                let exStart = ex.start_at, exEnd = ex.end_at;
                if ((!exStart || !exEnd) && ex.availability_id) {
                    const [a] = await connection.query('SELECT available_date, start_time, end_time FROM consultant_availability WHERE id=?', [ex.availability_id]);
                    if (a.length) { exStart = `${String(a[0].available_date).slice(0,10)} ${a[0].start_time}`; exEnd = `${String(a[0].available_date).slice(0,10)} ${a[0].end_time}`; }
                }
                if (exStart && exEnd) {
                    const s1 = new Date(start_at.replace(' ', 'T')).getTime(), e1 = new Date(endAt.replace(' ', 'T')).getTime();
                    const s2 = new Date(String(exStart).replace(' ', 'T')).getTime(), e2 = new Date(String(exEnd).replace(' ', 'T')).getTime();
                    if (s1 < e2 && e1 > s2) { await connection.rollback(); return res.status(409).json({ error: 'Bu saat artık dolu. Lütfen başka bir zaman seçin.' }); }
                }
            }
        }

        // Eski model: availability_id hold (geriye uyum)
        if (availability_id) {
            const [slot] = await connection.query(
                `SELECT * FROM consultant_availability WHERE id = ? AND status = 'available' FOR UPDATE`,
                [availability_id]
            );
            if (!slot.length) {
                await connection.rollback();
                return res.status(409).json({ error: 'Bu slot artık müsait değil. Lütfen başka bir zaman seçin.' });
            }
            const holdUntil = new Date(Date.now() + 10 * 60 * 1000);
            await connection.query(
                `UPDATE consultant_availability SET status='held', held_until=? WHERE id=?`,
                [holdUntil, availability_id]
            );
        }

        // Booking oluştur (start_at/end_at + booking_type)
        const [result] = await connection.query(
            `INSERT INTO consultant_bookings (consultant_id, service_id, availability_id, start_at, end_at, booking_type, name, email, phone, company, topic, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [consultantId, service_id, availability_id || null, start_at || null, endAt, bookingType, name, email, phone || null, company || null, topic || null]
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

        // Danışman + kullanıcı bildirimi (.ics takvim daveti ekli)
        await consultantNotifyBooking(newBookingId);

        res.json({
            booking_id: newBookingId,
            hold_expires_at: availability_id ? new Date(Date.now() + 10 * 60 * 1000).toISOString() : null,
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

// POST /api/consultants/leads — Fractional CMO (lead_form) başvurusu (takvimsiz)
router.post('/leads', async (req, res) => {
    const { consultant_slug, service_id, name, company, position, email, phone, website, needs, monthly_pref, kvkk_consent } = req.body;
    if (!consultant_slug || !name || !email) return res.status(400).json({ error: 'Ad, e-posta ve danışman zorunlu' });
    if (!kvkk_consent) return res.status(400).json({ error: 'KVKK onayı gereklidir' });
    try {
        let consultant;
        try {
            [consultant] = await db.query('SELECT id, name, email FROM consultants WHERE slug = ? AND is_active = TRUE', [consultant_slug]);
        } catch (e) {
            // email kolonu yoksa
            [consultant] = await db.query('SELECT id, name FROM consultants WHERE slug = ? AND is_active = TRUE', [consultant_slug]);
        }
        if (!consultant.length) return res.status(404).json({ error: 'Consultant not found' });
        const consultantId = consultant[0].id;
        const consultantEmail = consultant[0].email || '';

        const [result] = await db.query(
            `INSERT INTO consultant_leads (consultant_id, service_id, name, company, position, email, phone, website, needs, monthly_pref, kvkk_consent, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')`,
            [consultantId, service_id || null, name, company || null, position || null, email, phone || null, website || null, needs || null, monthly_pref || null, kvkk_consent ? 1 : 0]
        );
        const leadId = result.insertId;

        // CRM (best-effort)
        try {
            const parts = String(name).trim().split(/\s+/);
            const first = parts.shift() || name;
            const last = parts.join(' ');
            await db.query(
                `INSERT INTO crm_contacts (first_name, last_name, email, phone, company, source, status, created_at)
                 VALUES (?, ?, ?, ?, ?, 'consultant_lead', 'subscribed', NOW())
                 ON DUPLICATE KEY UPDATE phone=VALUES(phone), company=VALUES(company), source='consultant_lead'`,
                [first, last, email, phone || null, company || null]
            );
        } catch (e) { /* crm şeması farklıysa geç */ }

        // Danışman + admin bildirimi
        try {
            let svcTitle = '';
            if (service_id) { const [t] = await db.query('SELECT title FROM consultant_services WHERE id=?', [service_id]); svcTitle = t[0]?.title || ''; }
            const html = '<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f4f7fb;padding:20px;color:#102a43">'
                + '<div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #dde7f0;border-radius:12px;overflow:hidden">'
                + '<div style="background:linear-gradient(90deg,#1a3a52,#89b004);color:#fff;padding:20px 24px"><h2 style="margin:0;font-size:1.15rem">Yeni Danışmanlık Başvurusu (Lead)</h2></div>'
                + '<div style="padding:24px;line-height:1.7">'
                + `<p><strong>Program:</strong> ${escapeHtml(svcTitle || 'Fractional CMO')}</p>`
                + `<p><strong>Ad Soyad:</strong> ${escapeHtml(name)}</p>`
                + `<p><strong>Şirket:</strong> ${escapeHtml(company || '-')} — <strong>Pozisyon:</strong> ${escapeHtml(position || '-')}</p>`
                + `<p><strong>E-posta:</strong> ${escapeHtml(email)} — <strong>Telefon:</strong> ${escapeHtml(phone || '-')}</p>`
                + `<p><strong>Web:</strong> ${escapeHtml(website || '-')} — <strong>Aylık tercih:</strong> ${escapeHtml(monthly_pref || '-')}</p>`
                + `<p><strong>İhtiyaç:</strong><br>${escapeHtml(needs || '-')}</p>`
                + `<p><a href="${FRONTEND_URL}/admin/bookings" style="background:#1a3a52;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Admin Panelinde Aç</a></p>`
                + '</div></div></body></html>';
            // Danışmana
            if (consultantEmail) {
                try { await sendCustomMail({ to: consultantEmail, subject: `[Khilonfast] Yeni Program Başvurusu — ${name}`, html }); }
                catch (e) { console.error('lead consultant notify failed:', e.message); }
            }
            // Admin'e (danışmandan farklıysa)
            const adminEmail = await getSettingValue('contact_email', '');
            if (adminEmail && adminEmail.toLowerCase() !== consultantEmail.toLowerCase()) {
                await sendCustomMail({ to: adminEmail, subject: `[Khilonfast] Yeni Danışmanlık Başvurusu — ${name}`, html });
            }
        } catch (e) { console.error('lead notify failed:', e.message); }

        res.json({ lead_id: leadId, message: 'Başvurunuz alınmıştır. Ekibimiz sizinle iletişime geçecektir.' });
    } catch (err) {
        console.error('Consultant lead error:', err);
        res.status(500).json({ error: 'Server error' });
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
