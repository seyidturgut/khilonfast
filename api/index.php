<?php
// api/index.php
require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/utils.php';

// Simple Router
$requestUri = $_SERVER['REQUEST_URI'];
$basePath = '/api';
$path = str_replace($basePath, '', $requestUri);
$path = explode('?', $path)[0];
$path = trim($path, '/');

$method = $_SERVER['REQUEST_METHOD'];

// Add CORS headers
header("Access-Control-Allow-Origin: " . ALLOWED_ORIGIN);
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($method === 'OPTIONS') {
    exit;
}

// Route mapping
$routes = explode('/', $path);
$controller = $routes[0] ?? '';
$action = $routes[1] ?? '';
$id = $routes[2] ?? '';

switch ($controller) {
    case 'auth':
        require_once __DIR__ . '/routes/auth.php';
        break;
    case 'products':
        require_once __DIR__ . '/routes/products.php';
        break;
    case 'orders':
        require_once __DIR__ . '/routes/orders.php';
        break;
    case 'payment':
        require_once __DIR__ . '/routes/payment.php';
        break;
    case 'coupons':
        require_once __DIR__ . '/routes/coupons.php';
        break;
    case 'profile':
        require_once __DIR__ . '/routes/profile.php';
        break;
    case 'company':
        require_once __DIR__ . '/routes/company.php';
        break;
    case 'pages':
        require_once __DIR__ . '/routes/pages.php';
        break;
    case 'admin':
        require_once __DIR__ . '/routes/admin.php';
        break;
    case 'consultants':
        require_once __DIR__ . '/routes/consultants.php';
        break;
    case 'training-analytics':
        require_once __DIR__ . '/routes/training-analytics.php';
        break;
    case 'subscription-renewal':
        require_once __DIR__ . '/routes/subscription-renewal.php';
        break;
    case 'email-automation':
        require_once __DIR__ . '/routes/email-automation.php';
        break;
    case 'health':
        $health = [
            'status' => 'ok',
            'message' => 'khilonfast PHP API is running',
            'php_version' => PHP_VERSION,
            'time' => date('c')
        ];
        // DB bağlantısını test et — kritik tabloların satır sayılarını dön
        try {
            $db = Database::getInstance();
            $checks = [];
            foreach (['users','products','orders','coupons','settings','bank_accounts','cms_pages'] as $table) {
                try {
                    $stmt = $db->query("SELECT COUNT(*) AS c FROM `$table`");
                    $row = $stmt->fetch();
                    $checks[$table] = (int)($row['c'] ?? 0);
                } catch (Throwable $tableErr) {
                    $checks[$table] = 'MISSING: ' . $tableErr->getMessage();
                }
            }
            // Lidio konfigürasyonu (sadece varlık kontrolü, key'leri dökmüyoruz)
            try {
                $stmt = $db->query("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('lidio_test_mode','lidio_api_url','lidio_merchant_code','lidio_merchant_key','lidio_api_password')");
                $lidioCfg = ['test_mode' => null, 'api_url' => null, 'has_merchant_code' => false, 'has_merchant_key' => false, 'has_api_password' => false];
                while ($row = $stmt->fetch()) {
                    if ($row['setting_key'] === 'lidio_test_mode') $lidioCfg['test_mode'] = $row['setting_value'];
                    if ($row['setting_key'] === 'lidio_api_url') $lidioCfg['api_url'] = $row['setting_value'];
                    if ($row['setting_key'] === 'lidio_merchant_code') $lidioCfg['has_merchant_code'] = !empty(trim((string)$row['setting_value']));
                    if ($row['setting_key'] === 'lidio_merchant_key') $lidioCfg['has_merchant_key'] = !empty(trim((string)$row['setting_value']));
                    if ($row['setting_key'] === 'lidio_api_password') $lidioCfg['has_api_password'] = !empty(trim((string)$row['setting_value']));
                }
                $health['lidio'] = $lidioCfg;
            } catch (Throwable $lidioErr) {
                $health['lidio'] = 'check_failed: ' . $lidioErr->getMessage();
            }
            $health['db'] = ['connected' => true, 'tables' => $checks];
        } catch (Throwable $e) {
            $health['db'] = ['connected' => false, 'error' => $e->getMessage()];
            $health['status'] = 'db_error';
        }
        sendResponse($health);
        break;
    default:
        sendResponse(['error' => 'API Endpoint not found: ' . $path], 404);
        break;
}
