import express from 'express';
import { body, validationResult } from 'express-validator';
import db from '../config/database.js';
import authMiddleware from '../middleware/auth.js';
import lidioService from '../services/lidioService.js';

const router = express.Router();

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
        body('use_3ds').optional().isBoolean()
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
                use_3ds = false
            } = req.body;

            // Get order details
            const [orders] = await connection.query(
                'SELECT * FROM orders WHERE id = ? AND user_id = ?',
                [order_id, req.user.id]
            );

            if (orders.length === 0) {
                return res.status(404).json({ error: 'Order not found' });
            }

            const order = orders[0];

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
                orderId: order.order_number,
                amount: parseFloat(order.total_amount),
                currency: order.currency,
                cardNumber: card_number,
                cardHolderName: card_holder_name,
                cardExpireMonth: card_expire_month,
                cardExpireYear: card_expire_year,
                cardCvv: card_cvv,
                callbackUrl: `${process.env.FRONTEND_URL}/payment-callback`
            };

            // Process payment
            let paymentResult;
            if (use_3ds) {
                paymentResult = await lidioService.process3DSPayment(paymentData);
            } else {
                paymentResult = await lidioService.processPayment(paymentData);
            }

            // Create payment record
            await connection.query(
                'INSERT INTO payments (order_id, payment_method, lidio_transaction_id, amount, currency, status, lidio_response) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [
                    order_id,
                    'credit_card',
                    paymentResult.transactionId || null,
                    paymentData.amount,
                    paymentData.currency,
                    paymentResult.success ? 'success' : 'pending',
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

            res.json({
                message: paymentResult.success ? 'Payment successful' : 'Payment initiated',
                payment: paymentResult,
                order: {
                    id: order.id,
                    order_number: order.order_number,
                    status: paymentResult.success ? 'completed' : 'processing'
                }
            });
        } catch (error) {
            await connection.rollback();
            console.error('Payment initiate error:', error);
            res.status(500).json({ error: error.message || 'Server error' });
        } finally {
            connection.release();
        }
    }
);

// Payment callback (for 3DS)
router.post('/callback', async (req, res) => {
    const connection = await db.getConnection();

    try {
        const { transactionId, status, orderNumber } = req.body;

        await connection.beginTransaction();

        // Get order by order number
        const [orders] = await connection.query(
            'SELECT * FROM orders WHERE order_number = ?',
            [orderNumber]
        );

        if (orders.length === 0) {
            throw new Error('Order not found');
        }

        const order = orders[0];

        // Update payment status
        await connection.query(
            'UPDATE payments SET status = ?, lidio_response = ? WHERE order_id = ?',
            [status === 'success' ? 'success' : 'failed', JSON.stringify(req.body), order.id]
        );

        // Update order status
        if (status === 'success') {
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

        res.json({ message: 'Payment callback processed', status });
    } catch (error) {
        await connection.rollback();
        console.error('Payment callback error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    } finally {
        connection.release();
    }
});

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
