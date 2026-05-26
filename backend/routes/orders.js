import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import db from '../config/database.js';
import { createSubscriptionsForOrder } from '../services/subscriptionService.js';
import authMiddleware, { optionalAuthMiddleware } from '../middleware/auth.js';
import { sendWelcomeAccountEmail } from '../services/emailService.js';
import { dispatchOrderEmails } from '../services/orderNotifications.js';
import { getCurrentUsdTryRate } from '../services/currencyService.js';

const router = express.Router();

const generateTemporaryPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    const bytes = crypto.randomBytes(12);
    let pass = '';
    for (let i = 0; i < 12; i += 1) {
        pass += chars[bytes[i] % chars.length];
    }
    return pass;
};

const splitName = (fullName = '') => {
    const cleaned = String(fullName || '').trim().replace(/\s+/g, ' ');
    if (!cleaned) return { firstName: 'Yeni', lastName: 'Musteri' };
    const [first, ...rest] = cleaned.split(' ');
    return {
        firstName: first || 'Yeni',
        lastName: rest.join(' ') || 'Musteri'
    };
};

// Create new order
router.post('/',
    optionalAuthMiddleware,
    [
        body('items').isArray({ min: 1 }).withMessage('Order must contain at least one item'),
        body('items.*.product_id').isInt().withMessage('Valid product ID required'),
        body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
        body('guest_email').optional().isEmail().withMessage('Valid guest email required'),
        body('guest_name').optional().isString(),
        body('guest_phone').optional().isString()
    ],
    async (req, res) => {
        const connection = await db.getConnection();

        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            await connection.beginTransaction();

            const { items, guest_email, guest_name, guest_phone, coupon_code } = req.body;

            // Maestro AI henüz satın alınamaz — maestro-* ürün içeren sipariş reddedilir.
            // (rollback yeterli; connection.release() finally bloğunda yapılıyor)
            if (Array.isArray(items) && items.some(i => String(i.product_key || '').toLowerCase().startsWith('maestro-'))) {
                await connection.rollback();
                return res.status(403).json({ error: 'Maestro AI hizmeti şu anda satın alınamıyor. Detaylı bilgi için: info@khilonfast.com' });
            }

            let userId = req.user?.id || null;
            let authToken = null;
            let accountCreated = false;
            let accountEmailSent = false;

            if (!userId) {
                if (!guest_email) {
                    return res.status(400).json({ error: 'Guest checkout icin e-posta zorunludur.' });
                }

                const [existingUsers] = await connection.query(
                    'SELECT id FROM users WHERE email = ? LIMIT 1',
                    [guest_email]
                );

                if (existingUsers.length > 0) {
                    return res.status(409).json({
                        error: 'Bu e-posta zaten kayıtlı. Lütfen giriş yaparak devam edin.'
                    });
                }

                const tempPassword = generateTemporaryPassword();
                const { firstName, lastName } = splitName(guest_name);
                const salt = await bcrypt.genSalt(10);
                const passwordHash = await bcrypt.hash(tempPassword, salt);

                const [userInsert] = await connection.query(
                    `INSERT INTO users (email, password_hash, first_name, last_name, phone, must_change_password)
                     VALUES (?, ?, ?, ?, ?, 1)`,
                    [guest_email, passwordHash, firstName, lastName, guest_phone || null]
                );
                userId = userInsert.insertId;
                accountCreated = true;

                authToken = jwt.sign(
                    { id: userId, email: guest_email, role: 'user' },
                    process.env.JWT_SECRET,
                    { expiresIn: '7d' }
                );

                try {
                    await sendWelcomeAccountEmail({
                        to: guest_email,
                        firstName,
                        temporaryPassword: tempPassword
                    });
                    accountEmailSent = true;
                } catch (mailError) {
                    console.error('Welcome email send error:', mailError.message);
                }
            }

            // Calculate subtotal — TÜM ürünler TRY'a normalize edilir.
            // USD ürünler: o anki kurla TRY'a çevrilir, oran orders.usd_try_rate_used'a kilitlenir.
            const usdTryInfo = await getCurrentUsdTryRate();
            const usdTryRate = Number(usdTryInfo.rate);

            let subtotal = 0;
            let currency = 'TRY';
            let usedUsdConversion = false;
            const orderItems = [];
            const productCategories = [];
            const productIds = [];

            for (const item of items) {
                let product;

                // Danışmanlık hizmeti — products tablosunda DEĞİL, consultant_services'te.
                // product_key: consultant-service-{consultant_services.id}
                if (String(item.product_key || '').startsWith('consultant-service-')) {
                    const svcId = parseInt(String(item.product_key).replace('consultant-service-', ''), 10);
                    const [svcRows] = await connection.query(
                        'SELECT id, title, price, currency FROM consultant_services WHERE id = ?', [svcId]
                    );
                    const svc = svcRows[0];
                    if (!svc) throw new Error('Danışmanlık hizmeti bulunamadı');
                    const [anchorRows] = await connection.query(
                        "SELECT id, category FROM products WHERE product_key = 'consultant-booking' LIMIT 1"
                    );
                    if (!anchorRows.length) throw new Error('Danışmanlık ödeme yapılandırması eksik');
                    let svcUnitTry = parseFloat(svc.price);
                    if (svc.currency === 'USD') {
                        svcUnitTry = Math.round(svcUnitTry * usdTryRate * 100) / 100;
                        usedUsdConversion = true;
                    }
                    const svcTotal = svcUnitTry * item.quantity;
                    subtotal += svcTotal;
                    productCategories.push('danismanlik');
                    productIds.push(anchorRows[0].id);
                    orderItems.push({
                        product_id: anchorRows[0].id,
                        quantity: item.quantity,
                        unit_price: svcUnitTry,
                        total_price: svcTotal,
                    });
                    continue;
                }

                // Support both product_id and product_key
                if (item.product_id && item.product_id !== 0) {
                    const [products] = await connection.query(
                        'SELECT * FROM products WHERE id = ? AND is_active = TRUE',
                        [item.product_id]
                    );
                    product = products[0];
                } else if (item.product_key) {
                    const [products] = await connection.query(
                        'SELECT * FROM products WHERE product_key = ? AND is_active = TRUE',
                        [item.product_key]
                    );
                    product = products[0];
                }

                if (!product) {
                    throw new Error(`Product with ID ${item.product_id} or key ${item.product_key} not found`);
                }

                // USD ürün: TRY'a çevir
                let unitPriceTry = parseFloat(product.price);
                if (product.currency === 'USD') {
                    unitPriceTry = Math.round(unitPriceTry * usdTryRate * 100) / 100;
                    usedUsdConversion = true;
                }

                const itemTotal = unitPriceTry * item.quantity;
                subtotal += itemTotal;
                productCategories.push(product.category);
                productIds.push(product.id);

                orderItems.push({
                    product_id: product.id,
                    quantity: item.quantity,
                    unit_price: unitPriceTry,
                    total_price: itemTotal
                });
            }
            // Order para birimi her zaman TRY (Lidio sadece TRY ile çekim yapıyor)
            currency = 'TRY';

            // Validate coupon (server-side) and compute discount
            let couponRow = null;
            let discountAmount = 0;
            let couponSnapshot = null;

            if (coupon_code && String(coupon_code).trim()) {
                const [couponRows] = await connection.query(
                    'SELECT * FROM coupons WHERE code = ? LIMIT 1 FOR UPDATE',
                    [String(coupon_code).trim().toUpperCase()]
                );

                if (couponRows.length === 0) {
                    throw new Error('Kupon bulunamadı.');
                }
                const c = couponRows[0];
                const now = new Date();

                if (!c.is_active) throw new Error('Bu kupon artık aktif değil.');
                if (c.starts_at && new Date(c.starts_at) > now) throw new Error('Bu kupon henüz geçerli değil.');
                if (c.ends_at && new Date(c.ends_at) < now) throw new Error('Bu kuponun süresi dolmuş.');
                if (c.total_usage_limit !== null && c.usage_count >= c.total_usage_limit) {
                    throw new Error('Bu kuponun kullanım limiti dolmuş.');
                }
                if (c.minimum_cart_amount > 0 && subtotal < Number(c.minimum_cart_amount)) {
                    throw new Error(`Bu kupon için minimum sepet tutarı ${c.minimum_cart_amount} ${currency}.`);
                }
                if (c.restricted_categories_json) {
                    try {
                        const allowed = typeof c.restricted_categories_json === 'string'
                            ? JSON.parse(c.restricted_categories_json)
                            : c.restricted_categories_json;
                        if (Array.isArray(allowed) && allowed.length > 0) {
                            const hasMatch = productCategories.some(cat => allowed.includes(cat));
                            if (!hasMatch) throw new Error('Bu kupon sepetinizdeki ürünlere uygulanamaz.');
                        }
                    } catch (e) { if (e.message?.startsWith('Bu kupon')) throw e; }
                }
                if (c.restricted_products_json) {
                    try {
                        const allowed = typeof c.restricted_products_json === 'string'
                            ? JSON.parse(c.restricted_products_json)
                            : c.restricted_products_json;
                        if (Array.isArray(allowed) && allowed.length > 0) {
                            const hasMatch = productIds.some(id => allowed.includes(id));
                            if (!hasMatch) throw new Error('Bu kupon sepetinizdeki ürünlere uygulanamaz.');
                        }
                    } catch (e) { if (e.message?.startsWith('Bu kupon')) throw e; }
                }

                if (c.discount_type === 'percentage') {
                    discountAmount = (subtotal * Number(c.discount_value)) / 100;
                    if (c.maximum_discount_amount !== null) {
                        discountAmount = Math.min(discountAmount, Number(c.maximum_discount_amount));
                    }
                } else {
                    discountAmount = Math.min(Number(c.discount_value), subtotal);
                }
                discountAmount = Math.round(discountAmount * 100) / 100;

                couponRow = c;
                couponSnapshot = {
                    id: c.id,
                    code: c.code,
                    name: c.name,
                    discount_type: c.discount_type,
                    discount_value: Number(c.discount_value),
                    maximum_discount_amount: c.maximum_discount_amount ? Number(c.maximum_discount_amount) : null,
                    discount_applied: discountAmount
                };
            }

            const totalAmount = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);
            const isFreeOrder = totalAmount <= 0;
            const orderStatus = isFreeOrder ? 'completed' : 'pending';

            // Generate order number
            const orderNumber = `ORD-${Date.now()}-${userId}`;

            // Create order (with coupon + breakdown + USD/TRY rate audit)
            const [orderResult] = await connection.query(
                `INSERT INTO orders
                    (user_id, order_number, subtotal_amount, coupon_discount_amount, total_amount,
                     coupon_id, coupon_code, coupon_name, applied_coupon_snapshot_json, currency, status,
                     usd_try_rate_used)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    userId,
                    orderNumber,
                    subtotal,
                    discountAmount,
                    totalAmount,
                    couponRow ? couponRow.id : null,
                    couponRow ? couponRow.code : null,
                    couponRow ? couponRow.name : null,
                    couponSnapshot ? JSON.stringify(couponSnapshot) : null,
                    currency,
                    orderStatus,
                    usedUsdConversion ? usdTryRate : null
                ]
            );

            const orderId = orderResult.insertId;

            // Create order items
            for (const item of orderItems) {
                await connection.query(
                    'INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)',
                    [orderId, item.product_id, item.quantity, item.unit_price, item.total_price]
                );
            }

            // For free orders (100% coupon), increment coupon usage, create 0-amount payment AND subscriptions
            if (isFreeOrder) {
                if (couponRow) {
                    await connection.query(
                        'UPDATE coupons SET usage_count = usage_count + 1 WHERE id = ?',
                        [couponRow.id]
                    );
                }
                await connection.query(
                    `INSERT INTO payments (order_id, payment_method, amount, currency, status, lidio_response)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [orderId, 'coupon_free', 0, currency, 'completed', JSON.stringify({ free_order: true, coupon: couponSnapshot })]
                );

                // Ücretli siparişlerde subscription'ları payment.js callback'i oluşturuyor;
                // ücretsiz siparişlerde gateway'e hiç gitmediğimiz için burada oluşturmalıyız.
                // Ücretsiz siparişte ödeme yöntemi yok — manual_transfer "no recurring" işareti.
                await createSubscriptionsForOrder(connection, {
                    userId,
                    orderId,
                    paymentMethod: 'manual_transfer',
                    renewalCardId: null
                });
            }

            await connection.commit();

            // Ücretsiz siparişlerde sipariş zaten "completed" — onay + admin mailini hemen tetikle
            if (isFreeOrder) {
                dispatchOrderEmails(orderId, { isNewCustomer: accountCreated })
                    .catch(err => console.error('Free order mail dispatch error:', err.message));
            }

            res.status(201).json({
                message: 'Order created successfully',
                order: {
                    id: orderId,
                    order_number: orderNumber,
                    subtotal_amount: subtotal,
                    coupon_discount_amount: discountAmount,
                    total_amount: totalAmount,
                    currency,
                    status: orderStatus
                },
                payment_required: !isFreeOrder,
                auth_token: authToken,
                account: {
                    created: accountCreated,
                    email_sent: accountEmailSent
                }
            });
        } catch (error) {
            await connection.rollback();
            console.error('Create order error:', error);
            res.status(500).json({ error: error.message || 'Server error' });
        } finally {
            connection.release();
        }
    }
);

