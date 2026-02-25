<?php
// api/routes/profile.php

$db = Database::getInstance();
ensureMustChangePasswordColumn($db);
$payload = requireAuth();

if ($method === 'GET' && $action === 'contents') {
    $stmt = $db->prepare(
        "SELECT
            s.id AS subscription_id,
            s.status AS subscription_status,
            s.starts_at,
            s.expires_at,
            p.id AS product_id,
            p.product_key,
            p.name,
            p.description,
            p.features,
            p.type,
            p.category,
            p.access_content_url,
            o.status AS order_status
         FROM subscriptions s
         INNER JOIN products p ON p.id = s.product_id
         LEFT JOIN orders o ON o.id = s.order_id
         WHERE s.user_id = ?
           AND s.status = 'active'
           AND (o.status = 'completed' OR o.status IS NULL)
         ORDER BY s.created_at DESC"
    );
    $stmt->execute([$payload['id']]);
    sendResponse(['contents' => $stmt->fetchAll()]);
}

if ($method === 'GET' && empty($action)) {
    $stmt = $db->prepare(
        "SELECT id, email, first_name, last_name, phone, address, must_change_password, created_at FROM users WHERE id = ? LIMIT 1"
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
        "SELECT id, email, first_name, last_name, phone, address, must_change_password FROM users WHERE id = ? LIMIT 1"
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
    $stmt = $db->prepare("UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?");
    $stmt->execute([$newHash, $payload['id']]);

    sendResponse(['message' => 'Password changed successfully']);
}

sendResponse(['error' => 'Action not found'], 404);

