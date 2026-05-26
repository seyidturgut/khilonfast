<?php
// api/routes/orders.php
require_once __DIR__ . '/../services/CouponService.php';

$db = Database::getInstance();
ensureMustChangePasswordColumn($db);
$hasMustChangePassword = hasMustChangePasswordColumn($db);
ensureCouponSchema($db);

// 9+ kalemli siparişlerde GROUP_CONCAT(JSON_OBJECT(...)) varsayılan 1024 byte
// sınırını aşar ve items string'i kesik gelir → frontend JSON parse hatası
// alır ve items boş kalır. Bu da "Form Bekliyor" CTA'larının görünmemesine
// sebep olur. Session bazlı limit 1MB'a çekiliyor.
try { $db->exec("SET SESSION group_concat_max_len = 1048576"); } catch (Throwable $e) {}

// Auto-migration: orders.customer_lang — locale-aware mail için
try {
    $col = $db->query("SHOW COLUMNS FROM orders LIKE 'customer_lang'")->fetch();
    if (!$col) {
        $db->exec("ALTER TABLE orders ADD COLUMN customer_lang VARCHAR(2) NOT NULL DEFAULT 'tr' AFTER currency");
    }
} catch (Throwable $e) { error_log('[orders] customer_lang migration: ' . $e->getMessage()); }

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

    sendTransactionalEmail($db, $email, $subject, $html);
}

