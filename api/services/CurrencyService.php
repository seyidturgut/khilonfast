<?php
// api/services/CurrencyService.php
// USD/TRY kur servisi (PHP versiyonu — Node muadili: currencyService.js).
// - Birincil kaynak: TCMB günlük XML feed (USD ForexSelling — resmi efektif satış).
// - Manuel rate settings tablosunda `usd_try_rate` olarak tutulur.
// - usd_try_rate_auto_update=true ise 24 saatten eski olduğunda TCMB'den otomatik
//   tazelenir. API erişilemezse mevcut manuel değer kullanılır.
// - Order oluşturulurken o anki rate orders.usd_try_rate_used'a kilitlenir.

const TCMB_URL = 'https://www.tcmb.gov.tr/kurlar/today.xml';
const USD_TRY_STALE_AFTER_SEC = 24 * 60 * 60;

function currencyReadSettings(PDO $db): array
{
    $stmt = $db->query(
        "SELECT setting_key, setting_value FROM settings
         WHERE setting_key IN ('usd_try_rate','usd_try_rate_updated_at','usd_try_rate_source','usd_try_rate_auto_update')"
    );
    $out = [];
    foreach ($stmt->fetchAll() as $row) {
        $out[$row['setting_key']] = $row['setting_value'];
    }
    return $out;
}

function currencyWriteRate(PDO $db, float $rate, string $source): void
{
    // settings tablosu setting_group NOT NULL → 'currency' grubu kullanılır
    $now = (new DateTimeImmutable('now', new DateTimeZone('UTC')))->format(DateTimeImmutable::ATOM);
    $stmt = $db->prepare(
        "INSERT INTO settings (setting_key, setting_value, setting_group)
         VALUES (?, ?, 'currency')
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)"
    );
    $stmt->execute(['usd_try_rate', number_format($rate, 4, '.', '')]);
    $stmt->execute(['usd_try_rate_updated_at', $now]);
    $stmt->execute(['usd_try_rate_source', $source]);
}

function currencyFetchFromTcmb(): float
{
    $ch = curl_init(TCMB_URL);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 8,
        CURLOPT_HTTPHEADER => ['User-Agent: khilonfast/1.0', 'Accept: application/xml,text/xml']
    ]);
    $body = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    if ($body === false) throw new Exception('TCMB curl failed: ' . $err);
    if ($code !== 200) throw new Exception('TCMB HTTP ' . $code);

    // libxml hataları içeride tutulsun
    $previous = libxml_use_internal_errors(true);
    try {
        $xml = simplexml_load_string($body);
        if ($xml === false) throw new Exception('TCMB XML parse failed');
        // <Currency Kod="USD">...<ForexSelling>X</ForexSelling>...
        $usd = null;
        foreach ($xml->Currency as $c) {
            if ((string)$c['Kod'] === 'USD') { $usd = $c; break; }
        }
        if ($usd === null) throw new Exception('TCMB USD not found');
        $rate = (float)$usd->ForexSelling;
        if ($rate <= 0) throw new Exception('TCMB rate <= 0');
        return $rate;
    } finally {
        libxml_clear_errors();
        libxml_use_internal_errors($previous);
    }
}

/**
 * Geçerli USD/TRY oranını döndürür.
 * 24 saatten eski + auto_update aktif ise Frankfurter'dan tazeler.
 * Dönüş: ['rate' => float, 'source' => 'manual'|'auto', 'updatedAt' => string|null]
 */
