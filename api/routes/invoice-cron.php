<?php
// api/routes/invoice-cron.php
// Cron: invoice_jobs kuyruğundaki bekleyen işleri işler (Paraşüt'e fatura keser).
// cPanel cron örneği (saatlik):
//   0 * * * * curl -s -X POST "https://khilonfast.com/api/invoice-cron" -H "X-Cron-Key: <key>"

set_exception_handler(function (Throwable $e) {
    header('Content-Type: application/json', true, 500);
    echo json_encode(['error' => 'PHP Exception: ' . $e->getMessage()]);
    exit;
});

require_once __DIR__ . '/../utils.php';
require_once __DIR__ . '/../services/InvoiceService.php';

$db = Database::getInstance();

if ($method !== 'POST' && $method !== 'GET') {
    sendResponse(['error' => 'Method not allowed'], 405);
}

// Cron key — automation cron'larıyla aynı anahtar
$keyHeader = $_SERVER['HTTP_X_CRON_KEY'] ?? '';
$validKey = (string)getSetting($db, 'automation_cron_key', '');
if ($validKey === '' || $keyHeader !== $validKey) {
    sendResponse(['error' => 'Unauthorized'], 401);
}

// Paraşüt aktif değilse cron işlemden çık (kuyruktaki kayıtlar duruyor — toggle açılınca işlenir)
// Default '0' → migration henüz import edilmemiş veya admin aktif etmemişse SESSİZCE çık.
if ((string)getSetting($db, 'parasut_enabled', '0') !== '1') {
    sendResponse(['ok' => true, 'paused' => true, 'reason' => 'parasut_enabled=0', 'time' => date('c')]);
}

// Güvenlik: invoice_jobs tablosu yoksa (migration import edilmedi) sessizce çık
try {
    $db->query("SELECT 1 FROM invoice_jobs LIMIT 1");
} catch (Throwable $e) {
    sendResponse(['ok' => true, 'paused' => true, 'reason' => 'invoice_jobs table missing', 'time' => date('c')]);
}

$batch = isset($_GET['batch']) ? max(1, min(50, (int)$_GET['batch'])) : 25;

// queued olup (next_run_at NULL veya geçmiş) işleri al
$rows = $db->query(
    "SELECT id FROM invoice_jobs
     WHERE status = 'queued' AND (next_run_at IS NULL OR next_run_at <= NOW())
     ORDER BY id ASC LIMIT $batch"
)->fetchAll();

$processed = 0; $sent = 0; $failed = 0; $details = [];
foreach ($rows as $r) {
    $res = invoiceProcessJob($db, (int)$r['id']);
    $processed++;
    if (!empty($res['ok'])) {
        $sent++;
        $details[] = ['job' => $r['id'], 'ok' => true, 'invoice_id' => $res['invoice_id'] ?? null];
    } else {
        $failed++;
        $details[] = ['job' => $r['id'], 'ok' => false, 'error' => $res['error'] ?? null];
    }
}

sendResponse([
    'ok' => true,
    'time' => date('c'),
    'processed' => $processed,
    'sent' => $sent,
    'failed' => $failed,
    'details' => $details,
]);
