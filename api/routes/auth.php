<?php
// api/routes/auth.php

$db = Database::getInstance();
ensureMustChangePasswordColumn($db);
$hasMustChangePassword = hasMustChangePasswordColumn($db);

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
    if ($hasMustChangePassword) {
        $stmt = $db->prepare(
            "INSERT INTO users (email, password_hash, first_name, last_name, phone, must_change_password) VALUES (?, ?, ?, ?, ?, 0)"
        );
        $stmt->execute([$email, $passwordHash, $firstName, $lastName, ($phone !== '' ? $phone : null)]);
    } else {
        $stmt = $db->prepare(
            "INSERT INTO users (email, password_hash, first_name, last_name, phone) VALUES (?, ?, ?, ?, ?)"
        );
        $stmt->execute([$email, $passwordHash, $firstName, $lastName, ($phone !== '' ? $phone : null)]);
    }

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
        if ($hasMustChangePassword) {
            $stmt = $db->prepare(
                "INSERT INTO users (email, password_hash, first_name, last_name, must_change_password) VALUES (?, ?, ?, ?, 0)"
            );
            $stmt->execute([$email, $passwordHash, $firstName, $lastName]);
        } else {
            $stmt = $db->prepare(
                "INSERT INTO users (email, password_hash, first_name, last_name) VALUES (?, ?, ?, ?)"
            );
            $stmt->execute([$email, $passwordHash, $firstName, $lastName]);
        }
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
        $hasMustChangePassword
            ? "SELECT id, email, first_name, last_name, phone, role, must_change_password, created_at FROM users WHERE id = ? LIMIT 1"
            : "SELECT id, email, first_name, last_name, phone, role, created_at FROM users WHERE id = ? LIMIT 1"
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

// POST /api/auth/forgot-password — email'e şifre sıfırlama linki gönderir.
// Email enumeration'ı önlemek için her durumda success döner; user yoksa sessizce skip.
if ($action === 'forgot-password' && $method === 'POST') {
    $data = getJsonBody();
    $email = trim(strtolower((string)($data['email'] ?? '')));
    $lang = strtolower((string)($data['lang'] ?? 'tr'));
    $isEn = $lang === 'en';

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sendResponse(['error' => $isEn ? 'Invalid email address' : 'Geçersiz e-posta adresi'], 400);
    }

    $stmt = $db->prepare("SELECT id, email, first_name FROM users WHERE LOWER(email) = ? LIMIT 1");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user) {
        try {
            // 1 saatlik JWT — set-password endpoint'i bu token ile auth eder
            $resetToken = encodeJWT([
                'id'      => (int)$user['id'],
                'email'   => $user['email'],
                'purpose' => 'password_reset',
                'exp'     => time() + 3600
            ]);

            // Mail ayarları — Brevo API (öncelikli) veya SMTP fallback
            $from = (string)getSetting($db, 'contact_email', '');
            $brevoApiKey = (string)getSetting($db, 'brevo_api_key', '');

            if ($from === '' || ($brevoApiKey === '' && (string)getSetting($db, 'smtp_host', '') === '')) {
                error_log('[forgot-password] mail ayarları eksik');
            } else {
                $resetUrl = 'https://khilonfast.com'
                    . ($isEn ? '/en/set-password' : '/sifre-belirle')
                    . '?token=' . urlencode($resetToken) . '&mode=reset';
                $safeFirst = htmlspecialchars((string)($user['first_name'] ?? 'Değerli Kullanıcı'), ENT_QUOTES, 'UTF-8');

                if ($isEn) {
                    $subject = 'Khilonfast — Reset Your Password';
                    $heading = 'Reset Your Password';
                    $intro = "Hi <strong>{$safeFirst}</strong>,";
                    $body = "We received a request to reset the password on your Khilonfast account. Click the button below to set a new password. This link is valid for 1 hour.";
                    $btn = 'Reset Password';
                    $foot = "If you didn't request a password reset, you can safely ignore this email.";
                } else {
                    $subject = 'Khilonfast — Şifre Sıfırlama Talebi';
                    $heading = 'Şifrenizi Sıfırlayın';
                    $intro = "Merhaba <strong>{$safeFirst}</strong>,";
                    $body = "Khilonfast hesabınız için şifre sıfırlama talebi aldık. Yeni şifrenizi belirlemek için aşağıdaki butona tıklayın. Bu link 1 saat geçerlidir.";
                    $btn = 'Şifremi Sıfırla';
                    $foot = "Eğer böyle bir talepte bulunmadıysanız bu e-postayı görmezden gelebilirsiniz; hesabınız güvende.";
                }

                $html = "<!doctype html><html><body style='font-family:Arial,sans-serif;background:#f6f8fb;padding:20px;margin:0;'>
                    <div style='max-width:600px;margin:0 auto;background:#fff;border:1px solid #dde7f0;border-radius:12px;overflow:hidden;'>
                    <div style='background:linear-gradient(90deg,#1a3a52,#89b004);color:#fff;padding:20px 24px;'>
                        <h2 style='margin:0;font-size:1.3rem;'>{$heading}</h2>
                    </div>
                    <div style='padding:24px;color:#102a43;line-height:1.7;'>
                        <p style='margin-top:0;'>{$intro}</p>
                        <p>{$body}</p>
                        <div style='text-align:center;margin:28px 0;'>
                            <a href='{$resetUrl}'
                               style='background-color:#1a3a52;color:#ffffff !important;text-decoration:none;
                                      padding:14px 32px;border-radius:8px;font-weight:700;font-size:1rem;display:inline-block;'>
                                {$btn} →
                            </a>
                        </div>
                        <hr style='border:none;border-top:1px solid #e2e8f0;margin:20px 0;'/>
                        <p style='font-size:0.82rem;color:#94a3b8;margin:0;'>{$foot}</p>
                    </div></div></body></html>";

                // Akıllı wrapper: brevo_api_key varsa HTTP API, yoksa SMTP
                sendTransactionalEmail($db, $email, $subject, $html, $from);
            }
        } catch (Throwable $e) {
            error_log('[forgot-password] mail error: ' . $e->getMessage());
        }
    }

    // Email enumeration'ı önle — kullanıcı yoksa bile başarılı dön
    sendResponse([
        'message' => $isEn
            ? 'If an account exists for this email, a reset link has been sent.'
            : 'Bu e-postaya kayıtlı bir hesap varsa, sıfırlama bağlantısı gönderildi.'
    ]);
}

// POST /api/auth/set-password — must_change_password=1 olan kullanıcı ilk şifresini belirler
if ($action === 'set-password' && $method === 'POST') {
    $payload = requireAuth();
    $data = getJsonBody();

    $password = (string)($data['password'] ?? '');
    if (strlen($password) < 6) {
        sendResponse(['error' => 'Şifre en az 6 karakter olmalıdır'], 400);
    }

    $stmt = $db->prepare("SELECT id, must_change_password FROM users WHERE id = ? LIMIT 1");
    $stmt->execute([$payload['id']]);
    $user = $stmt->fetch();

    if (!$user) {
        sendResponse(['error' => 'User not found'], 404);
    }

    $hash = password_hash($password, PASSWORD_BCRYPT);
    if ($hasMustChangePassword) {
        $db->prepare("UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?")->execute([$hash, $payload['id']]);
    } else {
        $db->prepare("UPDATE users SET password_hash = ? WHERE id = ?")->execute([$hash, $payload['id']]);
    }

    sendResponse(['message' => 'Şifreniz başarıyla oluşturuldu']);
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
