<?php
// api/routes/automation-cron.php
// Cron: bekleyen otomasyon execution step'lerini ilerletir.
// cPanel cron örneği (her dakika):
//   * * * * * curl -s -X POST "https://khilonfast.com/api/automation/cron" -H "X-Cron-Key: <key>"

set_exception_handler(function (Throwable $e) {
    header('Content-Type: application/json', true, 500);
    echo json_encode(['error' => 'PHP Exception: ' . $e->getMessage()]);
    exit;
});

require_once __DIR__ . '/../utils.php';
require_once __DIR__ . '/../services/AutomationEngine.php';

$db = Database::getInstance();

if ($method !== 'POST' && $method !== 'GET') {
    sendResponse(['error' => 'Method not allowed'], 405);
}

// Cron key kontrolü
$keyHeader = $_SERVER['HTTP_X_CRON_KEY'] ?? '';
$validKey = (string)getSetting($db, 'automation_cron_key', '');
if ($validKey === '' || $keyHeader !== $validKey) {
    sendResponse(['error' => 'Unauthorized'], 401);
}

$batch = isset($_GET['batch']) ? max(1, min(500, (int)$_GET['batch'])) : 50;
$engine = new AutomationEngine($db);
$result = $engine->tick($batch);

sendResponse([
    'ok' => true,
    'batch' => $batch,
    'time' => date('c'),
] + $result);
