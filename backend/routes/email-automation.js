import express from 'express';
import db from '../config/database.js';

const router = express.Router();

/**
 * POST /api/email-automation/event
 * Frontend olaylarını (checkout_email_entered vb.) sessizce loglar.
 * Hiçbir koşulda hata fırlatmaz; her zaman 200 döner ki frontend konsolunu kirletmesin.
 */
router.post('/event', async (req, res) => {
    try {
        const { event_type, email, cart_data } = req.body || {};

        if (!event_type || !email) {
            return res.status(200).json({ ok: true, ignored: true });
        }

        // Tablo varsa logla, yoksa sessizce geç
        try {
            await db.query(
                `CREATE TABLE IF NOT EXISTS email_automation_events (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    event_type VARCHAR(100) NOT NULL,
                    email VARCHAR(255) NOT NULL,
                    cart_data JSON DEFAULT NULL,
                    user_agent VARCHAR(500) DEFAULT NULL,
                    ip_address VARCHAR(64) DEFAULT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_event_type (event_type),
                    INDEX idx_email (email),
                    INDEX idx_created_at (created_at)
                )`
            );

            await db.query(
                `INSERT INTO email_automation_events
                    (event_type, email, cart_data, user_agent, ip_address)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    String(event_type).slice(0, 100),
                    String(email).slice(0, 255),
                    cart_data ? JSON.stringify(cart_data) : null,
                    (req.headers['user-agent'] || '').toString().slice(0, 500),
                    (req.ip || req.connection?.remoteAddress || '').toString().slice(0, 64)
                ]
            );
        } catch (dbError) {
            // DB sorunu kullanıcıyı etkilemesin
            console.warn('email-automation log skipped:', dbError.message);
        }

        return res.json({ ok: true });
    } catch (err) {
        console.error('email-automation/event error:', err);
        // Yine de 200 dönelim — frontend'in console.error spam'ini engellemek için
        return res.status(200).json({ ok: false });
    }
});

export default router;
