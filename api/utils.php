<?php
// api/utils.php

function sendResponse($data, $statusCode = 200)
{
    header('Content-Type: application/json');
    http_response_code($statusCode);
    echo json_encode($data);
    exit;
}

function getJsonBody()
{
    $raw = file_get_contents('php://input');
    if (!$raw) return [];
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function getBearerToken()
{
    $headers = getallheaders();
    if (!is_array($headers)) return null;
    $auth = $headers['Authorization'] ?? $headers['authorization'] ?? null;
    if (!$auth) return null;

    if (preg_match('/Bearer\s+(\S+)/i', $auth, $matches)) {
        return $matches[1];
    }
    return null;
}

function decodeJWT($token)
{
    try {
        if (!$token) return null;
        $parts = explode('.', $token);
        if (count($parts) !== 3) return null;

        $payloadJson = base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[1]));
        $payload = json_decode($payloadJson, true);
        if (!is_array($payload)) return null;

        $signed = $parts[0] . '.' . $parts[1];
        $validSignature = hash_hmac('sha256', $signed, JWT_SECRET, true);
        $validSignatureEncoded = rtrim(strtr(base64_encode($validSignature), '+/', '-_'), '=');

        if (!hash_equals($validSignatureEncoded, $parts[2])) {
            return null;
        }

        if (isset($payload['exp']) && (int)$payload['exp'] < time()) {
            return null;
        }

        return $payload;
    } catch (Throwable $e) {
        return null;
    }
}

function encodeJWT($payload)
{
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $base64UrlHeader = rtrim(strtr(base64_encode($header), '+/', '-_'), '=');

    $payload['iat'] = time();
    if (!isset($payload['exp'])) {
        $payload['exp'] = time() + JWT_EXPIRY;
    }
    $base64UrlPayload = rtrim(strtr(base64_encode(json_encode($payload)), '+/', '-_'), '=');

    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, JWT_SECRET, true);
    $base64UrlSignature = rtrim(strtr(base64_encode($signature), '+/', '-_'), '=');

    return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
}

function requireAuth()
{
    $token = getBearerToken();
    $payload = decodeJWT($token);
    if (!$payload) {
        sendResponse(['error' => 'Unauthorized'], 401);
    }
    return $payload;
}

function optionalAuth()
{
    $token = getBearerToken();
    return decodeJWT($token);
}

/**
 * Manuel havale akışı için locale-aware mail şablonları.
 * $type: pending | confirmed | reminder | cancelled | onboarding-link
 */
