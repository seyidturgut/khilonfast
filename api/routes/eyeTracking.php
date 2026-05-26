<?php
// api/routes/eyeTracking.php
// Eye Tracking görsel yükleme ve admin rapor gönderim akışı.

global $method, $routes, $path;
$db = Database::getInstance();

$action = $routes[1] ?? '';
$id = $routes[2] ?? '';
$sub = $routes[3] ?? '';

// Auto-migration: schema yoksa yarat. Idempotent.
function ensureEyeTrackingSchema(PDO $db): void
{
    static $checked = false;
    if ($checked) return;
    try {
        // products.usage_quota
        $col = $db->query("SHOW COLUMNS FROM products LIKE 'usage_quota'")->fetch();
        if (!$col) {
            $db->exec("ALTER TABLE products ADD COLUMN usage_quota INT NULL AFTER duration_days");
        }
        // eye_tracking_uploads tablosu
        $db->exec(
            "CREATE TABLE IF NOT EXISTS eye_tracking_uploads (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                subscription_id INT NULL,
                order_id INT NULL,
                order_item_id INT NULL,
                product_key VARCHAR(64) NOT NULL,
                image_url VARCHAR(512) NOT NULL,
                original_filename VARCHAR(255) NULL,
                status ENUM('pending','reviewed','sent') DEFAULT 'pending',
                admin_notes TEXT NULL,
                report_pdf_url VARCHAR(512) NULL,
                sent_at DATETIME NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_user (user_id),
                INDEX idx_sub (subscription_id),
                INDEX idx_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        );
        // Quota'lar eksikse default değerler set et (eye-* products varsa)
        $db->exec("UPDATE products SET usage_quota = 1 WHERE product_key = 'eye-starter' AND (usage_quota IS NULL OR usage_quota = 0)");
        $db->exec("UPDATE products SET usage_quota = 3 WHERE product_key = 'eye-growth'  AND (usage_quota IS NULL OR usage_quota = 0)");
        $db->exec("UPDATE products SET usage_quota = 5 WHERE product_key = 'eye-pro'     AND (usage_quota IS NULL OR usage_quota = 0)");
        $checked = true;
    } catch (Throwable $e) {
        error_log('[eye-tracking schema] ' . $e->getMessage());
    }
}

ensureEyeTrackingSchema($db);

function eyeUploadsRoot(): string
{
    // Prod hosting: public_html/uploads/eye-tracking (dirname(__DIR__, 2) = web root)
    // Lokal Node layout fallback'i için /public/uploads denemeden bu yol kullanılır.
    return dirname(__DIR__, 2) . '/uploads/eye-tracking';
}

function eyeReportsRoot(): string
{
    return dirname(__DIR__, 2) . '/uploads/eye-reports';
}

function eyeSafeFilename(string $s, string $fallback): string
{
    $s = mb_strtolower($s, 'UTF-8');
    $tr = ['ğ'=>'g','ü'=>'u','ş'=>'s','ı'=>'i','ö'=>'o','ç'=>'c'];
    $s = strtr($s, $tr);
    $s = preg_replace('/[^a-z0-9-_]+/', '-', $s);
    $s = trim($s, '-');
    $s = substr($s, 0, 80);
    return $s !== '' ? $s : $fallback;
}

