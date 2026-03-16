import express from 'express';
import db from '../config/database.js';
import cacheMiddleware from '../middleware/cache.js';

const router = express.Router();

function resolvePublicLocalizedContent(rawContent, lang) {
    if (!rawContent || typeof rawContent !== 'object') return null;

    const hasExplicitLocales = Object.prototype.hasOwnProperty.call(rawContent, 'tr')
        || Object.prototype.hasOwnProperty.call(rawContent, 'en');

    if (hasExplicitLocales) {
        return rawContent[lang] || (lang === 'tr' ? rawContent.tr || null : null);
    }

    return lang === 'tr' ? rawContent : null;
}

// Public: Get published page content by slug
router.get('/slug/:slug(*)', cacheMiddleware(3600), async (req, res) => {
    const slug = decodeURIComponent(req.params.slug || '');
    const lang = (req.query.lang || 'tr').toString().toLowerCase();

    try {
        const [pages] = await db.query('SELECT id, slug FROM cms_pages WHERE slug = ? LIMIT 1', [slug]);
        if (!pages.length) return res.status(404).json({ error: 'Page not found' });

        const pageId = pages[0].id;
        const [rows] = await db.query(
            'SELECT content_json FROM cms_page_contents WHERE page_id = ? AND is_published = 1 ORDER BY id DESC LIMIT 1',
            [pageId]
        );
        if (!rows.length) return res.json({ content: null });

        let content = null;
        const raw = rows[0].content_json;
        if (raw && typeof raw === 'object') {
            content = resolvePublicLocalizedContent(raw, lang);
        } else {
            try {
                const parsed = JSON.parse(raw);
                content = resolvePublicLocalizedContent(parsed, lang);
            } catch {
                content = null;
            }
        }

        res.json({ content });
    } catch (error) {
        console.error('Public get page content error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
