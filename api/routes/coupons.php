<?php

require_once __DIR__ . '/../services/CouponService.php';

$db = Database::getInstance();
ensureCouponSchema($db);
$payload = optionalAuth();

if ($method === 'POST' && $action === 'validate') {
    $data = getJsonBody();
    $code = (string)($data['code'] ?? '');
    $items = $data['items'] ?? [];
    $guestEmail = trim((string)($data['guest_email'] ?? ''));

    if (!is_array($items) || count($items) < 1) {
        sendResponse(['error' => 'Sepette ürün bulunmuyor.'], 400);
    }

    try {
        $preview = couponBuildPricingPreview($db, $items, $code, $payload, $guestEmail, false);
        sendResponse([
            'message' => 'Kupon uygulandı',
            'pricing' => $preview
        ]);
    } catch (CouponValidationException $e) {
        sendResponse(['error' => $e->getMessage()], 400);
    } catch (Throwable $e) {
        sendResponse(['error' => 'Kupon doğrulama başarısız.'], 500);
    }
}

sendResponse(['error' => 'Action not found'], 404);
