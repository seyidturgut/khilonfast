<?php
// api/routes/orders.php

$db = Database::getInstance();
ensureMustChangePasswordColumn($db);
$payload = optionalAuth();

function splitFullName($fullName)
{
    $cleaned = trim(preg_replace('/\s+/', ' ', (string)$fullName));
    if ($cleaned === '') return ['Yeni', 'Musteri'];
    $parts = explode(' ', $cleaned);
    $first = array_shift($parts);
    $last = count($parts) > 0 ? implode(' ', $parts) : 'Musteri';
    return [$first, $last];
}

function sendWelcomeAccountEmail(PDO $db, $email, $firstName, $temporaryPassword)
{
    $smtpHost = (string)getSetting($db, 'smtp_host', '');
    $smtpPort = (int)getSetting($db, 'smtp_port', '465');
    $smtpUser = (string)getSetting($db, 'smtp_user', '');
    $smtpPass = (string)getSetting($db, 'smtp_pass', '');
    $smtpSecure = parseBool(getSetting($db, 'smtp_secure', $smtpPort === 465 ? 'true' : 'false'), $smtpPort === 465);
    $from = (string)getSetting($db, 'contact_email', $smtpUser);

    if ($smtpHost === '' || $smtpUser === '' || $smtpPass === '' || $from === '') {
        throw new Exception('SMTP settings missing');
    }

    $subject = 'Khilonfast - Kayit Tamamlandi';
    $safeFirst = htmlspecialchars((string)$firstName, ENT_QUOTES, 'UTF-8');
    $safeEmail = htmlspecialchars((string)$email, ENT_QUOTES, 'UTF-8');
    $safePass = htmlspecialchars((string)$temporaryPassword, ENT_QUOTES, 'UTF-8');

    $html = "<!doctype html><html lang='tr'><body style='font-family:Arial,sans-serif;background:#f6f8fb;padding:20px;'>
        <div style='max-width:600px;margin:0 auto;background:#fff;border:1px solid #dde7f0;border-radius:12px;overflow:hidden;'>
        <div style='background:#0f766e;color:#fff;padding:18px 20px;'><h2 style='margin:0;'>Kayit Tamamlandi</h2></div>
        <div style='padding:20px;color:#102a43;'>
        <p>Merhaba {$safeFirst},</p>
        <p>Satın alma sırasında hesabınız oluşturuldu.</p>
        <p><strong>E-posta:</strong> {$safeEmail}<br/><strong>Gecici Sifre:</strong> <code>{$safePass}</code></p>
        <p>İlk girişte güvenlik için şifrenizi değiştirmeniz zorunludur.</p>
        </div></div></body></html>";

    sendSmtpEmail(
        $smtpHost,
        $smtpPort,
        $smtpUser,
        $smtpPass,
        $from,
        $email,
        $subject,
        $html
    );
}

