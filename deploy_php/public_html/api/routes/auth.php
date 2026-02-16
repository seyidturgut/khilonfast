<?php
// api/routes/auth.php

$db = Database::getInstance();

if ($action === 'register' && $method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (empty($data['email']) || empty($data['password']) || empty($data['first_name']) || empty($data['last_name'])) {
        sendResponse(['error' => 'Required fields missing'], 400);
    }

    // Check if exists
    $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$data['email']]);
    if ($stmt->fetch()) {
        sendResponse(['error' => 'Email already registered'], 400);
    }

    $password_hash = password_hash($data['password'], PASSWORD_BCRYPT);

    $stmt = $db->prepare("INSERT INTO users (email, password_hash, first_name, last_name, phone) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([
        $data['email'],
        $password_hash,
        $data['first_name'],
        $data['last_name'],
        $data['phone'] ?? null
    ]);

    $userId = $db->lastInsertId();
    $token = encodeJWT(['id' => $userId, 'email' => $data['email']]);

    sendResponse([
        'message' => 'User registered successfully',
        'token' => $token,
        'user' => [
            'id' => $userId,
            'email' => $data['email'],
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name']
        ]
    ], 21);
}

if ($action === 'login' && $method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (empty($data['email']) || empty($data['password'])) {
        sendResponse(['error' => 'Email and password required'], 400);
    }

    $stmt = $db->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$data['email']]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($data['password'], $user['password_hash'])) {
        sendResponse(['error' => 'Invalid credentials'], 401);
    }

    $token = encodeJWT(['id' => $user['id'], 'email' => $user['email']]);

    sendResponse([
        'message' => 'Login successful',
        'token' => $token,
        'user' => [
            'id' => $user['id'],
            'email' => $user['email'],
            'first_name' => $user['first_name'],
            'last_name' => $user['last_name']
        ]
    ]);
}

if ($action === 'me' && $method === 'GET') {
    $token = getBearerToken();
    $payload = decodeJWT($token);

    if (!$payload) {
        sendResponse(['error' => 'Unauthorized'], 401);
    }

    $stmt = $db->prepare("SELECT id, email, first_name, last_name, phone, created_at FROM users WHERE id = ?");
    $stmt->execute([$payload['id']]);
    $user = $stmt->fetch();

    if (!$user) {
        sendResponse(['error' => 'User not found'], 404);
    }

    sendResponse(['user' => $user]);
}

sendResponse(['error' => 'Action not found'], 404);
