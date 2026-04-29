import db from '../config/database.js';
import {
    sendOrderConfirmationEmail,
    sendOrderAdminNotificationEmail
} from './emailService.js';

const trackedOrders = new Set();

const getDashboardUrl = () => {
    const base = (process.env.FRONTEND_URL || 'https://khilonfast.com').replace(/\/$/, '');
    return `${base}/dashboard?tab=orders&success=true`;
};

/**
 * Bir sipariş "completed" olduğunda müşteriye onay maili + admin'e satış bildirim
 * mailini fire-and-forget olarak gönderir. Aynı sipariş için iki kez tetiklense
 * bile (örn. payment.initiate sonrası ve callback) sadece bir defa yollanır.
 *
 * Hata durumunda sipariş akışını bozmaz, sadece loglar.
 */
export const dispatchOrderEmails = async (orderId, { isNewCustomer = false } = {}) => {
    if (!orderId) return;
    if (trackedOrders.has(orderId)) return;
    trackedOrders.add(orderId);

    try {
        const [orderRows] = await db.query(
            `SELECT id, order_number, user_id, subtotal_amount, coupon_discount_amount,
                    total_amount, currency, coupon_code, status
             FROM orders WHERE id = ? LIMIT 1`,
            [orderId]
        );
        if (!orderRows.length) {
            trackedOrders.delete(orderId);
            return;
        }
        const order = orderRows[0];

        const [userRows] = await db.query(
            'SELECT id, email, first_name, last_name, phone FROM users WHERE id = ? LIMIT 1',
            [order.user_id]
        );
        const user = userRows[0];
        if (!user || !user.email) {
            return;
        }

        const [items] = await db.query(
            `SELECT oi.product_id, oi.quantity, oi.unit_price, oi.total_price,
                    p.name AS product_name, p.currency
             FROM order_items oi
             LEFT JOIN products p ON p.id = oi.product_id
             WHERE oi.order_id = ?`,
            [orderId]
        );

        const [paymentRows] = await db.query(
            `SELECT payment_method FROM payments WHERE order_id = ? ORDER BY id DESC LIMIT 1`,
            [orderId]
        );
        const paymentMethod = paymentRows[0]?.payment_method || null;

        const customerName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email;

        // Müşteri onay maili (await: hata loglanır ama yutulur)
        try {
            await sendOrderConfirmationEmail({
                to: user.email,
                firstName: user.first_name,
                order: { ...order, payment_method: paymentMethod },
                items,
                dashboardUrl: getDashboardUrl()
            });
        } catch (e) {
            console.error('[orderNotifications] confirmation mail failed:', e.message);
        }

        // Admin satış bildirim maili
        try {
            await sendOrderAdminNotificationEmail({
                order: { ...order, payment_method: paymentMethod },
                items,
                customer: {
                    name: customerName,
                    email: user.email,
                    phone: user.phone,
                    is_new: !!isNewCustomer
                }
            });
        } catch (e) {
            console.error('[orderNotifications] admin mail failed:', e.message);
        }
    } catch (err) {
        console.error('[orderNotifications] dispatch failed:', err.message);
        // Bir sonraki tetiklemede tekrar denenebilsin
        trackedOrders.delete(orderId);
    }
};

export default { dispatchOrderEmails };
