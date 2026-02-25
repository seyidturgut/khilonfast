<?php
// api/utils.php

function sendResponse($data, $statusCode = 200)
{
    header('Content-Type: application/json');
    http_response_code($statusCode);
    echo json_encode($data);
    exit;
}

function getJsonBody()
{
    $raw = file_get_contents('php://input');
    if (!$raw) return [];
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function getBearerToken()
{
    $headers = getallheaders();
    if (!is_array($headers)) return null;
    $auth = $headers['Authorization'] ?? $headers['authorization'] ?? null;
    if (!$auth) return null;

    if (preg_match('/Bearer\s+(\S+)/i', $auth, $matches)) {
        return $matches[1];
    }
    return null;
}

function decodeJWT($token)
{
    try {
        if (!$token) return null;
        $parts = explode('.', $token);
        if (count($parts) !== 3) return null;

        $payloadJson = base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[1]));
        $payload = json_decode($payloadJson, true);
        if (!is_array($payload)) return null;

        $signed = $parts[0] . '.' . $parts[1];
        $validSignature = hash_hmac('sha256', $signed, JWT_SECRET, true);
        $validSignatureEncoded = rtrim(strtr(base64_encode($validSignature), '+/', '-_'), '=');

        if (!hash_equals($validSignatureEncoded, $parts[2])) {
            return null;
        }

        if (isset($payload['exp']) && (int)$payload['exp'] < time()) {
            return null;
        }

        return $payload;
    } catch (Throwable $e) {
        return null;
    }
}

function encodeJWT($payload)
{
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $base64UrlHeader = rtrim(strtr(base64_encode($header), '+/', '-_'), '=');

    $payload['iat'] = time();
    if (!isset($payload['exp'])) {
        $payload['exp'] = time() + JWT_EXPIRY;
    }
    $base64UrlPayload = rtrim(strtr(base64_encode(json_encode($payload)), '+/', '-_'), '=');

    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, JWT_SECRET, true);
    $base64UrlSignature = rtrim(strtr(base64_encode($signature), '+/', '-_'), '=');

    return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
}

function requireAuth()
{
    $token = getBearerToken();
    $payload = decodeJWT($token);
    if (!$payload) {
        sendResponse(['error' => 'Unauthorized'], 401);
    }
    return $payload;
}

function optionalAuth()
{
    $token = getBearerToken();
    return decodeJWT($token);
}

function getSetting(PDO $db, $key, $default = null)
{
    $stmt = $db->prepare("SELECT setting_value FROM settings WHERE setting_key = ? LIMIT 1");
    $stmt->execute([$key]);
    $row = $stmt->fetch();
    return $row ? $row['setting_value'] : $default;
}

function parseBool($value, $default = false)
{
    if ($value === null || $value === '') return $default;
    if (is_bool($value)) return $value;
    $normalized = strtolower(trim((string)$value));
    return in_array($normalized, ['1', 'true', 'yes', 'on'], true);
}

function ensureMustChangePasswordColumn(PDO $db)
{
    static $checked = false;
    if ($checked) return;

    $stmt = $db->query("SHOW COLUMNS FROM users LIKE 'must_change_password'");
    $column = $stmt->fetch();
    if (!$column) {
        $db->exec("ALTER TABLE users ADD COLUMN must_change_password TINYINT(1) NOT NULL DEFAULT 0 AFTER role");
    }
    $checked = true;
}

function generateTemporaryPassword($length = 12)
{
    $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    $bytes = random_bytes($length);
    $out = '';
    for ($i = 0; $i < $length; $i++) {
        $out .= $chars[ord($bytes[$i]) % strlen($chars)];
    }
    return $out;
}

function sendSmtpEmail($host, $port, $username, $password, $from, $to, $subject, $html)
{
    $timeout = 20;
    $transport = ((int)$port === 465 ? "ssl://" : "") . $host . ":" . (int)$port;
    $fp = @stream_socket_client($transport, $errno, $errstr, $timeout, STREAM_CLIENT_CONNECT);
    if (!$fp) {
        throw new Exception("SMTP connection failed: $errstr ($errno)");
    }

    stream_set_timeout($fp, $timeout);

    $read = function () use ($fp) {
        $data = '';
        while ($line = fgets($fp, 515)) {
            $data .= $line;
            if (strlen($line) >= 4 && $line[3] === ' ') break;
        }
        return $data;
    };

    $write = function ($cmd) use ($fp, $read) {
        fwrite($fp, $cmd . "\r\n");
        return $read();
    };

    $greeting = $read();
    if (strpos($greeting, '220') !== 0) {
        throw new Exception("SMTP greeting failed: $greeting");
    }

    $hostName = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $resp = $write("EHLO $hostName");
    if (strpos($resp, '250') !== 0) {
        $resp = $write("HELO $hostName");
        if (strpos($resp, '250') !== 0) {
            throw new Exception("SMTP HELO/EHLO failed: $resp");
        }
    }

    if ($username !== '' || $password !== '') {
        $resp = $write("AUTH LOGIN");
        if (strpos($resp, '334') !== 0) {
            throw new Exception("SMTP AUTH LOGIN failed: $resp");
        }

        $resp = $write(base64_encode($username));
        if (strpos($resp, '334') !== 0) {
            throw new Exception("SMTP username rejected: $resp");
        }

        $resp = $write(base64_encode($password));
        if (strpos($resp, '235') !== 0) {
            throw new Exception("SMTP password rejected: $resp");
        }
    }

    $resp = $write("MAIL FROM:<$from>");
    if (strpos($resp, '250') !== 0) {
        throw new Exception("SMTP MAIL FROM failed: $resp");
    }

    $resp = $write("RCPT TO:<$to>");
    if (strpos($resp, '250') !== 0 && strpos($resp, '251') !== 0) {
        throw new Exception("SMTP RCPT TO failed: $resp");
    }

    $resp = $write("DATA");
    if (strpos($resp, '354') !== 0) {
        throw new Exception("SMTP DATA failed: $resp");
    }

    $boundary = md5((string)microtime(true));
    $headers = [];
    $headers[] = "From: <$from>";
    $headers[] = "To: <$to>";
    $headers[] = "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=";
    $headers[] = "MIME-Version: 1.0";
    $headers[] = "Content-Type: multipart/alternative; boundary=\"$boundary\"";

    $body = "--$boundary\r\n";
    $body .= "Content-Type: text/plain; charset=UTF-8\r\n\r\n";
    $body .= "Lutfen HTML destekli bir istemci kullanin.\r\n";
    $body .= "--$boundary\r\n";
    $body .= "Content-Type: text/html; charset=UTF-8\r\n";
    $body .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
    $body .= $html . "\r\n";
    $body .= "--$boundary--\r\n";

    $message = implode("\r\n", $headers) . "\r\n\r\n" . $body . "\r\n.";
    fwrite($fp, $message . "\r\n");
    $resp = $read();
    if (strpos($resp, '250') !== 0) {
        throw new Exception("SMTP message send failed: $resp");
    }

    $write("QUIT");
    fclose($fp);
}
