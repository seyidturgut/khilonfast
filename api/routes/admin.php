<?php
// api/routes/admin.php

$db = Database::getInstance();
$subAction = $routes[3] ?? '';

// Auth and Admin required
$token = getBearerToken();
$payload = decodeJWT($token);

if (!$payload) {
    sendResponse(['error' => 'Unauthorized'], 401);
}

// Check admin status
$stmt = $db->prepare("SELECT role FROM users WHERE id = ?");
$stmt->execute([$payload['id']]);
$user = $stmt->fetch();

if (!$user || $user['role'] !== 'admin') {
    sendResponse(['error' => 'Admin privileges required'], 403);
}

function normalizeSlugValue($slug)
{
    $value = trim((string)($slug ?? ''));
    if ($value === '') return '';
    $value = preg_replace('#^https?://[^/]+/#i', '', $value);
    $value = preg_replace('#^/+|/+$#', '', $value);
    $value = preg_replace('#/+#', '/', $value);
    return $value;
}

function slugPrefixByCategory($category, $lang)
{
    $cat = strtolower(trim((string)$category));
    if ($cat === 'sektorler' || $cat === 'sectoral' || $cat === 'sector') {
        return $lang === 'en' ? 'sectoral-services' : 'sektorel-hizmetler';
    }
    if ($cat === 'egitimler' || $cat === 'egitim' || $cat === 'training' || $cat === 'trainings') {
        return $lang === 'en' ? 'trainings' : 'egitimler';
    }
    return $lang === 'en' ? 'services' : 'hizmetlerimiz';
}

function frontendSlugMapByKey()
{
    return [
        'service-gtm' => ['tr' => 'hizmetlerimiz/go-to-market-stratejisi', 'en' => 'services/go-to-market-strategy'],
        'service-content-strategy' => ['tr' => 'hizmetlerimiz/icerik-stratejisi', 'en' => 'services/content-strategy'],
        'service-idm' => ['tr' => 'hizmetlerimiz/butunlesik-dijital-pazarlama', 'en' => 'services/integrated-digital-marketing'],
        'service-integrated-marketing' => ['tr' => 'hizmetlerimiz/butunlesik-dijital-pazarlama', 'en' => 'services/integrated-digital-marketing'],
        'service-google-ads' => ['tr' => 'hizmetlerimiz/google-ads', 'en' => 'services/google-ads'],
        'service-social-ads' => ['tr' => 'hizmetlerimiz/sosyal-medya-reklamciligi', 'en' => 'services/social-media-advertising'],
        'service-seo' => ['tr' => 'hizmetlerimiz/seo-yonetimi', 'en' => 'services/seo-management'],
        'service-content-production' => ['tr' => 'hizmetlerimiz/icerik-uretimi', 'en' => 'services/content-production'],
        'service-b2b-email' => ['tr' => 'hizmetlerimiz/b2b-email-pazarlama', 'en' => 'services/b2b-email-marketing'],
        'service-b2b-360' => ['tr' => 'sektorel-hizmetler/b2b-firmalari-icin-360-pazarlama-yonetimi', 'en' => 'sectoral-services/b2b-companies-360-marketing-management'],
        'service-payment-systems' => ['tr' => 'sektorel-hizmetler/odeme-sistemleri-firmalari-icin-360-pazarlama-yonetimi', 'en' => 'sectoral-services/payment-systems-companies-360-marketing-management'],
        'service-industrial-food' => ['tr' => 'sektorel-hizmetler/endustriyel-gida-sef-cozumleri-firmalari-icin-360-pazarlama-yonetimi', 'en' => 'sectoral-services/industrial-food-and-chef-solutions-companies-360-marketing-management'],
        'service-fintech-360' => ['tr' => 'sektorel-hizmetler/fintech-firmalari-icin-360-pazarlama-yonetimi', 'en' => 'sectoral-services/fintech-companies-360-marketing-management'],
        'service-tech-software' => ['tr' => 'sektorel-hizmetler/teknoloji-yazilim-firmalari-icin-360-pazarlama-yonetimi', 'en' => 'sectoral-services/technology-and-software-companies-360-marketing-management'],
        'service-energy' => ['tr' => 'sektorel-hizmetler/enerji-firmalari-icin-360-pazarlama-yonetimi', 'en' => 'sectoral-services/energy-companies-360-marketing-management'],
        'service-interior-design' => ['tr' => 'sektorel-hizmetler/ofis-kurumsal-ic-tasarim-firmalari-icin-360-pazarlama-yonetimi', 'en' => 'sectoral-services/office-and-corporate-interior-design-companies-360-marketing-management'],
        'service-fleet-rental' => ['tr' => 'sektorel-hizmetler/filo-kiralama-firmalari-icin-360-pazarlama-yonetimi', 'en' => 'sectoral-services/fleet-rental-companies-360-marketing-management'],
        'service-manufacturing' => ['tr' => 'sektorel-hizmetler/uretim-firmalari-icin-360-pazarlama-yonetimi', 'en' => 'sectoral-services/manufacturing-companies-360-marketing-management'],
        'service-maestro-ai' => ['tr' => 'urunler/maestro-ai', 'en' => 'products/maestro-ai'],
        'service-eye-tracking' => ['tr' => 'urunler/eye-tracking-reklam-analizi', 'en' => 'products/eye-tracking-ad-analysis'],
    ];
}

