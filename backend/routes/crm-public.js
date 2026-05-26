// backend/routes/crm-public.js — public CRM endpoints (Brevo webhook etc.)
import express from 'express';
import crypto from 'crypto';
import db from '../config/database.js';

const router = express.Router();

// Inline scoring engine (subset — sadece webhook için yeterli)
let _scoreRulesCache = null;
async function getScoreRules() {
    if (_scoreRulesCache) return _scoreRulesCache;
    try {
        const [rows] = await db.query('SELECT * FROM crm_score_rules WHERE is_active = 1');
        _scoreRulesCache = {};
        for (const r of rows) {
            _scoreRulesCache[r.event_type] = {
                id: Number(r.id), rule_key: r.rule_key, label: r.label,
                points: Number(r.points)
            };
        }
    } catch { _scoreRulesCache = {}; }
    return _scoreRulesCache;
}

async function applyScore(contactId, eventType, opts = {}) {
    if (!contactId || !eventType) return null;
    const rules = await getScoreRules();
    const rule = rules[eventType];
    if (!rule) return null;
    const delta = rule.points;
    if (delta === 0) return 0;
    await db.query('UPDATE crm_contacts SET score = score + ? WHERE id = ?', [delta, contactId]);
    const [[{ score }]] = await db.query('SELECT score FROM crm_contacts WHERE id = ?', [contactId]);
    try {
        await db.query(
            `INSERT INTO crm_score_history (contact_id, rule_id, rule_key, delta, score_after, reason, ref_type, ref_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [contactId, rule.id, rule.rule_key, delta, Number(score), opts.reason || rule.label, opts.ref_type || null, opts.ref_id || null]
        );
    } catch (e) { console.warn('[crm-score] history:', e.message); }
    return delta;
}

async function recordActivity(contactId, type, title, opts = {}) {
    if (!contactId) return;
    const refType = opts.ref_type || null;
    const refId = opts.ref_id != null ? Number(opts.ref_id) : null;
    if (refType && refId) {
        const [exists] = await db.query(
            'SELECT id FROM crm_activity_log WHERE contact_id = ? AND type = ? AND ref_type = ? AND ref_id = ? LIMIT 1',
            [contactId, type, refType, refId]
        );
        if (exists.length) return;
    }
    const meta = opts.metadata ? JSON.stringify(opts.metadata) : null;
    const occurredAt = opts.occurred_at || new Date();
    try {
        await db.query(
            `INSERT INTO crm_activity_log (contact_id, type, title, ref_type, ref_id, metadata, occurred_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [contactId, type, title, refType, refId, meta, occurredAt]
        );
        await db.query(
            'UPDATE crm_contacts SET last_activity_at = ? WHERE id = ? AND (last_activity_at IS NULL OR last_activity_at < ?)',
            [occurredAt, contactId, occurredAt]
        );
    } catch (e) { console.warn('[crm-act] record:', e.message); }
}

async function findOrCreateContactByEmail(email) {
    const e = String(email).toLowerCase().trim();
    if (!e) return null;
    const [rows] = await db.query('SELECT id FROM crm_contacts WHERE email = ? LIMIT 1', [e]);
    if (rows.length) return Number(rows[0].id);
    try {
        const [r] = await db.query(
            "INSERT IGNORE INTO crm_contacts (email, source, status) VALUES (?, 'webhook', 'subscribed')",
            [e]
        );
        if (r.insertId) return r.insertId;
    } catch {}
    const [retry] = await db.query('SELECT id FROM crm_contacts WHERE email = ? LIMIT 1', [e]);
    return retry.length ? Number(retry[0].id) : null;
}

router.post('/webhook/brevo', express.raw({ type: '*/*' }), async (req, res) => {
    let rawBody = req.body;
    if (Buffer.isBuffer(rawBody)) rawBody = rawBody.toString('utf8');
    if (!rawBody) rawBody = '';

    // Signature check
    try {
        const [secretRow] = await db.query("SELECT setting_value FROM settings WHERE setting_key = 'brevo_webhook_secret' LIMIT 1");
        const secret = secretRow[0]?.setting_value || '';
        if (secret) {
            const sig = req.headers['x-brevo-signature'] || req.headers['x-signature'] || '';
            const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
            if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(String(sig)))) {
                return res.status(401).json({ error: 'Invalid signature' });
            }
        }
    } catch {}

    let payload;
    try { payload = JSON.parse(rawBody); } catch { payload = null; }
    const events = payload && payload.event ? [payload] : (Array.isArray(payload) ? payload : []);
    if (!events.length) return res.json({ ok: true, processed: 0 });

    let processed = 0;
    for (const e of events) {
        const event = String(e.event || e.type || '').toLowerCase();
        const email = String(e.email || '').toLowerCase().trim();
        if (!email || !event || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) continue;

        let normalized = event;
        if (event.includes('open')) normalized = 'opened';
        else if (event.includes('click')) normalized = 'clicked';
        else if (event.includes('hard_bounce')) normalized = 'hard_bounce';
        else if (event.includes('soft_bounce')) normalized = 'soft_bounce';
        else if (event.includes('bounce')) normalized = 'bounced';
        else if (event.includes('spam') || event.includes('complaint')) normalized = 'complaint';
        else if (event.includes('unsubscribe')) normalized = 'unsubscribed';
        else if (event.includes('deliver')) normalized = 'delivered';
        else if (event.includes('block')) normalized = 'blocked';

        const contactId = await findOrCreateContactByEmail(email);
        const occurredAt = e.date ? new Date(e.date) : new Date();

        try {
            await db.query(
                `INSERT INTO crm_email_tracking
                 (contact_id, email, event, message_id, link_url, reason, ip, user_agent, provider, raw_payload, occurred_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'brevo', ?, ?)`,
                [
                    contactId, email, normalized,
                    String(e['message-id'] || e.messageId || '') || null,
                    String(e.link || e.url || '') || null,
                    String(e.reason || '') || null,
                    String(e.ip || '') || null,
                    String(e.user_agent || e.ua || '').slice(0, 500) || null,
                    JSON.stringify(e),
                    occurredAt
                ]
            );
        } catch (err) { console.warn('[brevo-webhook] insert:', err.message); }

        if (contactId) {
            try {
                if (['hard_bounce', 'bounced'].includes(normalized)) {
                    await db.query("UPDATE crm_contacts SET status = 'bounced' WHERE id = ?", [contactId]);
                } else if (normalized === 'complaint' || normalized === 'spam') {
                    await db.query("UPDATE crm_contacts SET status = 'complained' WHERE id = ?", [contactId]);
                } else if (normalized === 'unsubscribed') {
                    await db.query("UPDATE crm_contacts SET status = 'unsubscribed' WHERE id = ?", [contactId]);
                }
            } catch {}

            const titleMap = {
                opened: 'E-posta açıldı', clicked: 'E-posta linkine tıkladı',
                bounced: 'Bounce', hard_bounce: 'Bounce (hard)', soft_bounce: 'Bounce (soft)',
                complaint: 'Spam şikayeti', spam: 'Spam şikayeti',
                unsubscribed: 'Listeden çıkış', delivered: 'E-posta teslim'
            };
            const typeMap = {
                opened: 'email_opened', clicked: 'email_clicked',
                bounced: 'email_bounced', hard_bounce: 'email_bounced', soft_bounce: 'email_bounced',
                complaint: 'email_spam', spam: 'email_spam',
                unsubscribed: 'email_unsubscribed', delivered: 'email_delivered'
            };
            const t = typeMap[normalized] || `email_${normalized}`;
            const title = titleMap[normalized] || `E-posta olayı: ${normalized}`;
            await recordActivity(contactId, t, title, {
                ref_type: 'email_tracking',
                metadata: { event: normalized, link: e.link, message_id: e['message-id'] }
            });
            await applyScore(contactId, t, { reason: title, ref_type: 'email_tracking' });
        }
        processed++;
    }

    res.json({ ok: true, processed });
});