function buildManualTransferEmail(string $type, string $lang, array $params): array
{
    $isEn = $lang === 'en';
    $orderNumber = htmlspecialchars((string)($params['order_number'] ?? ''), ENT_QUOTES, 'UTF-8');
    $firstName = htmlspecialchars((string)($params['first_name'] ?? ''), ENT_QUOTES, 'UTF-8');
    $amount = number_format((float)($params['amount'] ?? 0), 2, '.', ',') . ' ' . (string)($params['currency'] ?? 'TRY');
    $bankInfo = $params['bank_info'] ?? null;
    $dashboardUrl = ($isEn ? 'https://khilonfast.com/en/dashboard' : 'https://khilonfast.com/dashboard') . '?tab=orders';
    $orderItemId = (int)($params['order_item_id'] ?? 0);
    $onboardingUrl = ($isEn ? 'https://khilonfast.com/en/onboarding-form' : 'https://khilonfast.com/onboarding-formu')
        . '?order_id=' . (int)($params['order_id'] ?? 0)
        . ($orderItemId > 0 ? '&order_item_id=' . $orderItemId : '');
    $productName = htmlspecialchars((string)($params['product_name'] ?? ''), ENT_QUOTES, 'UTF-8');

    $bankBlock = '';
    if ($bankInfo) {
        $bn = htmlspecialchars((string)($bankInfo['bank_name'] ?? ''), ENT_QUOTES, 'UTF-8');
        $ah = htmlspecialchars((string)($bankInfo['account_holder'] ?? ''), ENT_QUOTES, 'UTF-8');
        $iban = htmlspecialchars((string)($bankInfo['iban'] ?? ''), ENT_QUOTES, 'UTF-8');
        $sw = htmlspecialchars((string)($bankInfo['swift'] ?? ''), ENT_QUOTES, 'UTF-8');
        $bankBlock = "<table style='width:100%;border:1px solid #e2e8f0;border-radius:8px;margin:14px 0;border-collapse:collapse'>
            <tr><td style='padding:10px 14px;color:#64748b;width:38%;border-bottom:1px solid #f1f5f9'>" . ($isEn ? 'Bank' : 'Banka') . "</td><td style='padding:10px 14px;border-bottom:1px solid #f1f5f9'><strong>{$bn}</strong></td></tr>
            <tr><td style='padding:10px 14px;color:#64748b;border-bottom:1px solid #f1f5f9'>" . ($isEn ? 'Account Holder' : 'Hesap Sahibi') . "</td><td style='padding:10px 14px;border-bottom:1px solid #f1f5f9'>{$ah}</td></tr>
            <tr><td style='padding:10px 14px;color:#64748b;border-bottom:1px solid #f1f5f9'>IBAN</td><td style='padding:10px 14px;font-family:monospace;border-bottom:1px solid #f1f5f9'>{$iban}</td></tr>"
            . ($sw ? "<tr><td style='padding:10px 14px;color:#64748b'>SWIFT</td><td style='padding:10px 14px;font-family:monospace'>{$sw}</td></tr>" : "")
            . "</table>";
    }

    $copy = [
        'pending' => [
            'subject' => $isEn ? "Khilonfast — Bank Transfer Pending ({$orderNumber})" : "Khilonfast — Havale Bekleniyor ({$orderNumber})",
            'heading' => $isEn ? 'Order Created — Awaiting Payment' : 'Siparişiniz Oluşturuldu — Ödeme Bekleniyor',
            'greeting' => $isEn ? "Hi {$firstName}," : "Merhaba {$firstName},",
            'intro' => $isEn
                ? "Your order <strong>{$orderNumber}</strong> has been created. Please complete a bank transfer of <strong>{$amount}</strong> to the account below."
                : "Sipariş numaranız <strong>{$orderNumber}</strong> oluşturuldu. Aşağıdaki hesaba <strong>{$amount}</strong> tutarında havale göndermenizi rica ediyoruz.",
            'note' => $isEn
                ? "Use <strong>{$orderNumber}</strong> as the transfer description so we can match your payment quickly. Once received, your order will be activated and we'll send you a confirmation."
                : "Açıklama kısmına <strong>{$orderNumber}</strong> yazmayı unutmayın. Ödemeniz tarafımıza ulaştığında siparişiniz aktif edilecek ve onay maili göndereceğiz.",
            'cta' => null
        ],
        'confirmed' => [
            'subject' => $isEn ? "Khilonfast — Payment Confirmed ({$orderNumber})" : "Khilonfast — Ödemeniz Onaylandı ({$orderNumber})",
            'heading' => $isEn ? 'Payment Confirmed' : 'Ödemeniz Onaylandı',
            'greeting' => $isEn ? "Hi {$firstName}," : "Merhaba {$firstName},",
            'intro' => $isEn
                ? "We received your bank transfer for order <strong>{$orderNumber}</strong>. Your order is now active."
                : "<strong>{$orderNumber}</strong> numaralı siparişiniz için havale ödemenizi aldık. Siparişiniz aktif edildi.",
            'note' => $isEn ? 'You can access your purchases anytime from your dashboard.' : 'Satın aldıklarınıza her zaman hesabınızdan erişebilirsiniz.',
            'cta' => ['label' => $isEn ? 'Go to Dashboard' : 'Hesabıma Git', 'url' => $dashboardUrl]
        ],
        'onboarding-link' => [
            'subject' => $isEn
                ? "Khilonfast — " . ($productName !== '' ? "{$productName}: " : '') . "Complete Your Onboarding ({$orderNumber})"
                : "Khilonfast — " . ($productName !== '' ? "{$productName} için " : '') . "Onboarding Formunuzu Doldurun ({$orderNumber})",
            'heading' => $isEn ? 'One More Step — Onboarding Form' : 'Son Adım — Onboarding Formu',
            'greeting' => $isEn ? "Hi {$firstName}," : "Merhaba {$firstName},",
            'intro' => $isEn
                ? ($productName !== ''
                    ? "To start your <strong>{$productName}</strong> service, please fill the onboarding form below. It helps us tailor the work to your business."
                    : "To start your service, please fill the onboarding form below. It helps us tailor the work to your business.")
                : ($productName !== ''
                    ? "<strong>{$productName}</strong> hizmetine başlayabilmemiz için lütfen aşağıdaki onboarding formunu doldurun. Çalışmayı işinize göre özelleştireceğiz."
                    : "Hizmete başlayabilmemiz için lütfen aşağıdaki onboarding formunu doldurun. Çalışmayı işinize göre özelleştireceğiz."),
            'note' => $isEn ? 'It takes about 5–7 minutes.' : 'Yaklaşık 5–7 dakika sürer.',
            'cta' => ['label' => $isEn ? 'Fill Onboarding Form' : 'Formu Doldur', 'url' => $onboardingUrl]
        ],
        'reminder' => [
            'subject' => $isEn ? "Khilonfast — Reminder: Bank Transfer Pending ({$orderNumber})" : "Khilonfast — Hatırlatma: Havale Bekleniyor ({$orderNumber})",
            'heading' => $isEn ? 'Friendly Reminder — Awaiting Your Bank Transfer' : 'Hatırlatma — Havalenizi Bekliyoruz',
            'greeting' => $isEn ? "Hi {$firstName}," : "Merhaba {$firstName},",
            'intro' => $isEn
                ? "We haven't received your transfer yet for order <strong>{$orderNumber}</strong> ({$amount}). The bank details below are still active."
                : "<strong>{$orderNumber}</strong> numaralı sipariş ({$amount}) için havalenizi henüz almadık. Aşağıdaki banka bilgileri hâlâ geçerli.",
            'note' => $isEn ? 'If you have any questions, reply to this email. Your order will be cancelled in 4 days if no payment is received.' : 'Sorunuz olursa bu e-postayı yanıtlayabilirsiniz. Ödeme alınmazsa 4 gün içinde sipariş otomatik iptal edilecektir.',
            'cta' => null
        ],
        'cancelled' => [
            'subject' => $isEn ? "Khilonfast — Order Cancelled ({$orderNumber})" : "Khilonfast — Siparişiniz İptal Edildi ({$orderNumber})",
            'heading' => $isEn ? 'Order Cancelled' : 'Sipariş İptal Edildi',
            'greeting' => $isEn ? "Hi {$firstName}," : "Merhaba {$firstName},",
            'intro' => $isEn
                ? "Order <strong>{$orderNumber}</strong> has been cancelled because no bank transfer was received within 7 days."
                : "<strong>{$orderNumber}</strong> numaralı siparişiniz, 7 gün içinde havale alınmadığı için iptal edildi.",
            'note' => $isEn ? "If you'd still like to purchase, please place a new order at any time." : 'Yine de satın almak isterseniz dilediğiniz zaman yeni sipariş verebilirsiniz.',
            'cta' => ['label' => $isEn ? 'Browse Services' : 'Hizmetlere Göz At', 'url' => $isEn ? 'https://khilonfast.com/en' : 'https://khilonfast.com/']
        ]
    ];

    $cfg = $copy[$type] ?? $copy['pending'];
    $ctaBlock = $cfg['cta']
        ? "<div style='text-align:center;margin:24px 0'><a href='{$cfg['cta']['url']}' style='display:inline-block;background:#1a3a52;color:#fff;padding:12px 24px;border-radius:8px;font-weight:600;text-decoration:none'>{$cfg['cta']['label']}</a></div>"
        : '';
    $useBank = in_array($type, ['pending', 'reminder'], true);

    $html = "<!doctype html><html><body style='font-family:Arial,sans-serif;background:#f6f8fb;padding:20px;margin:0'>
        <div style='max-width:600px;margin:0 auto;background:#fff;border:1px solid #dde7f0;border-radius:12px;overflow:hidden'>
        <div style='background:linear-gradient(90deg,#1a3a52,#89b004);color:#fff;padding:20px 24px'>
            <h2 style='margin:0;font-size:1.3rem'>{$cfg['heading']}</h2>
        </div>
        <div style='padding:24px;color:#102a43;line-height:1.7'>
            <p style='margin-top:0'>{$cfg['greeting']}</p>
            <p>{$cfg['intro']}</p>"
        . ($useBank ? $bankBlock : '')
        . "<p>{$cfg['note']}</p>"
        . $ctaBlock
        . "<hr style='border:none;border-top:1px solid #e2e8f0;margin:18px 0'/>
            <p style='font-size:0.82rem;color:#94a3b8;margin:0'>Khilonfast — info@khilonfast.com</p>
        </div></div></body></html>";

    return ['subject' => $cfg['subject'], 'html' => $html];
}

