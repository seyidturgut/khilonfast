import express from 'express';
import db from '../config/database.js';

const router = express.Router();

// Get all products
router.get('/', async (req, res) => {
    try {
        const [products] = await db.query(
            'SELECT * FROM products WHERE is_active = TRUE ORDER BY category, id'
        );
        res.json({ products });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get product by ID
router.get('/:id', async (req, res) => {
    try {
        const [products] = await db.query('SELECT * FROM products WHERE id = ?', [req.params.id]);

        if (products.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({ product: products[0] });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get product by key
router.get('/key/:key', async (req, res) => {
    try {
        const [products] = await db.query('SELECT * FROM products WHERE product_key = ?', [req.params.key]);

        if (products.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({ product: products[0] });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
