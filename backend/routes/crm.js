// backend/routes/crm.js — CRM admin endpoints (Faz 1: Contacts Foundation)
// Pattern: /api/crm/{action}
import express from 'express';
import db from '../config/database.js';
import authMiddleware from '../middleware/auth.js';
import adminMiddleware from '../middleware/admin.js';

const router = express.Router();

let crmSchemaReady = false;
async function ensureCrmSchema() {
    if (crmSchemaReady) return;
    await db.query(`CREATE TABLE IF NOT EXISTS crm_contacts (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        email VARCHAR(255) NOT NULL,
        first_name VARCHAR(120) NULL,
        last_name VARCHAR(120) NULL,
        phone VARCHAR(64) NULL,
        company VARCHAR(255) NULL,
        status ENUM('subscribed','unsubscribed','bounced','complained','pending') NOT NULL DEFAULT 'subscribed',
        source VARCHAR(64) NOT NULL DEFAULT 'manual',
        score INT NOT NULL DEFAULT 0,
        ltv DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        ltv_currency VARCHAR(8) NOT NULL DEFAULT 'TRY',
        unsubscribed_at DATETIME NULL DEFAULT NULL,
        unsubscribe_reason VARCHAR(60) NULL DEFAULT NULL,
        unsubscribe_detail TEXT NULL DEFAULT NULL,
        custom_fields JSON NULL,
        last_activity_at TIMESTAMP NULL DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_email (email),
        KEY idx_user_id (user_id),
        KEY idx_status (status),
        KEY idx_source (source),
        KEY idx_score (score),
        KEY idx_last_activity (last_activity_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    // Mevcut crm_contacts tablolarına unsubscribe kolonlarını idempotent ekle
    for (const [col, def] of [
        ['unsubscribed_at', 'DATETIME NULL DEFAULT NULL'],
        ['unsubscribe_reason', 'VARCHAR(60) NULL DEFAULT NULL'],
        ['unsubscribe_detail', 'TEXT NULL DEFAULT NULL'],
    ]) {
        try { await db.query(`ALTER TABLE crm_contacts ADD COLUMN ${col} ${def}`); } catch (e) { /* kolon zaten var */ }
    }

    await db.query(`CREATE TABLE IF NOT EXISTS crm_custom_fields (
        id INT AUTO_INCREMENT PRIMARY KEY,
        field_key VARCHAR(64) NOT NULL,
        label VARCHAR(255) NOT NULL,
        type ENUM('text','textarea','number','select','multi_select','date','checkbox') NOT NULL DEFAULT 'text',
        options_json JSON NULL,
        sort_order INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_field_key (field_key)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    // Faz 2: Tags + Lists
    await db.query(`CREATE TABLE IF NOT EXISTS crm_tags (
        id INT AUTO_INCREMENT PRIMARY KEY,
        slug VARCHAR(64) NOT NULL,
        name VARCHAR(120) NOT NULL,
        color VARCHAR(16) NOT NULL DEFAULT '#2563eb',
        description VARCHAR(255) NULL,
        contact_count INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_slug (slug)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    await db.query(`CREATE TABLE IF NOT EXISTS crm_contact_tags (
        contact_id BIGINT NOT NULL,
        tag_id INT NOT NULL,
        added_by INT NULL,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (contact_id, tag_id),
        KEY idx_tag (tag_id),
        KEY idx_added_at (added_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    await db.query(`CREATE TABLE IF NOT EXISTS crm_lists (
        id INT AUTO_INCREMENT PRIMARY KEY,
        slug VARCHAR(80) NOT NULL,
        name VARCHAR(160) NOT NULL,
        description VARCHAR(500) NULL,
        type ENUM('static','smart') NOT NULL DEFAULT 'static',
        rules_json JSON NULL,
        contact_count INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_slug (slug),
        KEY idx_type (type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    await db.query(`CREATE TABLE IF NOT EXISTS crm_list_contacts (
        list_id INT NOT NULL,
        contact_id BIGINT NOT NULL,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (list_id, contact_id),
        KEY idx_contact (contact_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    // Faz 4: Tracking + Scoring
    await db.query(`CREATE TABLE IF NOT EXISTS crm_email_tracking (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        contact_id BIGINT NULL,
        email VARCHAR(255) NOT NULL,
        event ENUM('delivered','opened','clicked','bounced','spam','blocked','unsubscribed','soft_bounce','hard_bounce','deferred','invalid_email','complaint','request') NOT NULL,
        message_id VARCHAR(160) NULL,
        link_url TEXT NULL,
        reason VARCHAR(500) NULL,
        ip VARCHAR(64) NULL,
        user_agent TEXT NULL,
        provider VARCHAR(32) NOT NULL DEFAULT 'brevo',
        campaign_id INT NULL,
        sequence_step_id INT NULL,
        raw_payload JSON NULL,
        occurred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        KEY idx_contact (contact_id),
        KEY idx_email_event (email, event),
        KEY idx_event_time (event, occurred_at),
        KEY idx_campaign (campaign_id),
        KEY idx_message (message_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    await db.query(`CREATE TABLE IF NOT EXISTS crm_score_rules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        rule_key VARCHAR(64) NOT NULL,
        label VARCHAR(160) NOT NULL,
        event_type VARCHAR(64) NOT NULL,
        points INT NOT NULL DEFAULT 0,
        decay_days INT NOT NULL DEFAULT 0,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_rule_key (rule_key),
        KEY idx_event_type (event_type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    await db.query(`CREATE TABLE IF NOT EXISTS crm_score_history (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        contact_id BIGINT NOT NULL,
        rule_id INT NULL,
        rule_key VARCHAR(64) NULL,
        delta INT NOT NULL,
        score_after INT NOT NULL,
        reason VARCHAR(255) NULL,
        ref_type VARCHAR(48) NULL,
        ref_id BIGINT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        KEY idx_contact_time (contact_id, created_at),
        KEY idx_rule (rule_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    try {
        const [[{ c }]] = await db.query('SELECT COUNT(*) AS c FROM crm_score_rules');
        if (Number(c) === 0) {
            const defaults = [
                ['email_opened', 'E-posta açıldı', 'email_opened', 1, 0],
                ['email_clicked', 'E-posta linkine tıklandı', 'email_clicked', 3, 0],
                ['email_bounced', 'E-posta bounce', 'email_bounced', -5, 0],
                ['email_spam', 'Spam şikayeti', 'email_spam', -15, 0],
                ['email_unsubscribed', 'Listeden çıkış', 'email_unsubscribed', -10, 0],
                ['order_completed', 'Sipariş tamamlandı', 'order_completed', 10, 0],
                ['order_failed', 'Sipariş başarısız', 'order_failed', -2, 0],
                ['form_submitted', 'Form gönderdi', 'form_submitted', 5, 0],
                ['booking_created', 'Rezervasyon oluşturdu', 'booking_created', 8, 0],
                ['onboarding_submitted', 'Onboarding doldurdu', 'onboarding_submitted', 6, 0],
                ['web_page_visited', 'Sayfa ziyareti', 'web_page_visited', 1, 0],
                ['consent_given', 'Onay verdi', 'consent_given', 2, 0],
            ];
            for (const r of defaults) {
                await db.query('INSERT INTO crm_score_rules (rule_key, label, event_type, points, decay_days) VALUES (?, ?, ?, ?, ?)', r);
            }
        }
    } catch (e) { console.warn('[crm-schema] score rules seed:', e.message); }

    // Faz 9: Funnels
    await db.query(`CREATE TABLE IF NOT EXISTS crm_funnels (
        id INT AUTO_INCREMENT PRIMARY KEY,
        slug VARCHAR(80) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT NULL,
        steps_json JSON NOT NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_slug (slug)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    // Faz 7: Forms + Double Opt-In
    await db.query(`CREATE TABLE IF NOT EXISTS crm_forms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        slug VARCHAR(80) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT NULL,
        fields_json JSON NOT NULL,
        actions_json JSON NULL,
        success_message TEXT NULL,
        success_redirect VARCHAR(1024) NULL,
        double_opt_in TINYINT(1) NOT NULL DEFAULT 0,
        opt_in_subject VARCHAR(255) NULL,
        opt_in_body MEDIUMTEXT NULL,
        opt_in_redirect VARCHAR(1024) NULL,
        submission_count INT NOT NULL DEFAULT 0,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_slug (slug),
        KEY idx_active (is_active)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    await db.query(`CREATE TABLE IF NOT EXISTS crm_form_submissions (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        form_id INT NOT NULL,
        contact_id BIGINT NULL,
        email VARCHAR(255) NOT NULL,
        data_json JSON NOT NULL,
        status ENUM('pending_optin','confirmed','spam','rejected') NOT NULL DEFAULT 'confirmed',
        opt_in_token VARCHAR(64) NULL,
        confirmed_at TIMESTAMP NULL,
        ip VARCHAR(64) NULL,
        user_agent TEXT NULL,
        referrer VARCHAR(1024) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        KEY idx_form (form_id),
        KEY idx_email (email),
        KEY idx_status (status),
        KEY idx_token (opt_in_token)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    // Faz 6: Campaigns + A/B
    await db.query(`CREATE TABLE IF NOT EXISTS crm_campaigns (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT NULL,
        template_id INT NULL,
        from_email VARCHAR(255) NULL,
        from_name VARCHAR(120) NULL,
        subject VARCHAR(255) NOT NULL,
        preview_text VARCHAR(500) NULL,
        body_html MEDIUMTEXT NULL,
        design_json LONGTEXT NULL,
        target_list_ids JSON NULL,
        target_tag_slugs JSON NULL,
        target_status VARCHAR(32) NOT NULL DEFAULT 'subscribed',
        ab_enabled TINYINT(1) NOT NULL DEFAULT 0,
        ab_subject_b VARCHAR(255) NULL,
        ab_winner_after_hours INT NOT NULL DEFAULT 4,
        ab_winner_decided_at TIMESTAMP NULL,
        ab_winner VARCHAR(1) NULL,
        status ENUM('draft','scheduled','sending','sent','paused','cancelled') NOT NULL DEFAULT 'draft',
        scheduled_at TIMESTAMP NULL,
        started_at TIMESTAMP NULL,
        completed_at TIMESTAMP NULL,
        stats_json JSON NULL,
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY idx_status (status),
        KEY idx_scheduled (scheduled_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    // Idempotent ALTER — eski deploy'lar için Unlayer design_json sütunu
    try {
        const [cols] = await db.query("SHOW COLUMNS FROM crm_campaigns");
        const colNames = new Set(cols.map(c => c.Field.toLowerCase()));
        if (!colNames.has('design_json')) {
            await db.query("ALTER TABLE crm_campaigns ADD COLUMN design_json LONGTEXT NULL AFTER body_html");
        }
        if (!colNames.has('preview_text')) {
            await db.query("ALTER TABLE crm_campaigns ADD COLUMN preview_text VARCHAR(500) NULL AFTER subject");
        }
    } catch {}

    await db.query(`CREATE TABLE IF NOT EXISTS crm_campaign_recipients (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        campaign_id INT NOT NULL,
        contact_id BIGINT NOT NULL,
        email VARCHAR(255) NOT NULL,
        ab_variant VARCHAR(1) NULL,
        status ENUM('queued','sent','failed','skipped','opened','clicked','bounced','unsubscribed') NOT NULL DEFAULT 'queued',
        message_id VARCHAR(160) NULL,
        sent_at TIMESTAMP NULL,
        opened_at TIMESTAMP NULL,
        clicked_at TIMESTAMP NULL,
        error TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_campaign_contact (campaign_id, contact_id),
        KEY idx_status (status),
        KEY idx_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    // Faz 5: Web Tracking + Smart Links
    await db.query(`CREATE TABLE IF NOT EXISTS crm_web_visits (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        contact_id BIGINT NULL,
        anonymous_id VARCHAR(64) NULL,
        session_id VARCHAR(64) NULL,
        url VARCHAR(1024) NOT NULL,
        path VARCHAR(255) NULL,
        title VARCHAR(255) NULL,
        referrer VARCHAR(1024) NULL,
        utm_source VARCHAR(120) NULL,
        utm_medium VARCHAR(120) NULL,
        utm_campaign VARCHAR(120) NULL,
        utm_term VARCHAR(120) NULL,
        utm_content VARCHAR(120) NULL,
        ip VARCHAR(64) NULL,
        user_agent TEXT NULL,
        device_type VARCHAR(32) NULL,
        country VARCHAR(8) NULL,
        duration_seconds INT NULL,
        custom_data JSON NULL,
        occurred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        KEY idx_contact (contact_id),
        KEY idx_anon (anonymous_id),
        KEY idx_session (session_id),
        KEY idx_path (path),
        KEY idx_occurred (occurred_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    await db.query(`CREATE TABLE IF NOT EXISTS crm_smart_links (
        id INT AUTO_INCREMENT PRIMARY KEY,
        slug VARCHAR(64) NOT NULL,
        target_url VARCHAR(2048) NOT NULL,
        label VARCHAR(255) NULL,
        campaign_id INT NULL,
        click_count INT NOT NULL DEFAULT 0,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        expires_at TIMESTAMP NULL,
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_slug (slug),
        KEY idx_campaign (campaign_id),
        KEY idx_active (is_active)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    await db.query(`CREATE TABLE IF NOT EXISTS crm_smart_link_clicks (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        link_id INT NOT NULL,
        contact_id BIGINT NULL,
        anonymous_id VARCHAR(64) NULL,
        ip VARCHAR(64) NULL,
        user_agent TEXT NULL,
        referrer VARCHAR(1024) NULL,
        clicked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        KEY idx_link (link_id),
        KEY idx_contact (contact_id),
        KEY idx_clicked (clicked_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    // Faz 3: Activity Log
    await db.query(`CREATE TABLE IF NOT EXISTS crm_activity_log (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        contact_id BIGINT NOT NULL,
        type VARCHAR(48) NOT NULL,
        title VARCHAR(255) NOT NULL,
        ref_type VARCHAR(48) NULL,
        ref_id BIGINT NULL,
        metadata JSON NULL,
        occurred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        KEY idx_contact_time (contact_id, occurred_at),
        KEY idx_type (type),
        KEY idx_ref (ref_type, ref_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    crmSchemaReady = true;
}

// Smart list rules → SQL builder
function buildSmartListSql(rules) {
    if (!rules || typeof rules !== 'object') return { where: '', params: [] };
    const match = rules.match === 'any' ? 'OR' : 'AND';
    const items = Array.isArray(rules.rules) ? rules.rules : [];
    const allowedText = ['email','first_name','last_name','phone','company','source','status'];
    const allowedNum = ['score','ltv','user_id'];
    const allowedDate = ['created_at','updated_at','last_activity_at'];
    const clauses = []; const params = [];

    for (const r of items) {
        const field = String(r.field || '');
        const op = String(r.op || 'equals');
        const val = r.value;

        if (field === 'has_tag') {
            let sub = "EXISTS (SELECT 1 FROM crm_contact_tags ct JOIN crm_tags t ON t.id = ct.tag_id WHERE ct.contact_id = c.id AND t.slug = ?)";
            if (op === 'not_equals') sub = `NOT ${sub}`;
            clauses.push(sub); params.push(String(val)); continue;
        }
        if (field === 'has_any_tag') {
            const tags = Array.isArray(val) ? val.map(String).filter(Boolean) : [];
            if (!tags.length) continue;
            const ph = tags.map(() => '?').join(',');
            clauses.push(`EXISTS (SELECT 1 FROM crm_contact_tags ct JOIN crm_tags t ON t.id = ct.tag_id WHERE ct.contact_id = c.id AND t.slug IN (${ph}))`);
            params.push(...tags); continue;
        }
        // Kampanya etkileşimi (mail açtı / tıkladı) — crm_campaign_recipients bazlı.
        // op equals → o kampanyayı açtı/tıkladı (value=campaign_id), not_equals → açmadı, any → herhangi biri.
        if (field === 'opened_campaign' || field === 'clicked_campaign') {
            const col = field === 'clicked_campaign' ? 'clicked_at' : 'opened_at';
            const needsId = (op === 'equals' || op === 'not_equals');
            let sub = `EXISTS (SELECT 1 FROM crm_campaign_recipients r WHERE r.contact_id = c.id AND r.${col} IS NOT NULL${needsId ? ' AND r.campaign_id = ?' : ''})`;
            if (op === 'not_equals') sub = `NOT ${sub}`;
            clauses.push(sub);
            if (needsId) params.push(Number(val));
            continue;
        }
        if (field === 'in_list') {
            let sub = "EXISTS (SELECT 1 FROM crm_list_contacts lc WHERE lc.contact_id = c.id AND lc.list_id = ?)";
            if (op === 'not_equals') sub = `NOT ${sub}`;
            clauses.push(sub); params.push(Number(val)); continue;
        }

        if (allowedText.includes(field)) {
            switch (op) {
                case 'equals': clauses.push(`c.${field} = ?`); params.push(String(val)); break;
                case 'not_equals': clauses.push(`c.${field} <> ?`); params.push(String(val)); break;
                case 'contains': clauses.push(`c.${field} LIKE ?`); params.push(`%${val}%`); break;
                case 'not_contains': clauses.push(`c.${field} NOT LIKE ?`); params.push(`%${val}%`); break;
                case 'starts_with': clauses.push(`c.${field} LIKE ?`); params.push(`${val}%`); break;
                case 'ends_with': clauses.push(`c.${field} LIKE ?`); params.push(`%${val}`); break;
                case 'is_empty': clauses.push(`(c.${field} IS NULL OR c.${field} = '')`); break;
                case 'is_not_empty': clauses.push(`(c.${field} IS NOT NULL AND c.${field} <> '')`); break;
                case 'in': {
                    const vs = Array.isArray(val) ? val.map(String) : [];
                    if (!vs.length) { clauses.push('1=0'); break; }
                    clauses.push(`c.${field} IN (${vs.map(() => '?').join(',')})`);
                    params.push(...vs); break;
                }
            }
            continue;
        }
        if (allowedNum.includes(field)) {
            switch (op) {
                case 'equals': clauses.push(`c.${field} = ?`); params.push(Number(val)); break;
                case 'not_equals': clauses.push(`c.${field} <> ?`); params.push(Number(val)); break;
                case 'gt': clauses.push(`c.${field} > ?`); params.push(Number(val)); break;
                case 'gte': clauses.push(`c.${field} >= ?`); params.push(Number(val)); break;
                case 'lt': clauses.push(`c.${field} < ?`); params.push(Number(val)); break;
                case 'lte': clauses.push(`c.${field} <= ?`); params.push(Number(val)); break;
                case 'between':
                    if (Array.isArray(val) && val.length === 2) {
                        clauses.push(`c.${field} BETWEEN ? AND ?`);
                        params.push(Number(val[0]), Number(val[1]));
                    }
                    break;
                case 'is_null': clauses.push(`c.${field} IS NULL`); break;
                case 'is_not_null': clauses.push(`c.${field} IS NOT NULL`); break;
            }
            continue;
        }
        if (allowedDate.includes(field)) {
            switch (op) {
                case 'within_days': clauses.push(`c.${field} >= DATE_SUB(NOW(), INTERVAL ${Math.max(1, Number(val) | 0)} DAY)`); break;
                case 'older_than_days': clauses.push(`c.${field} < DATE_SUB(NOW(), INTERVAL ${Math.max(1, Number(val) | 0)} DAY)`); break;
                case 'is_null': clauses.push(`c.${field} IS NULL`); break;
                case 'is_not_null': clauses.push(`c.${field} IS NOT NULL`); break;
                case 'between':
                    if (Array.isArray(val) && val.length === 2) {
                        clauses.push(`c.${field} BETWEEN ? AND ?`);
                        params.push(String(val[0]), String(val[1]));
                    }
                    break;
            }
            continue;
        }
    }
    if (!clauses.length) return { where: '', params: [] };
    return { where: '(' + clauses.join(`) ${match} (`) + ')', params };
}

async function recountTagContacts(tagId = null) {
    const where = tagId ? `WHERE id = ${Number(tagId)}` : '';
    await db.query(`UPDATE crm_tags SET contact_count = (
        SELECT COUNT(*) FROM crm_contact_tags WHERE tag_id = crm_tags.id
    ) ${where}`);
}
// Faz 4: Scoring engine helper
let _scoreRulesCache = null;
async function getScoreRules() {
    if (_scoreRulesCache) return _scoreRulesCache;
    const [rows] = await db.query('SELECT * FROM crm_score_rules WHERE is_active = 1');
    _scoreRulesCache = {};
    for (const r of rows) {
        _scoreRulesCache[r.event_type] = {
            id: Number(r.id), rule_key: r.rule_key, label: r.label,
            points: Number(r.points), decay_days: Number(r.decay_days)
        };
    }
    return _scoreRulesCache;
}
function clearScoreRulesCache() { _scoreRulesCache = null; }

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

async function recomputeScoreFromHistory(contactId) {
    const [[{ total }]] = await db.query('SELECT COALESCE(SUM(delta), 0) AS total FROM crm_score_history WHERE contact_id = ?', [contactId]);
    const t = Number(total);
    await db.query('UPDATE crm_contacts SET score = ? WHERE id = ?', [t, contactId]);
    return t;
}

async function runActivityBackfill() {
    const stats = { email_events: 0, orders: 0, consent_logs: 0, onboarding_forms: 0, consultant_bookings: 0, total_after: 0 };

    // email_events
    try {
        const [r] = await db.query(`
            INSERT INTO crm_activity_log (contact_id, type, title, ref_type, ref_id, metadata, occurred_at)
            SELECT c.id, CONCAT('email_event:', e.event_type),
                   CASE
                     WHEN e.event_type = 'checkout_email_entered' THEN 'Sepette e-posta girdi'
                     WHEN e.event_type = 'purchase_completed' THEN 'Satın alma tamamlandı'
                     WHEN e.event_type = 'login' THEN 'Giriş yaptı'
                     ELSE CONCAT('E-posta olayı: ', e.event_type)
                   END,
                   'email_event', e.id, e.metadata, e.created_at
            FROM email_events e
            JOIN crm_contacts c ON c.email = e.email
            LEFT JOIN crm_activity_log al ON al.contact_id = c.id AND al.ref_type = 'email_event' AND al.ref_id = e.id
            WHERE al.id IS NULL`);
        stats.email_events = r.affectedRows;
    } catch (e) { console.warn('[crm-act-backfill] email_events:', e.message); }

    // orders
    try {
        const [colCheck] = await db.query("SHOW COLUMNS FROM orders LIKE 'email'");
        const joinExpr = colCheck.length ? "(c.user_id = o.user_id OR c.email = o.email)" : "c.user_id = o.user_id";
        const [r] = await db.query(`
            INSERT INTO crm_activity_log (contact_id, type, title, ref_type, ref_id, metadata, occurred_at)
            SELECT c.id,
                   CASE WHEN o.status = 'completed' THEN 'order_completed'
                        WHEN o.status = 'pending' THEN 'order_created'
                        ELSE CONCAT('order_', o.status) END,
                   CONCAT('Sipariş #', o.order_number, ' — ', UPPER(LEFT(o.status, 1)), SUBSTRING(o.status, 2)),
                   'order', o.id,
                   JSON_OBJECT('total', o.total_amount, 'currency', o.currency, 'status', o.status),
                   o.created_at
            FROM orders o
            JOIN crm_contacts c ON ${joinExpr}
            LEFT JOIN crm_activity_log al ON al.contact_id = c.id AND al.ref_type = 'order' AND al.ref_id = o.id
            WHERE al.id IS NULL`);
        stats.orders = r.affectedRows;
    } catch (e) { console.warn('[crm-act-backfill] orders:', e.message); }

    // consent_logs
    try {
        const [r] = await db.query(`
            INSERT INTO crm_activity_log (contact_id, type, title, ref_type, ref_id, metadata, occurred_at)
            SELECT c.id,
                   CASE WHEN cl.consent_state = 1 THEN 'consent_given' ELSE 'consent_declined' END,
                   CONCAT(
                     CASE WHEN cl.consent_state = 1 THEN 'Onayladı: ' ELSE 'Reddetti: ' END,
                     cl.consent_key,
                     CASE WHEN cl.context IS NOT NULL AND cl.context <> '' THEN CONCAT(' (', cl.context, ')') ELSE '' END
                   ),
                   'consent', cl.id,
                   JSON_OBJECT('key', cl.consent_key, 'context', cl.context, 'version', cl.policy_version, 'ip', cl.ip),
                   cl.created_at
            FROM consent_logs cl
            JOIN crm_contacts c ON c.email = cl.email
            LEFT JOIN crm_activity_log al ON al.contact_id = c.id AND al.ref_type = 'consent' AND al.ref_id = cl.id
            WHERE al.id IS NULL`);
        stats.consent_logs = r.affectedRows;
    } catch (e) { console.warn('[crm-act-backfill] consent_logs:', e.message); }

    // onboarding_forms
    try {
        const [exists] = await db.query("SHOW TABLES LIKE 'onboarding_forms'");
        if (exists.length) {
            const [r] = await db.query(`
                INSERT INTO crm_activity_log (contact_id, type, title, ref_type, ref_id, metadata, occurred_at)
                SELECT c.id, 'onboarding_submitted',
                       CONCAT('Onboarding formu: ', UPPER(LEFT(of.status, 1)), SUBSTRING(of.status, 2)),
                       'onboarding', of.id,
                       JSON_OBJECT('order_id', of.order_id, 'status', of.status),
                       COALESCE(of.created_at, NOW())
                FROM onboarding_forms of
                JOIN crm_contacts c ON c.user_id = of.user_id
                LEFT JOIN crm_activity_log al ON al.contact_id = c.id AND al.ref_type = 'onboarding' AND al.ref_id = of.id
                WHERE al.id IS NULL`);
            stats.onboarding_forms = r.affectedRows;
        }
    } catch (e) { console.warn('[crm-act-backfill] onboarding_forms:', e.message); }

    // consultant_bookings
    try {
        const [exists] = await db.query("SHOW TABLES LIKE 'consultant_bookings'");
        if (exists.length) {
            const [emailCol] = await db.query("SHOW COLUMNS FROM consultant_bookings LIKE 'email'");
            const [userCol] = await db.query("SHOW COLUMNS FROM consultant_bookings LIKE 'user_id'");
            const joinParts = [];
            if (emailCol.length) joinParts.push("c.email = b.email");
            if (userCol.length) joinParts.push("c.user_id = b.user_id");
            if (joinParts.length) {
                const joinExpr = `(${joinParts.join(' OR ')})`;
                const [r] = await db.query(`
                    INSERT INTO crm_activity_log (contact_id, type, title, ref_type, ref_id, metadata, occurred_at)
                    SELECT c.id, 'booking_created', 'Danışmanlık rezervasyonu',
                           'booking', b.id, JSON_OBJECT('id', b.id), COALESCE(b.created_at, NOW())
                    FROM consultant_bookings b
                    JOIN crm_contacts c ON ${joinExpr}
                    LEFT JOIN crm_activity_log al ON al.contact_id = c.id AND al.ref_type = 'booking' AND al.ref_id = b.id
                    WHERE al.id IS NULL`);
                stats.consultant_bookings = r.affectedRows;
            }
        }
    } catch (e) { console.warn('[crm-act-backfill] consultant_bookings:', e.message); }

    try {
        await db.query(`UPDATE crm_contacts c
            LEFT JOIN (SELECT contact_id, MAX(occurred_at) AS last_at FROM crm_activity_log GROUP BY contact_id) a
                   ON a.contact_id = c.id
            SET c.last_activity_at = a.last_at
            WHERE a.last_at IS NOT NULL AND (c.last_activity_at IS NULL OR a.last_at > c.last_activity_at)`);
    } catch {}

    try {
        const [[{ total }]] = await db.query('SELECT COUNT(*) AS total FROM crm_activity_log');
        stats.total_after = Number(total);
    } catch {}

    return stats;
}

async function recountListContacts(listId = null) {
    const where = listId ? `WHERE id = ${Number(listId)} AND type = 'static'` : `WHERE type = 'static'`;
    await db.query(`UPDATE crm_lists SET contact_count = (
        SELECT COUNT(*) FROM crm_list_contacts WHERE list_id = crm_lists.id
    ) ${where}`);
}

function rowToContact(r) {
    let custom = null;
    if (r.custom_fields) {
        try { custom = typeof r.custom_fields === 'string' ? JSON.parse(r.custom_fields) : r.custom_fields; } catch {}
    }
    return {
        id: Number(r.id),
        user_id: r.user_id != null ? Number(r.user_id) : null,
        email: r.email,
        first_name: r.first_name || '',
        last_name: r.last_name || '',
        phone: r.phone || '',
        company: r.company || '',
        status: r.status || 'subscribed',
        source: r.source || 'manual',
        score: Number(r.score || 0),
        ltv: Number(r.ltv || 0),
        ltv_currency: r.ltv_currency || 'TRY',
        custom_fields: custom,
        last_activity_at: r.last_activity_at,
        created_at: r.created_at,
        updated_at: r.updated_at
    };
}

// Tüm endpoint'ler admin-only
router.use(authMiddleware, adminMiddleware);
router.use(async (req, res, next) => {
    try { await ensureCrmSchema(); next(); } catch (e) { next(e); }
});

// ─── /api/crm/contacts ────────────────────────────────────────────────────────
router.get('/contacts', async (req, res) => {
    try {
        const q = String(req.query.q || '').trim();
        const status = String(req.query.status || '').trim();
        const source = String(req.query.source || '').trim();
        const minScore = req.query.min_score != null ? Number(req.query.min_score) : null;
        const page = Math.max(1, Number(req.query.page || 1));
        const perPage = Math.min(200, Math.max(10, Number(req.query.per_page || 50)));
        const offset = (page - 1) * perPage;
        const allowedSorts = ['created_at', 'updated_at', 'last_activity_at', 'score', 'email'];
        const sortBy = allowedSorts.includes(req.query.sort) ? req.query.sort : 'created_at';
        const sortDir = String(req.query.dir || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC';

        const where = []; const params = [];
        if (q) {
            where.push('(email LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR phone LIKE ? OR company LIKE ?)');
            const like = `%${q}%`;
            params.push(like, like, like, like, like);
        }
        if (status && ['subscribed','unsubscribed','bounced','complained','pending'].includes(status)) {
            where.push('status = ?'); params.push(status);
        }
        if (source) { where.push('source = ?'); params.push(source); }
        if (minScore != null && Number.isFinite(minScore)) { where.push('score >= ?'); params.push(minScore); }
        const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

        const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM crm_contacts ${whereSql}`, params);
        const [rows] = await db.query(
            `SELECT * FROM crm_contacts ${whereSql} ORDER BY ${sortBy} ${sortDir} LIMIT ? OFFSET ?`,
            [...params, perPage, offset]
        );
        res.json({
            contacts: rows.map(rowToContact),
            total: Number(total),
            page, per_page: perPage,
            pages: total > 0 ? Math.ceil(total / perPage) : 0
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/contacts/:id', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM crm_contacts WHERE id = ? LIMIT 1', [Number(req.params.id)]);
        if (!rows.length) return res.status(404).json({ error: 'Not found' });
        res.json({ contact: rowToContact(rows[0]) });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/contacts', async (req, res) => {
    try {
        const email = String(req.body.email || '').trim().toLowerCase();
        if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
            return res.status(400).json({ error: 'Geçerli email zorunlu' });
        }
        const status = ['subscribed','unsubscribed','bounced','complained','pending'].includes(req.body.status) ? req.body.status : 'subscribed';
        const customFields = req.body.custom_fields && typeof req.body.custom_fields === 'object'
            ? JSON.stringify(req.body.custom_fields) : null;

        try {
            const [r] = await db.query(
                `INSERT INTO crm_contacts (email, first_name, last_name, phone, company, status, source, custom_fields)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    email,
                    String(req.body.first_name || '').trim(),
                    String(req.body.last_name || '').trim(),
                    String(req.body.phone || '').trim(),
                    String(req.body.company || '').trim(),
                    status,
                    String(req.body.source || 'manual'),
                    customFields
                ]
            );
            const newId = r.insertId;
            const [rows] = await db.query('SELECT * FROM crm_contacts WHERE id = ?', [newId]);
            res.status(201).json({ contact: rowToContact(rows[0]) });
        } catch (e) {
            if (e.code === 'ER_DUP_ENTRY') {
                const [rows] = await db.query('SELECT id FROM crm_contacts WHERE email = ? LIMIT 1', [email]);
                return res.status(409).json({ error: 'Bu email zaten kayıtlı', existing_id: rows[0]?.id });
            }
            throw e;
        }
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/contacts/:id', async (req, res) => {
    try {
        const allowed = ['first_name','last_name','phone','company','status','source','score','ltv','ltv_currency'];
        const sets = []; const params = [];
        for (const k of allowed) {
            if (k in req.body) { sets.push(`${k} = ?`); params.push(req.body[k]); }
        }
        if (req.body.custom_fields && typeof req.body.custom_fields === 'object') {
            sets.push('custom_fields = ?'); params.push(JSON.stringify(req.body.custom_fields));
        }
        if (!sets.length) return res.status(400).json({ error: 'No fields to update' });
        params.push(Number(req.params.id));
        await db.query(`UPDATE crm_contacts SET ${sets.join(', ')} WHERE id = ?`, params);
        const [rows] = await db.query('SELECT * FROM crm_contacts WHERE id = ?', [Number(req.params.id)]);
        if (!rows.length) return res.status(404).json({ error: 'Not found' });
        res.json({ contact: rowToContact(rows[0]) });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/contacts/:id', async (req, res) => {
    try {
        const [r] = await db.query('DELETE FROM crm_contacts WHERE id = ?', [Number(req.params.id)]);
        res.json({ ok: true, deleted: r.affectedRows });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/contacts/bulk-delete', async (req, res) => {
    try {
        const ids = (req.body.ids || []).map(Number).filter(Boolean);
        if (!ids.length) return res.status(400).json({ error: 'ids required' });
        const [r] = await db.query(`DELETE FROM crm_contacts WHERE id IN (?)`, [ids]);
        res.json({ ok: true, deleted: r.affectedRows });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── /api/crm/backfill ────────────────────────────────────────────────────────
router.post('/backfill', async (req, res) => {
    const stats = { users: 0, email_events: 0, orders: 0, total_after: 0 };
    try {
        const [u] = await db.query(
            `INSERT INTO crm_contacts (user_id, email, first_name, last_name, phone, source, status, created_at)
             SELECT u.id, u.email, u.first_name, u.last_name, u.phone, 'user_account', 'subscribed', u.created_at
             FROM users u WHERE u.email IS NOT NULL AND u.email <> ''
             ON DUPLICATE KEY UPDATE
                user_id = COALESCE(crm_contacts.user_id, VALUES(user_id)),
                first_name = COALESCE(NULLIF(crm_contacts.first_name, ''), VALUES(first_name)),
                last_name = COALESCE(NULLIF(crm_contacts.last_name, ''), VALUES(last_name)),
                phone = COALESCE(NULLIF(crm_contacts.phone, ''), VALUES(phone))`
        );
        stats.users = u.affectedRows;
    } catch (e) { console.warn('[crm-backfill] users:', e.message); }

    try {
        const [r] = await db.query(
            `INSERT INTO crm_contacts (email, source, status, created_at)
             SELECT e.email, 'email_event', 'subscribed', MIN(e.created_at)
             FROM email_events e WHERE e.email IS NOT NULL AND e.email <> ''
             GROUP BY e.email
             ON DUPLICATE KEY UPDATE crm_contacts.id = crm_contacts.id`
        );
        stats.email_events = r.affectedRows;
    } catch (e) { console.warn('[crm-backfill] email_events:', e.message); }

    try {
        const [colCheck] = await db.query("SHOW COLUMNS FROM orders LIKE 'email'");
        if (colCheck.length) {
            const [r] = await db.query(
                `INSERT INTO crm_contacts (email, source, status, created_at)
                 SELECT o.email, 'order', 'subscribed', MIN(o.created_at)
                 FROM orders o WHERE o.email IS NOT NULL AND o.email <> ''
                 GROUP BY o.email
                 ON DUPLICATE KEY UPDATE crm_contacts.id = crm_contacts.id`
            );
            stats.orders = r.affectedRows;
        }
    } catch (e) { console.warn('[crm-backfill] orders:', e.message); }

    try {
        await db.query(
            `UPDATE crm_contacts c
             LEFT JOIN (SELECT email, MAX(created_at) AS last_at FROM email_events GROUP BY email) e ON e.email = c.email
             SET c.last_activity_at = e.last_at
             WHERE e.last_at IS NOT NULL AND (c.last_activity_at IS NULL OR e.last_at > c.last_activity_at)`
        );
    } catch {}

    try {
        const [[{ total }]] = await db.query('SELECT COUNT(*) AS total FROM crm_contacts');
        stats.total_after = Number(total);
    } catch {}

    res.json({ ok: true, stats });
});

// ─── /api/crm/stats ───────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
    try {
        const stats = { total: 0, by_status: {}, by_source: {}, recent_7d: 0 };
        const [[{ total }]] = await db.query('SELECT COUNT(*) AS total FROM crm_contacts');
        stats.total = Number(total);
        const [byStatus] = await db.query('SELECT status, COUNT(*) c FROM crm_contacts GROUP BY status');
        for (const r of byStatus) stats.by_status[r.status] = Number(r.c);
        const [bySource] = await db.query('SELECT source, COUNT(*) c FROM crm_contacts GROUP BY source');
        for (const r of bySource) stats.by_source[r.source] = Number(r.c);
        const [[{ recent }]] = await db.query(
            "SELECT COUNT(*) AS recent FROM crm_contacts WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)"
        );
        stats.recent_7d = Number(recent);
        res.json({ stats });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── /api/crm/custom-fields ───────────────────────────────────────────────────
router.get('/custom-fields', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM crm_custom_fields ORDER BY sort_order ASC, id ASC');
        res.json({
            fields: rows.map(r => {
                let opts = null;
                if (r.options_json) { try { opts = typeof r.options_json === 'string' ? JSON.parse(r.options_json) : r.options_json; } catch {} }
                return {
                    id: Number(r.id), field_key: r.field_key, label: r.label, type: r.type,
                    options: opts, sort_order: Number(r.sort_order)
                };
            })
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/custom-fields', async (req, res) => {
    try {
        const fieldKey = String(req.body.field_key || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
        const label = String(req.body.label || '').trim();
        if (!fieldKey || !label) return res.status(400).json({ error: 'field_key ve label zorunlu' });
        const type = ['text','textarea','number','select','multi_select','date','checkbox'].includes(req.body.type) ? req.body.type : 'text';
        const opts = Array.isArray(req.body.options) ? JSON.stringify(req.body.options) : null;
        const sort = Number(req.body.sort_order || 0);

        await db.query(
            `INSERT INTO crm_custom_fields (field_key, label, type, options_json, sort_order)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE label = VALUES(label), type = VALUES(type),
             options_json = VALUES(options_json), sort_order = VALUES(sort_order)`,
            [fieldKey, label, type, opts, sort]
        );
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/custom-fields/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM crm_custom_fields WHERE id = ?', [Number(req.params.id)]);
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── /api/crm/tags ────────────────────────────────────────────────────────────
router.get('/tags', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM crm_tags ORDER BY name ASC');
        res.json({ tags: rows.map(r => ({
            id: Number(r.id), slug: r.slug, name: r.name, color: r.color,
            description: r.description, contact_count: Number(r.contact_count),
            created_at: r.created_at
        })) });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/tags', async (req, res) => {
    try {
        const slug = String(req.body.slug || req.body.name || '').toLowerCase().replace(/[^a-z0-9_-]/g, '');
        const name = String(req.body.name || '').trim();
        const color = String(req.body.color || '#2563eb').trim();
        const desc = String(req.body.description || '').trim();
        if (!slug || !name) return res.status(400).json({ error: 'slug ve name zorunlu' });
        try {
            const [r] = await db.query(
                'INSERT INTO crm_tags (slug, name, color, description) VALUES (?, ?, ?, ?)',
                [slug, name, color, desc || null]
            );
            res.status(201).json({ tag: { id: r.insertId, slug, name, color, description: desc || null, contact_count: 0 } });
        } catch (e) {
            if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Bu slug zaten kayıtlı' });
            throw e;
        }
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/tags/:id', async (req, res) => {
    try {
        const sets = []; const params = [];
        for (const k of ['name', 'color', 'description']) {
            if (k in req.body) { sets.push(`${k} = ?`); params.push(req.body[k]); }
        }
        if (!sets.length) return res.status(400).json({ error: 'No fields' });
        params.push(Number(req.params.id));
        await db.query(`UPDATE crm_tags SET ${sets.join(', ')} WHERE id = ?`, params);
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/tags/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM crm_contact_tags WHERE tag_id = ?', [Number(req.params.id)]);
        await db.query('DELETE FROM crm_tags WHERE id = ?', [Number(req.params.id)]);
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── /api/crm/contacts/:id/tags ──────────────────────────────────────────────
router.get('/contacts/:id/tags', async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT t.*, ct.added_at FROM crm_contact_tags ct
             JOIN crm_tags t ON t.id = ct.tag_id
             WHERE ct.contact_id = ? ORDER BY ct.added_at DESC`,
            [Number(req.params.id)]
        );
        res.json({ tags: rows.map(r => ({
            id: Number(r.id), slug: r.slug, name: r.name, color: r.color, added_at: r.added_at
        })) });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/contacts/:id/tags', async (req, res) => {
    try {
        const tagIds = (req.body.tag_ids || []).map(Number).filter(Boolean);
        if (!tagIds.length) return res.status(400).json({ error: 'tag_ids gerekli' });
        const contactId = Number(req.params.id);
        for (const tid of tagIds) {
            await db.query(
                'INSERT IGNORE INTO crm_contact_tags (contact_id, tag_id, added_by) VALUES (?, ?, ?)',
                [contactId, tid, req.user.id]
            );
        }
        await recountTagContacts();
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/contacts/:id/tags', async (req, res) => {
    try {
        const tagIds = (req.body.tag_ids || []).map(Number).filter(Boolean);
        if (!tagIds.length) return res.status(400).json({ error: 'tag_ids gerekli' });
        const [r] = await db.query(
            `DELETE FROM crm_contact_tags WHERE contact_id = ? AND tag_id IN (?)`,
            [Number(req.params.id), tagIds]
        );
        await recountTagContacts();
        res.json({ ok: true, deleted: r.affectedRows });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── /api/crm/contacts/bulk-tag ──────────────────────────────────────────────
router.post('/contacts/bulk-tag', async (req, res) => {
    try {
        const contactIds = (req.body.contact_ids || []).map(Number).filter(Boolean);
        const tagIds = (req.body.tag_ids || []).map(Number).filter(Boolean);
        const mode = req.body.mode === 'remove' ? 'remove' : 'add';
        if (!contactIds.length || !tagIds.length) return res.status(400).json({ error: 'contact_ids ve tag_ids gerekli' });

        let affected = 0;
        if (mode === 'remove') {
            const [r] = await db.query(
                'DELETE FROM crm_contact_tags WHERE contact_id IN (?) AND tag_id IN (?)',
                [contactIds, tagIds]
            );
            affected = r.affectedRows;
        } else {
            for (const cid of contactIds) {
                for (const tid of tagIds) {
                    const [r] = await db.query(
                        'INSERT IGNORE INTO crm_contact_tags (contact_id, tag_id, added_by) VALUES (?, ?, ?)',
                        [cid, tid, req.user.id]
                    );
                    affected += r.affectedRows;
                }
            }
        }
        await recountTagContacts();
        res.json({ ok: true, affected });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── /api/crm/lists ──────────────────────────────────────────────────────────
router.get('/lists', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM crm_lists ORDER BY created_at DESC');
        const lists = [];
        for (const r of rows) {
            let rules = null;
            if (r.rules_json) { try { rules = typeof r.rules_json === 'string' ? JSON.parse(r.rules_json) : r.rules_json; } catch {} }
            // Smart list ise sayıyı CANLI hesapla (saklı contact_count smart'ta güncellenmez → 0 görünür).
            let count = Number(r.contact_count);
            if (r.type === 'smart' && rules) {
                try {
                    const built = buildSmartListSql(rules);
                    const w = built.where ? `WHERE ${built.where}` : '';
                    const [[{ c }]] = await db.query(`SELECT COUNT(*) AS c FROM crm_contacts c ${w}`, built.params);
                    count = Number(c);
                } catch {}
            }
            lists.push({
                id: Number(r.id), slug: r.slug, name: r.name, description: r.description,
                type: r.type, rules, contact_count: count,
                created_at: r.created_at, updated_at: r.updated_at
            });
        }
        res.json({ lists });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/lists/:id', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM crm_lists WHERE id = ?', [Number(req.params.id)]);
        if (!rows.length) return res.status(404).json({ error: 'Not found' });
        const r = rows[0];
        let rules = null;
        if (r.rules_json) { try { rules = typeof r.rules_json === 'string' ? JSON.parse(r.rules_json) : r.rules_json; } catch {} }
        let count = Number(r.contact_count);
        if (r.type === 'smart' && rules) {
            const built = buildSmartListSql(rules);
            const w = built.where ? `WHERE ${built.where}` : '';
            const [[{ c }]] = await db.query(`SELECT COUNT(*) AS c FROM crm_contacts c ${w}`, built.params);
            count = Number(c);
        }
        res.json({ list: {
            id: Number(r.id), slug: r.slug, name: r.name, description: r.description,
            type: r.type, rules, contact_count: count,
            created_at: r.created_at, updated_at: r.updated_at
        } });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/lists', async (req, res) => {
    try {
        const slug = String(req.body.slug || req.body.name || '').toLowerCase().replace(/[^a-z0-9_-]/g, '');
        const name = String(req.body.name || '').trim();
        const type = ['static', 'smart'].includes(req.body.type) ? req.body.type : 'static';
        const desc = String(req.body.description || '').trim();
        const rules = (type === 'smart' && req.body.rules && typeof req.body.rules === 'object')
            ? JSON.stringify(req.body.rules) : null;
        if (!slug || !name) return res.status(400).json({ error: 'slug ve name zorunlu' });
        try {
            const [r] = await db.query(
                'INSERT INTO crm_lists (slug, name, description, type, rules_json) VALUES (?, ?, ?, ?, ?)',
                [slug, name, desc || null, type, rules]
            );
            res.status(201).json({ list: { id: r.insertId, slug, name, type } });
        } catch (e) {
            if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Bu slug zaten kayıtlı' });
            throw e;
        }
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/lists/:id', async (req, res) => {
    try {
        const sets = []; const params = [];
        for (const k of ['name', 'description']) {
            if (k in req.body) { sets.push(`${k} = ?`); params.push(req.body[k]); }
        }
        if ('rules' in req.body) {
            sets.push('rules_json = ?');
            params.push(req.body.rules && typeof req.body.rules === 'object' ? JSON.stringify(req.body.rules) : null);
        }
        if (!sets.length) return res.status(400).json({ error: 'No fields' });
        params.push(Number(req.params.id));
        await db.query(`UPDATE crm_lists SET ${sets.join(', ')} WHERE id = ?`, params);
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/lists/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM crm_list_contacts WHERE list_id = ?', [Number(req.params.id)]);
        await db.query('DELETE FROM crm_lists WHERE id = ?', [Number(req.params.id)]);
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/lists/preview', async (req, res) => {
    try {
        const built = buildSmartListSql(req.body.rules || {});
        const w = built.where ? `WHERE ${built.where}` : '';
        const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM crm_contacts c ${w}`, built.params);
        const [sample] = await db.query(
            `SELECT c.id, c.email, c.first_name, c.last_name, c.score, c.status, c.source
             FROM crm_contacts c ${w} ORDER BY c.created_at DESC LIMIT 10`,
            built.params
        );
        res.json({ total: Number(total), sample });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/lists/:id/contacts', async (req, res) => {
    try {
        const page = Math.max(1, Number(req.query.page || 1));
        const perPage = Math.min(200, Math.max(10, Number(req.query.per_page || 50)));
        const offset = (page - 1) * perPage;
        const [lr] = await db.query('SELECT * FROM crm_lists WHERE id = ?', [Number(req.params.id)]);
        if (!lr.length) return res.status(404).json({ error: 'Not found' });
        const list = lr[0];
        let total = 0; let contacts = [];
        if (list.type === 'smart') {
            const rules = list.rules_json ? (typeof list.rules_json === 'string' ? JSON.parse(list.rules_json) : list.rules_json) : {};
            const built = buildSmartListSql(rules);
            const w = built.where ? `WHERE ${built.where}` : '';
            const [[{ c }]] = await db.query(`SELECT COUNT(*) AS c FROM crm_contacts c ${w}`, built.params);
            total = Number(c);
            const [rows] = await db.query(
                `SELECT c.* FROM crm_contacts c ${w} ORDER BY c.created_at DESC LIMIT ? OFFSET ?`,
                [...built.params, perPage, offset]
            );
            contacts = rows;
        } else {
            const [[{ c }]] = await db.query('SELECT COUNT(*) AS c FROM crm_list_contacts WHERE list_id = ?', [Number(req.params.id)]);
            total = Number(c);
            const [rows] = await db.query(
                `SELECT c.* FROM crm_list_contacts lc JOIN crm_contacts c ON c.id = lc.contact_id
                 WHERE lc.list_id = ? ORDER BY lc.added_at DESC LIMIT ? OFFSET ?`,
                [Number(req.params.id), perPage, offset]
            );
            contacts = rows;
        }
        res.json({
            contacts: contacts.map(rowToContact),
            total, page, per_page: perPage,
            pages: total > 0 ? Math.ceil(total / perPage) : 0
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/lists/:id/add', async (req, res) => {
    try {
        const contactIds = (req.body.contact_ids || []).map(Number).filter(Boolean);
        if (!contactIds.length) return res.status(400).json({ error: 'contact_ids gerekli' });
        for (const cid of contactIds) {
            await db.query(
                'INSERT IGNORE INTO crm_list_contacts (list_id, contact_id) VALUES (?, ?)',
                [Number(req.params.id), cid]
            );
        }
        await recountListContacts(Number(req.params.id));
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Faz 3: Timeline ──────────────────────────────────────────────────────────
router.get('/contacts/:id/timeline', async (req, res) => {
    try {
        const contactId = Number(req.params.id);
        const limit = Math.min(200, Math.max(10, Number(req.query.limit || 50)));
        const beforeId = Number(req.query.before_id || 0);
        const typeFilter = String(req.query.type || '').trim();
        const where = ['contact_id = ?']; const params = [contactId];
        if (beforeId > 0) { where.push('id < ?'); params.push(beforeId); }
        if (typeFilter) { where.push('type LIKE ?'); params.push(typeFilter + '%'); }
        const [rows] = await db.query(
            `SELECT * FROM crm_activity_log WHERE ${where.join(' AND ')}
             ORDER BY occurred_at DESC, id DESC LIMIT ?`,
            [...params, limit]
        );
        const events = rows.map(r => {
            let meta = null;
            if (r.metadata) { try { meta = typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata; } catch {} }
            return {
                id: Number(r.id), type: r.type, title: r.title,
                ref_type: r.ref_type, ref_id: r.ref_id != null ? Number(r.ref_id) : null,
                metadata: meta, occurred_at: r.occurred_at
            };
        });
        res.json({ events, has_more: events.length === limit });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/activity-backfill', async (req, res) => {
    try {
        const stats = await runActivityBackfill();
        res.json({ ok: true, stats });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Faz 4: Score history + Email tracking per-contact ────────────────────────
router.get('/contacts/:id/score-history', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM crm_score_history WHERE contact_id = ? ORDER BY created_at DESC LIMIT 100',
            [Number(req.params.id)]
        );
        res.json({ history: rows.map(r => ({
            id: Number(r.id), rule_key: r.rule_key, delta: Number(r.delta),
            score_after: Number(r.score_after), reason: r.reason,
            ref_type: r.ref_type, ref_id: r.ref_id != null ? Number(r.ref_id) : null,
            created_at: r.created_at
        })) });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/contacts/:id/recompute-score', async (req, res) => {
    try {
        const score = await recomputeScoreFromHistory(Number(req.params.id));
        res.json({ ok: true, score });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/contacts/:id/email-tracking', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM crm_email_tracking WHERE contact_id = ? ORDER BY occurred_at DESC LIMIT 100',
            [Number(req.params.id)]
        );
        res.json({ events: rows.map(r => ({
            id: Number(r.id), event: r.event, message_id: r.message_id, link_url: r.link_url,
            reason: r.reason, campaign_id: r.campaign_id != null ? Number(r.campaign_id) : null,
            occurred_at: r.occurred_at
        })) });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Faz 4: Scoring rules CRUD ────────────────────────────────────────────────
router.get('/scoring-rules', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM crm_score_rules ORDER BY event_type ASC');
        res.json({ rules: rows.map(r => ({
            id: Number(r.id), rule_key: r.rule_key, label: r.label, event_type: r.event_type,
            points: Number(r.points), decay_days: Number(r.decay_days),
            is_active: Number(r.is_active) === 1,
            created_at: r.created_at, updated_at: r.updated_at
        })) });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/scoring-rules', async (req, res) => {
    try {
        const ruleKey = String(req.body.rule_key || req.body.event_type || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
        const label = String(req.body.label || '').trim();
        const eventType = String(req.body.event_type || '').trim();
        const points = Number(req.body.points || 0) | 0;
        const decay = Math.max(0, Number(req.body.decay_days || 0) | 0);
        const isActive = req.body.is_active === false ? 0 : 1;
        if (!ruleKey || !label || !eventType) return res.status(400).json({ error: 'rule_key, label, event_type zorunlu' });
        await db.query(
            `INSERT INTO crm_score_rules (rule_key, label, event_type, points, decay_days, is_active)
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE label = VALUES(label), event_type = VALUES(event_type),
             points = VALUES(points), decay_days = VALUES(decay_days), is_active = VALUES(is_active)`,
            [ruleKey, label, eventType, points, decay, isActive]
        );
        clearScoreRulesCache();
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/scoring-rules/:id', async (req, res) => {
    try {
        const sets = []; const params = [];
        for (const k of ['label', 'event_type', 'points', 'decay_days']) {
            if (k in req.body) { sets.push(`${k} = ?`); params.push(req.body[k]); }
        }
        if ('is_active' in req.body) { sets.push('is_active = ?'); params.push(req.body.is_active ? 1 : 0); }
        if (!sets.length) return res.status(400).json({ error: 'No fields' });
        params.push(Number(req.params.id));
        await db.query(`UPDATE crm_score_rules SET ${sets.join(', ')} WHERE id = ?`, params);
        clearScoreRulesCache();
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/scoring-rules/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM crm_score_rules WHERE id = ?', [Number(req.params.id)]);
        clearScoreRulesCache();
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Faz 5: Web visits + Smart links ──────────────────────────────────────────
router.get('/contacts/:id/web-visits', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM crm_web_visits WHERE contact_id = ? ORDER BY occurred_at DESC LIMIT 100',
            [Number(req.params.id)]
        );
        res.json({ visits: rows.map(r => ({
            id: Number(r.id), url: r.url, path: r.path, title: r.title,
            referrer: r.referrer, utm_source: r.utm_source, utm_campaign: r.utm_campaign,
            duration_seconds: r.duration_seconds != null ? Number(r.duration_seconds) : null,
            occurred_at: r.occurred_at
        })) });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/smart-links', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM crm_smart_links ORDER BY created_at DESC');
        res.json({ links: rows.map(r => ({
            id: Number(r.id), slug: r.slug, target_url: r.target_url, label: r.label,
            campaign_id: r.campaign_id != null ? Number(r.campaign_id) : null,
            click_count: Number(r.click_count), is_active: Number(r.is_active) === 1,
            expires_at: r.expires_at, created_at: r.created_at
        })) });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/smart-links', async (req, res) => {
    try {
        let slug = String(req.body.slug || '').replace(/[^a-zA-Z0-9_-]/g, '');
        const url = String(req.body.target_url || '').trim();
        const label = String(req.body.label || '').trim();
        if (!slug) slug = Math.random().toString(36).slice(2, 10);
        if (!url || !/^https?:\/\//.test(url)) return res.status(400).json({ error: 'Geçerli target_url zorunlu' });
        try {
            const [r] = await db.query(
                'INSERT INTO crm_smart_links (slug, target_url, label, created_by) VALUES (?, ?, ?, ?)',
                [slug, url, label || null, req.user.id]
            );
            res.status(201).json({ link: { id: r.insertId, slug, target_url: url } });
        } catch (e) {
            if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Bu slug zaten kayıtlı' });
            throw e;
        }
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/smart-links/:id', async (req, res) => {
    try {
        const sets = []; const params = [];
        for (const k of ['target_url', 'label', 'expires_at']) {
            if (k in req.body) { sets.push(`${k} = ?`); params.push(req.body[k]); }
        }
        if ('is_active' in req.body) { sets.push('is_active = ?'); params.push(req.body.is_active ? 1 : 0); }
        if (!sets.length) return res.status(400).json({ error: 'No fields' });
        params.push(Number(req.params.id));
        await db.query(`UPDATE crm_smart_links SET ${sets.join(', ')} WHERE id = ?`, params);
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/smart-links/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM crm_smart_link_clicks WHERE link_id = ?', [Number(req.params.id)]);
        await db.query('DELETE FROM crm_smart_links WHERE id = ?', [Number(req.params.id)]);
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/smart-links/:id', async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT lc.*, c.email FROM crm_smart_link_clicks lc
             LEFT JOIN crm_contacts c ON c.id = lc.contact_id
             WHERE lc.link_id = ? ORDER BY lc.clicked_at DESC LIMIT 100`,
            [Number(req.params.id)]
        );
        res.json({ clicks: rows.map(r => ({
            id: Number(r.id),
            contact_id: r.contact_id != null ? Number(r.contact_id) : null,
            contact_email: r.email || null,
            anonymous_id: r.anonymous_id, ip: r.ip, referrer: r.referrer,
            clicked_at: r.clicked_at
        })) });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Faz 6: Campaigns (read + CRUD; dispatch PHP-side) ────────────────────────
function rowToCampaign(r) {
    let stats = null;
    if (r.stats_json) { try { stats = typeof r.stats_json === 'string' ? JSON.parse(r.stats_json) : r.stats_json; } catch {} }
    let listIds = []; let tagSlugs = [];
    if (r.target_list_ids) { try { listIds = typeof r.target_list_ids === 'string' ? JSON.parse(r.target_list_ids) : r.target_list_ids; } catch {} }
    if (r.target_tag_slugs) { try { tagSlugs = typeof r.target_tag_slugs === 'string' ? JSON.parse(r.target_tag_slugs) : r.target_tag_slugs; } catch {} }
    return {
        id: Number(r.id), name: r.name, description: r.description,
        template_id: r.template_id != null ? Number(r.template_id) : null,
        from_email: r.from_email, from_name: r.from_name,
        subject: r.subject, preview_text: r.preview_text,
        body_html: r.body_html, design_json: r.design_json,
        target_list_ids: listIds, target_tag_slugs: tagSlugs,
        target_status: r.target_status,
        ab_enabled: Number(r.ab_enabled) === 1,
        ab_subject_b: r.ab_subject_b,
        ab_winner_after_hours: Number(r.ab_winner_after_hours),
        ab_winner: r.ab_winner,
        status: r.status,
        scheduled_at: r.scheduled_at, started_at: r.started_at, completed_at: r.completed_at,
        stats, created_at: r.created_at, updated_at: r.updated_at
    };
}

router.get('/campaigns', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM crm_campaigns ORDER BY created_at DESC');
        res.json({ campaigns: rows.map(rowToCampaign) });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/campaigns/:id', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM crm_campaigns WHERE id = ?', [Number(req.params.id)]);
        if (!rows.length) return res.status(404).json({ error: 'Not found' });
        res.json({ campaign: rowToCampaign(rows[0]) });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/campaigns', async (req, res) => {
    try {
        const name = String(req.body.name || '').trim();
        const subject = String(req.body.subject || '').trim();
        if (!name || !subject) return res.status(400).json({ error: 'name ve subject zorunlu' });
        const listIds = (req.body.target_list_ids || []).map(Number).filter(Boolean);
        const tagSlugs = (req.body.target_tag_slugs || []).map(String).filter(Boolean);

        // Auto status: scheduled_at gelecek bir tarihse status='scheduled'
        let scheduledAt = req.body.scheduled_at || null;
        let initialStatus = 'draft';
        if (scheduledAt) {
            const ts = new Date(scheduledAt).getTime();
            if (ts && ts > Date.now()) {
                initialStatus = 'scheduled';
            } else {
                scheduledAt = null;
            }
        }

        const [r] = await db.query(
            `INSERT INTO crm_campaigns
             (name, description, template_id, from_email, from_name, subject, preview_text, body_html, design_json,
              target_list_ids, target_tag_slugs, target_status,
              ab_enabled, ab_subject_b, ab_winner_after_hours,
              scheduled_at, status, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name, req.body.description || null,
                req.body.template_id ? Number(req.body.template_id) : null,
                req.body.from_email || null, req.body.from_name || null,
                subject, req.body.preview_text || null,
                req.body.body_html || null, req.body.design_json || null,
                JSON.stringify(listIds), JSON.stringify(tagSlugs),
                req.body.target_status || 'subscribed',
                req.body.ab_enabled ? 1 : 0,
                req.body.ab_subject_b || null,
                Number(req.body.ab_winner_after_hours || 4),
                scheduledAt, initialStatus,
                req.user.id
            ]
        );
        res.status(201).json({ campaign: { id: r.insertId, name, status: initialStatus } });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Faz 9: Schedule / cancel-schedule
router.post('/campaigns/:id/schedule', async (req, res) => {
    try {
        const scheduledAt = String(req.body.scheduled_at || '').trim();
        if (!scheduledAt) return res.status(400).json({ error: 'scheduled_at zorunlu' });
        const ts = new Date(scheduledAt).getTime();
        if (!ts) return res.status(400).json({ error: 'Geçersiz tarih formatı' });
        if (ts <= Date.now()) return res.status(400).json({ error: 'Zamanlama geçmiş bir tarih olamaz' });

        const [rows] = await db.query('SELECT status FROM crm_campaigns WHERE id = ?', [Number(req.params.id)]);
        if (!rows.length) return res.status(404).json({ error: 'Not found' });
        if (!['draft', 'scheduled', 'paused'].includes(rows[0].status)) {
            return res.status(400).json({ error: `Bu durumdaki (${rows[0].status}) kampanya zamanlanamaz` });
        }

        const isoStr = new Date(ts).toISOString().slice(0, 19).replace('T', ' ');
        await db.query("UPDATE crm_campaigns SET status = 'scheduled', scheduled_at = ? WHERE id = ?", [isoStr, Number(req.params.id)]);
        res.json({ ok: true, status: 'scheduled', scheduled_at: isoStr });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/campaigns/:id/cancel-schedule', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT status FROM crm_campaigns WHERE id = ?', [Number(req.params.id)]);
        if (!rows.length) return res.status(404).json({ error: 'Not found' });
        if (rows[0].status !== 'scheduled') return res.status(400).json({ error: 'Sadece scheduled durumdaki kampanya iptal edilebilir' });
        await db.query("UPDATE crm_campaigns SET status = 'draft', scheduled_at = NULL WHERE id = ?", [Number(req.params.id)]);
        res.json({ ok: true, status: 'draft' });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/campaigns/:id', async (req, res) => {
    try {
        const allowed = ['name', 'description', 'template_id', 'from_email', 'from_name', 'subject', 'preview_text', 'body_html', 'design_json',
                         'target_status', 'ab_subject_b', 'ab_winner_after_hours', 'scheduled_at', 'status'];
        const sets = []; const params = [];
        for (const k of allowed) {
            if (k in req.body) { sets.push(`${k} = ?`); params.push(req.body[k]); }
        }
        if ('ab_enabled' in req.body) { sets.push('ab_enabled = ?'); params.push(req.body.ab_enabled ? 1 : 0); }
        if ('target_list_ids' in req.body) {
            sets.push('target_list_ids = ?');
            params.push(JSON.stringify((req.body.target_list_ids || []).map(Number)));
        }
        if ('target_tag_slugs' in req.body) {
            sets.push('target_tag_slugs = ?');
            params.push(JSON.stringify((req.body.target_tag_slugs || []).map(String)));
        }
        if (!sets.length) return res.status(400).json({ error: 'No fields' });
        params.push(Number(req.params.id));
        await db.query(`UPDATE crm_campaigns SET ${sets.join(', ')} WHERE id = ?`, params);
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/campaigns/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM crm_campaign_recipients WHERE campaign_id = ?', [Number(req.params.id)]);
        await db.query('DELETE FROM crm_campaigns WHERE id = ?', [Number(req.params.id)]);
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/campaigns/:id/recipients', async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT r.*, c.first_name, c.last_name FROM crm_campaign_recipients r
             LEFT JOIN crm_contacts c ON c.id = r.contact_id
             WHERE r.campaign_id = ? ORDER BY r.id DESC LIMIT 200`,
            [Number(req.params.id)]
        );
        res.json({ recipients: rows.map(r => ({
            id: Number(r.id), contact_id: Number(r.contact_id), email: r.email,
            first_name: r.first_name || '', last_name: r.last_name || '',
            ab_variant: r.ab_variant, status: r.status, message_id: r.message_id,
            sent_at: r.sent_at, opened_at: r.opened_at, clicked_at: r.clicked_at, error: r.error
        })) });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/campaigns/:id/report', async (req, res) => {
    try {
        const [[row]] = await db.query(`SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN status='sent' OR opened_at IS NOT NULL OR clicked_at IS NOT NULL THEN 1 ELSE 0 END) AS sent,
            SUM(CASE WHEN status='failed' THEN 1 ELSE 0 END) AS failed,
            SUM(CASE WHEN opened_at IS NOT NULL THEN 1 ELSE 0 END) AS opened,
            SUM(CASE WHEN clicked_at IS NOT NULL THEN 1 ELSE 0 END) AS clicked,
            SUM(CASE WHEN status='bounced' THEN 1 ELSE 0 END) AS bounced,
            SUM(CASE WHEN status='unsubscribed' THEN 1 ELSE 0 END) AS unsubscribed,
            SUM(CASE WHEN ab_variant='A' THEN 1 ELSE 0 END) AS variant_a_count,
            SUM(CASE WHEN ab_variant='B' THEN 1 ELSE 0 END) AS variant_b_count,
            SUM(CASE WHEN ab_variant='A' AND opened_at IS NOT NULL THEN 1 ELSE 0 END) AS variant_a_opened,
            SUM(CASE WHEN ab_variant='B' AND opened_at IS NOT NULL THEN 1 ELSE 0 END) AS variant_b_opened
            FROM crm_campaign_recipients WHERE campaign_id = ?`, [Number(req.params.id)]);
        const total = Number(row.total || 0);
        const sent = Number(row.sent || 0);
        const opened = Number(row.opened || 0);
        const clicked = Number(row.clicked || 0);
        const bounced = Number(row.bounced || 0);
        const aCount = Number(row.variant_a_count || 0);
        const bCount = Number(row.variant_b_count || 0);
        const aOpen = Number(row.variant_a_opened || 0);
        const bOpen = Number(row.variant_b_opened || 0);
        res.json({ report: {
            total, sent, failed: Number(row.failed || 0),
            opened, clicked, bounced, unsubscribed: Number(row.unsubscribed || 0),
            open_rate: sent > 0 ? Math.round((opened / sent) * 1000) / 10 : 0,
            click_rate: sent > 0 ? Math.round((clicked / sent) * 1000) / 10 : 0,
            bounce_rate: total > 0 ? Math.round((bounced / total) * 1000) / 10 : 0,
            variant_a: { sent: aCount, opened: aOpen, open_rate: aCount > 0 ? Math.round((aOpen / aCount) * 1000) / 10 : 0 },
            variant_b: { sent: bCount, opened: bOpen, open_rate: bCount > 0 ? Math.round((bOpen / bCount) * 1000) / 10 : 0 }
        } });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Note: Node tarafı dispatch (Brevo'ya gönderme) PHP-only — `/api/crm/campaigns/:id/send`
// ve `/api/crm/campaigns/:id/dispatch-batch` PHP backend'ine gider.
router.post('/campaigns/:id/send', async (req, res) => {
    res.status(501).json({ error: 'Dispatch PHP backend üzerinden çalışır. PHP API\'yi kullanın.' });
});

// /campaigns/:id/openers-list — bu kampanyayı AÇANLAR için canlı akıllı liste oluştur
// (geçmiş kampanyalar için tek tık). Saf DB işlemi (Brevo yok) → Node'da inline çalışır.
// Idempotent: slug campaign-{id}-opened. Yeni gönderimlerde PHP'nin otomatik kurduğu listenin AYNISI.
router.post('/campaigns/:id/openers-list', async (req, res) => {
    try {
        const cid = Number(req.params.id);
        if (!cid) return res.status(400).json({ error: 'Geçersiz kampanya' });
        const [crows] = await db.query('SELECT id, name FROM crm_campaigns WHERE id = ?', [cid]);
        if (!crows.length) return res.status(404).json({ error: 'Kampanya bulunamadı' });

        const baseName = String(crows[0].name || '').trim() || `Kampanya #${cid}`;
        const listName = baseName.slice(0, 150) + '_opened';
        const slug = `campaign-${cid}-opened`;
        const rules = JSON.stringify({ match: 'all', rules: [{ field: 'opened_campaign', op: 'equals', value: cid }] });

        const desc = `Otomatik: "${baseName}" kampanyasını açan kişiler (canlı).`;
        const [exist] = await db.query('SELECT id FROM crm_lists WHERE slug = ? LIMIT 1', [slug]);
        let listId;
        if (exist.length) {
            listId = Number(exist[0].id);
            await db.query('UPDATE crm_lists SET name = ?, description = ?, rules_json = ? WHERE id = ?', [listName, desc, rules, listId]);
        } else {
            const [r] = await db.query(
                "INSERT INTO crm_lists (slug, name, description, type, rules_json) VALUES (?, ?, ?, 'smart', ?)",
                [slug, listName, desc, rules]
            );
            listId = Number(r.insertId);
        }
        const [oc] = await db.query('SELECT COUNT(*) AS n FROM crm_campaign_recipients WHERE campaign_id = ? AND opened_at IS NOT NULL', [cid]);
        res.json({ ok: true, list: { id: listId, slug, name: listName, type: 'smart' }, opened_count: Number(oc[0]?.n || 0) });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Otomasyon test simülatörü PHP-only (AutomationEngine PHP'de yaşıyor)
router.get('/automation-test/scenarios', async (req, res) => {
    res.status(501).json({ error: 'Test simülatörü PHP backend üzerinden çalışır.' });
});
router.post('/automation-test/run', async (req, res) => {
    res.status(501).json({ error: 'Test simülatörü PHP backend üzerinden çalışır.' });
});

// ─── Faz 7: Forms ─────────────────────────────────────────────────────────────
router.get('/forms', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM crm_forms ORDER BY created_at DESC');
        res.json({ forms: rows.map(r => ({
            id: Number(r.id), slug: r.slug, name: r.name, description: r.description,
            submission_count: Number(r.submission_count),
            double_opt_in: Number(r.double_opt_in) === 1,
            is_active: Number(r.is_active) === 1,
            created_at: r.created_at
        })) });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/forms/:id', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM crm_forms WHERE id = ?', [Number(req.params.id)]);
        if (!rows.length) return res.status(404).json({ error: 'Not found' });
        const r = rows[0];
        const fields = r.fields_json ? (typeof r.fields_json === 'string' ? JSON.parse(r.fields_json) : r.fields_json) : [];
        const actions = r.actions_json ? (typeof r.actions_json === 'string' ? JSON.parse(r.actions_json) : r.actions_json) : [];
        res.json({ form: {
            id: Number(r.id), slug: r.slug, name: r.name, description: r.description,
            fields, actions,
            success_message: r.success_message, success_redirect: r.success_redirect,
            double_opt_in: Number(r.double_opt_in) === 1,
            opt_in_subject: r.opt_in_subject, opt_in_body: r.opt_in_body, opt_in_redirect: r.opt_in_redirect,
            submission_count: Number(r.submission_count),
            is_active: Number(r.is_active) === 1,
            created_at: r.created_at
        } });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/forms', async (req, res) => {
    try {
        const slug = String(req.body.slug || req.body.name || '').toLowerCase().replace(/[^a-z0-9_-]/g, '');
        const name = String(req.body.name || '').trim();
        const fields = Array.isArray(req.body.fields) ? req.body.fields : [];
        if (!slug || !name || !fields.length) return res.status(400).json({ error: 'slug, name ve fields zorunlu' });
        try {
            const [r] = await db.query(
                `INSERT INTO crm_forms
                 (slug, name, description, fields_json, actions_json,
                  success_message, success_redirect,
                  double_opt_in, opt_in_subject, opt_in_body, opt_in_redirect, created_by)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    slug, name, req.body.description || null,
                    JSON.stringify(fields),
                    JSON.stringify(Array.isArray(req.body.actions) ? req.body.actions : []),
                    req.body.success_message || null,
                    req.body.success_redirect || null,
                    req.body.double_opt_in ? 1 : 0,
                    req.body.opt_in_subject || null,
                    req.body.opt_in_body || null,
                    req.body.opt_in_redirect || null,
                    req.user.id
                ]
            );
            res.status(201).json({ form: { id: r.insertId, slug } });
        } catch (e) {
            if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Bu slug zaten kayıtlı' });
            throw e;
        }
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/forms/:id', async (req, res) => {
    try {
        const sets = []; const params = [];
        for (const k of ['name', 'description', 'success_message', 'success_redirect', 'opt_in_subject', 'opt_in_body', 'opt_in_redirect']) {
            if (k in req.body) { sets.push(`${k} = ?`); params.push(req.body[k]); }
        }
        if ('fields' in req.body && Array.isArray(req.body.fields)) {
            sets.push('fields_json = ?'); params.push(JSON.stringify(req.body.fields));
        }
        if ('actions' in req.body && Array.isArray(req.body.actions)) {
            sets.push('actions_json = ?'); params.push(JSON.stringify(req.body.actions));
        }
        if ('double_opt_in' in req.body) { sets.push('double_opt_in = ?'); params.push(req.body.double_opt_in ? 1 : 0); }
        if ('is_active' in req.body) { sets.push('is_active = ?'); params.push(req.body.is_active ? 1 : 0); }
        if (!sets.length) return res.status(400).json({ error: 'No fields' });
        params.push(Number(req.params.id));
        await db.query(`UPDATE crm_forms SET ${sets.join(', ')} WHERE id = ?`, params);
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/forms/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM crm_form_submissions WHERE form_id = ?', [Number(req.params.id)]);
        await db.query('DELETE FROM crm_forms WHERE id = ?', [Number(req.params.id)]);
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/forms/:id/submissions', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM crm_form_submissions WHERE form_id = ? ORDER BY created_at DESC LIMIT 200',
            [Number(req.params.id)]
        );
        res.json({ submissions: rows.map(r => {
            let data = null;
            if (r.data_json) { try { data = typeof r.data_json === 'string' ? JSON.parse(r.data_json) : r.data_json; } catch {} }
            return {
                id: Number(r.id),
                contact_id: r.contact_id != null ? Number(r.contact_id) : null,
                email: r.email, data, status: r.status,
                confirmed_at: r.confirmed_at, created_at: r.created_at
            };
        }) });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Faz 8: CSV import / export ───────────────────────────────────────────────
function parseCsvLine(line) {
    const result = [];
    let cur = ''; let inQ = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') inQ = !inQ;
        else if (ch === ',' && !inQ) { result.push(cur); cur = ''; }
        else cur += ch;
    }
    result.push(cur);
    return result;
}

router.post('/csv-preview', async (req, res) => {
    try {
        const csv = String(req.body.csv || '');
        if (!csv) return res.status(400).json({ error: 'csv body required' });
        const lines = csv.split(/\r\n|\n|\r/).filter(l => l.trim() !== '');
        if (!lines.length) return res.json({ headers: [], rows: [], total: 0 });
        const headers = parseCsvLine(lines.shift());
        const rows = lines.slice(0, 10).map(parseCsvLine);
        res.json({ headers, rows, total: lines.length });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/csv-import', async (req, res) => {
    try {
        const csv = String(req.body.csv || '');
        const mapping = req.body.mapping || {};
        if (!csv || !Object.keys(mapping).length) return res.status(400).json({ error: 'csv ve mapping gerekli' });
        if (mapping.email == null) return res.status(400).json({ error: 'email mapping zorunlu' });

        const tagSlugs = Array.isArray(req.body.tag_slugs) ? req.body.tag_slugs : [];
        const listIds = Array.isArray(req.body.list_ids) ? req.body.list_ids.map(Number).filter(Boolean) : [];
        const status = ['subscribed','unsubscribed','bounced','complained','pending'].includes(req.body.status) ? req.body.status : 'subscribed';
        const source = String(req.body.source || 'csv_import');
        const updateExisting = !!req.body.update_existing;

        // Resolve tag IDs
        const tagIds = [];
        if (tagSlugs.length) {
            const [tagRows] = await db.query(`SELECT id, slug FROM crm_tags WHERE slug IN (?)`, [tagSlugs]);
            for (const r of tagRows) tagIds.push(Number(r.id));
        }

        const stats = { inserted: 0, updated: 0, skipped: 0, errors: [] };
        const lines = csv.split(/\r\n|\n|\r/).filter(l => l.trim() !== '');
        if (lines.length < 2) {
            stats.errors.push('CSV boş veya başlık satırı yok');
            return res.json({ ok: false, stats });
        }
        const headers = parseCsvLine(lines.shift());

        const colIdx = {};
        for (const [field, col] of Object.entries(mapping)) {
            colIdx[field] = typeof col === 'number' ? col : headers.indexOf(col);
        }

        let rowNum = 1;
        for (const line of lines) {
            rowNum++;
            const cols = parseCsvLine(line);
            const email = String(cols[colIdx.email] || '').toLowerCase().trim();
            if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
                stats.skipped++;
                if (stats.errors.length < 30) stats.errors.push(`Satır ${rowNum}: geçersiz email`);
                continue;
            }
            const firstName = colIdx.first_name != null ? String(cols[colIdx.first_name] || '').trim() : '';
            const lastName = colIdx.last_name != null ? String(cols[colIdx.last_name] || '').trim() : '';
            const phone = colIdx.phone != null ? String(cols[colIdx.phone] || '').trim() : '';
            const company = colIdx.company != null ? String(cols[colIdx.company] || '').trim() : '';

            const [existing] = await db.query('SELECT id FROM crm_contacts WHERE email = ?', [email]);
            if (existing.length && !updateExisting) { stats.skipped++; }
            else {
                try {
                    await db.query(
                        `INSERT INTO crm_contacts (email, first_name, last_name, phone, company, source, status)
                         VALUES (?, ?, ?, ?, ?, ?, ?)
                         ON DUPLICATE KEY UPDATE
                            first_name = COALESCE(NULLIF(VALUES(first_name), ''), crm_contacts.first_name),
                            last_name = COALESCE(NULLIF(VALUES(last_name), ''), crm_contacts.last_name),
                            phone = COALESCE(NULLIF(VALUES(phone), ''), crm_contacts.phone),
                            company = COALESCE(NULLIF(VALUES(company), ''), crm_contacts.company)`,
                        [email, firstName, lastName, phone, company, source, status]
                    );
                    if (existing.length) stats.updated++; else stats.inserted++;
                } catch (e) {
                    stats.errors.push(`Satır ${rowNum}: ${e.message}`);
                    stats.skipped++; continue;
                }
            }

            const [c] = await db.query('SELECT id FROM crm_contacts WHERE email = ?', [email]);
            const contactId = c.length ? Number(c[0].id) : null;
            if (!contactId) continue;

            for (const tid of tagIds) {
                try { await db.query('INSERT IGNORE INTO crm_contact_tags (contact_id, tag_id) VALUES (?, ?)', [contactId, tid]); } catch {}
            }
            for (const lid of listIds) {
                try { await db.query('INSERT IGNORE INTO crm_list_contacts (list_id, contact_id) VALUES (?, ?)', [lid, contactId]); } catch {}
            }
        }

        if (tagIds.length) {
            try { await db.query('UPDATE crm_tags SET contact_count = (SELECT COUNT(*) FROM crm_contact_tags WHERE tag_id = crm_tags.id)'); } catch {}
        }
        if (listIds.length) {
            try { await db.query("UPDATE crm_lists SET contact_count = (SELECT COUNT(*) FROM crm_list_contacts WHERE list_id = crm_lists.id) WHERE type = 'static'"); } catch {}
        }

        res.json({ ok: true, stats });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Faz 9: Dashboard + Funnels ───────────────────────────────────────────────
async function buildFunnelStepSql(step, cumulativeIds, rangeDays) {
    let sql = 'SELECT c.id FROM crm_contacts c WHERE 1=1';
    const params = [];
    switch (step.type) {
        case 'tag':
            sql += ` AND EXISTS (SELECT 1 FROM crm_contact_tags ct JOIN crm_tags t ON t.id = ct.tag_id WHERE ct.contact_id = c.id AND t.slug = ?)`;
            params.push(String(step.value)); break;
        case 'list':
            sql += ` AND EXISTS (SELECT 1 FROM crm_list_contacts lc WHERE lc.contact_id = c.id AND lc.list_id = ?)`;
            params.push(Number(step.value)); break;
        case 'event':
            sql += ` AND EXISTS (SELECT 1 FROM crm_activity_log al WHERE al.contact_id = c.id AND al.type LIKE ? AND al.occurred_at >= DATE_SUB(NOW(), INTERVAL ? DAY))`;
            params.push(String(step.value) + '%', rangeDays); break;
        case 'status':
            sql += ` AND c.status = ?`; params.push(String(step.value)); break;
        case 'min_score':
            sql += ` AND c.score >= ?`; params.push(Number(step.value)); break;
        default: return null;
    }
    if (cumulativeIds && cumulativeIds.length) {
        sql += ` AND c.id IN (?)`;
        params.push(cumulativeIds);
    }
    return { sql, params };
}

async function computeFunnel(steps, rangeDays = 30) {
    const results = [];
    let cumulative = null;
    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const built = await buildFunnelStepSql(step, cumulative, rangeDays);
        if (!built) continue;
        let count = 0; let ids = [];
        if (cumulative !== null && cumulative.length === 0) {
            count = 0;
        } else {
            const [rows] = await db.query(built.sql, built.params);
            ids = rows.map(r => Number(r.id));
            count = ids.length;
        }
        const firstCount = results.length ? results[0].count : count;
        const prevCount = results.length ? results[results.length - 1].count : count;
        results.push({
            idx: i,
            label: step.label || step.type,
            type: step.type,
            count,
            rate_from_first: firstCount > 0 ? Math.round((count / firstCount) * 1000) / 10 : 100,
            rate_from_prev: prevCount > 0 ? Math.round((count / prevCount) * 1000) / 10 : 100,
            drop_from_prev: prevCount > 0 ? prevCount - count : 0
        });
        cumulative = ids;
    }
    return results;
}

router.get('/dashboard', async (req, res) => {
    try {
        const stats = {
            contacts: { total: 0, subscribed: 0, unsubscribed: 0, bounced: 0, pending: 0 },
            growth_30d: 0, growth_7d: 0,
            top_sources: [], top_tags: [], list_health: [],
            campaigns: { total: 0, sent: 0, avg_open_rate: 0, avg_click_rate: 0 },
            recent_campaigns: [],
            forms: { total: 0, submissions_30d: 0, top_forms: [] },
            activity_30d: { email_events: 0, orders: 0, consents: 0, web_visits: 0, form_submissions: 0 },
            score_distribution: { cold: 0, warm: 0, hot: 0 },
            growth_timeseries: []
        };

        const [byStatus] = await db.query('SELECT status, COUNT(*) c FROM crm_contacts GROUP BY status');
        for (const r of byStatus) stats.contacts[r.status] = Number(r.c);
        const [[{ total }]] = await db.query('SELECT COUNT(*) AS total FROM crm_contacts');
        stats.contacts.total = Number(total);

        const [[{ g30 }]] = await db.query("SELECT COUNT(*) AS g30 FROM crm_contacts WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)");
        const [[{ g7 }]] = await db.query("SELECT COUNT(*) AS g7 FROM crm_contacts WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)");
        stats.growth_30d = Number(g30); stats.growth_7d = Number(g7);

        const [sources] = await db.query('SELECT source, COUNT(*) c FROM crm_contacts GROUP BY source ORDER BY c DESC LIMIT 6');
        stats.top_sources = sources.map(r => ({ source: r.source, count: Number(r.c) }));

        const [tags] = await db.query('SELECT name, slug, color, contact_count FROM crm_tags WHERE contact_count > 0 ORDER BY contact_count DESC LIMIT 10');
        stats.top_tags = tags.map(t => ({ name: t.name, slug: t.slug, color: t.color, count: Number(t.contact_count) }));

        const [lists] = await db.query(`
            SELECT l.id, l.name, l.type, l.contact_count,
                   (SELECT COUNT(*) FROM crm_list_contacts lc JOIN crm_contacts c ON c.id = lc.contact_id
                    WHERE lc.list_id = l.id AND c.status = 'subscribed') AS deliverable
            FROM crm_lists l ORDER BY l.contact_count DESC LIMIT 10`);
        stats.list_health = lists.map(r => {
            const count = Number(r.contact_count); const deliv = Number(r.deliverable);
            return { id: Number(r.id), name: r.name, type: r.type, count, deliverable: deliv, health: count > 0 ? Math.round((deliv / count) * 100) : 100 };
        });

        const [[campaigns]] = await db.query(`SELECT
            (SELECT COUNT(*) FROM crm_campaigns) AS total,
            (SELECT COUNT(*) FROM crm_campaigns WHERE status='sent') AS sent`);
        stats.campaigns.total = Number(campaigns.total); stats.campaigns.sent = Number(campaigns.sent);

        const [[recip]] = await db.query(`SELECT
            SUM(CASE WHEN opened_at IS NOT NULL THEN 1 ELSE 0 END) AS opened,
            SUM(CASE WHEN clicked_at IS NOT NULL THEN 1 ELSE 0 END) AS clicked,
            SUM(CASE WHEN status='sent' OR opened_at IS NOT NULL THEN 1 ELSE 0 END) AS sent
            FROM crm_campaign_recipients`);
        const sentN = Number(recip.sent || 0);
        stats.campaigns.avg_open_rate = sentN > 0 ? Math.round((Number(recip.opened) / sentN) * 1000) / 10 : 0;
        stats.campaigns.avg_click_rate = sentN > 0 ? Math.round((Number(recip.clicked) / sentN) * 1000) / 10 : 0;

        const [recentCamps] = await db.query('SELECT id, name, subject, status, completed_at FROM crm_campaigns ORDER BY created_at DESC LIMIT 5');
        stats.recent_campaigns = recentCamps.map(r => ({
            id: Number(r.id), name: r.name, subject: r.subject, status: r.status, completed_at: r.completed_at
        }));

        const [[formStats]] = await db.query(`SELECT
            (SELECT COUNT(*) FROM crm_forms WHERE is_active=1) AS total,
            (SELECT COUNT(*) FROM crm_form_submissions WHERE status='confirmed' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) AS subs_30`);
        stats.forms.total = Number(formStats.total); stats.forms.submissions_30d = Number(formStats.subs_30);
        const [topForms] = await db.query('SELECT id, slug, name, submission_count FROM crm_forms WHERE is_active=1 ORDER BY submission_count DESC LIMIT 5');
        stats.forms.top_forms = topForms.map(f => ({ id: Number(f.id), slug: f.slug, name: f.name, count: Number(f.submission_count) }));

        const [[act]] = await db.query(`SELECT
            (SELECT COUNT(*) FROM crm_email_tracking WHERE occurred_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) AS email_events,
            (SELECT COUNT(*) FROM crm_activity_log WHERE type LIKE 'order%' AND occurred_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) AS orders,
            (SELECT COUNT(*) FROM crm_activity_log WHERE type LIKE 'consent%' AND occurred_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) AS consents,
            (SELECT COUNT(*) FROM crm_web_visits WHERE occurred_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) AS web_visits,
            (SELECT COUNT(*) FROM crm_form_submissions WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) AS form_submissions`);
        stats.activity_30d = {
            email_events: Number(act.email_events), orders: Number(act.orders),
            consents: Number(act.consents), web_visits: Number(act.web_visits),
            form_submissions: Number(act.form_submissions)
        };

        const [[score]] = await db.query(`SELECT
            (SELECT COUNT(*) FROM crm_contacts WHERE score <= 0) AS cold,
            (SELECT COUNT(*) FROM crm_contacts WHERE score > 0 AND score <= 10) AS warm,
            (SELECT COUNT(*) FROM crm_contacts WHERE score > 10) AS hot`);
        stats.score_distribution = { cold: Number(score.cold), warm: Number(score.warm), hot: Number(score.hot) };

        const growthDays = Math.max(7, Math.min(180, Number(req.query.growth_days || 30)));
        const [series] = await db.query(`
            SELECT DATE(created_at) AS d, COUNT(*) c FROM crm_contacts
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY DATE(created_at) ORDER BY d ASC`, [growthDays]);
        stats.growth_timeseries = series.map(r => ({ date: r.d, count: Number(r.c) }));

        res.json({ stats });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/funnels', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM crm_funnels ORDER BY created_at DESC');
        res.json({ funnels: rows.map(r => {
            const steps = r.steps_json ? (typeof r.steps_json === 'string' ? JSON.parse(r.steps_json) : r.steps_json) : [];
            return {
                id: Number(r.id), slug: r.slug, name: r.name, description: r.description,
                steps, is_active: Number(r.is_active) === 1, created_at: r.created_at
            };
        }) });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/funnels', async (req, res) => {
    try {
        const slug = String(req.body.slug || req.body.name || '').toLowerCase().replace(/[^a-z0-9_-]/g, '');
        const name = String(req.body.name || '').trim();
        const steps = Array.isArray(req.body.steps) ? req.body.steps : [];
        if (!slug || !name || !steps.length) return res.status(400).json({ error: 'slug, name ve steps zorunlu' });
        try {
            const [r] = await db.query(
                'INSERT INTO crm_funnels (slug, name, description, steps_json, created_by) VALUES (?, ?, ?, ?, ?)',
                [slug, name, req.body.description || null, JSON.stringify(steps), req.user.id]
            );
            res.status(201).json({ funnel: { id: r.insertId, slug } });
        } catch (e) {
            if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Bu slug zaten var' });
            throw e;
        }
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/funnels/:id', async (req, res) => {
    try {
        const sets = []; const params = [];
        for (const k of ['name', 'description']) {
            if (k in req.body) { sets.push(`${k} = ?`); params.push(req.body[k]); }
        }
        if ('steps' in req.body && Array.isArray(req.body.steps)) {
            sets.push('steps_json = ?'); params.push(JSON.stringify(req.body.steps));
        }
        if ('is_active' in req.body) { sets.push('is_active = ?'); params.push(req.body.is_active ? 1 : 0); }
        if (!sets.length) return res.status(400).json({ error: 'No fields' });
        params.push(Number(req.params.id));
        await db.query(`UPDATE crm_funnels SET ${sets.join(', ')} WHERE id = ?`, params);
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/funnels/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM crm_funnels WHERE id = ?', [Number(req.params.id)]);
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/funnels/:id/compute', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT steps_json FROM crm_funnels WHERE id = ?', [Number(req.params.id)]);
        if (!rows.length) return res.status(404).json({ error: 'Not found' });
        const steps = typeof rows[0].steps_json === 'string' ? JSON.parse(rows[0].steps_json) : rows[0].steps_json;
        const rangeDays = Math.max(1, Math.min(365, Number(req.query.range_days || 30)));
        const result = await computeFunnel(steps || [], rangeDays);
        res.json({ steps: result, range_days: rangeDays });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/funnels/preview', async (req, res) => {
    try {
        const steps = Array.isArray(req.body.steps) ? req.body.steps : [];
        const rangeDays = Math.max(1, Math.min(365, Number(req.body.range_days || 30)));
        const result = await computeFunnel(steps, rangeDays);
        res.json({ steps: result, range_days: rangeDays });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/csv-export', async (req, res) => {
    try {
        const where = []; const params = [];
        if (req.query.status) { where.push('status = ?'); params.push(req.query.status); }
        if (req.query.source) { where.push('source = ?'); params.push(req.query.source); }
        if (req.query.min_score) { where.push('score >= ?'); params.push(Number(req.query.min_score)); }
        if (req.query.list_id) {
            where.push('id IN (SELECT contact_id FROM crm_list_contacts WHERE list_id = ?)');
            params.push(Number(req.query.list_id));
        }
        if (req.query.tag_slug) {
            where.push("id IN (SELECT contact_id FROM crm_contact_tags ct JOIN crm_tags t ON t.id = ct.tag_id WHERE t.slug = ?)");
            params.push(req.query.tag_slug);
        }
        const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
        const [rows] = await db.query(
            `SELECT email, first_name, last_name, phone, company, status, source, score, last_activity_at, created_at
             FROM crm_contacts ${whereSql} ORDER BY id ASC`,
            params
        );

        const escape = v => {
            if (v == null) return '';
            const s = String(v);
            return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        };
        const lines = ['email,first_name,last_name,phone,company,status,source,score,last_activity_at,created_at'];
        for (const r of rows) {
            lines.push([r.email, r.first_name, r.last_name, r.phone, r.company, r.status, r.source, r.score, r.last_activity_at, r.created_at].map(escape).join(','));
        }
        const csv = lines.join('\n');
        res.set('Content-Type', 'text/csv; charset=utf-8');
        res.set('Content-Disposition', `attachment; filename="crm-contacts-${new Date().toISOString().slice(0, 10)}.csv"`);
        res.send(csv);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/email-tracking', async (req, res) => {
    try {
        const limit = Math.min(500, Math.max(20, Number(req.query.limit || 100)));
        const event = String(req.query.event || '').trim();
        let where = ''; const params = [];
        if (event) { where = 'WHERE event = ?'; params.push(event); }
        const [rows] = await db.query(
            `SELECT t.*, c.email AS contact_email, c.first_name, c.last_name
             FROM crm_email_tracking t LEFT JOIN crm_contacts c ON c.id = t.contact_id
             ${where} ORDER BY t.occurred_at DESC LIMIT ?`,
            [...params, limit]
        );
        res.json({ events: rows.map(r => ({
            id: Number(r.id), contact_id: r.contact_id != null ? Number(r.contact_id) : null,
            contact_email: r.contact_email || r.email, event: r.event,
            message_id: r.message_id, link_url: r.link_url, reason: r.reason,
            occurred_at: r.occurred_at
        })) });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/lists/:id/remove', async (req, res) => {
    try {
        const contactIds = (req.body.contact_ids || []).map(Number).filter(Boolean);
        if (!contactIds.length) return res.status(400).json({ error: 'contact_ids gerekli' });
        await db.query(
            'DELETE FROM crm_list_contacts WHERE list_id = ? AND contact_id IN (?)',
            [Number(req.params.id), contactIds]
        );
        await recountListContacts(Number(req.params.id));
        res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
