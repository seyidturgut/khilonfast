import express from 'express';
import db from '../config/database.js';
import { getCurrentUsdTryRate } from '../services/currencyService.js';

const router = express.Router();

// POST /api/coupons/validate
router.post('/validate', async (req, res) => {
    const { code, items = [], guest_email } = req.body;

    if (!code) {
        return res.status(400).json({ error: 'Kupon kodu gerekli.' });
    }

    try {
        const [rows] = await db.query(
            'SELECT * FROM coupons WHERE code = ? LIMIT 1',
            [code.trim().toUpperCase()]
        );

        if (!rows.length) {
            return res.status(404).json({ error: 'Kupon bulunamadı.' });
        }

        const coupon = rows[0];

        if (!coupon.is_active) {
            return res.status(400).json({ error: 'Bu kupon artık aktif değil.' });
        }

        const now = new Date();
        if (coupon.starts_at && new Date(coupon.starts_at) > now) {
            return res.status(400).json({ error: 'Bu kupon henüz geçerli değil.' });
        }
        if (coupon.ends_at && new Date(coupon.ends_at) < now) {
            return res.status(400).json({ error: 'Bu kuponun süresi dolmuş.' });
        }

        if (coupon.total_usage_limit !== null && coupon.usage_count >= coupon.total_usage_limit) {
            return res.status(400).json({ error: 'Bu kuponun kullanım limiti dolmuş.' });
        }

        // Fetch product prices for submitted items
        // USD ürünler güncel kurla TRY'a çevrilir; coupon validation hep TRY üzerinden yapılır.
        let subtotal = 0;
        let currency = 'TRY';
        const usdTryRate = (await getCurrentUsdTryRate()).rate;

        if (items.length > 0) {
            const productIds = items.map(i => i.product_id).filter(Boolean);
            if (productIds.length > 0) {
                const placeholders = productIds.map(() => '?').join(',');
                const [products] = await db.query(
                    `SELECT id, price, currency, category FROM products WHERE id IN (${placeholders})`,
                    productIds
                );
                const priceMap = {};
                for (const p of products) {
                    priceMap[p.id] = p;
                }
                for (const item of items) {
                    const p = priceMap[item.product_id];
                    if (!p) continue;
                    const unitPriceTry = (p.currency === 'USD')
                        ? Number(p.price) * usdTryRate
                        : Number(p.price);
                    subtotal += unitPriceTry * (item.quantity || 1);
                }

                // Check restricted categories
                // MySQL JSON sütunu mysql2 driver tarafından zaten parse edilmiş array/obj olarak gelir.
                // String gelirse (legacy), JSON.parse'a düşer. Boş array `[]` truthy olduğu için
                // length kontrolüyle gate'liyoruz.
                {
                    const rawCats = coupon.restricted_categories_json;
                    const allowedCats = typeof rawCats === 'string'
                        ? (rawCats.trim() ? JSON.parse(rawCats) : [])
                        : (Array.isArray(rawCats) ? rawCats : []);
                    if (Array.isArray(allowedCats) && allowedCats.length > 0) {
                        const cartCats = products.map(p => p.category);
                        const hasMatch = cartCats.some(c => allowedCats.includes(c));
                        if (!hasMatch) {
                            return res.status(400).json({ error: 'Bu kupon sepetinizdeki ürünlere uygulanamaz.' });
                        }
                    }
                }

                // Check restricted products
                {
                    const rawIds = coupon.restricted_products_json;
                    const allowedIds = typeof rawIds === 'string'
                        ? (rawIds.trim() ? JSON.parse(rawIds) : [])
                        : (Array.isArray(rawIds) ? rawIds : []);
                    if (Array.isArray(allowedIds) && allowedIds.length > 0) {
                        const hasMatch = productIds.some(id => allowedIds.includes(id));
                        if (!hasMatch) {
                            return res.status(400).json({ error: 'Bu kupon sepetinizdeki ürünlere uygulanamaz.' });
                        }
                    }
                }
            }
        }

        if (coupon.minimum_cart_amount > 0 && subtotal < Number(coupon.minimum_cart_amount)) {
            return res.status(400).json({
                error: `Bu kupon için minimum sepet tutarı ${coupon.minimum_cart_amount} ${currency}.`
            });
        }

        // Calculate discount
        let discount = 0;
        if (coupon.discount_type === 'percentage') {
            discount = (subtotal * Number(coupon.discount_value)) / 100;
            if (coupon.maximum_discount_amount !== null) {
                discount = Math.min(discount, Number(coupon.maximum_discount_amount));
            }
        } else {
            discount = Math.min(Number(coupon.discount_value), subtotal);
        }

        discount = Math.round(discount * 100) / 100;
        // Floating-point gürültüsünü engellemek için subtotal-discount sonucunu da yuvarla
        const total = Math.max(0, Math.round((subtotal - discount) * 100) / 100);

        return res.json({
            valid: true,
            pricing: {
                subtotal,
                discount,
                shipping: 0,
                tax: 0,
                total,
                currency,
                applied_coupon: {
                    id: coupon.id,
                    code: coupon.code,
                    name: coupon.name,
                    discount_type: coupon.discount_type,
                    discount_value: Number(coupon.discount_value),
                    maximum_discount_amount: coupon.maximum_discount_amount
                        ? Number(coupon.maximum_discount_amount)
                        : null
                }
            }
        });
    } catch (err) {
        console.error('Coupon validate error:', err);
        return res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

export default router;
