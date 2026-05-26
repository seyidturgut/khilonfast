<?php
// api/routes/profile.php

$db = Database::getInstance();
ensureMustChangePasswordColumn($db);
$hasMustChangePassword = hasMustChangePasswordColumn($db);
$payload = requireAuth();

if ($method === 'GET' && $action === 'contents') {
    // Aynı kullanıcı aynı ürünü birden fazla kez almışsa (ör. başarısız denemelerden
    // sonra tekrar deneme), subscriptions tablosunda birden fazla satır olabilir.
    // Frontend'de "İçeriklerim"de tekrarlı kart oluşmasın diye product_key başına
    // en güncel aktif aboneliği dönüyoruz.
    // Kullanıcının aktif abonelikleri (her product_key için en yeni satır — duplicate gizlenir)
    $stmt = $db->prepare(
        "SELECT
            s.id AS subscription_id,
            s.status AS subscription_status,
            s.starts_at,
            s.expires_at,
            s.next_renewal_at,
            s.auto_renew,
            s.payment_method,
            s.cancellation_requested_at,
            s.cancelled_at,
            uc.masked_number AS card_masked,
            uc.card_brand AS card_brand,
            p.id AS product_id,
            p.product_key,
            p.name,
            p.description,
            p.features,
            p.type,
            p.category,
            p.duration_days,
            p.access_content_url,
            tap.slug AS training_slug,
            o.status AS order_status
         FROM subscriptions s
         INNER JOIN products p ON p.id = s.product_id
         LEFT JOIN training_access_pages tap ON tap.product_key = p.product_key
         LEFT JOIN orders o ON o.id = s.order_id
         LEFT JOIN user_cards uc ON uc.id = s.renewal_card_id
         WHERE s.user_id = ?
           AND s.status = 'active'
           AND (o.status = 'completed' OR o.status IS NULL)
           AND s.id IN (
               SELECT max_id FROM (
                   SELECT MAX(s2.id) AS max_id
                   FROM subscriptions s2
                   INNER JOIN products p2 ON p2.id = s2.product_id
                   WHERE s2.user_id = ? AND s2.status = 'active'
                   GROUP BY p2.product_key
               ) AS dedupe
           )
         ORDER BY s.created_at DESC"
    );
    $stmt->execute([$payload['id'], $payload['id']]);
    $rows = $stmt->fetchAll();

    // has_started: Kullanıcının training_watch_sessions tablosunda kaydı olan product_key'leri çek,
    // sonra PHP tarafında flag set et. Bu yaklaşım collation farklarına immün.
    $startedKeys = [];
    try {
        $tws = $db->prepare(
            "SELECT DISTINCT product_key FROM training_watch_sessions WHERE user_id = ?"
        );
        $tws->execute([$payload['id']]);
        foreach ($tws->fetchAll() as $r) {
            $startedKeys[trim((string)$r['product_key'])] = true;
        }
    } catch (Throwable $e) {
        // Tablo yoksa veya sorun varsa sessizce geç — has_started false kalır
        error_log('has_started check skipped: ' . $e->getMessage());
    }

    foreach ($rows as &$row) {
        $row['has_started'] = isset($startedKeys[trim((string)$row['product_key'])]);
        // PDO bazen integer kolonları string döndürür — frontend Set/lookup tutarlılığı için int cast
        $row['product_id'] = (int)$row['product_id'];
        $row['subscription_id'] = (int)$row['subscription_id'];
        $row['auto_renew'] = (int)($row['auto_renew'] ?? 0);
        $row['duration_days'] = $row['duration_days'] !== null ? (int)$row['duration_days'] : null;
        $row['is_subscription'] = ($row['type'] === 'subscription');
    }
    unset($row);

    sendResponse(['contents' => $rows]);
}

if ($method === 'GET' && empty($action)) {
    $stmt = $db->prepare(
        $hasMustChangePassword
            ? "SELECT id, email, first_name, last_name, phone, address, must_change_password, created_at FROM users WHERE id = ? LIMIT 1"
            : "SELECT id, email, first_name, last_name, phone, address, created_at FROM users WHERE id = ? LIMIT 1"
    );
    $stmt->execute([$payload['id']]);
    $user = $stmt->fetch();
    if (!$user) {
        sendResponse(['error' => 'User not found'], 404);
    }
    $user['id'] = (int)$user['id'];
    $user['must_change_password'] = (bool)($user['must_change_password'] ?? 0);
    sendResponse($user);
}

if ($method === 'PUT' && empty($action)) {
    $data = getJsonBody();

    $firstName = trim((string)($data['first_name'] ?? ''));
    $lastName = trim((string)($data['last_name'] ?? ''));
    $phone = trim((string)($data['phone'] ?? ''));
    $address = trim((string)($data['address'] ?? ''));

    if ($firstName === '' || $lastName === '') {
        sendResponse(['error' => 'First name and last name are required'], 400);
    }

    $stmt = $db->prepare("UPDATE users SET first_name = ?, last_name = ?, phone = ?, address = ? WHERE id = ?");
    $stmt->execute([$firstName, $lastName, ($phone !== '' ? $phone : null), ($address !== '' ? $address : null), $payload['id']]);

    $stmt = $db->prepare(
        $hasMustChangePassword
            ? "SELECT id, email, first_name, last_name, phone, address, must_change_password FROM users WHERE id = ? LIMIT 1"
            : "SELECT id, email, first_name, last_name, phone, address FROM users WHERE id = ? LIMIT 1"
    );
    $stmt->execute([$payload['id']]);
    $user = $stmt->fetch();
    $user['id'] = (int)$user['id'];
    $user['must_change_password'] = (bool)($user['must_change_password'] ?? 0);

    sendResponse(['message' => 'Profile updated successfully', 'user' => $user]);
}

