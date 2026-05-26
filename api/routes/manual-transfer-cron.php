<?php
// api/routes/manual-transfer-cron.php
// Cron: 3 günden eski pending manuel havale → hatırlatma maili.
// 7 günden eski pending manuel havale → iptal + iptal maili + kupon serbest bırak.
// cPanel cron örneği:
//   0 9 * * * curl -s -X POST "https://khilonfast.com/api/manual-transfer/cron" -H "X-Cron-Key: <key>"

set_exception_handler(function (Throwable $e) {
    header('Content-Type: application/json', true, 500);
    echo json_encode(['error' => 'PHP Exception: ' . $e->getMessage()]);
    exit;
});

require_once __DIR__ . '/../utils.php';
require_once __DIR__ . '/../services/CouponService.php';

$db = Database::getInstance();

if ($method !== 'POST') {
    sendResponse(['error' => 'Method not allowed'], 405);
}

// Cron key kontrolü — manual_transfer_cron_key veya automation_cron_key (ortak) kabul edilir
$keyHeader = $_SERVER['HTTP_X_CRON_KEY'] ?? '';
$mtKey = (string)getSetting($db, 'manual_transfer_cron_key', '');
$autoKey = (string)getSetting($db, 'automation_cron_key', '');
$validKeys = array_filter([$mtKey, $autoKey]);
if (!$validKeys || !in_array($keyHeader, $validKeys, true)) {
    sendResponse(['error' => 'Unauthorized'], 401);
}

$now = new DateTimeImmutable('now');
$reminded = 0; $cancelled = 0; $errors = [];

// Pending manuel havale siparişlerini al (3+ gün)
$stmt = $db->prepare(
    "SELECT o.*, u.email AS user_email, u.first_name,
            p.lidio_response AS payment_meta,
            DATEDIFF(NOW(), o.created_at) AS age_days
     FROM orders o
     INNER JOIN payments p ON p.order_id = o.id AND p.payment_method = 'manual_transfer' AND p.status = 'pending'
     LEFT JOIN users u ON u.id = o.user_id
     WHERE o.status = 'processing'
       AND DATEDIFF(NOW(), o.created_at) >= 3"
);
$stmt->execute();
$rows = $stmt->fetchAll();

foreach ($rows as $row) {
    $orderId = (int)$row['id'];
    $age = (int)$row['age_days'];
    $lang = (string)($row['customer_lang'] ?? 'tr');
    $userEmail = (string)($row['user_email'] ?? '');
    if ($userEmail === '') continue;

    $bankInfo = null;
    try {
        $meta = json_decode((string)$row['payment_meta'], true);
        if (is_array($meta) && isset($meta['bank_info'])) $bankInfo = $meta['bank_info'];
    } catch (Throwable $e) {}

    $params = [
        'order_number' => $row['order_number'],
        'order_id' => $orderId,
        'first_name' => $row['first_name'] ?? '',
        'amount' => $row['total_amount'],
        'currency' => $row['currency'] ?? 'TRY',
        'bank_info' => $bankInfo
    ];

    if ($age >= 7) {
        // İptal
        try {
            $db->beginTransaction();
            $db->prepare("UPDATE orders SET status='cancelled' WHERE id=?")->execute([$orderId]);
            $db->prepare("UPDATE payments SET status='failed' WHERE order_id=? AND payment_method='manual_transfer'")->execute([$orderId]);
            try { couponReleaseUsageForOrder($db, $orderId); } catch (Throwable $e) {}
            $db->commit();
        } catch (Throwable $e) {
            if ($db->inTransaction()) $db->rollBack();
            $errors[] = 'cancel ' . $orderId . ': ' . $e->getMessage();
            continue;
        }

        try {
            $mail = buildManualTransferEmail('cancelled', $lang, $params);
            sendTransactionalEmail($db, $userEmail, $mail['subject'], $mail['html']);
        } catch (Throwable $e) { error_log('[cron] cancel mail: ' . $e->getMessage()); }
        $cancelled++;
    } elseif ($age >= 3 && $age < 7) {
        // Hatırlatma — aynı gün tekrar göndermemek için payment_meta'ya last_reminder_at yaz
        try {
            $meta = json_decode((string)$row['payment_meta'], true) ?: [];
            $lastReminder = $meta['last_reminder_at'] ?? null;
            $today = $now->format('Y-m-d');
            if ($lastReminder === $today) continue; // bugün zaten gönderildi

            $mail = buildManualTransferEmail('reminder', $lang, $params);
            sendTransactionalEmail($db, $userEmail, $mail['subject'], $mail['html']);

            $meta['last_reminder_at'] = $today;
            $db->prepare("UPDATE payments SET lidio_response=? WHERE order_id=? AND payment_method='manual_transfer'")
               ->execute([json_encode($meta, JSON_UNESCAPED_UNICODE), $orderId]);
            $reminded++;
        } catch (Throwable $e) { $errors[] = 'reminder ' . $orderId . ': ' . $e->getMessage(); }
    }
}

sendResponse([
    'reminded' => $reminded,
    'cancelled' => $cancelled,
    'processed' => count($rows),
    'errors' => $errors
]);
