// backend/services/subscriptionService.js
// Sipariş tamamlandığında abonelik kayıtlarını oluşturma helper'ı.
// Hem sanal POS (kart) hem manuel havale akışlarında ortak.

/**
 * Bir sipariş için her order_item'ı subscriptions tablosuna idempotent INSERT eder.
 * type='subscription' + duration_days varsa expires_at + next_renewal_at hesaplanır,
 * auto_renew=1 default, paymentMethod'a göre renewal_card_id atanır.
 *
 * @param {Object} conn — mysql2 promise connection veya pool
 * @param {Object} opts
 * @param {number} opts.userId
 * @param {number} opts.orderId
 * @param {'credit_card'|'manual_transfer'} opts.paymentMethod
 * @param {number|null} opts.renewalCardId — sadece credit_card için
 */
export async function createSubscriptionsForOrder(conn, { userId, orderId, paymentMethod, renewalCardId = null }) {
    const [items] = await conn.query(
        `SELECT oi.product_id, p.type, p.duration_days
         FROM order_items oi
         JOIN products p ON p.id = oi.product_id
         WHERE oi.order_id = ?`,
        [orderId]
    );

    for (const it of items) {
        const [exists] = await conn.query(
            'SELECT id FROM subscriptions WHERE user_id = ? AND product_id = ? AND order_id = ? LIMIT 1',
            [userId, it.product_id, orderId]
        );
        if (exists.length > 0) continue;

        const isSubscription = it.type === 'subscription';
        const duration = Number(it.duration_days) || null;

        // expires_at / next_renewal_at: duration_days varsa hesapla, yoksa NULL (sınırsız erişim — eski davranış)
        let expiresClause = 'NULL';
        let nextRenewalClause = 'NULL';
        const params = [userId, it.product_id, orderId, 'active'];
        if (duration) {
            expiresClause = 'DATE_ADD(NOW(), INTERVAL ? DAY)';
            nextRenewalClause = 'DATE_ADD(NOW(), INTERVAL ? DAY)';
            params.push(duration, duration);
        }

        const autoRenew = isSubscription ? 1 : 0;
        const card = isSubscription && paymentMethod === 'credit_card' ? renewalCardId : null;
        params.push(autoRenew, card, paymentMethod);

        await conn.query(
            `INSERT INTO subscriptions
               (user_id, product_id, order_id, status,
                expires_at, next_renewal_at,
                auto_renew, renewal_card_id, payment_method)
             VALUES (?, ?, ?, ?, ${expiresClause}, ${nextRenewalClause}, ?, ?, ?)`,
            params
        );
    }
}

export default { createSubscriptionsForOrder };
