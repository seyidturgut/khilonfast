<?php
// api/services/CrmActivityRecorder.php
// Birleşik aktivite log helper'ı. Yeni event'ler bu helper üzerinden eklenir.
// Backfill fonksiyonu mevcut tablolardan (email_events, orders, consent_logs,
// onboarding_forms, consultant_bookings) crm_activity_log'a snapshot çeker.

if (!function_exists('crmFindContactIdByEmail')) {
function crmFindContactIdByEmail(PDO $db, string $email): ?int
{
    $email = strtolower(trim($email));
    if ($email === '') return null;
    $stmt = $db->prepare("SELECT id FROM crm_contacts WHERE email = ? LIMIT 1");
    $stmt->execute([$email]);
    $id = $stmt->fetchColumn();
    return $id ? (int)$id : null;
}
}

if (!function_exists('crmFindContactIdByUserId')) {
function crmFindContactIdByUserId(PDO $db, int $userId): ?int
{
    $stmt = $db->prepare("SELECT id FROM crm_contacts WHERE user_id = ? LIMIT 1");
    $stmt->execute([$userId]);
    $id = $stmt->fetchColumn();
    return $id ? (int)$id : null;
}
}

if (!function_exists('crmRecordActivity')) {
/**
 * Tek bir aktivite kaydı insert et.
 * @param int $contactId
 * @param string $type   örn. 'email_event','order_completed','consent_given','onboarding_submitted','booking_created'
 * @param string $title  insanın okuyacağı kısa metin
 * @param array  $opts   ['ref_type'=>'order','ref_id'=>123,'metadata'=>[...],'occurred_at'=>'YYYY-MM-DD HH:MM:SS']
 */
function crmRecordActivity(PDO $db, int $contactId, string $type, string $title, array $opts = []): void
{
    if ($contactId <= 0) return;
    $refType = $opts['ref_type'] ?? null;
    $refId = isset($opts['ref_id']) ? (int)$opts['ref_id'] : null;
    $metadata = isset($opts['metadata']) && is_array($opts['metadata']) ? json_encode($opts['metadata']) : null;
    $occurredAt = $opts['occurred_at'] ?? date('Y-m-d H:i:s');

    // Idempotency: aynı (contact, type, ref_type, ref_id) varsa atla
    if ($refType !== null && $refId !== null) {
        $check = $db->prepare("SELECT id FROM crm_activity_log
            WHERE contact_id = ? AND type = ? AND ref_type = ? AND ref_id = ? LIMIT 1");
        $check->execute([$contactId, $type, $refType, $refId]);
        if ($check->fetchColumn()) return;
    }

    try {
        $stmt = $db->prepare("INSERT INTO crm_activity_log
            (contact_id, type, title, ref_type, ref_id, metadata, occurred_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$contactId, $type, $title, $refType, $refId, $metadata, $occurredAt]);
        // last_activity_at güncelle
        $db->prepare("UPDATE crm_contacts SET last_activity_at = ? WHERE id = ? AND (last_activity_at IS NULL OR last_activity_at < ?)")
            ->execute([$occurredAt, $contactId, $occurredAt]);
    } catch (Throwable $e) {
        error_log('[crm-activity] record: ' . $e->getMessage());
    }
}
}

if (!function_exists('runCrmActivityBackfill')) {
/**
 * Mevcut tablolardan crm_activity_log'a tarihsel snapshot al.
 * Idempotent: ON DUPLICATE / EXISTS koruması.
 */
function runCrmActivityBackfill(PDO $db): array
{
    $stats = [
        'email_events' => 0,
        'orders' => 0,
        'consent_logs' => 0,
        'onboarding_forms' => 0,
        'consultant_bookings' => 0,
        'total_after' => 0,
    ];

    // ─── email_events ───
    try {
        $sql = "INSERT INTO crm_activity_log (contact_id, type, title, ref_type, ref_id, metadata, occurred_at)
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
                LEFT JOIN crm_activity_log al
                       ON al.contact_id = c.id AND al.ref_type = 'email_event' AND al.ref_id = e.id
                WHERE al.id IS NULL";
        $stats['email_events'] = $db->exec($sql) ?: 0;
    } catch (Throwable $e) { error_log('[crm-activity-backfill] email_events: ' . $e->getMessage()); }

    // ─── orders ───
    try {
        $hasOrderEmail = false;
        try {
            $col = $db->query("SHOW COLUMNS FROM orders LIKE 'email'");
            $hasOrderEmail = (bool)$col->fetch();
        } catch (Throwable $e) {}

        $joinExpr = $hasOrderEmail
            ? "(c.user_id = o.user_id OR c.email = o.email)"
            : "c.user_id = o.user_id";

        $sql = "INSERT INTO crm_activity_log (contact_id, type, title, ref_type, ref_id, metadata, occurred_at)
                SELECT c.id,
                       CASE
                         WHEN o.status = 'completed' THEN 'order_completed'
                         WHEN o.status = 'pending' THEN 'order_created'
                         ELSE CONCAT('order_', o.status)
                       END,
                       CONCAT('Sipariş #', o.order_number, ' — ', UPPER(LEFT(o.status, 1)), SUBSTRING(o.status, 2)),
                       'order', o.id,
                       JSON_OBJECT('total', o.total_amount, 'currency', o.currency, 'status', o.status),
                       o.created_at
                FROM orders o
                JOIN crm_contacts c ON $joinExpr
                LEFT JOIN crm_activity_log al
                       ON al.contact_id = c.id AND al.ref_type = 'order' AND al.ref_id = o.id
                WHERE al.id IS NULL";
        $stats['orders'] = $db->exec($sql) ?: 0;
    } catch (Throwable $e) { error_log('[crm-activity-backfill] orders: ' . $e->getMessage()); }

    // ─── consent_logs ───
    try {
        $sql = "INSERT INTO crm_activity_log (contact_id, type, title, ref_type, ref_id, metadata, occurred_at)
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
                LEFT JOIN crm_activity_log al
                       ON al.contact_id = c.id AND al.ref_type = 'consent' AND al.ref_id = cl.id
                WHERE al.id IS NULL";
        $stats['consent_logs'] = $db->exec($sql) ?: 0;
    } catch (Throwable $e) { error_log('[crm-activity-backfill] consent_logs: ' . $e->getMessage()); }

    // ─── onboarding_forms ───
    try {
        // onboarding_forms tablosu mevcut mu?
        $exists = false;
        try {
            $exists = (bool)$db->query("SHOW TABLES LIKE 'onboarding_forms'")->fetch();
        } catch (Throwable $e) {}
        if ($exists) {
            $sql = "INSERT INTO crm_activity_log (contact_id, type, title, ref_type, ref_id, metadata, occurred_at)
                    SELECT c.id, 'onboarding_submitted',
                           CONCAT('Onboarding formu: ', UPPER(LEFT(of.status, 1)), SUBSTRING(of.status, 2)),
                           'onboarding', of.id,
                           JSON_OBJECT('order_id', of.order_id, 'status', of.status),
                           COALESCE(of.created_at, NOW())
                    FROM onboarding_forms of
                    JOIN crm_contacts c ON c.user_id = of.user_id
                    LEFT JOIN crm_activity_log al
                           ON al.contact_id = c.id AND al.ref_type = 'onboarding' AND al.ref_id = of.id
                    WHERE al.id IS NULL";
            $stats['onboarding_forms'] = $db->exec($sql) ?: 0;
        }
    } catch (Throwable $e) { error_log('[crm-activity-backfill] onboarding_forms: ' . $e->getMessage()); }

    // ─── consultant_bookings ───
    try {
        $exists = false;
        try {
            $exists = (bool)$db->query("SHOW TABLES LIKE 'consultant_bookings'")->fetch();
        } catch (Throwable $e) {}
        if ($exists) {
            // Olası kolonlar: email, user_id; ikisini de dene
            $hasEmail = false; $hasUserId = false;
            try { $hasEmail = (bool)$db->query("SHOW COLUMNS FROM consultant_bookings LIKE 'email'")->fetch(); } catch (Throwable $e) {}
            try { $hasUserId = (bool)$db->query("SHOW COLUMNS FROM consultant_bookings LIKE 'user_id'")->fetch(); } catch (Throwable $e) {}
            $joinParts = [];
            if ($hasEmail) $joinParts[] = "c.email = b.email";
            if ($hasUserId) $joinParts[] = "c.user_id = b.user_id";
            if ($joinParts) {
                $joinExpr = '(' . implode(' OR ', $joinParts) . ')';
                $sql = "INSERT INTO crm_activity_log (contact_id, type, title, ref_type, ref_id, metadata, occurred_at)
                        SELECT c.id, 'booking_created',
                               'Danışmanlık rezervasyonu',
                               'booking', b.id,
                               JSON_OBJECT('id', b.id),
                               COALESCE(b.created_at, NOW())
                        FROM consultant_bookings b
                        JOIN crm_contacts c ON $joinExpr
                        LEFT JOIN crm_activity_log al
                               ON al.contact_id = c.id AND al.ref_type = 'booking' AND al.ref_id = b.id
                        WHERE al.id IS NULL";
                $stats['consultant_bookings'] = $db->exec($sql) ?: 0;
            }
        }
    } catch (Throwable $e) { error_log('[crm-activity-backfill] consultant_bookings: ' . $e->getMessage()); }

    // last_activity_at refresh
    try {
        $db->exec("UPDATE crm_contacts c
                   LEFT JOIN (SELECT contact_id, MAX(occurred_at) AS last_at FROM crm_activity_log GROUP BY contact_id) a
                          ON a.contact_id = c.id
                   SET c.last_activity_at = a.last_at
                   WHERE a.last_at IS NOT NULL AND (c.last_activity_at IS NULL OR a.last_at > c.last_activity_at)");
    } catch (Throwable $e) {}

    try {
        $stats['total_after'] = (int)$db->query("SELECT COUNT(*) FROM crm_activity_log")->fetchColumn();
    } catch (Throwable $e) {}

    return $stats;
}
}
