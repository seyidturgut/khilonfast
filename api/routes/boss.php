<?php
// api/routes/boss.php — Boss Panel (boss.khilonfast.com)
//
// Ana admin kullanıcı sisteminden BAĞIMSIZ, tek bir PIN ile giren, sadece
// görüntüleme amaçlı (v1) ayrı bir mini panel. requireAuth()/requireAdmin()'e
// dokunmuyor, kendi requireBoss() (api/utils.php) ile korunuyor.

// POST /api/boss/login — {pin} → JWT (role=boss)
if ($action === 'login' && $method === 'POST') {
    $data = getJsonBody();
    $pin = (string)($data['pin'] ?? '');

    // Basit rate-limit — settings.boss_login_lockout içinde JSON {attempts, locked_until}
    $lockoutRaw = (string)getSetting($db, 'boss_login_lockout', '{}');
    $lockout = json_decode($lockoutRaw, true);
    if (!is_array($lockout)) $lockout = [];
    $attempts = (int)($lockout['attempts'] ?? 0);
    $lockedUntil = (int)($lockout['locked_until'] ?? 0);

    if ($lockedUntil > time()) {
        sendResponse(['error' => 'Çok fazla hatalı deneme. Lütfen birkaç dakika sonra tekrar deneyin.'], 429);
    }

    $pinHash = (string)getSetting($db, 'boss_panel_pin_hash', '');
    if ($pinHash === '' || $pin === '' || !password_verify($pin, $pinHash)) {
        $attempts++;
        $newLockout = ['attempts' => $attempts];
        if ($attempts >= 5) {
            $newLockout = ['attempts' => 0, 'locked_until' => time() + 900]; // 15 dk kilit
        }
        $db->prepare(
            "INSERT INTO settings (setting_key, setting_value, setting_group, description)
             VALUES ('boss_login_lockout', ?, 'boss', 'Boss panel PIN deneme sayacı')
             ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)"
        )->execute([json_encode($newLockout)]);
        sendResponse(['error' => 'Geçersiz PIN'], 401);
    }

    // Başarılı giriş — sayacı sıfırla
    $db->prepare(
        "INSERT INTO settings (setting_key, setting_value, setting_group, description)
         VALUES ('boss_login_lockout', '{}', 'boss', 'Boss panel PIN deneme sayacı')
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)"
    )->execute();

    $token = encodeJWT(['role' => 'boss', 'exp' => time() + 90 * 24 * 3600]); // 90 gün — güvenilir tek cihaz
    sendResponse(['token' => $token]);
}

// GET /api/boss/feed — son siparişler + bekleyen havaleler + kampanya durumu + otomasyon uyarıları
if ($action === 'feed' && $method === 'GET') {
    requireBoss();

    $recentOrders = [];
    try {
        $stmt = $db->query(
            "SELECT o.id, o.order_number, o.status AS order_status, o.total_amount, o.currency, o.created_at,
                    u.email, u.first_name, u.last_name,
                    (SELECT p2.payment_method FROM payments p2 WHERE p2.order_id = o.id ORDER BY p2.created_at DESC LIMIT 1) AS payment_method,
                    (SELECT p2.status FROM payments p2 WHERE p2.order_id = o.id ORDER BY p2.created_at DESC LIMIT 1) AS payment_status
             FROM orders o
             LEFT JOIN users u ON u.id = o.user_id
             WHERE o.status = 'completed'
             ORDER BY o.created_at DESC
             LIMIT 20"
        );
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $r) {
            $recentOrders[] = [
                'id' => (int)$r['id'],
                'order_number' => $r['order_number'],
                'total_amount' => (float)$r['total_amount'],
                'currency' => $r['currency'],
                'customer_name' => trim((string)($r['first_name'] ?? '') . ' ' . (string)($r['last_name'] ?? '')),
                'email' => $r['email'],
                'payment_method' => $r['payment_method'],
                'payment_status' => $r['payment_status'],
                'created_at' => $r['created_at'],
            ];
        }
    } catch (Throwable $e) {}

    $pendingTransfers = [];
    try {
        $stmt = $db->query(
            "SELECT o.id, o.order_number, o.total_amount, o.currency, o.created_at,
                    u.email, u.first_name, u.last_name
             FROM orders o
             LEFT JOIN users u ON u.id = o.user_id
             JOIN payments p ON p.order_id = o.id
             WHERE p.payment_method = 'manual_transfer' AND p.status = 'pending'
             ORDER BY o.created_at DESC
             LIMIT 20"
        );
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $r) {
            $pendingTransfers[] = [
                'id' => (int)$r['id'],
                'order_number' => $r['order_number'],
                'total_amount' => (float)$r['total_amount'],
                'currency' => $r['currency'],
                'customer_name' => trim((string)($r['first_name'] ?? '') . ' ' . (string)($r['last_name'] ?? '')),
                'email' => $r['email'],
                'created_at' => $r['created_at'],
            ];
        }
    } catch (Throwable $e) {}

    $campaigns = [];
    try {
        $stmt = $db->query(
            "SELECT c.id, c.name, c.status, c.started_at, c.completed_at,
                    COUNT(r.id) AS total,
                    SUM(r.status IN ('sent','opened','clicked')) AS sent
             FROM crm_campaigns c
             LEFT JOIN crm_campaign_recipients r ON r.campaign_id = c.id
             WHERE c.status IN ('sending','sent')
             GROUP BY c.id
             ORDER BY COALESCE(c.started_at, c.created_at) DESC
             LIMIT 10"
        );
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $r) {
            $campaigns[] = [
                'id' => (int)$r['id'],
                'name' => $r['name'],
                'status' => $r['status'],
                'total' => (int)$r['total'],
                'sent' => (int)$r['sent'],
                'started_at' => $r['started_at'],
                'completed_at' => $r['completed_at'],
            ];
        }
    } catch (Throwable $e) {}

    $automationAlerts = [];
    try {
        $stmt = $db->query(
            "SELECT e.id, e.contact_email, e.trigger_event, e.last_error, e.completed_at, a.name AS automation_name
             FROM automation_executions e
             LEFT JOIN automations a ON a.id = e.automation_id
             WHERE e.status = 'failed'
             ORDER BY e.completed_at DESC
             LIMIT 10"
        );
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $r) {
            $automationAlerts[] = [
                'id' => (int)$r['id'],
                'automation_name' => $r['automation_name'],
                'contact_email' => $r['contact_email'],
                'trigger_event' => $r['trigger_event'],
                'last_error' => $r['last_error'],
                'completed_at' => $r['completed_at'],
            ];
        }
    } catch (Throwable $e) {}

    sendResponse([
        'recent_orders' => $recentOrders,
        'pending_transfers' => $pendingTransfers,
        'campaigns' => $campaigns,
        'automation_alerts' => $automationAlerts,
        'generated_at' => date('c'),
    ]);
}
