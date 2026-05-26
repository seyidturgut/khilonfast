import db from '../config/database.js';
import {
    sendOrderConfirmationEmail,
    sendOrderAdminNotificationEmail,
    sendOnboardingInvitationEmail,
    sendCustomMail
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
export const dispatchOrderEmails = async (orderId, { isNewCustomer = false, temporaryPassword = '' } = {}) => {
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

        // Form-required her sipariş kalemi için ayrı onboarding daveti
        try {
            const [obItems] = await db.query(
                `SELECT oi.id AS order_item_id, p.name AS product_name
                 FROM order_items oi
                 JOIN products p ON p.id = oi.product_id
                 WHERE oi.order_id = ? AND COALESCE(p.requires_onboarding, 0) = 1`,
                [orderId]
            );
            for (const it of obItems) {
                try {
                    await sendOnboardingInvitationEmail({
                        to: user.email,
                        firstName: user.first_name,
                        productName: it.product_name,
                        orderNumber: order.order_number,
                        orderId: order.id,
                        orderItemId: it.order_item_id
                    });
                } catch (e) {
                    console.error('[orderNotifications] onboarding invite failed:', it.order_item_id, e.message);
                }
            }
        } catch (e) {
            console.error('[orderNotifications] onboarding items query failed:', e.message);
        }

        // Eye Tracking paketleri için "Hesabım > Reklam Analizleri" yönlendirme maili
        try {
            const [eyeItems] = await db.query(
                `SELECT oi.id AS order_item_id, p.name AS product_name, p.product_key, p.usage_quota
                 FROM order_items oi JOIN products p ON p.id = oi.product_id
                 WHERE oi.order_id = ? AND p.product_key LIKE 'eye-%'`,
                [orderId]
            );
            if (eyeItems.length > 0) {
                const baseUrl = (process.env.FRONTEND_URL || 'https://khilonfast.com').replace(/\/$/, '');
                const dashUrl = `${baseUrl}/hesabim?tab=eye_tracking`;
                const lines = eyeItems.map(it => `${it.product_name} — ${it.usage_quota} görsel/ay`).join('<br>');
                const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f4f7fb;padding:20px;margin:0;color:#102a43">
                    <div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #dde7f0;border-radius:12px;overflow:hidden">
                        <div style="background:linear-gradient(90deg,#1a3a52,#89b004);color:#fff;padding:20px 24px">
                            <h2 style="margin:0;font-size:1.2rem">khilonfast — Reklam Görsel Analizi</h2>
                        </div>
                        <div style="padding:24px;line-height:1.7">
                            <p>Merhaba ${user.first_name || ''},</p>
                            <p>Reklam Görsel Analizi paketiniz aktif! Aşağıdaki paket(ler) hesabınıza tanımlandı:</p>
                            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin:12px 0">
                                ${lines}
                            </div>
                            <p>Analiz edilmesini istediğiniz reklam görsellerinizi <strong>Hesabım → Reklam Analizleri</strong> sekmesinden yükleyebilirsiniz. Her ay paketinize bağlı görsel hakkınız sıfırdan başlar.</p>
                            <div style="text-align:center;margin:24px 0">
                                <a href="${dashUrl}" style="display:inline-block;background:#1a3a52;color:#fff;padding:12px 26px;border-radius:8px;font-weight:700;text-decoration:none">Görsel Yükle</a>
                            </div>
                            <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:12px;font-size:0.85rem;color:#78350f;margin-top:12px">
                                <strong>İlk giriş yapıyorsanız:</strong> Geçici şifrenizi içeren <em>"Khilonfast - Kayıt Tamamlandı"</em> başlıklı ayrı bir e-posta gönderdik. Gelen kutunuzu ve spam klasörünüzü kontrol edin. Eğer ulaşmadıysa <a href="${baseUrl}/sifremi-unuttum" style="color:#78350f;font-weight:600">şifremi unuttum</a> bağlantısı ile yeni bir şifre belirleyebilirsiniz.
                            </div>
                            <p style="margin-top:16px">Saygılarımızla,<br>Khilonfast Ekibi</p>
                        </div>
                    </div></body></html>`;
                try {
                    await sendCustomMail({
                        to: user.email,
                        subject: 'Reklam Görsel Analizi Paketiniz Aktif',
                        html
                    });
                } catch (e) {
                    console.error('[orderNotifications] eye welcome mail failed:', e.message);
                }

                // Hatırlatma akışı (görsel yüklemezse 1s/1g/3g/1h/1ay maili) — PHP AutomationEngine'a HTTP ile delegate
                try {
                    const base = (process.env.PHP_API_URL || process.env.API_INTERNAL_URL || '').replace(/\/$/, '');
                    if (base) {
                        await fetch(`${base}/automation/trigger`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                event: 'eyetracking_pending_upload',
                                contact: {
                                    email: user.email,
                                    first_name: user.first_name,
                                    last_name: user.last_name,
                                    user_id: user.id,
                                    order_id: order.id
                                }
                            })
                        }).catch(() => { /* sessiz */ });
                    }
                } catch (e) {
                    console.error('[orderNotifications] eye automation trigger failed:', e.message);
                }
            }
        } catch (e) {
            console.error('[orderNotifications] eye items query failed:', e.message);
        }
    } catch (err) {
        console.error('[orderNotifications] dispatch failed:', err.message);
        // Bir sonraki tetiklemede tekrar denenebilsin
        trackedOrders.delete(orderId);
    }
};

export default { dispatchOrderEmails };