function normalizeHeroMediaPath($path)
{
    $value = trim((string)($path ?? ''));
    if ($value === '') return null;
    if (preg_match('#^https?://#i', $value)) return $value;
    $value = '/' . ltrim($value, '/');
    $value = preg_replace('#/+#', '/', $value);
    return $value;
}

function extractVimeoId($input)
{
    $value = trim((string)($input ?? ''));
    if ($value === '') return null;

    if (preg_match('/vimeo\\.com\\/(?:video\\/)?(\\d+)/i', $value, $m)) {
        return $m[1];
    }

    if (preg_match('/(\\d{6,})/', $value, $m)) {
        return $m[1];
    }

    return $value;
}

function resolveProductSlugs($productKey, $category, $slug, $slugEn, $parentId = null, $db = null)
{
    $key = trim((string)$productKey);
    $tr = normalizeSlugValue($slug);
    $en = normalizeSlugValue($slugEn);

    if (str_starts_with($tr, 'en/')) {
        $tr = preg_replace('#^en/#', '', $tr);
    }
    if (str_starts_with($en, 'en/')) {
        $en = preg_replace('#^en/#', '', $en);
    }

    $map = frontendSlugMapByKey();
    if ($key !== '' && isset($map[$key])) {
        return [$map[$key]['tr'], $map[$key]['en']];
    }

    if ($tr === '' && $en !== '') {
        $tr = $en;
    }
    if ($en === '' && $tr !== '') {
        $en = $tr;
    }

    $prefixTr = slugPrefixByCategory($category, 'tr');
    $prefixEn = slugPrefixByCategory($category, 'en');

    // If this is a child package and parent exists, derive slugs from parent paths.
    if (!empty($parentId) && $db) {
        $stmt = $db->prepare("SELECT product_key, slug, slug_en FROM products WHERE id = ? LIMIT 1");
        $stmt->execute([(int)$parentId]);
        $parent = $stmt->fetch();
        if ($parent) {
            $parentTr = normalizeSlugValue($parent['slug'] ?? '');
            $parentEn = normalizeSlugValue($parent['slug_en'] ?? '');
            $parentKey = trim((string)($parent['product_key'] ?? ''));
            if ($parentTr !== '' && $parentEn !== '') {
                $leaf = $key;
                if ($parentKey !== '' && str_starts_with($key, $parentKey . '-')) {
                    $leaf = substr($key, strlen($parentKey) + 1);
                } else {
                    $leaf = basename($leaf);
                }
                $leaf = preg_replace('/[^a-z0-9\\-]+/i', '-', strtolower($leaf));
                $leaf = trim($leaf, '-');
                $leaf = $leaf === '' ? 'package' : $leaf;
                return [$parentTr . '/' . $leaf, $parentEn . '/' . $leaf];
            }
        }
    }

    if ($tr !== '' && !str_starts_with($tr, $prefixTr . '/')) {
        $leaf = basename($tr);
        $tr = $prefixTr . '/' . $leaf;
    }
    if ($en !== '' && !str_starts_with($en, $prefixEn . '/')) {
        $leaf = basename($en);
        $en = $prefixEn . '/' . $leaf;
    }

    return [$tr, $en];
}

// Settings
if ($action === 'settings') {
    if ($method === 'GET') {
        $stmt = $db->query("SELECT * FROM settings");
        $settings = $stmt->fetchAll();
        $settingsMap = [];
        foreach ($settings as $s) {
            $settingsMap[$s['setting_key']] = $s['setting_value'];
        }
        sendResponse($settingsMap);
    } elseif ($method === 'POST') {
        $updates = json_decode(file_get_contents('php://input'), true);
        foreach ($updates as $key => $value) {
            $stmt = $db->prepare("UPDATE settings SET setting_value = ? WHERE setting_key = ?");
            $stmt->execute([$value, $key]);
        }
        sendResponse(['message' => 'Settings updated successfully']);
    }
}

// Dashboard stats
if ($action === 'stats' && $method === 'GET') {
    $stmt = $db->query("SELECT COUNT(*) AS total_users FROM users");
    $usersRow = $stmt->fetch();

    $stmt = $db->query("SELECT COUNT(*) AS total_orders FROM orders");
    $ordersRow = $stmt->fetch();

    $stmt = $db->query("SELECT COALESCE(SUM(total_amount), 0) AS total_revenue FROM orders WHERE status = 'completed'");
    $revenueRow = $stmt->fetch();

    sendResponse([
        'total_users' => (int) ($usersRow['total_users'] ?? 0),
        'total_orders' => (int) ($ordersRow['total_orders'] ?? 0),
        'total_revenue' => (float) ($revenueRow['total_revenue'] ?? 0)
    ]);
}

