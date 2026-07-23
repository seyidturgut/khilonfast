<?php
// api/routes/payment.php
require_once __DIR__ . '/../services/LidioService.php';
require_once __DIR__ . '/../services/CouponService.php';

/**
 * Misafir (guest) checkout sırasında oluşturulan kullanıcılara welcome e-postası gönder.
 * SADECE ödeme başarıyla tamamlanınca (callback'te resolvedStatus='completed') tetiklenir.
 * Daha önce hatalı şekilde sipariş oluşturulurken gidiyordu (3D Secure öncesi); bug fix.
 */
function sendGuestWelcomeEmailIfNeeded(PDO $db, int $userId): void
{
    try {
        $stmt = $db->prepare("SELECT email, first_name, must_change_password, welcome_email_sent FROM users WHERE id = ? LIMIT 1");
        $stmt->execute([$userId]);
        $u = $stmt->fetch();
        if (!$u) return;
        // Sadece must_change_password=1 olan (misafir checkout ile oluşturulan) kullanıcılar
        if ((int)$u['must_change_password'] !== 1) return;
        // Idempotency: aynı kullanıcıya tekrar gönderme
        if (!empty($u['welcome_email_sent'])) return;

        $authToken = encodeJWT(['id' => $userId, 'email' => $u['email'], 'role' => 'user']);
        // orders.php içindeki helper'ı yeniden kullan
        require_once __DIR__ . '/orders.php';
        if (function_exists('sendWelcomeAccountEmail')) {
            sendWelcomeAccountEmail($db, $u['email'], $u['first_name'] ?? '', $authToken);
            // Flag set — bu kullanıcıya bir daha gönderme (PN callback ya da retry tekrarlasa bile)
            try {
                $db->prepare("UPDATE users SET welcome_email_sent = NOW() WHERE id = ?")->execute([$userId]);
            } catch (Throwable $e) {
                // welcome_email_sent kolonu yoksa ALTER ekle
                try {
                    $db->exec("ALTER TABLE users ADD COLUMN welcome_email_sent TIMESTAMP NULL");
                    $db->prepare("UPDATE users SET welcome_email_sent = NOW() WHERE id = ?")->execute([$userId]);
                } catch (Throwable $alterErr) {
                    error_log('[guest-welcome] flag column add: ' . $alterErr->getMessage());
                }
            }
        }
    } catch (Throwable $e) {
        error_log('[guest-welcome] send: ' . $e->getMessage());
    }
}

