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

// ─────────────────────────────────────────────
// GET /api/profile/consultant-bookings — kullanıcının danışmanlık randevuları
//   (consultant_bookings'te user_id yok → kullanıcının email'i ile eşlenir)
// ─────────────────────────────────────────────
if ($method === 'GET' && $action === 'consultant-bookings') {
    $uStmt = $db->prepare("SELECT email FROM users WHERE id = ? LIMIT 1");
    $uStmt->execute([$payload['id']]);
    $email = (string)($uStmt->fetchColumn() ?: '');
    $rows = [];
    if ($email !== '') {
        try {
            $st = $db->prepare(
                "SELECT cb.id, cb.start_at, cb.end_at, cb.status, cb.booking_type, cb.created_at, cb.order_id,
                        c.name AS consultant_name, cs.title AS service_title, cs.title_en AS service_title_en
                 FROM consultant_bookings cb
                 LEFT JOIN consultants c ON c.id = cb.consultant_id
                 LEFT JOIN consultant_services cs ON cs.id = cb.service_id
                 WHERE cb.email = ?
                 ORDER BY cb.start_at DESC, cb.id DESC"
            );
            $st->execute([$email]);
            foreach ($st->fetchAll(PDO::FETCH_ASSOC) as $b) {
                $startAt = $b['start_at'] ?? null;
                $b['cancellable'] = in_array($b['status'], ['pending', 'confirmed'], true)
                    && $startAt && strtotime($startAt) >= time() + 48 * 3600;
                $rows[] = $b;
            }
        } catch (Throwable $e) { $rows = []; }
    }
    sendResponse(['bookings' => $rows]);
}

