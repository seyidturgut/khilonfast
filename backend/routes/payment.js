import express from 'express';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';
import db from '../config/database.js';
import authMiddleware from '../middleware/auth.js';
import lidioService from '../services/lidioService.js';

const router = express.Router();
const paymentAttemptStore = new Map();

const parseBooleanLike = (value, fallback = true) => {
    if (value === null || value === undefined || value === '') return fallback;
    if (typeof value === 'boolean') return value;
    const normalized = String(value).trim().toLowerCase();
    return ['1', 'true', 'yes', 'on'].includes(normalized);
};

const getLidioRuntimeConfig = async (connection) => {
    const [rows] = await connection.query(
        `SELECT setting_key, setting_value
         FROM settings
         WHERE setting_key IN (
            'lidio_api_key',
            'lidio_secret_key',
            'lidio_merchant_id',
            'lidio_api_url',
            'lidio_test_mode',
            'lidio_merchant_code',
            'lidio_merchant_key',
            'lidio_api_password',
            'lidio_authorization',
            'lidio_process_payment_path',
            'lidio_process_3ds_path',
            'lidio_query_payment_path',
            'lidio_refund_payment_path',
            'lidio_start_hosted_payment_path',
            'lidio_use_hosted',
            'lidio_force_3ds',
            'payment_rate_limit_window_seconds',
            'payment_rate_limit_max_attempts',
            'payment_max_amount_try',
            'payment_failed_attempts_db_threshold',
            'lidio_enforce_callback_hash',
            'lidio_return_hash_fields',
            'lidio_return_hash_algorithm',
            'lidio_return_hash_mode',
            'lidio_notification_hash_fields',
            'lidio_notification_hash_algorithm',
            'lidio_notification_hash_mode'
         )`
    );

    const settingsMap = rows.reduce((acc, curr) => {
        acc[curr.setting_key] = curr.setting_value;
        return acc;
    }, {});

    return {
        // New credential model
        merchantCode: settingsMap.lidio_merchant_code || process.env.LIDIO_MERCHANT_CODE,
        merchantKey: settingsMap.lidio_merchant_key || settingsMap.lidio_api_key || process.env.LIDIO_API_KEY,
        apiPassword: settingsMap.lidio_api_password || settingsMap.lidio_secret_key || process.env.LIDIO_SECRET_KEY,
        authorization: settingsMap.lidio_authorization || process.env.LIDIO_AUTHORIZATION,

        // Legacy compatibility fields
        apiKey: settingsMap.lidio_api_key || process.env.LIDIO_API_KEY,
        secretKey: settingsMap.lidio_secret_key || process.env.LIDIO_SECRET_KEY,
        merchantId: settingsMap.lidio_merchant_id || process.env.LIDIO_MERCHANT_ID,

        apiUrl: settingsMap.lidio_api_url || process.env.LIDIO_API_URL,
        testMode: parseBooleanLike(settingsMap.lidio_test_mode, String(process.env.LIDIO_TEST_MODE).toLowerCase() === 'true'),
        processPaymentPath: settingsMap.lidio_process_payment_path || '/ProcessPayment',
        process3dsPath: settingsMap.lidio_process_3ds_path || '/ProcessPayment',
        startHostedPaymentPath: settingsMap.lidio_start_hosted_payment_path || '/StartHostedPaymentProcess',
        queryPaymentPath: settingsMap.lidio_query_payment_path || '/payment/query/{transactionId}',
        refundPaymentPath: settingsMap.lidio_refund_payment_path || '/payment/refund',
        useHosted: parseBooleanLike(settingsMap.lidio_use_hosted, false),
        force3ds: parseBooleanLike(settingsMap.lidio_force_3ds, true),
        rateLimitWindowSeconds: Number(settingsMap.payment_rate_limit_window_seconds || 900),
        rateLimitMaxAttempts: Number(settingsMap.payment_rate_limit_max_attempts || 5),
        maxAmountTry: Number(settingsMap.payment_max_amount_try || 100000),
        failedAttemptsDbThreshold: Number(settingsMap.payment_failed_attempts_db_threshold || 5),
        enforceCallbackHash: parseBooleanLike(settingsMap.lidio_enforce_callback_hash, true),
        returnHashFields: settingsMap.lidio_return_hash_fields || 'orderNumber,status,transactionId',
        returnHashAlgorithm: (settingsMap.lidio_return_hash_algorithm || 'sha256').toLowerCase(),
        returnHashMode: (settingsMap.lidio_return_hash_mode || 'hmac').toLowerCase(),
        notificationHashFields: settingsMap.lidio_notification_hash_fields || 'orderNumber,status,transactionId',
        notificationHashAlgorithm: (settingsMap.lidio_notification_hash_algorithm || 'sha256').toLowerCase(),
        notificationHashMode: (settingsMap.lidio_notification_hash_mode || 'hmac').toLowerCase()
    };
};