// Users (Admin)
if ($action === 'users' && $method === 'POST' && empty($id)) {
    $data = getJsonBody();

    $email = strtolower(trim((string)($data['email'] ?? '')));
    $password = (string)($data['password'] ?? '');
    $firstName = trim((string)($data['first_name'] ?? ''));
    $lastName = trim((string)($data['last_name'] ?? ''));
    $phone = trim((string)($data['phone'] ?? ''));
    $role = strtolower(trim((string)($data['role'] ?? 'user')));
    $mustChangePassword = !empty($data['must_change_password']) ? 1 : 0;

    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 6 || $firstName === '' || $lastName === '') {
        sendResponse(['error' => 'Geçerli e-posta, ad, soyad ve en az 6 karakter şifre zorunludur.'], 400);
    }

    if (!in_array($role, ['user', 'admin', 'editor'], true)) {
        $role = 'user';
    }

    $stmt = $db->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        sendResponse(['error' => 'Bu e-posta zaten kayıtlı.'], 400);
    }

    try {
        $passwordHash = password_hash($password, PASSWORD_BCRYPT);
        $stmt = $db->prepare(
            "INSERT INTO users (email, password_hash, first_name, last_name, phone, role, must_change_password)
             VALUES (?, ?, ?, ?, ?, ?, ?)"
        );
        $stmt->execute([
            $email,
            $passwordHash,
            $firstName,
            $lastName,
            ($phone !== '' ? $phone : null),
            $role,
            $mustChangePassword
        ]);

        sendResponse([
            'message' => 'Kullanıcı oluşturuldu.',
            'user' => [
                'id' => (int)$db->lastInsertId(),
                'email' => $email,
                'first_name' => $firstName,
                'last_name' => $lastName,
                'phone' => ($phone !== '' ? $phone : null),
                'role' => $role,
                'must_change_password' => (bool)$mustChangePassword
            ]
        ], 201);
    } catch (Exception $e) {
        sendResponse(['error' => 'Kullanıcı oluşturulamadı: ' . $e->getMessage()], 500);
    }
}

if ($action === 'users' && $method === 'PUT' && !empty($id) && empty($subAction)) {
    $userId = (int)$id;
    if ($userId <= 0) {
        sendResponse(['error' => 'Geçersiz kullanıcı id.'], 400);
    }

    $data = getJsonBody();
    $email = strtolower(trim((string)($data['email'] ?? '')));
    $password = (string)($data['password'] ?? '');
    $firstName = trim((string)($data['first_name'] ?? ''));
    $lastName = trim((string)($data['last_name'] ?? ''));
    $phone = trim((string)($data['phone'] ?? ''));
    $role = strtolower(trim((string)($data['role'] ?? 'user')));
    $mustChangePassword = !empty($data['must_change_password']) ? 1 : 0;

    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $firstName === '' || $lastName === '') {
        sendResponse(['error' => 'Geçerli e-posta, ad ve soyad zorunludur.'], 400);
    }
    if ($password !== '' && strlen($password) < 6) {
        sendResponse(['error' => 'Yeni şifre en az 6 karakter olmalıdır.'], 400);
    }
    if (!in_array($role, ['user', 'admin', 'editor'], true)) {
        $role = 'user';
    }

    $stmt = $db->prepare("SELECT id, role FROM users WHERE id = ? LIMIT 1");
    $stmt->execute([$userId]);
    $existing = $stmt->fetch();
    if (!$existing) {
        sendResponse(['error' => 'Kullanıcı bulunamadı.'], 404);
    }

    $stmt = $db->prepare("SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1");
    $stmt->execute([$email, $userId]);
    if ($stmt->fetch()) {
        sendResponse(['error' => 'Bu e-posta başka bir kullanıcı tarafından kullanılıyor.'], 400);
    }

    // Keep at least one admin in system.
    if (($existing['role'] ?? 'user') === 'admin' && $role !== 'admin') {
        $stmt = $db->query("SELECT COUNT(*) AS c FROM users WHERE role = 'admin'");
        $countRow = $stmt->fetch();
        if ((int)($countRow['c'] ?? 0) <= 1) {
            sendResponse(['error' => 'Sistemde en az bir admin kullanıcı bulunmalıdır.'], 400);
        }
    }

    $fields = [
        'email = ?',
        'first_name = ?',
        'last_name = ?',
        'phone = ?',
        'role = ?',
        'must_change_password = ?'
    ];
    $params = [
        $email,
        $firstName,
        $lastName,
        ($phone !== '' ? $phone : null),
        $role,
        $mustChangePassword
    ];

    if ($password !== '') {
        $fields[] = 'password_hash = ?';
        $params[] = password_hash($password, PASSWORD_BCRYPT);
    }

    $params[] = $userId;
    $sql = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = ?";

    try {
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        sendResponse(['message' => 'Kullanıcı güncellendi.']);
    } catch (Exception $e) {
        sendResponse(['error' => 'Kullanıcı güncellenemedi: ' . $e->getMessage()], 500);
    }
}

