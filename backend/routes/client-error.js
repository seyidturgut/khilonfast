// PUBLIC — /api/client-error POST
// Tarayıcıda React mount olmadan yaşanan fatal JS hatalarını loglar.
// PHP eşleniği: api/routes/client-error.php (canlıda çalışan odur).
const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const LOG_DIR = path.join(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'client-errors.log');
const MAX_LOG_SIZE = 5 * 1024 * 1024;

router.post('/', express.json({ limit: '8kb' }), (req, res) => {
    try {
        if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

        // 5MB üstüne çıktıysa eskiyi tek yedek olarak döndür
        try {
            if (fs.existsSync(LOG_FILE) && fs.statSync(LOG_FILE).size > MAX_LOG_SIZE) {
                fs.renameSync(LOG_FILE, LOG_FILE + '.1');
            }
        } catch { /* yoksay */ }

        const d = req.body || {};
        const entry = {
            ts: new Date().toISOString(),
            ip: req.headers['cf-connecting-ip'] || req.ip || '',
            ua: String(req.headers['user-agent'] || '').slice(0, 500),
            type: String(d.type || '').slice(0, 50),
            message: String(d.message || '').slice(0, 1000),
            source: String(d.source || '').slice(0, 300),
            line: Number(d.line) || 0,
            col: Number(d.col) || 0,
            stack: String(d.stack || '').slice(0, 2000),
            url: String(d.url || '').slice(0, 500)
        };
        fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n');
    } catch { /* loglama asla hata döndürmesin */ }
    res.json({ ok: true });
});

module.exports = router;
