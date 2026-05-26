import express from 'express';
import db from '../config/database.js';
import cacheMiddleware from '../middleware/cache.js';
import { normalizeProductToTry, normalizeProductBothCurrencies } from '../services/currencyService.js';

const router = express.Router();

// Tüm ürün satırlarını TRY'a normalize et (USD ürünler ise güncel kurla çevirir)
async function normalizeProducts(products) {
    if (!Array.isArray(products) || products.length === 0) return products;
    return Promise.all(products.map((p) => normalizeProductBothCurrencies(p)));
}

// Get all products
router.get('/', cacheMiddleware(3600), async (req, res) => {
    try {
        const [products] = await db.query(
            'SELECT * FROM products WHERE is_active = TRUE ORDER BY category, id'
        );
        const normalized = await normalizeProducts(products);
        res.json({ products: normalized });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get product by ID
router.get('/:id', cacheMiddleware(3600), async (req, res) => {
    try {
        const [products] = await db.query('SELECT * FROM products WHERE id = ?', [req.params.id]);

        if (products.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const normalized = await normalizeProductBothCurrencies(products[0]);
        res.json({ product: normalized });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get product by key
router.get('/key/:key', cacheMiddleware(3600), async (req, res) => {
    try {
        const lang = req.query.lang === 'en' ? 'en' : 'tr';
        const key = req.params.key;
        const [products] = await db.query(
            'SELECT * FROM products WHERE product_key = ? OR slug = ? OR slug_en = ? LIMIT 1',
            [key, key, key]
        );

        if (products.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const product = products[0];
        const [packages] = await db.query(
            'SELECT * FROM products WHERE parent_id = ? AND is_active = TRUE ORDER BY price ASC',
            [product.id]
        );

        const localizeRow = (row) => {
            if (lang !== 'en') return row;
            return {
                ...row,
                name: row.name_en || row.name,
                description: row.description_en || row.description,
                features: row.features_en || row.features,
                slug: row.slug_en || row.slug,
                meta_title: row.meta_title_en || row.meta_title,
                meta_description: row.meta_description_en || row.meta_description,
                hero_vimeo_id: row.hero_vimeo_id_en || row.hero_vimeo_id,
                hero_image: row.hero_image_en || row.hero_image
            };
        };

        const localizedProduct = await normalizeProductBothCurrencies(localizeRow(product));
        localizedProduct.packages = await Promise.all(
            packages.map(async (p) => await normalizeProductBothCurrencies(localizeRow(p)))
        );

        res.json({ product: localizedProduct });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