if ($action === 'users' && $method === 'DELETE' && !empty($id) && empty($subAction)) {
    $userId = (int)$id;
    if ($userId <= 0) {
        sendResponse(['error' => 'Geçersiz kullanıcı id.'], 400);
    }

    if ($userId === (int)$payload['id']) {
        sendResponse(['error' => 'Kendi admin hesabınızı silemezsiniz.'], 400);
    }

    $stmt = $db->prepare("SELECT id, role FROM users WHERE id = ? LIMIT 1");
    $stmt->execute([$userId]);
    $target = $stmt->fetch();
    if (!$target) {
        sendResponse(['error' => 'Kullanıcı bulunamadı.'], 404);
    }

    if (($target['role'] ?? 'user') === 'admin') {
        $stmt = $db->query("SELECT COUNT(*) AS c FROM users WHERE role = 'admin'");
        $countRow = $stmt->fetch();
        if ((int)($countRow['c'] ?? 0) <= 1) {
            sendResponse(['error' => 'Son admin kullanıcı silinemez.'], 400);
        }
    }

    try {
        $stmt = $db->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        sendResponse(['message' => 'Kullanıcı silindi.']);
    } catch (Exception $e) {
        sendResponse(['error' => 'Kullanıcı silinemedi: ' . $e->getMessage()], 500);
    }
}

if ($action === 'users' && $method === 'GET' && empty($id)) {
    $stmt = $db->query(
        "SELECT
            u.id,
            u.email,
            u.first_name,
            u.last_name,
            u.phone,
            u.role,
            u.must_change_password,
            u.created_at,
            COUNT(DISTINCT o.id) AS total_orders,
            COALESCE(SUM(CASE WHEN o.status = 'completed' THEN o.total_amount ELSE 0 END), 0) AS total_spent,
            MAX(CASE WHEN o.status = 'completed' THEN o.created_at ELSE NULL END) AS last_purchase_at
         FROM users u
         LEFT JOIN orders o ON o.user_id = u.id
         GROUP BY u.id
         ORDER BY u.created_at DESC"
    );
    $users = $stmt->fetchAll();

    $stmt = $db->query(
        "SELECT
            o.user_id,
            p.id AS product_id,
            p.name AS product_name,
            p.product_key,
            MAX(o.created_at) AS purchased_at,
            COUNT(*) AS purchase_count
         FROM orders o
         INNER JOIN order_items oi ON oi.order_id = o.id
         INNER JOIN products p ON p.id = oi.product_id
         WHERE o.status = 'completed'
         GROUP BY o.user_id, p.id, p.name, p.product_key
         ORDER BY purchased_at DESC"
    );
    $purchases = $stmt->fetchAll();

    $purchasesByUser = [];
    foreach ($purchases as $row) {
        $uid = (int) $row['user_id'];
        if (!isset($purchasesByUser[$uid])) {
            $purchasesByUser[$uid] = [];
        }
        $purchasesByUser[$uid][] = [
            'product_id' => (int) $row['product_id'],
            'product_name' => $row['product_name'],
            'product_key' => $row['product_key'],
            'purchased_at' => $row['purchased_at'],
            'purchase_count' => (int) $row['purchase_count']
        ];
    }

    $out = [];
    foreach ($users as $u) {
        $uid = (int) $u['id'];
        $u['id'] = $uid;
        $u['total_orders'] = (int) ($u['total_orders'] ?? 0);
        $u['total_spent'] = (float) ($u['total_spent'] ?? 0);
        $u['purchased_products'] = $purchasesByUser[$uid] ?? [];
        $out[] = $u;
    }

    sendResponse($out);
}

