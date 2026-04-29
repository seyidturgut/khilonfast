import express from 'express';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';
import db from '../config/database.js';
import authMiddleware from '../middleware/auth.js';
import lidioService from '../services/lidioService.js';
import { dispatchOrderEmails } from '../services/orderNotifications.js';

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
const maskCardNumber = (raw) => {
    const digits = String(raw || '').replace(/\D/g, '');
    if (digits.length < 8) return digits ? `**** **** **** ${digits.slice(-4)}` : '';
    return `${digits.slice(0, 6)}******${digits.slice(-4)}`;
};

/**
 * Yeni bir kayıtlı kart yazar ya da aynı token zaten varsa idempotent davranır.
 * UNIQUE (user_id, lidio_token) olduğu için INSERT IGNORE kullanılır.
 */
const persistSavedCard = async (connection, data) => {
    if (!data?.token || !data?.userId) return null;
    const [existing] = await connection.query(
        'SELECT id FROM user_cards WHERE user_id = ? AND lidio_token = ? LIMIT 1',
        [data.userId, data.token]
    );
    if (existing.length) return existing[0].id;

    const [result] = await connection.query(
        `INSERT INTO user_cards
            (user_id, lidio_token, masked_number, card_brand, expire_month, expire_year, card_holder_name, is_default)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            data.userId,
            data.token,
            data.maskedNumber || '',
            data.cardBrand || null,
            data.expireMonth || 0,
            data.expireYear || 0,
            data.cardHolderName || null,
            0
        ]
    );

    // Eğer kullanıcının başka kartı yoksa bunu default yap
    const [count] = await connection.query(
        'SELECT COUNT(*) AS c FROM user_cards WHERE user_id = ? AND is_active = 1',
        [data.userId]
    );
    if (Number(count[0]?.c || 0) === 1) {
        await connection.query(
            'UPDATE user_cards SET is_default = 1 WHERE id = ?',
            [result.insertId]
        );
    }
    return result.insertId;
};

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
        body('use_hosted').optional().isBoolean(),
        body('save_card').optional().isBoolean(),
        body('saved_card_id').optional().isInt({ min: 1 }),
        body('card_name_by_user').optional().isString()
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
                use_hosted,
                save_card = false,
                saved_card_id = 0,
                card_name_by_user
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

            // Kayıtlı kart kullanımı: token'ı user_cards'tan çek (sadece bu kullanıcıya ait)
            let storedCardRow = null;
            if (saved_card_id > 0) {
                const [rows] = await connection.query(
                    'SELECT * FROM user_cards WHERE id = ? AND user_id = ? AND is_active = 1 LIMIT 1',
                    [saved_card_id, req.user.id]
                );
                if (!rows.length) {
                    await connection.rollback();
                    return res.status(404).json({ error: 'Kayıtlı kart bulunamadı.' });
                }
                if (!String(card_cvv || '').trim()) {
                    await connection.rollback();
                    return res.status(400).json({ error: 'Kayıtlı kart için CVV zorunludur.' });
                }
                storedCardRow = rows[0];
            }

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
                cardToken: storedCardRow?.lidio_token,
                use3DSecure: lidioRuntimeConfig.force3ds ? true : !!use_3ds,
                saveCardAfterSuccess: !storedCardRow && Boolean(save_card),
                cardNamebyUser: card_name_by_user || undefined,
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
            const effectiveUseHosted = (storedCardRow || hasCardInput)
                ? false
                : (typeof use_hosted === 'boolean' ? use_hosted : lidioRuntimeConfig.useHosted);
            const effectiveUse3ds = lidioRuntimeConfig.force3ds ? true : !!use_3ds;

            // Process payment
            let paymentResult;
            if (storedCardRow) {
                paymentResult = await lidioService.processStoredCardPayment(paymentData, lidioRuntimeConfig);
            } else if (effectiveUseHosted) {
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

                // Create subscriptions for each product (idempotent)
                const [orderItems] = await connection.query(
                    'SELECT * FROM order_items WHERE order_id = ?',
                    [order_id]
                );

                for (const item of orderItems) {
                    const [exists] = await connection.query(
                        'SELECT id FROM subscriptions WHERE user_id = ? AND product_id = ? AND order_id = ? LIMIT 1',
                        [req.user.id, item.product_id, order_id]
                    );
                    if (exists.length === 0) {
                        await connection.query(
                            'INSERT INTO subscriptions (user_id, product_id, order_id, status) VALUES (?, ?, ?, ?)',
                            [req.user.id, item.product_id, order_id, 'active']
                        );
                    }
                }

                // Yeni kart + "kartımı sakla" işaretliyse Lidio cevabındaki token'ı user_cards'a yaz
                if (paymentData.saveCardAfterSuccess && paymentResult.cardToken) {
                    await persistSavedCard(connection, {
                        userId: req.user.id,
                        token: paymentResult.cardToken,
                        maskedNumber: paymentResult.maskedCardNumber || maskCardNumber(card_number),
                        cardBrand: paymentResult.cardBrand,
                        cardHolderName: card_holder_name,
                        expireMonth: Number(card_expire_month),
                        expireYear: Number(card_expire_year)
                    });
                }
            }

            await connection.commit();

            // Direkt başarılı (3DS gerekmedi) ödemelerde sipariş onay + admin bildirim maili
            if (paymentResult.success && !paymentResult.requires3DS) {
                dispatchOrderEmails(order_id).catch(err =>
                    console.error('Order mail dispatch (initiate) error:', err.message));
            }

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

        // İdempotency: Lidio aynı ödeme için 2 callback gönderebilir
        //   1) Senkron: kullanıcı browser ReturnURL'e döndüğünde (frontend → /api/payment/callback)
        //   2) Asenkron: Lidio sahtecilik kontrolü/POS notification webhook'u (server-to-server)
        // Sipariş zaten "completed" ise tekrar FinishPaymentProcess çağırma, subscription INSERT etme,
        // mail tekrar gönderme — sadece OK dön.
        if (order.status === 'completed') {
            await connection.commit();
            return res.json({
                message: 'Payment already finalized (idempotent return)',
                status: 'success',
                transactionId,
                finalSuccess: true,
                alreadyProcessed: true
            });
        }

        // Lidio'nun iki aşamalı akışında (3DS, Anında Havale, BkmExpress…) callback geldiğinde
        // ilk aşama "ön yetkilendirme" gibi düşünülmeli — finansallaşması için FinishPaymentProcess
        // çağrılmalı. Başarılı dönüşse bu adımı uygula; cevabı ana lidio_response'a birleştir.
        let finishResponse = null;
        let combinedLidioResponse = { ...payload };
        if (isSuccessStatus && transactionId) {
            try {
                finishResponse = await lidioService.finishPaymentProcess(
                    { transactionId, merchantProcessId: merchantProcessId || String(order.id) },
                    lidioRuntimeConfig
                );
                combinedLidioResponse = {
                    initial: payload,
                    finishPaymentProcess: finishResponse
                };
            } catch (finishErr) {
                console.error('[payment:callback] FinishPaymentProcess failed:', finishErr.message);
                // Finalize edilemediyse "pending" bırakıp manuel müdahaleye düş
                combinedLidioResponse = {
                    initial: payload,
                    finishError: finishErr.message
                };
            }
        }

        const finalSuccess = isSuccessStatus && (!finishResponse || finishResponse.success !== false);

        // Update payment status
        await connection.query(
            'UPDATE payments SET status = ?, lidio_response = ? WHERE order_id = ?',
            [
                finalSuccess ? 'success' : (isSuccessStatus ? 'pending' : 'failed'),
                JSON.stringify(combinedLidioResponse),
                order.id
            ]
        );

        // Update order status
        if (finalSuccess) {
            await connection.query(
                'UPDATE orders SET status = ? WHERE id = ?',
                ['completed', order.id]
            );

            // Create subscriptions
            const [orderItems] = await connection.query(
                'SELECT * FROM order_items WHERE order_id = ?',
                [order.id]
            );

            // Idempotent INSERT: aynı (user_id, product_id, order_id) zaten varsa atlama
            for (const item of orderItems) {
                const [existing] = await connection.query(
                    'SELECT id FROM subscriptions WHERE user_id = ? AND product_id = ? AND order_id = ? LIMIT 1',
                    [order.user_id, item.product_id, order.id]
                );
                if (existing.length === 0) {
                    await connection.query(
                        'INSERT INTO subscriptions (user_id, product_id, order_id, status) VALUES (?, ?, ?, ?)',
                        [order.user_id, item.product_id, order.id, 'active']
                    );
                }
            }

            // 3DS sonrası "kartımı sakla" işaretliyse Lidio finishResponse içinde token döner
            const savedToken = finishResponse?.cardToken
                || valueFromPayload(payload, 'cardToken')
                || payload.savedCardToken;
            if (savedToken) {
                await persistSavedCard(connection, {
                    userId: order.user_id,
                    token: savedToken,
                    maskedNumber: finishResponse?.maskedCardNumber || valueFromPayload(payload, 'maskedCardNumber') || '',
                    cardBrand: finishResponse?.cardBrand || valueFromPayload(payload, 'cardBrand') || null,
                    cardHolderName: valueFromPayload(payload, 'cardHolderName') || null,
                    expireMonth: Number(valueFromPayload(payload, 'cardMonth') || valueFromPayload(payload, 'expireMonth') || 0),
                    expireYear: Number(valueFromPayload(payload, 'cardYear') || valueFromPayload(payload, 'expireYear') || 0)
                });
            }
        } else {
            await connection.query(
                'UPDATE orders SET status = ? WHERE id = ?',
                [isSuccessStatus ? 'processing' : 'failed', order.id]
            );
        }

        await connection.commit();

        // Yalnızca son success durumunda mail at
        if (finalSuccess) {
            dispatchOrderEmails(order.id).catch(err =>
                console.error('Order mail dispatch (callback) error:', err.message));
        }

        res.json({ message: 'Payment callback processed', status, transactionId, finalSuccess });
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

// ──────────────────────────────────────────────────
// Saved Cards (Kart Saklama) — listele, sil, default yap
// ──────────────────────────────────────────────────

router.get('/cards', authMiddleware, async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT id, masked_number, card_brand, expire_month, expire_year,
                    card_holder_name, is_default, created_at
             FROM user_cards
             WHERE user_id = ? AND is_active = 1
             ORDER BY is_default DESC, created_at DESC`,
            [req.user.id]
        );
        res.json({ cards: rows });
    } catch (error) {
        console.error('Get saved cards error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.delete('/cards/:id', authMiddleware, async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT id, is_default FROM user_cards WHERE id = ? AND user_id = ? LIMIT 1',
            [req.params.id, req.user.id]
        );
        if (!rows.length) return res.status(404).json({ error: 'Kart bulunamadı.' });

        // Soft delete: ileride Lidio kayıt kaybolmasın diye is_active=0
        await db.query('UPDATE user_cards SET is_active = 0, is_default = 0 WHERE id = ?', [req.params.id]);

        // Silinen default ise başka aktif bir kartı default yap
        if (rows[0].is_default) {
            const [next] = await db.query(
                'SELECT id FROM user_cards WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 1',
                [req.user.id]
            );
            if (next.length) {
                await db.query('UPDATE user_cards SET is_default = 1 WHERE id = ?', [next[0].id]);
            }
        }
        res.json({ message: 'Kart silindi.' });
    } catch (error) {
        console.error('Delete saved card error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.patch('/cards/:id/default', authMiddleware, async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [rows] = await connection.query(
            'SELECT id FROM user_cards WHERE id = ? AND user_id = ? AND is_active = 1 LIMIT 1',
            [req.params.id, req.user.id]
        );
        if (!rows.length) {
            await connection.rollback();
            return res.status(404).json({ error: 'Kart bulunamadı.' });
        }
        await connection.query('UPDATE user_cards SET is_default = 0 WHERE user_id = ?', [req.user.id]);
        await connection.query('UPDATE user_cards SET is_default = 1 WHERE id = ?', [req.params.id]);
        await connection.commit();
        res.json({ message: 'Varsayılan kart güncellendi.' });
    } catch (error) {
        await connection.rollback();
        console.error('Set default card error:', error);
        res.status(500).json({ error: 'Server error' });
    } finally {
        connection.release();
    }
});

