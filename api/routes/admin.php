<?php
// api/routes/admin.php
set_exception_handler(function (Throwable $e) {
    header('Content-Type: application/json', true, 500);
    echo json_encode(['error' => 'PHP Exception: ' . $e->getMessage(), 'file' => basename($e->getFile()), 'line' => $e->getLine()]);
    exit;
});

require_once __DIR__ . '/../services/CouponService.php';
require_once __DIR__ . '/../services/CrmSchema.php';
// decodeScopeItemsSafe() utils.php'de global tanımlı (index.php require eder).

$db = Database::getInstance();
try { ensureCouponSchema($db); } catch (Throwable $e) { error_log('[admin] ensureCouponSchema: ' . $e->getMessage()); }
try { ensureTrainingAccessPagesSchema($db); } catch (Throwable $e) { error_log('[admin] ensureTrainingAccessPagesSchema: ' . $e->getMessage()); }
try { ensureAutomationBuilderSchema($db); } catch (Throwable $e) { error_log('[admin] ensureAutomationBuilderSchema: ' . $e->getMessage()); }
try { ensureCrmContactsSchema($db); } catch (Throwable $e) { error_log('[admin] ensureCrmContactsSchema: ' . $e->getMessage()); }
// V2 otomasyon akışları + e-posta şablonları — sadece eksikse INSERT eder, mevcut kayıtlara dokunmaz.
try {
    require_once __DIR__ . '/../migrations/seed_automation_v2.php';
    seedAutomationV2($db);
} catch (Throwable $e) { error_log('[admin] seedAutomationV2: ' . $e->getMessage()); }
// Eski 16 template'i v2 tasarımıyla yeniden sar — idempotent (gradient marker varsa atlar).
try {
    require_once __DIR__ . '/../migrations/redesign_legacy_templates.php';
    redesignLegacyTemplates($db);
} catch (Throwable $e) { error_log('[admin] redesignLegacyTemplates: ' . $e->getMessage()); }
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

    if (strpos($tr, 'en/') === 0) {
        $tr = preg_replace('#^en/#', '', $tr);
    }
    if (strpos($en, 'en/') === 0) {
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
                if ($parentKey !== '' && strpos($key, $parentKey . '-') === 0) {
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

    if ($tr !== '' && strpos($tr, $prefixTr . '/') !== 0) {
        $leaf = basename($tr);
        $tr = $prefixTr . '/' . $leaf;
    }
    if ($en !== '' && strpos($en, $prefixEn . '/') !== 0) {
        $leaf = basename($en);
        $en = $prefixEn . '/' . $leaf;
    }

    return [$tr, $en];
}

function couponPayloadFromRequest($data)
{
    $discountType = trim((string)($data['discount_type'] ?? 'percentage'));
    if (!in_array($discountType, ['percentage', 'fixed'], true)) {
        $discountType = 'percentage';
    }

    $discountValue = (float)($data['discount_value'] ?? 0);
    $minimumCartAmount = (float)($data['minimum_cart_amount'] ?? 0);
    $maximumDiscountAmount = $data['maximum_discount_amount'] ?? null;
    $startsAt = couponNormalizeDateValue($data['starts_at'] ?? null);
    $endsAt = couponNormalizeDateValue($data['ends_at'] ?? null);
    $restrictedProducts = array_values(array_unique(array_map('intval', $data['restricted_products'] ?? [])));
    $restrictedCategories = array_values(array_unique(array_map(
        function ($value) { return strtolower(trim((string)$value)); },
        $data['restricted_categories'] ?? []
    )));

    $payload = [
        'name' => trim((string)($data['name'] ?? '')),
        'code' => couponNormalizeCode($data['code'] ?? ''),
        'description' => trim((string)($data['description'] ?? '')),
        'discount_type' => $discountType,
        'discount_value' => round(max(0, $discountValue), 2),
        'minimum_cart_amount' => round(max(0, $minimumCartAmount), 2),
        'maximum_discount_amount' => ($maximumDiscountAmount !== null && $maximumDiscountAmount !== '')
            ? round(max(0, (float)$maximumDiscountAmount), 2)
            : null,
        'starts_at' => $startsAt,
        'ends_at' => $endsAt,
        'is_active' => !empty($data['is_active']) ? 1 : 0,
        'total_usage_limit' => ($data['total_usage_limit'] ?? '') !== '' ? max(0, (int)$data['total_usage_limit']) : null,
        'per_user_limit' => ($data['per_user_limit'] ?? '') !== '' ? max(0, (int)$data['per_user_limit']) : null,
        'restricted_products_json' => json_encode($restrictedProducts, JSON_UNESCAPED_UNICODE),
        'restricted_categories_json' => json_encode($restrictedCategories, JSON_UNESCAPED_UNICODE),
        'new_customers_only' => !empty($data['new_customers_only']) ? 1 : 0,
        'is_stackable' => !empty($data['is_stackable']) ? 1 : 0,
    ];

    if ($payload['name'] === '' || $payload['code'] === '') {
        sendResponse(['error' => 'Kupon adı ve kupon kodu zorunludur.'], 400);
    }
    if ($payload['discount_type'] === 'percentage' && ($payload['discount_value'] <= 0 || $payload['discount_value'] > 100)) {
        sendResponse(['error' => 'Yüzde indirim değeri 0 ile 100 arasında olmalıdır.'], 400);
    }
    if ($payload['discount_type'] === 'fixed' && $payload['discount_value'] <= 0) {
        sendResponse(['error' => 'Sabit indirim tutarı sıfırdan büyük olmalıdır.'], 400);
    }
    if ($payload['starts_at'] && $payload['ends_at'] && strtotime($payload['starts_at']) > strtotime($payload['ends_at'])) {
        sendResponse(['error' => 'Başlangıç tarihi bitiş tarihinden sonra olamaz.'], 400);
    }

    if ($payload['discount_type'] === 'fixed') {
        $payload['maximum_discount_amount'] = null;
    }

    return $payload;
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
        // PHP PDO TINYINT'i string olarak döndürebiliyor; frontend `Boolean('0')` === true
        // bu yüzden TÜM kullanıcılar "Belirlenmedi" görünüyordu. Explicit bool cast.
        $u['must_change_password'] = (bool) ($u['must_change_password'] ?? false);
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
    } elseif ($id === 'slug' && !empty($subAction) && ($routes[4] ?? '') === 'content') {
        // /api/admin/pages/slug/{urlencoded-slug}/content — slug-based access (auto-creates page)
        $slug = normalizeSlugValue(urldecode($subAction));
        if ($slug === '') sendResponse(['error' => 'slug zorunludur.'], 400);

        $stmt = $db->prepare("SELECT id FROM cms_pages WHERE slug = ? LIMIT 1");
        $stmt->execute([$slug]);
        $page = $stmt->fetch();
        $pageId = $page ? (int)$page['id'] : 0;

        if ($method === 'GET') {
            if (!$pageId) sendResponse(['content_json' => null, 'is_published' => false]);
            $stmt = $db->prepare("SELECT content_json, is_published FROM cms_page_contents WHERE page_id = ? ORDER BY id DESC LIMIT 1");
            $stmt->execute([$pageId]);
            $row = $stmt->fetch();
            if (!$row) sendResponse(['content_json' => null, 'is_published' => false]);
            sendResponse($row);
        } elseif ($method === 'PUT') {
            try {
                $data = getJsonBody();
                $contentJson = $data['content_json'] ?? [];
                $isPublished = isset($data['is_published']) ? (int)!!$data['is_published'] : 1;

                if (!$pageId) {
                    $stmt = $db->prepare("INSERT INTO cms_pages (title, slug, meta_title, meta_description, is_active) VALUES (?, ?, '', '', 1)");
                    $stmt->execute([$slug, $slug]);
                    $pageId = (int)$db->lastInsertId();
                }

                $stmt = $db->prepare("DELETE FROM cms_page_contents WHERE page_id = ?");
                $stmt->execute([$pageId]);

                $stmt = $db->prepare("INSERT INTO cms_page_contents (page_id, content_json, is_published) VALUES (?, ?, ?)");
                $stmt->execute([$pageId, json_encode($contentJson, JSON_UNESCAPED_UNICODE), $isPublished]);

                sendResponse(['message' => 'Content updated', 'page_id' => $pageId]);
            } catch (Exception $e) {
                sendResponse(['error' => 'İçerik güncellenemedi: ' . $e->getMessage()], 500);
            }
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

// PDF Upload (Admin) — multipart/form-data, $_FILES['file']
if ($action === 'media' && $method === 'POST' && $id === 'upload-pdf') {
    try {
        if (!isset($_FILES['file']) || !is_uploaded_file($_FILES['file']['tmp_name'])) {
            sendResponse(['error' => 'Yüklenecek PDF bulunamadı.'], 400);
        }

        $file = $_FILES['file'];
        $mime = strtolower(mime_content_type($file['tmp_name']) ?: '');
        $origName = basename((string)($file['name'] ?? 'upload.pdf'));
        $ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));

        if ($mime !== 'application/pdf' && $ext !== 'pdf') {
            sendResponse(['error' => 'Yalnızca PDF dosyaları yüklenebilir.'], 400);
        }
        if ($file['size'] > 50 * 1024 * 1024) { // 50 MB limit
            sendResponse(['error' => 'Dosya boyutu 50 MB sınırını aşıyor.'], 400);
        }

        $uploadDir = __DIR__ . '/../../uploads/training-pdfs';
        if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true)) {
            sendResponse(['error' => 'Upload dizini oluşturulamadı.'], 500);
        }

        $safeBase = preg_replace('/[^a-z0-9_\\-]+/i', '_', strtolower(pathinfo($origName, PATHINFO_FILENAME)));
        $safeBase = trim((string)$safeBase, '_');
        if ($safeBase === '') $safeBase = 'training-pdf';
        $safeBase = substr($safeBase, 0, 80);
        $finalName = $safeBase . '-' . time() . '.pdf';
        $targetPath = rtrim($uploadDir, '/') . '/' . $finalName;

        if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
            sendResponse(['error' => 'Dosya kaydedilemedi.'], 500);
        }

        sendResponse(['path' => '/uploads/training-pdfs/' . $finalName]);
    } catch (Throwable $e) {
        sendResponse(['error' => 'PDF yükleme hatası: ' . $e->getMessage()], 500);
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

if ($action === 'coupons') {
    if ($method === 'GET' && empty($id)) {
        $search = trim((string)($_GET['search'] ?? ''));
        $statusFilter = trim((string)($_GET['status'] ?? 'all'));
        $query = "SELECT * FROM coupons WHERE 1=1";
        $params = [];

        if ($search !== '') {
            $query .= " AND (name LIKE ? OR code LIKE ?)";
            $params[] = '%' . $search . '%';
            $params[] = '%' . $search . '%';
        }
        if ($statusFilter === 'active') {
            $query .= " AND is_active = 1";
        } elseif ($statusFilter === 'inactive') {
            $query .= " AND is_active = 0";
        }

        $query .= " ORDER BY created_at DESC";
        $stmt = $db->prepare($query);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();
        $out = array_map('couponHydrateRow', $rows);
        sendResponse($out);
    }

    if ($method === 'GET' && !empty($id)) {
        $stmt = $db->prepare("SELECT * FROM coupons WHERE id = ? LIMIT 1");
        $stmt->execute([(int)$id]);
        $coupon = $stmt->fetch();
        if (!$coupon) {
            sendResponse(['error' => 'Kupon bulunamadı.'], 404);
        }
        sendResponse(couponHydrateRow($coupon));
    }

    if ($method === 'POST' && empty($id)) {
        $payloadData = couponPayloadFromRequest(getJsonBody());

        $stmt = $db->prepare("SELECT id FROM coupons WHERE code = ? LIMIT 1");
        $stmt->execute([$payloadData['code']]);
        if ($stmt->fetch()) {
            sendResponse(['error' => 'Bu kupon kodu zaten kullanılıyor.'], 400);
        }

        $stmt = $db->prepare(
            "INSERT INTO coupons (
                name, code, description, discount_type, discount_value, minimum_cart_amount, maximum_discount_amount,
                starts_at, ends_at, is_active, total_usage_limit, per_user_limit, restricted_products_json,
                restricted_categories_json, new_customers_only, is_stackable
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        );
        $stmt->execute([
            $payloadData['name'],
            $payloadData['code'],
            $payloadData['description'] !== '' ? $payloadData['description'] : null,
            $payloadData['discount_type'],
            $payloadData['discount_value'],
            $payloadData['minimum_cart_amount'],
            $payloadData['maximum_discount_amount'],
            $payloadData['starts_at'],
            $payloadData['ends_at'],
            $payloadData['is_active'],
            $payloadData['total_usage_limit'],
            $payloadData['per_user_limit'],
            $payloadData['restricted_products_json'],
            $payloadData['restricted_categories_json'],
            $payloadData['new_customers_only'],
            $payloadData['is_stackable']
        ]);

        sendResponse(['id' => (int)$db->lastInsertId(), 'message' => 'Kupon oluşturuldu.'], 201);
    }

    if ($method === 'PUT' && !empty($id)) {
        $couponId = (int)$id;
        $payloadData = couponPayloadFromRequest(getJsonBody());

        $stmt = $db->prepare("SELECT id FROM coupons WHERE code = ? AND id <> ? LIMIT 1");
        $stmt->execute([$payloadData['code'], $couponId]);
        if ($stmt->fetch()) {
            sendResponse(['error' => 'Bu kupon kodu zaten kullanılıyor.'], 400);
        }

        $stmt = $db->prepare(
            "UPDATE coupons SET
                name = ?, code = ?, description = ?, discount_type = ?, discount_value = ?, minimum_cart_amount = ?,
                maximum_discount_amount = ?, starts_at = ?, ends_at = ?, is_active = ?, total_usage_limit = ?,
                per_user_limit = ?, restricted_products_json = ?, restricted_categories_json = ?, new_customers_only = ?,
                is_stackable = ?
             WHERE id = ?"
        );
        $stmt->execute([
            $payloadData['name'],
            $payloadData['code'],
            $payloadData['description'] !== '' ? $payloadData['description'] : null,
            $payloadData['discount_type'],
            $payloadData['discount_value'],
            $payloadData['minimum_cart_amount'],
            $payloadData['maximum_discount_amount'],
            $payloadData['starts_at'],
            $payloadData['ends_at'],
            $payloadData['is_active'],
            $payloadData['total_usage_limit'],
            $payloadData['per_user_limit'],
            $payloadData['restricted_products_json'],
            $payloadData['restricted_categories_json'],
            $payloadData['new_customers_only'],
            $payloadData['is_stackable'],
            $couponId
        ]);

        sendResponse(['message' => 'Kupon güncellendi.']);
    }

    if ($method === 'PATCH' && !empty($id) && $subAction === 'toggle') {
        $couponId = (int)$id;
        $data = getJsonBody();
        $isActive = !empty($data['is_active']) ? 1 : 0;
        $stmt = $db->prepare("UPDATE coupons SET is_active = ? WHERE id = ?");
        $stmt->execute([$isActive, $couponId]);
        sendResponse(['message' => 'Kupon durumu güncellendi.']);
    }

    if ($method === 'DELETE' && !empty($id)) {
        $couponId = (int)$id;
        $stmt = $db->prepare("SELECT COUNT(*) AS c FROM coupon_usages WHERE coupon_id = ?");
        $stmt->execute([$couponId]);
        $usageCount = (int)($stmt->fetch()['c'] ?? 0);
        if ($usageCount > 0) {
            sendResponse(['error' => 'Kullanılmış kuponlar silinemez. Pasife alabilirsiniz.'], 400);
        }

        $stmt = $db->prepare("DELETE FROM coupons WHERE id = ?");
        $stmt->execute([$couponId]);
        sendResponse(['message' => 'Kupon silindi.']);
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

// --- Bookings ---
if ($action === 'bookings') {
    if ($method === 'GET' && empty($id)) {
        $status = $_GET['status'] ?? null;
        $consultant_id = $_GET['consultant_id'] ?? null;
        $query = "SELECT cb.*, c.name as consultant_name, cs.title as service_title
                  FROM consultant_bookings cb
                  JOIN consultants c ON cb.consultant_id = c.id
                  JOIN consultant_services cs ON cb.service_id = cs.id
                  WHERE 1=1";
        $params = [];
        if ($status) { $query .= " AND cb.status = ?"; $params[] = $status; }
        if ($consultant_id) { $query .= " AND cb.consultant_id = ?"; $params[] = $consultant_id; }
        $query .= " ORDER BY cb.created_at DESC";
        $stmt = $db->prepare($query);
        $stmt->execute($params);
        sendResponse(['bookings' => $stmt->fetchAll()]);
    }

    if (($method === 'PATCH' || $method === 'PUT') && !empty($id)) {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $fields = []; $params = [];
        if (array_key_exists('status', $data))       { $fields[] = 'status = ?';       $params[] = $data['status']; }
        if (array_key_exists('meeting_link', $data))  { $fields[] = 'meeting_link = ?'; $params[] = $data['meeting_link']; }
        if (array_key_exists('admin_notes', $data))   { $fields[] = 'admin_notes = ?';  $params[] = $data['admin_notes']; }
        if (!$fields) sendResponse(['error' => 'Nothing to update'], 400);
        $params[] = $id;
        $stmt = $db->prepare("UPDATE consultant_bookings SET " . implode(', ', $fields) . " WHERE id = ?");
        $stmt->execute($params);
        sendResponse(['success' => true]);
    }

    if ($method === 'DELETE' && !empty($id)) {
        $stmt = $db->prepare("DELETE FROM consultant_bookings WHERE id = ?");
        $stmt->execute([$id]);
        if ($stmt->rowCount() === 0) sendResponse(['error' => 'Booking not found'], 404);
        sendResponse(['success' => true]);
    }
}

// --- Consultant Leads (Fractional CMO başvuruları) ---
if ($action === 'consultant-leads') {
    if ($method === 'GET' && empty($id)) {
        $status = $_GET['status'] ?? null;
        $consultant_id = $_GET['consultant_id'] ?? null;
        try {
            $query = "SELECT cl.*, c.name AS consultant_name, cs.title AS service_title
                      FROM consultant_leads cl
                      LEFT JOIN consultants c ON cl.consultant_id = c.id
                      LEFT JOIN consultant_services cs ON cl.service_id = cs.id
                      WHERE 1=1";
            $params = [];
            if ($status) { $query .= " AND cl.status = ?"; $params[] = $status; }
            if ($consultant_id) { $query .= " AND cl.consultant_id = ?"; $params[] = $consultant_id; }
            $query .= " ORDER BY cl.created_at DESC";
            $stmt = $db->prepare($query);
            $stmt->execute($params);
            sendResponse(['leads' => $stmt->fetchAll()]);
        } catch (Throwable $e) {
            // consultant_leads tablosu yoksa boş liste
            sendResponse(['leads' => []]);
        }
    }
    if (($method === 'PATCH' || $method === 'PUT') && !empty($id)) {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $allowed = ['new', 'contacted', 'converted', 'closed'];
        if (!isset($data['status']) || !in_array($data['status'], $allowed, true)) {
            sendResponse(['error' => 'Geçersiz durum'], 400);
        }
        $stmt = $db->prepare("UPDATE consultant_leads SET status = ? WHERE id = ?");
        $stmt->execute([$data['status'], $id]);
        sendResponse(['success' => true]);
    }
    if ($method === 'DELETE' && !empty($id)) {
        $stmt = $db->prepare("DELETE FROM consultant_leads WHERE id = ?");
        $stmt->execute([$id]);
        if ($stmt->rowCount() === 0) sendResponse(['error' => 'Lead not found'], 404);
        sendResponse(['success' => true]);
    }
}

// --- Consultants (admin) ---
if ($action === 'consultants') {
    if ($method === 'GET' && empty($id)) {
        $stmt = $db->query("SELECT * FROM consultants ORDER BY id");
        $rows = $stmt->fetchAll();
        foreach ($rows as &$r) $r['sectors'] = json_decode($r['sectors'] ?? '[]', true);
        sendResponse(['consultants' => $rows]);
    }
    if ($method === 'GET' && !empty($id) && empty($subAction)) {
        $stmt = $db->prepare("SELECT * FROM consultants WHERE id = ?");
        $stmt->execute([$id]);
        $c = $stmt->fetch();
        if (!$c) sendResponse(['error' => 'Not found'], 404);
        $c['sectors'] = json_decode($c['sectors'] ?? '[]', true);
        $stmt2 = $db->prepare("SELECT * FROM consultant_services WHERE consultant_id = ? ORDER BY sort_order");
        $stmt2->execute([$id]);
        $c['services'] = $stmt2->fetchAll();
        sendResponse(['consultant' => $c]);
    }
    if ($method === 'POST' && empty($id)) {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $email = isset($data['email']) ? trim($data['email']) : null;
        try {
            $stmt = $db->prepare("INSERT INTO consultants (slug,name,email,title,title_en,bio,bio_en,photo_url,stars,review_count,sectors,is_active) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)");
            $stmt->execute([$data['slug'],$data['name'],$email ?: null,$data['title'],$data['title_en']??null,$data['bio']??'',$data['bio_en']??null,$data['photo_url']??'',$data['stars']??5,$data['review_count']??0,json_encode($data['sectors']??[]),$data['is_active']??1]);
        } catch (PDOException $e) {
            // email kolonu henüz eklenmemişse temel alanlarla ekle
            $stmt = $db->prepare("INSERT INTO consultants (slug,name,title,title_en,bio,bio_en,photo_url,stars,review_count,sectors,is_active) VALUES (?,?,?,?,?,?,?,?,?,?,?)");
            $stmt->execute([$data['slug'],$data['name'],$data['title'],$data['title_en']??null,$data['bio']??'',$data['bio_en']??null,$data['photo_url']??'',$data['stars']??5,$data['review_count']??0,json_encode($data['sectors']??[]),$data['is_active']??1]);
        }
        sendResponse(['success'=>true,'id'=>$db->lastInsertId()],201);
    }
    if ($method === 'PUT' && !empty($id)) {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $ical_url = isset($data['ical_url']) ? trim($data['ical_url']) : null;
        $ical_sync_enabled = isset($data['ical_sync_enabled']) ? (int)$data['ical_sync_enabled'] : 0;
        $email = isset($data['email']) ? trim($data['email']) : null;
        // iCal/email kolonları varsa dahil et, yoksa graceful fallback
        try {
            $stmt = $db->prepare("UPDATE consultants SET slug=?,name=?,email=?,title=?,title_en=?,bio=?,bio_en=?,photo_url=?,stars=?,review_count=?,sectors=?,is_active=?,ical_url=?,ical_sync_enabled=? WHERE id=?");
            $stmt->execute([$data['slug'],$data['name'],$email ?: null,$data['title'],$data['title_en']??null,$data['bio']??'',$data['bio_en']??null,$data['photo_url']??'',$data['stars']??5,$data['review_count']??0,json_encode($data['sectors']??[]),$data['is_active']??1,$ical_url ?: null,$ical_sync_enabled,$id]);
        } catch (PDOException $e) {
            // iCal/i18n kolonları henüz eklenmemişse temel alanlarla güncelle
            $stmt = $db->prepare("UPDATE consultants SET slug=?,name=?,title=?,bio=?,photo_url=?,stars=?,review_count=?,sectors=?,is_active=? WHERE id=?");
            $stmt->execute([$data['slug'],$data['name'],$data['title'],$data['bio']??'',$data['photo_url']??'',$data['stars']??5,$data['review_count']??0,json_encode($data['sectors']??[]),$data['is_active']??1,$id]);
        }
        sendResponse(['success'=>true]);
    }
    if ($method === 'DELETE' && !empty($id) && empty($subAction)) {
        // Güvenlik: aktif/onaylı (iptal edilmemiş) rezervasyonu olan danışman SİLİNEMEZ.
        // Ödenmiş/planlı randevu kaydı kaybolmasın — admin önce pasife alıp randevuları kapatmalı.
        try {
            $chk = $db->prepare("SELECT COUNT(*) FROM consultant_bookings WHERE consultant_id=? AND status NOT IN ('cancelled','canceled')");
            $chk->execute([$id]);
            $activeBookings = (int)$chk->fetchColumn();
        } catch (Throwable $e) {
            $activeBookings = 0; // tablo yoksa engelleme
        }
        if ($activeBookings > 0) {
            sendResponse([
                'success' => false,
                'error'   => "Bu danışmanın {$activeBookings} aktif rezervasyonu var. Önce randevuları iptal edin veya danışmanı pasife alın."
            ], 409);
        }
        // İlişkili kayıtları temizle, sonra danışmanı sil (idempotent — tablo yoksa sessiz geç).
        foreach ([
            "DELETE FROM consultant_services WHERE consultant_id=?",
            "DELETE FROM consultant_availability WHERE consultant_id=?",
            "DELETE FROM consultant_ical_busy WHERE consultant_id=?",
            "DELETE FROM consultant_bookings WHERE consultant_id=?",
        ] as $sql) {
            try { $db->prepare($sql)->execute([$id]); } catch (Throwable $e) { /* tablo yok — atla */ }
        }
        $db->prepare("DELETE FROM consultants WHERE id=?")->execute([$id]);
        sendResponse(['success'=>true]);
    }
    if ($method === 'PATCH' && !empty($id) && empty($subAction)) {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $stmt = $db->prepare("UPDATE consultants SET is_active=? WHERE id=?");
        $stmt->execute([$data['is_active'],$id]);
        sendResponse(['success'=>true]);
    }

    // GET /api/admin/consultants/:id/availability
    if ($method === 'GET' && !empty($id) && $subAction === 'availability') {
        $stmt = $db->prepare("SELECT * FROM consultant_availability WHERE consultant_id=? ORDER BY available_date, start_time");
        $stmt->execute([$id]);
        sendResponse(['slots' => $stmt->fetchAll()]);
    }

    // POST /api/admin/consultants/:id/availability
    if ($method === 'POST' && !empty($id) && $subAction === 'availability') {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $slots = $data['slots'] ?? [];
        if (empty($slots)) sendResponse(['error' => 'slots boş'], 400);
        $stmt = $db->prepare("INSERT INTO consultant_availability (consultant_id, service_id, available_date, start_time, end_time) VALUES (?,?,?,?,?)");
        $inserted = 0;
        foreach ($slots as $s) {
            // ÖNEMLİ: Aralığı OLDUĞU GİBİ tek satır sakla (1 saate BÖLME).
            // generateSlotsForService() müsaitliği servis süresine göre dinamik dilimler:
            //   - 1 saatlik (slot/60) → 10-11,11-12,...   - 3 saatlik (slot/180) → 10-13,11-14,...
            //   - tam gün (fixed_day 10-16) → aralık 10-16'yı kapsadığı için tek blok.
            // Eskiden 1'er saate bölünüyordu; bu 3 saatlik ve tam gün servisleri 0 slota düşürüyordu.
            $start = strtotime((string)($s['start_time'] ?? ''));
            $end   = strtotime((string)($s['end_time'] ?? ''));
            if ($start === false || $end === false || $end <= $start) continue; // geçersiz aralık → atla
            $stmt->execute([$id, $s['service_id'] ?? null, $s['available_date'], $s['start_time'], $s['end_time']]);
            $inserted++;
        }
        sendResponse(['success' => true, 'count' => $inserted]);
    }
}

// GET /api/admin/consultants/:id/services
if ($action === 'consultants' && $method === 'GET' && !empty($id) && $subAction === 'services') {
    $stmt = $db->prepare("SELECT * FROM consultant_services WHERE consultant_id=? ORDER BY sort_order ASC");
    $stmt->execute([$id]);
    $services = $stmt->fetchAll();
    // scope_items'ı her zaman array olarak döndür (double-encode'a dayanıklı).
    // Aksi halde admin panel ScopeEditor'da "n.map is not a function" hatası oluşur.
    foreach ($services as &$svc) {
        $svc['scope_items']    = decodeScopeItemsSafe($svc['scope_items'] ?? null);
        $svc['scope_items_en'] = decodeScopeItemsSafe($svc['scope_items_en'] ?? null);
    }
    unset($svc);
    sendResponse(['services' => $services]);
}

// POST /api/admin/consultants/:id/services
if ($action === 'consultants' && $method === 'POST' && !empty($id) && $subAction === 'services') {
    $d = json_decode(file_get_contents('php://input'), true) ?? [];
    $stmt = $db->prepare(
        "INSERT INTO consultant_services
         (consultant_id, category, parent_service_id, title, title_en, description, description_en,
          scope_items, scope_items_en, duration_text, sessions_text, price, currency, plus_vat,
          cta_text, cta_text_en, badge_text, sort_order,
          booking_type, duration_minutes, fixed_start_time, fixed_end_time, slot_interval_minutes)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"
    );
    $stmt->execute([
        $id,
        $d['category'] ?? null,
        !empty($d['parent_service_id']) ? $d['parent_service_id'] : null,
        $d['title'],
        $d['title_en'] ?? null,
        $d['description'] ?? null,
        $d['description_en'] ?? null,
        isset($d['scope_items'])    ? json_encode($d['scope_items'])    : null,
        isset($d['scope_items_en']) ? json_encode($d['scope_items_en']) : null,
        $d['duration_text'] ?? null,
        $d['sessions_text'] ?? null,
        $d['price'] ?? 0,
        $d['currency'] ?? 'TRY',
        !empty($d['plus_vat']) ? 1 : 0,
        $d['cta_text'] ?? null,
        $d['cta_text_en'] ?? null,
        $d['badge_text'] ?? null,
        $d['sort_order'] ?? 0,
        in_array($d['booking_type'] ?? 'slot', ['slot','fixed_day','lead_form'], true) ? $d['booking_type'] : 'slot',
        ($d['booking_type'] ?? 'slot') === 'lead_form' ? null : (int)($d['duration_minutes'] ?? 60),
        !empty($d['fixed_start_time']) ? $d['fixed_start_time'] : null,
        !empty($d['fixed_end_time']) ? $d['fixed_end_time'] : null,
        (int)($d['slot_interval_minutes'] ?? 60),
    ]);
    sendResponse(['id' => $db->lastInsertId()]);
}

// PUT /api/admin/consultant-services/:id
if ($action === 'consultant-services' && $method === 'PUT' && !empty($id)) {
    $d = json_decode(file_get_contents('php://input'), true) ?? [];
    $stmt = $db->prepare(
        "UPDATE consultant_services SET title=?, title_en=?, description=?, description_en=?,
         scope_items=?, scope_items_en=?, duration_text=?, sessions_text=?,
         price=?, currency=?, plus_vat=?, cta_text=?, cta_text_en=?, badge_text=?,
         sort_order=?, is_active=?,
         booking_type=?, duration_minutes=?, fixed_start_time=?, fixed_end_time=?, slot_interval_minutes=?
         WHERE id=?"
    );
    $stmt->execute([
        $d['title'],
        $d['title_en'] ?? null,
        $d['description'] ?? null,
        $d['description_en'] ?? null,
        isset($d['scope_items'])    ? json_encode($d['scope_items'])    : null,
        isset($d['scope_items_en']) ? json_encode($d['scope_items_en']) : null,
        $d['duration_text'] ?? null,
        $d['sessions_text'] ?? null,
        $d['price'] ?? 0,
        $d['currency'] ?? 'TRY',
        !empty($d['plus_vat']) ? 1 : 0,
        $d['cta_text'] ?? null,
        $d['cta_text_en'] ?? null,
        $d['badge_text'] ?? null,
        $d['sort_order'] ?? 0,
        isset($d['is_active']) ? $d['is_active'] : 1,
        in_array($d['booking_type'] ?? 'slot', ['slot','fixed_day','lead_form'], true) ? $d['booking_type'] : 'slot',
        ($d['booking_type'] ?? 'slot') === 'lead_form' ? null : (int)($d['duration_minutes'] ?? 60),
        !empty($d['fixed_start_time']) ? $d['fixed_start_time'] : null,
        !empty($d['fixed_end_time']) ? $d['fixed_end_time'] : null,
        (int)($d['slot_interval_minutes'] ?? 60),
        $id,
    ]);
    sendResponse(['success' => true]);
}

// DELETE /api/admin/consultant-services/:id
if ($action === 'consultant-services' && $method === 'DELETE' && !empty($id)) {
    $db->prepare("DELETE FROM consultant_services WHERE id=?")->execute([$id]);
    sendResponse(['success' => true]);
}

// DELETE /api/admin/availability/:id
if ($action === 'availability' && $method === 'DELETE' && !empty($id)) {
    $db->prepare("DELETE FROM consultant_availability WHERE id=?")->execute([$id]);
    sendResponse(['success' => true]);
}

// PATCH /api/admin/availability/:id
if ($action === 'availability' && ($method === 'PATCH' || $method === 'PUT') && !empty($id)) {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $db->prepare("UPDATE consultant_availability SET status=? WHERE id=?")->execute([$data['status'] ?? 'available', $id]);
    sendResponse(['success' => true]);
}

// POST /api/admin/sync-calendar/:id — Manuel iCal senkronizasyon tetikleyici
if ($action === 'sync-calendar' && $method === 'POST' && !empty($id)) {
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    $urlOverride = !empty($body['ical_url']) ? trim($body['ical_url']) : null;
    require_once __DIR__ . '/../sync_calendar.php';
    $result = syncConsultant((int)$id, $db, $urlOverride);
    sendResponse($result);
}

// GET /api/admin/training-analytics
if ($action === 'training-analytics' && $method === 'GET') {
    // Per-training summary
    $summaryStmt = $db->query("
        SELECT
            tws.product_key,
            COUNT(DISTINCT tws.user_id) AS total_viewers,
            SUM(tws.seconds_watched) AS total_seconds,
            MAX(tws.updated_at) AS last_access
        FROM training_watch_sessions tws
        GROUP BY tws.product_key
        ORDER BY total_seconds DESC
    ");
    $summary = $summaryStmt->fetchAll();

    // Per-user breakdown
    $detailStmt = $db->query("
        SELECT
            tws.product_key,
            tws.user_id,
            CONCAT(COALESCE(u.first_name,''), ' ', COALESCE(u.last_name,'')) AS user_name,
            u.email AS user_email,
            SUM(tws.seconds_watched) AS total_seconds,
            MAX(tws.updated_at) AS last_access
        FROM training_watch_sessions tws
        JOIN users u ON u.id = tws.user_id
        GROUP BY tws.product_key, tws.user_id, u.first_name, u.last_name, u.email
        ORDER BY tws.product_key, total_seconds DESC
    ");
    $details = $detailStmt->fetchAll();

    sendResponse(['summary' => $summary, 'details' => $details]);
}

// GET /api/admin/training-access-pages — list all
if ($action === 'training-access-pages' && $method === 'GET' && empty($id)) {
    $rows = $db->query("SELECT * FROM training_access_pages ORDER BY id DESC")->fetchAll();
    sendResponse($rows);
}

// GET /api/admin/training-access-pages/:id
if ($action === 'training-access-pages' && $method === 'GET' && !empty($id)) {
    $stmt = $db->prepare("SELECT * FROM training_access_pages WHERE id=?");
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) sendResponse(['error' => 'Not found'], 404);
    sendResponse($row);
}

// POST /api/admin/training-access-pages — create
if ($action === 'training-access-pages' && $method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $slug = trim((string)($data['slug'] ?? ''));
    $productKey = trim((string)($data['product_key'] ?? ''));
    if ($slug === '' || $productKey === '') sendResponse(['error' => 'slug and product_key required'], 400);
    $stmt = $db->prepare("INSERT INTO training_access_pages (slug, product_key, title_tr, title_en, description_tr, description_en, vimeo_url_tr, vimeo_url_en, canva_url_tr, canva_url_en, pdf_url, pdf_url_tr, pdf_url_en) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)");
    $stmt->execute([
        $slug, $productKey,
        trim((string)($data['title_tr'] ?? '')),
        trim((string)($data['title_en'] ?? '')),
        trim((string)($data['description_tr'] ?? '')),
        trim((string)($data['description_en'] ?? '')),
        trim((string)($data['vimeo_url_tr'] ?? '')),
        trim((string)($data['vimeo_url_en'] ?? '')),
        trim((string)($data['canva_url_tr'] ?? '')),
        trim((string)($data['canva_url_en'] ?? '')),
        trim((string)($data['pdf_url'] ?? '')),
        trim((string)($data['pdf_url_tr'] ?? '')),
        trim((string)($data['pdf_url_en'] ?? ''))
    ]);
    sendResponse(['id' => (int)$db->lastInsertId(), 'success' => true]);
}

// PUT /api/admin/training-access-pages/:id — update
if ($action === 'training-access-pages' && ($method === 'PUT' || $method === 'PATCH') && !empty($id)) {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $stmt = $db->prepare("UPDATE training_access_pages SET slug=?, product_key=?, title_tr=?, title_en=?, description_tr=?, description_en=?, vimeo_url_tr=?, vimeo_url_en=?, canva_url_tr=?, canva_url_en=?, pdf_url=?, pdf_url_tr=?, pdf_url_en=? WHERE id=?");
    $stmt->execute([
        trim((string)($data['slug'] ?? '')),
        trim((string)($data['product_key'] ?? '')),
        trim((string)($data['title_tr'] ?? '')),
        trim((string)($data['title_en'] ?? '')),
        trim((string)($data['description_tr'] ?? '')),
        trim((string)($data['description_en'] ?? '')),
        trim((string)($data['vimeo_url_tr'] ?? '')),
        trim((string)($data['vimeo_url_en'] ?? '')),
        trim((string)($data['canva_url_tr'] ?? '')),
        trim((string)($data['canva_url_en'] ?? '')),
        trim((string)($data['pdf_url'] ?? '')),
        trim((string)($data['pdf_url_tr'] ?? '')),
        trim((string)($data['pdf_url_en'] ?? '')),
        $id
    ]);
    sendResponse(['success' => true]);
}

// DELETE /api/admin/training-access-pages/:id
if ($action === 'training-access-pages' && $method === 'DELETE' && !empty($id)) {
    $db->prepare("DELETE FROM training_access_pages WHERE id=?")->execute([$id]);
    sendResponse(['success' => true]);
}

// =====================================================================
// TRAINING LESSONS ADMIN ENDPOINTS
// =====================================================================

// GET /api/admin/training-lessons/:trainingId
if ($action === 'training-lessons' && $method === 'GET' && !empty($id)) {
    $stmt = $db->prepare("SELECT * FROM training_lessons WHERE training_id = ? ORDER BY order_index ASC");
    $stmt->execute([$id]);
    sendResponse($stmt->fetchAll());
}

// POST /api/admin/training-lessons
if ($action === 'training-lessons' && $method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $training_id = (int)($data['training_id'] ?? 0);
    $title_tr = trim((string)($data['title_tr'] ?? ''));
    if (!$training_id || $title_tr === '') sendResponse(['error' => 'training_id and title_tr required'], 400);

    $stmt = $db->prepare("
        INSERT INTO training_lessons
        (training_id, title_tr, title_en, description_tr, description_en, vimeo_url_tr, vimeo_url_en, pdf_url, pdf_url_tr, pdf_url_en, order_index, duration_label, is_published)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
    ");
    $stmt->execute([
        $training_id,
        $title_tr,
        trim((string)($data['title_en'] ?? '')) ?: null,
        trim((string)($data['description_tr'] ?? '')) ?: null,
        trim((string)($data['description_en'] ?? '')) ?: null,
        trim((string)($data['vimeo_url_tr'] ?? '')) ?: null,
        trim((string)($data['vimeo_url_en'] ?? '')) ?: null,
        trim((string)($data['pdf_url'] ?? '')) ?: null,
        trim((string)($data['pdf_url_tr'] ?? '')) ?: null,
        trim((string)($data['pdf_url_en'] ?? '')) ?: null,
        (int)($data['order_index'] ?? 0),
        trim((string)($data['duration_label'] ?? '')) ?: null,
        isset($data['is_published']) ? (int)$data['is_published'] : 1
    ]);
    
    $newId = (int)$db->lastInsertId();
    $stmt = $db->prepare("SELECT * FROM training_lessons WHERE id=?");
    $stmt->execute([$newId]);
    sendResponse($stmt->fetch(), 201);
}

// PUT /api/admin/training-lessons/:id
if ($action === 'training-lessons' && ($method === 'PUT' || $method === 'PATCH') && !empty($id)) {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $title_tr = trim((string)($data['title_tr'] ?? ''));
    if ($title_tr === '') sendResponse(['error' => 'title_tr required'], 400);

    $stmt = $db->prepare("
        UPDATE training_lessons SET
        title_tr=?, title_en=?, description_tr=?, description_en=?,
        vimeo_url_tr=?, vimeo_url_en=?, pdf_url=?, pdf_url_tr=?, pdf_url_en=?,
        order_index=?, duration_label=?, is_published=?
        WHERE id=?
    ");
    $stmt->execute([
        $title_tr,
        trim((string)($data['title_en'] ?? '')) ?: null,
        trim((string)($data['description_tr'] ?? '')) ?: null,
        trim((string)($data['description_en'] ?? '')) ?: null,
        trim((string)($data['vimeo_url_tr'] ?? '')) ?: null,
        trim((string)($data['vimeo_url_en'] ?? '')) ?: null,
        trim((string)($data['pdf_url'] ?? '')) ?: null,
        trim((string)($data['pdf_url_tr'] ?? '')) ?: null,
        trim((string)($data['pdf_url_en'] ?? '')) ?: null,
        (int)($data['order_index'] ?? 0),
        trim((string)($data['duration_label'] ?? '')) ?: null,
        isset($data['is_published']) ? (int)$data['is_published'] : 1,
        $id
    ]);
    
    $stmt = $db->prepare("SELECT * FROM training_lessons WHERE id=?");
    $stmt->execute([$id]);
    sendResponse($stmt->fetch() ?: ['success' => true]);
}

// DELETE /api/admin/training-lessons/:id
if ($action === 'training-lessons' && $method === 'DELETE' && !empty($id)) {
    $db->prepare("DELETE FROM training_lessons WHERE id=?")->execute([$id]);
    sendResponse(['success' => true]);
}

// =====================================================================
// EMAIL AUTOMATION ADMIN ENDPOINTS
// =====================================================================

// GET /api/admin/email-sequences — sekanslar + adımlar
if ($action === 'email-sequences' && $method === 'GET' && empty($id)) {
    try {
        $seqs = $db->query("SELECT * FROM email_sequences ORDER BY id ASC")->fetchAll();
        $stmtSteps = $db->prepare("SELECT * FROM email_sequence_steps WHERE sequence_id = ? ORDER BY step_order ASC");
        foreach ($seqs as &$seq) {
            $stmtSteps->execute([$seq['id']]);
            $seq['steps'] = $stmtSteps->fetchAll();
            $seq['id'] = (int)$seq['id'];
            $seq['is_active'] = (bool)$seq['is_active'];
            foreach ($seq['steps'] as &$step) {
                $step['id'] = (int)$step['id'];
                $step['sequence_id'] = (int)$step['sequence_id'];
                $step['delay_minutes'] = (int)$step['delay_minutes'];
                $step['step_order'] = (int)$step['step_order'];
            }
        }
        sendResponse(['sequences' => $seqs]);
    } catch (Throwable $e) {
        sendResponse(['error' => $e->getMessage()], 500);
    }
}

// PUT /api/admin/email-sequences/:id — aktif/pasif toggle veya restart_after_days güncelle
if ($action === 'email-sequences' && $method === 'PUT' && !empty($id)) {
    $data = getJsonBody();
    $fields = [];
    $params = [];
    if (isset($data['is_active'])) {
        $fields[] = 'is_active = ?';
        $params[] = $data['is_active'] ? 1 : 0;
    }
    if (isset($data['restart_after_days'])) {
        $fields[] = 'restart_after_days = ?';
        $params[] = $data['restart_after_days'] !== null ? (int)$data['restart_after_days'] : null;
    }
    if (empty($fields)) {
        sendResponse(['error' => 'No fields to update'], 400);
    }
    $params[] = (int)$id;
    $db->prepare("UPDATE email_sequences SET " . implode(', ', $fields) . " WHERE id = ?")->execute($params);
    sendResponse(['success' => true]);
}

// PUT /api/admin/email-sequence-steps/:id — adım subject/body güncelle
if ($action === 'email-sequence-steps' && $method === 'PUT' && !empty($id)) {
    $data = getJsonBody();
    $subject = trim((string)($data['subject'] ?? ''));
    $bodyHtml = trim((string)($data['body_html'] ?? ''));
    $delayMinutes = isset($data['delay_minutes']) ? (int)$data['delay_minutes'] : null;

    $fields = [];
    $params = [];
    if ($subject !== '') { $fields[] = 'subject = ?'; $params[] = $subject; }
    if ($bodyHtml !== '') { $fields[] = 'body_html = ?'; $params[] = $bodyHtml; }
    if ($delayMinutes !== null) { $fields[] = 'delay_minutes = ?'; $params[] = $delayMinutes; }

    if (empty($fields)) {
        sendResponse(['error' => 'No fields to update'], 400);
    }
    $params[] = (int)$id;
    $db->prepare("UPDATE email_sequence_steps SET " . implode(', ', $fields) . " WHERE id = ?")->execute($params);
    sendResponse(['success' => true]);
}

// GET /api/admin/email-queue — filtreli, sayfalı kuyruk listesi
if ($action === 'email-queue' && $method === 'GET') {
    $status = trim((string)($_GET['status'] ?? ''));
    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = 50;
    $offset = ($page - 1) * $limit;

    $where = [];
    $params = [];
    if ($status !== '' && in_array($status, ['pending', 'sent', 'failed', 'cancelled'], true)) {
        $where[] = 'q.status = ?';
        $params[] = $status;
    }
    $whereSql = count($where) > 0 ? 'WHERE ' . implode(' AND ', $where) : '';

    try {
        $countStmt = $db->prepare("SELECT COUNT(*) FROM email_queue q $whereSql");
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();

        $listParams = array_merge($params, [$limit, $offset]);
        $listStmt = $db->prepare(
            "SELECT q.*, s.name AS sequence_name, st.subject AS step_subject, st.step_order
             FROM email_queue q
             LEFT JOIN email_sequences s ON s.id = q.sequence_id
             LEFT JOIN email_sequence_steps st ON st.id = q.step_id
             $whereSql
             ORDER BY q.scheduled_at DESC
             LIMIT ? OFFSET ?"
        );
        $listStmt->execute($listParams);
        $rows = $listStmt->fetchAll();

        foreach ($rows as &$row) {
            $row['id'] = (int)$row['id'];
            $row['user_id'] = $row['user_id'] !== null ? (int)$row['user_id'] : null;
            $row['sequence_id'] = $row['sequence_id'] !== null ? (int)$row['sequence_id'] : null;
            $row['step_id'] = $row['step_id'] !== null ? (int)$row['step_id'] : null;
        }

        sendResponse([
            'queue' => $rows,
            'total' => $total,
            'page' => $page,
            'per_page' => $limit,
            'pages' => max(1, (int)ceil($total / $limit))
        ]);
    } catch (Throwable $e) {
        sendResponse(['error' => $e->getMessage()], 500);
    }
}

// GET /api/admin/email-stats — istatistikler
if ($action === 'email-stats' && $method === 'GET') {
    try {
        $totals = $db->query(
            "SELECT status, COUNT(*) AS cnt FROM email_queue GROUP BY status"
        )->fetchAll();

        $byStatus = ['pending' => 0, 'sent' => 0, 'failed' => 0, 'cancelled' => 0];
        foreach ($totals as $row) {
            if (isset($byStatus[$row['status']])) {
                $byStatus[$row['status']] = (int)$row['cnt'];
            }
        }

        $todaySent = (int)$db->query(
            "SELECT COUNT(*) FROM email_queue WHERE status='sent' AND DATE(sent_at) = CURDATE()"
        )->fetchColumn();

        $weekSent = (int)$db->query(
            "SELECT COUNT(*) FROM email_queue WHERE status='sent' AND sent_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)"
        )->fetchColumn();

        $monthSent = (int)$db->query(
            "SELECT COUNT(*) FROM email_queue WHERE status='sent' AND sent_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)"
        )->fetchColumn();

        $totalSent = $byStatus['sent'];
        $totalFailed = $byStatus['failed'];
        $successRate = ($totalSent + $totalFailed) > 0
            ? round(100 * $totalSent / ($totalSent + $totalFailed), 1)
            : 0;

        $topStmt = $db->query(
            "SELECT s.name, COUNT(*) AS sent_count
             FROM email_queue q
             JOIN email_sequences s ON s.id = q.sequence_id
             WHERE q.status = 'sent'
             GROUP BY q.sequence_id
             ORDER BY sent_count DESC
             LIMIT 5"
        );
        $topSequences = $topStmt->fetchAll();

        sendResponse([
            'by_status' => $byStatus,
            'today_sent' => $todaySent,
            'week_sent' => $weekSent,
            'month_sent' => $monthSent,
            'success_rate' => $successRate,
            'top_sequences' => $topSequences
        ]);
    } catch (Throwable $e) {
        sendResponse(['error' => $e->getMessage()], 500);
    }
}

// ════════════════════════════════════════════════════════════════════
// AUTOMATION BUILDER — Schema + Seed
// ════════════════════════════════════════════════════════════════════

function ensureAutomationBuilderSchema(PDO $db): void
{
    $db->exec("CREATE TABLE IF NOT EXISTS automations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT NULL,
        status ENUM('draft','active','inactive') NOT NULL DEFAULT 'draft',
        version INT NOT NULL DEFAULT 1,
        nodes_json LONGTEXT NOT NULL,
        edges_json LONGTEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $db->exec("CREATE TABLE IF NOT EXISTS automation_email_templates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        subject VARCHAR(500) NOT NULL,
        preview_text VARCHAR(500) NULL,
        sender_name VARCHAR(255) NOT NULL DEFAULT 'Khilonfast',
        sender_email VARCHAR(255) NOT NULL DEFAULT 'merhaba@khilonfast.com',
        body_html LONGTEXT NOT NULL,
        body_text TEXT NULL,
        cta_label VARCHAR(255) NULL,
        cta_url VARCHAR(500) NULL,
        variables_json TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $tplCount = (int)$db->query("SELECT COUNT(*) FROM automation_email_templates")->fetchColumn();
    if ($tplCount === 0) {
        seedAutomationTemplates($db);
    }

    $autoCount = (int)$db->query("SELECT COUNT(*) FROM automations")->fetchColumn();
    if ($autoCount === 0) {
        seedAutomations($db);
    }

    // Seed "Aldı / Kullanmadı" automation if it doesn't exist yet.
    // LIKE pattern hem doğru UTF-8 hem de eski mojibake satırları yakalar (AldÄ± KullanmadÄ±)
    // → tekrar seed çalışıp duplicate yaratmasın.
    $aldiCount = (int)$db->query(
        "SELECT COUNT(*) FROM automations WHERE name LIKE '%Ald%Kullanmad%'"
    )->fetchColumn();
    if ($aldiCount === 0) {
        $aldiTplCount = (int)$db->query(
            "SELECT COUNT(*) FROM automation_email_templates
             WHERE name LIKE '%Ald%Kullanmad%'"
        )->fetchColumn();
        if ($aldiTplCount === 0) {
            seedTemplatesAldiKullanmadi($db);
        }
        seedAutomationAldiKullanmadi($db);
    }

    // ── V2 Execution Engine: schema additions ──────────────────────────────
    // automations: stop_condition, restart_after_days, legacy_blocked, virtual trigger_event_idx
    try {
        $cols = $db->query("SHOW COLUMNS FROM automations")->fetchAll(PDO::FETCH_COLUMN);
        if (!in_array('stop_condition', $cols, true)) {
            $db->exec("ALTER TABLE automations ADD COLUMN stop_condition TEXT DEFAULT NULL");
        }
        if (!in_array('restart_after_days', $cols, true)) {
            $db->exec("ALTER TABLE automations ADD COLUMN restart_after_days INT DEFAULT NULL");
        }
        if (!in_array('legacy_blocked', $cols, true)) {
            $db->exec("ALTER TABLE automations ADD COLUMN legacy_blocked TINYINT(1) DEFAULT 0");
        }
        if (!in_array('trigger_event_idx', $cols, true)) {
            // Virtual generated column: nodes_json[0].config.trigger_event
            $db->exec(
                "ALTER TABLE automations
                 ADD COLUMN trigger_event_idx VARCHAR(64)
                 GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(nodes_json, '$[0].config.trigger_event'))) VIRTUAL"
            );
            // Index — eklenebilirse
            try {
                $db->exec("ALTER TABLE automations ADD INDEX idx_trigger_event_idx (trigger_event_idx, status)");
            } catch (Throwable $e) { /* index zaten varsa atla */ }
        }
        // Status enum'a 'paused' ekle (mevcutsa noop)
        $db->exec("ALTER TABLE automations MODIFY status ENUM('draft','active','inactive','paused') NOT NULL DEFAULT 'draft'");
    } catch (Throwable $e) {
        error_log('[automation] schema migration: ' . $e->getMessage());
    }

    // automation_executions: runtime tracking
    $db->exec("CREATE TABLE IF NOT EXISTS automation_executions (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        automation_id INT NOT NULL,
        contact_email VARCHAR(255) NOT NULL,
        contact_user_id INT NULL,
        trigger_event VARCHAR(64) NOT NULL,
        contact_data_json JSON NOT NULL,
        status ENUM('running','completed','cancelled','failed') NOT NULL DEFAULT 'running',
        current_node_id VARCHAR(32) NULL,
        next_run_at DATETIME NULL,
        attempts INT NOT NULL DEFAULT 0,
        last_error TEXT NULL,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP NULL,
        INDEX idx_status_next (status, next_run_at),
        INDEX idx_email_auto (contact_email, automation_id, status),
        INDEX idx_event_email (trigger_event, contact_email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    // automation_execution_logs: per-node debug trail
    $db->exec("CREATE TABLE IF NOT EXISTS automation_execution_logs (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        execution_id BIGINT NOT NULL,
        node_id VARCHAR(32) NOT NULL,
        node_type VARCHAR(32) NOT NULL,
        status ENUM('ok','skipped','error') NOT NULL,
        message TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_exec (execution_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    // consent_logs: form onaylarını kayıt altına al (chargeback / dispute koruması)
    $db->exec("CREATE TABLE IF NOT EXISTS consent_logs (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        email VARCHAR(255) NOT NULL,
        consent_key VARCHAR(48) NOT NULL,
        consent_state TINYINT(1) NOT NULL,
        context VARCHAR(64) NOT NULL,
        product_key VARCHAR(255) NULL,
        order_id INT NULL,
        policy_version VARCHAR(32) NULL,
        ip VARCHAR(64) NULL,
        user_agent TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_user (user_id),
        INDEX idx_key_email (consent_key, email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    // automation_cron_key setting — yoksa rastgele üret
    try {
        $row = $db->prepare("SELECT setting_value FROM settings WHERE setting_key='automation_cron_key' LIMIT 1");
        $row->execute();
        $existing = $row->fetchColumn();
        if (!$existing) {
            $key = bin2hex(random_bytes(24));
            $db->prepare(
                "INSERT INTO settings (setting_key, setting_value, setting_group, description)
                 VALUES ('automation_cron_key', ?, 'automation', 'Cron auth key (X-Cron-Key header)')
                 ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)"
            )->execute([$key]);
        }
    } catch (Throwable $e) {
        error_log('[automation] cron key seed: ' . $e->getMessage());
    }
}

// CRM şema/backfill fonksiyonları services/CrmSchema.php'ye taşındı (üst kısımdaki require_once).

function seedAutomationTemplates(PDO $db): void
{
    $templates = [
        [
            'name'         => 'Terk Edilen Sepet - 1. Saat',
            'subject'      => 'İşleminizi sadece 2 dakikada tamamlayabilirsiniz!',
            'preview_text' => 'Kaldığınız yerden devam etmek çok kolay.',
            'body_html'    => '<p>Merhaba {{first_name}},</p><p>Kaldığınız yerden satın alma işleminize devam ederek süreci kolay ve hızlı bir şekilde sonuçlandırabilirsiniz.</p><p>Devam etmek için aşağıdaki butona tıklayabilirsiniz:</p><p>Herhangi bir sorunuz olması durumunda size destek olmaktan memnuniyet duyarız.</p><p>Saygılarımızla,<br>Khilonfast Ekibi</p>',
            'cta_label'    => 'Devam Et',
            'cta_url'      => '{{cart_link}}',
            'variables'    => ['first_name', 'cart_link', 'unsubscribe_link'],
        ],
        [
            'name'         => 'Terk Edilen Sepet - 1. Gün',
            'subject'      => 'Aradığınız Çözümlere Ulaşmak İçin Son 1 Adım!',
            'preview_text' => 'Başvurunuzu henüz tamamlamadınız.',
            'body_html'    => '<p>Merhaba {{first_name}},</p><p>Başvurunuzu henüz tamamlamadınız.</p><p>khilonfast hizmetlerinden yararlanan pek çok kullanıcımız gibi siz de ihtiyaçlarınıza uygun çözümlerimizle avantajlardan yararlanmaya hemen başlayabilirsiniz!</p><p>Başvurunuza devam etmek için tıklayın:</p><p>Saygılarımızla,<br>Khilonfast Ekibi</p>',
            'cta_label'    => 'Devam Et',
            'cta_url'      => '{{cart_link}}',
            'variables'    => ['first_name', 'cart_link', 'unsubscribe_link'],
        ],
        [
            'name'         => 'Terk Edilen Sepet - 3. Gün',
            'subject'      => 'Biz başlamaya hazırız! Ya siz?',
            'preview_text' => 'Başvurunuzu henüz tamamlamadığınızı fark ettik.',
            'body_html'    => '<p>Merhaba {{first_name}},</p><p>Başvurunuzu henüz tamamlamadığınızı fark ettik.</p><p>Size en uygun çözümlerimizle iş süreçlerinizde fark yaratmaya başlamak için sabırsızlanıyoruz.</p><p>Başvurunuzu tamamlamak için aşağıdaki butona tıklayabilirsiniz:</p><p>Saygılarımızla,<br>Khilonfast Ekibi</p>',
            'cta_label'    => 'Devam Et',
            'cta_url'      => '{{cart_link}}',
            'variables'    => ['first_name', 'cart_link', 'unsubscribe_link'],
        ],
        [
            'name'         => 'Terk Edilen Sepet - 1. Hafta',
            'subject'      => 'İşleminizi birlikte tamamlamak ister misiniz?',
            'preview_text' => 'Size süreçle ilgili yardımcı olabiliriz.',
            'body_html'    => '<p>Merhaba {{first_name}},</p><p>Henüz tamamlamadığınızı gördüğümüz işlemleriniz için dilerseniz size süreçle ilgili yardımcı olabilir ve sorularınızı yanıtlayabiliriz.</p><p>Saygılarımızla,<br>Khilonfast Ekibi</p>',
            'cta_label'    => 'Sorularınızı Gönderin',
            'cta_url'      => '{{contact_link}}',
            'variables'    => ['first_name', 'cart_link', 'contact_link', 'unsubscribe_link'],
        ],
        [
            'name'         => 'Terk Edilen Sepet - 1. Ay',
            'subject'      => 'khilonfast Çözümleri Hala Gündeminizde Mi?',
            'preview_text' => 'Tamamlanmayı bekleyen bir işleminiz var.',
            'body_html'    => '<p>Merhaba {{first_name}},</p><p>Hala tamamlanmayı bekleyen bir işleminiz olduğunu size hatırlatmak istedik.</p><p>Eğer şu an doğru zaman değilse sizi anlıyoruz. Dilerseniz işleminize istediğiniz zaman devam edebilir ve avantajlardan yararlanmaya başlayabilirsiniz.</p><p>Saygılarımızla,<br>Khilonfast Ekibi</p>',
            'cta_label'    => 'Devam Et',
            'cta_url'      => '{{cart_link}}',
            'variables'    => ['first_name', 'cart_link', 'unsubscribe_link'],
        ],
        [
            'name'         => 'Terk Edilen Sepet - 3. Ay',
            'subject'      => 'khilonfast Çözümlerine Göz Atmak İster Misiniz?',
            'preview_text' => 'Daha evvel ilgilendiğiniz çözümleri tekrar inceleyin.',
            'body_html'    => '<p>Merhaba {{first_name}},</p><p>Daha evvel ilgilendiğiniz {{service_name}} ile birlikte diğer khilonfast çözümlerini tekrar incelemek ister misiniz?</p><p>Eğer ihtiyaçlarınız farklılaştıysa, sizin için yeni bir plan oluşturabiliriz.</p><p>Saygılarımızla,<br>Khilonfast Ekibi</p>',
            'cta_label'    => 'Yeni Plan Oluştur',
            'cta_url'      => '{{cart_link}}',
            'variables'    => ['first_name', 'service_name', 'cart_link', 'unsubscribe_link'],
        ],
    ];

    $stmt = $db->prepare(
        "INSERT INTO automation_email_templates
            (name, subject, preview_text, sender_name, sender_email, body_html, cta_label, cta_url, variables_json)
         VALUES (?, ?, ?, 'Khilonfast', 'merhaba@khilonfast.com', ?, ?, ?, ?)"
    );
    foreach ($templates as $t) {
        $stmt->execute([
            $t['name'], $t['subject'], $t['preview_text'],
            $t['body_html'], $t['cta_label'], $t['cta_url'],
            json_encode($t['variables'], JSON_UNESCAPED_UNICODE),
        ]);
    }
}

function seedAutomations(PDO $db): void
{
    $tplIds = $db->query(
        "SELECT id FROM automation_email_templates ORDER BY id ASC LIMIT 6"
    )->fetchAll(PDO::FETCH_COLUMN);
    if (count($tplIds) < 6) return;
    [$t1, $t2, $t3, $t4, $t5, $t6] = $tplIds;

    $nodes = [
        ['id'=>'n1',     'type'=>'trigger',   'position'=>['x'=>300,'y'=>50],   'config'=>['trigger_event'=>'checkout_email_entered']],
        ['id'=>'n2',     'type'=>'wait',      'position'=>['x'=>300,'y'=>180],  'config'=>['delay_type'=>'hours','delay_value'=>1]],
        ['id'=>'n3',     'type'=>'condition', 'position'=>['x'=>300,'y'=>310],  'config'=>['field'=>'purchase_completed','operator'=>'is_false','value'=>'']],
        ['id'=>'n_end_p','type'=>'end',       'position'=>['x'=>570,'y'=>440],  'config'=>['reason'=>'Satın alma tamamlandı, akış durdu']],
        ['id'=>'n4',     'type'=>'email',     'position'=>['x'=>300,'y'=>440],  'config'=>['mode'=>'template','template_id'=>(string)$t1,'subject'=>'İşleminizi sadece 2 dakikada tamamlayabilirsiniz!','sender_name'=>'Khilonfast','sender_email'=>'merhaba@khilonfast.com']],
        ['id'=>'n5',     'type'=>'wait',      'position'=>['x'=>300,'y'=>570],  'config'=>['delay_type'=>'days','delay_value'=>1]],
        ['id'=>'n6',     'type'=>'email',     'position'=>['x'=>300,'y'=>700],  'config'=>['mode'=>'template','template_id'=>(string)$t2,'subject'=>'Aradığınız Çözümlere Ulaşmak İçin Son 1 Adım!','sender_name'=>'Khilonfast','sender_email'=>'merhaba@khilonfast.com']],
        ['id'=>'n7',     'type'=>'wait',      'position'=>['x'=>300,'y'=>830],  'config'=>['delay_type'=>'days','delay_value'=>2]],
        ['id'=>'n8',     'type'=>'email',     'position'=>['x'=>300,'y'=>960],  'config'=>['mode'=>'template','template_id'=>(string)$t3,'subject'=>'Biz başlamaya hazırız! Ya siz?','sender_name'=>'Khilonfast','sender_email'=>'merhaba@khilonfast.com']],
        ['id'=>'n9',     'type'=>'wait',      'position'=>['x'=>300,'y'=>1090], 'config'=>['delay_type'=>'days','delay_value'=>4]],
        ['id'=>'n10',    'type'=>'email',     'position'=>['x'=>300,'y'=>1220], 'config'=>['mode'=>'template','template_id'=>(string)$t4,'subject'=>'İşleminizi birlikte tamamlamak ister misiniz?','sender_name'=>'Khilonfast','sender_email'=>'merhaba@khilonfast.com']],
        ['id'=>'n11',    'type'=>'wait',      'position'=>['x'=>300,'y'=>1350], 'config'=>['delay_type'=>'days','delay_value'=>23]],
        ['id'=>'n12',    'type'=>'email',     'position'=>['x'=>300,'y'=>1480], 'config'=>['mode'=>'template','template_id'=>(string)$t5,'subject'=>'khilonfast Çözümleri Hala Gündeminizde Mi?','sender_name'=>'Khilonfast','sender_email'=>'merhaba@khilonfast.com']],
        ['id'=>'n13',    'type'=>'wait',      'position'=>['x'=>300,'y'=>1610], 'config'=>['delay_type'=>'days','delay_value'=>60]],
        ['id'=>'n14',    'type'=>'email',     'position'=>['x'=>300,'y'=>1740], 'config'=>['mode'=>'template','template_id'=>(string)$t6,'subject'=>'khilonfast Çözümlerine Göz Atmak İster Misiniz?','sender_name'=>'Khilonfast','sender_email'=>'merhaba@khilonfast.com']],
        ['id'=>'n15',    'type'=>'end',       'position'=>['x'=>300,'y'=>1870], 'config'=>['reason'=>'Terk edilen sepet akışı tamamlandı']],
    ];

    $edges = [
        ['id'=>'e1',  'source'=>'n1',  'target'=>'n2'],
        ['id'=>'e2',  'source'=>'n2',  'target'=>'n3'],
        ['id'=>'e3',  'source'=>'n3',  'target'=>'n4',     'label'=>'yes'],
        ['id'=>'e4',  'source'=>'n3',  'target'=>'n_end_p','label'=>'no'],
        ['id'=>'e5',  'source'=>'n4',  'target'=>'n5'],
        ['id'=>'e6',  'source'=>'n5',  'target'=>'n6'],
        ['id'=>'e7',  'source'=>'n6',  'target'=>'n7'],
        ['id'=>'e8',  'source'=>'n7',  'target'=>'n8'],
        ['id'=>'e9',  'source'=>'n8',  'target'=>'n9'],
        ['id'=>'e10', 'source'=>'n9',  'target'=>'n10'],
        ['id'=>'e11', 'source'=>'n10', 'target'=>'n11'],
        ['id'=>'e12', 'source'=>'n11', 'target'=>'n12'],
        ['id'=>'e13', 'source'=>'n12', 'target'=>'n13'],
        ['id'=>'e14', 'source'=>'n13', 'target'=>'n14'],
        ['id'=>'e15', 'source'=>'n14', 'target'=>'n15'],
    ];

    $db->prepare(
        "INSERT INTO automations (name, description, status, nodes_json, edges_json)
         VALUES (?, ?, 'active', ?, ?)"
    )->execute([
        'Terk Edilen Sepet — Hizmetler (Tek Seferlik)',
        "Checkout'ta email girip satın alma yapmayan kullanıcılara 6 aşamalı hatırlatma akışı (1sa → 1g → 3g → 1h → 1ay → 3ay). Restart: 30 gün.",
        json_encode($nodes, JSON_UNESCAPED_UNICODE),
        json_encode($edges, JSON_UNESCAPED_UNICODE),
    ]);
}

// ─── Aldı / Kullanmadı — Template & Automation Seeds ────────────────────────

function seedTemplatesAldiKullanmadi(PDO $db): void
{
    $templates = [
        // ── Ana Akış (7 e-posta) ─────────────────────────────────────────
        [
            'name'         => 'Aldı Kullanmadı - 1. Saat',
            'subject'      => 'khilonfast ile başlamak için son adım!',
            'preview_text' => 'Formu doldurmanız sadece 2–3 dakikanızı alacak.',
            'body_html'    => '<p>Merhaba {{first_name}},</p><p>Satın aldığınız hizmet için başlangıç formunu henüz doldurmadığınızı fark ettik.</p><p>Başvurunuzu tamamlamak için son adımınız kaldı. Formu doldurmanız sadece 2–3 dakikanızı alacak ve hizmetiniz hemen devreye girecek.</p><p>Herhangi bir sorunuz olursa size yardımcı olmaktan memnuniyet duyarız.</p><p>Saygılarımızla,<br>Khilonfast Ekibi</p>',
            'cta_label'    => 'Formu Doldur',
            'cta_url'      => '{{form_link}}',
            'variables'    => ['first_name', 'form_link', 'unsubscribe_link'],
        ],
        [
            'name'         => 'Aldı Kullanmadı - 1. Gün',
            'subject'      => 'Başlamak için çok heyecanlıyız!',
            'preview_text' => 'Başvurunuzu tamamlamadan önce bazı bilgilere ihtiyacımız var.',
            'body_html'    => '<p>Merhaba {{first_name}},</p><p>Başvurunuzu tamamlamadan önce bazı bilgilere ihtiyacımız var. Bu bilgileri almadan ne yazık ki süreci başlatamıyoruz.</p><p>Formu doldurmak yalnızca birkaç dakikanızı alacak ve ardından {{service_name}} hizmetiniz aktif hale gelecek.</p><p>Saygılarımızla,<br>Khilonfast Ekibi</p>',
            'cta_label'    => 'Formu Doldur',
            'cta_url'      => '{{form_link}}',
            'variables'    => ['first_name', 'service_name', 'form_link', 'unsubscribe_link'],
        ],
        [
            'name'         => 'Aldı Kullanmadı - 4. Gün',
            'subject'      => 'Sürecinizi başlatmak için yardımınıza ihtiyacımız var ☹',
            'preview_text' => 'Başvurunuzu henüz tamamlamadığınız için süreci başlatamadık.',
            'body_html'    => '<p>Merhaba {{first_name}},</p><p>Başvurunuzu henüz tamamlamadığınız için süreci başlatamadık. Formu doldurarak hemen adım atabilir ve {{service_name}} avantajlarından yararlanmaya başlayabilirsiniz.</p><p>Herhangi bir sorunuz varsa lütfen bizimle iletişime geçin.</p><p>Saygılarımızla,<br>Khilonfast Ekibi</p>',
            'cta_label'    => 'Formu Doldur',
            'cta_url'      => '{{form_link}}',
            'variables'    => ['first_name', 'service_name', 'form_link', 'contact_link', 'unsubscribe_link'],
        ],
        [
            'name'         => 'Aldı Kullanmadı - 11. Gün',
            'subject'      => 'khilonfast hizmetiniz sizi bekliyor!',
            'preview_text' => 'Başvurunuzu henüz tamamlamadığınız için hizmetiniz beklemededir.',
            'body_html'    => '<p>Merhaba {{first_name}},</p><p>Başvurunuzu henüz tamamlamadığınız için {{service_name}} hizmetiniz şu anda beklemededir.</p><p>İsterseniz süreci hızlıca tamamlayarak çözümlerimizden hemen faydalanmaya başlayabilirsiniz. Sizi bekliyoruz!</p><p>Saygılarımızla,<br>Khilonfast Ekibi</p>',
            'cta_label'    => 'Formu Doldur',
            'cta_url'      => '{{form_link}}',
            'variables'    => ['first_name', 'service_name', 'form_link', 'unsubscribe_link'],
        ],
        [
            'name'         => 'Aldı Kullanmadı - 30. Gün',
            'subject'      => 'Hizmetinizi başlatamadık ☹',
            'preview_text' => 'Başvurunuzu tamamlamadığınız için süreç başlamadı.',
            'body_html'    => '<p>Merhaba {{first_name}},</p><p>Başvurunuzu tamamlamadığınız için ne yazık ki {{service_name}} süreciniz başlamadı.</p><p><strong>Bilgilerinizi form üzerinden paylaşmazsanız hizmetiniz durdurulacaktır.</strong></p><p>Süreci başlatmak ve khilonfast fırsatlarından yararlanmaya devam etmek için aşağıdaki formu doldurabilirsiniz.</p><p>Saygılarımızla,<br>Khilonfast Ekibi</p>',
            'cta_label'    => 'Formu Doldur',
            'cta_url'      => '{{form_link}}',
            'variables'    => ['first_name', 'service_name', 'form_link', 'unsubscribe_link'],
        ],
        [
            'name'         => 'Aldı Kullanmadı - 60. Gün',
            'subject'      => 'khilonfast Fırsatlarından Yararlanmaya Devam Edin!',
            'preview_text' => 'Başvurunuzu henüz tamamlamadınız.',
            'body_html'    => '<p>Merhaba {{first_name}},</p><p>Başvurunuzu henüz tamamlamadınız. Hizmetinizden kesintisiz faydalanmak için lütfen başlangıç formunu doldurun.</p><p>Formun doldurulması yalnızca birkaç dakikanızı alacak ve {{service_name}} hizmetiniz tekrar aktif hale gelecek.</p><p>Saygılarımızla,<br>Khilonfast Ekibi</p>',
            'cta_label'    => 'Formu Doldur',
            'cta_url'      => '{{form_link}}',
            'variables'    => ['first_name', 'service_name', 'form_link', 'unsubscribe_link'],
        ],
        [
            'name'         => 'Aldı Kullanmadı - 90. Gün',
            'subject'      => 'khilonfast Ayrıcalıkları Sizi Bekliyor!',
            'preview_text' => 'Başvurunuzu tamamlamadığınız için hizmet erişiminiz durdurulmuştur.',
            'body_html'    => '<p>Merhaba {{first_name}},</p><p>Başvurunuzu tamamlamadığınız için {{service_name}} hizmetinize erişiminiz durdurulmuştur.</p><p>Eğer şimdi devam etmek isterseniz, formu doldurarak hizmetinizi tekrar başlatabilirsiniz. Sizi tekrar aramızda görmekten mutluluk duyarız.</p><p>Saygılarımızla,<br>Khilonfast Ekibi</p>',
            'cta_label'    => 'Hizmeti Yeniden Başlat',
            'cta_url'      => '{{form_link}}',
            'variables'    => ['first_name', 'service_name', 'form_link', 'contact_link', 'unsubscribe_link'],
        ],
        // ── Yeniden Aktivasyon (3 e-posta — 11. ayda) ───────────────────
        [
            'name'         => 'Aldı Kullanmadı - Reaktivasyon 1 (11. Ay)',
            'subject'      => 'Yeniden Başlamanın Tam Zamanı!',
            'preview_text' => 'khilonfast hizmetinizi yeniden aktif hale getirmek ister misiniz?',
            'body_html'    => '<p>Merhaba {{first_name}},</p><p>Bir yıl öncesinde satın aldığınız {{service_name}} hizmetini hiç kullanmadınızı fark ettik.</p><p>khilonfast hizmetinizi yeniden aktif hale getirmek ister misiniz? Formu doldurarak avantajlardan tekrar yararlanmaya başlayabilirsiniz.</p><p>Saygılarımızla,<br>Khilonfast Ekibi</p>',
            'cta_label'    => 'Formu Doldur',
            'cta_url'      => '{{form_link}}',
            'variables'    => ['first_name', 'service_name', 'form_link', 'unsubscribe_link'],
        ],
        [
            'name'         => 'Aldı Kullanmadı - Reaktivasyon 2 (11. Ay + 2 Hafta)',
            'subject'      => "khilonfast'e kaldığınız yerden devam edin!",
            'preview_text' => 'Hizmetinizi yeniden başlatmak için sadece birkaç dakika ayırmanız yeterli.',
            'body_html'    => "<p>Merhaba {{first_name}},</p><p>{{service_name}} hizmetinizi yeniden başlatmak için sadece birkaç dakika ayırmanız yeterli.</p><p>Formu doldurarak süreci başlatabilir ve khilonfast'in sunduğu tüm avantajlardan tekrar faydalanabilirsiniz.</p><p>Saygılarımızla,<br>Khilonfast Ekibi</p>",
            'cta_label'    => 'Formu Doldur',
            'cta_url'      => '{{form_link}}',
            'variables'    => ['first_name', 'service_name', 'form_link', 'unsubscribe_link'],
        ],
        [
            'name'         => 'Aldı Kullanmadı - Reaktivasyon 3 (Son Şans)',
            'subject'      => 'Son fırsat: Şimdi başlayın!',
            'preview_text' => 'Hizmetinizi yeniden aktif hale getirmek için son fırsat!',
            'body_html'    => '<p>Merhaba {{first_name}},</p><p>{{service_name}} hizmetinizi yeniden aktif hale getirmek ve khilonfast avantajlarını kaçırmamak için son fırsatınız!</p><p>Formu doldurarak tekrar avantajlardan yararlanmaya başlayabilirsiniz. Sizi aramızda görmek için sabırsızlanıyoruz.</p><p>Saygılarımızla,<br>Khilonfast Ekibi</p>',
            'cta_label'    => 'Hemen Başla',
            'cta_url'      => '{{form_link}}',
            'variables'    => ['first_name', 'service_name', 'form_link', 'unsubscribe_link'],
        ],
    ];

    $stmt = $db->prepare(
        "INSERT INTO automation_email_templates
            (name, subject, preview_text, sender_name, sender_email, body_html, cta_label, cta_url, variables_json)
         VALUES (?, ?, ?, 'Khilonfast', 'merhaba@khilonfast.com', ?, ?, ?, ?)"
    );
    foreach ($templates as $t) {
        $stmt->execute([
            $t['name'], $t['subject'], $t['preview_text'],
            $t['body_html'], $t['cta_label'], $t['cta_url'],
            json_encode($t['variables'], JSON_UNESCAPED_UNICODE),
        ]);
    }
}

function seedAutomationAldiKullanmadi(PDO $db): void
{
    // Get the 10 templates we just seeded (last 10 by id)
    $tplIds = $db->query(
        "SELECT id FROM automation_email_templates WHERE name LIKE '%Aldı Kullanmadı%' ORDER BY id ASC LIMIT 10"
    )->fetchAll(PDO::FETCH_COLUMN);
    if (count($tplIds) < 10) return;
    [$t1, $t2, $t3, $t4, $t5, $t6, $t7, $t8, $t9, $t10] = $tplIds;

    // ── Timing (cumulative from purchase_completed) ──
    // Email 1: 1h  |  Email 2: Day 1  |  Email 3: Day 4  |  Email 4: Day 11
    // Email 5: Day 30 (wait 19d)  |  Email 6: Day 60 (wait 30d)  |  Email 7: Day 90 (wait 30d)
    // Reactivation 1: Day 330 ≈ 11mo (wait 240d)  |  Reac 2: +14d  |  Reac 3: +7d

    $nodes = [
        ['id'=>'a1',      'type'=>'trigger',       'position'=>['x'=>300,'y'=>50],   'config'=>['trigger_event'=>'purchase_completed','description'=>'Hizmet satın alındı']],
        ['id'=>'a2',      'type'=>'wait',           'position'=>['x'=>300,'y'=>180],  'config'=>['delay_type'=>'hours','delay_value'=>1]],
        ['id'=>'a3',      'type'=>'condition',      'position'=>['x'=>300,'y'=>310],  'config'=>['field'=>'onboarding_form_submitted','operator'=>'is_false','value'=>'']],
        ['id'=>'a_done',  'type'=>'end',            'position'=>['x'=>600,'y'=>440],  'config'=>['reason'=>'Form dolduruldu, hizmet başlatıldı']],
        ['id'=>'a4',      'type'=>'email',          'position'=>['x'=>300,'y'=>440],  'config'=>['mode'=>'template','template_id'=>(string)$t1,'subject'=>'khilonfast ile başlamak için son adım!','sender_name'=>'Khilonfast','sender_email'=>'merhaba@khilonfast.com']],
        ['id'=>'a5',      'type'=>'wait',           'position'=>['x'=>300,'y'=>570],  'config'=>['delay_type'=>'days','delay_value'=>1]],
        ['id'=>'a6',      'type'=>'email',          'position'=>['x'=>300,'y'=>700],  'config'=>['mode'=>'template','template_id'=>(string)$t2,'subject'=>'Başlamak için çok heyecanlıyız!','sender_name'=>'Khilonfast','sender_email'=>'merhaba@khilonfast.com']],
        ['id'=>'a7',      'type'=>'wait',           'position'=>['x'=>300,'y'=>830],  'config'=>['delay_type'=>'days','delay_value'=>3]],
        ['id'=>'a8',      'type'=>'email',          'position'=>['x'=>300,'y'=>960],  'config'=>['mode'=>'template','template_id'=>(string)$t3,'subject'=>'Sürecinizi başlatmak için yardımınıza ihtiyacımız var ☹','sender_name'=>'Khilonfast','sender_email'=>'merhaba@khilonfast.com']],
        ['id'=>'a9',      'type'=>'wait',           'position'=>['x'=>300,'y'=>1090], 'config'=>['delay_type'=>'days','delay_value'=>7]],
        ['id'=>'a10',     'type'=>'email',          'position'=>['x'=>300,'y'=>1220], 'config'=>['mode'=>'template','template_id'=>(string)$t4,'subject'=>'khilonfast hizmetiniz sizi bekliyor!','sender_name'=>'Khilonfast','sender_email'=>'merhaba@khilonfast.com']],
        ['id'=>'a11',     'type'=>'wait',           'position'=>['x'=>300,'y'=>1350], 'config'=>['delay_type'=>'days','delay_value'=>19]],
        ['id'=>'a12',     'type'=>'update_status',  'position'=>['x'=>300,'y'=>1480], 'config'=>['target_type'=>'service','field_name'=>'status','value'=>'paused']],
        ['id'=>'a13',     'type'=>'email',          'position'=>['x'=>300,'y'=>1610], 'config'=>['mode'=>'template','template_id'=>(string)$t5,'subject'=>'Hizmetinizi başlatamadık ☹','sender_name'=>'Khilonfast','sender_email'=>'merhaba@khilonfast.com']],
        ['id'=>'a14',     'type'=>'wait',           'position'=>['x'=>300,'y'=>1740], 'config'=>['delay_type'=>'days','delay_value'=>30]],
        ['id'=>'a15',     'type'=>'email',          'position'=>['x'=>300,'y'=>1870], 'config'=>['mode'=>'template','template_id'=>(string)$t6,'subject'=>'khilonfast Fırsatlarından Yararlanmaya Devam Edin!','sender_name'=>'Khilonfast','sender_email'=>'merhaba@khilonfast.com']],
        ['id'=>'a16',     'type'=>'wait',           'position'=>['x'=>300,'y'=>2000], 'config'=>['delay_type'=>'days','delay_value'=>30]],
        ['id'=>'a17',     'type'=>'email',          'position'=>['x'=>300,'y'=>2130], 'config'=>['mode'=>'template','template_id'=>(string)$t7,'subject'=>'khilonfast Ayrıcalıkları Sizi Bekliyor!','sender_name'=>'Khilonfast','sender_email'=>'merhaba@khilonfast.com']],
        ['id'=>'a18',     'type'=>'wait',           'position'=>['x'=>300,'y'=>2260], 'config'=>['delay_type'=>'days','delay_value'=>240]],
        ['id'=>'a19',     'type'=>'email',          'position'=>['x'=>300,'y'=>2390], 'config'=>['mode'=>'template','template_id'=>(string)$t8,'subject'=>'Yeniden Başlamanın Tam Zamanı!','sender_name'=>'Khilonfast','sender_email'=>'merhaba@khilonfast.com']],
        ['id'=>'a20',     'type'=>'wait',           'position'=>['x'=>300,'y'=>2520], 'config'=>['delay_type'=>'days','delay_value'=>14]],
        ['id'=>'a21',     'type'=>'email',          'position'=>['x'=>300,'y'=>2650], 'config'=>['mode'=>'template','template_id'=>(string)$t9,'subject'=>"khilonfast'e kaldığınız yerden devam edin!",'sender_name'=>'Khilonfast','sender_email'=>'merhaba@khilonfast.com']],
        ['id'=>'a22',     'type'=>'wait',           'position'=>['x'=>300,'y'=>2780], 'config'=>['delay_type'=>'days','delay_value'=>7]],
        ['id'=>'a23',     'type'=>'email',          'position'=>['x'=>300,'y'=>2910], 'config'=>['mode'=>'template','template_id'=>(string)$t10,'subject'=>'Son fırsat: Şimdi başlayın!','sender_name'=>'Khilonfast','sender_email'=>'merhaba@khilonfast.com']],
        ['id'=>'a24',     'type'=>'end',            'position'=>['x'=>300,'y'=>3040], 'config'=>['reason'=>'Reaktivasyon akışı tamamlandı']],
    ];

    $edges = [
        ['id'=>'ae1',  'source'=>'a1',  'target'=>'a2'],
        ['id'=>'ae2',  'source'=>'a2',  'target'=>'a3'],
        ['id'=>'ae3',  'source'=>'a3',  'target'=>'a4',     'label'=>'yes'],
        ['id'=>'ae4',  'source'=>'a3',  'target'=>'a_done', 'label'=>'no'],
        ['id'=>'ae5',  'source'=>'a4',  'target'=>'a5'],
        ['id'=>'ae6',  'source'=>'a5',  'target'=>'a6'],
        ['id'=>'ae7',  'source'=>'a6',  'target'=>'a7'],
        ['id'=>'ae8',  'source'=>'a7',  'target'=>'a8'],
        ['id'=>'ae9',  'source'=>'a8',  'target'=>'a9'],
        ['id'=>'ae10', 'source'=>'a9',  'target'=>'a10'],
        ['id'=>'ae11', 'source'=>'a10', 'target'=>'a11'],
        ['id'=>'ae12', 'source'=>'a11', 'target'=>'a12'],
        ['id'=>'ae13', 'source'=>'a12', 'target'=>'a13'],
        ['id'=>'ae14', 'source'=>'a13', 'target'=>'a14'],
        ['id'=>'ae15', 'source'=>'a14', 'target'=>'a15'],
        ['id'=>'ae16', 'source'=>'a15', 'target'=>'a16'],
        ['id'=>'ae17', 'source'=>'a16', 'target'=>'a17'],
        ['id'=>'ae18', 'source'=>'a17', 'target'=>'a18'],
        ['id'=>'ae19', 'source'=>'a18', 'target'=>'a19'],
        ['id'=>'ae20', 'source'=>'a19', 'target'=>'a20'],
        ['id'=>'ae21', 'source'=>'a20', 'target'=>'a21'],
        ['id'=>'ae22', 'source'=>'a21', 'target'=>'a22'],
        ['id'=>'ae23', 'source'=>'a22', 'target'=>'a23'],
        ['id'=>'ae24', 'source'=>'a23', 'target'=>'a24'],
    ];

    $db->prepare(
        "INSERT INTO automations (name, description, status, nodes_json, edges_json)
         VALUES (?, ?, 'active', ?, ?)"
    )->execute([
        'Hizmetler (Tek Seferlik) — Aldı / Kullanmadı',
        "Satın alıp onboarding formunu doldurmayan kullanıcılara 7 aşamalı hatırlatma (1sa → 1g → 4g → 11g → 30g → 60g → 90g). 11. ayda 3'lü reaktivasyon akışı.",
        json_encode($nodes, JSON_UNESCAPED_UNICODE),
        json_encode($edges, JSON_UNESCAPED_UNICODE),
    ]);
}

// Helper: fetch one automation row and normalize
function fetchAutomationRow(PDO $db, int $id): ?array
{
    $stmt = $db->prepare("SELECT * FROM automations WHERE id = ?");
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) return null;
    $row['id']    = (string)$row['id'];
    $row['version'] = (int)$row['version'];
    $row['nodes'] = json_decode($row['nodes_json'], true) ?? [];
    $row['edges'] = json_decode($row['edges_json'], true) ?? [];
    unset($row['nodes_json'], $row['edges_json']);
    return $row;
}

// Helper: fetch one template row and normalize
function fetchTemplateRow(PDO $db, int $id): ?array
{
    $stmt = $db->prepare("SELECT * FROM automation_email_templates WHERE id = ?");
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) return null;
    $row['id']        = (string)$row['id'];
    $row['variables'] = json_decode($row['variables_json'], true) ?? [];
    unset($row['variables_json']);
    return $row;
}

// ── AUTOMATIONS CRUD ──────────────────────────────────────────

// GET /api/admin/automations
if ($action === 'automations' && $method === 'GET' && empty($id) && empty($subAction)) {
    try {
        $rows = $db->query(
            "SELECT id, name, description, status, version, created_at, updated_at,
             JSON_LENGTH(nodes_json) AS node_count
             FROM automations ORDER BY created_at DESC"
        )->fetchAll();
        foreach ($rows as &$r) {
            $r['id']         = (string)$r['id'];
            $r['version']    = (int)$r['version'];
            $r['node_count'] = (int)$r['node_count'];
        }
        sendResponse(['automations' => $rows]);
    } catch (Throwable $e) {
        sendResponse(['error' => $e->getMessage()], 500);
    }
}

// GET /api/admin/automations/:id  (sadece sayısal ID — analytics/cron-key/executions farklı handler'lara)
if ($action === 'automations' && $method === 'GET' && !empty($id) && empty($subAction) && ctype_digit((string)$id)) {
    $row = fetchAutomationRow($db, (int)$id);
    if (!$row) sendResponse(['error' => 'Not found'], 404);
    sendResponse(['automation' => $row]);
}

// POST /api/admin/automations  (create)
if ($action === 'automations' && $method === 'POST' && empty($id)) {
    $data = getJsonBody();
    $name = trim((string)($data['name'] ?? ''));
    if ($name === '') sendResponse(['error' => 'Name required'], 400);
    $db->prepare(
        "INSERT INTO automations (name, description, status, nodes_json, edges_json)
         VALUES (?, ?, 'draft', '[]', '[]')"
    )->execute([$name, $data['description'] ?? null]);
    $row = fetchAutomationRow($db, (int)$db->lastInsertId());
    sendResponse(['automation' => $row], 201);
}

// PUT /api/admin/automations/:id  (update)
if ($action === 'automations' && $method === 'PUT' && !empty($id) && empty($subAction)) {
    $data = getJsonBody();
    $fields = ['version = version + 1', 'updated_at = NOW()'];
    $params = [];
    if (isset($data['name']))        { $fields[] = 'name = ?';        $params[] = trim((string)$data['name']); }
    if (array_key_exists('description', $data)) { $fields[] = 'description = ?'; $params[] = $data['description']; }
    if (isset($data['nodes']))       { $fields[] = 'nodes_json = ?';  $params[] = json_encode($data['nodes'], JSON_UNESCAPED_UNICODE); }
    if (isset($data['edges']))       { $fields[] = 'edges_json = ?';  $params[] = json_encode($data['edges'], JSON_UNESCAPED_UNICODE); }
    $params[] = (int)$id;
    $db->prepare("UPDATE automations SET " . implode(', ', $fields) . " WHERE id = ?")->execute($params);
    $row = fetchAutomationRow($db, (int)$id);
    if (!$row) sendResponse(['error' => 'Not found'], 404);
    sendResponse(['automation' => $row]);
}

// DELETE /api/admin/automations/:id
if ($action === 'automations' && $method === 'DELETE' && !empty($id) && empty($subAction)) {
    $db->prepare("DELETE FROM automations WHERE id = ?")->execute([(int)$id]);
    sendResponse(['success' => true]);
}

// POST /api/admin/automations/:id/activate
if ($action === 'automations' && $method === 'POST' && !empty($id) && $subAction === 'activate') {
    $db->prepare("UPDATE automations SET status = 'active', updated_at = NOW() WHERE id = ?")->execute([(int)$id]);
    sendResponse(['automation' => fetchAutomationRow($db, (int)$id)]);
}

// POST /api/admin/automations/:id/deactivate
if ($action === 'automations' && $method === 'POST' && !empty($id) && $subAction === 'deactivate') {
    $db->prepare("UPDATE automations SET status = 'inactive', updated_at = NOW() WHERE id = ?")->execute([(int)$id]);
    sendResponse(['automation' => fetchAutomationRow($db, (int)$id)]);
}

// POST /api/admin/automations/:id/manual-trigger — admin manuel olarak bir akışı tetikler
// body: { email, first_name?, last_name?, user_id?, order_id?, order_number? }
if ($action === 'automations' && $method === 'POST' && !empty($id) && $subAction === 'manual-trigger') {
    if (!ctype_digit((string)$id)) sendResponse(['error' => 'Invalid id'], 400);
    $autoId = (int)$id;
    $auto = $db->prepare("SELECT id, name, status, trigger_event_idx FROM automations WHERE id = ? LIMIT 1");
    $auto->execute([$autoId]);
    $row = $auto->fetch();
    if (!$row) sendResponse(['error' => 'Automation not found'], 404);
    if ($row['status'] !== 'active') sendResponse(['error' => 'Akış aktif değil — önce aktive edin'], 400);

    $data = getJsonBody();
    $email = strtolower(trim((string)($data['email'] ?? '')));
    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sendResponse(['error' => 'Geçerli bir email gerekli'], 400);
    }

    // contact_data'yı zenginleştir
    $contact = [
        'email'        => $email,
        'first_name'   => (string)($data['first_name'] ?? ''),
        'last_name'    => (string)($data['last_name'] ?? ''),
        'user_id'      => isset($data['user_id']) ? (int)$data['user_id'] : null,
        'order_id'     => (string)($data['order_id'] ?? ''),
        'order_number' => (string)($data['order_number'] ?? ($data['order_id'] ?? '')),
    ];

    // Eğer email var ama first_name yok, users tablosundan tamamla
    if (!$contact['first_name']) {
        $u = $db->prepare("SELECT id, first_name, last_name FROM users WHERE email = ? LIMIT 1");
        $u->execute([$email]);
        $userRow = $u->fetch();
        if ($userRow) {
            $contact['first_name'] = (string)($userRow['first_name'] ?? '');
            $contact['last_name'] = (string)($userRow['last_name'] ?? '');
            if (!$contact['user_id']) $contact['user_id'] = (int)$userRow['id'];
        }
    }

    require_once __DIR__ . '/../services/AutomationEngine.php';
    $engine = new AutomationEngine($db);
    // Tek akışı tetiklemek için trigger_event ile çağır — sadece bu automation match eder
    // (isteğe bağlı: AutomationEngine'a triggerSingle eklenebilir, şimdilik full event)
    $eventName = (string)($row['trigger_event_idx'] ?? 'manual');
    if (!$eventName) sendResponse(['error' => 'Bu akışın trigger_event tanımı yok'], 400);
    $result = $engine->trigger($eventName, $contact);
    sendResponse(['ok' => true, 'result' => $result, 'event' => $eventName]);
}

// POST /api/admin/automations/:id/duplicate
if ($action === 'automations' && $method === 'POST' && !empty($id) && $subAction === 'duplicate') {
    $orig = $db->query("SELECT * FROM automations WHERE id = " . (int)$id)->fetch();
    if (!$orig) sendResponse(['error' => 'Not found'], 404);
    $db->prepare(
        "INSERT INTO automations (name, description, status, nodes_json, edges_json)
         VALUES (?, ?, 'draft', ?, ?)"
    )->execute([$orig['name'] . ' (Kopya)', $orig['description'], $orig['nodes_json'], $orig['edges_json']]);
    sendResponse(['automation' => fetchAutomationRow($db, (int)$db->lastInsertId())], 201);
}

// GET /api/admin/automations/:id/executions — execution log paginated
if ($action === 'automations' && $method === 'GET' && !empty($id) && $subAction === 'executions') {
    $automationId = (int)$id;
    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = max(1, min(100, (int)($_GET['per_page'] ?? 25)));
    $offset = ($page - 1) * $perPage;
    $statusFilter = (string)($_GET['status'] ?? '');
    $emailFilter = trim((string)($_GET['email'] ?? ''));

    $where = ['automation_id = ?'];
    $params = [$automationId];
    if (in_array($statusFilter, ['running','completed','cancelled','failed'], true)) {
        $where[] = 'status = ?';
        $params[] = $statusFilter;
    }
    if ($emailFilter !== '') {
        $where[] = 'contact_email LIKE ?';
        $params[] = '%' . $emailFilter . '%';
    }
    $whereSql = 'WHERE ' . implode(' AND ', $where);

    $countStmt = $db->prepare("SELECT COUNT(*) FROM automation_executions $whereSql");
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();

    $listStmt = $db->prepare(
        "SELECT id, automation_id, contact_email, contact_user_id, trigger_event, status,
                current_node_id, next_run_at, attempts, last_error, started_at, completed_at
         FROM automation_executions
         $whereSql
         ORDER BY started_at DESC
         LIMIT $perPage OFFSET $offset"
    );
    $listStmt->execute($params);
    sendResponse([
        'executions' => $listStmt->fetchAll(),
        'page' => $page,
        'per_page' => $perPage,
        'total' => $total,
    ]);
}

// POST /api/admin/automations/executions/:execId/cancel
if ($action === 'automations' && $method === 'POST' && $id === 'executions' && !empty($subAction)) {
    $maybeAction = $routes[4] ?? '';
    if ($maybeAction === 'cancel') {
        require_once __DIR__ . '/../services/AutomationEngine.php';
        $engine = new AutomationEngine($db);
        $engine->cancel((int)$subAction, 'admin manual cancel');
        sendResponse(['ok' => true]);
    }
}

// GET /api/admin/automations/executions/:execId/logs
if ($action === 'automations' && $method === 'GET' && $id === 'executions' && !empty($subAction)) {
    $maybeAction = $routes[4] ?? '';
    if ($maybeAction === 'logs') {
        $stmt = $db->prepare(
            "SELECT id, node_id, node_type, status, message, created_at
             FROM automation_execution_logs
             WHERE execution_id = ?
             ORDER BY id DESC
             LIMIT 200"
        );
        $stmt->execute([(int)$subAction]);
        sendResponse(['logs' => $stmt->fetchAll()]);
    }
}

// POST /api/admin/automations/cron-key/rotate — yeni cron key üret
if ($action === 'automations' && $method === 'POST' && $id === 'cron-key' && $subAction === 'rotate') {
    $key = bin2hex(random_bytes(24));
    $db->prepare(
        "INSERT INTO settings (setting_key, setting_value, setting_group, description)
         VALUES ('automation_cron_key', ?, 'automation', 'Cron auth key (X-Cron-Key header)')
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)"
    )->execute([$key]);
    sendResponse(['key' => $key]);
}

// GET /api/admin/automations/cron-key — mevcut cron key (admin görüntüleme)
if ($action === 'automations' && $method === 'GET' && $id === 'cron-key' && empty($subAction)) {
    $val = (string)getSetting($db, 'automation_cron_key', '');
    sendResponse(['key' => $val]);
}

// GET /api/admin/automations/analytics?days=30 — agrega istatistik
if ($action === 'automations' && $method === 'GET' && $id === 'analytics' && empty($subAction)) {
    $days = max(1, min(365, (int)($_GET['days'] ?? 30)));

    // 1) KPI özet — son N gün
    $kpi = $db->prepare(
        "SELECT
           COUNT(*) AS total,
           SUM(CASE WHEN status='running' THEN 1 ELSE 0 END) AS running,
           SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) AS completed,
           SUM(CASE WHEN status='cancelled' THEN 1 ELSE 0 END) AS cancelled,
           SUM(CASE WHEN status='failed' THEN 1 ELSE 0 END) AS failed,
           AVG(CASE WHEN status='completed' AND completed_at IS NOT NULL THEN TIMESTAMPDIFF(SECOND, started_at, completed_at) ELSE NULL END) AS avg_duration_sec
         FROM automation_executions
         WHERE started_at >= NOW() - INTERVAL ? DAY"
    );
    $kpi->execute([$days]);
    $kpiRow = $kpi->fetch(PDO::FETCH_ASSOC) ?: [];

    // 2) Per-automation breakdown
    $perAuto = $db->prepare(
        "SELECT a.id, a.name, a.status,
           COUNT(e.id) AS total_runs,
           SUM(CASE WHEN e.status='completed' THEN 1 ELSE 0 END) AS completed,
           SUM(CASE WHEN e.status='running' THEN 1 ELSE 0 END) AS running,
           SUM(CASE WHEN e.status='failed' THEN 1 ELSE 0 END) AS failed,
           SUM(CASE WHEN e.status='cancelled' THEN 1 ELSE 0 END) AS cancelled,
           MAX(e.started_at) AS last_run_at
         FROM automations a
         LEFT JOIN automation_executions e ON e.automation_id = a.id
           AND e.started_at >= NOW() - INTERVAL ? DAY
         GROUP BY a.id, a.name, a.status
         ORDER BY total_runs DESC, a.id ASC"
    );
    $perAuto->execute([$days]);
    $perAutoRows = $perAuto->fetchAll(PDO::FETCH_ASSOC);

    // 3) Günlük trend — son N gün, status bazlı sayım
    $daily = $db->prepare(
        "SELECT DATE(started_at) AS d,
           COUNT(*) AS total,
           SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) AS completed,
           SUM(CASE WHEN status='failed' THEN 1 ELSE 0 END) AS failed
         FROM automation_executions
         WHERE started_at >= NOW() - INTERVAL ? DAY
         GROUP BY DATE(started_at)
         ORDER BY d ASC"
    );
    $daily->execute([$days]);
    $dailyRows = $daily->fetchAll(PDO::FETCH_ASSOC);

    // 4) Top trigger events
    $triggers = $db->prepare(
        "SELECT trigger_event, COUNT(*) AS cnt
         FROM automation_executions
         WHERE started_at >= NOW() - INTERVAL ? DAY
         GROUP BY trigger_event
         ORDER BY cnt DESC
         LIMIT 10"
    );
    $triggers->execute([$days]);
    $triggerRows = $triggers->fetchAll(PDO::FETCH_ASSOC);

    // 5) Top errors — failed executions, last_error grouping
    $errors = $db->prepare(
        "SELECT LEFT(COALESCE(last_error,''), 200) AS error, COUNT(*) AS cnt
         FROM automation_executions
         WHERE status='failed' AND last_error IS NOT NULL AND last_error <> ''
           AND started_at >= NOW() - INTERVAL ? DAY
         GROUP BY LEFT(COALESCE(last_error,''), 200)
         ORDER BY cnt DESC
         LIMIT 10"
    );
    $errors->execute([$days]);
    $errorRows = $errors->fetchAll(PDO::FETCH_ASSOC);

    // 6) Email node istatistik — kaç mail başarıyla gönderildi (logs.node_type='email' status='ok')
    $mailStats = $db->prepare(
        "SELECT COUNT(*) AS total_sent
         FROM automation_execution_logs
         WHERE node_type='email' AND status='ok' AND created_at >= NOW() - INTERVAL ? DAY"
    );
    $mailStats->execute([$days]);
    $mailSent = (int)$mailStats->fetchColumn();

    // 7) Son 15 çalıştırma — period filtresi UYGULAMADAN (debug & izleme için)
    $recent = $db->query(
        "SELECT e.id, e.automation_id, e.contact_email, e.trigger_event, e.status,
                e.current_node_id, e.next_run_at, e.attempts, e.last_error,
                e.started_at, e.completed_at,
                a.name AS automation_name
         FROM automation_executions e
         LEFT JOIN automations a ON a.id = e.automation_id
         ORDER BY e.started_at DESC
         LIMIT 15"
    )->fetchAll(PDO::FETCH_ASSOC);

    // 8) All-time özet (tarih filtresiz) — kullanıcı 'hiç' başlayan görmediğinde fark etsin
    $allTime = $db->query(
        "SELECT
           COUNT(*) AS total,
           SUM(CASE WHEN status='running' THEN 1 ELSE 0 END) AS running,
           SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) AS completed,
           SUM(CASE WHEN status='failed' THEN 1 ELSE 0 END) AS failed
         FROM automation_executions"
    )->fetch(PDO::FETCH_ASSOC) ?: [];

    sendResponse([
        'period_days' => $days,
        'kpi' => [
            'total' => (int)($kpiRow['total'] ?? 0),
            'running' => (int)($kpiRow['running'] ?? 0),
            'completed' => (int)($kpiRow['completed'] ?? 0),
            'cancelled' => (int)($kpiRow['cancelled'] ?? 0),
            'failed' => (int)($kpiRow['failed'] ?? 0),
            'avg_duration_sec' => $kpiRow['avg_duration_sec'] !== null ? (int)$kpiRow['avg_duration_sec'] : null,
            'mail_sent' => $mailSent,
        ],
        'all_time' => [
            'total' => (int)($allTime['total'] ?? 0),
            'running' => (int)($allTime['running'] ?? 0),
            'completed' => (int)($allTime['completed'] ?? 0),
            'failed' => (int)($allTime['failed'] ?? 0),
        ],
        'per_automation' => $perAutoRows,
        'daily' => $dailyRows,
        'top_triggers' => $triggerRows,
        'top_errors' => $errorRows,
        'recent_executions' => $recent,
    ]);
}

// ── EMAIL TEMPLATES CRUD ──────────────────────────────────────

// GET /api/admin/automation-templates
if ($action === 'automation-templates' && $method === 'GET' && empty($id)) {
    try {
        $rows = $db->query("SELECT * FROM automation_email_templates ORDER BY id ASC")->fetchAll();
        foreach ($rows as &$r) {
            $r['id']        = (string)$r['id'];
            $r['variables'] = json_decode($r['variables_json'], true) ?? [];
            unset($r['variables_json']);
        }
        sendResponse(['templates' => $rows]);
    } catch (Throwable $e) {
        sendResponse(['error' => $e->getMessage()], 500);
    }
}

// POST /api/admin/automation-templates
if ($action === 'automation-templates' && $method === 'POST' && empty($id)) {
    $data = getJsonBody();
    $name    = trim((string)($data['name'] ?? ''));
    $subject = trim((string)($data['subject'] ?? ''));
    if ($name === '' || $subject === '') sendResponse(['error' => 'Name and subject required'], 400);
    $vars = is_array($data['variables'] ?? null) ? $data['variables'] : [];
    $db->prepare(
        "INSERT INTO automation_email_templates
            (name, subject, preview_text, sender_name, sender_email, body_html, body_text, design_json, cta_label, cta_url, variables_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )->execute([
        $name, $subject,
        $data['preview_text'] ?? null,
        $data['sender_name']  ?? 'Khilonfast',
        $data['sender_email'] ?? 'merhaba@khilonfast.com',
        $data['body_html']    ?? '',
        $data['body_text']    ?? null,
        $data['design_json']  ?? null,
        $data['cta_label']    ?? null,
        $data['cta_url']      ?? null,
        json_encode($vars, JSON_UNESCAPED_UNICODE),
    ]);
    sendResponse(['template' => fetchTemplateRow($db, (int)$db->lastInsertId())], 201);
}

// PUT /api/admin/automation-templates/:id
if ($action === 'automation-templates' && $method === 'PUT' && !empty($id)) {
    $data   = getJsonBody();
    $fields = ['updated_at = NOW()'];
    $params = [];
    $cols   = ['name','subject','preview_text','sender_name','sender_email','body_html','body_text','design_json','cta_label','cta_url'];
    foreach ($cols as $col) {
        if (array_key_exists($col, $data)) { $fields[] = "$col = ?"; $params[] = $data[$col]; }
    }
    if (array_key_exists('variables', $data)) {
        $fields[]  = 'variables_json = ?';
        $params[]  = json_encode(is_array($data['variables']) ? $data['variables'] : [], JSON_UNESCAPED_UNICODE);
    }
    $params[] = (int)$id;
    $db->prepare("UPDATE automation_email_templates SET " . implode(', ', $fields) . " WHERE id = ?")->execute($params);
    $row = fetchTemplateRow($db, (int)$id);
    if (!$row) sendResponse(['error' => 'Not found'], 404);
    sendResponse(['template' => $row]);
}

// DELETE /api/admin/automation-templates/:id
if ($action === 'automation-templates' && $method === 'DELETE' && !empty($id)) {
    $db->prepare("DELETE FROM automation_email_templates WHERE id = ?")->execute([(int)$id]);
    sendResponse(['success' => true]);
}

// ──────────────────────────────────────────────────
// Bank Accounts (Anında Havale) — admin CRUD
// ──────────────────────────────────────────────────

// Tablo yoksa otomatik oluştur (idempotent — ilk çağrıda yaratılır)
function ensureBankAccountsSchema(PDO $db): void
{
    try {
        $db->exec("
            CREATE TABLE IF NOT EXISTS bank_accounts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                lidio_bank_account_id INT NOT NULL,
                bank_name VARCHAR(100) NOT NULL,
                bank_code VARCHAR(20) DEFAULT NULL,
                logo_url VARCHAR(500) DEFAULT NULL,
                is_active TINYINT(1) NOT NULL DEFAULT 1,
                display_order INT NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY uniq_lidio_bank_account_id (lidio_bank_account_id),
                KEY idx_active_order (is_active, display_order)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    } catch (Throwable $e) {
        error_log('ensureBankAccountsSchema error: ' . $e->getMessage());
    }
}

if ($action === 'bank-accounts' && $method === 'GET') {
    ensureBankAccountsSchema($db);
    $stmt = $db->query(
        "SELECT id, lidio_bank_account_id, bank_name, bank_code, logo_url, is_active, display_order, created_at, updated_at
         FROM bank_accounts ORDER BY display_order ASC, bank_name ASC"
    );
    sendResponse(['banks' => $stmt ? $stmt->fetchAll() : []]);
}

if ($action === 'bank-accounts' && $method === 'POST' && empty($id)) {
    ensureBankAccountsSchema($db);
    $data = getJsonBody();
    $lidioId = (int)($data['lidio_bank_account_id'] ?? 0);
    $bankName = trim((string)($data['bank_name'] ?? ''));
    if ($lidioId <= 0 || $bankName === '') {
        sendResponse(['error' => 'lidio_bank_account_id ve bank_name zorunlu.'], 400);
    }
    try {
        $stmt = $db->prepare(
            "INSERT INTO bank_accounts (lidio_bank_account_id, bank_name, bank_code, logo_url, is_active, display_order)
             VALUES (?, ?, ?, ?, ?, ?)"
        );
        $stmt->execute([
            $lidioId,
            mb_substr($bankName, 0, 100),
            !empty($data['bank_code']) ? (string)$data['bank_code'] : null,
            !empty($data['logo_url']) ? (string)$data['logo_url'] : null,
            !empty($data['is_active']) ? 1 : 0,
            (int)($data['display_order'] ?? 0)
        ]);
        sendResponse(['id' => (int)$db->lastInsertId()], 201);
    } catch (Throwable $e) {
        if (strpos($e->getMessage(), 'Duplicate') !== false || strpos($e->getMessage(), '1062') !== false) {
            sendResponse(['error' => 'Bu Lidio bank account ID zaten kayıtlı.'], 409);
        }
        sendResponse(['error' => 'Server error'], 500);
    }
}

if ($action === 'bank-accounts' && $method === 'PUT' && !empty($id)) {
    ensureBankAccountsSchema($db);
    $data = getJsonBody();
    $fields = [];
    $params = [];
    if (array_key_exists('lidio_bank_account_id', $data)) { $fields[] = 'lidio_bank_account_id = ?'; $params[] = (int)$data['lidio_bank_account_id']; }
    if (array_key_exists('bank_name', $data)) { $fields[] = 'bank_name = ?'; $params[] = mb_substr((string)$data['bank_name'], 0, 100); }
    if (array_key_exists('bank_code', $data)) { $fields[] = 'bank_code = ?'; $params[] = $data['bank_code'] === '' ? null : (string)$data['bank_code']; }
    if (array_key_exists('logo_url', $data)) { $fields[] = 'logo_url = ?'; $params[] = $data['logo_url'] === '' ? null : (string)$data['logo_url']; }
    if (array_key_exists('is_active', $data)) { $fields[] = 'is_active = ?'; $params[] = !empty($data['is_active']) ? 1 : 0; }
    if (array_key_exists('display_order', $data)) { $fields[] = 'display_order = ?'; $params[] = (int)$data['display_order']; }

    if (empty($fields)) {
        sendResponse(['error' => 'Güncellenecek alan yok.'], 400);
    }

    $params[] = (int)$id;
    $db->prepare("UPDATE bank_accounts SET " . implode(', ', $fields) . " WHERE id = ?")->execute($params);
    sendResponse(['message' => 'Banka hesabı güncellendi.']);
}

if ($action === 'bank-accounts' && $method === 'DELETE' && !empty($id)) {
    ensureBankAccountsSchema($db);
    $db->prepare("DELETE FROM bank_accounts WHERE id = ?")->execute([(int)$id]);
    sendResponse(['message' => 'Banka hesabı silindi.']);
}

// ──────────────────────────────────────────────────
// USD/TRY oranı yönetimi (admin)
// ──────────────────────────────────────────────────
require_once __DIR__ . '/../services/CurrencyService.php';

if ($action === 'exchange-rate' && empty($subAction) && $method === 'GET') {
    $info = getCurrentUsdTryRate($db);
    $stmt = $db->prepare("SELECT setting_value FROM settings WHERE setting_key = 'usd_try_rate_auto_update' LIMIT 1");
    $stmt->execute();
    $row = $stmt->fetch();
    $autoUpdate = strtolower((string)($row['setting_value'] ?? 'true')) === 'true';
    sendResponse([
        'rate' => (float)$info['rate'],
        'source' => $info['source'],
        'updated_at' => $info['updatedAt'],
        'auto_update' => $autoUpdate
    ]);
}

if ($action === 'exchange-rate' && empty($subAction) && $method === 'PUT') {
    $data = getJsonBody();
    try {
        if (isset($data['rate'])) {
            $rate = (float)$data['rate'];
            if ($rate <= 0) sendResponse(['error' => 'Geçersiz oran'], 400);
            setManualUsdTryRate($db, $rate);
        }
        if (array_key_exists('auto_update', $data)) {
            setUsdTryAutoUpdate($db, !empty($data['auto_update']));
        }
        $info = getCurrentUsdTryRate($db);
        sendResponse([
            'rate' => (float)$info['rate'],
            'source' => $info['source'],
            'updated_at' => $info['updatedAt']
        ]);
    } catch (Throwable $e) {
        sendResponse(['error' => $e->getMessage()], 500);
    }
}

if ($action === 'exchange-rate' && $id === 'refresh' && $method === 'POST') {
    try {
        $info = getCurrentUsdTryRate($db, true);
        sendResponse([
            'rate' => (float)$info['rate'],
            'source' => $info['source'],
            'updated_at' => $info['updatedAt']
        ]);
    } catch (Throwable $e) {
        sendResponse(['error' => $e->getMessage()], 500);
    }
}

// /api/admin/manual-bank-accounts → manuel havale hesap CRUD'una delege et
if ($action === 'manual-bank-accounts') {
    require_once __DIR__ . '/manual-bank-accounts.php';
}

// POST /api/admin/seed-automation-v2 — yeni otomasyon akışları + e-posta şablonlarını DB'ye yükle (idempotent)
if ($action === 'seed-automation-v2' && $method === 'POST') {
    require_once __DIR__ . '/../migrations/seed_automation_v2.php';
    try {
        $result = seedAutomationV2($db);
        sendResponse(['success' => true, 'result' => $result]);
    } catch (Throwable $e) {
        sendResponse(['error' => $e->getMessage()], 500);
    }
}

// GET /api/admin/manual-orders — manuel havale siparişleri listesi (filtre: status)
if ($action === 'manual-orders' && $method === 'GET' && empty($id)) {
    $statusFilter = $_GET['status'] ?? 'all'; // all | pending | completed | cancelled
    $where = "WHERE p.payment_method = 'manual_transfer'";
    if ($statusFilter === 'pending')   $where .= " AND o.status = 'processing' AND p.status = 'pending'";
    if ($statusFilter === 'completed') $where .= " AND o.status = 'completed'";
    if ($statusFilter === 'cancelled') $where .= " AND o.status = 'cancelled'";

    $sql = "SELECT
                o.id, o.order_number, o.status AS order_status, o.total_amount, o.currency,
                o.customer_lang, o.created_at,
                u.id AS user_id, u.email, u.first_name, u.last_name, u.phone,
                p.lidio_response AS payment_meta,
                DATEDIFF(NOW(), o.created_at) AS age_days,
                (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) AS items_count
            FROM orders o
            LEFT JOIN users u ON u.id = o.user_id
            INNER JOIN payments p ON p.order_id = o.id AND p.payment_method = 'manual_transfer'
            $where
            ORDER BY o.created_at DESC
            LIMIT 200";
    $stmt = $db->query($sql);
    $rows = $stmt->fetchAll();

    foreach ($rows as &$r) {
        $itemsStmt = $db->prepare(
            "SELECT oi.product_id, oi.quantity, oi.unit_price, p.name AS product_name
             FROM order_items oi LEFT JOIN products p ON p.id = oi.product_id
             WHERE oi.order_id = ?"
        );
        $itemsStmt->execute([(int)$r['id']]);
        $r['items'] = $itemsStmt->fetchAll();

        $meta = json_decode((string)($r['payment_meta'] ?? ''), true);
        $r['bank_info'] = is_array($meta) ? ($meta['bank_info'] ?? null) : null;
        unset($r['payment_meta']);
    }
    unset($r);

    sendResponse(['orders' => $rows]);
}

// POST /api/admin/orders/:id/confirm-manual-payment — manuel havale ödemesini onayla
// → order completed + payment success + subscription oluştur + müşteriye onay maili
if ($action === 'orders' && !empty($id) && ($routes[3] ?? '') === 'confirm-manual-payment' && $method === 'POST') {
    $orderId = (int)$id;
    $stmt = $db->prepare("SELECT * FROM orders WHERE id = ? LIMIT 1");
    $stmt->execute([$orderId]);
    $order = $stmt->fetch();
    if (!$order) sendResponse(['error' => 'Order not found'], 404);
    if (($order['status'] ?? '') === 'completed') {
        sendResponse(['message' => 'Order already completed', 'already' => true]);
    }

    try {
        $db->beginTransaction();
        $db->prepare("UPDATE orders SET status = 'completed' WHERE id = ?")->execute([$orderId]);
        $db->prepare("UPDATE payments SET status = 'success' WHERE order_id = ? AND payment_method = 'manual_transfer'")->execute([$orderId]);

        // Manuel havale onayı — payment_method='manual_transfer', kart yok
        createSubscriptionsForOrder($db, (int)$order['user_id'], (int)$orderId, 'manual_transfer', null);

        $db->commit();

        // Fatura kuyruğuna ekle (Paraşüt) — havale admin onayı
        try {
            require_once __DIR__ . '/../services/InvoiceService.php';
            invoiceQueueForOrder($db, (int)$orderId);
        } catch (Throwable $e) { error_log('[invoice queue manual] ' . $e->getMessage()); }

        // Email automation event + müşteri mailleri
        try {
            $userStmt = $db->prepare("SELECT email, first_name FROM users WHERE id = ? LIMIT 1");
            $userStmt->execute([(int)$order['user_id']]);
            $user = $userStmt->fetch();
            $lang = (string)($order['customer_lang'] ?? 'tr');

            // email_events: purchase_completed → mevcut email automation sequence'i tetikler
            try {
                // Tablo yoksa oluştur (lokal dev'de auto-migration)
                $db->exec("CREATE TABLE IF NOT EXISTS email_events (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    event_type VARCHAR(50) NOT NULL,
                    email VARCHAR(255) NOT NULL,
                    user_id INT DEFAULT NULL,
                    metadata JSON DEFAULT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    KEY idx_email (email), KEY idx_event_type (event_type)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
                $db->prepare("INSERT INTO email_events (event_type, email, user_id) VALUES ('purchase_completed', ?, ?)")
                   ->execute([(string)$user['email'], (int)$order['user_id']]);
                $db->prepare("UPDATE email_queue SET status='cancelled' WHERE email=? AND status='pending'")
                   ->execute([(string)$user['email']]);

                // V2 Automation Engine — purchase_completed trigger (manuel havale onay path)
                try {
                    require_once __DIR__ . '/../services/AutomationEngine.php';
                    (new AutomationEngine($db))->trigger('purchase_completed', [
                        'email'      => (string)$user['email'],
                        'first_name' => (string)($user['first_name'] ?? ''),
                        'last_name'  => (string)($user['last_name'] ?? ''),
                        'user_id'    => (int)$order['user_id'],
                        'order_id'   => (string)$order['id'],
                        'order_number' => (string)($order['order_number'] ?? $order['id']),
                    ]);
                } catch (Throwable $autoErr) {
                    error_log('[automation] purchase_completed trigger fail (manual confirm): ' . $autoErr->getMessage());
                }
            } catch (Throwable $eaErr) { error_log('[confirm-manual] email_event: ' . $eaErr->getMessage()); }

            if ($user && function_exists('sendTransactionalEmail')) {
                // 1) Onay maili
                $confMail = buildManualTransferEmail('confirmed', $lang, [
                    'order_number' => $order['order_number'],
                    'order_id' => $order['id'],
                    'first_name' => $user['first_name'] ?? '',
                    'amount' => $order['total_amount'],
                    'currency' => $order['currency'] ?? 'TRY'
                ]);
                sendTransactionalEmail($db, (string)$user['email'], $confMail['subject'], $confMail['html']);

                // 2) Form-required her sipariş kalemi için ayrı onboarding maili
                $stmtItems = $db->prepare(
                    "SELECT oi.id AS order_item_id, p.name AS product_name
                     FROM order_items oi
                     JOIN products p ON p.id = oi.product_id
                     WHERE oi.order_id = ? AND COALESCE(p.requires_onboarding, 0) = 1"
                );
                $stmtItems->execute([$order['id']]);
                foreach ($stmtItems->fetchAll() as $obIt) {
                    $obMail = buildManualTransferEmail('onboarding-link', $lang, [
                        'order_number' => $order['order_number'],
                        'order_id' => $order['id'],
                        'order_item_id' => $obIt['order_item_id'],
                        'product_name' => $obIt['product_name'],
                        'first_name' => $user['first_name'] ?? ''
                    ]);
                    sendTransactionalEmail($db, (string)$user['email'], $obMail['subject'], $obMail['html']);
                }
            }
        } catch (Throwable $mailErr) {
            error_log('[admin-confirm-manual] mail: ' . $mailErr->getMessage());
        }

        sendResponse(['message' => 'Order completed', 'order_id' => $orderId]);
    } catch (Throwable $e) {
        if ($db->inTransaction()) $db->rollBack();
        sendResponse(['error' => $e->getMessage()], 500);
    }
}

// ─────────────────────────────────────────────
// GET /api/admin/subscriptions — abonelik listesi (filtre + arama + sayfalama)
//   query: ?status=active|expired|cancelled  ?search=email|isim  ?page=1
// ─────────────────────────────────────────────
if ($action === 'subscriptions' && $method === 'GET' && empty($id)) {
    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = 30;
    $offset = ($page - 1) * $limit;
    $where = [];
    $params = [];

    $statusF = $_GET['status'] ?? '';
    if (in_array($statusF, ['active', 'expired', 'cancelled'], true)) {
        $where[] = 's.status = ?';
        $params[] = $statusF;
    }
    $search = trim((string)($_GET['search'] ?? ''));
    if ($search !== '') {
        $where[] = '(u.email LIKE ? OR CONCAT(COALESCE(u.first_name,\'\'),\' \',COALESCE(u.last_name,\'\')) LIKE ?)';
        $params[] = "%$search%";
        $params[] = "%$search%";
    }
    // Sadece abonelik tipi ürünler (eğitim/lifetime hariç) — duration_days dolu olanlar
    $where[] = "p.type = 'subscription'";
    $whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

    $countStmt = $db->prepare(
        "SELECT COUNT(*) AS c
         FROM subscriptions s
         JOIN products p ON p.id = s.product_id
         JOIN users u ON u.id = s.user_id
         $whereSql"
    );
    $countStmt->execute($params);
    $total = (int)($countStmt->fetch()['c'] ?? 0);

    $listStmt = $db->prepare(
        "SELECT s.id, s.status, s.starts_at, s.expires_at, s.next_renewal_at,
                s.auto_renew, s.payment_method, s.cancellation_requested_at, s.cancelled_at,
                s.last_renewal_at,
                u.id AS user_id, u.email AS user_email,
                CONCAT(COALESCE(u.first_name,''),' ',COALESCE(u.last_name,'')) AS user_name,
                p.name AS product_name, p.product_key,
                uc.masked_number AS card_masked, uc.card_brand
         FROM subscriptions s
         JOIN products p ON p.id = s.product_id
         JOIN users u ON u.id = s.user_id
         LEFT JOIN user_cards uc ON uc.id = s.renewal_card_id
         $whereSql
         ORDER BY (s.status='active' AND s.next_renewal_at IS NOT NULL) DESC,
                  s.next_renewal_at ASC, s.id DESC
         LIMIT $limit OFFSET $offset"
    );
    $listStmt->execute($params);
    $rows = array_map(function ($r) {
        $r['id'] = (int)$r['id'];
        $r['user_id'] = (int)$r['user_id'];
        $r['auto_renew'] = (int)($r['auto_renew'] ?? 0);
        return $r;
    }, $listStmt->fetchAll());

    // Özet sayaçlar
    $summary = $db->query(
        "SELECT
            SUM(s.status='active') AS active_total,
            SUM(s.status='active' AND s.auto_renew=1) AS auto_renew_on,
            SUM(s.status='active' AND s.cancellation_requested_at IS NOT NULL) AS cancel_pending,
            SUM(s.status='active' AND s.next_renewal_at IS NOT NULL AND s.next_renewal_at <= NOW() + INTERVAL 7 DAY) AS due_7d
         FROM subscriptions s JOIN products p ON p.id=s.product_id
         WHERE p.type='subscription'"
    )->fetch();

    sendResponse([
        'subscriptions' => $rows,
        'total' => $total,
        'page' => $page,
        'pages' => (int)ceil($total / $limit),
        'summary' => [
            'active_total'   => (int)($summary['active_total'] ?? 0),
            'auto_renew_on'  => (int)($summary['auto_renew_on'] ?? 0),
            'cancel_pending' => (int)($summary['cancel_pending'] ?? 0),
            'due_7d'         => (int)($summary['due_7d'] ?? 0),
        ],
    ]);
}

// POST /api/admin/subscriptions/:id/cancel — admin iptal (dönem sonu)
if ($action === 'subscriptions' && $method === 'POST' && !empty($id) && ($routes[3] ?? '') === 'cancel') {
    $sid = (int)$id;
    $row = $db->prepare("SELECT id FROM subscriptions WHERE id = ? AND status = 'active' LIMIT 1");
    $row->execute([$sid]);
    if (!$row->fetch()) sendResponse(['error' => 'Abonelik bulunamadı'], 404);
    $db->prepare(
        "UPDATE subscriptions SET auto_renew = 0, cancellation_requested_at = NOW() WHERE id = ?"
    )->execute([$sid]);
    sendResponse(['success' => true, 'message' => 'Abonelik dönem sonunda sonlandırılacak.']);
}

// =====================================================================
// MUHASEBE — Paraşüt e-fatura entegrasyonu
// =====================================================================

// GET /api/admin/invoices?status=&q=
if ($action === 'invoices' && $method === 'GET' && empty($id)) {
    $status = $_GET['status'] ?? '';
    $q = trim((string)($_GET['q'] ?? ''));
    $where = ["o.status = 'completed'"];
    $params = [];
    if (in_array($status, ['pending','queued','processing','sent','failed','skipped'], true)) {
        $where[] = 'o.invoice_status = ?';
        $params[] = $status;
    }
    if ($q !== '') {
        $where[] = '(o.order_number LIKE ? OR u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)';
        $like = '%' . $q . '%';
        array_push($params, $like, $like, $like, $like);
    }
    $sql = "SELECT o.id, o.order_number, o.total_amount, o.currency, o.created_at,
                   o.customer_type, o.invoice_status, o.parasut_invoice_id, o.parasut_invoice_type, o.invoice_sent_at,
                   u.email, u.first_name, u.last_name,
                   j.attempts, j.last_error, j.next_run_at
            FROM orders o
            JOIN users u ON u.id = o.user_id
            LEFT JOIN invoice_jobs j ON j.order_id = o.id
            WHERE " . implode(' AND ', $where) . "
            ORDER BY o.created_at DESC LIMIT 500";
    $st = $db->prepare($sql);
    $st->execute($params);
    sendResponse(['invoices' => $st->fetchAll()]);
}

// GET /api/admin/invoices/:orderId — detay
if ($action === 'invoices' && $method === 'GET' && !empty($id) && empty($subAction)) {
    $orderId = (int)$id;
    $st = $db->prepare(
        "SELECT o.*, u.email, u.first_name, u.last_name, u.phone, u.national_id, u.address,
                ci.company_name, ci.tax_number, ci.tax_office,
                j.id AS job_id, j.status AS job_status, j.attempts, j.last_error, j.next_run_at, j.updated_at AS job_updated_at
         FROM orders o
         JOIN users u ON u.id = o.user_id
         LEFT JOIN company_info ci ON ci.user_id = o.user_id
         LEFT JOIN invoice_jobs j ON j.order_id = o.id
         WHERE o.id = ?"
    );
    $st->execute([$orderId]);
    $order = $st->fetch();
    if (!$order) sendResponse(['error' => 'Sipariş bulunamadı'], 404);

    $itemsSt = $db->prepare(
        "SELECT oi.*, p.product_key, p.name AS product_name FROM order_items oi
         JOIN products p ON p.id = oi.product_id WHERE oi.order_id = ?"
    );
    $itemsSt->execute([$orderId]);
    sendResponse(['order' => $order, 'items' => $itemsSt->fetchAll()]);
}

// POST /api/admin/invoices/:orderId/retry — başarısız işi tekrar dene
if ($action === 'invoices' && $method === 'POST' && !empty($id) && $subAction === 'retry') {
    require_once __DIR__ . '/../services/InvoiceService.php';
    try {
        $res = invoiceRetryForOrder($db, (int)$id);
        sendResponse($res);
    } catch (Throwable $e) {
        sendResponse(['ok' => false, 'error' => $e->getMessage()], 500);
    }
}

// POST /api/admin/parasut/test-connection — Ayarlar > Muhasebe bağlantı testi
if ($action === 'parasut' && $method === 'POST' && $id === 'test-connection') {
    require_once __DIR__ . '/../services/ParasutService.php';
    try {
        $res = parasutTestConnection($db);
        sendResponse($res);
    } catch (Throwable $e) {
        sendResponse(['ok' => false, 'error' => $e->getMessage()], 500);
    }
}

sendResponse(['error' => 'Action not found'], 404);
