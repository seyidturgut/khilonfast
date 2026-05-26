<?php
// api/routes/subscription-renewal.php
// cPanel cron: 0 9 * * * curl -s -X POST "https://khilonfast.com/api/subscription-renewal/run" -H "X-Cron-Key: <settings.subscription_cron_key>"

require_once __DIR__ . '/../services/LidioService.php';
require_once __DIR__ . '/../services/CouponService.php';

$db = Database::getInstance();

if ($action === 'run' && $method === 'POST') {
    // Cron key doğrulama
    $cronKey = trim((string)($_SERVER['HTTP_X_CRON_KEY'] ?? getJsonBody()['cron_key'] ?? ''));
    $stmt = $db->prepare("SELECT setting_value FROM settings WHERE setting_key = 'subscription_cron_key' LIMIT 1");
    $stmt->execute();
    $row = $stmt->fetch();
    $validKey = $row ? trim((string)$row['setting_value']) : '';

    if ($validKey === '' || $cronKey !== $validKey) {
        sendResponse(['error' => 'Unauthorized'], 401);
    }

    $lidio = new LidioService($db);

    // Yenilenmesi gereken abonelikler: auto_renew=1, next_renewal_at geçmiş, aktif
    $stmt = $db->prepare(
        "SELECT s.id, s.user_id, s.product_id, s.renewal_card_id, s.next_renewal_at,
                p.price, p.currency, p.duration_days, p.name AS product_name,
                u.email, u.first_name, u.last_name, u.phone,
                uc.lidio_token
         FROM subscriptions s
         INNER JOIN products p ON p.id = s.product_id
         INNER JOIN users u ON u.id = s.user_id
         LEFT JOIN user_cards uc ON uc.id = s.renewal_card_id AND uc.is_active = 1
         WHERE s.auto_renew = 1
           AND s.status = 'active'
           AND s.next_renewal_at IS NOT NULL
           AND s.next_renewal_at <= NOW()
         ORDER BY s.next_renewal_at ASC
         LIMIT 50"
    );
    $stmt->execute();
    $renewals = $stmt->fetchAll();

    $results = [];

    foreach ($renewals as $sub) {
        $subId = (int)$sub['id'];

        // Kayıtlı kart yoksa expire et
        if (empty($sub['lidio_token'])) {
            $db->prepare("UPDATE subscriptions SET status = 'expired', auto_renew = 0 WHERE id = ?")->execute([$subId]);
            subscriptionSendMail($sub['email'], $sub['first_name'], $sub['product_name'], 'no_card');
            $results[] = ['subscription_id' => $subId, 'result' => 'expired_no_card'];
            continue;
        }

        try {
            $db->beginTransaction();

            // Yeni sipariş oluştur
            $orderNumber = 'KHL-RENEW-' . date('ymd') . '-' . $subId;
            $insertOrder = $db->prepare(
                "INSERT INTO orders (user_id, order_number, total_amount, subtotal_amount, currency, status)
                 VALUES (?, ?, ?, ?, ?, 'processing')"
            );
            $amount = (float)$sub['price'];
            $currency = (string)($sub['currency'] ?: 'TRY');
            $insertOrder->execute([$sub['user_id'], $orderNumber, $amount, $amount, $currency]);
            $newOrderId = (int)$db->lastInsertId();

            $db->prepare(
                "INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
                 VALUES (?, ?, 1, ?, ?)"
            )->execute([$newOrderId, $sub['product_id'], $amount, $amount]);

            $orderId = 'KHL-R' . time() . $subId;
            $paymentData = [
                'orderId' => $orderId,
                'merchantProcessId' => (string)$newOrderId,
                'amount' => $amount,
                'currency' => $currency,
                'returnUrl' => 'https://khilonfast.com/payment-callback',
                'notificationUrl' => 'https://khilonfast.com/api/payment/callback',
                'customerInfo' => [
                    'customerId' => (string)$sub['user_id'],
                    'customerName' => (string)$sub['first_name'],
                    'customerSurname' => (string)$sub['last_name'],
                    'customerEmail' => (string)$sub['email'],
                    'customerPhoneNumber' => !empty($sub['phone']) ? preg_replace('/\D+/', '', $sub['phone']) : '5551112233',
                    'customerIpAddress' => '127.0.0.1'
                ]
            ];

            $paymentResult = $lidio->processPaymentWithSavedCard($paymentData, $sub['lidio_token']);
            $isSuccess = !empty($paymentResult['success']) && empty($paymentResult['requires3DS']);

            $db->prepare(
                "INSERT INTO payments (order_id, payment_method, lidio_transaction_id, amount, currency, status, lidio_response)
                 VALUES (?, 'credit_card', ?, ?, ?, ?, ?)"
            )->execute([
                $newOrderId,
                $paymentResult['transactionId'] ?? null,
                $amount, $currency,
                $isSuccess ? 'success' : 'failed',
                json_encode($paymentResult, JSON_UNESCAPED_UNICODE)
            ]);

            if ($isSuccess) {
                $db->prepare("UPDATE orders SET status = 'completed' WHERE id = ?")->execute([$newOrderId]);

                // Aboneliği uzat — SADECE mevcut kaydı güncelle.
                // (Önceden ek bir INSERT yapılıyordu → aynı ürün için çift aktif
                //  abonelik + sonraki cron'da çift tahsilat riski. INSERT kaldırıldı.)
                $days = (int)($sub['duration_days'] ?? 30);
                if ($days <= 0) $days = 30;
                $newExpires = date('Y-m-d H:i:s', strtotime("+{$days} days"));
                $db->prepare(
                    "UPDATE subscriptions
                     SET expires_at = ?, next_renewal_at = ?, status = 'active',
                         last_renewal_at = NOW(), renewal_attempts = 0, order_id = ?
                     WHERE id = ?"
                )->execute([$newExpires, $newExpires, $newOrderId, $subId]);

                subscriptionSendMail($sub['email'], $sub['first_name'], $sub['product_name'], 'renewed', $newExpires);
                $results[] = ['subscription_id' => $subId, 'result' => 'renewed', 'new_order_id' => $newOrderId];
            } else {
                $db->prepare("UPDATE orders SET status = 'failed' WHERE id = ?")->execute([$newOrderId]);
                $db->prepare("UPDATE subscriptions SET status = 'expired', auto_renew = 0 WHERE id = ?")->execute([$subId]);
                subscriptionSendMail($sub['email'], $sub['first_name'], $sub['product_name'], 'payment_failed');
                $results[] = ['subscription_id' => $subId, 'result' => 'payment_failed', 'new_order_id' => $newOrderId];
            }

            $db->commit();
        } catch (Throwable $e) {
            if ($db->inTransaction()) $db->rollBack();
            $results[] = ['subscription_id' => $subId, 'result' => 'error', 'message' => $e->getMessage()];
        }
    }

    sendResponse([
        'processed' => count($renewals),
        'results' => $results,
        'ran_at' => date('Y-m-d H:i:s')
    ]);
}