$db = Database::getInstance();
try { ensureMustChangePasswordColumn($db); } catch (Throwable $e) { error_log('ensureMustChangePasswordColumn: ' . $e->getMessage()); }
try { ensureCouponSchema($db); } catch (Throwable $e) { error_log('ensureCouponSchema: ' . $e->getMessage()); }
try { ensureUserCardsSchema($db); } catch (Throwable $e) { error_log('ensureUserCardsSchema: ' . $e->getMessage()); }
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

    // Son fallback: bizim ürettiğimiz orderId pattern'i `KHL{10-digit-timestamp}{order_id}` veya
    // `KHLBT{10-digit-timestamp}{order_id}` veya `KHLH{10-digit-timestamp}{order_id}` formatında —
    // trailing digit'leri parse edip orders.id ile eşle. Eski kayıtlar (lidio_response.orderId yok) için.
    if ($orderIdLike !== '' && preg_match('/^KHL(?:BT|H)?(\d{10,})$/i', $orderIdLike, $m)) {
        $tail = $m[1];
        // İlk 10 hane unix timestamp, geri kalanı order id
        if (strlen($tail) > 10) {
            $parsedOrderId = (int)substr($tail, 10);
            if ($parsedOrderId > 0) {
                $stmt = $db->prepare("SELECT * FROM orders WHERE id = ? LIMIT 1");
                $stmt->execute([$parsedOrderId]);
                $row = $stmt->fetch();
                if ($row) return $row;
            }
        }
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

    // %100 kupon veya ücretsiz sipariş — Lidio'ya gitme, direkt tamamla
    if ((float)$order['total_amount'] == 0) {
        try {
            $db->beginTransaction();
            $db->prepare("UPDATE orders SET status = 'completed' WHERE id = ?")->execute([$orderId]);
            // Ücretsiz sipariş (kupon ile %100 indirim) — kart yok, manual_transfer işaretle
            createSubscriptionsForOrder($db, (int)$payload['id'], (int)$orderId, 'manual_transfer', null);
            $db->commit();

            // GA4 purchase — commit SONRASI (rollback olursa gonderilmesin)
            try {
                require_once __DIR__ . '/../services/Ga4MeasurementProtocol.php';
                ga4SendPurchase($db, (int)$orderId);
            } catch (Throwable $e) { error_log('[ga4 purchase free] ' . $e->getMessage()); }

            // Bedava sipariş mailleri — onay + (varsa) form-required onboarding daveti.
            // Önceden bu blokta HİÇ mail yoktu.
            try {
                if (function_exists('buildManualTransferEmail')) {
                    $stmtFo = $db->prepare("SELECT u.email, u.first_name, o.order_number, o.total_amount, o.currency, o.customer_lang
                                            FROM orders o JOIN users u ON u.id = o.user_id WHERE o.id = ? LIMIT 1");
                    $stmtFo->execute([$orderId]);
                    $fo = $stmtFo->fetch();
                    if ($fo && !empty($fo['email'])) {
                        $foLang = (string)($fo['customer_lang'] ?? 'tr');
                        $confMail = buildManualTransferEmail('confirmed', $foLang, [
                            'order_number' => $fo['order_number'],
                            'order_id'     => $orderId,
                            'first_name'   => $fo['first_name'] ?? '',
                            'amount'       => $fo['total_amount'] ?? 0,
                            'currency'     => $fo['currency'] ?? 'TRY'
                        ]);
                        sendTransactionalEmail($db, (string)$fo['email'], $confMail['subject'], $confMail['html']);

                        $stmtFoItems = $db->prepare(
                            "SELECT oi.id AS order_item_id, p.name AS product_name
                             FROM order_items oi JOIN products p ON p.id = oi.product_id
                             WHERE oi.order_id = ? AND COALESCE(p.requires_onboarding, 0) = 1"
                        );
                        $stmtFoItems->execute([$orderId]);
                        foreach ($stmtFoItems->fetchAll() as $foIt) {
                            $obMail = buildManualTransferEmail('onboarding-link', $foLang, [
                                'order_number'  => $fo['order_number'],
                                'order_id'      => $orderId,
                                'order_item_id' => $foIt['order_item_id'],
                                'product_name'  => $foIt['product_name'],
                                'first_name'    => $fo['first_name'] ?? ''
                            ]);
                            sendTransactionalEmail($db, (string)$fo['email'], $obMail['subject'], $obMail['html']);
                        }
                    }
                }
                sendGuestWelcomeEmailIfNeeded($db, (int)$payload['id']);
            } catch (Throwable $foErr) {
                error_log('[free-order] mail: ' . $foErr->getMessage());
            }

            sendResponse(['success' => true, 'free_order' => true, 'message' => 'Ücretsiz sipariş tamamlandı.']);
        } catch (Throwable $e) {
            $db->rollBack();
            sendResponse(['error' => 'Sipariş tamamlanamadı: ' . $e->getMessage()], 500);
        }
    }

    try {
        $db->beginTransaction();

        $stmt = $db->prepare("UPDATE orders SET status = 'processing' WHERE id = ?");
        $stmt->execute([$orderId]);

        // Sepet kalemlerini Lidio formatına çevir (fraud kontrolü için zorunlu)
        $itemsStmt = $db->prepare(
            "SELECT oi.product_id, oi.quantity, oi.unit_price, p.name AS product_name, p.category
             FROM order_items oi
             LEFT JOIN products p ON p.id = oi.product_id
             WHERE oi.order_id = ?"
        );
        $itemsStmt->execute([$orderId]);
        $basketItems = [];
        foreach ($itemsStmt->fetchAll() as $oi) {
            $basketItems[] = [
                'name' => (string)($oi['product_name'] ?? 'Khilonfast Hizmet'),
                'category1' => (string)($oi['category'] ?? ''),
                'quantity' => (int)$oi['quantity'],
                'unitPrice' => (float)$oi['unit_price'],
                'criticalCategory' => 'Other',
                'itemType' => 'Virtual'
            ];
        }

        // Fatura adresi: company_info varsa oradan, yoksa profile'dan, yoksa default
        $companyStmt = $db->prepare("SELECT * FROM company_info WHERE user_id = ? LIMIT 1");
        $companyStmt->execute([$user['id']]);
        $company = $companyStmt->fetch();

        $profileStmt = $db->prepare("SELECT address FROM users WHERE id = ? LIMIT 1");
        $profileStmt->execute([$user['id']]);
        $profile = $profileStmt->fetch();
        $userAddress = trim((string)($profile['address'] ?? ''));

        $invoiceAddress = [
            'contactName' => trim((string)$user['first_name'] . ' ' . (string)$user['last_name']),
            'country' => 'Türkiye',
            'city' => 'İstanbul',
            'town' => 'Şişli',
            'district' => 'Maslak',
            'address' => $userAddress !== '' ? $userAddress : 'Khilonfast',
            'postalCode' => '34000'
        ];
        if ($company) {
            $invoiceAddress['contactName'] = (string)($company['company_name'] ?? $invoiceAddress['contactName']);
            if (!empty($company['company_address'])) {
                $invoiceAddress['address'] = (string)$company['company_address'];
            }
        }

        $customerInfo = [
            'customerId' => (string)$user['id'],
            'customerName' => (string)$user['first_name'],
            'customerSurname' => (string)$user['last_name'],
            'customerEmail' => (string)$user['email'],
            'customerPhoneNumber' => normalizePhoneNumber($user['phone'] ?? ''),
            'customerIpAddress' => getClientIpAddress(),
            'customerPort' => (string)($_SERVER['REMOTE_PORT'] ?? '0')
        ];

        $paymentData = [
            'orderId' => 'KHL' . time() . $orderId,
            'merchantProcessId' => (string)$orderId,
            'amount' => (float)$order['total_amount'],
            'currency' => (string)($order['currency'] ?? 'TRY'),
            'returnUrl' => resolveFrontendBaseUrl() . '/payment-callback',
            'notificationUrl' => resolveBackendBaseUrl() . '/payment/callback',
            'customerInfo' => $customerInfo,
            'basketItems' => $basketItems,
            'invoiceAddress' => $invoiceAddress,
            'deliveryAddress' => $invoiceAddress // Dijital ürün — fatura ile aynı
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
        // Bizim ürettiğimiz orderId/merchantProcessId'yi response'a sar — callback geldiğinde
        // resolveOrderByCallback JSON_EXTRACT ile bu order'ı bulabilsin (Lidio cevabı orderId içermiyor)
        $storedResponse = [
            'orderId' => $paymentData['orderId'],
            'merchantProcessId' => $paymentData['merchantProcessId'],
            'hostedOrderId' => $paymentData['hostedOrderId'] ?? null,
            'raw' => $paymentResult
        ];
        $stmt->execute([
            $orderId,
            $paymentResult['transactionId'] ?? null,
            $paymentData['amount'],
            $paymentData['currency'],
            $paymentSuccess ? 'success' : 'pending',
            json_encode($storedResponse, JSON_UNESCAPED_UNICODE)
        ]);

        if ($paymentSuccess) {
            $stmt = $db->prepare("UPDATE orders SET status = 'completed' WHERE id = ?");
            $stmt->execute([$orderId]);
            $stmt = $db->prepare("UPDATE payments SET status = 'success' WHERE order_id = ?");
            $stmt->execute([$orderId]);

            // Fatura kuyruğuna ekle (Paraşüt) — başarısızsa sipariş akışını bloklamaz
            try {
                require_once __DIR__ . '/../services/InvoiceService.php';
                invoiceQueueForOrder($db, (int)$orderId);
            } catch (Throwable $e) { error_log('[invoice queue cc] ' . $e->getMessage()); }

            // Admin'e satış bildirimi — Paraşüt aktif/pasif durumundan bağımsız
            try {
                require_once __DIR__ . '/../services/InvoiceService.php';
                invoiceSendAdminSaleNotification($db, (int)$orderId, 'credit_card');
            } catch (Throwable $e) { error_log('[admin sale notify cc] ' . $e->getMessage()); }

            // GA4 sunucu taraflı purchase (idempotent — ga4_purchase_sent_at ile korunur)
            try {
                require_once __DIR__ . '/../services/Ga4MeasurementProtocol.php';
                ga4SendPurchase($db, (int)$orderId);
            } catch (Throwable $e) { error_log('[ga4 purchase cc] ' . $e->getMessage()); }

            // Boss Panel push bildirimi — yeni satış
            try {
                require_once __DIR__ . '/../services/BossNotifier.php';
                $amountFmt = number_format((float)$order['total_amount'], 2, ',', '.') . ' ' . (string)($order['currency'] ?? 'TRY');
                bossNotify($db, '💳 Yeni Satış', $order['order_number'] . ' — ' . $amountFmt, ['type' => 'new_order', 'order_id' => $orderId]);
            } catch (Throwable $e) { error_log('[boss-notify cc] ' . $e->getMessage()); }

            // Misafir checkout welcome email — yalnızca ödeme onaylanınca (bug fix)
            try {
                sendGuestWelcomeEmailIfNeeded($db, (int)$user['id']);
            } catch (Throwable $welcomeErr) {
                error_log('[immediate] guest welcome: ' . $welcomeErr->getMessage());
            }

            // Email automation: purchase_completed event + terk edilen sepet queue'sunu iptal et
            try {
                $eaStmt = $db->prepare("INSERT INTO email_events (event_type, email, user_id) VALUES ('purchase_completed', ?, ?)");
                $eaStmt->execute([$user['email'], $user['id']]);
                $db->prepare("UPDATE email_queue SET status='cancelled' WHERE email=? AND status='pending'")->execute([$user['email']]);

                // V2 Automation Engine — purchase_completed trigger
                try {
                    require_once __DIR__ . '/../services/AutomationEngine.php';
                    (new AutomationEngine($db))->trigger('purchase_completed', [
                        'email'      => (string)$user['email'],
                        'first_name' => (string)($user['first_name'] ?? ''),
                        'last_name'  => (string)($user['last_name'] ?? ''),
                        'user_id'    => (int)$user['id'],
                        'order_id'   => (string)$orderId,
                        'order_number' => (string)($order['order_number'] ?? $orderId),
                    ]);
                } catch (Throwable $autoErr) {
                    error_log('[automation] purchase_completed trigger fail (inline): ' . $autoErr->getMessage());
                }

                // Eye Tracking welcome mail + pending-upload otomasyonu
                dispatchEyeWelcomeMail($db, (int)$orderId, $user);
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
        $bankTransferStored = [
            'orderId' => $transferData['orderId'],
            'merchantProcessId' => $transferData['merchantProcessId'],
            'raw' => $result
        ];
        $stmt->execute([
            $orderId,
            $result['transactionId'] ?? null,
            $transferData['amount'],
            $transferData['currency'],
            json_encode($bankTransferStored, JSON_UNESCAPED_UNICODE)
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

// POST /api/payment/manual-transfer — Manuel havale (Lidio'dan bağımsız).
// Müşteri sipariş verir → status=processing (ödeme bekleniyor) → IBAN bilgileri döner.
// Admin parayı alıp manuel onaylayınca completed + subscription aktif.
if ($action === 'manual-transfer' && $method === 'POST') {
    $payload = requireAuth();
    $data = getJsonBody();

    $orderId = (int)($data['order_id'] ?? 0);
    $manualBankAccountId = (int)($data['manual_bank_account_id'] ?? 0);

    if ($orderId <= 0) {
        sendResponse(['error' => 'order_id zorunludur'], 400);
    }

    $stmt = $db->prepare("SELECT * FROM orders WHERE id = ? AND user_id = ? LIMIT 1");
    $stmt->execute([$orderId, $payload['id']]);
    $order = $stmt->fetch();
    if (!$order) {
        sendResponse(['error' => 'Order not found'], 404);
    }

    // Banka bilgisini al — frontend gösterecek + admin maile koyacağız
    $bankInfo = null;
    if ($manualBankAccountId > 0) {
        $bankStmt = $db->prepare(
            "SELECT id, bank_name, account_holder, iban, swift, currency, notes
             FROM manual_bank_accounts WHERE id = ? AND is_active = 1 LIMIT 1"
        );
        $bankStmt->execute([$manualBankAccountId]);
        $bankInfo = $bankStmt->fetch() ?: null;
    }

    try {
        $db->beginTransaction();

        $db->prepare("UPDATE orders SET status = 'processing' WHERE id = ?")->execute([$orderId]);

        $stmt = $db->prepare(
            "INSERT INTO payments (order_id, payment_method, amount, currency, status, lidio_response)
             VALUES (?, 'manual_transfer', ?, ?, 'pending', ?)"
        );
        $stmt->execute([
            $orderId,
            (float)$order['total_amount'],
            (string)($order['currency'] ?? 'TRY'),
            json_encode([
                'manual_transfer' => true,
                'manual_bank_account_id' => $manualBankAccountId ?: null,
                'bank_info' => $bankInfo
            ], JSON_UNESCAPED_UNICODE)
        ]);

        $db->commit();

        // Müşteri + admin bilgilendirme maili — İKİ AYRI try/catch: müşteri maili
        // (Brevo/şablon hatası vb.) atarsa admin bildirimi bloklanmasın diye ayrıldı
        // (önceden aynı try içindeydi, müşteri maili atınca admin hiç haberdar olmuyordu).
        $userStmt = $db->prepare("SELECT email, first_name FROM users WHERE id = ? LIMIT 1");
        $userStmt->execute([$payload['id']]);
        $user = $userStmt->fetch();
        $lang = (string)($order['customer_lang'] ?? 'tr');

        if ($user && function_exists('sendTransactionalEmail')) {
            try {
                // Müşteri: locale-aware "ödeme bekleniyor"
                $custMail = buildManualTransferEmail('pending', $lang, [
                    'order_number' => $order['order_number'],
                    'order_id' => $order['id'],
                    'first_name' => $user['first_name'] ?? '',
                    'amount' => $order['total_amount'],
                    'currency' => $order['currency'] ?? 'TRY',
                    'bank_info' => $bankInfo
                ]);
                sendTransactionalEmail($db, (string)$user['email'], $custMail['subject'], $custMail['html']);
            } catch (Throwable $custMailErr) {
                error_log('[manual-transfer] customer mail error: ' . $custMailErr->getMessage());
            }

            try {
                // Admin: kısa Türkçe bildirim
                $contactEmail = (string)getSetting($db, 'contact_email', '');
                if ($contactEmail) {
                    $orderNo = htmlspecialchars((string)$order['order_number'], ENT_QUOTES, 'UTF-8');
                    $amountFmt = number_format((float)$order['total_amount'], 2, '.', ',') . ' ' . (string)($order['currency'] ?? 'TRY');
                    $custEmail = htmlspecialchars((string)$user['email'], ENT_QUOTES, 'UTF-8');
                    $adminHtml = "<p>Yeni manuel havale siparişi: <strong>{$orderNo}</strong>, müşteri {$custEmail}, tutar {$amountFmt}.
                        Para hesaba ulaştığında admin panelinden onaylayın.</p>";
                    sendTransactionalEmail($db, $contactEmail, '[Khilonfast] Manual Transfer Pending — ' . (string)$order['order_number'], $adminHtml);
                }
            } catch (Throwable $adminMailErr) {
                error_log('[manual-transfer] admin mail error: ' . $adminMailErr->getMessage());
            }

            // Boss Panel push bildirimi — havale onayı bekliyor, aksiyon gerekiyor
            try {
                require_once __DIR__ . '/../services/BossNotifier.php';
                $bossAmountFmt = number_format((float)$order['total_amount'], 2, ',', '.') . ' ' . (string)($order['currency'] ?? 'TRY');
                bossNotify($db, '🔔 Havale Onayı Bekliyor', $order['order_number'] . ' — ' . $bossAmountFmt, ['type' => 'pending_transfer', 'order_id' => (int)$order['id']]);
            } catch (Throwable $bossErr) {
                error_log('[manual-transfer] boss-notify error: ' . $bossErr->getMessage());
            }
        }

        sendResponse([
            'message' => 'Manual transfer order created. Awaiting payment.',
            'order' => [
                'id' => (int)$order['id'],
                'order_number' => $order['order_number'],
                'status' => 'processing'
            ],
            'amount' => (float)$order['total_amount'],
            'currency' => (string)($order['currency'] ?? 'TRY'),
            'bank_info' => $bankInfo
        ]);
    } catch (Throwable $e) {
        if ($db->inTransaction()) $db->rollBack();
        sendResponse(['error' => 'Manual transfer failed: ' . $e->getMessage()], 500);
    }
}

// GET /api/payment/bank-accounts — Anında Havale için public banka listesi
if ($action === 'bank-accounts' && $method === 'GET') {
    try {
        // bank_accounts tablosu yoksa boş liste dön (admin henüz tanımlamamış)
        $stmt = $db->query(
            "SELECT id, lidio_bank_account_id, bank_name, bank_code, logo_url
             FROM bank_accounts
             WHERE is_active = 1
             ORDER BY display_order ASC, bank_name ASC"
        );
        $banks = $stmt ? $stmt->fetchAll() : [];
        sendResponse(['banks' => $banks]);
    } catch (Throwable $e) {
        // Tablo yoksa frontend'in çuvallaması yerine boş liste dön
        sendResponse(['banks' => []]);
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

        // İdempotency: Lidio aynı ödeme için 2 callback gönderebilir
        //   1) Senkron: kullanıcı browser ReturnURL'e döndüğünde
        //   2) Asenkron: Lidio sahtecilik/POS notification webhook'u
        // Sipariş zaten completed ise tekrar UPDATE/INSERT/mail yapma — idempotent OK dön.
        if (($order['status'] ?? '') === 'completed') {
            $db->commit();
            sendResponse([
                'message' => 'Payment already finalized (idempotent)',
                'status' => 'success',
                'transactionId' => $transactionId,
                'resolvedStatus' => 'completed',
                'finalSuccess' => true,
                'alreadyProcessed' => true
            ]);
        }

        $normalizedStatus = strtolower($status);
        $is3dSuccess = in_array($normalizedStatus, ['3dsuccess', 'success'], true) && stripos($status, '3d') !== false;
        $isSuccess = in_array($normalizedStatus, ['success', '3dsuccess', 'approved', 'completed', 'transferred', 'received'], true);

        // 3DSuccess durumunda Lidio FinishPaymentProcess çağrısı zorunlu — aksi halde
        // ödeme banka tarafında preauth'da kalır, finansallaşmaz.
        // Ayrıca FinishPP cevabında fraudControlResult döner (final fraud kararı).
        $finishResponse = null;
        if ($is3dSuccess && $transactionId) {
            try {
                $finishResponse = $lidio->finishPaymentProcess([
                    'orderId' => $orderIdLike ?: ('KHL' . $order['id']),
                    'transactionId' => $transactionId,
                    'amount' => (float)$order['total_amount'],
                    'currency' => (string)($order['currency'] ?? 'TRY')
                ]);
            } catch (Throwable $finishErr) {
                error_log('FinishPaymentProcess error: ' . $finishErr->getMessage());
            }
        }

        // Sipariş statüsünü Result + FraudControlResult'a göre belirle
        $combinedPayload = [ 'callback' => $callback, 'finishPaymentProcess' => $finishResponse ];
        $resolvedStatus = 'failed';
        if ($finishResponse) {
            $resolvedStatus = $lidio->resolveOrderStatusFromResponse($finishResponse);
        } elseif ($isSuccess) {
            // PN (notification) gibi callback'ler — fraudControlResult callback payload'ında olabilir
            $cbFraud = strtolower((string)(
                $callback['fraudControlResult']
                ?? $callback['FraudControlResult']
                ?? $callback['fraudControlInfo']['fraudControlResult']
                ?? $callback['FraudControlInfo']['FraudControlResult']
                ?? ''
            ));
            if ($cbFraud === 'riskdetected') $resolvedStatus = 'failed';
            elseif ($cbFraud === 'inprocess') $resolvedStatus = 'processing';
            else $resolvedStatus = 'completed'; // RiskNotDetected, NotProcessed veya alan yok
        }

        $paymentStatusMap = [
            'completed' => 'success',
            'processing' => 'pending',  // InProcess — PN beklenir
            'failed' => 'failed'
        ];

        $stmt = $db->prepare("UPDATE payments SET status = ?, lidio_response = ? WHERE order_id = ?");
        $stmt->execute([
            $paymentStatusMap[$resolvedStatus] ?? 'failed',
            json_encode($combinedPayload, JSON_UNESCAPED_UNICODE),
            $order['id']
        ]);

        // RiskDetected veya InProcess durumunda subscription oluşturulmaz (ürün gönderilmez/beklenir)
        if ($resolvedStatus === 'completed') {
            $stmt = $db->prepare("UPDATE orders SET status = 'completed' WHERE id = ?");
            $stmt->execute([$order['id']]);

            // Fatura kuyruğuna ekle (Paraşüt) — 3D Secure callback başarı
            try {
                require_once __DIR__ . '/../services/InvoiceService.php';
                invoiceQueueForOrder($db, (int)$order['id']);
            } catch (Throwable $e) { error_log('[invoice queue 3ds] ' . $e->getMessage()); }

            // Admin'e satış bildirimi — Paraşüt aktif/pasif durumundan bağımsız.
            // Bu callback hem kart 3DS hem Anında Havale (bank_transfer) için ortak
            // kullanıldığından ödeme yöntemi payments tablosundan taze okunuyor
            // ('credit_card' hardcode etiket hatasıydı — havale siparişleri de
            // yanlışlıkla "Kredi/Banka Kartı" görünüyordu).
            try {
                require_once __DIR__ . '/../services/InvoiceService.php';
                $pmStmt = $db->prepare("SELECT payment_method FROM payments WHERE order_id = ? ORDER BY id DESC LIMIT 1");
                $pmStmt->execute([(int)$order['id']]);
                $resolvedPaymentMethod = (string)($pmStmt->fetchColumn() ?: 'credit_card');
                invoiceSendAdminSaleNotification($db, (int)$order['id'], $resolvedPaymentMethod);
            } catch (Throwable $e) { error_log('[admin sale notify 3ds] ' . $e->getMessage()); }

            // GA4 sunucu taraflı purchase (idempotent)
            try {
                require_once __DIR__ . '/../services/Ga4MeasurementProtocol.php';
                ga4SendPurchase($db, (int)$order['id']);
            } catch (Throwable $e) { error_log('[ga4 purchase 3ds] ' . $e->getMessage()); }

            // Boss Panel push bildirimi — yeni satış (kart 3DS veya Anında Havale)
            try {
                require_once __DIR__ . '/../services/BossNotifier.php';
                $bossAmountFmt = number_format((float)$order['total_amount'], 2, ',', '.') . ' ' . (string)($order['currency'] ?? 'TRY');
                $bossIcon = ($resolvedPaymentMethod ?? 'credit_card') === 'bank_transfer' ? '🏦' : '💳';
                bossNotify($db, $bossIcon . ' Yeni Satış', $order['order_number'] . ' — ' . $bossAmountFmt, ['type' => 'new_order', 'order_id' => (int)$order['id']]);
            } catch (Throwable $e) { error_log('[boss-notify 3ds] ' . $e->getMessage()); }

            // Misafir checkout welcome e-postası — yalnızca ödeme onaylanınca gönder.
            // (Daha önce orders.php'de pending durumdayken gidiyordu — bug fix)
            try {
                sendGuestWelcomeEmailIfNeeded($db, (int)$order['user_id']);
            } catch (Throwable $welcomeErr) {
                error_log('[callback] guest welcome: ' . $welcomeErr->getMessage());
            }

            // Email automation: purchase_completed event + terk edilen sepet queue'sunu iptal et
            try {
                $stmtUser = $db->prepare("SELECT email, first_name, last_name FROM users WHERE id = ? LIMIT 1");
                $stmtUser->execute([$order['user_id']]);
                $cbUser = $stmtUser->fetch();
                if ($cbUser) {
                    $eaStmt = $db->prepare("INSERT INTO email_events (event_type, email, user_id) VALUES ('purchase_completed', ?, ?)");
                    $eaStmt->execute([$cbUser['email'], $order['user_id']]);
                    $db->prepare("UPDATE email_queue SET status='cancelled' WHERE email=? AND status='pending'")->execute([$cbUser['email']]);

                    // V2 Automation Engine — purchase_completed trigger (separate from legacy)
                    try {
                        require_once __DIR__ . '/../services/AutomationEngine.php';
                        (new AutomationEngine($db))->trigger('purchase_completed', [
                            'email'      => $cbUser['email'],
                            'first_name' => $cbUser['first_name'] ?? '',
                            'last_name'  => $cbUser['last_name'] ?? '',
                            'user_id'    => (int)$order['user_id'],
                            'order_id'   => (string)$order['id'],
                            'order_number' => (string)($order['order_number'] ?? $order['id']),
                        ]);
                    } catch (Throwable $autoErr) {
                        error_log('[automation] purchase_completed trigger fail: ' . $autoErr->getMessage());
                    }

                    // Eye Tracking welcome mail + pending-upload otomasyonu
                    dispatchEyeWelcomeMail($db, (int)$order['id'], [
                        'email' => $cbUser['email'],
                        'first_name' => $cbUser['first_name'] ?? '',
                        'last_name' => $cbUser['last_name'] ?? '',
                        'id' => $order['user_id']
                    ]);
                }
            } catch (Throwable $eaError) {
                error_log('Email automation event error (callback): ' . $eaError->getMessage());
            }

            // Lidio sanal POS — kart token'ı varsa user_cards'a yaz, renewal_card_id olarak bağla.
            $renewalCardId = null;
            $cardToken = $finishResponse['cardToken'] ?? $finishResponse['CardToken'] ?? null;
            if ($cardToken) {
                $maskedNumber = $finishResponse['maskedCardNumber'] ?? $finishResponse['MaskedCardNumber'] ?? '';
                $cardBrand = $finishResponse['cardBrand'] ?? $finishResponse['CardBrand'] ?? null;
                // Token zaten varsa idempotent
                $stmtCardExists = $db->prepare("SELECT id FROM user_cards WHERE user_id = ? AND lidio_token = ? LIMIT 1");
                $stmtCardExists->execute([$order['user_id'], $cardToken]);
                $existingCard = $stmtCardExists->fetch();
                if ($existingCard) {
                    $renewalCardId = (int)$existingCard['id'];
                } else {
                    $stmtCardInsert = $db->prepare(
                        "INSERT INTO user_cards (user_id, lidio_token, masked_number, card_brand, is_default)
                         VALUES (?, ?, ?, ?, 0)"
                    );
                    $stmtCardInsert->execute([$order['user_id'], $cardToken, $maskedNumber, $cardBrand]);
                    $renewalCardId = (int)$db->lastInsertId();
                }
            }
            createSubscriptionsForOrder($db, (int)$order['user_id'], (int)$order['id'], 'credit_card', $renewalCardId);

            // Onboarding form mail tetikleyici — form-required her sipariş kalemi için ayrı mail
            try {
                if (function_exists('buildManualTransferEmail')) {
                    $stmtUser2 = $db->prepare("SELECT email, first_name FROM users WHERE id = ? LIMIT 1");
                    $stmtUser2->execute([$order['user_id']]);
                    $cbUser2 = $stmtUser2->fetch();
                    if ($cbUser2) {
                        $stmtItems = $db->prepare(
                            "SELECT oi.id AS order_item_id, p.name AS product_name
                             FROM order_items oi
                             JOIN products p ON p.id = oi.product_id
                             WHERE oi.order_id = ? AND COALESCE(p.requires_onboarding, 0) = 1"
                        );
                        $stmtItems->execute([$order['id']]);
                        $obItems = $stmtItems->fetchAll();
                        foreach ($obItems as $obIt) {
                            $obMail = buildManualTransferEmail('onboarding-link', (string)($order['customer_lang'] ?? 'tr'), [
                                'order_number' => $order['order_number'],
                                'order_id' => $order['id'],
                                'order_item_id' => $obIt['order_item_id'],
                                'product_name' => $obIt['product_name'],
                                'first_name' => $cbUser2['first_name'] ?? ''
                            ]);
                            sendTransactionalEmail($db, (string)$cbUser2['email'], $obMail['subject'], $obMail['html']);
                        }
                    }
                }
            } catch (Throwable $obErr) {
                error_log('[callback] onboarding mail: ' . $obErr->getMessage());
            }

            // Genel sipariş onay maili — HER tamamlanan sipariş için (ürün tipi/form fark etmez).
            // Kayıtlı müşteri + form-gerektirmeyen ürün (eğitim/Maestro/Eye Tracking) alımında
            // başka hiçbir mail tetiklenmiyordu; bu blok o boşluğu kapatır.
            try {
                if (function_exists('buildManualTransferEmail')) {
                    $stmtCu = $db->prepare("SELECT email, first_name FROM users WHERE id = ? LIMIT 1");
                    $stmtCu->execute([$order['user_id']]);
                    $cu = $stmtCu->fetch();
                    if ($cu && !empty($cu['email'])) {
                        $confMail = buildManualTransferEmail('confirmed', (string)($order['customer_lang'] ?? 'tr'), [
                            'order_number' => $order['order_number'],
                            'order_id'     => $order['id'],
                            'first_name'   => $cu['first_name'] ?? '',
                            'amount'       => $order['total_amount'] ?? 0,
                            'currency'     => $order['currency'] ?? 'TRY'
                        ]);
                        sendTransactionalEmail($db, (string)$cu['email'], $confMail['subject'], $confMail['html']);
                    }
                }
            } catch (Throwable $cmErr) {
                error_log('[callback] confirm mail: ' . $cmErr->getMessage());
            }
        } elseif ($resolvedStatus === 'processing') {
            // Fraud kontrolü InProcess — Lidio'dan asenkron PN beklenir, sipariş bekleme statüsünde
            $stmt = $db->prepare("UPDATE orders SET status = 'processing' WHERE id = ?");
            $stmt->execute([$order['id']]);
        } else {
            // RiskDetected veya Refused — sipariş başarısız
            $stmt = $db->prepare("UPDATE orders SET status = 'failed' WHERE id = ?");
            $stmt->execute([$order['id']]);
            couponReleaseUsageForOrder($db, $order['id']);
        }

        $db->commit();
        sendResponse([
            'message' => 'Payment callback processed',
            'status' => $status,
            'transactionId' => $transactionId,
            'resolvedStatus' => $resolvedStatus,
            'fraudControlResult' => $finishResponse['fraudControlResult'] ?? ($callback['fraudControlResult'] ?? null),
            'finalSuccess' => $resolvedStatus === 'completed'
        ]);
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
