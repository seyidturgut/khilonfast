<?php
// api/routes/auth.php

$db = Database::getInstance();
ensureMustChangePasswordColumn($db);

if ($action === 'register' && $method === 'POST') {
    $data = getJsonBody();

    $email = trim((string)($data['email'] ?? ''));
    $password = (string)($data['password'] ?? '');
    $firstName = trim((string)($data['first_name'] ?? ''));
    $lastName = trim((string)($data['last_name'] ?? ''));
    $phone = trim((string)($data['phone'] ?? ''));

    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 6 || $firstName === '' || $lastName === '') {
        sendResponse(['error' => 'Required fields missing or invalid'], 400);
    }

    $stmt = $db->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        sendResponse(['error' => 'Email already registered'], 400);
    }

    $passwordHash = password_hash($password, PASSWORD_BCRYPT);
    $stmt = $db->prepare(
        "INSERT INTO users (email, password_hash, first_name, last_name, phone, must_change_password) VALUES (?, ?, ?, ?, ?, 0)"
    );
    $stmt->execute([$email, $passwordHash, $firstName, $lastName, ($phone !== '' ? $phone : null)]);

    $userId = (int)$db->lastInsertId();
    $token = encodeJWT(['id' => $userId, 'email' => $email, 'role' => 'user']);

    sendResponse([
        'message' => 'User registered successfully',
        'token' => $token,
        'user' => [
            'id' => $userId,
            'email' => $email,
            'first_name' => $firstName,
            'last_name' => $lastName,
            'role' => 'user',
            'must_change_password' => false
        ]
    ], 201);
}

if ($action === 'login' && $method === 'POST') {
    $data = getJsonBody();

    $email = trim((string)($data['email'] ?? ''));
    $password = (string)($data['password'] ?? '');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $password === '') {
        sendResponse(['error' => 'Email and password required'], 400);
    }

    $stmt = $db->prepare("SELECT * FROM users WHERE email = ? LIMIT 1");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        sendResponse(['error' => 'Invalid credentials'], 401);
    }

    $role = $user['role'] ?? 'user';
    $token = encodeJWT(['id' => (int)$user['id'], 'email' => $user['email'], 'role' => $role]);

    sendResponse([
        'message' => 'Login successful',
        'token' => $token,
        'user' => [
            'id' => (int)$user['id'],
            'email' => $user['email'],
            'first_name' => $user['first_name'],
            'last_name' => $user['last_name'],
            'role' => $role,
            'must_change_password' => (bool)($user['must_change_password'] ?? 0)
        ]
    ]);
}

if ($action === 'google' && $method === 'POST') {
    $data = getJsonBody();
    $credential = (string)($data['credential'] ?? '');
    if ($credential === '') {
        sendResponse(['error' => 'Missing Google credential'], 400);
    }

    $google = verifyGoogleIdToken($credential);
    if (!$google || empty($google['email'])) {
        sendResponse(['error' => 'Invalid Google token'], 401);
    }

    if (!empty($google['email_verified']) && !$google['email_verified']) {
        sendResponse(['error' => 'Google email not verified'], 401);
    }

    $email = trim((string)$google['email']);
    $firstName = trim((string)($google['given_name'] ?? ''));
    $lastName = trim((string)($google['family_name'] ?? ''));
    if ($firstName === '' && $lastName === '' && !empty($google['name'])) {
        $parts = preg_split('/\s+/', trim((string)$google['name']));
        $firstName = $parts[0] ?? '';
        $lastName = implode(' ', array_slice($parts, 1));
    }

    $stmt = $db->prepare("SELECT * FROM users WHERE email = ? LIMIT 1");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user) {
        $randomPass = bin2hex(random_bytes(16));
        $passwordHash = password_hash($randomPass, PASSWORD_BCRYPT);
        $stmt = $db->prepare(
            "INSERT INTO users (email, password_hash, first_name, last_name, must_change_password) VALUES (?, ?, ?, ?, 0)"
        );
        $stmt->execute([$email, $passwordHash, $firstName, $lastName]);
        $userId = (int)$db->lastInsertId();
        $role = 'user';
        $user = [
            'id' => $userId,
            'email' => $email,
            'first_name' => $firstName,
            'last_name' => $lastName,
            'role' => $role,
            'must_change_password' => false
        ];
    } else {
        $userId = (int)$user['id'];
        $role = $user['role'] ?? 'user';
    }

    $token = encodeJWT(['id' => $userId, 'email' => $email, 'role' => $role]);

    sendResponse([
        'message' => 'Login successful',
        'token' => $token,
        'user' => [
            'id' => $userId,
            'email' => $email,
            'first_name' => $user['first_name'] ?? $firstName,
            'last_name' => $user['last_name'] ?? $lastName,
            'role' => $role,
            'must_change_password' => (bool)($user['must_change_password'] ?? 0)
        ]
    ]);
}

if ($action === 'me' && $method === 'GET') {
    $payload = requireAuth();
    $stmt = $db->prepare(
        "SELECT id, email, first_name, last_name, phone, role, must_change_password, created_at FROM users WHERE id = ? LIMIT 1"
    );
    $stmt->execute([$payload['id']]);
    $user = $stmt->fetch();

    if (!$user) {
        sendResponse(['error' => 'User not found'], 404);
    }

    $user['id'] = (int)$user['id'];
    $user['must_change_password'] = (bool)($user['must_change_password'] ?? 0);

    sendResponse(['user' => $user]);
}

sendResponse(['error' => 'Action not found'], 404);

function verifyGoogleIdToken($token)
{
    $clientId = defined('GOOGLE_CLIENT_ID') ? GOOGLE_CLIENT_ID : '';
    if ($clientId === '') return null;

    $url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' . urlencode($token);
    $context = stream_context_create(['http' => ['timeout' => 5]]);
    $raw = @file_get_contents($url, false, $context);
    if ($raw === false) return null;

    $payload = json_decode($raw, true);
    if (!is_array($payload)) return null;

    if (($payload['aud'] ?? '') !== $clientId) return null;
    $issuer = $payload['iss'] ?? '';
    if (!in_array($issuer, ['https://accounts.google.com', 'accounts.google.com'], true)) return null;

    return $payload;
}