// ─── Faz 5: Track + Smart links ───────────────────────────────────────────────
async function handleTrack(req, res, isImage = false) {
    const data = req.method === 'POST' ? (req.body || {}) : req.query;
    const url = String(data.url || '');
    const title = String(data.title || '').slice(0, 240);
    const referrer = String(data.referrer || req.headers.referer || '');
    const anonId = String(data.anon_id || data.anonymous_id || '').replace(/[^a-zA-Z0-9_-]/g, '');
    const sessionId = String(data.session_id || '').replace(/[^a-zA-Z0-9_-]/g, '');
    const email = String(data.email || '').toLowerCase().trim();
    const duration = data.duration != null ? Number(data.duration) : null;
    const customData = data.data && typeof data.data === 'object' ? JSON.stringify(data.data) : null;

    let path = '';
    const utm = { utm_source: null, utm_medium: null, utm_campaign: null, utm_term: null, utm_content: null };
    try {
        if (url) {
            const u = new URL(url);
            path = u.pathname;
            for (const k of Object.keys(utm)) {
                if (u.searchParams.has(k)) utm[k] = u.searchParams.get(k).slice(0, 120);
            }
        }
    } catch {}

    let contactId = null;
    if (email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        contactId = await findOrCreateContactByEmail(email);
    }

    if (url) {
        try {
            await db.query(
                `INSERT INTO crm_web_visits
                 (contact_id, anonymous_id, session_id, url, path, title, referrer,
                  utm_source, utm_medium, utm_campaign, utm_term, utm_content,
                  ip, user_agent, duration_seconds, custom_data)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    contactId, anonId || null, sessionId || null,
                    url.slice(0, 1024), path.slice(0, 255), title || null, referrer.slice(0, 1024) || null,
                    utm.utm_source, utm.utm_medium, utm.utm_campaign, utm.utm_term, utm.utm_content,
                    req.ip, String(req.headers['user-agent'] || '').slice(0, 500),
                    duration, customData
                ]
            );
            if (contactId) {
                await recordActivity(contactId, 'web_page_visited', 'Sayfa ziyaret: ' + (title || path), {
                    metadata: { url, path, utm }
                });
                await applyScore(contactId, 'web_page_visited', { reason: 'Sayfa ziyaret: ' + (title || path) });
            }
        } catch (e) { console.warn('[crm-track]:', e.message); }
    }

    if (isImage) {
        res.set('Content-Type', 'image/gif');
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
        return res.send(Buffer.from('R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==', 'base64'));
    }
    res.json({ ok: true, contact_id: contactId });
}

router.post('/track', express.json(), (req, res) => handleTrack(req, res, false));
router.get('/track/pixel.gif', (req, res) => handleTrack(req, res, true));

router.get('/track.js', (req, res) => {
    res.set('Content-Type', 'application/javascript; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=3600');
    const apiBase = (process.env.API_PUBLIC_URL || `${req.protocol}://${req.get('host')}/api`).replace(/\/+$/, '');
    res.send(`(function(){
  var endpoint = '${apiBase}/crm-public/track';
  var STORAGE_KEY = '_khc_anon';
  function getAnon(){
    try { var v = localStorage.getItem(STORAGE_KEY); if (v) return v; } catch(e){}
    var id = 'a_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    try { localStorage.setItem(STORAGE_KEY, id); } catch(e){}
    return id;
  }
  function send(payload){
    try {
      var data = JSON.stringify(payload);
      if (navigator.sendBeacon) {
        var blob = new Blob([data], { type: 'application/json' });
        navigator.sendBeacon(endpoint, blob);
      } else {
        fetch(endpoint, { method: 'POST', headers: {'Content-Type':'application/json'}, body: data, keepalive: true }).catch(function(){});
      }
    } catch(e){}
  }
  window.khilonCRM = {
    page: function(extra){
      var anon = getAnon();
      send(Object.assign({ url: location.href, path: location.pathname, title: document.title, referrer: document.referrer, anon_id: anon }, extra || {}));
    },
    identify: function(email, extra){
      var anon = getAnon();
      send(Object.assign({ url: location.href, anon_id: anon, email: email }, extra || {}));
    }
  };
  if (document.readyState !== 'loading') window.khilonCRM.page();
  else document.addEventListener('DOMContentLoaded', function(){ window.khilonCRM.page(); });
})();`);
});

router.get('/l/:slug', async (req, res) => {
    const slug = String(req.params.slug).replace(/[^a-zA-Z0-9_-]/g, '');
    if (!slug) return res.status(404).send('Not found');
    const [rows] = await db.query('SELECT * FROM crm_smart_links WHERE slug = ? AND is_active = 1 LIMIT 1', [slug]);
    if (!rows.length) return res.status(404).send('Link bulunamadı.');
    const link = rows[0];
    if (link.expires_at && new Date(link.expires_at).getTime() < Date.now()) {
        return res.status(410).send('Link süresi dolmuş.');
    }
    const contactQ = String(req.query.c || req.query.contact || '');
    const contactId = /^\d+$/.test(contactQ) ? Number(contactQ) : null;
    const anonId = String(req.query.anon || '').replace(/[^a-zA-Z0-9_-]/g, '');

    try {
        await db.query(
            `INSERT INTO crm_smart_link_clicks (link_id, contact_id, anonymous_id, ip, user_agent, referrer)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [Number(link.id), contactId, anonId || null, req.ip,
             String(req.headers['user-agent'] || '').slice(0, 500),
             String(req.headers.referer || '').slice(0, 1024) || null]
        );
        await db.query('UPDATE crm_smart_links SET click_count = click_count + 1 WHERE id = ?', [Number(link.id)]);
        if (contactId) {
            await recordActivity(contactId, 'smart_link_clicked', 'Smart link tıklandı: ' + (link.label || slug), {
                ref_type: 'smart_link', ref_id: Number(link.id),
                metadata: { slug, target: link.target_url }
            });
            await applyScore(contactId, 'email_clicked', {
                reason: 'Smart link tıklandı', ref_type: 'smart_link', ref_id: Number(link.id)
            });
        }
    } catch (e) { console.warn('[smart-link] click:', e.message); }

    res.redirect(302, link.target_url);
});

// ─── Faz 7: Forms (public) ────────────────────────────────────────────────────
router.get('/form/:slug', async (req, res) => {
    try {
        const slug = String(req.params.slug).replace(/[^a-zA-Z0-9_-]/g, '');
        const [rows] = await db.query(
            `SELECT id, slug, name, description, fields_json, success_message, success_redirect,
                    double_opt_in, opt_in_redirect, is_active
             FROM crm_forms WHERE slug = ? AND is_active = 1 LIMIT 1`,
            [slug]
        );
        if (!rows.length) return res.status(404).json({ error: 'Form not found' });
        const f = rows[0];
        const fields = f.fields_json ? (typeof f.fields_json === 'string' ? JSON.parse(f.fields_json) : f.fields_json) : [];
        res.json({
            id: Number(f.id), slug: f.slug, name: f.name, description: f.description,
            fields, success_message: f.success_message, success_redirect: f.success_redirect,
            double_opt_in: Number(f.double_opt_in) === 1,
            opt_in_redirect: f.opt_in_redirect
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/form/:slug/submit', express.json(), async (req, res) => {
    try {
        const slug = String(req.params.slug).replace(/[^a-zA-Z0-9_-]/g, '');
        const [forms] = await db.query('SELECT * FROM crm_forms WHERE slug = ? AND is_active = 1 LIMIT 1', [slug]);
        if (!forms.length) return res.status(404).json({ error: 'Form not found' });
        const form = forms[0];

        const data = req.body || {};
        const email = String(data.email || '').toLowerCase().trim();
        if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
            return res.status(400).json({ error: 'Geçerli e-posta zorunlu' });
        }
        if (data.website || data._gotcha) return res.json({ ok: true, spam: true });

        const fields = form.fields_json ? (typeof form.fields_json === 'string' ? JSON.parse(form.fields_json) : form.fields_json) : [];
        const cleaned = { email };
        for (const f of fields) {
            const k = String(f.key || '');
            if (!k || k === 'email') continue;
            const v = data[k];
            if (f.required && (v == null || v === '')) {
                return res.status(400).json({ error: `${k} zorunlu` });
            }
            cleaned[k] = v;
        }

        const doubleOptIn = Number(form.double_opt_in) === 1;
        const token = require('crypto').randomBytes(24).toString('hex');
        let contactId = await findOrCreateContactByEmail(email);

        if (!doubleOptIn && contactId) {
            // Direkt subscribed yap
            await db.query("UPDATE crm_contacts SET status = 'subscribed' WHERE id = ?", [contactId]);
        }

        const [insRes] = await db.query(
            `INSERT INTO crm_form_submissions
             (form_id, contact_id, email, data_json, status, opt_in_token, confirmed_at, ip, user_agent, referrer)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                Number(form.id), contactId, email,
                JSON.stringify(cleaned),
                doubleOptIn ? 'pending_optin' : 'confirmed',
                doubleOptIn ? token : null,
                doubleOptIn ? null : new Date(),
                req.ip,
                String(req.headers['user-agent'] || '').slice(0, 500),
                String(req.headers.referer || '').slice(0, 1024) || null
            ]
        );
        const submissionId = insRes.insertId;

        // Actions
        if (!doubleOptIn && contactId) {
            const actions = form.actions_json ? (typeof form.actions_json === 'string' ? JSON.parse(form.actions_json) : form.actions_json) : [];
            for (const a of actions) {
                try {
                    if (a.type === 'add_tag' && a.tag_slug) {
                        const [t] = await db.query('SELECT id FROM crm_tags WHERE slug = ? LIMIT 1', [a.tag_slug]);
                        if (t.length) await db.query('INSERT IGNORE INTO crm_contact_tags (contact_id, tag_id) VALUES (?, ?)', [contactId, t[0].id]);
                    } else if (a.type === 'add_to_list' && a.list_id) {
                        await db.query('INSERT IGNORE INTO crm_list_contacts (list_id, contact_id) VALUES (?, ?)', [Number(a.list_id), contactId]);
                    }
                } catch (e) { console.warn('[form-action]:', e.message); }
            }
            await recordActivity(contactId, 'form_submitted', 'Form: ' + form.name, {
                ref_type: 'form_submission', ref_id: submissionId,
                metadata: { form_slug: form.slug }
            });
            await applyScore(contactId, 'form_submitted', { reason: 'Form: ' + form.name });
        }

        await db.query('UPDATE crm_forms SET submission_count = submission_count + 1 WHERE id = ?', [Number(form.id)]);

        if (doubleOptIn) {
            return res.json({
                ok: true, pending_optin: true,
                message: 'Onay e-postası gönderildi. Kaydı tamamlamak için gelen kutunuzu kontrol edin.'
            });
        }
        res.json({
            ok: true, submission_id: submissionId,
            message: form.success_message || 'Teşekkürler, kaydınız alındı.',
            redirect: form.success_redirect
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/form/:slug/confirm', async (req, res) => {
    try {
        const slug = String(req.params.slug).replace(/[^a-zA-Z0-9_-]/g, '');
        const token = String(req.query.token || '').replace(/[^a-f0-9]/g, '');
        if (!slug || !token) return res.status(400).send('Geçersiz onay bağlantısı.');
        const [rows] = await db.query(
            `SELECT s.*, f.actions_json, f.name AS form_name, f.opt_in_redirect, f.success_message
             FROM crm_form_submissions s
             JOIN crm_forms f ON f.id = s.form_id
             WHERE f.slug = ? AND s.opt_in_token = ? AND s.status = 'pending_optin' LIMIT 1`,
            [slug, token]
        );
        if (!rows.length) return res.status(404).send('Bu onay bağlantısı geçersiz veya zaten kullanılmış.');
        const sub = rows[0];

        await db.query("UPDATE crm_form_submissions SET status = 'confirmed', confirmed_at = NOW(), opt_in_token = NULL WHERE id = ?", [Number(sub.id)]);
        const contactId = Number(sub.contact_id);
        if (contactId) {
            await db.query("UPDATE crm_contacts SET status = 'subscribed' WHERE id = ?", [contactId]);
            const actions = sub.actions_json ? (typeof sub.actions_json === 'string' ? JSON.parse(sub.actions_json) : sub.actions_json) : [];
            for (const a of actions) {
                try {
                    if (a.type === 'add_tag' && a.tag_slug) {
                        const [t] = await db.query('SELECT id FROM crm_tags WHERE slug = ? LIMIT 1', [a.tag_slug]);
                        if (t.length) await db.query('INSERT IGNORE INTO crm_contact_tags (contact_id, tag_id) VALUES (?, ?)', [contactId, t[0].id]);
                    } else if (a.type === 'add_to_list' && a.list_id) {
                        await db.query('INSERT IGNORE INTO crm_list_contacts (list_id, contact_id) VALUES (?, ?)', [Number(a.list_id), contactId]);
                    }
                } catch {}
            }
            await recordActivity(contactId, 'form_submitted', 'Form (onaylı): ' + sub.form_name, {
                ref_type: 'form_submission', ref_id: Number(sub.id),
                metadata: { double_opt_in_confirmed: true }
            });
            await applyScore(contactId, 'form_submitted', { reason: 'Form onaylandı: ' + sub.form_name });
        }

        if (sub.opt_in_redirect) return res.redirect(302, sub.opt_in_redirect);
        res.set('Content-Type', 'text/html; charset=utf-8');
        res.send(`<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Onaylandı</title>
<style>body{font-family:-apple-system,sans-serif;background:#f8fafc;margin:0;padding:60px 20px;text-align:center}.card{max-width:480px;margin:0 auto;background:white;padding:40px;border-radius:12px;box-shadow:0 4px 20px rgba(15,23,42,0.08)}h1{color:#16a34a;font-size:24px;margin:0 0 12px}p{color:#475569;line-height:1.5}</style></head><body><div class="card"><div style="font-size:48px;margin-bottom:14px">✓</div><h1>Kayıt onaylandı!</h1><p>${(sub.success_message || 'Teşekkürler, e-posta adresiniz başarıyla onaylandı.').replace(/[<>]/g, '')}</p></div></body></html>`);
    } catch (e) { res.status(500).send('Hata: ' + e.message); }
});

// ─── Faz 8: Unsubscribe ───────────────────────────────────────────────────────
router.get('/unsubscribe', async (req, res) => {
    try {
        const email = String(req.query.email || '').toLowerCase().trim();
        const token = String(req.query.token || '');
        const listId = Number(req.query.list_id || 0);
        if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !token) {
            return res.status(400).send('Geçersiz unsubscribe bağlantısı.');
        }

        const secret = process.env.JWT_SECRET || '';
        const expected = crypto.createHash('sha256').update(`${email}|unsub|${secret}`).digest('hex');
        if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token))) {
            return res.status(403).send('Geçersiz onay.');
        }

        const contactId = await findOrCreateContactByEmail(email);
        let msg = '';
        if (contactId) {
            if (listId > 0) {
                await db.query('DELETE FROM crm_list_contacts WHERE list_id = ? AND contact_id = ?', [listId, contactId]);
                msg = 'Bu listeden başarıyla çıkartıldınız.';
            } else {
                await db.query("UPDATE crm_contacts SET status = 'unsubscribed' WHERE id = ?", [contactId]);
                msg = 'Pazarlama listemizden çıkış işleminiz tamamlandı.';
            }
            await recordActivity(contactId, 'email_unsubscribed', 'Listeden çıkış (manuel)', {
                metadata: { list_id: listId, self_service: true }
            });
            await applyScore(contactId, 'email_unsubscribed', { reason: 'Manual unsubscribe' });
        } else {
            msg = 'E-posta adresimiz sistemimizde kayıtlı değil.';
        }

        res.set('Content-Type', 'text/html; charset=utf-8');
        res.send(`<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Çıkış tamamlandı</title>
<style>body{font-family:-apple-system,sans-serif;background:#f8fafc;margin:0;padding:60px 20px;text-align:center}.card{max-width:480px;margin:0 auto;background:white;padding:40px;border-radius:12px;box-shadow:0 4px 20px rgba(15,23,42,0.08)}h1{color:#0f172a;font-size:24px;margin:0 0 12px}p{color:#475569;line-height:1.5}</style></head><body><div class="card"><div style="font-size:48px;margin-bottom:14px">👋</div><h1>Çıkış işlemi tamamlandı</h1><p>${msg.replace(/[<>]/g, '')}</p></div></body></html>`);
    } catch (e) { res.status(500).send('Hata: ' + e.message); }
});

export default router;