// User order details (Admin): /api/admin/users/{id}/orders
if ($action === 'users' && $method === 'GET' && !empty($id) && $subAction === 'orders') {
    $userId = (int) $id;
    if ($userId <= 0) {
        sendResponse(['error' => 'Invalid user id'], 400);
    }

    $stmt = $db->prepare(
        "SELECT
            o.id,
            o.order_number,
            o.total_amount,
            o.currency,
            o.status,
            o.created_at
         FROM orders o
         WHERE o.user_id = ?
         ORDER BY o.created_at DESC"
    );
    $stmt->execute([$userId]);
    $orders = $stmt->fetchAll();

    $stmt = $db->prepare(
        "SELECT
            oi.order_id,
            oi.quantity,
            oi.unit_price,
            oi.total_price,
            p.id AS product_id,
            p.name AS product_name,
            p.product_key
         FROM order_items oi
         INNER JOIN products p ON p.id = oi.product_id
         INNER JOIN orders o ON o.id = oi.order_id
         WHERE o.user_id = ?
         ORDER BY oi.id ASC"
    );
    $stmt->execute([$userId]);
    $items = $stmt->fetchAll();

    $itemsByOrder = [];
    foreach ($items as $item) {
        $oid = (int) $item['order_id'];
        if (!isset($itemsByOrder[$oid])) {
            $itemsByOrder[$oid] = [];
        }
        $item['order_id'] = $oid;
        $item['quantity'] = (int) $item['quantity'];
        $item['unit_price'] = (float) $item['unit_price'];
        $item['total_price'] = (float) $item['total_price'];
        $item['product_id'] = (int) $item['product_id'];
        $itemsByOrder[$oid][] = $item;
    }

    $out = [];
    foreach ($orders as $order) {
        $oid = (int) $order['id'];
        $order['id'] = $oid;
        $order['total_amount'] = (float) ($order['total_amount'] ?? 0);
        $order['items'] = $itemsByOrder[$oid] ?? [];
        $out[] = $order;
    }

    sendResponse($out);
}

// CMS Pages (Admin)
if ($action === 'pages') {
    if ($method === 'GET' && empty($id)) {
        $stmt = $db->query("SELECT * FROM cms_pages ORDER BY updated_at DESC");
        sendResponse($stmt->fetchAll());
    } elseif ($method === 'GET' && !empty($id) && empty($subAction)) {
        $stmt = $db->prepare("SELECT * FROM cms_pages WHERE id = ? LIMIT 1");
        $stmt->execute([(int)$id]);
        $page = $stmt->fetch();
        if (!$page) sendResponse(['error' => 'Page not found'], 404);
        sendResponse($page);
    } elseif ($method === 'POST' && empty($id)) {
        try {
            $data = getJsonBody();
            $title = trim((string)($data['title'] ?? ''));
            $slug = normalizeSlugValue($data['slug'] ?? '');
            $metaTitle = trim((string)($data['meta_title'] ?? ''));
            $metaDescription = trim((string)($data['meta_description'] ?? ''));

            if ($title === '' || $slug === '') {
                sendResponse(['error' => 'title ve slug zorunludur.'], 400);
            }

            $stmt = $db->prepare("INSERT INTO cms_pages (title, slug, meta_title, meta_description, is_active) VALUES (?, ?, ?, ?, 1)");
            $stmt->execute([$title, $slug, $metaTitle, $metaDescription]);
            sendResponse(['id' => (int)$db->lastInsertId(), 'message' => 'Page created'], 201);
        } catch (Exception $e) {
            sendResponse(['error' => 'Sayfa oluşturulamadı: ' . $e->getMessage()], 500);
        }
    } elseif ($method === 'PUT' && !empty($id) && empty($subAction)) {
        try {
            $data = getJsonBody();
            $title = trim((string)($data['title'] ?? ''));
            $slug = normalizeSlugValue($data['slug'] ?? '');
            $metaTitle = trim((string)($data['meta_title'] ?? ''));
            $metaDescription = trim((string)($data['meta_description'] ?? ''));
            $isActive = isset($data['is_active']) ? (int)!!$data['is_active'] : 1;

            if ($title === '' || $slug === '') {
                sendResponse(['error' => 'title ve slug zorunludur.'], 400);
            }

            $stmt = $db->prepare("UPDATE cms_pages SET title = ?, slug = ?, meta_title = ?, meta_description = ?, is_active = ? WHERE id = ?");
            $stmt->execute([$title, $slug, $metaTitle, $metaDescription, $isActive, (int)$id]);
            sendResponse(['message' => 'Page updated']);
        } catch (Exception $e) {
            sendResponse(['error' => 'Sayfa güncellenemedi: ' . $e->getMessage()], 500);
        }
    } elseif ($method === 'GET' && !empty($id) && $subAction === 'content') {
        $stmt = $db->prepare("SELECT content_json, is_published FROM cms_page_contents WHERE page_id = ? ORDER BY id DESC LIMIT 1");
        $stmt->execute([(int)$id]);
        $row = $stmt->fetch();
        if (!$row) sendResponse(['content_json' => null, 'is_published' => false]);
        sendResponse($row);
    } elseif ($method === 'PUT' && !empty($id) && $subAction === 'content') {
        try {
            $data = getJsonBody();
            $contentJson = $data['content_json'] ?? [];
            $isPublished = isset($data['is_published']) ? (int)!!$data['is_published'] : 1;

            $stmt = $db->prepare("DELETE FROM cms_page_contents WHERE page_id = ?");
            $stmt->execute([(int)$id]);

            $stmt = $db->prepare("INSERT INTO cms_page_contents (page_id, content_json, is_published) VALUES (?, ?, ?)");
            $stmt->execute([(int)$id, json_encode($contentJson, JSON_UNESCAPED_UNICODE), $isPublished]);

            sendResponse(['message' => 'Content updated']);
        } catch (Exception $e) {
            sendResponse(['error' => 'İçerik güncellenemedi: ' . $e->getMessage()], 500);
        }
    }
}