if ($method === 'PUT' && $action === 'password') {
    $data = getJsonBody();
    $currentPassword = (string)($data['current_password'] ?? '');
    $newPassword = (string)($data['new_password'] ?? '');

    if ($currentPassword === '' || strlen($newPassword) < 6) {
        sendResponse(['error' => 'Current and new password are required'], 400);
    }

    $stmt = $db->prepare("SELECT password_hash FROM users WHERE id = ? LIMIT 1");
    $stmt->execute([$payload['id']]);
    $user = $stmt->fetch();
    if (!$user) {
        sendResponse(['error' => 'User not found'], 404);
    }
    if (!password_verify($currentPassword, $user['password_hash'])) {
        sendResponse(['error' => 'Current password is incorrect'], 400);
    }

    $newHash = password_hash($newPassword, PASSWORD_BCRYPT);
    $stmt = $db->prepare(
        $hasMustChangePassword
            ? "UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?"
            : "UPDATE users SET password_hash = ? WHERE id = ?"
    );
    $stmt->execute([$newHash, $payload['id']]);

    sendResponse(['message' => 'Password changed successfully']);
}

// GET /api/profile/protected-pdf/:filename — auth gated PDF stream
if ($method === 'GET' && $action === 'protected-pdf' && !empty($id)) {
    $filename = basename(urldecode((string)$id));

    // Güvenlik: path traversal engelle
    if ($filename === '' || strpos($filename, '..') !== false || strpos($filename, '/') !== false || strpos($filename, '\\') !== false) {
        sendResponse(['error' => 'Invalid filename'], 400);
    }

    // Kullanıcının aktif aboneliği var mı?
    $stmt = $db->prepare("SELECT id FROM subscriptions WHERE user_id = ? AND status = 'active' LIMIT 1");
    $stmt->execute([$payload['id']]);
    if (!$stmt->fetch()) {
        sendResponse(['error' => 'Access denied'], 403);
    }

    // PDF dosya yolu: public_html/uploads/training-pdfs/
    $filePath = dirname(__DIR__, 2) . '/uploads/training-pdfs/' . $filename;
    if (!file_exists($filePath)) {
        sendResponse(['error' => 'File not found'], 404);
    }

    header('Content-Type: application/pdf');
    header('Content-Disposition: inline');
    header('Cache-Control: no-store, no-cache');
    header('X-Content-Type-Options: nosniff');
    header('Content-Length: ' . filesize($filePath));
    readfile($filePath);
    exit;
}

// ─────────────────────────────────────────────
// POST /api/profile/subscriptions/:id/cancel
//   Dönem sonu iptal: auto_renew=0 + cancellation_requested_at=NOW().
//   Mevcut dönem (expires_at) sonuna kadar erişim sürer; status='active' kalır.
// ─────────────────────────────────────────────
$subAction = $routes[3] ?? '';
if ($method === 'POST' && $action === 'subscriptions' && !empty($id) && $subAction === 'cancel') {
    $subId = (int)$id;
    // Sahiplik kontrolü
    $own = $db->prepare("SELECT id, auto_renew, expires_at, cancellation_requested_at
                         FROM subscriptions WHERE id = ? AND user_id = ? AND status = 'active' LIMIT 1");
    $own->execute([$subId, $payload['id']]);
    $sub = $own->fetch();
    if (!$sub) {
        sendResponse(['error' => 'Abonelik bulunamadı veya yetkisiz'], 404);
    }
    if ((int)($sub['auto_renew'] ?? 0) === 0 && !empty($sub['cancellation_requested_at'])) {
        sendResponse(['success' => true, 'already' => true, 'message' => 'Bu abonelik için yenileme zaten kapalı.']);
    }
    $upd = $db->prepare(
        "UPDATE subscriptions
         SET auto_renew = 0, cancellation_requested_at = NOW()
         WHERE id = ? AND user_id = ?"
    );
    $upd->execute([$subId, $payload['id']]);
    sendResponse([
        'success' => true,
        'message' => 'Aboneliğiniz dönem sonunda sonlandırılacak. Mevcut erişiminiz süre bitimine kadar devam eder.',
        'expires_at' => $sub['expires_at'] ?? null
    ]);
}

// ─────────────────────────────────────────────
// POST /api/profile/subscriptions/:id/resume
//   İptal geri al: auto_renew=1 + cancellation_requested_at=NULL (dönem dolmamışsa)
// ─────────────────────────────────────────────
if ($method === 'POST' && $action === 'subscriptions' && !empty($id) && $subAction === 'resume') {
    $subId = (int)$id;
    $own = $db->prepare("SELECT id, expires_at FROM subscriptions
                         WHERE id = ? AND user_id = ? AND status = 'active' LIMIT 1");
    $own->execute([$subId, $payload['id']]);
    $sub = $own->fetch();
    if (!$sub) {
        sendResponse(['error' => 'Abonelik bulunamadı veya yetkisiz'], 404);
    }
    $db->prepare(
        "UPDATE subscriptions
         SET auto_renew = 1, cancellation_requested_at = NULL
         WHERE id = ? AND user_id = ?"
    )->execute([$subId, $payload['id']]);
    sendResponse(['success' => true, 'message' => 'Otomatik yenileme yeniden aktif edildi.']);
}

sendResponse(['error' => 'Action not found'], 404);