if ($method === 'POST' && empty($action)) {
    $data = getJsonBody();
    $items = $data['items'] ?? null;
    if (!is_array($items) || count($items) < 1) {
        sendResponse(['error' => 'Order must contain at least one item'], 400);
    }

    // Maestro AI henüz satın alınamaz — maestro-* ürün içeren sipariş reddedilir.
    foreach ($items as $itm) {
        $pk = strtolower((string)($itm['product_key'] ?? ''));
        if (strpos($pk, 'maestro-') === 0) {
            sendResponse(['error' => 'Maestro AI hizmeti şu anda satın alınamıyor. Detaylı bilgi için: info@khilonfast.com'], 403);
        }
    }

    // Fatura bilgileri — Türk vergi mevzuatı gereği zorunlu
    $customerType = (($data['customer_type'] ?? 'individual') === 'company') ? 'company' : 'individual';
    $nationalId = preg_replace('/\D+/', '', (string)($data['national_id'] ?? ''));
    $billCompanyName = trim((string)($data['company_name'] ?? ''));
    $billTaxOffice = trim((string)($data['tax_office'] ?? ''));
    $billTaxNumber = trim((string)($data['tax_number'] ?? ''));
    // EN site'den (yabancı müşteri) gelen siparişlerde TC/vergi zorunluluğu YOK
    $orderLang = strtolower(trim((string)($data['lang'] ?? 'tr')));
    if ($orderLang !== 'en') {
        if ($customerType === 'individual') {
            if (strlen($nationalId) !== 11) {
                sendResponse(['error' => 'Fatura için geçerli TC kimlik numarası zorunludur (11 hane).'], 400);
            }
        } else {
            if ($billCompanyName === '' || $billTaxNumber === '' || $billTaxOffice === '') {
                sendResponse(['error' => 'Kurumsal fatura için şirket ünvanı, vergi dairesi ve vergi numarası zorunludur.'], 400);
            }
        }
    }

    $userId = $payload['id'] ?? null;
    $authToken = null;
    $accountCreated = false;
    $accountEmailSent = false;

    $guestEmail = trim((string)($data['guest_email'] ?? ''));
    $guestName = trim((string)($data['guest_name'] ?? ''));
    $guestPhone = trim((string)($data['guest_phone'] ?? ''));
    $couponCode = couponNormalizeCode($data['coupon_code'] ?? '');
    $customerLang = strtolower(trim((string)($data['lang'] ?? 'tr')));
    if (!in_array($customerLang, ['tr', 'en'], true)) $customerLang = 'tr';

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
        }

        // Fatura bilgilerini kaydet (logged-in veya guest farketmez) — EN'de boş gönderilebilir, atla
        if ($orderLang === 'en' && $nationalId === '' && $billTaxNumber === '') {
            // Yabancı müşteri, kayıt edilecek bilgi yok
        } elseif ($customerType === 'individual') {
            $db->prepare("UPDATE users SET national_id = ? WHERE id = ?")->execute([$nationalId, $userId]);
        } else {
            $db->prepare(
                "INSERT INTO company_info (user_id, company_name, tax_number, tax_office)
                 VALUES (?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE company_name = VALUES(company_name),
                                         tax_number = VALUES(tax_number),
                                         tax_office = VALUES(tax_office)"
            )->execute([$userId, $billCompanyName, $billTaxNumber, $billTaxOffice]);
        }

        // NOT: Welcome email artık burada DEĞİL — payment callback'te 'completed' olunca gönderiliyor.
        // Sebebi: 3D Secure SMS doğrulanmadan ya da fraud check geçmeden kullanıcıya
        // "Satın alımınız başarıyla tamamlandı" e-postası giderse yanıltıcı olur.
        // Bkz: api/routes/payment.php — sendGuestWelcomeEmailIfNeeded()

        require_once __DIR__ . '/../services/CurrencyService.php';

        $pricing = couponBuildPricingPreview(
            $db,
            $items,
            $couponCode,
            ['id' => $userId, 'email' => $guestEmail !== '' ? $guestEmail : ($payload['email'] ?? null)],
            $guestEmail,
            $couponCode !== ''
        );

        // USD→TRY çevirim için kullanılan oranı kilitle (audit). pricing[items] içinde original_currency=USD varsa.
        $usedUsdConversion = false;
        foreach ($pricing['items'] ?? [] as $line) {
            if (($line['original_currency'] ?? '') === 'USD') { $usedUsdConversion = true; break; }
        }
        $rateUsed = null;
        if ($usedUsdConversion) {
            $info = getCurrentUsdTryRate($db);
            $rateUsed = (float)$info['rate'];
        }

        $orderItems = array_map(static function ($line) {
            return [
                'product_id' => (int)$line['product_id'],
                'quantity' => (int)$line['quantity'],
                'unit_price' => (float)$line['unit_price'],
                'total_price' => (float)$line['total_price']
            ];
        }, $pricing['items']);

        $isFreeOrder = (float)$pricing['total'] <= 0;
        $orderStatus = $isFreeOrder ? 'completed' : 'pending';

        $orderNumber = 'ORD-' . time() . '-' . $userId;
        $stmt = $db->prepare(
            "INSERT INTO orders (
                user_id, order_number, subtotal_amount, coupon_discount_amount, shipping_amount, tax_amount,
                total_amount, coupon_id, coupon_code, coupon_name, applied_coupon_snapshot_json,
                currency, customer_lang, status, usd_try_rate_used, customer_type
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'TRY', ?, ?, ?, ?)"
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
            $pricing['applied_coupon'] ? json_encode($pricing['applied_coupon'], JSON_UNESCAPED_UNICODE) : null,
            $customerLang,
            $orderStatus,
            $rateUsed,
            $customerType,
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

        // ÜCRETSİZ SİPARİŞ (%100 kupon vb): payment kaydı + subscription'ları hemen oluştur
        if ($isFreeOrder) {
            $payStmt = $db->prepare(
                "INSERT INTO payments (order_id, payment_method, amount, currency, status, lidio_response)
                 VALUES (?, 'coupon_free', 0, 'TRY', 'success', ?)"
            );
            $payStmt->execute([
                $orderId,
                json_encode([
                    'free_order' => true,
                    'coupon' => $pricing['applied_coupon'] ?? null
                ], JSON_UNESCAPED_UNICODE)
            ]);

            // Ücretsiz sipariş — kart yok, manual_transfer işaretle
            createSubscriptionsForOrder($db, (int)$userId, (int)$orderId, 'manual_transfer', null);

            // %100 kupon ile bedavaya alan misafire welcome email — sipariş zaten completed
            // (Ücretli akışta welcome email payment callback'te 'completed' olunca gönderilir.)
            if ($accountCreated) {
                try {
                    sendWelcomeAccountEmail($db, $guestEmail, $firstName, $authToken);
                    $accountEmailSent = true;
                    try {
                        $db->prepare("UPDATE users SET welcome_email_sent = NOW() WHERE id = ?")->execute([$userId]);
                    } catch (Throwable $e) {
                        try {
                            $db->exec("ALTER TABLE users ADD COLUMN welcome_email_sent TIMESTAMP NULL");
                            $db->prepare("UPDATE users SET welcome_email_sent = NOW() WHERE id = ?")->execute([$userId]);
                        } catch (Throwable $alterErr) {}
                    }
                } catch (Throwable $mailError) {
                    error_log('[orders/free] welcome email send error: ' . $mailError->getMessage());
                }
            }
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
            'payment_required' => (float)$pricing['total'] > 0,
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
                    'order_item_id', oi.id,
                    'product_id', oi.product_id,
                    'product_name', p.name,
                    'product_category', p.category,
                    'product_key', p.product_key,
                    'product_type', p.type,
                    'requires_onboarding', COALESCE(p.requires_onboarding, 0),
                    'duration_days', p.duration_days,
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
                    'order_item_id', oi.id,
                    'product_id', oi.product_id,
                    'product_name', p.name,
                    'product_category', p.category,
                    'product_key', p.product_key,
                    'product_type', p.type,
                    'requires_onboarding', COALESCE(p.requires_onboarding, 0),
                    'duration_days', p.duration_days,
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