/**
 * Bir sipariş için her order_item'ı subscriptions tablosuna idempotent INSERT eder.
 * - type='subscription' ürünlerde expires_at + next_renewal_at = NOW() + duration_days
 * - type='subscription' ise auto_renew=1, payment_method'a göre renewal_card_id
 * - diğer ürünlerde duration_days varsa expires_at yine set edilir (lifetime/training için NULL)
 *
 * @param PDO $db
 * @param int $userId
 * @param int $orderId
 * @param string $paymentMethod credit_card|manual_transfer
 * @param int|null $renewalCardId
 */
function createSubscriptionsForOrder(PDO $db, int $userId, int $orderId, string $paymentMethod, ?int $renewalCardId = null): void
{
    $itemsStmt = $db->prepare(
        "SELECT oi.product_id, p.type, p.duration_days
         FROM order_items oi
         JOIN products p ON p.id = oi.product_id
         WHERE oi.order_id = ?"
    );
    $itemsStmt->execute([$orderId]);
    $items = $itemsStmt->fetchAll();

    $existsStmt = $db->prepare(
        "SELECT id FROM subscriptions WHERE user_id = ? AND product_id = ? AND order_id = ? LIMIT 1"
    );

    foreach ($items as $it) {
        $existsStmt->execute([$userId, $it['product_id'], $orderId]);
        if ($existsStmt->fetch()) continue;

        $isSub = ($it['type'] ?? '') === 'subscription';
        $duration = (int)($it['duration_days'] ?? 0);
        $autoRenew = $isSub ? 1 : 0;
        $card = ($isSub && $paymentMethod === 'credit_card') ? $renewalCardId : null;

        $expiresClause = $duration > 0 ? 'DATE_ADD(NOW(), INTERVAL :dur DAY)' : 'NULL';
        $renewalClause = $duration > 0 ? 'DATE_ADD(NOW(), INTERVAL :dur2 DAY)' : 'NULL';

        $sql = "INSERT INTO subscriptions
                  (user_id, product_id, order_id, status, starts_at,
                   expires_at, next_renewal_at,
                   auto_renew, renewal_card_id, payment_method)
                VALUES
                  (:uid, :pid, :oid, 'active', NOW(),
                   {$expiresClause}, {$renewalClause},
                   :ar, :card, :pm)";

        $ins = $db->prepare($sql);
        $params = [
            ':uid' => $userId, ':pid' => $it['product_id'], ':oid' => $orderId,
            ':ar' => $autoRenew, ':card' => $card, ':pm' => $paymentMethod
        ];
        if ($duration > 0) { $params[':dur'] = $duration; $params[':dur2'] = $duration; }
        $ins->execute($params);
    }
}