const getClientIp = (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded && typeof forwarded === 'string') return forwarded.split(',')[0].trim();
    return req.ip || req.connection?.remoteAddress || 'unknown';
};

const normalizePhone = (value) => {
    const digits = String(value || '').replace(/\D/g, '');
    if (digits.length >= 10) return digits;
    // Lidio test senaryolarında müşteri telefonu zorunlu olabildiği için güvenli fallback.
    return '5551112233';
};

const registerPaymentAttempt = (key) => {
    const now = Date.now();
    const current = paymentAttemptStore.get(key) || [];
    current.push(now);
    paymentAttemptStore.set(key, current);
};

const isRateLimited = (key, windowSeconds, maxAttempts) => {
    const now = Date.now();
    const threshold = now - windowSeconds * 1000;
    const current = (paymentAttemptStore.get(key) || []).filter((ts) => ts >= threshold);
    paymentAttemptStore.set(key, current);
    return current.length >= maxAttempts;
};

const valueFromPayload = (payload, key) => {
    if (payload[key] !== undefined) return payload[key];
    const aliases = {
        orderNumber: ['orderNumber', 'order_number', 'merchantOrderId', 'MerchantOrderId', 'OrderId'],
        merchantProcessId: ['merchantProcessId', 'MerchantProcessId', 'merchant_process_id'],
        transactionId: ['transactionId', 'transaction_id', 'merchantPaymentId', 'MerchantPaymentId', 'SystemTransId', 'systemTransId'],
        status: ['status', 'paymentStatus', 'PaymentStatus', 'Result', 'result'],
        amount: ['amount', 'totalAmount', 'TotalAmount', 'AmountRequested', 'AmountProcessed']
    };
    const keys = aliases[key] || [key];
    for (const alias of keys) {
        if (payload[alias] !== undefined) return payload[alias];
    }
    return '';
};

const computeHashFromFields = (payload, fieldsCsv, secret, algorithm, mode) => {
    const fields = fieldsCsv.split(',').map((f) => f.trim()).filter(Boolean);
    const base = fields.map((f) => String(valueFromPayload(payload, f) ?? '')).join('|');
    if (mode === 'plain') {
        return crypto.createHash(algorithm).update(`${base}|${secret}`).digest('hex');
    }
    return crypto.createHmac(algorithm, secret).update(base).digest('hex');
};

const safeEqual = (a, b) => {
    const aa = Buffer.from(String(a || '').trim().toLowerCase());
    const bb = Buffer.from(String(b || '').trim().toLowerCase());
    if (aa.length !== bb.length) return false;
    return crypto.timingSafeEqual(aa, bb);
};

const verifyCallbackHashes = (payload, cfg) => {
    const incomingHash = payload.hash || payload.Hash;
    const incomingParameterHash = payload.parameterhash || payload.ParameterHash;

    if (!cfg.enforceCallbackHash) {
        return { ok: true, reason: null };
    }

    if (!incomingHash && !incomingParameterHash) {
        return { ok: false, reason: 'Missing hash/parameterhash' };
    }

    if (incomingHash) {
        const expected = computeHashFromFields(
            payload,
            cfg.returnHashFields,
            cfg.merchantKey || cfg.apiKey || '',
            cfg.returnHashAlgorithm,
            cfg.returnHashMode
        );
        if (!safeEqual(incomingHash, expected)) {
            if (cfg.testMode) {
                console.warn('[payment:callback] Return hash mismatch ignored in test mode');
            } else {
                return { ok: false, reason: 'Return hash verification failed' };
            }
        }
    }

    if (incomingParameterHash) {
        const expected = computeHashFromFields(
            payload,
            cfg.notificationHashFields,
            cfg.apiPassword || cfg.secretKey || '',
            cfg.notificationHashAlgorithm,
            cfg.notificationHashMode
        );
        if (!safeEqual(incomingParameterHash, expected)) {
            if (cfg.testMode) {
                console.warn('[payment:callback] Notification parameterhash mismatch ignored in test mode');
            } else {
                return { ok: false, reason: 'Notification parameterhash verification failed' };
            }
        }
    }

    return { ok: true, reason: null };
};