// ──────────────────────────────────────────────────
// Bank Accounts — Anında Havale için kullanılabilir bankalar
// ──────────────────────────────────────────────────

router.get('/bank-accounts', async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT id, lidio_bank_account_id, bank_name, bank_code, logo_url
             FROM bank_accounts
             WHERE is_active = 1
             ORDER BY display_order ASC, bank_name ASC`
        );
        res.json({ banks: rows });
    } catch (error) {
        console.error('Get bank accounts error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ──────────────────────────────────────────────────
// Anında Havale (DirectWireTransfer) başlatma
// İki aşamalı: ProcessPayment → bank redirect → return → FinishPaymentProcess
// ──────────────────────────────────────────────────

router.post('/bank-transfer',
    authMiddleware,
    [
        body('order_id').isInt().withMessage('Valid order ID required'),
        body('bank_account_id').optional().isInt({ min: 1 })
    ],
    async (req, res) => {
        const connection = await db.getConnection();
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { order_id, bank_account_id } = req.body;
            const lidioRuntimeConfig = await getLidioRuntimeConfig(connection);
            const ip = getClientIp(req);
            const rateKey = `${req.user.id}:${ip}`;

            if (isRateLimited(rateKey, lidioRuntimeConfig.rateLimitWindowSeconds, lidioRuntimeConfig.rateLimitMaxAttempts)) {
                return res.status(429).json({ error: 'Çok fazla ödeme denemesi. Lütfen daha sonra tekrar deneyin.' });
            }

            const [orders] = await connection.query(
                'SELECT * FROM orders WHERE id = ? AND user_id = ?',
                [order_id, req.user.id]
            );
            if (!orders.length) return res.status(404).json({ error: 'Order not found' });

            const order = orders[0];
            const orderAmount = parseFloat(order.total_amount || 0);
            if (orderAmount <= 0) return res.status(400).json({ error: 'Bu sipariş için ödeme gerekmiyor.' });
            if (order.status === 'completed') return res.status(400).json({ error: 'Order already completed' });

            // Banka hesabı kontrolü — admin tanımlamamışsa Anında Havale kapalı sayılır
            let bankAccountLidioId = null;
            if (bank_account_id) {
                const [bankRows] = await connection.query(
                    'SELECT lidio_bank_account_id FROM bank_accounts WHERE id = ? AND is_active = 1 LIMIT 1',
                    [bank_account_id]
                );
                if (!bankRows.length) return res.status(400).json({ error: 'Geçersiz banka.' });
                bankAccountLidioId = bankRows[0].lidio_bank_account_id;
            } else {
                // Default bank account (admin tek banka tanımlamışsa otomatik)
                const [defaultBank] = await connection.query(
                    'SELECT lidio_bank_account_id FROM bank_accounts WHERE is_active = 1 ORDER BY display_order ASC LIMIT 1'
                );
                if (!defaultBank.length) {
                    return res.status(503).json({ error: 'Anında Havale şu anda kullanılamıyor. Lütfen kart ile ödeme yapın.' });
                }
                bankAccountLidioId = defaultBank[0].lidio_bank_account_id;
            }

            const [users] = await connection.query(
                'SELECT id, email, first_name, last_name, phone FROM users WHERE id = ? LIMIT 1',
                [req.user.id]
            );
            const user = users[0];

            await connection.beginTransaction();
            await connection.query('UPDATE orders SET status = ? WHERE id = ?', ['processing', order_id]);

            const paymentData = {
                orderId: `KHL${Date.now()}${order.id}`.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20),
                merchantProcessId: String(order.id),
                amount: orderAmount,
                currency: order.currency,
                bankAccountId: bankAccountLidioId,
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

            const result = await lidioService.processDirectWireTransfer(paymentData, lidioRuntimeConfig);

            await connection.query(
                'INSERT INTO payments (order_id, payment_method, lidio_transaction_id, amount, currency, status, lidio_response) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [
                    order_id,
                    'wire_transfer',
                    result.transactionId || null,
                    orderAmount,
                    order.currency,
                    'pending',
                    JSON.stringify(result)
                ]
            );

            await connection.commit();
            registerPaymentAttempt(rateKey);

            res.json({
                message: 'Wire transfer initiated',
                redirect_url: result.redirectUrl || null,
                redirect_form: result.redirectForm || null,
                redirect_form_params: result.redirectFormParams || null,
                transaction_id: result.transactionId || null
            });
        } catch (error) {
            await connection.rollback().catch(() => {});
            console.error('Bank transfer error:', error);
            res.status(500).json({ error: error.message || 'Server error' });
        } finally {
            connection.release();
        }
    }
);

export default router;