function getSetting(PDO $db, $key, $default = null)
{
    $stmt = $db->prepare("SELECT setting_value FROM settings WHERE setting_key = ? LIMIT 1");
    $stmt->execute([$key]);
    $row = $stmt->fetch();
    return $row ? $row['setting_value'] : $default;
}

function parseBool($value, $default = false)
{
    if ($value === null || $value === '') return $default;
    if (is_bool($value)) return $value;
    $normalized = strtolower(trim((string)$value));
    return in_array($normalized, ['1', 'true', 'yes', 'on'], true);
}

function tableExists(PDO $db, $tableName)
{
    $stmt = $db->query("SHOW TABLES LIKE " . $db->quote((string)$tableName));
    return (bool)$stmt->fetchColumn();
}

function columnExists(PDO $db, $tableName, $columnName)
{
    $stmt = $db->query("SHOW COLUMNS FROM {$tableName} LIKE " . $db->quote((string)$columnName));
    return (bool)$stmt->fetch();
}

function ensureMustChangePasswordColumn(PDO $db)
{
    static $checked = false;
    if ($checked) return;

    if (tableExists($db, 'users') && !columnExists($db, 'users', 'must_change_password')) {
        try {
            $db->exec("ALTER TABLE users ADD COLUMN must_change_password TINYINT(1) NOT NULL DEFAULT 0 AFTER role");
        } catch (Throwable $e) {
            error_log('[schema] ensureMustChangePasswordColumn: ' . $e->getMessage());
        }
    }
    $checked = true;
}

function hasMustChangePasswordColumn(PDO $db)
{
    static $exists = null;
    if ($exists !== null) {
        return $exists;
    }
    $exists = tableExists($db, 'users') && columnExists($db, 'users', 'must_change_password');
    return $exists;
}