const findOrderByGatewayOrderId = async (connection, gatewayOrderId) => {
    if (!gatewayOrderId) return [];
    const [rows] = await connection.query(
        `SELECT o.*
         FROM payments p
         INNER JOIN orders o ON o.id = p.order_id
         WHERE JSON_UNQUOTE(JSON_EXTRACT(p.lidio_response, '$.orderId')) = ?
            OR JSON_UNQUOTE(JSON_EXTRACT(p.lidio_response, '$.OrderId')) = ?
            OR JSON_UNQUOTE(JSON_EXTRACT(p.lidio_response, '$.raw.orderId')) = ?
            OR JSON_UNQUOTE(JSON_EXTRACT(p.lidio_response, '$.raw.OrderId')) = ?
            OR JSON_UNQUOTE(JSON_EXTRACT(p.lidio_response, '$.paymentInfo.orderId')) = ?
            OR JSON_UNQUOTE(JSON_EXTRACT(p.lidio_response, '$.raw.paymentInfo.orderId')) = ?
         ORDER BY p.id DESC
         LIMIT 1`,
        [gatewayOrderId, gatewayOrderId, gatewayOrderId, gatewayOrderId, gatewayOrderId, gatewayOrderId]
    );
    return rows;
};

const findOrderByMerchantProcessId = async (connection, merchantProcessId) => {
    if (!merchantProcessId || !/^\d+$/.test(String(merchantProcessId))) return [];
    const [rows] = await connection.query(
        'SELECT * FROM orders WHERE id = ?',
        [Number(merchantProcessId)]
    );
    return rows;
};

const findOrderByOrderNumber = async (connection, orderNumber) => {
    if (!orderNumber) return [];
    const [rows] = await connection.query(
        'SELECT * FROM orders WHERE order_number = ?',
        [orderNumber]
    );
    return rows;
};

const resolveCallbackOrder = async (connection, orderNumber, merchantProcessId) => {
    let orders = await findOrderByOrderNumber(connection, orderNumber);
    if (orders.length > 0) return orders;

    orders = await findOrderByMerchantProcessId(connection, merchantProcessId);
    if (orders.length > 0) return orders;

    orders = await findOrderByGatewayOrderId(connection, orderNumber);
    return orders;
};

