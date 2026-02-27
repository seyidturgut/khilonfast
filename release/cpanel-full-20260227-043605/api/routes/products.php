<?php
// api/routes/products.php

$db = Database::getInstance();

if ($method === 'GET') {
    $lang = $_GET['lang'] ?? 'tr';

    if ($action === 'key' && !empty($id)) {
        // Get by key or slug/slug_en
        $stmt = $db->prepare("SELECT * FROM products WHERE product_key = ? OR slug = ? OR slug_en = ?");
        $stmt->execute([$id, $id, $id]);
        $product = $stmt->fetch();

        if (!$product) {
            sendResponse(['error' => 'Product not found'], 404);
        }

        // Fetch children packages if this is a parent
        $stmt = $db->prepare("SELECT * FROM products WHERE parent_id = ? AND is_active = TRUE ORDER BY price ASC");
        $stmt->execute([$product['id']]);
        $packages = $stmt->fetchAll();

        // Handle Localization
        if ($lang === 'en') {
            $product['name'] = !empty($product['name_en']) ? $product['name_en'] : $product['name'];
            $product['description'] = !empty($product['description_en']) ? $product['description_en'] : $product['description'];
            $product['features'] = !empty($product['features_en']) ? $product['features_en'] : $product['features'];
            $product['slug'] = !empty($product['slug_en']) ? $product['slug_en'] : $product['slug'];
            $product['meta_title'] = !empty($product['meta_title_en']) ? $product['meta_title_en'] : $product['meta_title'];
            $product['meta_description'] = !empty($product['meta_description_en']) ? $product['meta_description_en'] : $product['meta_description'];
            $product['hero_vimeo_id'] = !empty($product['hero_vimeo_id_en']) ? $product['hero_vimeo_id_en'] : $product['hero_vimeo_id'];
            $product['hero_image'] = !empty($product['hero_image_en']) ? $product['hero_image_en'] : $product['hero_image'];

            foreach ($packages as &$pkg) {
                $pkg['name'] = !empty($pkg['name_en']) ? $pkg['name_en'] : $pkg['name'];
                $pkg['description'] = !empty($pkg['description_en']) ? $pkg['description_en'] : $pkg['description'];
                $pkg['features'] = !empty($pkg['features_en']) ? $pkg['features_en'] : $pkg['features'];
            }
        }
        $product['packages'] = $packages;

        sendResponse(['product' => $product]);
    } elseif (!empty($action)) {
        // Get by ID
        $stmt = $db->prepare("SELECT * FROM products WHERE id = ?");
        $stmt->execute([$action]);
        $product = $stmt->fetch();

        if (!$product) {
            sendResponse(['error' => 'Product not found'], 404);
        }

        if ($lang === 'en') {
            $product['name'] = !empty($product['name_en']) ? $product['name_en'] : $product['name'];
            $product['description'] = !empty($product['description_en']) ? $product['description_en'] : $product['description'];
            $product['features'] = !empty($product['features_en']) ? $product['features_en'] : $product['features'];
        }

        sendResponse(['product' => $product]);
    } else {
        // Get all
        $stmt = $db->query("SELECT * FROM products WHERE is_active = TRUE ORDER BY category, id");
        $products = $stmt->fetchAll();

        if ($lang === 'en') {
            foreach ($products as &$p) {
                $p['name'] = !empty($p['name_en']) ? $p['name_en'] : $p['name'];
                $p['description'] = !empty($p['description_en']) ? $p['description_en'] : $p['description'];
            }
        }

        sendResponse(['products' => $products]);
    }
}

sendResponse(['error' => 'Action not found'], 404);
