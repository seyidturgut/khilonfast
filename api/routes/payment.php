<?php
// api/routes/payment.php
require_once __DIR__ . '/../services/LidioService.php';
require_once __DIR__ . '/../services/CouponService.php';

$db = Database::getInstance();
ensureMustChangePasswordColumn($db);
ensureCouponSchema($db);
ensureUserCardsSchema($db);
$lidio = new LidioService($db);

function ensureUserCardsSchema(PDO $db)
{
    static $checked = false;
    if ($checked) return;
    $db->exec(
        "CREATE TABLE IF NOT EXISTS user_cards (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            lidio_token VARCHAR(255) NOT NULL,
            masked_number VARCHAR(20) NOT NULL,
            card_brand VARCHAR(30) NULL DEFAULT NULL,
            expire_month INT NOT NULL,
            expire_year INT NOT NULL,
            card_holder_name VARCHAR(255) NULL DEFAULT NULL,
            is_default TINYINT(1) NOT NULL DEFAULT 0,
            is_active TINYINT(1) NOT NULL DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_user_cards_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_user_cards_user (user_id),
            UNIQUE KEY uniq_user_token (user_id, lidio_token)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );

    // subscriptions yenileme kolonları
    $cols = [
        'renewal_card_id' => "ALTER TABLE subscriptions ADD COLUMN renewal_card_id INT NULL DEFAULT NULL",
        'next_renewal_at' => "ALTER TABLE subscriptions ADD COLUMN next_renewal_at TIMESTAMP NULL DEFAULT NULL",
        'auto_renew'      => "ALTER TABLE subscriptions ADD COLUMN auto_renew TINYINT(1) NOT NULL DEFAULT 0",
    ];
    foreach ($cols as $col => $sql) {
        $stmt = $db->prepare("SHOW COLUMNS FROM subscriptions LIKE ?");
        $stmt->execute([$col]);
        if (!$stmt->fetch()) {
            $db->exec($sql);
        }
    }

    $checked = true;
}

function getClientIpAddress()
{
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        return trim(explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0]);
    }
    return $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
}

function normalizePhoneNumber($value)
{
    $digits = preg_replace('/\D+/', '', (string)$value);
    if (strlen($digits) >= 10) return $digits;
    return '5551112233';
}

function normalizeBaseUrl($url)
{
    return rtrim(trim((string)$url), '/');
}

function resolveCurrentOrigin()
{
    $scheme = 'http';
    if (!empty($_SERVER['HTTP_X_FORWARDED_PROTO'])) {
        $scheme = strtolower(trim(explode(',', $_SERVER['HTTP_X_FORWARDED_PROTO'])[0])) === 'https' ? 'https' : 'http';
    } elseif (!empty($_SERVER['REQUEST_SCHEME'])) {
        $scheme = strtolower($_SERVER['REQUEST_SCHEME']) === 'https' ? 'https' : 'http';
    } elseif (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
        $scheme = 'https';
    }

    $host = trim((string)($_SERVER['HTTP_X_FORWARDED_HOST'] ?? $_SERVER['HTTP_HOST'] ?? ''));
    if ($host === '') {
        return null;
    }

    return $scheme . '://' . $host;
}

function resolveFrontendBaseUrl()
{
    $frontendUrl = normalizeBaseUrl(getenv('FRONTEND_URL'));
    if ($frontendUrl !== '') {
        return $frontendUrl;
    }

    $origin = resolveCurrentOrigin();
    if (!empty($origin)) {
        return normalizeBaseUrl($origin);
    }

    return 'http://localhost:5173';
}

function resolveBackendBaseUrl()
{
    $backendPublicUrl = normalizeBaseUrl(getenv('BACKEND_PUBLIC_URL'));
    if ($backendPublicUrl !== '') {
        return $backendPublicUrl;
    }

    return resolveFrontendBaseUrl() . '/api';
}

