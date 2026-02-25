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
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
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
    case 'profile':
        require_once __DIR__ . '/routes/profile.php';
        break;
    case 'company':
        require_once __DIR__ . '/routes/company.php';
        break;
    case 'admin':
        require_once __DIR__ . '/routes/admin.php';
        break;
    case 'health':
        sendResponse(['status' => 'ok', 'message' => 'khilonfast PHP API is running']);
        break;
    default:
        sendResponse(['error' => 'API Endpoint not found: ' . $path], 404);
        break;
}