function eyeGetUserPackages(PDO $db, int $userId): array
{
    // last_renewal_at kolonu yoksa subscription rows boş gelebilir; defansif fallback
    $hasRenewalCol = false;
    try {
        $hasRenewalCol = (bool)$db->query("SHOW COLUMNS FROM subscriptions LIKE 'last_renewal_at'")->fetch();
    } catch (Throwable $e) { /* ignore */ }
    $renewalSelect = $hasRenewalCol ? 's.last_renewal_at' : 'NULL AS last_renewal_at';

    $stmt = $db->prepare(
        "SELECT s.id AS subscription_id, s.product_id, s.status, s.starts_at, s.expires_at, $renewalSelect,
                p.product_key, p.name, p.usage_quota, p.duration_days
         FROM subscriptions s
         JOIN products p ON p.id = s.product_id
         WHERE s.user_id = ?
           AND p.product_key LIKE 'eye-%'
           AND s.status = 'active'
           AND (s.expires_at IS NULL OR s.expires_at > NOW())"
    );
    $stmt->execute([$userId]);
    $packages = [];
    foreach ($stmt->fetchAll() as $r) {
        $periodStart = $r['last_renewal_at'] ?: $r['starts_at'];
        $usedStmt = $db->prepare(
            "SELECT COUNT(*) FROM eye_tracking_uploads
             WHERE user_id = ? AND subscription_id = ? AND created_at >= ?"
        );
        $usedStmt->execute([$userId, $r['subscription_id'], $periodStart]);
        $used = (int)$usedStmt->fetchColumn();
        $quota = (int)$r['usage_quota'];
        $packages[] = [
            'subscription_id' => (int)$r['subscription_id'],
            'product_key' => $r['product_key'],
            'name' => $r['name'],
            'quota' => $quota,
            'used' => $used,
            'remaining' => max(0, $quota - $used),
            'period_started_at' => $periodStart,
            'period_ends_at' => $r['expires_at']
        ];
    }
    return $packages;
}