// Get order by ID
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        // 9+ kalemli siparişlerde GROUP_CONCAT 1024 byte sınırını aşar → items kesik gelir
        await db.query('SET SESSION group_concat_max_len = 1048576');
        const [orders] = await db.query(
            `SELECT o.*,
                    GROUP_CONCAT(
                        JSON_OBJECT(
                            'id', oi.id,
                            'order_item_id', oi.id,
                            'product_id', oi.product_id,
                            'product_name', p.name,
                            'product_key', p.product_key,
                            'product_category', p.category,
                            'requires_onboarding', COALESCE(p.requires_onboarding, 0),
                            'product_type', p.type,
                            'duration_days', p.duration_days,
                            'quantity', oi.quantity,
                            'unit_price', oi.unit_price,
                            'total_price', oi.total_price
                        )
                    ) as items
             FROM orders o
             LEFT JOIN order_items oi ON o.id = oi.order_id
             LEFT JOIN products p ON oi.product_id = p.id
             WHERE o.id = ? AND o.user_id = ?
             GROUP BY o.id`,
            [req.params.id, req.user.id]
        );

        if (orders.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const order = orders[0];
        order.items = JSON.parse(`[${order.items}]`);

        res.json({ order });
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all orders for user
router.get('/user/:userId', authMiddleware, async (req, res) => {
    try {
        // Ensure user can only see their own orders
        if (parseInt(req.params.userId) !== req.user.id) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        // 9+ kalemli siparişlerde GROUP_CONCAT 1024 byte sınırını aşar → items kesik gelir
        await db.query('SET SESSION group_concat_max_len = 1048576');
        const [orders] = await db.query(
            `SELECT o.*,
                    GROUP_CONCAT(
                        JSON_OBJECT(
                            'id', oi.id,
                            'order_item_id', oi.id,
                            'product_id', oi.product_id,
                            'product_name', p.name,
                            'product_key', p.product_key,
                            'product_category', p.category,
                            'requires_onboarding', COALESCE(p.requires_onboarding, 0),
                            'product_type', p.type,
                            'duration_days', p.duration_days,
                            'quantity', oi.quantity,
                            'unit_price', oi.unit_price,
                            'total_price', oi.total_price
                        )
                    ) as items
             FROM orders o
             LEFT JOIN order_items oi ON o.id = oi.order_id
             LEFT JOIN products p ON oi.product_id = p.id
             WHERE o.user_id = ?
             GROUP BY o.id
             ORDER BY o.created_at DESC`,
            [req.params.userId]
        );

        // Parse items JSON for each order
        const ordersWithItems = orders.map(order => ({
            ...order,
            items: order.items ? JSON.parse(`[${order.items}]`) : []
        }));

        res.json({ orders: ordersWithItems });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