function resolveOrderByCallback(PDO $db, $orderIdLike, $merchantProcessId)
{
    if ($orderIdLike !== '') {
        $stmt = $db->prepare("SELECT * FROM orders WHERE order_number = ? LIMIT 1");
        $stmt->execute([$orderIdLike]);
        $row = $stmt->fetch();
        if ($row) return $row;

        $stmt = $db->prepare(
            "SELECT o.*
             FROM payments p
             INNER JOIN orders o ON o.id = p.order_id
             WHERE JSON_UNQUOTE(JSON_EXTRACT(p.lidio_response, '$.orderId')) = ?
                OR JSON_UNQUOTE(JSON_EXTRACT(p.lidio_response, '$.OrderId')) = ?
                OR JSON_UNQUOTE(JSON_EXTRACT(p.lidio_response, '$.raw.orderId')) = ?
                OR JSON_UNQUOTE(JSON_EXTRACT(p.lidio_response, '$.raw.OrderId')) = ?
                OR JSON_UNQUOTE(JSON_EXTRACT(p.lidio_response, '$.paymentInfo.orderId')) = ?
                OR JSON_UNQUOTE(JSON_EXTRACT(p.lidio_response, '$.raw.paymentInfo.orderId')) = ?
             ORDER BY p.id DESC
             LIMIT 1"
        );
        $stmt->execute([$orderIdLike, $orderIdLike, $orderIdLike, $orderIdLike, $orderIdLike, $orderIdLike]);
        $row = $stmt->fetch();
        if ($row) return $row;
    }

    if ($merchantProcessId !== '' && ctype_digit((string)$merchantProcessId)) {
        $stmt = $db->prepare("SELECT * FROM orders WHERE id = ? LIMIT 1");
        $stmt->execute([(int)$merchantProcessId]);
        $row = $stmt->fetch();
        if ($row) return $row;
    }

    return null;
}

