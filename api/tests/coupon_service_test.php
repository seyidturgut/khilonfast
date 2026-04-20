<?php

require_once __DIR__ . '/../services/CouponService.php';

function assertTrue($condition, $message)
{
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

function expectValidationError(callable $callback, $expectedMessage)
{
    try {
        $callback();
    } catch (CouponValidationException $e) {
        assertTrue($e->getMessage() === $expectedMessage, "Beklenen hata '{$expectedMessage}', gelen '{$e->getMessage()}'");
        return;
    }

    throw new RuntimeException("Beklenen hata oluşmadı: {$expectedMessage}");
}

$baseCoupon = couponHydrateRow([
    'id' => 1,
    'name' => 'Bahar',
    'code' => 'BAHAR10',
    'discount_type' => 'percentage',
    'discount_value' => 10,
    'minimum_cart_amount' => 1000,
    'maximum_discount_amount' => 250,
    'starts_at' => date('Y-m-d H:i:s', strtotime('-1 day')),
    'ends_at' => date('Y-m-d H:i:s', strtotime('+1 day')),
    'is_active' => 1,
    'total_usage_limit' => 10,
    'per_user_limit' => 1,
    'restricted_products_json' => json_encode([10]),
    'restricted_categories_json' => json_encode(['egitimler']),
    'new_customers_only' => 0,
    'is_stackable' => 0,
    'usage_count' => 0
]);

$cartLines = [[
    'product_id' => 10,
    'category' => 'egitimler',
    'total_price' => 1500
]];
$cartSummary = [
    'subtotal' => 1500,
    'shipping' => 0,
    'tax' => 0,
    'currency' => 'TRY'
];

couponEvaluateEligibility($baseCoupon, $cartSummary, $cartLines, [
    'user_usage_count' => 0,
    'is_new_customer' => true
]);
assertTrue(couponCalculateDiscountAmount($baseCoupon, 1500) === 150.0, 'Geçerli kupon indirimi yanlış hesaplandı.');

$expiredCoupon = $baseCoupon;
$expiredCoupon['ends_at'] = date('Y-m-d H:i:s', strtotime('-1 hour'));
expectValidationError(fn() => couponEvaluateEligibility($expiredCoupon, $cartSummary, $cartLines, [
    'user_usage_count' => 0,
    'is_new_customer' => true
]), 'Kupon süresi dolmuş');

$usageLimitedCoupon = $baseCoupon;
$usageLimitedCoupon['usage_count'] = 10;
expectValidationError(fn() => couponEvaluateEligibility($usageLimitedCoupon, $cartSummary, $cartLines, [
    'user_usage_count' => 0,
    'is_new_customer' => true
]), 'Bu kuponun kullanım limiti doldu');

$lowSubtotalSummary = $cartSummary;
$lowSubtotalSummary['subtotal'] = 500;
expectValidationError(fn() => couponEvaluateEligibility($baseCoupon, $lowSubtotalSummary, $cartLines, [
    'user_usage_count' => 0,
    'is_new_customer' => true
]), 'Minimum sepet tutarı sağlanmadı');

expectValidationError(fn() => couponEvaluateEligibility($baseCoupon, $cartSummary, $cartLines, [
    'user_usage_count' => 1,
    'is_new_customer' => true
]), 'Bu kuponu kullanım hakkınız doldu');

$wrongCart = [[
    'product_id' => 99,
    'category' => 'hizmetler',
    'total_price' => 1500
]];
expectValidationError(fn() => couponEvaluateEligibility($baseCoupon, $cartSummary, $wrongCart, [
    'user_usage_count' => 0,
    'is_new_customer' => true
]), 'Bu sepette geçerli değil');

$newCustomerCoupon = $baseCoupon;
$newCustomerCoupon['new_customers_only'] = true;
expectValidationError(fn() => couponEvaluateEligibility($newCustomerCoupon, $cartSummary, $cartLines, [
    'user_usage_count' => 0,
    'is_new_customer' => false
]), 'Bu kupon sadece yeni müşteriler için geçerlidir');

echo "coupon_service_test: OK\n";