if ($method === 'POST' && empty($action)) {
    $data = getJsonBody();
    $items = $data['items'] ?? null;
    if (!is_array($items) || count($items) < 1) {
        sendResponse(['error' => 'Order must contain at least one item'], 400);
    }

    $userId = $payload['id'] ?? null;
    $authToken = null;
    $accountCreated = false;
    $accountEmailSent = false;

    $guestEmail = trim((string)($data['guest_email'] ?? ''));
    $guestName = trim((string)($data['guest_name'] ?? ''));
    $guestPhone = trim((string)($data['guest_phone'] ?? ''));

    try {
        $db->beginTransaction();

        if (!$userId) {
            if (!filter_var($guestEmail, FILTER_VALIDATE_EMAIL)) {
                $db->rollBack();
                sendResponse(['error' => 'Guest checkout icin gecerli e-posta zorunludur.'], 400);
            }

            $stmt = $db->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
            $stmt->execute([$guestEmail]);
            if ($stmt->fetch()) {
                $db->rollBack();
                sendResponse(['error' => 'Bu e-posta zaten kayitli. Lutfen giris yapin.'], 409);
            }

            [$firstName, $lastName] = splitFullName($guestName);
            $temporaryPassword = generateTemporaryPassword(12);
            $passwordHash = password_hash($temporaryPassword, PASSWORD_BCRYPT);

            $stmt = $db->prepare(
                "INSERT INTO users (email, password_hash, first_name, last_name, phone, must_change_password, role)
                 VALUES (?, ?, ?, ?, ?, 1, 'user')"
            );
            $stmt->execute([$guestEmail, $passwordHash, $firstName, $lastName, ($guestPhone !== '' ? $guestPhone : null)]);
            $userId = (int)$db->lastInsertId();

            $authToken = encodeJWT(['id' => $userId, 'email' => $guestEmail, 'role' => 'user']);
            $accountCreated = true;

            try {
                sendWelcomeAccountEmail($db, $guestEmail, $firstName, $temporaryPassword);
                $accountEmailSent = true;
            } catch (Throwable $mailError) {
                error_log('Welcome email send error: ' . $mailError->getMessage());
            }
        }

        $totalAmount = 0.0;
        $orderItems = [];

        foreach ($items as $item) {
            $productId = isset($item['product_id']) ? (int)$item['product_id'] : 0;
            $productKey = trim((string)($item['product_key'] ?? ''));
            $quantity = max(1, (int)($item['quantity'] ?? 1));

            $product = null;
            if ($productId > 0) {
                $stmt = $db->prepare("SELECT * FROM products WHERE id = ? AND is_active = 1 LIMIT 1");
                $stmt->execute([$productId]);
                $product = $stmt->fetch();
            } elseif ($productKey !== '') {
                $stmt = $db->prepare("SELECT * FROM products WHERE product_key = ? AND is_active = 1 LIMIT 1");
                $stmt->execute([$productKey]);
                $product = $stmt->fetch();
            }

            if (!$product) {
                throw new Exception('Product not found');
            }

            $unitPrice = (float)$product['price'];
            $itemTotal = $unitPrice * $quantity;
            $totalAmount += $itemTotal;
            $orderItems[] = [
                'product_id' => (int)$product['id'],
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'total_price' => $itemTotal
            ];
        }

        $orderNumber = 'ORD-' . time() . '-' . $userId;
        $stmt = $db->prepare("INSERT INTO orders (user_id, order_number, total_amount, status) VALUES (?, ?, ?, 'pending')");
        $stmt->execute([$userId, $orderNumber, $totalAmount]);
        $orderId = (int)$db->lastInsertId();

        $stmt = $db->prepare(
            "INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)"
        );
        foreach ($orderItems as $orderItem) {
            $stmt->execute([
                $orderId,
                $orderItem['product_id'],
                $orderItem['quantity'],
                $orderItem['unit_price'],
                $orderItem['total_price']
            ]);
        }

        $db->commit();

        sendResponse([
            'message' => 'Order created successfully',
            'order' => [
                'id' => $orderId,
                'order_number' => $orderNumber,
                'total_amount' => $totalAmount,
                'status' => 'pending'
            ],
            'auth_token' => $authToken,
            'account' => [
                'created' => $accountCreated,
                'email_sent' => $accountEmailSent
            ]
        ], 201);
    } catch (Throwable $e) {
        if ($db->inTransaction()) $db->rollBack();
        sendResponse(['error' => $e->getMessage() ?: 'Server error'], 500);
    }
}

if (!$payload) {
    sendResponse(['error' => 'Unauthorized'], 401);
}

if ($method === 'GET' && $action === 'user') {
    $requestedUserId = (int)$id;
    if ($requestedUserId !== (int)$payload['id']) {
        sendResponse(['error' => 'Forbidden'], 403);
    }

    $stmt = $db->prepare(
        "SELECT o.*,
            GROUP_CONCAT(
                JSON_OBJECT(
                    'id', oi.id,
                    'product_id', oi.product_id,
                    'product_name', p.name,
                    'quantity', oi.quantity,
                    'unit_price', oi.unit_price,
                    'total_price', oi.total_price
                )
            ) AS items
         FROM orders o
         LEFT JOIN order_items oi ON o.id = oi.order_id
         LEFT JOIN products p ON oi.product_id = p.id
         WHERE o.user_id = ?
         GROUP BY o.id
         ORDER BY o.created_at DESC"
    );
    $stmt->execute([$payload['id']]);
    $orders = $stmt->fetchAll();

    $out = [];
    foreach ($orders as $order) {
        $order['id'] = (int)$order['id'];
        $order['user_id'] = (int)$order['user_id'];
        $order['items'] = $order['items'] ? json_decode('[' . $order['items'] . ']', true) : [];
        $out[] = $order;
    }
    sendResponse(['orders' => $out]);
}

if ($method === 'GET' && !empty($action)) {
    $orderId = (int)$action;
    $stmt = $db->prepare(
        "SELECT o.*,
            GROUP_CONCAT(
                JSON_OBJECT(
                    'id', oi.id,
                    'product_id', oi.product_id,
                    'product_name', p.name,
                    'quantity', oi.quantity,
                    'unit_price', oi.unit_price,
                    'total_price', oi.total_price
                )
            ) AS items
         FROM orders o
         LEFT JOIN order_items oi ON o.id = oi.order_id
         LEFT JOIN products p ON oi.product_id = p.id
         WHERE o.id = ? AND o.user_id = ?
         GROUP BY o.id"
    );
    $stmt->execute([$orderId, $payload['id']]);
    $order = $stmt->fetch();
    if (!$order) {
        sendResponse(['error' => 'Order not found'], 404);
    }
    $order['id'] = (int)$order['id'];
    $order['user_id'] = (int)$order['user_id'];
    $order['items'] = $order['items'] ? json_decode('[' . $order['items'] . ']', true) : [];
    sendResponse(['order' => $order]);
}

sendResponse(['error' => 'Action not found'], 404);