// Initiate payment
router.post('/initiate',
    authMiddleware,
    [
        body('order_id').isInt().withMessage('Valid order ID required'),
        body('card_number').optional().isString(),
        body('card_holder_name').optional().isString(),
        body('card_expire_month').optional().isInt({ min: 1, max: 12 }),
        body('card_expire_year').optional().isInt(),
        body('card_cvv').optional().isString(),
        body('use_3ds').optional().isBoolean(),
        body('use_hosted').optional().isBoolean()
    ],
    async (req, res) => {
        const connection = await db.getConnection();

        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const {
                order_id,
                card_number,
                card_holder_name,
                card_expire_month,
                card_expire_year,
                card_cvv,
                use_3ds = true,
                use_hosted
            } = req.body;

            const lidioRuntimeConfig = await getLidioRuntimeConfig(connection);
            const ip = getClientIp(req);
            const rateKey = `${req.user.id}:${ip}`;

            if (isRateLimited(rateKey, lidioRuntimeConfig.rateLimitWindowSeconds, lidioRuntimeConfig.rateLimitMaxAttempts)) {
                return res.status(429).json({ error: 'Çok fazla ödeme denemesi. Lütfen daha sonra tekrar deneyin.' });
            }

            const [failedRows] = await connection.query(
                `SELECT COUNT(*) AS failed_count
                 FROM payments p
                 INNER JOIN orders o ON o.id = p.order_id
                 WHERE o.user_id = ?
                   AND p.status = 'failed'
                   AND p.created_at >= (NOW() - INTERVAL ? SECOND)`,
                [req.user.id, lidioRuntimeConfig.rateLimitWindowSeconds]
            );

            if (Number(failedRows[0]?.failed_count || 0) >= lidioRuntimeConfig.failedAttemptsDbThreshold) {
                return res.status(429).json({ error: 'Kısa sürede çok sayıda başarısız deneme tespit edildi. Lütfen daha sonra tekrar deneyin.' });
            }

            // Get order details
            const [orders] = await connection.query(
                'SELECT * FROM orders WHERE id = ? AND user_id = ?',
                [order_id, req.user.id]
            );

            if (orders.length === 0) {
                return res.status(404).json({ error: 'Order not found' });
            }

            const order = orders[0];
            const orderAmount = parseFloat(order.total_amount || 0);
            const [users] = await connection.query(
                'SELECT id, email, first_name, last_name, phone FROM users WHERE id = ? LIMIT 1',
                [req.user.id]
            );
            const user = users[0];

            if (lidioRuntimeConfig.maxAmountTry > 0 && orderAmount > lidioRuntimeConfig.maxAmountTry) {
                return res.status(400).json({ error: 'Tutar güvenlik limiti üzerinde. Lütfen destek ile iletişime geçin.' });
            }

            if (order.status === 'completed') {
                return res.status(400).json({ error: 'Order already completed' });
            }

            await connection.beginTransaction();

            // Update order status
            await connection.query(
                'UPDATE orders SET status = ? WHERE id = ?',
                ['processing', order_id]
            );

            // Prepare payment data
            const paymentData = {
                orderId: `KHL${Date.now()}${order.id}`.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20),
                hostedOrderId: `KHL${Date.now()}${order.id}`.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20),
                merchantProcessId: String(order.id),
                amount: orderAmount,
                currency: order.currency,
                cardNumber: card_number,
                cardHolderName: card_holder_name,
                cardExpireMonth: card_expire_month,
                cardExpireYear: card_expire_year,
                cardCvv: card_cvv,
                callbackUrl: `${process.env.FRONTEND_URL}/payment-callback`,
                returnUrl: `${process.env.FRONTEND_URL}/payment-callback`,
                notificationUrl: `${process.env.BACKEND_PUBLIC_URL || process.env.BACKEND_URL || 'http://localhost:3002'}/api/payment/callback`,
                customerInfo: {
                    customerId: String(req.user.id),
                    customerName: user?.first_name || 'Customer',
                    customerSurname: user?.last_name || 'User',
                    customerEmail: user?.email || req.user.email || '',
                    customerPhoneNumber: normalizePhone(user?.phone),
                    customerIpAddress: ip
                }
            };

            const hasCardInput = Boolean(
                String(card_number || '').trim() &&
                String(card_holder_name || '').trim() &&
                String(card_expire_month || '').trim() &&
                String(card_expire_year || '').trim() &&
                String(card_cvv || '').trim()
            );
            const effectiveUseHosted = hasCardInput
                ? false
                : (typeof use_hosted === 'boolean' ? use_hosted : lidioRuntimeConfig.useHosted);
            const effectiveUse3ds = lidioRuntimeConfig.force3ds ? true : !!use_3ds;

            // Process payment
            let paymentResult;
            if (effectiveUseHosted) {
                paymentResult = await lidioService.startHostedPaymentProcess(paymentData, lidioRuntimeConfig);
            } else if (effectiveUse3ds) {
                paymentResult = await lidioService.process3DSPayment(paymentData, lidioRuntimeConfig);
            } else {
                paymentResult = await lidioService.processPayment(paymentData, lidioRuntimeConfig);
            }

            console.info('[payment:initiate] Lidio response summary', {
                orderNumber: order.order_number,
                success: paymentResult?.success,
                status: paymentResult?.status,
                result: paymentResult?.result,
                resultDetail: paymentResult?.resultDetail,
                resultMessage: paymentResult?.resultMessage,
                requires3DS: paymentResult?.requires3DS,
                redirectUrl: paymentResult?.redirectUrl || paymentResult?.redirect_url || paymentResult?.url || null,
                keys: Object.keys(paymentResult || {})
            });

            // Create payment record
            await connection.query(
                'INSERT INTO payments (order_id, payment_method, lidio_transaction_id, amount, currency, status, lidio_response) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [
                    order_id,
                    'credit_card',
                    paymentResult.transactionId || null,
                    paymentData.amount,
                    paymentData.currency,
                    paymentResult.success && !paymentResult.requires3DS ? 'success' : 'pending',
                    JSON.stringify(paymentResult)
                ]
            );

            // If payment successful, update order and create subscription
            if (paymentResult.success && !paymentResult.requires3DS) {
                await connection.query(
                    'UPDATE orders SET status = ? WHERE id = ?',
                    ['completed', order_id]
                );

                await connection.query(
                    'UPDATE payments SET status = ? WHERE order_id = ?',
                    ['success', order_id]
                );

                // Create subscriptions for each product
                const [orderItems] = await connection.query(
                    'SELECT * FROM order_items WHERE order_id = ?',
                    [order_id]
                );

                for (const item of orderItems) {
                    await connection.query(
                        'INSERT INTO subscriptions (user_id, product_id, order_id, status) VALUES (?, ?, ?, ?)',
                        [req.user.id, item.product_id, order_id, 'active']
                    );
                }
            }

            await connection.commit();
            registerPaymentAttempt(rateKey);

            res.json({
                message: paymentResult.success ? 'Payment successful' : 'Payment initiated',
                payment: paymentResult,
                order: {
                    id: order.id,
                    order_number: order.order_number,
                    status: paymentResult.success && !paymentResult.requires3DS ? 'completed' : 'processing'
                }
            });
        } catch (error) {
            await connection.rollback();
            registerPaymentAttempt(`${req.user.id}:${getClientIp(req)}`);
            console.error('Payment initiate error:', error);
            res.status(500).json({ error: error.message || 'Server error' });
        } finally {
            connection.release();
        }
    }
);