function ensureTrainingAccessPagesSchema(PDO $db)
{
    static $checked = false;
    if ($checked) return;

    if (!tableExists($db, 'training_access_pages')) {
        $db->exec(
            "CREATE TABLE training_access_pages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                slug VARCHAR(255) NOT NULL UNIQUE,
                product_key VARCHAR(100) NOT NULL,
                title_tr VARCHAR(255) DEFAULT NULL,
                title_en VARCHAR(255) DEFAULT NULL,
                description_tr TEXT DEFAULT NULL,
                description_en TEXT DEFAULT NULL,
                vimeo_url_tr TEXT DEFAULT NULL,
                vimeo_url_en TEXT DEFAULT NULL,
                canva_url_tr TEXT DEFAULT NULL,
                canva_url_en TEXT DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_training_access_pages_product_key (product_key)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
        );
    }

    $requiredColumns = [
        'title_tr' => "ALTER TABLE training_access_pages ADD COLUMN title_tr VARCHAR(255) DEFAULT NULL",
        'title_en' => "ALTER TABLE training_access_pages ADD COLUMN title_en VARCHAR(255) DEFAULT NULL",
        'description_tr' => "ALTER TABLE training_access_pages ADD COLUMN description_tr TEXT DEFAULT NULL",
        'description_en' => "ALTER TABLE training_access_pages ADD COLUMN description_en TEXT DEFAULT NULL",
        'vimeo_url_tr' => "ALTER TABLE training_access_pages ADD COLUMN vimeo_url_tr TEXT DEFAULT NULL",
        'vimeo_url_en' => "ALTER TABLE training_access_pages ADD COLUMN vimeo_url_en TEXT DEFAULT NULL",
        'canva_url_tr' => "ALTER TABLE training_access_pages ADD COLUMN canva_url_tr TEXT DEFAULT NULL",
        'canva_url_en' => "ALTER TABLE training_access_pages ADD COLUMN canva_url_en TEXT DEFAULT NULL"
    ];

    foreach ($requiredColumns as $column => $sql) {
        if (!columnExists($db, 'training_access_pages', $column)) {
            $db->exec($sql);
        }
    }

    $legacyVimeoExists = false;
    $legacyCanvaExists = false;

        $stmt = $db->query("SHOW COLUMNS FROM training_access_pages LIKE 'vimeo_url'");
        $legacyVimeoExists = (bool)$stmt->fetch();

        $stmt = $db->query("SHOW COLUMNS FROM training_access_pages LIKE 'canva_url'");
        $legacyCanvaExists = (bool)$stmt->fetch();

    if ($legacyVimeoExists) {
        $db->exec("UPDATE training_access_pages SET vimeo_url_tr = COALESCE(NULLIF(vimeo_url_tr, ''), vimeo_url) WHERE vimeo_url IS NOT NULL AND vimeo_url <> ''");
    }
    if ($legacyCanvaExists) {
        $db->exec("UPDATE training_access_pages SET canva_url_tr = COALESCE(NULLIF(canva_url_tr, ''), canva_url) WHERE canva_url IS NOT NULL AND canva_url <> ''");
    }

    // Ensure i18n PDF columns on training_access_pages
    if (!columnExists($db, 'training_access_pages', 'pdf_url')) {
        $db->exec("ALTER TABLE training_access_pages ADD COLUMN pdf_url TEXT DEFAULT NULL");
    }
    if (!columnExists($db, 'training_access_pages', 'pdf_url_tr')) {
        $db->exec("ALTER TABLE training_access_pages ADD COLUMN pdf_url_tr TEXT DEFAULT NULL");
    }
    if (!columnExists($db, 'training_access_pages', 'pdf_url_en')) {
        $db->exec("ALTER TABLE training_access_pages ADD COLUMN pdf_url_en TEXT DEFAULT NULL");
    }

    // Ensure i18n PDF columns on training_lessons (table exists from main DB schema)
    if (tableExists($db, 'training_lessons')) {
        if (!columnExists($db, 'training_lessons', 'pdf_url_tr')) {
            $db->exec("ALTER TABLE training_lessons ADD COLUMN pdf_url_tr TEXT DEFAULT NULL");
        }
        if (!columnExists($db, 'training_lessons', 'pdf_url_en')) {
            $db->exec("ALTER TABLE training_lessons ADD COLUMN pdf_url_en TEXT DEFAULT NULL");
        }
    }

    $checked = true;
}

function generateTemporaryPassword($length = 12)
{
    $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    $bytes = random_bytes($length);
    $out = '';
    for ($i = 0; $i < $length; $i++) {
        $out .= $chars[ord($bytes[$i]) % strlen($chars)];
    }
    return $out;
}

/**
 * Brevo HTTP API üzerinden mail gönderir (port 443).
 * Shared hosting'lerde outbound SMTP portları (25/465/587/2525) genellikle bloklu —
 * bu yüzden HTTP API en güvenilir yöntem.
 *
 * @param string $apiKey Brevo v3 API key (xkeysib-... veya benzeri)
 * @param string $fromEmail Gönderen adres (Brevo'da verified)
 * @param string $fromName Gönderen ismi
 * @param string $to Alıcı email
 * @param string $subject Konu
 * @param string $html HTML body
 */
