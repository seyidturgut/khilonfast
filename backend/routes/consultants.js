import express from 'express';
import db from '../config/database.js';
import cacheMiddleware from '../middleware/cache.js';

const router = express.Router();

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

        res.json({
            booking_id: result.insertId,
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

        res.json({ success: true, message: 'Rezervasyon onaylandı' });
    } catch (err) {
        console.error('Confirm booking error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