// Payment callback (for 3DS)
const handleCallback = async (req, res) => {
    const connection = await db.getConnection();

    try {
        const payload = {
            ...(req.query || {}),
            ...(req.body || {})
        };

        const transactionId = valueFromPayload(payload, 'transactionId');
        const status = valueFromPayload(payload, 'status');
        const normalizedStatus = String(status || '').toLowerCase();
        const isSuccessStatus = ['success', '3dsuccess', 'approved', 'completed'].includes(normalizedStatus);
        const orderNumber = valueFromPayload(payload, 'orderNumber');
        const merchantProcessId = valueFromPayload(payload, 'merchantProcessId');
        const lidioRuntimeConfig = await getLidioRuntimeConfig(connection);
        const verify = verifyCallbackHashes(payload, lidioRuntimeConfig);
        if (!verify.ok) {
            return res.status(400).json({ error: verify.reason });
        }

        await connection.beginTransaction();

        // Get order by order number
        const orders = await resolveCallbackOrder(connection, orderNumber, merchantProcessId);

        if (orders.length === 0) {
            console.error('[payment:callback] Order resolution failed', {
                orderNumber,
                merchantProcessId,
                transactionId,
                payloadKeys: Object.keys(payload || {})
            });
            throw new Error('Order not found');
        }

        const order = orders[0];

        // Update payment status
        await connection.query(
            'UPDATE payments SET status = ?, lidio_response = ? WHERE order_id = ?',
            [isSuccessStatus ? 'success' : 'failed', JSON.stringify(payload), order.id]
        );

        // Update order status
        if (isSuccessStatus) {
            await connection.query(
                'UPDATE orders SET status = ? WHERE id = ?',
                ['completed', order.id]
            );

            // Create subscriptions
            const [orderItems] = await connection.query(
                'SELECT * FROM order_items WHERE order_id = ?',
                [order.id]
            );

            for (const item of orderItems) {
                await connection.query(
                    'INSERT INTO subscriptions (user_id, product_id, order_id, status) VALUES (?, ?, ?, ?)',
                    [order.user_id, item.product_id, order.id, 'active']
                );
            }
        } else {
            await connection.query(
                'UPDATE orders SET status = ? WHERE id = ?',
                ['failed', order.id]
            );
        }

        await connection.commit();

        res.json({ message: 'Payment callback processed', status, transactionId });
    } catch (error) {
        await connection.rollback();
        console.error('Payment callback error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    } finally {
        connection.release();
    }
};

// Payment callback (for return URL and notification)
router.post('/callback', handleCallback);
router.get('/callback', handleCallback);

// Get payment status
router.get('/status/:orderId', authMiddleware, async (req, res) => {
    try {
        const [payments] = await db.query(
            `SELECT p.*, o.order_number, o.status as order_status
             FROM payments p
             JOIN orders o ON p.order_id = o.id
             WHERE o.id = ? AND o.user_id = ?`,
            [req.params.orderId, req.user.id]
        );

        if (payments.length === 0) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        res.json({ payment: payments[0] });
    } catch (error) {
        console.error('Get payment status error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
