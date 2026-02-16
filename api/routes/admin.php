<?php
// api/routes/admin.php

$db = Database::getInstance();

// Auth and Admin required
$token = getBearerToken();
$payload = decodeJWT($token);

if (!$payload) {
    sendResponse(['error' => 'Unauthorized'], 401);
}

// Check admin status
$stmt = $db->prepare("SELECT role FROM users WHERE id = ?");
$stmt->execute([$payload['id']]);
$user = $stmt->fetch();

if (!$user || $user['role'] !== 'admin') {
    sendResponse(['error' => 'Admin privileges required'], 403);
}

// Settings
if ($action === 'settings') {
    if ($method === 'GET') {
        $stmt = $db->query("SELECT * FROM settings");
        $settings = $stmt->fetchAll();
        $settingsMap = [];
        foreach ($settings as $s) {
            $settingsMap[$s['setting_key']] = $s['setting_value'];
        }
        sendResponse($settingsMap);
    } elseif ($method === 'POST') {
        $updates = json_decode(file_get_contents('php://input'), true);
        foreach ($updates as $key => $value) {
            $stmt = $db->prepare("UPDATE settings SET setting_value = ? WHERE setting_key = ?");
            $stmt->execute([$value, $key]);
        }
        sendResponse(['message' => 'Settings updated successfully']);
    }
}

// Products (Admin)
if ($action === 'products') {
    if ($method === 'GET') {
        $stmt = $db->query("SELECT * FROM products ORDER BY created_at DESC");
        sendResponse($stmt->fetchAll());
    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $db->prepare("INSERT INTO products (product_key, name, description, price, currency, category, type, duration_days, access_content_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['product_key'],
            $data['name'],
            $data['description'],
            $data['price'],
            $data['currency'],
            $data['category'],
            $data['type'] ?? 'service',
            $data['duration_days'] ?? null,
            $data['access_content_url'] ?? null
        ]);
        sendResponse(['id' => $db->lastInsertId(), 'message' => 'Product created']);
    } elseif ($method === 'PUT' && !empty($id)) {
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $db->prepare("UPDATE products SET name=?, description=?, price=?, currency=?, category=?, is_active=?, type=?, duration_days=?, access_content_url=? WHERE id=?");
        $stmt->execute([
            $data['name'],
            $data['description'],
            $data['price'],
            $data['currency'],
            $data['category'],
            $data['is_active'],
            $data['type'],
            $data['duration_days'],
            $data['access_content_url'],
            $id
        ]);
        sendResponse(['message' => 'Product updated']);
    } elseif ($method === 'DELETE' && !empty($id)) {
        $stmt = $db->prepare("DELETE FROM products WHERE id = ?");
        $stmt->execute([$id]);
        sendResponse(['message' => 'Product deleted']);
    }
}

sendResponse(['error' => 'Action not found'], 404);