if ($action === 'initiate' && $method === 'POST') {
    $payload = requireAuth();
    $data = getJsonBody();

    $orderId = (int)($data['order_id'] ?? 0);
    $cardNumber = trim((string)($data['card_number'] ?? ''));
    $cardHolderName = trim((string)($data['card_holder_name'] ?? ''));
    $cardExpireMonth = (int)($data['card_expire_month'] ?? 0);
    $cardExpireYear = (int)($data['card_expire_year'] ?? 0);
    $cardCvv = trim((string)($data['card_cvv'] ?? ''));
    $use3ds = isset($data['use_3ds']) ? (bool)$data['use_3ds'] : true;
    $useHosted = isset($data['use_hosted']) ? (bool)$data['use_hosted'] : false;
    $saveCard = !empty($data['save_card']);
    $savedCardId = (int)($data['saved_card_id'] ?? 0);

    if ($orderId <= 0) {
        sendResponse(['error' => 'Required fields missing'], 400);
    }

    $usingSavedCard = ($savedCardId > 0);
    if (!$useHosted && !$usingSavedCard && ($cardNumber === '' || $cardHolderName === '' || $cardExpireMonth < 1 || $cardExpireYear < 2000 || $cardCvv === '')) {
        sendResponse(['error' => 'Card fields are required'], 400);
    }

    // Kayıtlı kart kontrolü
    $savedCard = null;
    if ($usingSavedCard) {
        $stmt = $db->prepare("SELECT * FROM user_cards WHERE id = ? AND user_id = ? AND is_active = 1 LIMIT 1");
        $stmt->execute([$savedCardId, $payload['id']]);
        $savedCard = $stmt->fetch();
        if (!$savedCard) {
            sendResponse(['error' => 'Saved card not found'], 404);
        }
    }

    $stmt = $db->prepare("SELECT * FROM orders WHERE id = ? AND user_id = ? LIMIT 1");
    $stmt->execute([$orderId, $payload['id']]);
    $order = $stmt->fetch();
    if (!$order) {
        sendResponse(['error' => 'Order not found'], 404);
    }

    $stmt = $db->prepare("SELECT id, email, first_name, last_name, phone FROM users WHERE id = ? LIMIT 1");
    $stmt->execute([$payload['id']]);
    $user = $stmt->fetch();
    if (!$user) {
        sendResponse(['error' => 'User not found'], 404);
    }

    try {
        $db->beginTransaction();

        $stmt = $db->prepare("UPDATE orders SET status = 'processing' WHERE id = ?");
        $stmt->execute([$orderId]);

        $customerInfo = [
            'customerId' => (string)$user['id'],
            'customerName' => (string)$user['first_name'],
            'customerSurname' => (string)$user['last_name'],
            'customerEmail' => (string)$user['email'],
            'customerPhoneNumber' => normalizePhoneNumber($user['phone'] ?? ''),
            'customerIpAddress' => getClientIpAddress()
        ];

        $paymentData = [
            'orderId' => 'KHL' . time() . $orderId,
            'merchantProcessId' => (string)$orderId,
            'amount' => (float)$order['total_amount'],
            'currency' => (string)($order['currency'] ?? 'TRY'),
            'returnUrl' => resolveFrontendBaseUrl() . '/payment-callback',
            'notificationUrl' => resolveBackendBaseUrl() . '/payment/callback',
            'customerInfo' => $customerInfo
        ];

        if ($useHosted) {
            $paymentData['hostedOrderId'] = 'KHLH' . time() . $orderId;
            $paymentResult = $lidio->startHostedPaymentProcess($paymentData);
        } elseif ($usingSavedCard) {
            $paymentResult = $lidio->processPaymentWithSavedCard($paymentData, $savedCard['lidio_token']);
        } else {
            $paymentData['cardNumber'] = $cardNumber;
            $paymentData['cardHolderName'] = $cardHolderName;
            $paymentData['cardExpireMonth'] = $cardExpireMonth;
            $paymentData['cardExpireYear'] = $cardExpireYear;
            $paymentData['cardCvv'] = $cardCvv;
            $paymentResult = $lidio->process3DSPayment($paymentData, $saveCard);
        }

        $stmt = $db->prepare(
            "INSERT INTO payments (order_id, payment_method, lidio_transaction_id, amount, currency, status, lidio_response)
             VALUES (?, 'credit_card', ?, ?, ?, ?, ?)"
        );
        $paymentSuccess = !empty($paymentResult['success']) && empty($paymentResult['requires3DS']);
        $stmt->execute([
            $orderId,
            $paymentResult['transactionId'] ?? null,
            $paymentData['amount'],
            $paymentData['currency'],
            $paymentSuccess ? 'success' : 'pending',
            json_encode($paymentResult, JSON_UNESCAPED_UNICODE)
        ]);

        if ($paymentSuccess) {
            $stmt = $db->prepare("UPDATE orders SET status = 'completed' WHERE id = ?");
            $stmt->execute([$orderId]);
            $stmt = $db->prepare("UPDATE payments SET status = 'success' WHERE order_id = ?");
            $stmt->execute([$orderId]);

            // Email automation: purchase_completed event + terk edilen sepet queue'sunu iptal et
            try {
                $eaStmt = $db->prepare("INSERT INTO email_events (event_type, email, user_id) VALUES ('purchase_completed', ?, ?)");
                $eaStmt->execute([$user['email'], $user['id']]);
                $db->prepare("UPDATE email_queue SET status='cancelled' WHERE email=? AND status='pending'")->execute([$user['email']]);
            } catch (Throwable $eaError) {
                error_log('Email automation event error: ' . $eaError->getMessage());
            }

            // Kart kaydetme isteği varsa ve token döndüyse kaydet
            if ($saveCard && !$usingSavedCard) {
                $cardToken = $lidio->extractCardToken($paymentResult);
                if ($cardToken !== null && $cardToken !== '') {
                    $maskedNum = $lidio->extractMaskedCardNumber($paymentResult) ?? ('**** **** **** ' . substr($cardNumber, -4));
                    $cardBrand = $lidio->extractCardBrand($paymentResult);
                    $existingStmt = $db->prepare("SELECT id FROM user_cards WHERE user_id = ? AND lidio_token = ? LIMIT 1");
                    $existingStmt->execute([$user['id'], $cardToken]);
                    if (!$existingStmt->fetch()) {
                        $defaultStmt = $db->prepare("SELECT COUNT(*) FROM user_cards WHERE user_id = ? AND is_active = 1");
                        $defaultStmt->execute([$user['id']]);
                        $isFirst = ((int)$defaultStmt->fetchColumn() === 0) ? 1 : 0;
                        $insertCard = $db->prepare(
                            "INSERT INTO user_cards (user_id, lidio_token, masked_number, card_brand, expire_month, expire_year, card_holder_name, is_default)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
                        );
                        $insertCard->execute([
                            $user['id'], $cardToken, $maskedNum, $cardBrand,
                            $cardExpireMonth, $cardExpireYear, $cardHolderName, $isFirst
                        ]);
                    }
                }
            }
        }

        $db->commit();

        sendResponse([
            'message' => $paymentSuccess ? 'Payment successful' : 'Payment initiated',
            'payment' => $paymentResult,
            'order' => [
                'id' => (int)$order['id'],
                'order_number' => $order['order_number'],
                'status' => $paymentSuccess ? 'completed' : 'processing'
            ]
        ]);
    } catch (Throwable $e) {
        if ($db->inTransaction()) $db->rollBack();
        try {
            $stmt = $db->prepare("UPDATE orders SET status = 'failed' WHERE id = ?");
            $stmt->execute([$orderId]);
            $db->beginTransaction();
            couponReleaseUsageForOrder($db, $orderId);
            $db->commit();
        } catch (Throwable $releaseError) {
            if ($db->inTransaction()) $db->rollBack();
        }
        sendResponse(['error' => '3DS payment processing failed: ' . $e->getMessage()], 500);
    }
}

