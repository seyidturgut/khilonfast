import express from 'express';
import db from '../config/database.js';
import authMiddleware from '../middleware/auth.js';
import adminMiddleware from '../middleware/admin.js';

const router = express.Router();

// Apply auth and admin checks to all routes in this file
router.use(authMiddleware, adminMiddleware);

// --- SETTINGS MANAGEMENT ---

// GET /api/admin/settings
router.get('/settings', async (req, res) => {
    try {
        const [settings] = await db.query('SELECT * FROM settings');
        // Convert array to object for easier frontend handling
        const settingsMap = settings.reduce((acc, curr) => {
            acc[curr.setting_key] = curr.setting_value;
            return acc;
        }, {});
        res.json(settingsMap);
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/admin/settings
router.post('/settings', async (req, res) => {
    const updates = req.body; // Expect { key: value, key2: value2 }

    try {
        // Use transaction for bulk updates
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            for (const [key, value] of Object.entries(updates)) {
                await connection.query(
                    'UPDATE settings SET setting_value = ? WHERE setting_key = ?',
                    [value, key]
                );
            }
            await connection.commit();
            res.json({ message: 'Settings updated successfully' });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// --- PAGE MANAGEMENT (Basic) ---

// POST /api/admin/pages/create
router.post('/pages', async (req, res) => {
    const { title, slug, meta_title, meta_description } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO cms_pages (title, slug, meta_title, meta_description) VALUES (?, ?, ?, ?)',
            [title, slug, meta_title, meta_description]
        );
        res.status(201).json({ id: result.insertId, message: 'Page created' });
    } catch (error) {
        console.error('Create page error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// --- PRODUCT MANAGEMENT ---

// GET /api/admin/products - List all products (including inactive)
router.get('/products', async (req, res) => {
    try {
        const [products] = await db.query('SELECT * FROM products ORDER BY created_at DESC');
        res.json(products);
    } catch (error) {
        console.error('Admin get products error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/admin/products - Create new product
router.post('/products', async (req, res) => {
    const {
        product_key, name, description, price, currency, category,
        type = 'service', duration_days = null, access_content_url = null
    } = req.body;

    try {
        const [result] = await db.query(
            `INSERT INTO products 
            (product_key, name, description, price, currency, category, type, duration_days, access_content_url) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [product_key, name, description, price, currency, category, type, duration_days, access_content_url]
        );
        res.status(201).json({ id: result.insertId, message: 'Ürün başarıyla oluşturuldu.' });
    } catch (error) {
        console.error('Create product error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Bu ürün anahtarı (key) zaten kullanılıyor.' });
        }
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /api/admin/products/:id - Update product
router.put('/products/:id', async (req, res) => {
    const {
        name, description, price, currency, category, is_active,
        type, duration_days, access_content_url
    } = req.body;

    try {
        await db.query(
            `UPDATE products SET 
            name=?, description=?, price=?, currency=?, category=?, is_active=?,
            type=?, duration_days=?, access_content_url=?
            WHERE id=?`,
            [name, description, price, currency, category, is_active, type, duration_days, access_content_url, req.params.id]
        );
        res.json({ message: 'Ürün güncellendi.' });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE /api/admin/products/:id - Delete product
router.delete('/products/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM products WHERE id = ?', [req.params.id]);
        res.json({ message: 'Ürün silindi.' });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