// CMS Media (Admin)
if ($action === 'media' && $method === 'POST' && $id === 'upload-base64') {
    try {
        $data = getJsonBody();
        $dataUrl = (string)($data['dataUrl'] ?? '');
        $filename = (string)($data['filename'] ?? 'cms-image');
        if ($dataUrl === '') {
            sendResponse(['error' => 'Missing dataUrl'], 400);
        }

        if (!preg_match('/^data:(image\\/[a-zA-Z0-9.+-]+);base64,(.+)$/', $dataUrl, $m)) {
            sendResponse(['error' => 'Invalid image data'], 400);
        }

        $mime = strtolower($m[1]);
        $base64 = $m[2];
        $extMap = [
            'image/jpeg' => 'jpg',
            'image/jpg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            'image/gif' => 'gif',
            'image/avif' => 'avif'
        ];
        $ext = $extMap[$mime] ?? null;
        if (!$ext) sendResponse(['error' => 'Unsupported image type'], 400);

        $safeBase = preg_replace('/[^a-z0-9\\-_]+/i', '-', strtolower($filename));
        $safeBase = trim((string)$safeBase, '-');
        if ($safeBase === '') $safeBase = 'cms-image';
        $safeBase = substr($safeBase, 0, 60);
        $finalName = $safeBase . '-' . time() . '.' . $ext;

        $uploadDir = __DIR__ . '/../../uploads/cms';
        if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true)) {
            sendResponse(['error' => 'Upload directory create failed'], 500);
        }

        $binary = base64_decode($base64, true);
        if ($binary === false) {
            sendResponse(['error' => 'Invalid base64 payload'], 400);
        }

        $targetPath = rtrim($uploadDir, '/') . '/' . $finalName;
        if (file_put_contents($targetPath, $binary) === false) {
            sendResponse(['error' => 'File write failed'], 500);
        }

        sendResponse(['path' => '/uploads/cms/' . $finalName]);
    } catch (Exception $e) {
        sendResponse(['error' => 'Upload failed: ' . $e->getMessage()], 500);
    }
}

