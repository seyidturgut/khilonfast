<?php
// PUBLIC — /api/client-error POST
// Tarayıcıda React mount olmadan yaşanan fatal JS hatalarını loglar.
// Amaç: Instagram in-app WebView gibi yerinde debug edilemeyen ortamlardaki
// "beyaz sayfa" şikayetlerinin GERÇEK hata mesajını yakalamak.
// Kayıt: api/logs/client-errors.log (web'den erişime .htaccess ile kapalı).

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(['error' => 'Method not allowed'], 405);
}

$raw = file_get_contents('php://input');
// Boyut sınırı — kötüye kullanım/şişme koruması
if ($raw === false || strlen($raw) > 8192) {
    sendResponse(['error' => 'Payload too large'], 413);
}

$data = json_decode($raw, true);
if (!is_array($data)) {
    $data = ['raw' => substr((string)$raw, 0, 2000)];
}

$logDir = __DIR__ . '/../logs';
if (!is_dir($logDir)) {
    @mkdir($logDir, 0755, true);
}
// Log klasörünü web erişimine kapat
$htaccess = $logDir . '/.htaccess';
if (!file_exists($htaccess)) {
    @file_put_contents($htaccess, "Require all denied\n");
}

$logFile = $logDir . '/client-errors.log';

// 5MB üstüne çıktıysa eskiyi tek yedek olarak döndür (sonsuz büyüme koruması)
if (file_exists($logFile) && filesize($logFile) > 5 * 1024 * 1024) {
    @rename($logFile, $logFile . '.1');
}

$entry = [
    'ts'      => date('c'),
    'ip'      => $_SERVER['HTTP_CF_CONNECTING_IP'] ?? ($_SERVER['REMOTE_ADDR'] ?? ''),
    'ua'      => substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 500),
    'type'    => substr((string)($data['type'] ?? ''), 0, 50),
    'message' => substr((string)($data['message'] ?? ''), 0, 1000),
    'source'  => substr((string)($data['source'] ?? ''), 0, 300),
    'line'    => (int)($data['line'] ?? 0),
    'col'     => (int)($data['col'] ?? 0),
    'stack'   => substr((string)($data['stack'] ?? ''), 0, 2000),
    'url'     => substr((string)($data['url'] ?? ''), 0, 500),
];

@file_put_contents($logFile, json_encode($entry, JSON_UNESCAPED_UNICODE) . "\n", FILE_APPEND | LOCK_EX);

sendResponse(['ok' => true]);
