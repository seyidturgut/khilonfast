<?php

class CouponValidationException extends Exception
{
}

function ensureCouponSchema(PDO $db)
{
    static $checked = false;
    if ($checked) {
        return;
    }

    if (!tableExists($db, 'coupons')) {
        $db->exec(
            "CREATE TABLE coupons (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                code VARCHAR(100) NOT NULL UNIQUE,
                description TEXT NULL,
                discount_type ENUM('percentage', 'fixed') NOT NULL DEFAULT 'percentage',
                discount_value DECIMAL(10,2) NOT NULL DEFAULT 0,
                minimum_cart_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
                maximum_discount_amount DECIMAL(10,2) NULL DEFAULT NULL,
                starts_at DATETIME NULL DEFAULT NULL,
                ends_at DATETIME NULL DEFAULT NULL,
                is_active TINYINT(1) NOT NULL DEFAULT 1,
                total_usage_limit INT NULL DEFAULT NULL,
                per_user_limit INT NULL DEFAULT NULL,
                restricted_products_json JSON NULL,
                restricted_categories_json JSON NULL,
                new_customers_only TINYINT(1) NOT NULL DEFAULT 0,
                is_stackable TINYINT(1) NOT NULL DEFAULT 0,
                usage_count INT NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_coupons_active (is_active),
                INDEX idx_coupons_starts_at (starts_at),
                INDEX idx_coupons_ends_at (ends_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
        );
    }

    if (!tableExists($db, 'coupon_usages')) {
        $db->exec(
            "CREATE TABLE coupon_usages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                coupon_id INT NOT NULL,
                user_id INT NULL,
                order_id INT NOT NULL,
                discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
                used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                released_at TIMESTAMP NULL DEFAULT NULL,
                status ENUM('used', 'released') NOT NULL DEFAULT 'used',
                CONSTRAINT fk_coupon_usages_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE RESTRICT,
                CONSTRAINT fk_coupon_usages_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
                CONSTRAINT fk_coupon_usages_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
                UNIQUE KEY uniq_coupon_usage_order (order_id),
                INDEX idx_coupon_usages_coupon (coupon_id),
                INDEX idx_coupon_usages_user_coupon (user_id, coupon_id),
                INDEX idx_coupon_usages_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
        );
    }

    couponEnsureOrderColumn($db, 'subtotal_amount', "ALTER TABLE orders ADD COLUMN subtotal_amount DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER order_number");
    couponEnsureOrderColumn($db, 'coupon_discount_amount', "ALTER TABLE orders ADD COLUMN coupon_discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER subtotal_amount");
    couponEnsureOrderColumn($db, 'shipping_amount', "ALTER TABLE orders ADD COLUMN shipping_amount DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER coupon_discount_amount");
    couponEnsureOrderColumn($db, 'tax_amount', "ALTER TABLE orders ADD COLUMN tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER shipping_amount");
    couponEnsureOrderColumn($db, 'coupon_id', "ALTER TABLE orders ADD COLUMN coupon_id INT NULL DEFAULT NULL AFTER total_amount");
    couponEnsureOrderColumn($db, 'coupon_code', "ALTER TABLE orders ADD COLUMN coupon_code VARCHAR(100) NULL DEFAULT NULL AFTER coupon_id");
    couponEnsureOrderColumn($db, 'coupon_name', "ALTER TABLE orders ADD COLUMN coupon_name VARCHAR(255) NULL DEFAULT NULL AFTER coupon_code");
    couponEnsureOrderColumn($db, 'applied_coupon_snapshot_json', "ALTER TABLE orders ADD COLUMN applied_coupon_snapshot_json JSON NULL AFTER coupon_name");

    couponEnsureOrderIndex($db, 'idx_orders_coupon_id', "ALTER TABLE orders ADD INDEX idx_orders_coupon_id (coupon_id)");
    couponEnsureOrderForeignKey($db, 'fk_orders_coupon', "ALTER TABLE orders ADD CONSTRAINT fk_orders_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE SET NULL");

    $checked = true;
}

function couponEnsureOrderColumn(PDO $db, $columnName, $sql)
{
    if (!columnExists($db, 'orders', $columnName)) {
        $db->exec($sql);
    }
}

function couponEnsureOrderIndex(PDO $db, $indexName, $sql)
{
    $stmt = $db->prepare("SHOW INDEX FROM orders WHERE Key_name = ?");
    $stmt->execute([$indexName]);
    if (!$stmt->fetch()) {
        $db->exec($sql);
    }
}

function couponEnsureOrderForeignKey(PDO $db, $constraintName, $sql)
{
    $stmt = $db->prepare(
        "SELECT CONSTRAINT_NAME
         FROM information_schema.TABLE_CONSTRAINTS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND CONSTRAINT_NAME = ?"
    );
    $stmt->execute([$constraintName]);
    if (!$stmt->fetch()) {
        $db->exec($sql);
    }
}

function couponNormalizeCode($code)
{
    return strtoupper(trim((string)$code));
}

function couponDecodeJsonList($value)
{
    if (is_array($value)) {
        return array_values(array_filter(array_map('strval', $value), function ($item) { return trim($item) !== ''; }));
    }

    $decoded = json_decode((string)$value, true);
    if (!is_array($decoded)) {
        return [];
    }

    return array_values(array_filter(array_map('strval', $decoded), function ($item) { return trim($item) !== ''; }));
}

function couponNormalizeDateValue($value)
{
    $raw = trim((string)$value);
    if ($raw === '') {
        return null;
    }

    try {
        return (new DateTimeImmutable($raw))->format('Y-m-d H:i:s');
    } catch (Throwable $e) {
        return null;
    }
}

function couponHydrateRow(array $row)
{
    $row['id'] = (int)($row['id'] ?? 0);
    $row['discount_value'] = (float)($row['discount_value'] ?? 0);
    $row['minimum_cart_amount'] = (float)($row['minimum_cart_amount'] ?? 0);
    $row['maximum_discount_amount'] = isset($row['maximum_discount_amount']) && $row['maximum_discount_amount'] !== null
        ? (float)$row['maximum_discount_amount']
        : null;
    $row['is_active'] = !empty($row['is_active']);
    $row['total_usage_limit'] = isset($row['total_usage_limit']) && $row['total_usage_limit'] !== null
        ? (int)$row['total_usage_limit']
        : null;
    $row['per_user_limit'] = isset($row['per_user_limit']) && $row['per_user_limit'] !== null
        ? (int)$row['per_user_limit']
        : null;
    $row['new_customers_only'] = !empty($row['new_customers_only']);
    $row['is_stackable'] = !empty($row['is_stackable']);
    $row['usage_count'] = (int)($row['usage_count'] ?? 0);
    $row['restricted_products'] = couponDecodeJsonList($row['restricted_products_json'] ?? []);
    $row['restricted_categories'] = couponDecodeJsonList($row['restricted_categories_json'] ?? []);
    $row['starts_at'] = couponNormalizeDateValue($row['starts_at'] ?? null);
    $row['ends_at'] = couponNormalizeDateValue($row['ends_at'] ?? null);
    $row['code'] = couponNormalizeCode($row['code'] ?? '');

    return $row;
}

function couponResolveUserContext(PDO $db, ?array $authPayload = null, $guestEmail = '')
{
    $userId = isset($authPayload['id']) ? (int)$authPayload['id'] : null;
    $email = trim((string)($authPayload['email'] ?? $guestEmail));

    if (!$userId && $email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $stmt = $db->prepare("SELECT id, email FROM users WHERE email = ? LIMIT 1");
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        if ($user) {
            $userId = (int)$user['id'];
            $email = (string)$user['email'];
        }
    }

    $isNewCustomer = true;
    if ($userId) {
        $stmt = $db->prepare("SELECT COUNT(*) AS c FROM orders WHERE user_id = ? AND status IN ('pending', 'processing', 'completed')");
        $stmt->execute([$userId]);
        $isNewCustomer = ((int)($stmt->fetch()['c'] ?? 0)) === 0;
    }

    return [
        'user_id' => $userId ?: null,
        'email' => $email !== '' ? $email : null,
        'is_new_customer' => $isNewCustomer
    ];
}

function couponResolveCartLines(PDO $db, array $items)
{
    if (!is_array($items) || count($items) < 1) {
        throw new CouponValidationException('Sepette ürün bulunmuyor.');
    }

    require_once __DIR__ . '/CurrencyService.php';

    $resolved = [];
    foreach ($items as $item) {
        $productId = isset($item['product_id']) ? (int)$item['product_id'] : 0;
        $productKey = trim((string)($item['product_key'] ?? ''));
        $quantity = max(1, (int)($item['quantity'] ?? 1));

        // Danışmanlık hizmeti — products tablosunda DEĞİL, consultant_services'te.
        // product_key formatı: consultant-service-{consultant_services.id}
        if (strpos($productKey, 'consultant-service-') === 0) {
            $svcId = (int)substr($productKey, strlen('consultant-service-'));
            $svcStmt = $db->prepare("SELECT id, title, price, currency FROM consultant_services WHERE id = ?");
            $svcStmt->execute([$svcId]);
            $svc = $svcStmt->fetch();
            if (!$svc) {
                throw new CouponValidationException('Danışmanlık hizmeti bulunamadı.');
            }
            // order_items.product_id FK'sı için generic "Danışmanlık Randevusu" ürünü
            $anchor = $db->query("SELECT id FROM products WHERE product_key = 'consultant-booking' LIMIT 1")->fetch();
            if (!$anchor) {
                throw new CouponValidationException('Danışmanlık ödeme yapılandırması eksik.');
            }
            $svcCurrency = (string)($svc['currency'] ?? 'TRY');
            $svcUnitTry = (float)$svc['price'];
            if ($svcCurrency === 'USD') {
                $info = getCurrentUsdTryRate($db);
                $svcUnitTry = round((float)$svc['price'] * (float)$info['rate'], 2);
            }
            $resolved[] = [
                'product_id' => (int)$anchor['id'],
                'product_key' => $productKey,
                'product_name' => (string)$svc['title'],
                'category' => 'danismanlik',
                'currency' => 'TRY',
                'original_currency' => $svcCurrency,
                'quantity' => $quantity,
                'unit_price' => $svcUnitTry,
                'total_price' => $svcUnitTry * $quantity,
            ];
            continue;
        }

        $product = null;
        if ($productId > 0) {
            $stmt = $db->prepare("SELECT id, product_key, name, price, currency, category FROM products WHERE id = ? AND is_active = 1 LIMIT 1");
            $stmt->execute([$productId]);
            $product = $stmt->fetch();
        } elseif ($productKey !== '') {
            $stmt = $db->prepare("SELECT id, product_key, name, price, currency, category FROM products WHERE product_key = ? AND is_active = 1 LIMIT 1");
            $stmt->execute([$productKey]);
            $product = $stmt->fetch();
        }

        if (!$product) {
            throw new CouponValidationException('Bu sepette geçerli değil');
        }

        // Sepet/checkout TRY üzerinden hesaplanır — USD ürünler kurla çevrilir.
        $originalCurrency = (string)($product['currency'] ?? 'TRY');
        $unitPriceTry = (float)$product['price'];
        if ($originalCurrency === 'USD') {
            $info = getCurrentUsdTryRate($db);
            $unitPriceTry = round((float)$product['price'] * (float)$info['rate'], 2);
        }
        $totalPrice = $unitPriceTry * $quantity;

        $resolved[] = [
            'product_id' => (int)$product['id'],
            'product_key' => (string)$product['product_key'],
            'product_name' => (string)$product['name'],
            'category' => trim((string)($product['category'] ?? '')),
            'currency' => 'TRY', // Sepet hep TRY
            'original_currency' => $originalCurrency,
            'quantity' => $quantity,
            'unit_price' => $unitPriceTry,
            'total_price' => $totalPrice
        ];
    }

    return $resolved;
}

function couponCartSummary(array $cartLines)
{
    $subtotal = 0.0;
    $currency = 'TRY';

    foreach ($cartLines as $line) {
        $subtotal += (float)$line['total_price'];
        $currency = (string)($line['currency'] ?? $currency);
    }

    return [
        'subtotal' => round($subtotal, 2),
        'currency' => $currency,
        'shipping' => 0.0,
        'tax' => 0.0
    ];
}

function couponCalculateDiscountAmount(array $coupon, $subtotal)
{
    $discount = 0.0;

    if (($coupon['discount_type'] ?? 'percentage') === 'fixed') {
        $discount = (float)$coupon['discount_value'];
    } else {
        $discount = round(((float)$subtotal * (float)$coupon['discount_value']) / 100, 2);
        if ($coupon['maximum_discount_amount'] !== null) {
            $discount = min($discount, (float)$coupon['maximum_discount_amount']);
        }
    }

    return max(0, min(round($discount, 2), round((float)$subtotal, 2)));
}

function couponMatchesCartRestrictions(array $coupon, array $cartLines)
{
    $restrictedProducts = array_map('intval', $coupon['restricted_products'] ?? []);
    $restrictedCategories = array_map(
        function ($value) { return strtolower(trim((string)$value)); },
        $coupon['restricted_categories'] ?? []
    );

    if (count($restrictedProducts) === 0 && count($restrictedCategories) === 0) {
        return true;
    }

    foreach ($cartLines as $line) {
        if (count($restrictedProducts) > 0 && in_array((int)$line['product_id'], $restrictedProducts, true)) {
            return true;
        }

        if (count($restrictedCategories) > 0) {
            $category = strtolower(trim((string)($line['category'] ?? '')));
            if ($category !== '' && in_array($category, $restrictedCategories, true)) {
                return true;
            }
        }
    }

    return false;
}

function couponEvaluateEligibility(array $coupon, array $cartSummary, array $cartLines, array $usageContext)
{
    $now = new DateTimeImmutable('now');

    if (!$coupon['is_active']) {
        throw new CouponValidationException('Bu kupon henüz aktif değil');
    }

    if (!empty($coupon['starts_at'])) {
        $startsAt = new DateTimeImmutable($coupon['starts_at']);
        if ($startsAt > $now) {
            throw new CouponValidationException('Bu kupon henüz aktif değil');
        }
    }

    if (!empty($coupon['ends_at'])) {
        $endsAt = new DateTimeImmutable($coupon['ends_at']);
        if ($endsAt < $now) {
            throw new CouponValidationException('Kupon süresi dolmuş');
        }
    }

    if ($coupon['total_usage_limit'] !== null && $coupon['usage_count'] >= $coupon['total_usage_limit']) {
        throw new CouponValidationException('Bu kuponun kullanım limiti doldu');
    }

    if (
        $coupon['per_user_limit'] !== null &&
        !empty($usageContext['user_usage_count']) &&
        (int)$usageContext['user_usage_count'] >= (int)$coupon['per_user_limit']
    ) {
        throw new CouponValidationException('Bu kuponu kullanım hakkınız doldu');
    }

    if ((float)$cartSummary['subtotal'] < (float)$coupon['minimum_cart_amount']) {
        throw new CouponValidationException('Minimum sepet tutarı sağlanmadı');
    }

    if (!couponMatchesCartRestrictions($coupon, $cartLines)) {
        throw new CouponValidationException('Bu sepette geçerli değil');
    }

    if (!empty($coupon['new_customers_only']) && empty($usageContext['is_new_customer'])) {
        throw new CouponValidationException('Bu kupon sadece yeni müşteriler için geçerlidir');
    }
}

function couponFindByCode(PDO $db, $code, $lock = false)
{
    $normalizedCode = couponNormalizeCode($code);
    if ($normalizedCode === '') {
        throw new CouponValidationException('Kupon bulunamadı');
    }

    $sql = "SELECT * FROM coupons WHERE code = ? LIMIT 1";
    if ($lock) {
        $sql .= " FOR UPDATE";
    }

    $stmt = $db->prepare($sql);
    $stmt->execute([$normalizedCode]);
    $row = $stmt->fetch();

    if (!$row) {
        throw new CouponValidationException('Kupon bulunamadı');
    }

    return couponHydrateRow($row);
}

function couponGetUserUsageCount(PDO $db, $couponId, $userId = null)
{
    if (!$userId) {
        return 0;
    }

    $stmt = $db->prepare("SELECT COUNT(*) AS c FROM coupon_usages WHERE coupon_id = ? AND user_id = ? AND status = 'used'");
    $stmt->execute([(int)$couponId, (int)$userId]);
    return (int)($stmt->fetch()['c'] ?? 0);
}

function couponBuildPricingPreview(PDO $db, array $items, $couponCode = '', ?array $authPayload = null, $guestEmail = '', $lockCoupon = false)
{
    ensureCouponSchema($db);

    $cartLines = couponResolveCartLines($db, $items);
    $summary = couponCartSummary($cartLines);
    $userContext = couponResolveUserContext($db, $authPayload, $guestEmail);

    $coupon = null;
    $discountAmount = 0.0;

    if (trim((string)$couponCode) !== '') {
        $coupon = couponFindByCode($db, $couponCode, $lockCoupon);
        $userUsageCount = couponGetUserUsageCount($db, $coupon['id'], $userContext['user_id']);
        couponEvaluateEligibility($coupon, $summary, $cartLines, [
            'user_id' => $userContext['user_id'],
            'user_usage_count' => $userUsageCount,
            'is_new_customer' => $userContext['is_new_customer']
        ]);
        $discountAmount = couponCalculateDiscountAmount($coupon, $summary['subtotal']);
    }

    // KDV HARİÇ fiyat modeli: ürün fiyatları net, KDV indirimden SONRA eklenir (Türkiye standardı)
    // prices_include_vat='1' (eski model) ise KDV eklenmez — fiyatlar zaten dahil sayılır
    $pricesIncludeVat = (string)getSetting($db, 'prices_include_vat', '0') === '1';
    $vatRate = (float)getSetting($db, 'default_vat_rate', '20') / 100;
    $taxBase = max(0, $summary['subtotal'] - $discountAmount + $summary['shipping']);
    $tax = $pricesIncludeVat ? 0.0 : round($taxBase * $vatRate, 2);

    $total = max(0, round($taxBase + $tax, 2));

    return [
        'items' => $cartLines,
        'subtotal' => round($summary['subtotal'], 2),
        'discount' => round($discountAmount, 2),
        'shipping' => round($summary['shipping'], 2),
        'tax' => $tax,
        'total' => $total,
        'currency' => $summary['currency'],
        'applied_coupon' => $coupon ? [
            'id' => $coupon['id'],
            'name' => (string)$coupon['name'],
            'code' => (string)$coupon['code'],
            'description' => (string)($coupon['description'] ?? ''),
            'discount_type' => (string)$coupon['discount_type'],
            'discount_value' => (float)$coupon['discount_value'],
            'maximum_discount_amount' => $coupon['maximum_discount_amount'],
            'is_stackable' => (bool)$coupon['is_stackable']
        ] : null
    ];
}

function couponReserveUsage(PDO $db, array $coupon, $userId, $orderId, $discountAmount)
{
    if (empty($coupon['id']) || $discountAmount <= 0) {
        return;
    }

    $stmt = $db->prepare("UPDATE coupons SET usage_count = usage_count + 1 WHERE id = ?");
    $stmt->execute([(int)$coupon['id']]);

    $stmt = $db->prepare(
        "INSERT INTO coupon_usages (coupon_id, user_id, order_id, discount_amount, status)
         VALUES (?, ?, ?, ?, 'used')"
    );
    $stmt->execute([
        (int)$coupon['id'],
        $userId ? (int)$userId : null,
        (int)$orderId,
        round((float)$discountAmount, 2)
    ]);
}

function couponReleaseUsageForOrder(PDO $db, $orderId)
{
    ensureCouponSchema($db);

    $stmt = $db->prepare(
        "SELECT cu.id, cu.coupon_id
         FROM coupon_usages cu
         WHERE cu.order_id = ? AND cu.status = 'used'
         LIMIT 1
         FOR UPDATE"
    );
    $stmt->execute([(int)$orderId]);
    $usage = $stmt->fetch();

    if (!$usage) {
        return false;
    }

    $stmt = $db->prepare("UPDATE coupon_usages SET status = 'released', released_at = NOW() WHERE id = ?");
    $stmt->execute([(int)$usage['id']]);

    $stmt = $db->prepare(
        "UPDATE coupons
         SET usage_count = CASE WHEN usage_count > 0 THEN usage_count - 1 ELSE 0 END
         WHERE id = ?"
    );
    $stmt->execute([(int)$usage['coupon_id']]);

    return true;
}