// ------------- ADMIN -------------
// Route segmentleri: eye-tracking/admin/...
if ($action === 'admin') {
    $auth = requireAuth();
    if (($auth['role'] ?? '') !== 'admin') {
        sendResponse(['error' => 'Yetki yok'], 403);
    }

    // GET /api/eye-tracking/admin/user/{userId}/packages
    if ($method === 'GET' && $id === 'user' && $sub !== '' && ($routes[4] ?? '') === 'packages') {
        $uid = (int)$sub;
        sendResponse(['packages' => eyeGetUserPackages($db, $uid)]);
    }

    // GET /api/eye-tracking/admin
    if ($method === 'GET' && $id === '') {
        $status = $_GET['status'] ?? '';
        $sql = "SELECT u.id, u.user_id, u.subscription_id, u.product_key, u.image_url, u.original_filename,
                       u.status, u.admin_notes, u.report_pdf_url, u.sent_at, u.created_at,
                       us.email, us.first_name, us.last_name, us.phone
                FROM eye_tracking_uploads u
                LEFT JOIN users us ON us.id = u.user_id";
        $params = [];
        if (in_array($status, ['pending','reviewed','sent'], true)) {
            $sql .= " WHERE u.status = ?";
            $params[] = $status;
        }
        $sql .= " ORDER BY u.created_at DESC LIMIT 500";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        sendResponse(['uploads' => $stmt->fetchAll()]);
    }

    // POST /api/eye-tracking/admin/{id}/report
    // Multipart (file=<pdf>, admin_notes, subject) veya JSON ({pdf_base64, filename, admin_notes, subject})
    if ($method === 'POST' && $sub === 'report' && $id !== '') {
        $raw = null;
        $filename = 'rapor.pdf';
        $adminNotes = '';
        $subject = '';

        if (!empty($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
            // Multipart upload
            $raw = file_get_contents($_FILES['file']['tmp_name']);
            $filename = $_FILES['file']['name'] ?: 'rapor.pdf';
            $adminNotes = (string)($_POST['admin_notes'] ?? '');
            $subject = trim((string)($_POST['subject'] ?? ''));
        } else {
            // JSON body fallback
            $input = json_decode(file_get_contents('php://input'), true) ?: [];
            $pdfB64 = $input['pdf_base64'] ?? '';
            $filename = $input['filename'] ?? 'rapor.pdf';
            $adminNotes = (string)($input['admin_notes'] ?? '');
            $subject = trim((string)($input['subject'] ?? ''));
            if ($pdfB64 && strpos($pdfB64, 'data:application/pdf;base64,') === 0) {
                $raw = base64_decode(substr($pdfB64, strlen('data:application/pdf;base64,')));
            }
        }

        if (!$subject) $subject = 'Reklam Görsel Analiz Raporunuz Hazır';
        if (!$raw) {
            sendResponse(['error' => 'PDF verisi eksik veya hatalı'], 400);
        }

        $stmt = $db->prepare(
            "SELECT u.*, us.email, us.first_name FROM eye_tracking_uploads u
             LEFT JOIN users us ON us.id = u.user_id WHERE u.id = ?"
        );
        $stmt->execute([(int)$id]);
        $row = $stmt->fetch();
        if (!$row) sendResponse(['error' => 'Yükleme bulunamadı'], 404);

        $safe = eyeSafeFilename($row['product_key'], 'rapor');
        $finalName = $row['user_id'] . '-' . $id . '-' . time() . '-' . $safe . '.pdf';
        $dir = eyeReportsRoot();
        if (!is_dir($dir)) mkdir($dir, 0775, true);
        $filePath = $dir . '/' . $finalName;
        file_put_contents($filePath, $raw);
        $reportUrl = '/uploads/eye-reports/' . $finalName;

        $upd = $db->prepare(
            "UPDATE eye_tracking_uploads
             SET report_pdf_url = ?, admin_notes = ?, status = 'sent', sent_at = NOW()
             WHERE id = ?"
        );
        $upd->execute([$reportUrl, $adminNotes, (int)$id]);

        if (!empty($row['email'])) {
            $first = htmlspecialchars((string)($row['first_name'] ?? ''), ENT_QUOTES, 'UTF-8');
            $notesHtml = $adminNotes !== ''
                ? '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin:12px 0"><strong>Analist Notu:</strong><br>' . nl2br(htmlspecialchars($adminNotes, ENT_QUOTES, 'UTF-8')) . '</div>'
                : '';
            $html = '<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f4f7fb;padding:20px;margin:0;color:#102a43">
                <div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #dde7f0;border-radius:12px;overflow:hidden">
                    <div style="background:linear-gradient(90deg,#1a3a52,#89b004);color:#fff;padding:20px 24px">
                        <h2 style="margin:0;font-size:1.2rem">khilonfast — Reklam Görsel Analizi</h2>
                    </div>
                    <div style="padding:24px;line-height:1.7">
                        <p>Merhaba ' . $first . ',</p>
                        <p>Yüklediğiniz reklam görseli için analiz raporunuz hazır. Detaylar ek dosyada (PDF).</p>
                        ' . $notesHtml . '
                        <p>Hesabımdan da bu rapora her zaman erişebilirsiniz.</p>
                        <p style="margin-top:16px">Saygılarımızla,<br>Khilonfast Ekibi</p>
                    </div>
                </div></body></html>';
            try {
                sendTransactionalEmail($db, $row['email'], $subject, $html, null, [
                    ['name' => $safe . '.pdf', 'path' => $filePath]
                ]);
            } catch (Throwable $e) {
                error_log('eye report mail err: ' . $e->getMessage());
            }
        }

        sendResponse(['ok' => true, 'report_url' => $reportUrl]);
    }

    // PUT /api/eye-tracking/admin/{id}/notes
    if ($method === 'PUT' && $sub === 'notes' && $id !== '') {
        $input = json_decode(file_get_contents('php://input'), true) ?: [];
        $notes = (string)($input['admin_notes'] ?? '');
        $upd = $db->prepare(
            "UPDATE eye_tracking_uploads
             SET admin_notes = ?, status = CASE WHEN status = 'pending' THEN 'reviewed' ELSE status END
             WHERE id = ?"
        );
        $upd->execute([$notes, (int)$id]);
        sendResponse(['ok' => true]);
    }

    sendResponse(['error' => 'API Endpoint not found: ' . $path], 404);
}

// ------------- USER -------------
$auth = requireAuth();
$userId = (int)($auth['userId'] ?? $auth['id'] ?? 0);
if (!$userId) sendResponse(['error' => 'Yetki yok'], 401);

// POST /api/eye-tracking/upload  body: {dataUrl, filename}
if ($method === 'POST' && $action === 'upload') {
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $dataUrl = $input['dataUrl'] ?? '';
    $filename = $input['filename'] ?? '';
    if (!is_string($dataUrl) || !preg_match('/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/', $dataUrl, $m)) {
        sendResponse(['error' => 'Geçersiz görsel formatı'], 400);
    }
    $mime = strtolower($m[1]);
    $extMap = ['image/jpeg' => 'jpg', 'image/jpg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif'];
    if (!isset($extMap[$mime])) sendResponse(['error' => 'Desteklenmeyen görsel tipi'], 400);
    $buf = base64_decode($m[2]);
    if (!$buf || strlen($buf) > 15 * 1024 * 1024) {
        sendResponse(['error' => 'Görsel 15 MB üzerinde olamaz'], 400);
    }

    $packages = eyeGetUserPackages($db, $userId);
    $usable = null;
    foreach ($packages as $p) if ($p['remaining'] > 0) { $usable = $p; break; }
    if (!$usable) sendResponse(['error' => 'Bu dönem için kullanım hakkınız kalmadı veya aktif bir paket bulunamadı.'], 403);

    $safe = eyeSafeFilename($filename ?: 'gorsel', 'gorsel');
    $finalName = $userId . '-' . time() . '-' . $safe . '.' . $extMap[$mime];
    $dir = eyeUploadsRoot();
    if (!is_dir($dir)) mkdir($dir, 0775, true);
    file_put_contents($dir . '/' . $finalName, $buf);
    $imageUrl = '/uploads/eye-tracking/' . $finalName;

    $ins = $db->prepare(
        "INSERT INTO eye_tracking_uploads
         (user_id, subscription_id, product_key, image_url, original_filename, status)
         VALUES (?, ?, ?, ?, ?, 'pending')"
    );
    $ins->execute([$userId, $usable['subscription_id'], $usable['product_key'], $imageUrl, $filename ?: $finalName]);

    // Hatırlatma akışını durdur — kullanıcı görsel yükledi (stop_condition: images_uploaded=TRUE)
    $userInfo = null;
    try {
        $userStmt = $db->prepare("SELECT email, first_name, last_name FROM users WHERE id = ? LIMIT 1");
        $userStmt->execute([$userId]);
        $userInfo = $userStmt->fetch();
        $userEmail = (string)($userInfo['email'] ?? '');
        if ($userEmail !== '') {
            require_once __DIR__ . '/../services/AutomationEngine.php';
            (new AutomationEngine($db))->cancelByCondition('images_uploaded', $userEmail);
        }
    } catch (Throwable $e) {
        error_log('[eye upload] cancel reminder failed: ' . $e->getMessage());
    }

    // Admin'e yeni görsel bildirimi
    try {
        $adminEmail = (string)getSetting($db, 'contact_email', '');
        if ($adminEmail !== '' && function_exists('sendTransactionalEmail')) {
            $userName = trim((string)($userInfo['first_name'] ?? '') . ' ' . (string)($userInfo['last_name'] ?? ''));
            if ($userName === '') $userName = (string)($userInfo['email'] ?? ('Kullanıcı #' . $userId));
            $safeName  = htmlspecialchars($userName, ENT_QUOTES, 'UTF-8');
            $safeEmail = htmlspecialchars((string)($userInfo['email'] ?? ''), ENT_QUOTES, 'UTF-8');
            $safePkg   = htmlspecialchars((string)$usable['product_key'], ENT_QUOTES, 'UTF-8');
            $imgFull   = 'https://khilonfast.com' . $imageUrl;
            $adminUrl  = 'https://khilonfast.com/admin/eye-tracking-uploads';
            $subject = '[Khilonfast] Yeni reklam görseli yüklendi — ' . $userName;
            $html = '<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f4f7fb;padding:20px;margin:0;color:#102a43">
                <div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #dde7f0;border-radius:12px;overflow:hidden">
                    <div style="background:linear-gradient(90deg,#1a3a52,#89b004);color:#fff;padding:20px 24px">
                        <h2 style="margin:0;font-size:1.15rem">Yeni Reklam Görsel Analizi Talebi</h2>
                    </div>
                    <div style="padding:24px;line-height:1.7">
                        <p><strong>Kullanıcı:</strong> ' . $safeName . ' (' . $safeEmail . ')</p>
                        <p><strong>Paket:</strong> ' . $safePkg . '</p>
                        <p><strong>Yükleme zamanı:</strong> ' . date('d.m.Y H:i') . '</p>
                        <p><a href="' . htmlspecialchars($imgFull, ENT_QUOTES, 'UTF-8') . '" target="_blank">Görseli aç</a></p>
                        <p style="margin-top:18px">
                            <a href="' . $adminUrl . '" style="background:#1a3a52;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Admin Panelinde Aç</a>
                        </p>
                    </div>
                </div></body></html>';
            sendTransactionalEmail($db, $adminEmail, $subject, $html);
        }
    } catch (Throwable $e) {
        error_log('[eye upload] admin notify failed: ' . $e->getMessage());
    }

    sendResponse(['ok' => true, 'image_url' => $imageUrl, 'packages' => eyeGetUserPackages($db, $userId)]);
}

// GET /api/eye-tracking/my-uploads
if ($method === 'GET' && $action === 'my-uploads') {
    try {
        $stmt = $db->prepare(
            "SELECT id, product_key, image_url, status, admin_notes, report_pdf_url, sent_at, created_at
             FROM eye_tracking_uploads WHERE user_id = ? ORDER BY created_at DESC"
        );
        $stmt->execute([$userId]);
        sendResponse([
            'uploads' => $stmt->fetchAll(),
            'packages' => eyeGetUserPackages($db, $userId)
        ]);
    } catch (Throwable $e) {
        error_log('[eye-tracking my-uploads] ' . $e->getMessage());
        sendResponse(['error' => 'Sunucu hatası', 'detail' => $e->getMessage()], 500);
    }
}

// GET /api/eye-tracking/{id}/report.pdf  → kullanıcı veya admin PDF indirir
if ($method === 'GET' && $id !== '' && ($action !== '' && (int)$action > 0)) {
    // path /api/eye-tracking/{id}/report.pdf → action=id, $id='report.pdf'
}
if ($method === 'GET' && is_numeric($action)) {
    $uploadId = (int)$action;
    $stmt = $db->prepare("SELECT user_id, report_pdf_url FROM eye_tracking_uploads WHERE id = ?");
    $stmt->execute([$uploadId]);
    $row = $stmt->fetch();
    if (!$row) sendResponse(['error' => 'Bulunamadı'], 404);
    if ((int)$row['user_id'] !== $userId && ($auth['role'] ?? '') !== 'admin') {
        sendResponse(['error' => 'Yetki yok'], 403);
    }
    if (empty($row['report_pdf_url'])) sendResponse(['error' => 'Rapor henüz yüklenmedi'], 404);
    $filePath = realpath(__DIR__ . '/../..') . '/public' . $row['report_pdf_url'];
    if (!is_readable($filePath)) sendResponse(['error' => 'Dosya bulunamadı'], 404);
    header('Content-Type: application/pdf');
    header('Content-Disposition: inline; filename="rapor.pdf"');
    header('Content-Length: ' . filesize($filePath));
    readfile($filePath);
    exit;
}

sendResponse(['error' => 'API Endpoint not found: ' . $path], 404);