function sendBrevoApiEmail($apiKey, $fromEmail, $fromName, $to, $subject, $html, $attachments = [])
{
    if ($apiKey === '') {
        throw new Exception('Brevo API key boş');
    }

    $payload = [
        'sender' => ['email' => $fromEmail, 'name' => $fromName ?: 'Khilonfast'],
        'to'     => [['email' => $to]],
        'subject' => $subject,
        'htmlContent' => $html
    ];

    if (is_array($attachments) && count($attachments)) {
        $payload['attachment'] = [];
        foreach ($attachments as $att) {
            $path = is_array($att) ? ($att['path'] ?? '') : (string)$att;
            $name = is_array($att) && !empty($att['name']) ? $att['name'] : basename($path);
            if ($path && is_readable($path)) {
                $payload['attachment'][] = [
                    'name' => $name,
                    'content' => base64_encode(file_get_contents($path))
                ];
            }
        }
    }

    $ch = curl_init('https://api.brevo.com/v3/smtp/email');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE),
        CURLOPT_HTTPHEADER => [
            'api-key: ' . $apiKey,
            'Content-Type: application/json',
            'Accept: application/json'
        ],
        CURLOPT_TIMEOUT => 25
    ]);
    $resp = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err  = curl_error($ch);
    curl_close($ch);

    if ($resp === false) {
        throw new Exception('Brevo API curl error: ' . $err);
    }
    if ($code >= 400) {
        throw new Exception('Brevo API HTTP ' . $code . ': ' . substr((string)$resp, 0, 300));
    }
    return json_decode($resp, true);
}

/**
 * Akıllı mail wrapper — `brevo_api_key` settings'te varsa HTTP API kullanır,
 * yoksa SMTP'ye düşer. Kullanım yerleri (auth/orders/onboarding) bunu çağırabilir.
 */
/**
 * Eye Tracking paketleri için satın alma sonrası welcome mail.
 * dispatchEyeWelcomeMail($db, $orderId, $user) — siparişte eye-* varsa
 * kullanıcıya "Hesabım > Reklam Analizleri" yönlendirme maili atar
 * ve eyetracking_pending_upload otomasyonunu tetikler.
 */
function dispatchEyeWelcomeMail(PDO $db, int $orderId, array $user): void
{
    try {
        $stmt = $db->prepare(
            "SELECT oi.id AS order_item_id, p.name, p.product_key, p.usage_quota
             FROM order_items oi
             JOIN products p ON p.id = oi.product_id
             WHERE oi.order_id = ? AND p.product_key LIKE 'eye-%'"
        );
        $stmt->execute([$orderId]);
        $eyeItems = $stmt->fetchAll();
        if (!$eyeItems) return;

        $email = (string)($user['email'] ?? '');
        if ($email === '') return;
        $firstName = htmlspecialchars((string)($user['first_name'] ?? ''), ENT_QUOTES, 'UTF-8');
        $baseUrl = (string)getSetting($db, 'frontend_url', 'https://khilonfast.com');
        // ASCII alias /hesabim — Türkçe slug mail/SMS'de URL-encode olunca 404 olmaması için
        $dashUrl = rtrim($baseUrl, '/') . '/hesabim?tab=eye_tracking';
        $lines = implode('<br>', array_map(function ($it) {
            $name = htmlspecialchars((string)$it['name'], ENT_QUOTES, 'UTF-8');
            $q = (int)$it['usage_quota'];
            return $name . ' — ' . $q . ' görsel/ay';
        }, $eyeItems));

        $html = '<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f4f7fb;padding:20px;margin:0;color:#102a43">
            <div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #dde7f0;border-radius:12px;overflow:hidden">
                <div style="background:linear-gradient(90deg,#1a3a52,#89b004);color:#fff;padding:20px 24px">
                    <h2 style="margin:0;font-size:1.2rem">khilonfast — Reklam Görsel Analizi</h2>
                </div>
                <div style="padding:24px;line-height:1.7">
                    <p>Merhaba ' . $firstName . ',</p>
                    <p>Reklam Görsel Analizi paketiniz aktif! Aşağıdaki paket(ler) hesabınıza tanımlandı:</p>
                    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin:12px 0">' . $lines . '</div>
                    <p>Analiz edilmesini istediğiniz reklam görsellerinizi <strong>Hesabım → Reklam Analizleri</strong> sekmesinden yükleyebilirsiniz. Her ay paketinize bağlı görsel hakkınız sıfırdan başlar.</p>
                    <div style="text-align:center;margin:24px 0">
                        <a href="' . htmlspecialchars($dashUrl, ENT_QUOTES, 'UTF-8') . '" style="display:inline-block;background:#1a3a52;color:#fff;padding:12px 26px;border-radius:8px;font-weight:700;text-decoration:none">Görsel Yükle</a>
                    </div>
                    <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:12px;font-size:0.85rem;color:#78350f;margin-top:12px">
                        <strong>İlk giriş yapıyorsanız:</strong> Geçici şifrenizi içeren <em>"Khilonfast - Kayıt Tamamlandı"</em> başlıklı ayrı bir e-posta gönderdik. Gelen kutunuzu ve spam klasörünüzü kontrol edin. Eğer ulaşmadıysa <a href="' . htmlspecialchars(rtrim($baseUrl, '/'), ENT_QUOTES, 'UTF-8') . '/sifremi-unuttum" style="color:#78350f;font-weight:600">şifremi unuttum</a> bağlantısı ile yeni bir şifre belirleyebilirsiniz.
                    </div>
                    <p style="margin-top:16px">Saygılarımızla,<br>Khilonfast Ekibi</p>
                </div>
            </div></body></html>';

        try {
            sendTransactionalEmail($db, $email, 'Reklam Görsel Analizi Paketiniz Aktif', $html);
        } catch (Throwable $mailErr) {
            error_log('[eye welcome mail] ' . $mailErr->getMessage());
        }

        // Hatırlatma akışı (otomasyon #23) tetikle — kullanıcı görsel yüklemezse 1s/1g/3g/1h/1ay maili gider
        try {
            require_once __DIR__ . '/services/AutomationEngine.php';
            (new AutomationEngine($db))->trigger('eyetracking_pending_upload', [
                'email'      => $email,
                'first_name' => (string)($user['first_name'] ?? ''),
                'last_name'  => (string)($user['last_name'] ?? ''),
                'user_id'    => (int)($user['id'] ?? 0),
                'order_id'   => (string)$orderId,
            ]);
        } catch (Throwable $autoErr) {
            error_log('[eye automation trigger] ' . $autoErr->getMessage());
        }
    } catch (Throwable $e) {
        error_log('[dispatchEyeWelcomeMail] ' . $e->getMessage());
    }
}

