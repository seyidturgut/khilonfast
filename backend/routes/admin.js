import express from 'express';
import bcrypt from 'bcryptjs';
import fs from 'fs/promises';
import path from 'path';
import db from '../config/database.js';
import { clearCache } from '../middleware/cache.js';
import authMiddleware from '../middleware/auth.js';
import adminMiddleware from '../middleware/admin.js';

import { fileURLToPath } from 'url';
const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SENSITIVE_SETTINGS = new Set([
    'smtp_pass',
    'lidio_api_key',
    'lidio_secret_key',
    'lidio_merchant_key',
    'lidio_api_password',
    'lidio_authorization'
]);

const maskSettingValue = (value) => {
    if (!value) return '';
    const str = String(value);
    if (str.length <= 4) return '****';
    return `${'*'.repeat(Math.max(8, str.length - 4))}${str.slice(-4)}`;
};

// Apply auth and admin checks to all routes in this file
router.use(authMiddleware, adminMiddleware);

// --- DASHBOARD STATS ---

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
    try {
        const [[usersRow]] = await db.query(
            'SELECT COUNT(*) AS total_users FROM users'
        );

        const [[ordersRow]] = await db.query(
            'SELECT COUNT(*) AS total_orders FROM orders'
        );

        const [[revenueRow]] = await db.query(
            `SELECT COALESCE(SUM(total_amount), 0) AS total_revenue
             FROM orders
             WHERE status = 'completed'`
        );

        res.json({
            total_users: Number(usersRow.total_users || 0),
            total_orders: Number(ordersRow.total_orders || 0),
            total_revenue: Number(revenueRow.total_revenue || 0)
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// --- SETTINGS MANAGEMENT ---

// GET /api/admin/settings
router.get('/settings', async (req, res) => {
    try {
        const [settings] = await db.query('SELECT * FROM settings');
        // Convert array to object for easier frontend handling
        const settingsMap = settings.reduce((acc, curr) => {
            if (SENSITIVE_SETTINGS.has(curr.setting_key)) {
                acc[curr.setting_key] = maskSettingValue(curr.setting_value);
            } else {
                acc[curr.setting_key] = curr.setting_value;
            }
            return acc;
        }, {});

        // Provide env fallbacks for payment keys if DB values are missing
        if (!settingsMap.lidio_api_key && process.env.LIDIO_API_KEY) {
            settingsMap.lidio_api_key = process.env.LIDIO_API_KEY;
        }
        if (!settingsMap.lidio_secret_key && process.env.LIDIO_SECRET_KEY) {
            settingsMap.lidio_secret_key = process.env.LIDIO_SECRET_KEY;
        }
        if (!settingsMap.lidio_merchant_id && process.env.LIDIO_MERCHANT_ID) {
            settingsMap.lidio_merchant_id = process.env.LIDIO_MERCHANT_ID;
        }
        if (!settingsMap.lidio_api_url && process.env.LIDIO_API_URL) {
            settingsMap.lidio_api_url = process.env.LIDIO_API_URL;
        }
        if (!settingsMap.lidio_test_mode && process.env.LIDIO_TEST_MODE !== undefined) {
            settingsMap.lidio_test_mode = process.env.LIDIO_TEST_MODE;
        }
        if (!settingsMap.lidio_merchant_code && process.env.LIDIO_MERCHANT_CODE) {
            settingsMap.lidio_merchant_code = process.env.LIDIO_MERCHANT_CODE;
        }
        if (!settingsMap.lidio_authorization && process.env.LIDIO_AUTHORIZATION) {
            settingsMap.lidio_authorization = process.env.LIDIO_AUTHORIZATION;
        }

        res.json(settingsMap);
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/admin/settings
router.post('/settings', async (req, res) => {
    const updates = req.body; // Expect { key: value, key2: value2 }
    const groupByKey = {
        site_title: 'general',
        contact_email: 'general',
        google_analytics_id: 'seo',
        smtp_host: 'mail',
        smtp_port: 'mail',
        smtp_user: 'mail',
        smtp_pass: 'mail',
        payment_provider: 'payment',
        lidio_api_key: 'payment',
        lidio_secret_key: 'payment',
        lidio_merchant_id: 'payment',
        lidio_api_url: 'payment',
        lidio_test_mode: 'payment',
        lidio_merchant_code: 'payment',
        lidio_merchant_key: 'payment',
        lidio_api_password: 'payment',
        lidio_authorization: 'payment',
        lidio_process_payment_path: 'payment',
        lidio_process_3ds_path: 'payment',
        lidio_query_payment_path: 'payment',
        lidio_refund_payment_path: 'payment',
        lidio_force_3ds: 'payment',
        payment_rate_limit_window_seconds: 'payment',
        payment_rate_limit_max_attempts: 'payment',
        payment_max_amount_try: 'payment',
        payment_failed_attempts_db_threshold: 'payment',
        lidio_enforce_callback_hash: 'payment',
        lidio_return_hash_fields: 'payment',
        lidio_return_hash_algorithm: 'payment',
        lidio_return_hash_mode: 'payment',
        lidio_notification_hash_fields: 'payment',
        lidio_notification_hash_algorithm: 'payment',
        lidio_notification_hash_mode: 'payment'
    };

    try {
        // Use transaction for bulk updates
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            for (const [key, value] of Object.entries(updates)) {
                const valueStr = value === null || value === undefined ? '' : String(value);
                if (SENSITIVE_SETTINGS.has(key) && /^\*+$/.test(valueStr)) {
                    continue; // Skip masked values to avoid overwriting secrets
                }
                await connection.query(
                    `INSERT INTO settings (setting_key, setting_value, setting_group, description)
                     VALUES (?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE
                        setting_value = VALUES(setting_value),
                        setting_group = VALUES(setting_group)`,
                    [key, valueStr, groupByKey[key] || 'general', `CMS setting: ${key}`]
                );
            }
            await connection.commit();
            clearCache(); // Clear all cache when settings change
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

// GET /api/admin/pages - List pages
router.get('/pages', async (req, res) => {
    try {
        const [pages] = await db.query('SELECT * FROM cms_pages ORDER BY updated_at DESC');
        res.json(pages);
    } catch (error) {
        console.error('Get pages error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/admin/pages/slug/:slug(*) - Get page details by slug
router.get('/pages/slug/:slug(*)', async (req, res) => {
    const slug = decodeURIComponent(req.params.slug || '');
    try {
        const [rows] = await db.query('SELECT * FROM cms_pages WHERE slug = ? LIMIT 1', [slug]);
        if (!rows.length) return res.status(404).json({ error: 'Page not found' });
        res.json(rows[0]);
    } catch (error) {
        console.error('Get page by slug error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/admin/pages/slug/:slug(*)/content - Get page content by slug
router.get('/pages/slug/:slug(*)/content', async (req, res) => {
    const slug = decodeURIComponent(req.params.slug || '');
    try {
        const [pages] = await db.query('SELECT id FROM cms_pages WHERE slug = ? LIMIT 1', [slug]);
        if (!pages.length) return res.status(404).json({ error: 'Page not found' });
        const pageId = pages[0].id;
        const [rows] = await db.query(
            'SELECT content_json, is_published FROM cms_page_contents WHERE page_id = ? ORDER BY id DESC LIMIT 1',
            [pageId]
        );
        if (!rows.length) return res.json({ content_json: null, is_published: false });
        res.json(rows[0]);
    } catch (error) {
        console.error('Get page content by slug error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /api/admin/pages/slug/:slug(*)/content - Upsert page content by slug
router.put('/pages/slug/:slug(*)/content', async (req, res) => {
    const slug = decodeURIComponent(req.params.slug || '');
    const { title, content_json, is_published = true } = req.body;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [pages] = await connection.query('SELECT id FROM cms_pages WHERE slug = ? LIMIT 1', [slug]);
        let pageId;
        if (pages.length) {
            pageId = pages[0].id;
            if (title) {
                await connection.query('UPDATE cms_pages SET title = ? WHERE id = ?', [String(title), pageId]);
            }
        } else {
            const [inserted] = await connection.query(
                'INSERT INTO cms_pages (title, slug, meta_title, meta_description, is_active) VALUES (?, ?, ?, ?, 1)',
                [String(title || slug), slug, '', '']
            );
            pageId = inserted.insertId;
        }

        await connection.query('DELETE FROM cms_page_contents WHERE page_id = ?', [pageId]);
        await connection.query(
            'INSERT INTO cms_page_contents (page_id, content_json, is_published) VALUES (?, ?, ?)',
            [pageId, JSON.stringify(content_json || {}), is_published ? 1 : 0]
        );

        await connection.commit();
        clearCache(); // Clear all cache when page content changes
        res.json({ message: 'Content updated', page_id: pageId });
    } catch (error) {
        await connection.rollback();
        console.error('Upsert page content by slug error:', error);
        res.status(500).json({ error: 'Server error' });
    } finally {
        connection.release();
    }
});

// GET /api/admin/pages/:id - Get page details
router.get('/pages/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query('SELECT * FROM cms_pages WHERE id = ?', [id]);
        if (!rows.length) return res.status(404).json({ error: 'Page not found' });
        res.json(rows[0]);
    } catch (error) {
        console.error('Get page error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/admin/media/upload-base64 - Save base64 image under public/uploads/cms
router.post('/media/upload-base64', async (req, res) => {
    try {
        const { dataUrl, filename } = req.body || {};
        if (!dataUrl || typeof dataUrl !== 'string') {
            return res.status(400).json({ error: 'Missing dataUrl' });
        }

        const m = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
        if (!m) return res.status(400).json({ error: 'Invalid image data' });

        const mime = m[1].toLowerCase();
        const base64 = m[2];
        const extMap = {
            'image/jpeg': 'jpg',
            'image/jpg': 'jpg',
            'image/png': 'png',
            'image/webp': 'webp',
            'image/gif': 'gif',
            'image/avif': 'avif'
        };
        const ext = extMap[mime];
        if (!ext) return res.status(400).json({ error: 'Unsupported image type' });

        const safeBase = String(filename || 'cms-image')
            .toLowerCase()
            .replace(/[^a-z0-9-_]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 60) || 'cms-image';
        const finalName = `${safeBase}-${Date.now()}.${ext}`;

        const projectRoot = path.resolve(__dirname, '../../');
        const uploadDir = path.join(projectRoot, 'public', 'uploads', 'cms');
        await fs.mkdir(uploadDir, { recursive: true });

        const filePath = path.join(uploadDir, finalName);
        await fs.writeFile(filePath, Buffer.from(base64, 'base64'));

        res.json({ path: `/uploads/cms/${finalName}` });
    } catch (error) {
        console.error('Upload base64 media error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/admin/pages/create
router.post('/pages', async (req, res) => {
    const { title, slug, meta_title, meta_description } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO cms_pages (title, slug, meta_title, meta_description) VALUES (?, ?, ?, ?)',
            [title, slug, meta_title, meta_description]
        );
        clearCache();
        res.status(201).json({ id: result.insertId, message: 'Page created' });
    } catch (error) {
        console.error('Create page error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /api/admin/pages/:id - Update page metadata
router.put('/pages/:id', async (req, res) => {
    const { id } = req.params;
    const { title, slug, meta_title, meta_description, is_active } = req.body;
    try {
        await db.query(
            `UPDATE cms_pages
             SET title = ?, slug = ?, meta_title = ?, meta_description = ?, is_active = ?
             WHERE id = ?`,
            [title, slug, meta_title, meta_description, is_active ? 1 : 0, id]
        );
        clearCache();
        res.json({ message: 'Page updated' });
    } catch (error) {
        console.error('Update page error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/admin/pages/:id/content - Get latest page content
router.get('/pages/:id/content', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query(
            'SELECT content_json, is_published FROM cms_page_contents WHERE page_id = ? ORDER BY id DESC LIMIT 1',
            [id]
        );
        if (!rows.length) return res.json({ content_json: null, is_published: false });
        res.json(rows[0]);
    } catch (error) {
        console.error('Get page content error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /api/admin/pages/:id/content - Upsert page content
router.put('/pages/:id/content', async (req, res) => {
    const { id } = req.params;
    const { content_json, is_published = true } = req.body;
    try {
        await db.query('DELETE FROM cms_page_contents WHERE page_id = ?', [id]);
        await db.query(
            'INSERT INTO cms_page_contents (page_id, content_json, is_published) VALUES (?, ?, ?)',
            [id, JSON.stringify(content_json || {}), is_published ? 1 : 0]
        );
        clearCache();
        res.json({ message: 'Content updated' });
    } catch (error) {
        console.error('Update page content error:', error);
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
    const data = req.body || {};
    const product_key = String(data.product_key || '').trim();
    const name = String(data.name || '').trim();
    const description = String(data.description || '');
    const price = Number(data.price || 0);
    const currency = String(data.currency || 'TRY').trim().toUpperCase();
    const category = String(data.category || 'hizmetler').trim();
    const type = String(data.type || 'service').trim();
    const duration_days = data.duration_days === '' || data.duration_days == null
        ? null
        : Number(data.duration_days);
    const access_content_url = data.access_content_url || data.accessContentUrl || data.content_url || null;
    const features = data.features ?? null;

    if (!product_key || !name) {
        return res.status(400).json({ error: 'Ürün key ve ürün adı zorunludur.' });
    }
    if (!Number.isFinite(price)) {
        return res.status(400).json({ error: 'Geçerli bir fiyat girin.' });
    }
    if (duration_days !== null && !Number.isFinite(duration_days)) {
        return res.status(400).json({ error: 'Geçerli bir süre (gün) girin.' });
    }

    try {
        const [result] = await db.query(
            `INSERT INTO products 
            (product_key, name, description, price, currency, category, type, duration_days, access_content_url, features) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [product_key, name, description, price, currency, category, type, duration_days, access_content_url, features]
        );
        clearCache();
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
    const data = req.body || {};
    const name = String(data.name || '').trim();
    const description = String(data.description || '');
    const price = Number(data.price || 0);
    const currency = String(data.currency || 'TRY').trim().toUpperCase();
    const category = String(data.category || 'hizmetler').trim();
    const is_active = data.is_active ? 1 : 0;
    const type = String(data.type || 'service').trim();
    const duration_days = data.duration_days === '' || data.duration_days == null
        ? null
        : Number(data.duration_days);
    const access_content_url = data.access_content_url || data.accessContentUrl || data.content_url || null;
    const features = data.features ?? null;
    const productId = Number(req.params.id);

    if (!productId) {
        return res.status(400).json({ error: 'Geçersiz ürün id.' });
    }
    if (!name) {
        return res.status(400).json({ error: 'Ürün adı zorunludur.' });
    }
    if (!Number.isFinite(price)) {
        return res.status(400).json({ error: 'Geçerli bir fiyat girin.' });
    }
    if (duration_days !== null && !Number.isFinite(duration_days)) {
        return res.status(400).json({ error: 'Geçerli bir süre (gün) girin.' });
    }

    try {
        await db.query(
            `UPDATE products SET 
            name=?, description=?, price=?, currency=?, category=?, is_active=?,
            type=?, duration_days=?, access_content_url=?, features=?
            WHERE id=?`,
            [name, description, price, currency, category, is_active, type, duration_days, access_content_url, features, productId]
        );
        clearCache();
        res.json({ message: 'Ürün güncellendi.' });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ error: 'Ürün güncellenemedi.' });
    }
});

// DELETE /api/admin/products/:id - Delete product
router.delete('/products/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM products WHERE id = ?', [req.params.id]);
        clearCache();
        res.json({ message: 'Ürün silindi.' });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// --- USER MANAGEMENT ---

// GET /api/admin/users - List users with purchase summary
router.get('/users', async (req, res) => {
    try {
        const [users] = await db.query(
            `SELECT
                u.id,
                u.email,
                u.first_name,
                u.last_name,
                u.phone,
                u.role,
                u.must_change_password,
                u.created_at,
                COUNT(DISTINCT o.id) AS total_orders,
                COALESCE(SUM(CASE WHEN o.status = 'completed' THEN o.total_amount ELSE 0 END), 0) AS total_spent,
                MAX(CASE WHEN o.status = 'completed' THEN o.created_at ELSE NULL END) AS last_purchase_at
            FROM users u
            LEFT JOIN orders o ON o.user_id = u.id
            GROUP BY u.id
            ORDER BY u.created_at DESC`
        );

        const [purchases] = await db.query(
            `SELECT
                o.user_id,
                p.id AS product_id,
                p.name AS product_name,
                p.product_key,
                MAX(o.created_at) AS purchased_at,
                COUNT(*) AS purchase_count
            FROM orders o
            INNER JOIN order_items oi ON oi.order_id = o.id
            INNER JOIN products p ON p.id = oi.product_id
            WHERE o.status = 'completed'
            GROUP BY o.user_id, p.id, p.name, p.product_key
            ORDER BY purchased_at DESC`
        );

        const purchasesByUser = purchases.reduce((acc, row) => {
            if (!acc[row.user_id]) acc[row.user_id] = [];
            acc[row.user_id].push({
                product_id: row.product_id,
                product_name: row.product_name,
                product_key: row.product_key,
                purchased_at: row.purchased_at,
                purchase_count: Number(row.purchase_count)
            });
            return acc;
        }, {});

        const result = users.map((user) => ({
            ...user,
            total_orders: Number(user.total_orders || 0),
            total_spent: Number(user.total_spent || 0),
            purchased_products: purchasesByUser[user.id] || []
        }));

        res.json(result);
    } catch (error) {
        console.error('Admin get users error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/admin/users - Create user/admin
router.post('/users', async (req, res) => {
    try {
        const email = String(req.body.email || '').trim().toLowerCase();
        const password = String(req.body.password || '');
        const first_name = String(req.body.first_name || '').trim();
        const last_name = String(req.body.last_name || '').trim();
        const phone = String(req.body.phone || '').trim();
        const roleRaw = String(req.body.role || 'user').trim().toLowerCase();
        const role = ['user', 'admin', 'editor'].includes(roleRaw) ? roleRaw : 'user';
        const must_change_password = req.body.must_change_password ? 1 : 0;

        if (!email || !email.includes('@') || password.length < 6 || !first_name || !last_name) {
            return res.status(400).json({ error: 'Geçerli e-posta, ad, soyad ve en az 6 karakter şifre zorunludur.' });
        }

        const [exists] = await db.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
        if (exists.length > 0) {
            return res.status(400).json({ error: 'Bu e-posta zaten kayıtlı.' });
        }

        const password_hash = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            `INSERT INTO users (email, password_hash, first_name, last_name, phone, role, must_change_password)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [email, password_hash, first_name, last_name, phone || null, role, must_change_password]
        );

        res.status(201).json({
            message: 'Kullanıcı oluşturuldu.',
            user: {
                id: Number(result.insertId),
                email,
                first_name,
                last_name,
                phone: phone || null,
                role,
                must_change_password: Boolean(must_change_password)
            }
        });
    } catch (error) {
        console.error('Admin create user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /api/admin/users/:id - Update user
router.put('/users/:id', async (req, res) => {
    try {
        const userId = Number(req.params.id);
        if (!userId) {
            return res.status(400).json({ error: 'Geçersiz kullanıcı id.' });
        }

        const email = String(req.body.email || '').trim().toLowerCase();
        const password = String(req.body.password || '');
        const first_name = String(req.body.first_name || '').trim();
        const last_name = String(req.body.last_name || '').trim();
        const phone = String(req.body.phone || '').trim();
        const roleRaw = String(req.body.role || 'user').trim().toLowerCase();
        const role = ['user', 'admin', 'editor'].includes(roleRaw) ? roleRaw : 'user';
        const must_change_password = req.body.must_change_password ? 1 : 0;

        if (!email || !email.includes('@') || !first_name || !last_name) {
            return res.status(400).json({ error: 'Geçerli e-posta, ad ve soyad zorunludur.' });
        }
        if (password && password.length < 6) {
            return res.status(400).json({ error: 'Yeni şifre en az 6 karakter olmalıdır.' });
        }

        const [existingRows] = await db.query('SELECT id, role FROM users WHERE id = ? LIMIT 1', [userId]);
        if (existingRows.length === 0) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
        }
        const existing = existingRows[0];

        const [dup] = await db.query('SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1', [email, userId]);
        if (dup.length > 0) {
            return res.status(400).json({ error: 'Bu e-posta başka bir kullanıcı tarafından kullanılıyor.' });
        }

        if (existing.role === 'admin' && role !== 'admin') {
            const [[adminCount]] = await db.query("SELECT COUNT(*) AS c FROM users WHERE role = 'admin'");
            if (Number(adminCount.c || 0) <= 1) {
                return res.status(400).json({ error: 'Sistemde en az bir admin kullanıcı bulunmalıdır.' });
            }
        }

        const fields = [
            'email = ?',
            'first_name = ?',
            'last_name = ?',
            'phone = ?',
            'role = ?',
            'must_change_password = ?'
        ];
        const params = [email, first_name, last_name, phone || null, role, must_change_password];

        if (password) {
            const password_hash = await bcrypt.hash(password, 10);
            fields.push('password_hash = ?');
            params.push(password_hash);
        }

        params.push(userId);
        await db.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params);
        res.json({ message: 'Kullanıcı güncellendi.' });
    } catch (error) {
        console.error('Admin update user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE /api/admin/users/:id - Delete user
router.delete('/users/:id', async (req, res) => {
    try {
        const userId = Number(req.params.id);
        if (!userId) {
            return res.status(400).json({ error: 'Geçersiz kullanıcı id.' });
        }
        if (userId === Number(req.user.id)) {
            return res.status(400).json({ error: 'Kendi admin hesabınızı silemezsiniz.' });
        }

        const [existingRows] = await db.query('SELECT id, role FROM users WHERE id = ? LIMIT 1', [userId]);
        if (existingRows.length === 0) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
        }
        const existing = existingRows[0];

        if (existing.role === 'admin') {
            const [[adminCount]] = await db.query("SELECT COUNT(*) AS c FROM users WHERE role = 'admin'");
            if (Number(adminCount.c || 0) <= 1) {
                return res.status(400).json({ error: 'Son admin kullanıcı silinemez.' });
            }
        }

        await db.query('DELETE FROM users WHERE id = ?', [userId]);
        res.json({ message: 'Kullanıcı silindi.' });
    } catch (error) {
        console.error('Admin delete user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/admin/users/:id/orders - Detailed order history for one user
router.get('/users/:id/orders', async (req, res) => {
    try {
        const userId = Number(req.params.id);
        if (!userId) {
            return res.status(400).json({ error: 'Invalid user id' });
        }

        const [orders] = await db.query(
            `SELECT
                o.id,
                o.order_number,
                o.total_amount,
                o.currency,
                o.status,
                o.created_at
            FROM orders o
            WHERE o.user_id = ?
            ORDER BY o.created_at DESC`,
            [userId]
        );

        const [items] = await db.query(
            `SELECT
                oi.order_id,
                oi.quantity,
                oi.unit_price,
                oi.total_price,
                p.id AS product_id,
                p.name AS product_name,
                p.product_key
            FROM order_items oi
            INNER JOIN products p ON p.id = oi.product_id
            INNER JOIN orders o ON o.id = oi.order_id
            WHERE o.user_id = ?
            ORDER BY oi.id ASC`,
            [userId]
        );

        const itemsByOrder = items.reduce((acc, item) => {
            if (!acc[item.order_id]) acc[item.order_id] = [];
            acc[item.order_id].push(item);
            return acc;
        }, {});

        const result = orders.map((order) => ({
            ...order,
            total_amount: Number(order.total_amount || 0),
            items: itemsByOrder[order.id] || []
        }));

        res.json(result);
    } catch (error) {
        console.error('Admin get user orders error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ─── CONSULTANT ADMIN ROUTES ─────────────────────────────────────────────────

// GET /api/admin/consultants
router.get('/consultants', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM consultants ORDER BY id DESC');
        res.json({ consultants: rows });
    } catch (err) {
        console.error('Admin get consultants error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/admin/consultants
router.post('/consultants', authMiddleware, adminMiddleware, async (req, res) => {
    const { slug, name, title, bio, photo_url, stars, review_count, sectors } = req.body;
    if (!slug || !name) return res.status(400).json({ error: 'slug and name required' });
    try {
        const [result] = await db.query(
            `INSERT INTO consultants (slug, name, title, bio, photo_url, stars, review_count, sectors, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [slug, name, title || null, bio || null, photo_url || null,
             stars ?? 5.0, review_count ?? 0, JSON.stringify(sectors || [])]
        );
        clearCache();
        res.json({ id: result.insertId });
    } catch (err) {
        console.error('Admin create consultant error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /api/admin/consultants/:id
router.put('/consultants/:id', authMiddleware, adminMiddleware, async (req, res) => {
    const { slug, name, title, bio, photo_url, stars, review_count, sectors, is_active } = req.body;
    try {
        await db.query(
            `UPDATE consultants SET slug=?, name=?, title=?, bio=?, photo_url=?, stars=?, review_count=?, sectors=?, is_active=? WHERE id=?`,
            [slug, name, title || null, bio || null, photo_url || null,
             stars ?? 5.0, review_count ?? 0, JSON.stringify(sectors || []),
              is_active !== undefined ? is_active : 1, req.params.id]
        );
        clearCache();
        res.json({ success: true });
    } catch (err) {
        console.error('Admin update consultant error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE /api/admin/consultants/:id (soft delete)
router.delete('/consultants/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        await db.query('UPDATE consultants SET is_active=0 WHERE id=?', [req.params.id]);
        clearCache();
        res.json({ success: true });
    } catch (err) {
        console.error('Admin delete consultant error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/admin/consultants/:id/services
router.get('/consultants/:id/services', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM consultant_services WHERE consultant_id=? ORDER BY sort_order ASC',
            [req.params.id]
        );
        res.json({ services: rows });
    } catch (err) {
        console.error('Admin get services error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/admin/consultants/:id/services
router.post('/consultants/:id/services', authMiddleware, adminMiddleware, async (req, res) => {
    const { category, parent_service_id, title, title_en, description, description_en,
            scope_items, scope_items_en, duration_text, sessions_text, price, currency,
            plus_vat, cta_text, cta_text_en, badge_text, sort_order } = req.body;
    try {
        const [result] = await db.query(
            `INSERT INTO consultant_services
             (consultant_id, category, parent_service_id, title, title_en, description, description_en,
              scope_items, scope_items_en, duration_text, sessions_text, price, currency, plus_vat,
              cta_text, cta_text_en, badge_text, sort_order)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [req.params.id, category, parent_service_id || null, title, title_en || null,
             description || null, description_en || null,
             scope_items ? JSON.stringify(scope_items) : null,
             scope_items_en ? JSON.stringify(scope_items_en) : null,
             duration_text || null, sessions_text || null,
             price ?? 0, currency || 'TRY', plus_vat ? 1 : 0,
             cta_text || null, cta_text_en || null, badge_text || null, sort_order ?? 0]
        );
        clearCache();
        res.json({ id: result.insertId });
    } catch (err) {
        console.error('Admin create service error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /api/admin/consultant-services/:id
router.put('/consultant-services/:id', authMiddleware, adminMiddleware, async (req, res) => {
    const { title, title_en, description, description_en, scope_items, scope_items_en,
            duration_text, sessions_text, price, currency, plus_vat,
            cta_text, cta_text_en, badge_text, sort_order, is_active } = req.body;
    try {
        await db.query(
            `UPDATE consultant_services SET title=?, title_en=?, description=?, description_en=?,
             scope_items=?, scope_items_en=?, duration_text=?, sessions_text=?,
             price=?, currency=?, plus_vat=?, cta_text=?, cta_text_en=?, badge_text=?,
             sort_order=?, is_active=? WHERE id=?`,
            [title, title_en || null, description || null, description_en || null,
             scope_items ? JSON.stringify(scope_items) : null,
             scope_items_en ? JSON.stringify(scope_items_en) : null,
             duration_text || null, sessions_text || null,
             price ?? 0, currency || 'TRY', plus_vat ? 1 : 0,
             cta_text || null, cta_text_en || null, badge_text || null,
             sort_order ?? 0, is_active !== undefined ? is_active : 1, req.params.id]
        );
        clearCache();
        res.json({ success: true });
    } catch (err) {
        console.error('Admin update service error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE /api/admin/consultant-services/:id
router.delete('/consultant-services/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        await db.query('DELETE FROM consultant_services WHERE id=?', [req.params.id]);
        clearCache();
        res.json({ success: true });
    } catch (err) {
        console.error('Admin delete service error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/admin/consultants/:id/availability
router.get('/consultants/:id/availability', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM consultant_availability WHERE consultant_id=? ORDER BY available_date, start_time',
            [req.params.id]
        );
        res.json({ slots: rows });
    } catch (err) {
        console.error('Admin get availability error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/admin/consultants/:id/availability
router.post('/consultants/:id/availability', authMiddleware, adminMiddleware, async (req, res) => {
    const { slots } = req.body; // array of { available_date, start_time, end_time, service_id }
    const consultantId = req.params.id;
    if (!slots || !slots.length) return res.status(400).json({ error: 'slots array required' });
    try {
        const values = slots.map(s => [consultantId, s.service_id || null, s.available_date, s.start_time, s.end_time]);
        await db.query(
            'INSERT INTO consultant_availability (consultant_id, service_id, available_date, start_time, end_time) VALUES ?',
            [values]
        );
        res.json({ success: true, count: slots.length });
    } catch (err) {
        console.error('Admin create availability error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE /api/admin/availability/:id
router.delete('/availability/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        await db.query('DELETE FROM consultant_availability WHERE id=?', [req.params.id]);
        clearCache();
        res.json({ success: true });
    } catch (err) {
        console.error('Admin delete availability error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// PATCH /api/admin/availability/:id
router.patch('/availability/:id', authMiddleware, adminMiddleware, async (req, res) => {
    const { status } = req.body;
    try {
        await db.query('UPDATE consultant_availability SET status=? WHERE id=?', [status || 'available', req.params.id]);
        clearCache();
        res.json({ success: true });
    } catch (err) {
        console.error('Admin update availability error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/admin/bookings — tüm rezervasyonlar
router.get('/bookings', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { status, consultant_id } = req.query;
        let query = `SELECT cb.*, c.name as consultant_name, cs.title as service_title
                     FROM consultant_bookings cb
                     JOIN consultants c ON cb.consultant_id = c.id
                     JOIN consultant_services cs ON cb.service_id = cs.id
                     WHERE 1=1`;
        const params = [];
        if (status) { query += ' AND cb.status=?'; params.push(status); }
        if (consultant_id) { query += ' AND cb.consultant_id=?'; params.push(consultant_id); }
        query += ' ORDER BY cb.created_at DESC';
        const [rows] = await db.query(query, params);
        res.json({ bookings: rows });
    } catch (err) {
        console.error('Admin get bookings error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// PATCH /api/admin/bookings/:id
router.patch('/bookings/:id', authMiddleware, adminMiddleware, async (req, res) => {
    const { status, meeting_link, admin_notes } = req.body;
    try {
        const fields = [];
        const params = [];
        if (status) { fields.push('status=?'); params.push(status); }
        if (meeting_link !== undefined) { fields.push('meeting_link=?'); params.push(meeting_link); }
        if (admin_notes !== undefined) { fields.push('admin_notes=?'); params.push(admin_notes); }
        if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });
        params.push(req.params.id);
        await db.query(`UPDATE consultant_bookings SET ${fields.join(', ')} WHERE id=?`, params);
        res.json({ success: true });
    } catch (err) {
        console.error('Admin update booking error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// DELETE /api/admin/bookings/:id
router.delete('/bookings/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM consultant_bookings WHERE id=?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Booking not found' });
        res.json({ success: true });
    } catch (err) {
        console.error('Admin delete booking error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
