<?php
// api/routes/orders.php
require_once __DIR__ . '/../services/CouponService.php';

$db = Database::getInstance();
ensureMustChangePasswordColumn($db);
$hasMustChangePassword = hasMustChangePasswordColumn($db);
ensureCouponSchema($db);
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

function sendWelcomeAccountEmail(PDO $db, $email, $firstName, $authToken)
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

    $subject = 'Khilonfast - Hesabınız Hazır, Şifrenizi Belirleyin';
    $safeFirst = htmlspecialchars((string)$firstName, ENT_QUOTES, 'UTF-8');
    $setPasswordUrl = 'https://khilonfast.com/sifre-belirle?token=' . urlencode((string)$authToken);

    $html = "<!doctype html><html lang='tr'><body style='font-family:Arial,sans-serif;background:#f6f8fb;padding:20px;margin:0;'>
        <div style='max-width:600px;margin:0 auto;background:#fff;border:1px solid #dde7f0;border-radius:12px;overflow:hidden;'>
        <div style='background:linear-gradient(90deg,#1a3a52,#89b004);color:#fff;padding:20px 24px;'>
            <h2 style='margin:0;font-size:1.3rem;'>Satın Alımınız Tamamlandı!</h2>
        </div>
        <div style='padding:24px;color:#102a43;line-height:1.7;'>
            <p style='margin-top:0;'>Merhaba <strong>{$safeFirst}</strong>,</p>
            <p>Satın alımınız başarıyla tamamlandı. Satın aldığınız içeriklere her zaman erişmek için bir şifre belirlemeniz yeterli.</p>
            <div style='text-align:center;margin:28px 0;'>
                <a href='{$setPasswordUrl}'
                   style='background-color:#1a3a52;color:#ffffff !important;text-decoration:none;
                          padding:14px 32px;border-radius:8px;font-weight:700;font-size:1rem;display:inline-block;'>
                    Şifremi Belirle →
                </a>
            </div>
            <p style='font-size:0.85rem;color:#64748b;'>Bu butona tıklayarak hesabınıza doğrudan giriş yapıp şifrenizi oluşturabilirsiniz.
            Link 7 gün geçerlidir.</p>
            <hr style='border:none;border-top:1px solid #e2e8f0;margin:20px 0;'/>
            <p style='font-size:0.82rem;color:#94a3b8;margin:0;'>Eğer bu satın alımı siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz.</p>
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
    $couponCode = couponNormalizeCode($data['coupon_code'] ?? '');

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

            if ($hasMustChangePassword) {
                $stmt = $db->prepare(
                    "INSERT INTO users (email, password_hash, first_name, last_name, phone, must_change_password, role)
                     VALUES (?, ?, ?, ?, ?, 1, 'user')"
                );
                $stmt->execute([$guestEmail, $passwordHash, $firstName, $lastName, ($guestPhone !== '' ? $guestPhone : null)]);
            } else {
                $stmt = $db->prepare(
                    "INSERT INTO users (email, password_hash, first_name, last_name, phone, role)
                     VALUES (?, ?, ?, ?, ?, 'user')"
                );
                $stmt->execute([$guestEmail, $passwordHash, $firstName, $lastName, ($guestPhone !== '' ? $guestPhone : null)]);
            }
            $userId = (int)$db->lastInsertId();

            $authToken = encodeJWT(['id' => $userId, 'email' => $guestEmail, 'role' => 'user']);
            $accountCreated = true;

            try {
                sendWelcomeAccountEmail($db, $guestEmail, $firstName, $authToken);
                $accountEmailSent = true;
            } catch (Throwable $mailError) {
                error_log('Welcome email send error: ' . $mailError->getMessage());
            }
        }

        $pricing = couponBuildPricingPreview(
            $db,
            $items,
            $couponCode,
            ['id' => $userId, 'email' => $guestEmail !== '' ? $guestEmail : ($payload['email'] ?? null)],
            $guestEmail,
            $couponCode !== ''
        );

        $orderItems = array_map(static function ($line) {
            return [
                'product_id' => (int)$line['product_id'],
                'quantity' => (int)$line['quantity'],
                'unit_price' => (float)$line['unit_price'],
                'total_price' => (float)$line['total_price']
            ];
        }, $pricing['items']);

        $orderNumber = 'ORD-' . time() . '-' . $userId;
        $stmt = $db->prepare(
            "INSERT INTO orders (
                user_id, order_number, subtotal_amount, coupon_discount_amount, shipping_amount, tax_amount,
                total_amount, coupon_id, coupon_code, coupon_name, applied_coupon_snapshot_json, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')"
        );
        $stmt->execute([
            $userId,
            $orderNumber,
            $pricing['subtotal'],
            $pricing['discount'],
            $pricing['shipping'],
            $pricing['tax'],
            $pricing['total'],
            $pricing['applied_coupon']['id'] ?? null,
            $pricing['applied_coupon']['code'] ?? null,
            $pricing['applied_coupon']['name'] ?? null,
            $pricing['applied_coupon'] ? json_encode($pricing['applied_coupon'], JSON_UNESCAPED_UNICODE) : null
        ]);
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

        if (!empty($pricing['applied_coupon']) && (float)$pricing['discount'] > 0) {
            couponReserveUsage($db, $pricing['applied_coupon'], $userId, $orderId, $pricing['discount']);
        }

        $db->commit();

        sendResponse([
            'message' => 'Order created successfully',
            'order' => [
                'id' => $orderId,
                'order_number' => $orderNumber,
                'subtotal_amount' => $pricing['subtotal'],
                'coupon_discount_amount' => $pricing['discount'],
                'shipping_amount' => $pricing['shipping'],
                'tax_amount' => $pricing['tax'],
                'total_amount' => $pricing['total'],
                'coupon_code' => $pricing['applied_coupon']['code'] ?? null,
                'coupon_name' => $pricing['applied_coupon']['name'] ?? null,
                'status' => 'pending'
            ],
            'auth_token' => $authToken,
            'account' => [
                'created' => $accountCreated,
                'email_sent' => $accountEmailSent
            ]
        ], 201);
    } catch (CouponValidationException $e) {
        if ($db->inTransaction()) $db->rollBack();
        sendResponse(['error' => $e->getMessage()], 400);
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
        $order['subtotal_amount'] = (float)($order['subtotal_amount'] ?? $order['total_amount'] ?? 0);
        $order['coupon_discount_amount'] = (float)($order['coupon_discount_amount'] ?? 0);
        $order['shipping_amount'] = (float)($order['shipping_amount'] ?? 0);
        $order['tax_amount'] = (float)($order['tax_amount'] ?? 0);
        $order['total_amount'] = (float)($order['total_amount'] ?? 0);
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
    $order['subtotal_amount'] = (float)($order['subtotal_amount'] ?? $order['total_amount'] ?? 0);
    $order['coupon_discount_amount'] = (float)($order['coupon_discount_amount'] ?? 0);
    $order['shipping_amount'] = (float)($order['shipping_amount'] ?? 0);
    $order['tax_amount'] = (float)($order['tax_amount'] ?? 0);
    $order['total_amount'] = (float)($order['total_amount'] ?? 0);
    $order['items'] = $order['items'] ? json_decode('[' . $order['items'] . ']', true) : [];
    sendResponse(['order' => $order]);
}

sendResponse(['error' => 'Action not found'], 404);