// GET /api/payment/cards — kullanıcının kayıtlı kartları
if ($action === 'cards' && $method === 'GET' && empty($id)) {
    $payload = requireAuth();
    $stmt = $db->prepare(
        "SELECT id, masked_number, card_brand, expire_month, expire_year, card_holder_name, is_default
         FROM user_cards WHERE user_id = ? AND is_active = 1 ORDER BY is_default DESC, id DESC"
    );
    $stmt->execute([$payload['id']]);
    sendResponse($stmt->fetchAll());
}

// DELETE /api/payment/cards/:id — kayıtlı kartı sil
if ($action === 'cards' && $method === 'DELETE' && $id !== '') {
    $payload = requireAuth();
    $cardId = (int)$id;
    $stmt = $db->prepare("SELECT id FROM user_cards WHERE id = ? AND user_id = ? AND is_active = 1 LIMIT 1");
    $stmt->execute([$cardId, $payload['id']]);
    if (!$stmt->fetch()) {
        sendResponse(['error' => 'Card not found'], 404);
    }
    $db->prepare("UPDATE user_cards SET is_active = 0 WHERE id = ?")->execute([$cardId]);
    // Eğer default kartsa bir sonrakini default yap
    $stmt = $db->prepare("SELECT id FROM user_cards WHERE user_id = ? AND is_active = 1 ORDER BY id DESC LIMIT 1");
    $stmt->execute([$payload['id']]);
    $next = $stmt->fetch();
    if ($next) {
        $db->prepare("UPDATE user_cards SET is_default = 1 WHERE id = ?")->execute([$next['id']]);
    }
    sendResponse(['message' => 'Card removed']);
}

// PATCH /api/payment/cards/:id/default — varsayılan kart yap
if ($action === 'cards' && $method === 'PATCH' && $id !== '' && ($routes[3] ?? '') === 'default') {
    $payload = requireAuth();
    $cardId = (int)$id;
    $stmt = $db->prepare("SELECT id FROM user_cards WHERE id = ? AND user_id = ? AND is_active = 1 LIMIT 1");
    $stmt->execute([$cardId, $payload['id']]);
    if (!$stmt->fetch()) {
        sendResponse(['error' => 'Card not found'], 404);
    }
    $db->prepare("UPDATE user_cards SET is_default = 0 WHERE user_id = ?")->execute([$payload['id']]);
    $db->prepare("UPDATE user_cards SET is_default = 1 WHERE id = ?")->execute([$cardId]);
    sendResponse(['message' => 'Default card updated']);
}

