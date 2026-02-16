<?php
// api/routes/orders.php

$db = Database::getInstance();

// Auth required for most order operations
$token = getBearerToken();
$payload = decodeJWT($token);

if (!$payload) {
    sendResponse(['error' => 'Unauthorized'], 401);
}

if ($method === 'POST' && empty($action)) {
    // Create order
    $data = json_decode(file_get_contents('php://input'), true);

    if (empty($data['product_id']) || empty($data['amount'])) {
        sendResponse(['error' => 'Required fields missing'], 400);
    }

    $stmt = $db->prepare("INSERT INTO orders (user_id, product_id, amount, status, payment_status) VALUES (?, ?, ?, 'pending', 'pending')");
    $stmt->execute([
        $payload['id'],
        $data['product_id'],
        $data['amount']
    ]);

    $orderId = $db->lastInsertId();

    sendResponse([
        'message' => 'Order created successfully',
        'order_id' => $orderId
    ], 21);
}

if ($method === 'GET') {
    if ($action === 'user') {
        // Get user orders
        $stmt = $db->prepare("SELECT o.*, p.name as product_name FROM orders o JOIN products p ON o.product_id = p.id WHERE o.user_id = ? ORDER BY o.created_at DESC");
        $stmt->execute([$payload['id']]);
        $orders = $stmt->fetchAll();
        sendResponse(['orders' => $orders]);
    } elseif (!empty($action)) {
        // Get order by ID
        $stmt = $db->prepare("SELECT o.*, p.name as product_name FROM orders o JOIN products p ON o.product_id = p.id WHERE o.id = ? AND o.user_id = ?");
        $stmt->execute([$action, $payload['id']]);
        $order = $stmt->fetch();

        if (!$order) {
            sendResponse(['error' => 'Order not found'], 404);
        }

        sendResponse(['order' => $order]);
    }
}

sendResponse(['error' => 'Action not found'], 404);
