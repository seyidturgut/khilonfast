<?php
// api/utils.php

function sendResponse($data, $statusCode = 200)
{
    header('Content-Type: application/json');
    http_response_code($statusCode);
    echo json_encode($data);
    exit;
}

function getBearerToken()
{
    $headers = getallheaders();
    if (isset($headers['Authorization'])) {
        if (preg_match('/Bearer\s(\S+)/', $headers['Authorization'], $matches)) {
            return $matches[1];
        }
    }
    return null;
}

// Simple JWT encode/decode for demo purposes (In production use a library like firebase/php-jwt)
function decodeJWT($token)
{
    try {
        $parts = explode('.', $token);
        if (count($parts) != 3)
            return null;

        $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[1])), true);

        // Verify signature (Simplified for this use case)
        $header = $parts[0];
        $body = $parts[1];
        $signature = $parts[2];

        $validSignature = hash_hmac('sha256', "$header.$body", JWT_SECRET, true);
        $validSignatureEncoded = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($validSignature));

        if ($signature !== $validSignatureEncoded)
            return null;

        // Check expiry
        if (isset($payload['exp']) && $payload['exp'] < time())
            return null;

        return $payload;
    } catch (Exception $e) {
        return null;
    }
}

function encodeJWT($payload)
{
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));

    $payload['iat'] = time();
    if (!isset($payload['exp'])) {
        $payload['exp'] = time() + JWT_EXPIRY;
    }

    $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode(json_encode($payload)));

    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, JWT_SECRET, true);
    $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

    return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
}
