import express from 'express';
import { body, validationResult } from 'express-validator';
import db from '../config/database.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Get company info
router.get('/', authMiddleware, async (req, res) => {
    try {
        const [companies] = await db.query(
            'SELECT * FROM company_info WHERE user_id = ?',
            [req.user.id]
        );

        if (companies.length === 0) {
            return res.json(null); // No company info yet
        }

        res.json(companies[0]);
    } catch (error) {
        console.error('Company fetch error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create or update company info
router.post(
    '/',
    authMiddleware,
    [
        body('company_name').optional().trim(),
        body('tax_number').optional().trim(),
        body('company_address').optional().trim(),
        body('company_phone').optional().trim()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { company_name, tax_number, company_address, company_phone } = req.body;

            // Check if company info exists
            const [existing] = await db.query(
                'SELECT id FROM company_info WHERE user_id = ?',
                [req.user.id]
            );

            if (existing.length > 0) {
                // Update existing
                await db.query(
                    `UPDATE company_info 
                     SET company_name = ?, tax_number = ?, company_address = ?, company_phone = ?
                     WHERE user_id = ?`,
                    [company_name, tax_number, company_address, company_phone, req.user.id]
                );
            } else {
                // Insert new
                await db.query(
                    `INSERT INTO company_info (user_id, company_name, tax_number, company_address, company_phone)
                     VALUES (?, ?, ?, ?, ?)`,
                    [req.user.id, company_name, tax_number, company_address, company_phone]
                );
            }

            // Fetch updated info
            const [companies] = await db.query(
                'SELECT * FROM company_info WHERE user_id = ?',
                [req.user.id]
            );

            res.json({ message: 'Company info saved successfully', company: companies[0] });
        } catch (error) {
            console.error('Company save error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }
);

export default router;