function getCurrentUsdTryRate(PDO $db, bool $forceRefresh = false): array
{
    static $cache = null;
    static $cacheAt = 0;

    $now = time();
    if (!$forceRefresh && $cache !== null && ($now - $cacheAt) < 60) {
        return $cache;
    }

    $settings = currencyReadSettings($db);
    $manualRate = (float)($settings['usd_try_rate'] ?? 0);
    $updatedAtRaw = (string)($settings['usd_try_rate_updated_at'] ?? '');
    $updatedAtTs = $updatedAtRaw ? strtotime($updatedAtRaw) : 0;
    $autoUpdate = strtolower((string)($settings['usd_try_rate_auto_update'] ?? 'true')) === 'true';
    $isStale = !$updatedAtTs || ($now - $updatedAtTs) > USD_TRY_STALE_AFTER_SEC;

    $rate = $manualRate > 0 ? $manualRate : 40.0; // emergency fallback
    $source = (string)($settings['usd_try_rate_source'] ?? 'manual');
    $updatedAt = $updatedAtRaw ?: null;

    if ($forceRefresh || ($autoUpdate && $isStale)) {
        try {
            $fetched = currencyFetchFromTcmb();
            currencyWriteRate($db, $fetched, 'auto');
            $rate = $fetched;
            $source = 'auto';
            $updatedAt = (new DateTimeImmutable('now', new DateTimeZone('UTC')))->format(DateTimeImmutable::ATOM);
        } catch (Throwable $e) {
            error_log('[currency] TCMB fetch failed, using manual rate: ' . $e->getMessage());
        }
    }

    $cache = ['rate' => $rate, 'source' => $source, 'updatedAt' => $updatedAt];
    $cacheAt = $now;
    return $cache;
}

function convertUsdToTry(PDO $db, float $amount): float
{
    $info = getCurrentUsdTryRate($db);
    return round($amount * $info['rate'], 2);
}

/**
 * USD ürünlere ek bir TRY display alanı ekler — orijinal price/currency DEĞİŞTİRİLMEZ.
 * Ürün sayfası USD ($) olarak gösterilir; sepet/checkout `display_price_try` kullanır.
 */
function normalizeProductToTry(PDO $db, array $product): array
{
    if (!isset($product['currency']) || $product['currency'] !== 'USD') {
        return $product;
    }
    $info = getCurrentUsdTryRate($db);
    $rate = (float)$info['rate'];
    // price/currency olduğu gibi (USD) kalır
    $product['display_price_try'] = round((float)$product['price'] * $rate, 2);
    $product['display_currency_try'] = 'TRY';
    $product['usd_try_rate'] = $rate;
    return $product;
}

/**
 * TRY ürünlere ek bir USD display alanı ekler (EN locale için) — orijinal price/currency DEĞİŞTİRİLMEZ.
 * EN dil seçeneği seçilince ürün $ olarak gösterilir; checkout'ta TRY currency ile Lidio'ya iletilir.
 */
function normalizeProductToUsd(PDO $db, array $product): array
{
    if (!isset($product['currency']) || $product['currency'] !== 'TRY') {
        return $product;
    }
    $info = getCurrentUsdTryRate($db);
    $rate = (float)$info['rate'];
    if ($rate <= 0) return $product;
    $product['display_price_usd'] = round((float)$product['price'] / $rate, 2);
    $product['display_currency_usd'] = 'USD';
    $product['usd_try_rate'] = $rate;
    return $product;
}

/**
 * Hem TRY hem USD display alanlarını tek seferde ekler.
 * Frontend locale'a göre uygun olanı kullanır.
 */
function normalizeProductBothCurrencies(PDO $db, array $product): array
{
    return normalizeProductToUsd($db, normalizeProductToTry($db, $product));
}

function setManualUsdTryRate(PDO $db, float $rate): array
{
    if ($rate <= 0) throw new Exception('Geçersiz oran');
    currencyWriteRate($db, $rate, 'manual');
    return getCurrentUsdTryRate($db, true);
}

function setUsdTryAutoUpdate(PDO $db, bool $enabled): void
{
    $stmt = $db->prepare(
        "INSERT INTO settings (setting_key, setting_value, setting_group)
         VALUES (?, ?, 'currency')
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)"
    );
    $stmt->execute(['usd_try_rate_auto_update', $enabled ? 'true' : 'false']);
}
