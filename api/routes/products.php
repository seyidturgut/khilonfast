<?php
// api/routes/products.php

$db = Database::getInstance();

if ($method === 'GET') {
    if ($action === 'key' && !empty($id)) {
        // Get by key
        $stmt = $db->prepare("SELECT * FROM products WHERE product_key = ?");
        $stmt->execute([$id]);
        $product = $stmt->fetch();

        if (!$product) {
            sendResponse(['error' => 'Product not found'], 404);
        }

        sendResponse(['product' => $product]);
    } elseif (!empty($action)) {
        // Get by ID
        $stmt = $db->prepare("SELECT * FROM products WHERE id = ?");
        $stmt->execute([$action]);
        $product = $stmt->fetch();

        if (!$product) {
            sendResponse(['error' => 'Product not found'], 404);
        }

        sendResponse(['product' => $product]);
    } else {
        // Get all
        $stmt = $db->query("SELECT * FROM products WHERE is_active = TRUE ORDER BY category, id");
        $products = $stmt->fetchAll();
        sendResponse(['products' => $products]);
    }
}

sendResponse(['error' => 'Action not found'], 404);
