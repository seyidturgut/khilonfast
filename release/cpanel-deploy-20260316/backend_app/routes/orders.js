import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import db from '../config/database.js';
import authMiddleware, { optionalAuthMiddleware } from '../middleware/auth.js';
import { sendWelcomeAccountEmail } from '../services/emailService.js';

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

            const { items, guest_email, guest_name, guest_phone } = req.body;
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

            // Calculate total amount
            let totalAmount = 0;
            const orderItems = [];

            for (const item of items) {
                let product;

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

                const itemTotal = parseFloat(product.price) * item.quantity;
                totalAmount += itemTotal;

                orderItems.push({
                    product_id: product.id, // Use the actual DB product ID
                    quantity: item.quantity,
                    unit_price: product.price,
                    total_price: itemTotal
                });
            }

            // Generate order number
            const orderNumber = `ORD-${Date.now()}-${userId}`;

            // Create order
            const [orderResult] = await connection.query(
                'INSERT INTO orders (user_id, order_number, total_amount, status) VALUES (?, ?, ?, ?)',
                [userId, orderNumber, totalAmount, 'pending']
            );

            const orderId = orderResult.insertId;

            // Create order items
            for (const item of orderItems) {
                await connection.query(
                    'INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)',
                    [orderId, item.product_id, item.quantity, item.unit_price, item.total_price]
                );
            }

            await connection.commit();

            res.status(201).json({
                message: 'Order created successfully',
                order: {
                    id: orderId,
                    order_number: orderNumber,
                    total_amount: totalAmount,
                    status: 'pending'
                },
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
        const [orders] = await db.query(
            `SELECT o.*, 
                    GROUP_CONCAT(
                        JSON_OBJECT(
                            'id', oi.id,
                            'product_id', oi.product_id,
                            'product_name', p.name,
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

        const [orders] = await db.query(
            `SELECT o.*, 
                    GROUP_CONCAT(
                        JSON_OBJECT(
                            'id', oi.id,
                            'product_id', oi.product_id,
                            'product_name', p.name,
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
