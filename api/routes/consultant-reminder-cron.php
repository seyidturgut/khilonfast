<?php
// api/routes/consultant-reminder-cron.php
// Cron: danışmanlık randevusuna 24 saatten az kalan onaylı booking'lere
// "Görüşmeye 1 Gün Kala" hatırlatma maili gönderir.
// cPanel cron örneği (saatlik):
//   0 * * * * curl -s -X POST "https://khilonfast.com/api/consultant-cron" -H "X-Cron-Key: <key>"

set_exception_handler(function (Throwable $e) {
    header('Content-Type: application/json', true, 500);
    echo json_encode(['error' => 'PHP Exception: ' . $e->getMessage()]);
    exit;
});

require_once __DIR__ . '/../utils.php';
require_once __DIR__ . '/../services/ConsultantMailer.php';

$db = Database::getInstance();

if ($method !== 'POST' && $method !== 'GET') {
    sendResponse(['error' => 'Method not allowed'], 405);
}

// Cron key kontrolü — automation cron'larıyla aynı anahtar
$keyHeader = $_SERVER['HTTP_X_CRON_KEY'] ?? '';
$validKey = (string)getSetting($db, 'automation_cron_key', '');
if ($validKey === '' || $keyHeader !== $validKey) {
    sendResponse(['error' => 'Unauthorized'], 401);
}

// Randevusuna 24 saatten az kalan, hatırlatması gönderilmemiş onaylı booking'ler
$sql = "SELECT b.id, b.name, b.email, b.meeting_link, b.availability_id, b.service_id, b.consultant_id
        FROM consultant_bookings b
        JOIN consultant_availability a ON a.id = b.availability_id
        WHERE b.status = 'confirmed'
          AND b.reminder_sent_at IS NULL
          AND b.availability_id IS NOT NULL
          AND TIMESTAMP(a.available_date, a.start_time) BETWEEN NOW() AND NOW() + INTERVAL 24 HOUR";

$rows = $db->query($sql)->fetchAll();
$sent = 0;
$failed = 0;

foreach ($rows as $b) {
    $vars = consultantBuildVars($db, $b);
    if (consultantSendMail($db, CONSULTANT_TPL_REMINDER, (string)$b['email'], $vars)) {
        $db->prepare("UPDATE consultant_bookings SET reminder_sent_at = NOW() WHERE id = ?")->execute([$b['id']]);
        $sent++;
    } else {
        $failed++;
    }
}

sendResponse([
    'ok' => true,
    'time' => date('c'),
    'candidates' => count($rows),
    'sent' => $sent,
    'failed' => $failed,
]);
