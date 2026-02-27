<?php
// api/routes/payment.php
require_once __DIR__ . '/../services/LidioService.php';

$db = Database::getInstance();
ensureMustChangePasswordColumn($db);
$lidio = new LidioService($db);

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

    if ($orderId <= 0) {
        sendResponse(['error' => 'Required fields missing'], 400);
    }
    if (!$useHosted && ($cardNumber === '' || $cardHolderName === '' || $cardExpireMonth < 1 || $cardExpireYear < 2000 || $cardCvv === '')) {
        sendResponse(['error' => 'Card fields are required'], 400);
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

        $paymentData = [
            'orderId' => 'KHL' . time() . $orderId,
            'merchantProcessId' => (string)$orderId,
            'amount' => (float)$order['total_amount'],
            'currency' => (string)($order['currency'] ?? 'TRY'),
            'cardNumber' => $cardNumber,
            'cardHolderName' => $cardHolderName,
            'cardExpireMonth' => $cardExpireMonth,
            'cardExpireYear' => $cardExpireYear,
            'cardCvv' => $cardCvv,
            'returnUrl' => resolveFrontendBaseUrl() . '/payment-callback',
            'notificationUrl' => resolveBackendBaseUrl() . '/payment/callback',
            'customerInfo' => [
                'customerId' => (string)$user['id'],
                'customerName' => (string)$user['first_name'],
                'customerSurname' => (string)$user['last_name'],
                'customerEmail' => (string)$user['email'],
                'customerPhoneNumber' => normalizePhoneNumber($user['phone'] ?? ''),
                'customerIpAddress' => getClientIpAddress()
            ]
        ];

        if ($useHosted) {
            $paymentData['hostedOrderId'] = 'KHLH' . time() . $orderId;
            $paymentResult = $lidio->startHostedPaymentProcess($paymentData);
        } else {
            $paymentResult = $use3ds ? $lidio->process3DSPayment($paymentData) : $lidio->process3DSPayment($paymentData);
        }

        $stmt = $db->prepare(
            "INSERT INTO payments (order_id, payment_method, lidio_transaction_id, amount, currency, status, lidio_response)
             VALUES (?, 'credit_card', ?, ?, ?, ?, ?)"
        );
        $stmt->execute([
            $orderId,
            $paymentResult['transactionId'] ?? null,
            $paymentData['amount'],
            $paymentData['currency'],
            (!empty($paymentResult['success']) && empty($paymentResult['requires3DS'])) ? 'success' : 'pending',
            json_encode($paymentResult, JSON_UNESCAPED_UNICODE)
        ]);

        if (!empty($paymentResult['success']) && empty($paymentResult['requires3DS'])) {
            $stmt = $db->prepare("UPDATE orders SET status = 'completed' WHERE id = ?");
            $stmt->execute([$orderId]);
            $stmt = $db->prepare("UPDATE payments SET status = 'success' WHERE order_id = ?");
            $stmt->execute([$orderId]);
        }

        $db->commit();

        sendResponse([
            'message' => (!empty($paymentResult['success']) && empty($paymentResult['requires3DS'])) ? 'Payment successful' : 'Payment initiated',
            'payment' => $paymentResult,
            'order' => [
                'id' => (int)$order['id'],
                'order_number' => $order['order_number'],
                'status' => (!empty($paymentResult['success']) && empty($paymentResult['requires3DS'])) ? 'completed' : 'processing'
            ]
        ]);
    } catch (Throwable $e) {
        if ($db->inTransaction()) $db->rollBack();
        sendResponse(['error' => '3DS payment processing failed: ' . $e->getMessage()], 500);
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
        $isSuccess = in_array($normalizedStatus, ['success', '3dsuccess', 'approved', 'completed'], true);

        $stmt = $db->prepare("UPDATE payments SET status = ?, lidio_response = ? WHERE order_id = ?");
        $stmt->execute([$isSuccess ? 'success' : 'failed', json_encode($callback, JSON_UNESCAPED_UNICODE), $order['id']]);

        if ($isSuccess) {
            $stmt = $db->prepare("UPDATE orders SET status = 'completed' WHERE id = ?");
            $stmt->execute([$order['id']]);

            $stmtItems = $db->prepare("SELECT product_id FROM order_items WHERE order_id = ?");
            $stmtItems->execute([$order['id']]);
            $items = $stmtItems->fetchAll();

            $stmtExists = $db->prepare("SELECT id FROM subscriptions WHERE user_id = ? AND product_id = ? AND order_id = ? LIMIT 1");
            $stmtInsert = $db->prepare("INSERT INTO subscriptions (user_id, product_id, order_id, status) VALUES (?, ?, ?, 'active')");
            foreach ($items as $item) {
                $stmtExists->execute([$order['user_id'], $item['product_id'], $order['id']]);
                if (!$stmtExists->fetch()) {
                    $stmtInsert->execute([$order['user_id'], $item['product_id'], $order['id']]);
                }
            }
        } else {
            $stmt = $db->prepare("UPDATE orders SET status = 'failed' WHERE id = ?");
            $stmt->execute([$order['id']]);
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