// GET /api/subscription-renewal/status — Admin: yenileme bekleyen abonelik sayısı
if ($action === 'status' && $method === 'GET') {
    $token = getBearerToken();
    $payload = decodeJWT($token);
    if (!$payload) sendResponse(['error' => 'Unauthorized'], 401);
    $stmt = $db->prepare("SELECT role FROM users WHERE id = ? LIMIT 1");
    $stmt->execute([$payload['id']]);
    $user = $stmt->fetch();
    if (!$user || $user['role'] !== 'admin') sendResponse(['error' => 'Admin required'], 403);

    $stmt = $db->query(
        "SELECT COUNT(*) AS pending FROM subscriptions
         WHERE auto_renew = 1 AND status = 'active' AND next_renewal_at <= NOW()"
    );
    $stmt2 = $db->query(
        "SELECT COUNT(*) AS total_active FROM subscriptions WHERE auto_renew = 1 AND status = 'active'"
    );
    sendResponse([
        'pending_renewals' => (int)$stmt->fetchColumn(),
        'total_auto_renew' => (int)$stmt2->fetchColumn(),
        'checked_at' => date('Y-m-d H:i:s')
    ]);
}

function subscriptionSendMail($email, $name, $productName, $type, $expiresAt = null)
{
    $subjects = [
        'renewed'      => 'Aboneliğiniz Yenilendi - Khilonfast',
        'payment_failed' => 'Abonelik Yenileme Başarısız - Khilonfast',
        'no_card'      => 'Aboneliğiniz Sona Erdi - Khilonfast',
    ];
    $subject = $subjects[$type] ?? 'Khilonfast Abonelik Bildirimi';

    if ($type === 'renewed') {
        $body = "Merhaba {$name},\n\n{$productName} aboneliğiniz başarıyla yenilendi.\nBitiş tarihi: {$expiresAt}\n\nTeşekkürler,\nKhilonfast Ekibi";
    } elseif ($type === 'payment_failed') {
        $body = "Merhaba {$name},\n\n{$productName} aboneliğinizin yenileme ödemesi alınamadı. Lütfen ödeme bilgilerinizi güncelleyin.\n\nhttps://khilonfast.com/dashboard\n\nKhilonfast Ekibi";
    } else {
        $body = "Merhaba {$name},\n\n{$productName} aboneliğiniz sona erdi. Yeniden başlatmak için lütfen giriş yapın.\n\nhttps://khilonfast.com/dashboard\n\nKhilonfast Ekibi";
    }

    @mail($email, $subject, $body, "From: noreply@khilonfast.com\r\nContent-Type: text/plain; charset=UTF-8");
}

sendResponse(['error' => 'Action not found'], 404);
