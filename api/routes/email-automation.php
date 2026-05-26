<?php
// api/routes/email-automation.php
// cPanel cron: 0 * * * * curl -s -X POST "https://khilonfast.com/api/email-automation/process" -H "X-Cron-Key: <settings.email_cron_key>"

require_once __DIR__ . '/../services/EmailAutomationService.php';

$db = Database::getInstance();

// ensureEmailAutomationSchema, seedEmailSequences, emailTemplate fonksiyonları
// artık EmailAutomationService.php'de tanımlı — aşağıdaki tanımlar tarihsel kopya.
// `if (false)` ile dead-code haline getirilmiş; bloku kapatma satır sayısını yormaması için
// fonksiyonları olduğu gibi tanımlıyoruz (zaten asla çağırılmıyorlar — service dosyası override eder).
function ensureEmailAutomationSchema_unused_dead(PDO $db)
{
    static $checked = false;
    if ($checked) return;

    $db->exec("CREATE TABLE IF NOT EXISTS email_sequences (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        trigger_event ENUM('checkout_abandoned','purchase_completed','no_login_after_purchase') NOT NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        restart_after_days INT NULL DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $db->exec("CREATE TABLE IF NOT EXISTS email_sequence_steps (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sequence_id INT NOT NULL,
        step_order INT NOT NULL,
        delay_minutes INT NOT NULL,
        subject VARCHAR(500) NOT NULL,
        body_html TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sequence_id) REFERENCES email_sequences(id) ON DELETE CASCADE,
        INDEX idx_steps_sequence (sequence_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $db->exec("CREATE TABLE IF NOT EXISTS email_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        event_type ENUM('checkout_email_entered','purchase_completed','login') NOT NULL,
        email VARCHAR(255) NOT NULL,
        user_id INT NULL,
        cart_data JSON NULL,
        metadata JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email_events_email (email),
        INDEX idx_email_events_type_created (event_type, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $db->exec("CREATE TABLE IF NOT EXISTS email_queue (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        user_id INT NULL,
        sequence_id INT NULL,
        step_id INT NULL,
        event_id INT NULL,
        subject VARCHAR(500) NOT NULL,
        body_html TEXT NOT NULL,
        status ENUM('pending','sent','failed','cancelled') NOT NULL DEFAULT 'pending',
        scheduled_at TIMESTAMP NOT NULL,
        sent_at TIMESTAMP NULL,
        error_message TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email_queue_status_scheduled (status, scheduled_at),
        INDEX idx_email_queue_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $db->exec("CREATE TABLE IF NOT EXISTS email_unsubscribes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // Cron key settings yoksa ekle
    $db->exec("INSERT IGNORE INTO settings (setting_key, setting_value, setting_group, description)
        VALUES ('email_cron_key', '" . bin2hex(random_bytes(16)) . "', 'mail', 'Email otomasyon cron güvenlik anahtarı')");

    // Seed: Terk edilen sepet sekansı (varsa ekleme)
    $existing = $db->query("SELECT COUNT(*) FROM email_sequences")->fetchColumn();
    if ((int)$existing === 0) {
        seedEmailSequences($db);
    }

    $checked = true;
}

// seedEmailSequences ve emailTemplate fonksiyonları artık api/services/EmailAutomationService.php'de.
// Buradaki tarihsel kopyaları PHP "Cannot redeclare function" fatal'ına yol açtığı için silindi.

function makeUnsubscribeToken($email)
{
    return hash_hmac('sha256', strtolower(trim($email)), JWT_SECRET);
}

function makeCartToken($eventId, $email)
{
    return hash_hmac('sha256', $eventId . '|' . strtolower(trim($email)), JWT_SECRET);
}

function scheduleSequenceForEmail(PDO $db, $sequenceId, $email, $userId, $eventId)
{
    // Bu email için aynı sekans zaten pending'de mi?
    $stmt = $db->prepare("SELECT COUNT(*) FROM email_queue WHERE email = ? AND sequence_id = ? AND status = 'pending'");
    $stmt->execute([$email, $sequenceId]);
    if ((int)$stmt->fetchColumn() > 0) return;

    $steps = $db->prepare("SELECT * FROM email_sequence_steps WHERE sequence_id = ? ORDER BY step_order ASC");
    $steps->execute([$sequenceId]);
    $stepsData = $steps->fetchAll();

    $insert = $db->prepare(
        "INSERT INTO email_queue (email, user_id, sequence_id, step_id, event_id, subject, body_html, status, scheduled_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', DATE_ADD(NOW(), INTERVAL ? MINUTE))"
    );

    foreach ($stepsData as $step) {
        $insert->execute([
            $email,
            $userId ?: null,
            $sequenceId,
            $step['id'],
            $eventId ?: null,
            $step['subject'],
            $step['body_html'],
            (int)$step['delay_minutes']
        ]);
    }
}

function cancelPendingQueueForEmail(PDO $db, $email)
{
    $db->prepare("UPDATE email_queue SET status = 'cancelled' WHERE email = ? AND status = 'pending'")
       ->execute([strtolower(trim($email))]);
}

function injectTemplateVars($html, $firstName, $cartLink, $email, $baseUrl)
{
    $unsubToken = makeUnsubscribeToken($email);
    $unsubUrl = $baseUrl . '/api/email-automation/unsubscribe?email=' . urlencode($email) . '&token=' . urlencode($unsubToken);
    $safeFirst = $firstName ?: 'Merhaba';

    $html = str_replace('{{first_name}}', htmlspecialchars($safeFirst, ENT_QUOTES, 'UTF-8'), $html);
    $html = str_replace('{{cart_link}}', $cartLink ?: ($baseUrl . '/odeme'), $html);
    $html = str_replace('{{unsubscribe_link}}', $unsubUrl, $html);
    return $html;
}

try { ensureEmailAutomationSchema($db); } catch (Throwable $e) { error_log('[email-automation] schema: ' . $e->getMessage()); }

// ---------------------------------------------------------------------------
// POST /api/email-automation/event
// Body: { event_type, email, user_id?, cart_data?, metadata? }
// ---------------------------------------------------------------------------
if ($action === 'event' && $method === 'POST') {
    $data = getJsonBody();
    $eventType = (string)($data['event_type'] ?? '');
    $email = strtolower(trim((string)($data['email'] ?? '')));
    $userId = isset($data['user_id']) ? (int)$data['user_id'] : null;
    $cartData = isset($data['cart_data']) ? json_encode($data['cart_data']) : null;
    $metadata = isset($data['metadata']) ? json_encode($data['metadata']) : null;

    $allowed = ['checkout_email_entered', 'purchase_completed', 'login'];
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || !in_array($eventType, $allowed, true)) {
        sendResponse(['error' => 'Geçersiz event veya email'], 400);
    }

    // Unsubscribe kontrolü
    $stmt = $db->prepare("SELECT id FROM email_unsubscribes WHERE email = ? LIMIT 1");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        sendResponse(['ok' => true, 'skipped' => 'unsubscribed']);
    }

    $stmt = $db->prepare("INSERT INTO email_events (event_type, email, user_id, cart_data, metadata) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$eventType, $email, $userId, $cartData, $metadata]);
    $eventId = (int)$db->lastInsertId();

    if ($eventType === 'checkout_email_entered') {
        // Aktif terk-edilen-sepet sekanslarını zamanla
        $seqs = $db->query("SELECT id FROM email_sequences WHERE trigger_event = 'checkout_abandoned' AND is_active = 1")->fetchAll();
        foreach ($seqs as $seq) {
            scheduleSequenceForEmail($db, (int)$seq['id'], $email, $userId, $eventId);
        }
    }

    if ($eventType === 'purchase_completed') {
        // Terk edilen sepet queue'ları iptal et
        cancelPendingQueueForEmail($db, $email);

        // Satın alma sonrası sekansı zamanla
        $seqs = $db->query("SELECT id FROM email_sequences WHERE trigger_event = 'purchase_completed' AND is_active = 1")->fetchAll();
        foreach ($seqs as $seq) {
            scheduleSequenceForEmail($db, (int)$seq['id'], $email, $userId, $eventId);
        }
    }

    sendResponse(['ok' => true, 'event_id' => $eventId]);
}

// ---------------------------------------------------------------------------
// GET /api/email-automation/unsubscribe?email=x&token=y
// ---------------------------------------------------------------------------
if ($action === 'unsubscribe' && $method === 'GET') {
    $email = strtolower(trim((string)($_GET['email'] ?? '')));
    $token = (string)($_GET['token'] ?? '');

    $valid = !empty($email) && !empty($token) && hash_equals(makeUnsubscribeToken($email), $token);

    if ($valid) {
        try {
            $db->prepare("INSERT IGNORE INTO email_unsubscribes (email) VALUES (?)")->execute([$email]);
            $db->prepare("UPDATE email_queue SET status = 'cancelled' WHERE email = ? AND status = 'pending'")->execute([$email]);
        } catch (Throwable $e) { /* ignore */ }
    }

    header('Content-Type: text/html; charset=utf-8');
    echo "<!doctype html><html lang='tr'><head><meta charset='UTF-8'>
    <title>Listeden Çıkıldı</title>
    <style>body{font-family:Arial,sans-serif;background:#f6f8fb;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;}
    .card{background:#fff;border-radius:12px;padding:2.5rem;max-width:480px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,.08);}
    h2{color:#1a3a52;margin-bottom:.5rem;}p{color:#64748b;}</style>
    </head><body><div class='card'>
    <h2>" . ($valid ? '✅ Listeden çıkıldı' : '⚠️ Geçersiz link') . "</h2>
    <p>" . ($valid ? 'Artık bu e-posta adresine otomasyon maili gönderilmeyecek.' : 'Link geçersiz veya süresi dolmuş.') . "</p>
    <a href='https://khilonfast.com' style='color:#1a3a52;font-weight:700;text-decoration:none;'>← Anasayfaya Dön</a>
    </div></body></html>";
    exit;
}

// ---------------------------------------------------------------------------
// GET /api/email-automation/cart?id=EVENT_ID&token=TOKEN
// ---------------------------------------------------------------------------
if ($action === 'cart' && $method === 'GET') {
    $eventId = (int)($_GET['id'] ?? 0);
    $token = (string)($_GET['token'] ?? '');

    if ($eventId <= 0 || empty($token)) {
        sendResponse(['error' => 'Geçersiz parametre'], 400);
    }

    $stmt = $db->prepare("SELECT email, cart_data FROM email_events WHERE id = ? AND event_type = 'checkout_email_entered' LIMIT 1");
    $stmt->execute([$eventId]);
    $event = $stmt->fetch();

    if (!$event || !hash_equals(makeCartToken($eventId, $event['email']), $token)) {
        sendResponse(['error' => 'Geçersiz veya süresi dolmuş link'], 403);
    }

    $cartData = $event['cart_data'] ? json_decode($event['cart_data'], true) : [];
    sendResponse(['cart' => $cartData ?: []]);
}

// ---------------------------------------------------------------------------
// POST /api/email-automation/process  (cron endpoint)
// ---------------------------------------------------------------------------
if ($action === 'process' && $method === 'POST') {
    $cronKey = trim((string)($_SERVER['HTTP_X_CRON_KEY'] ?? getJsonBody()['cron_key'] ?? ''));
    $stmt = $db->prepare("SELECT setting_value FROM settings WHERE setting_key = 'email_cron_key' LIMIT 1");
    $stmt->execute();
    $row = $stmt->fetch();
    $validKey = $row ? trim((string)$row['setting_value']) : '';

    if ($validKey === '' || $cronKey !== $validKey) {
        sendResponse(['error' => 'Unauthorized'], 401);
    }

    $brevoApiKey = (string)getSetting($db, 'brevo_api_key', '');
    $smtpHost = (string)getSetting($db, 'smtp_host', '');
    $from = (string)getSetting($db, 'contact_email', '');
    $baseUrl = 'https://khilonfast.com';

    if ($from === '' || ($brevoApiKey === '' && $smtpHost === '')) {
        sendResponse(['error' => 'Mail ayarları eksik (Brevo API key veya SMTP)'], 500);
    }

    // Gönderilecek e-postalar (max 50 per run)
    $stmt = $db->prepare(
        "SELECT q.*, u.first_name, u.last_name
         FROM email_queue q
         LEFT JOIN users u ON u.id = q.user_id
         WHERE q.status = 'pending' AND q.scheduled_at <= NOW()
         ORDER BY q.scheduled_at ASC
         LIMIT 50"
    );
    $stmt->execute();
    $rows = $stmt->fetchAll();

    // Unsubscribe listesi
    $unsubStmt = $db->query("SELECT email FROM email_unsubscribes");
    $unsubList = array_column($unsubStmt->fetchAll(), 'email');
    $unsubSet = array_flip($unsubList);

    $sent = 0; $failed = 0; $cancelled = 0;

    foreach ($rows as $row) {
        $email = strtolower(trim($row['email']));

        // Unsubscribe kontrolü
        if (isset($unsubSet[$email])) {
            $db->prepare("UPDATE email_queue SET status = 'cancelled' WHERE id = ?")->execute([$row['id']]);
            $cancelled++;
            continue;
        }

        // Cart recovery link oluştur (event_id varsa)
        $cartLink = '';
        if (!empty($row['event_id'])) {
            $cartToken = makeCartToken((int)$row['event_id'], $email);
            $cartLink = $baseUrl . '/odeme?cart_recover=' . $row['event_id'] . '&token=' . urlencode($cartToken);
        }

        // İsim al
        $firstName = trim($row['first_name'] ?? '');
        if ($firstName === '') {
            // email_events.metadata'dan al
            if (!empty($row['event_id'])) {
                $evStmt = $db->prepare("SELECT metadata FROM email_events WHERE id = ? LIMIT 1");
                $evStmt->execute([(int)$row['event_id']]);
                $ev = $evStmt->fetch();
                if ($ev && !empty($ev['metadata'])) {
                    $meta = json_decode($ev['metadata'], true);
                    $firstName = $meta['first_name'] ?? '';
                }
            }
        }

        $html = injectTemplateVars($row['body_html'], $firstName, $cartLink, $email, $baseUrl);

        try {
            sendTransactionalEmail($db, $email, $row['subject'], $html);
            $db->prepare("UPDATE email_queue SET status = 'sent', sent_at = NOW() WHERE id = ?")->execute([$row['id']]);
            $sent++;
        } catch (Throwable $e) {
            $db->prepare("UPDATE email_queue SET status = 'failed', error_message = ? WHERE id = ?")->execute([
                substr($e->getMessage(), 0, 500),
                $row['id']
            ]);
            $failed++;
        }
    }

    // Restart kontrolü: restart_after_days dolmuş sekansları yeniden zamanla
    $restartSeqs = $db->query(
        "SELECT * FROM email_sequences WHERE is_active = 1 AND restart_after_days IS NOT NULL"
    )->fetchAll();

    $restarted = 0;
    foreach ($restartSeqs as $seq) {
        // Bu sekans için en son gönderilmiş (sent) kuyruğu bul, restart_after_days geçmiş mi?
        $checkStmt = $db->prepare(
            "SELECT q.email, q.user_id, q.event_id, MAX(q.sent_at) AS last_sent
             FROM email_queue q
             WHERE q.sequence_id = ? AND q.step_id = (
                 SELECT id FROM email_sequence_steps WHERE sequence_id = ? ORDER BY step_order DESC LIMIT 1
             ) AND q.status = 'sent'
             GROUP BY q.email, q.user_id, q.event_id
             HAVING TIMESTAMPDIFF(DAY, last_sent, NOW()) >= ?"
        );
        $checkStmt->execute([$seq['id'], $seq['id'], (int)$seq['restart_after_days']]);
        $toRestart = $checkStmt->fetchAll();

        foreach ($toRestart as $r) {
            $emailR = strtolower(trim($r['email']));
            if (isset($unsubSet[$emailR])) continue;
            // Hala purchase_completed yoksa restart et
            $purchStmt = $db->prepare("SELECT id FROM email_events WHERE email = ? AND event_type = 'purchase_completed' LIMIT 1");
            $purchStmt->execute([$emailR]);
            if ($purchStmt->fetch()) continue;
            scheduleSequenceForEmail($db, (int)$seq['id'], $emailR, $r['user_id'], $r['event_id']);
            $restarted++;
        }
    }

    sendResponse(['sent' => $sent, 'failed' => $failed, 'cancelled' => $cancelled, 'restarted' => $restarted]);
}

// ---------------------------------------------------------------------------
// Admin endpoints — /api/admin/... içinde değil burada ayrı handle edilmez.
// Bunlar admin.php'ye ekleneceğinden burada 404 döneriz.
// ---------------------------------------------------------------------------
sendResponse(['error' => 'Action not found'], 404);