// POST /api/payment/bank-transfer — Referanslı Havale başlat
if ($action === 'bank-transfer' && $method === 'POST') {
    $payload = requireAuth();
    $data = getJsonBody();

    $orderId = (int)($data['order_id'] ?? 0);
    if ($orderId <= 0) {
        sendResponse(['error' => 'order_id zorunludur'], 400);
    }

    $stmt = $db->prepare("SELECT * FROM orders WHERE id = ? AND user_id = ? LIMIT 1");
    $stmt->execute([$orderId, $payload['id']]);
    $order = $stmt->fetch();
    if (!$order) {
        sendResponse(['error' => 'Order not found'], 404);
    }

    $stmt = $db->prepare("SELECT id, email, first_name, last_name, phone FROM users WHERE id = ? LIMIT 1");
    $stmt->execute([$payload['id']]);
    $user = $stmt->fetch();
    if (!$user) {
        sendResponse(['error' => 'User not found'], 404);
    }

    try {
        $db->beginTransaction();

        $stmt = $db->prepare("UPDATE orders SET status = 'processing' WHERE id = ?");
        $stmt->execute([$orderId]);

        $transferData = [
            'orderId'           => 'KHLBT' . time() . $orderId,
            'merchantProcessId' => (string)$orderId,
            'amount'            => (float)$order['total_amount'],
            'currency'          => (string)($order['currency'] ?? 'TRY'),
            'returnUrl'         => resolveFrontendBaseUrl() . '/payment-callback',
            'notificationUrl'   => resolveBackendBaseUrl() . '/payment/callback',
            'customerInfo'      => [
                'customerId'          => (string)$user['id'],
                'customerName'        => (string)$user['first_name'],
                'customerSurname'     => (string)$user['last_name'],
                'customerEmail'       => (string)$user['email'],
                'customerPhoneNumber' => normalizePhoneNumber($user['phone'] ?? ''),
                'customerIpAddress'   => getClientIpAddress()
            ]
        ];

        $result = $lidio->startDirectWireTransfer($transferData);

        // Payments tablosuna kaydet
        $stmt = $db->prepare(
            "INSERT INTO payments (order_id, payment_method, lidio_transaction_id, amount, currency, status, lidio_response)
             VALUES (?, 'bank_transfer', ?, ?, ?, 'pending', ?)"
        );
        $stmt->execute([
            $orderId,
            $result['transactionId'] ?? null,
            $transferData['amount'],
            $transferData['currency'],
            json_encode($result, JSON_UNESCAPED_UNICODE)
        ]);

        $db->commit();

        // Anında Havale: kullanıcı bankasının portalına yönlendirilir
        sendResponse([
            'message'          => 'Anında Havale başlatıldı. Lütfen bankanızın portalına yönlendiriliyor.',
            'requires_redirect' => !empty($result['requiresRedirect']),
            'redirect_url'     => $result['redirectUrl'] ?? null,
            'transaction_id'   => $result['transactionId'] ?? null,
            'amount'           => $transferData['amount'],
            'currency'         => $transferData['currency'],
            'order'            => [
                'id'           => (int)$order['id'],
                'order_number' => $order['order_number'],
                'status'       => 'processing'
            ]
        ]);
    } catch (Throwable $e) {
        if ($db->inTransaction()) $db->rollBack();
        try {
            $db->prepare("UPDATE orders SET status = 'pending' WHERE id = ?")->execute([$orderId]);
        } catch (Throwable $ignored) {}
        sendResponse(['error' => 'Bank transfer initiation failed: ' . $e->getMessage()], 500);
    }
}

