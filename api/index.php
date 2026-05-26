<?php
// api/index.php
// API response'una warning/notice sızmasın — JSON parse bozulmasın diye.
// Hatalar log'a (cpanel error_log veya php_errors.log) düşmeye devam eder.
ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL & ~E_DEPRECATED & ~E_USER_DEPRECATED);

// Global fatal/exception → JSON 500 (blank 500 page yerine debug edilebilir response)
set_exception_handler(function ($e) {
    if (!headers_sent()) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
    }
    error_log('[api fatal exception] ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
    echo json_encode([
        'error' => 'Sunucu hatası',
        'detail' => $e->getMessage(),
        'file' => basename($e->getFile()),
        'line' => $e->getLine(),
    ]);
    exit;
});
register_shutdown_function(function () {
    $err = error_get_last();
    if ($err && in_array($err['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR, E_USER_ERROR], true)) {
        if (!headers_sent()) {
            http_response_code(500);
            header('Content-Type: application/json; charset=utf-8');
        }
        error_log('[api fatal shutdown] ' . $err['message'] . ' @ ' . $err['file'] . ':' . $err['line']);
        echo json_encode([
            'error' => 'Sunucu hatası',
            'detail' => $err['message'],
            'file' => basename($err['file']),
            'line' => $err['line'],
        ]);
    }
});

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
    case 'onboarding-form':
        require_once __DIR__ . '/routes/onboarding.php';
        break;
    case 'eye-tracking':
        require_once __DIR__ . '/routes/eyeTracking.php';
        break;
    case 'consultant-cron':
        // CRON: danışmanlık randevu hatırlatma — X-Cron-Key auth
        require_once __DIR__ . '/routes/consultant-reminder-cron.php';
        break;
    case 'invoice-cron':
        // CRON: Paraşüt fatura kuyruğunu işler — X-Cron-Key auth
        require_once __DIR__ . '/routes/invoice-cron.php';
        break;
    case 'contact-submit':
        // İletişim formu submit — public, admin'e mail
        require_once __DIR__ . '/routes/contact-submit.php';
        break;
    case 'manual-bank-accounts':
        // PUBLIC — checkout için aktif manuel havale hesaplarını listeler
        require_once __DIR__ . '/routes/manual-bank-accounts.php';
        break;
    case 'manual-transfer':
        // CRON: hatırlatma + iptal — sadece /api/manual-transfer/cron POST
        if ($action === 'cron') {
            require_once __DIR__ . '/routes/manual-transfer-cron.php';
        }
        sendResponse(['error' => 'API Endpoint not found: ' . $path], 404);
        break;
    case 'automation':
        // CRON: bekleyen execution step'lerini ilerlet — /api/automation/cron POST
        if ($action === 'cron') {
            require_once __DIR__ . '/routes/automation-cron.php';
        }
        // Test simülatörü: /api/automation/scenarios GET, /api/automation/run POST
        if ($action === 'scenarios' || $action === 'run') {
            require_once __DIR__ . '/routes/automation-test.php';
        }
        sendResponse(['error' => 'API Endpoint not found: ' . $path], 404);
        break;
    case 'consent':
        // Form onay logu — /api/consent/log POST
        require_once __DIR__ . '/routes/consent.php';
        break;
    case 'crm':
        // CRM modülü — /api/crm/cron cron-key auth, diğerleri admin auth
        if ($action === 'cron') {
            require_once __DIR__ . '/routes/crm-cron.php';
        } else {
            require_once __DIR__ . '/routes/crm.php';
        }
        break;
    case 'crm-public':
        // CRM public endpoints — Brevo webhook, tracking pixel, opt-in
        require_once __DIR__ . '/routes/crm-public.php';
        break;
    case 'l':
        // Smart link redirect — /api/l/:slug → /api/crm-public/l/:slug aynı handler
        // (Hosting'de /l/:slug için ayrıca .htaccess rewrite gerekir; şimdilik /api/l/:slug ile çalışır)
        $action = 'l';
        $id = $routes[1] ?? '';
        require_once __DIR__ . '/routes/crm-public.php';
        break;
    case 'exchange-rate':
        // Public — sepet USD ürünleri TL'ye anında çevirebilsin diye
        require_once __DIR__ . '/services/CurrencyService.php';
        $db = Database::getInstance();
        $info = getCurrentUsdTryRate($db);
        sendResponse([
            'rate' => (float)$info['rate'],
            'source' => $info['source'],
            'updated_at' => $info['updatedAt']
        ]);
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