// Products (Admin)
if ($action === 'products') {
    if ($method === 'POST' && $id === 'upload-hero-image') {
        try {
            if (!isset($_FILES['file']) || !is_uploaded_file($_FILES['file']['tmp_name'])) {
                sendResponse(['error' => 'Yüklenecek dosya bulunamadı.'], 400);
            }

            $tmpPath = $_FILES['file']['tmp_name'];
            $mimeType = mime_content_type($tmpPath) ?: '';
            $validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
            if (!in_array($mimeType, $validMimes, true)) {
                sendResponse(['error' => 'Sadece JPEG, PNG, WEBP veya AVIF görseller yüklenebilir.'], 400);
            }

            $imageType = @exif_imagetype($tmpPath);
            $image = null;
            if ($imageType === IMAGETYPE_JPEG) $image = @imagecreatefromjpeg($tmpPath);
            elseif ($imageType === IMAGETYPE_PNG) $image = @imagecreatefrompng($tmpPath);
            elseif ($imageType === IMAGETYPE_WEBP && function_exists('imagecreatefromwebp')) $image = @imagecreatefromwebp($tmpPath);
            elseif (defined('IMAGETYPE_AVIF') && $imageType === IMAGETYPE_AVIF && function_exists('imagecreatefromavif')) $image = @imagecreatefromavif($tmpPath);

            if (!$image) {
                sendResponse(['error' => 'Görsel işlenemedi. Sunucuda ilgili format desteği yok olabilir.'], 400);
            }

            $productKey = preg_replace('/[^a-z0-9\\-]/i', '-', (string)($_POST['product_key'] ?? 'product'));
            $locale = ($_POST['locale'] ?? 'tr') === 'en' ? 'en' : 'tr';
            $uploadRelDir = '/uploads/products';
            $uploadDir = realpath(__DIR__ . '/../../public') . $uploadRelDir;
            if (!$uploadDir) {
                $uploadDir = __DIR__ . '/../../public' . $uploadRelDir;
            }
            if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true)) {
                sendResponse(['error' => 'Yükleme klasörü oluşturulamadı.'], 500);
            }

            $filename = sprintf('%s-%s-%s.webp', $productKey ?: 'product', $locale, date('YmdHis'));
            $targetPath = rtrim($uploadDir, '/') . '/' . $filename;

            if (!imagewebp($image, $targetPath, 82)) {
                imagedestroy($image);
                sendResponse(['error' => 'WEBP dönüştürme sırasında hata oluştu.'], 500);
            }
            imagedestroy($image);

            $publicPath = $uploadRelDir . '/' . $filename;
            sendResponse(['path' => $publicPath, 'message' => 'Görsel başarıyla yüklendi.']);
        } catch (Exception $e) {
            sendResponse(['error' => 'Görsel yükleme hatası: ' . $e->getMessage()], 500);
        }
    } elseif ($method === 'POST' && $id === 'normalize-slugs') {
        try {
            $stmt = $db->query("SELECT id, product_key, category, slug, slug_en FROM products ORDER BY id ASC");
            $products = $stmt->fetchAll();
            $updated = 0;

            $updateStmt = $db->prepare("UPDATE products SET slug = ?, slug_en = ? WHERE id = ?");
            foreach ($products as $p) {
                [$slugTr, $slugEn] = resolveProductSlugs(
                    $p['product_key'] ?? '',
                    $p['category'] ?? '',
                    $p['slug'] ?? '',
                    $p['slug_en'] ?? ''
                );
                if ($slugTr !== ($p['slug'] ?? '') || $slugEn !== ($p['slug_en'] ?? '')) {
                    $updateStmt->execute([$slugTr, $slugEn, (int)$p['id']]);
                    $updated++;
                }
            }

            sendResponse(['message' => 'Slug senkronizasyonu tamamlandı.', 'updated' => $updated]);
        } catch (Exception $e) {
            sendResponse(['error' => 'Slug senkronizasyon hatası: ' . $e->getMessage()], 500);
        }
    } elseif ($method === 'GET') {
        $stmt = $db->query("SELECT * FROM products ORDER BY created_at DESC");
        sendResponse($stmt->fetchAll());
    } elseif ($method === 'POST') {
        try {
            $data = getJsonBody();
            if (empty($data)) {
                sendResponse(['error' => 'Geçersiz veya boş istek verisi.'], 400);
            }

            $productKey = trim((string)($data['product_key'] ?? ''));
            $name = trim((string)($data['name'] ?? ''));
            $description = (string)($data['description'] ?? '');
            $currency = strtoupper(trim((string)($data['currency'] ?? 'TRY')));
            $category = trim((string)($data['category'] ?? 'hizmetler'));
            $type = trim((string)($data['type'] ?? 'service'));
            if ($productKey === '' || $name === '') {
                sendResponse(['error' => 'Ürün key ve ürün adı zorunludur.'], 400);
            }
            $accessContentUrl = $data['access_content_url'] ?? $data['accessContentUrl'] ?? $data['content_url'] ?? null;
            $features = $data['features'] ?? null;
            $isActive = isset($data['is_active']) ? (int) !!$data['is_active'] : 1;
            $parentId = (!empty($data['parent_id']) && $data['parent_id'] !== '') ? (int) $data['parent_id'] : null;
            $price = !empty($data['price']) ? (float) $data['price'] : 0.0;
            $durationDays = (!empty($data['duration_days']) && $data['duration_days'] !== '') ? (int) $data['duration_days'] : null;
            $heroVimeoId = extractVimeoId($data['hero_vimeo_id'] ?? null);
            $heroVimeoIdEn = extractVimeoId($data['hero_vimeo_id_en'] ?? null);
            $heroImage = normalizeHeroMediaPath($data['hero_image'] ?? null);
            $heroImageEn = normalizeHeroMediaPath($data['hero_image_en'] ?? null);
            [$slugTr, $slugEn] = resolveProductSlugs(
                $productKey,
                $category,
                $data['slug'] ?? '',
                $data['slug_en'] ?? '',
                $parentId,
                $db
            );

            $stmt = $db->prepare("INSERT INTO products (product_key, slug, slug_en, name, name_en, description, description_en, features, features_en, price, currency, category, is_active, type, duration_days, access_content_url, parent_id, meta_title, meta_title_en, meta_description, meta_description_en, hero_vimeo_id, hero_vimeo_id_en, hero_image, hero_image_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $productKey,
                $slugTr ?: null,
                $slugEn ?: null,
                $name,
                $data['name_en'] ?? null,
                $description,
                $data['description_en'] ?? null,
                $features,
                $data['features_en'] ?? null,
                $price,
                $currency,
                $category,
                $isActive,
                $type,
                $durationDays,
                $accessContentUrl,
                $parentId,
                $data['meta_title'] ?? null,
                $data['meta_title_en'] ?? null,
                $data['meta_description'] ?? null,
                $data['meta_description_en'] ?? null,
                $heroVimeoId,
                $heroVimeoIdEn,
                $heroImage,
                $heroImageEn
            ]);
            sendResponse(['id' => $db->lastInsertId(), 'message' => 'Product created']);
        } catch (Exception $e) {
            sendResponse(['error' => 'Ürün oluşturulamadı: ' . $e->getMessage()], 500);
        }
    } elseif ($method === 'PUT' && !empty($id)) {
        try {
            $data = getJsonBody();
            if (empty($data)) {
                sendResponse(['error' => 'Geçersiz veya boş istek verisi.'], 400);
            }

            $productKey = trim((string)($data['product_key'] ?? ''));
            $name = trim((string)($data['name'] ?? ''));
            $description = (string)($data['description'] ?? '');
            $currency = strtoupper(trim((string)($data['currency'] ?? 'TRY')));
            $category = trim((string)($data['category'] ?? 'hizmetler'));
            $type = trim((string)($data['type'] ?? 'service'));
            if ($name === '') {
                sendResponse(['error' => 'Ürün adı zorunludur.'], 400);
            }

            if ($productKey === '') {
                $kStmt = $db->prepare("SELECT product_key FROM products WHERE id = ? LIMIT 1");
                $kStmt->execute([(int)$id]);
                $existing = $kStmt->fetch();
                $productKey = trim((string)($existing['product_key'] ?? ''));
            }
            $accessContentUrl = $data['access_content_url'] ?? $data['accessContentUrl'] ?? $data['content_url'] ?? null;
            $features = $data['features'] ?? null;
            $isActive = isset($data['is_active']) ? (int) !!$data['is_active'] : 1;
            $parentId = (!empty($data['parent_id']) && $data['parent_id'] !== '') ? (int) $data['parent_id'] : null;
            $price = !empty($data['price']) ? (float) $data['price'] : 0.0;
            $durationDays = (!empty($data['duration_days']) && $data['duration_days'] !== '') ? (int) $data['duration_days'] : null;
            $heroVimeoId = extractVimeoId($data['hero_vimeo_id'] ?? null);
            $heroVimeoIdEn = extractVimeoId($data['hero_vimeo_id_en'] ?? null);
            $heroImage = normalizeHeroMediaPath($data['hero_image'] ?? null);
            $heroImageEn = normalizeHeroMediaPath($data['hero_image_en'] ?? null);
            [$slugTr, $slugEn] = resolveProductSlugs(
                $productKey,
                $category,
                $data['slug'] ?? '',
                $data['slug_en'] ?? '',
                $parentId,
                $db
            );

            $stmt = $db->prepare("UPDATE products SET name=?, name_en=?, description=?, description_en=?, features=?, features_en=?, price=?, currency=?, category=?, is_active=?, type=?, duration_days=?, access_content_url=?, parent_id=?, slug=?, slug_en=?, meta_title=?, meta_title_en=?, meta_description=?, meta_description_en=?, hero_vimeo_id=?, hero_vimeo_id_en=?, hero_image=?, hero_image_en=? WHERE id=?");
            $stmt->execute([
                $name,
                $data['name_en'] ?? null,
                $description,
                $data['description_en'] ?? null,
                $features,
                $data['features_en'] ?? null,
                $price,
                $currency,
                $category,
                $isActive,
                $type,
                $durationDays,
                $accessContentUrl,
                $parentId,
                $slugTr ?: null,
                $slugEn ?: null,
                $data['meta_title'] ?? null,
                $data['meta_title_en'] ?? null,
                $data['meta_description'] ?? null,
                $data['meta_description_en'] ?? null,
                $heroVimeoId,
                $heroVimeoIdEn,
                $heroImage,
                $heroImageEn,
                $id
            ]);
            sendResponse(['message' => 'Product updated']);
        } catch (Exception $e) {
            sendResponse(['error' => 'Ürün güncellenemedi: ' . $e->getMessage()], 500);
        }
    }
}

