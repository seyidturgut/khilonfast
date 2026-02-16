<?php
// api/routes/payment.php
require_once __DIR__ . '/../services/LidioService.php';

$db = Database::getInstance();
$lidio = new LidioService();

// Auth required
$token = getBearerToken();
$payload = decodeJWT($token);

if (!$payload) {
    sendResponse(['error' => 'Unauthorized'], 401);
}

if ($action === 'initiate' && $method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (empty($data['orderId']) || empty($data['cardNumber'])) {
        sendResponse(['error' => 'Required fields missing'], 400);
    }

    // Get order
    $stmt = $db->prepare("SELECT * FROM orders WHERE id = ? AND user_id = ?");
    $stmt->execute([$data['orderId'], $payload['id']]);
    $order = $stmt->fetch();

    if (!$order) {
        sendResponse(['error' => 'Order not found'], 404);
    }

    // Process payment
    $result = $lidio->processPayment([
        'orderId' => $order['id'],
        'amount' => $order['amount'],
        'cardNumber' => $data['cardNumber'],
        'cardHolderName' => $data['cardHolderName'],
        'cardExpireMonth' => $data['cardExpireMonth'],
        'cardExpireYear' => $data['cardExpireYear'],
        'cardCvv' => $data['cardCvv']
    ]);

    if ($result['success']) {
        $stmt = $db->prepare("UPDATE orders SET payment_status = 'paid', status = 'processing', transaction_id = ? WHERE id = ?");
        $stmt->execute([$result['transactionId'], $order['id']]);
    }

    sendResponse($result);
}

if ($action === 'status' && !empty($id) && $method === 'GET') {
    $stmt = $db->prepare("SELECT payment_status, status, transaction_id FROM orders WHERE id = ? AND user_id = ?");
    $stmt->execute([$id, $payload['id']]);
    $status = $stmt->fetch();

    if (!$status) {
        sendResponse(['error' => 'Order not found'], 404);
    }

    sendResponse($status);
}

sendResponse(['error' => 'Action not found'], 404);