function ensureFullHtmlDocument(string $html): string
{
    // Bazı template'ler Unlayer editöründen <style> ile başlayan parça olarak kaydediliyor.
    // <html>/<body> wrapper yoksa mail client'lar <style> içeriğini düz metin olarak gösterip
    // gövdenin gerisini gizliyor. Burada wrap'leyerek render garanti altına alınır.
    $trimmed = ltrim($html);
    if ($trimmed === '') return $html;
    $lower = strtolower($trimmed);
    if (strpos($lower, '<!doctype') === 0 || strpos($lower, '<html') === 0) {
        return $html;
    }
    return "<!doctype html><html><head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"></head><body style=\"margin:0;padding:0;background:#f6f8fb\">" . $html . "</body></html>";
}

function sendTransactionalEmail(PDO $db, $to, $subject, $html, $fromOverride = null, $attachments = [])
{
    $apiKey = (string)getSetting($db, 'brevo_api_key', '');
    $from = $fromOverride ?: (string)getSetting($db, 'contact_email', '');
    $fromName = (string)getSetting($db, 'sender_name', 'Khilonfast');
    $html = ensureFullHtmlDocument((string)$html);

    if ($apiKey !== '') {
        return sendBrevoApiEmail($apiKey, $from, $fromName, $to, $subject, $html, $attachments);
    }

    // Fallback: SMTP
    $smtpHost = (string)getSetting($db, 'smtp_host', '');
    $smtpPort = (int)getSetting($db, 'smtp_port', '465');
    $smtpUser = (string)getSetting($db, 'smtp_user', '');
    $smtpPass = (string)getSetting($db, 'smtp_pass', '');
    if ($smtpHost === '' || $smtpUser === '' || $smtpPass === '' || $from === '') {
        throw new Exception('Mail ayarları yok (Brevo API key veya SMTP)');
    }
    return sendSmtpEmail($smtpHost, $smtpPort, $smtpUser, $smtpPass, $from, $to, $subject, $html);
}

