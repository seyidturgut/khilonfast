<?php
// api/services/CrmSchema.php
// CRM modülü idempotent şema kurulumu — admin.php ve crm.php tarafından kullanılır.

if (!function_exists('ensureCrmContactsSchema')) {
/**
 * CRM Faz 1 — Contacts Foundation
 * Idempotent — her admin/crm entry'sinde güvenle çağrılır.
 */
function ensureCrmContactsSchema(PDO $db): void
{
    $db->exec("CREATE TABLE IF NOT EXISTS crm_contacts (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    // Idempotent ALTER — eski deploy'lar için
    $cols = [];
    try {
        foreach ($db->query("SHOW COLUMNS FROM crm_contacts") as $r) {
            $cols[strtolower($r['Field'])] = true;
        }
    } catch (Throwable $e) { /* ignore */ }
    if (!isset($cols['ltv_currency'])) {
        try { $db->exec("ALTER TABLE crm_contacts ADD COLUMN ltv_currency VARCHAR(8) NOT NULL DEFAULT 'TRY' AFTER ltv"); } catch (Throwable $e) {}
    }

    $db->exec("CREATE TABLE IF NOT EXISTS crm_custom_fields (
        id INT AUTO_INCREMENT PRIMARY KEY,
        field_key VARCHAR(64) NOT NULL,
        label VARCHAR(255) NOT NULL,
        type ENUM('text','textarea','number','select','multi_select','date','checkbox') NOT NULL DEFAULT 'text',
        options_json JSON NULL,
        sort_order INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_field_key (field_key)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    // ─── Faz 2: Tags + Lists ──────────────────────────────────────────────
    $db->exec("CREATE TABLE IF NOT EXISTS crm_tags (
        id INT AUTO_INCREMENT PRIMARY KEY,
        slug VARCHAR(64) NOT NULL,
        name VARCHAR(120) NOT NULL,
        color VARCHAR(16) NOT NULL DEFAULT '#2563eb',
        description VARCHAR(255) NULL,
        contact_count INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_slug (slug)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $db->exec("CREATE TABLE IF NOT EXISTS crm_contact_tags (
        contact_id BIGINT NOT NULL,
        tag_id INT NOT NULL,
        added_by INT NULL,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (contact_id, tag_id),
        KEY idx_tag (tag_id),
        KEY idx_added_at (added_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $db->exec("CREATE TABLE IF NOT EXISTS crm_lists (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $db->exec("CREATE TABLE IF NOT EXISTS crm_list_contacts (
        list_id INT NOT NULL,
        contact_id BIGINT NOT NULL,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (list_id, contact_id),
        KEY idx_contact (contact_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    // ─── Faz 4: Email Tracking + Lead Scoring ─────────────────────────────
    $db->exec("CREATE TABLE IF NOT EXISTS crm_email_tracking (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $db->exec("CREATE TABLE IF NOT EXISTS crm_score_rules (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $db->exec("CREATE TABLE IF NOT EXISTS crm_score_history (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    // Default scoring rules — yalnızca tablo boşsa
    try {
        $count = (int)$db->query('SELECT COUNT(*) FROM crm_score_rules')->fetchColumn();
        if ($count === 0) {
            $defaults = [
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
            $stmt = $db->prepare('INSERT INTO crm_score_rules (rule_key, label, event_type, points, decay_days) VALUES (?, ?, ?, ?, ?)');
            foreach ($defaults as $r) $stmt->execute($r);
        }
    } catch (Throwable $e) { error_log('[crm-schema] score rules seed: ' . $e->getMessage()); }

    // ─── Faz 9: Funnels ───────────────────────────────────────────────────
    $db->exec("CREATE TABLE IF NOT EXISTS crm_funnels (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    // ─── Faz 7: Forms + Double Opt-In ─────────────────────────────────────
    $db->exec("CREATE TABLE IF NOT EXISTS crm_forms (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $db->exec("CREATE TABLE IF NOT EXISTS crm_form_submissions (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    // ─── Faz 6: Campaigns + A/B ───────────────────────────────────────────
    $db->exec("CREATE TABLE IF NOT EXISTS crm_campaigns (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    // Idempotent ALTER — Unlayer design_json sütunu eski deploy'larda yoksa ekle
    try {
        $cols = [];
        foreach ($db->query("SHOW COLUMNS FROM crm_campaigns") as $r) $cols[strtolower($r['Field'])] = true;
        if (!isset($cols['design_json'])) {
            $db->exec("ALTER TABLE crm_campaigns ADD COLUMN design_json LONGTEXT NULL AFTER body_html");
        }
        if (!isset($cols['preview_text'])) {
            $db->exec("ALTER TABLE crm_campaigns ADD COLUMN preview_text VARCHAR(500) NULL AFTER subject");
        }
    } catch (Throwable $e) { /* ignore — table not created yet */ }

    $db->exec("CREATE TABLE IF NOT EXISTS crm_campaign_recipients (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    // ─── Faz 5: Web Tracking + Smart Links ────────────────────────────────
    $db->exec("CREATE TABLE IF NOT EXISTS crm_web_visits (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $db->exec("CREATE TABLE IF NOT EXISTS crm_smart_links (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $db->exec("CREATE TABLE IF NOT EXISTS crm_smart_link_clicks (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    // ─── Faz 3: Activity Log ──────────────────────────────────────────────
    // Denormalize aktivite snapshot — email_events, orders, consent_logs,
    // onboarding_forms, consultant_bookings vb. olayları tek yerde tutar.
    $db->exec("CREATE TABLE IF NOT EXISTS crm_activity_log (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
}
}

if (!function_exists('crmRecountTagContacts')) {
function crmRecountTagContacts(PDO $db, ?int $tagId = null): void
{
    $where = $tagId ? "WHERE id = " . (int)$tagId : "";
    $db->exec("UPDATE crm_tags SET contact_count = (
        SELECT COUNT(*) FROM crm_contact_tags WHERE tag_id = crm_tags.id
    ) $where");
}
}

if (!function_exists('crmRecountListContacts')) {
function crmRecountListContacts(PDO $db, ?int $listId = null): void
{
    $where = $listId ? "WHERE id = " . (int)$listId : "";
    $db->exec("UPDATE crm_lists SET contact_count = (
        SELECT COUNT(*) FROM crm_list_contacts WHERE list_id = crm_lists.id
    ) $where AND type = 'static'");
}
}

if (!function_exists('runCrmContactsBackfill')) {
/**
 * CRM backfill — mevcut users + email_events + orders email'lerini crm_contacts'a yükler.
 * Idempotent: ON DUPLICATE KEY UPDATE ile çoklu çağrılarda mevcut kayıtları korur.
 */
function runCrmContactsBackfill(PDO $db): array
{
    $stats = ['users' => 0, 'email_events' => 0, 'orders' => 0, 'total_after' => 0];

    // 1. users → crm_contacts
    try {
        $sql = "INSERT INTO crm_contacts (user_id, email, first_name, last_name, phone, source, status, created_at)
                SELECT u.id, u.email, u.first_name, u.last_name, u.phone, 'user_account', 'subscribed', u.created_at
                FROM users u
                WHERE u.email IS NOT NULL AND u.email <> ''
                ON DUPLICATE KEY UPDATE
                    user_id = COALESCE(crm_contacts.user_id, VALUES(user_id)),
                    first_name = COALESCE(NULLIF(crm_contacts.first_name, ''), VALUES(first_name)),
                    last_name = COALESCE(NULLIF(crm_contacts.last_name, ''), VALUES(last_name)),
                    phone = COALESCE(NULLIF(crm_contacts.phone, ''), VALUES(phone))";
        $stats['users'] = $db->exec($sql) ?: 0;
    } catch (Throwable $e) { error_log('[crm-backfill] users: ' . $e->getMessage()); }

    // 2. email_events → crm_contacts (anonymous lead'ler)
    try {
        $sql = "INSERT INTO crm_contacts (email, source, status, created_at)
                SELECT e.email, 'email_event', 'subscribed', MIN(e.created_at)
                FROM email_events e
                WHERE e.email IS NOT NULL AND e.email <> ''
                GROUP BY e.email
                ON DUPLICATE KEY UPDATE crm_contacts.id = crm_contacts.id";
        $stats['email_events'] = $db->exec($sql) ?: 0;
    } catch (Throwable $e) { error_log('[crm-backfill] email_events: ' . $e->getMessage()); }

    // 3. orders.email DISTINCT → crm_contacts
    try {
        $hasOrderEmail = false;
        try {
            $col = $db->query("SHOW COLUMNS FROM orders LIKE 'email'");
            $hasOrderEmail = (bool)$col->fetch();
        } catch (Throwable $e) {}
        if ($hasOrderEmail) {
            $sql = "INSERT INTO crm_contacts (email, source, status, created_at)
                    SELECT o.email, 'order', 'subscribed', MIN(o.created_at)
                    FROM orders o
                    WHERE o.email IS NOT NULL AND o.email <> ''
                    GROUP BY o.email
                    ON DUPLICATE KEY UPDATE crm_contacts.id = crm_contacts.id";
            $stats['orders'] = $db->exec($sql) ?: 0;
        }
    } catch (Throwable $e) { error_log('[crm-backfill] orders: ' . $e->getMessage()); }

    // last_activity_at güncelleme — email_events'den max created_at
    try {
        $db->exec("UPDATE crm_contacts c
                   LEFT JOIN (SELECT email, MAX(created_at) AS last_at FROM email_events GROUP BY email) e ON e.email = c.email
                   SET c.last_activity_at = e.last_at
                   WHERE e.last_at IS NOT NULL AND (c.last_activity_at IS NULL OR e.last_at > c.last_activity_at)");
    } catch (Throwable $e) { /* ignore */ }

    try {
        $stats['total_after'] = (int)$db->query("SELECT COUNT(*) FROM crm_contacts")->fetchColumn();
    } catch (Throwable $e) {}

    return $stats;
}
}