if ($action === 'callback' && ($method === 'GET' || $method === 'POST')) {
    $callback = array_merge($_GET, getJsonBody());
    $orderIdLike = (string)($callback['OrderId'] ?? $callback['orderId'] ?? '');
    $status = (string)($callback['Result'] ?? $callback['result'] ?? $callback['status'] ?? '');
    $transactionId = (string)($callback['SystemTransId'] ?? $callback['transactionId'] ?? '');
    $merchantProcessId = (string)($callback['MerchantProcessId'] ?? $callback['merchantProcessId'] ?? '');

    try {
        $db->beginTransaction();
        $order = resolveOrderByCallback($db, $orderIdLike, $merchantProcessId);
        if (!$order) {
            throw new Exception('Order not found');
        }

        $normalizedStatus = strtolower($status);
        $isSuccess = in_array($normalizedStatus, ['success', '3dsuccess', 'approved', 'completed', 'transferred', 'received'], true);

        $stmt = $db->prepare("UPDATE payments SET status = ?, lidio_response = ? WHERE order_id = ?");
        $stmt->execute([$isSuccess ? 'success' : 'failed', json_encode($callback, JSON_UNESCAPED_UNICODE), $order['id']]);

        if ($isSuccess) {
            $stmt = $db->prepare("UPDATE orders SET status = 'completed' WHERE id = ?");
            $stmt->execute([$order['id']]);

            // Email automation: purchase_completed event + terk edilen sepet queue'sunu iptal et
            try {
                $stmtUser = $db->prepare("SELECT email FROM users WHERE id = ? LIMIT 1");
                $stmtUser->execute([$order['user_id']]);
                $cbUser = $stmtUser->fetch();
                if ($cbUser) {
                    $eaStmt = $db->prepare("INSERT INTO email_events (event_type, email, user_id) VALUES ('purchase_completed', ?, ?)");
                    $eaStmt->execute([$cbUser['email'], $order['user_id']]);
                    $db->prepare("UPDATE email_queue SET status='cancelled' WHERE email=? AND status='pending'")->execute([$cbUser['email']]);
                }
            } catch (Throwable $eaError) {
                error_log('Email automation event error (callback): ' . $eaError->getMessage());
            }

            $stmtItems = $db->prepare("SELECT product_id FROM order_items WHERE order_id = ?");
            $stmtItems->execute([$order['id']]);
            $items = $stmtItems->fetchAll();

            $stmtExists = $db->prepare("SELECT id FROM subscriptions WHERE user_id = ? AND product_id = ? AND order_id = ? LIMIT 1");
            $stmtInsert = $db->prepare(
                "INSERT INTO subscriptions (user_id, product_id, order_id, status, starts_at, expires_at, auto_renew, next_renewal_at)
                 VALUES (?, ?, ?, 'active', NOW(), ?, ?, ?)"
            );
            foreach ($items as $item) {
                $stmtExists->execute([$order['user_id'], $item['product_id'], $order['id']]);
                if (!$stmtExists->fetch()) {
                    // duration_days varsa expires_at hesapla
                    $stmtDur = $db->prepare("SELECT duration_days, type FROM products WHERE id = ? LIMIT 1");
                    $stmtDur->execute([$item['product_id']]);
                    $prod = $stmtDur->fetch();
                    $expiresAt = null;
                    $nextRenewalAt = null;
                    $autoRenew = 0;
                    if ($prod && (int)($prod['duration_days'] ?? 0) > 0) {
                        $days = (int)$prod['duration_days'];
                        $expiresAt = date('Y-m-d H:i:s', strtotime("+{$days} days"));
                        if ($prod['type'] === 'subscription') {
                            $autoRenew = 1;
                            $nextRenewalAt = $expiresAt;
                        }
                    }
                    $stmtInsert->execute([$order['user_id'], $item['product_id'], $order['id'], $expiresAt, $autoRenew, $nextRenewalAt]);
                }
            }
        } else {
            $stmt = $db->prepare("UPDATE orders SET status = 'failed' WHERE id = ?");
            $stmt->execute([$order['id']]);
            couponReleaseUsageForOrder($db, $order['id']);
        }

        $db->commit();
        sendResponse(['message' => 'Payment callback processed', 'status' => $status, 'transactionId' => $transactionId]);
    } catch (Throwable $e) {
        if ($db->inTransaction()) $db->rollBack();
        sendResponse(['error' => $e->getMessage()], 500);
    }
}

if ($action === 'status' && !empty($id) && $method === 'GET') {
    $payload = requireAuth();
    $orderId = (int)$id;
    $stmt = $db->prepare(
        "SELECT p.*, o.order_number, o.status AS order_status
         FROM payments p
         INNER JOIN orders o ON o.id = p.order_id
         WHERE o.id = ? AND o.user_id = ?
         ORDER BY p.id DESC
         LIMIT 1"
    );
    $stmt->execute([$orderId, $payload['id']]);
    $payment = $stmt->fetch();
    if (!$payment) {
        sendResponse(['error' => 'Payment not found'], 404);
    }
    sendResponse(['payment' => $payment]);
}

sendResponse(['error' => 'Action not found'], 404);
