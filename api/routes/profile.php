<?php
// api/routes/profile.php

$db = Database::getInstance();

// Auth required
$token = getBearerToken();
$payload = decodeJWT($token);

if (!$payload) {
    sendResponse(['error' => 'Unauthorized'], 401);
}

if ($method === 'GET' && empty($action)) {
    $stmt = $db->prepare("SELECT id, email, first_name, last_name, phone, created_at FROM users WHERE id = ?");
    $stmt->execute([$payload['id']]);
    $user = $stmt->fetch();
    sendResponse(['user' => $user]);
}

if ($method === 'PUT' && empty($action)) {
    $data = json_decode(file_get_contents('php://input'), true);
    $stmt = $db->prepare("UPDATE users SET first_name = ?, last_name = ?, phone = ? WHERE id = ?");
    $stmt->execute([
        $data['first_name'],
        $data['last_name'],
        $data['phone'],
        $payload['id']
    ]);
    sendResponse(['message' => 'Profile updated successfully']);
}

sendResponse(['error' => 'Action not found'], 404);
