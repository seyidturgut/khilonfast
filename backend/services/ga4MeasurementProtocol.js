// GA4 Measurement Protocol — sunucu taraflı `purchase` event'i.
// PHP eşleniği: api/services/Ga4MeasurementProtocol.php (CANLIDA çalışan odur;
// bu dosya dual-backend kuralı gereği pariteyi korur).
//
// NEDEN SUNUCU TARAFLI: sipariş 5 ayrı yerde 'completed' oluyor ve çoğu
// tarayıcıya hiç uğramıyor (admin havale onayı, abonelik cron'u). Client-side
// purchase bu gelirleri kaçırır + sayfa yenilemede çift sayardı.
// IDEMPOTENCY: orders.ga4_purchase_sent_at dolu ise tekrar gönderilmez.

const fs = require('fs');
const path = require('path');
const db = require('../config/database');

const LOG_DIR = path.join(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'ga4-mp.log');

function log(msg) {
    try {
        if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
        fs.appendFileSync(LOG_FILE, `${new Date().toISOString()} ${msg}\n`);
    } catch { /* loglama akışı bozmasın */ }
}

async function getSetting(key, fallback = '') {
    try {
        const [rows] = await db.query(
            'SELECT setting_value FROM settings WHERE setting_key = ? LIMIT 1', [key]
        );
        const v = rows && rows[0] ? rows[0].setting_value : null;
        return (v === null || v === undefined || v === '') ? fallback : v;
    } catch {
        return fallback;
    }
}

/**
 * Siparişin purchase event'ini GA4'e gönderir (bir kez).
 * @returns {Promise<boolean>} true = gönderildi. Akışı ASLA bozmaz (hata fırlatmaz).
 */
async function ga4SendPurchase(orderId) {
    try {
        const measurementId = await getSetting('ga4_measurement_id', 'G-16FR1976GE');
        const apiSecret = await getSetting('ga4_api_secret', '');
        const enabled = await getSetting('ga4_mp_enabled', '1');

        if (enabled === '0') return false;
        if (!measurementId || !apiSecret) {
            log(`order=${orderId} ATLANDI: ga4_measurement_id veya ga4_api_secret ayarlanmamis`);
            return false;
        }

        const [orderRows] = await db.query(
            `SELECT order_number, total_amount, tax_amount, currency, coupon_code,
                    ga_client_id, ga4_purchase_sent_at, status, user_id
             FROM orders WHERE id = ? LIMIT 1`, [orderId]
        );
        const order = orderRows && orderRows[0];
        if (!order) { log(`order=${orderId} ATLANDI: siparis bulunamadi`); return false; }
        if (order.ga4_purchase_sent_at) return false;           // zaten gönderildi — normal
        if (order.status !== 'completed') {
            log(`order=${orderId} ATLANDI: status=${order.status} (completed degil)`);
            return false;
        }

        const [itemRows] = await db.query(
            `SELECT oi.quantity, oi.unit_price, p.product_key, p.name, p.category
             FROM order_items oi LEFT JOIN products p ON p.id = oi.product_id
             WHERE oi.order_id = ?`, [orderId]
        );
        const items = (itemRows || []).map((r) => {
            const item = {
                item_id: String(r.product_key || 'unknown'),
                item_name: String(r.name || 'unknown'),
                price: Number(r.unit_price) || 0,
                quantity: Number(r.quantity) || 1
            };
            if (r.category) item.item_category = String(r.category);
            return item;
        });

        // client_id yoksa siparişten türetilmiş SABİT kimlik (tekrar denemede yeni
        // kullanıcı yaratmasın). Bu durumda GA4'te "direct" görünür ama gelir kaydedilir.
        let clientId = order.ga_client_id;
        if (!clientId) {
            let h = 0;
            const s = `khilonfast-${order.order_number}`;
            for (let i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) >>> 0; }
            clientId = `${h}.1000000000`;
            log(`order=${orderId} UYARI: ga_client_id yok, sentetik kimlik (direct gorunecek)`);
        }

        const params = {
            transaction_id: String(order.order_number),
            value: Math.round(Number(order.total_amount) * 100) / 100,
            currency: String(order.currency || 'TRY').toUpperCase(),
            tax: Math.round(Number(order.tax_amount || 0) * 100) / 100,
            items
        };
        if (order.coupon_code) params.coupon = order.coupon_code;

        const payload = { client_id: clientId, events: [{ name: 'purchase', params }] };
        if (order.user_id) payload.user_id = String(order.user_id);

        const url = `https://www.google-analytics.com/mp/collect`
            + `?measurement_id=${encodeURIComponent(measurementId)}`
            + `&api_secret=${encodeURIComponent(apiSecret)}`;

        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(8000)
        });

        if (res.ok) {
            await db.query('UPDATE orders SET ga4_purchase_sent_at = NOW() WHERE id = ?', [orderId]);
            log(`order=${orderId} OK gonderildi (tutar=${order.total_amount} ${order.currency}, urun=${items.length})`);
            return true;
        }
        log(`order=${orderId} HATA http=${res.status}`);
        return false;
    } catch (e) {
        log(`order=${orderId} ISTISNA: ${e && e.message}`);
        return false;
    }
}

module.exports = { ga4SendPurchase };
