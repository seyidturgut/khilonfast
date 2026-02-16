import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import db from '../config/database.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Get user profile
router.get('/', authMiddleware, async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT id, email, first_name, last_name, phone, address, created_at FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(users[0]);
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update user profile
router.put(
    '/',
    authMiddleware,
    [
        body('first_name').optional().trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
        body('last_name').optional().trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
        body('phone').optional().trim(),
        body('address').optional().trim()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { first_name, last_name, phone, address } = req.body;
            const updates = [];
            const values = [];

            if (first_name !== undefined) {
                updates.push('first_name = ?');
                values.push(first_name);
            }
            if (last_name !== undefined) {
                updates.push('last_name = ?');
                values.push(last_name);
            }
            if (phone !== undefined) {
                updates.push('phone = ?');
                values.push(phone);
            }
            if (address !== undefined) {
                updates.push('address = ?');
                values.push(address);
            }

            if (updates.length === 0) {
                return res.status(400).json({ error: 'No fields to update' });
            }

            values.push(req.user.id);

            await db.query(
                `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
                values
            );

            // Fetch updated profile
            const [users] = await db.query(
                'SELECT id, email, first_name, last_name, phone, address FROM users WHERE id = ?',
                [req.user.id]
            );

            res.json({ message: 'Profile updated successfully', user: users[0] });
        } catch (error) {
            console.error('Profile update error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }
);

// Change password
router.put(
    '/password',
    authMiddleware,
    [
        body('current_password').notEmpty().withMessage('Current password is required'),
        body('new_password').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { current_password, new_password } = req.body;

            // Get current password hash
            const [users] = await db.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);

            if (users.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Verify current password
            const isValid = await bcrypt.compare(current_password, users[0].password_hash);
            if (!isValid) {
                return res.status(400).json({ error: 'Current password is incorrect' });
            }

            // Hash new password
            const salt = await bcrypt.genSalt(10);
            const newPasswordHash = await bcrypt.hash(new_password, salt);

            // Update password
            await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [newPasswordHash, req.user.id]);

            res.json({ message: 'Password changed successfully' });
        } catch (error) {
            console.error('Password change error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }
);

export default router;
