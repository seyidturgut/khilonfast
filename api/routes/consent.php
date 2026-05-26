<?php
// api/routes/consent.php
// Form onay (consent) kayıtları — chargeback ve dispute koruması.

set_exception_handler(function (Throwable $e) {
    header('Content-Type: application/json', true, 500);
    echo json_encode(['error' => 'PHP Exception: ' . $e->getMessage()]);
    exit;
});

require_once __DIR__ . '/../utils.php';

$db = Database::getInstance();

if ($method !== 'POST' || $action !== 'log') {
    sendResponse(['error' => 'Not found'], 404);
}

$data = getJsonBody();
$context = trim((string)($data['context'] ?? ''));
$consents = $data['consents'] ?? null;
$email = strtolower(trim((string)($data['email'] ?? '')));
$productKey = isset($data['product_key']) ? (string)$data['product_key'] : null;
$orderId = isset($data['order_id']) ? (int)$data['order_id'] : null;
$policyVersion = isset($data['policy_version']) ? (string)$data['policy_version'] : null;

if ($context === '' || !in_array($context, ['checkout','register','booking','contact'], true)) {
    sendResponse(['error' => 'Invalid context'], 400);
}
if (!is_array($consents) || empty($consents)) {
    sendResponse(['error' => 'consents array required'], 400);
}
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendResponse(['error' => 'Invalid email'], 400);
}

// Auth varsa user_id al — opsiyonel, anonymous flow için zorunlu değil
$userId = null;
$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
if ($authHeader && preg_match('/Bearer\s+(\S+)/i', $authHeader, $m)) {
    try {
        $payload = decodeJwt($m[1]);
        if ($payload && !empty($payload['id'])) $userId = (int)$payload['id'];
    } catch (Throwable $e) { /* anon — devam */ }
}

$ip = $_SERVER['REMOTE_ADDR'] ?? null;
$ua = substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 500);

$valid = ['main_legal','etk','b2b','auto_renewal'];
$inserted = 0;
$stmt = $db->prepare(
    "INSERT INTO consent_logs
     (user_id, email, consent_key, consent_state, context, product_key, order_id, policy_version, ip, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
);
foreach ($consents as $c) {
    $key = (string)($c['key'] ?? '');
    if (!in_array($key, $valid, true)) continue;
    $state = !empty($c['state']) ? 1 : 0;
    try {
        $stmt->execute([$userId, $email, $key, $state, $context, $productKey, $orderId, $policyVersion, $ip, $ua]);
        $inserted++;
    } catch (Throwable $e) {
        error_log('[consent] insert: ' . $e->getMessage());
    }
}

sendResponse(['ok' => true, 'inserted' => $inserted]);