function sendSmtpEmail($host, $port, $username, $password, $from, $to, $subject, $html)
{
    $timeout = 20;
    $port = (int)$port;
    // 465 → implicit SSL (ssl://). 587/25 → düz başla, EHLO sonrası STARTTLS ile upgrade.
    $useImplicitSsl = ($port === 465);
    $transport = ($useImplicitSsl ? "ssl://" : "") . $host . ":" . $port;
    $fp = @stream_socket_client($transport, $errno, $errstr, $timeout, STREAM_CLIENT_CONNECT);
    if (!$fp) {
        throw new Exception("SMTP connection failed: $errstr ($errno)");
    }

    stream_set_timeout($fp, $timeout);

    $read = function () use (&$fp) {
        $data = '';
        while ($line = fgets($fp, 515)) {
            $data .= $line;
            if (strlen($line) >= 4 && $line[3] === ' ') break;
        }
        return $data;
    };

    $write = function ($cmd) use (&$fp, $read) {
        fwrite($fp, $cmd . "\r\n");
        return $read();
    };

    $greeting = $read();
    if (strpos($greeting, '220') !== 0) {
        throw new Exception("SMTP greeting failed: $greeting");
    }

    $hostName = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $resp = $write("EHLO $hostName");
    if (strpos($resp, '250') !== 0) {
        $resp = $write("HELO $hostName");
        if (strpos($resp, '250') !== 0) {
            throw new Exception("SMTP HELO/EHLO failed: $resp");
        }
    }

    // STARTTLS — submission portu (587) veya sunucu STARTTLS önerirse şifrelemeye geç
    $supportsStartTls = stripos($resp, 'STARTTLS') !== false;
    if (!$useImplicitSsl && ($port === 587 || $supportsStartTls)) {
        $tlsResp = $write("STARTTLS");
        if (strpos($tlsResp, '220') !== 0) {
            throw new Exception("SMTP STARTTLS failed: $tlsResp");
        }
        // Kanal upgrade
        if (!stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
            throw new Exception("SMTP TLS handshake failed");
        }
        // RFC 3207: TLS sonrası EHLO tekrar gönderilir
        $resp = $write("EHLO $hostName");
        if (strpos($resp, '250') !== 0) {
            throw new Exception("SMTP EHLO after STARTTLS failed: $resp");
        }
    }

    if ($username !== '' || $password !== '') {
        $resp = $write("AUTH LOGIN");
        if (strpos($resp, '334') !== 0) {
            throw new Exception("SMTP AUTH LOGIN failed: $resp");
        }

        $resp = $write(base64_encode($username));
        if (strpos($resp, '334') !== 0) {
            throw new Exception("SMTP username rejected: $resp");
        }

        $resp = $write(base64_encode($password));
        if (strpos($resp, '235') !== 0) {
            throw new Exception("SMTP password rejected: $resp");
        }
    }

    $resp = $write("MAIL FROM:<$from>");
    if (strpos($resp, '250') !== 0) {
        throw new Exception("SMTP MAIL FROM failed: $resp");
    }

    $resp = $write("RCPT TO:<$to>");
    if (strpos($resp, '250') !== 0 && strpos($resp, '251') !== 0) {
        throw new Exception("SMTP RCPT TO failed: $resp");
    }

    $resp = $write("DATA");
    if (strpos($resp, '354') !== 0) {
        throw new Exception("SMTP DATA failed: $resp");
    }

    $boundary = md5((string)microtime(true));
    $headers = [];
    $headers[] = "From: <$from>";
    $headers[] = "To: <$to>";
    $headers[] = "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=";
    $headers[] = "MIME-Version: 1.0";
    $headers[] = "Content-Type: multipart/alternative; boundary=\"$boundary\"";

    $body = "--$boundary\r\n";
    $body .= "Content-Type: text/plain; charset=UTF-8\r\n\r\n";
    $body .= "Lutfen HTML destekli bir istemci kullanin.\r\n";
    $body .= "--$boundary\r\n";
    $body .= "Content-Type: text/html; charset=UTF-8\r\n";
    $body .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
    $body .= $html . "\r\n";
    $body .= "--$boundary--\r\n";

    $message = implode("\r\n", $headers) . "\r\n\r\n" . $body . "\r\n.";
    fwrite($fp, $message . "\r\n");
    $resp = $read();
    if (strpos($resp, '250') !== 0) {
        throw new Exception("SMTP message send failed: $resp");
    }

    $write("QUIT");
    fclose($fp);
}

/**
 * scope_items / scope_items_en JSON alanlarını her zaman düz string[] döndürür.
 * Eski kayıtlar "double-encode" olabilir ('["a"]' yerine '"[\"a\"]"'); bu durumda
 * tek json_decode string döndürür, ikinci kez decode edilir.
 * Admin paneldeki "n.map is not a function" hatasını kökten önler.
 */
if (!function_exists('decodeScopeItemsSafe')) {
    function decodeScopeItemsSafe($raw): array
    {
        if (is_array($raw)) return array_values(array_filter($raw, 'is_string'));
        if ($raw === null || $raw === '') return [];
        $decoded = json_decode($raw, true);
        if (is_string($decoded)) {
            $again = json_decode($decoded, true);
            if (is_array($again)) $decoded = $again;
        }
        return is_array($decoded) ? array_values(array_filter($decoded, 'is_string')) : [];
    }
}