// ─────────────────────────────────────────────
// POST /api/profile/consultant-bookings/:id/cancel — müşteri kendi randevusunu iptal eder
//   48 saat kuralı + sahiplik(email) + slot serbest + abonelik iptal + admin'e iade talebi maili
// ─────────────────────────────────────────────
if ($method === 'POST' && $action === 'consultant-bookings' && !empty($id) && $subAction === 'cancel') {
    $bid = (int)$id;
    $uStmt = $db->prepare("SELECT email, first_name, last_name FROM users WHERE id = ? LIMIT 1");
    $uStmt->execute([$payload['id']]);
    $u = $uStmt->fetch();
    $email = strtolower(trim((string)($u['email'] ?? '')));

    $st = $db->prepare("SELECT * FROM consultant_bookings WHERE id = ? LIMIT 1");
    $st->execute([$bid]);
    $booking = $st->fetch();
    if (!$booking) sendResponse(['error' => 'Randevu bulunamadı'], 404);

    // Sahiplik: randevunun email'i kullanıcının email'i ile aynı olmalı
    if ($email === '' || strtolower(trim((string)$booking['email'])) !== $email) {
        sendResponse(['error' => 'Bu randevu size ait değil'], 403);
    }
    if (($booking['status'] ?? '') === 'cancelled') sendResponse(['success' => true, 'message' => 'Randevu zaten iptal edilmiş']);
    if (($booking['status'] ?? '') === 'completed') sendResponse(['error' => 'Tamamlanmış randevu iptal edilemez.'], 409);

    // 48 saat kuralı
    $startAt = $booking['start_at'] ?? null;
    if (!$startAt && !empty($booking['availability_id'])) {
        $a = $db->prepare("SELECT TIMESTAMP(available_date, start_time) FROM consultant_availability WHERE id = ?");
        $a->execute([$booking['availability_id']]);
        $startAt = $a->fetchColumn();
    }
    if ($startAt && strtotime($startAt) < time() + 48 * 3600) {
        sendResponse(['error' => 'Randevunuza 48 saatten az kaldığı için buradan iptal edilemez. Lütfen bizimle iletişime geçin.'], 409);
    }

    try {
        $db->beginTransaction();
        // Randevu iptal + iade-bekliyor notu
        $db->prepare("UPDATE consultant_bookings
                      SET status='cancelled',
                          admin_notes = CONCAT(COALESCE(admin_notes,''), ' | Müşteri iptali (iade bekliyor) ', NOW())
                      WHERE id=?")->execute([$bid]);
        // Slot serbest (eski model availability_id varsa)
        if (!empty($booking['availability_id'])) {
            $db->prepare("UPDATE consultant_availability SET status='available', held_until=NULL WHERE id=?")
               ->execute([(int)$booking['availability_id']]);
        }
        // Bağlı abonelik(ler)i iptal et
        if (!empty($booking['order_id'])) {
            try {
                $db->prepare("UPDATE subscriptions SET status='cancelled', cancelled_at=NOW()
                              WHERE order_id=? AND user_id=? AND status='active'")
                   ->execute([(int)$booking['order_id'], (int)$payload['id']]);
            } catch (Throwable $e) {}
        }
        $db->commit();
    } catch (Throwable $e) {
        if ($db->inTransaction()) $db->rollBack();
        sendResponse(['error' => 'İptal sırasında hata: ' . $e->getMessage()], 500);
    }

    // Admin'e iade talebi maili (gerçek iade elle yapılır)
    try {
        if (function_exists('getSetting') && function_exists('sendTransactionalEmail')) {
            $adminEmail = (string)getSetting($db, 'contact_email', '');
            if ($adminEmail !== '') {
                // Sipariş tutarı (varsa)
                $amount = ''; $orderNo = '';
                if (!empty($booking['order_id'])) {
                    $o = $db->prepare("SELECT order_number, total_amount, currency FROM orders WHERE id=? LIMIT 1");
                    $o->execute([(int)$booking['order_id']]);
                    if ($or = $o->fetch()) {
                        $orderNo = (string)($or['order_number'] ?? '');
                        $amount = trim((string)($or['total_amount'] ?? '') . ' ' . (string)($or['currency'] ?? ''));
                    }
                }
                $safe = fn($s) => htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8');
                $cust = trim((string)($u['first_name'] ?? '') . ' ' . (string)($u['last_name'] ?? ''));
                $html = '<div style="font-family:Arial,sans-serif;line-height:1.7;color:#102a43">'
                    . '<h2 style="color:#b91c1c;margin:0 0 12px">Danışmanlık Randevusu İPTAL — İade Gerekiyor</h2>'
                    . '<p>Müşteri kendi hesabından bir danışmanlık randevusunu iptal etti. Manuel iade işlemi gerekebilir.</p>'
                    . '<table style="border-collapse:collapse;font-size:14px">'
                    . '<tr><td style="padding:4px 10px;color:#627d98">Müşteri</td><td style="padding:4px 10px"><b>' . $safe($cust) . '</b> (' . $safe($email) . ')</td></tr>'
                    . '<tr><td style="padding:4px 10px;color:#627d98">Randevu</td><td style="padding:4px 10px">#' . (int)$bid . ' · ' . $safe($booking['start_at'] ?? '') . '</td></tr>'
                    . '<tr><td style="padding:4px 10px;color:#627d98">Sipariş</td><td style="padding:4px 10px">' . $safe($orderNo) . '</td></tr>'
                    . '<tr><td style="padding:4px 10px;color:#627d98">Tutar</td><td style="padding:4px 10px"><b>' . $safe($amount) . '</b></td></tr>'
                    . '</table>'
                    . '<p style="margin-top:14px;color:#627d98;font-size:13px">Randevu iptal edildi, slot serbest bırakıldı, abonelik pasifleştirildi. İade Lidio/banka üzerinden elle yapılmalıdır.</p>'
                    . '</div>';
                sendTransactionalEmail($db, $adminEmail, 'Danışmanlık İptali — İade Gerekiyor (Randevu #' . (int)$bid . ')', $html);
            }
        }
    } catch (Throwable $e) { error_log('[profile cancel-booking] admin mail: ' . $e->getMessage()); }

    sendResponse(['success' => true, 'message' => 'Randevunuz iptal edildi. İade talebiniz ekibimize iletildi.']);
}

sendResponse(['error' => 'Action not found'], 404);