// Translation (DeepL Proxy)
if ($action === 'translate' && $method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $text = $data['text'] ?? '';
    $targetLang = $data['target_lang'] ?? 'EN';

    if (empty($text)) {
        sendResponse(['error' => 'Text is required'], 400);
    }

    // Fetch DeepL Settings from Database
    $stmt = $db->prepare("SELECT setting_value FROM settings WHERE setting_key = 'deepl_api_key'");
    $stmt->execute();
    $apiKeyRow = $stmt->fetch();
    $apiKey = $apiKeyRow ? $apiKeyRow['setting_value'] : '';

    $stmt = $db->prepare("SELECT setting_value FROM settings WHERE setting_key = 'deepl_plan_type'");
    $stmt->execute();
    $planTypeRow = $stmt->fetch();
    $planType = $planTypeRow ? $planTypeRow['setting_value'] : 'free';

    if (!$apiKey) {
        sendResponse(['error' => 'DeepL API key not configured in settings'], 400);
    }

    $apiUrl = ($planType === 'pro') ? 'https://api.deepl.com/v2/translate' : 'https://api-free.deepl.com/v2/translate';

    $url = "https://api-free.deepl.com/v2/translate";
    $fields = [
        'auth_key' => $apiKey,
        'text' => [$text],
        'target_lang' => $targetLang
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($fields));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200) {
        $result = json_decode($response, true);
        sendResponse(['translation' => $result['translations'][0]['text']]);
    } else {
        sendResponse(['error' => 'DeepL API Error', 'details' => json_decode($response, true)], $httpCode);
    }
}

sendResponse(['error' => 'Action not found'], 404);
