<?php
/**
 * GA4 Measurement Protocol — sunucu taraflı `purchase` event'i.
 *
 * NEDEN SUNUCU TARAFLI: Sipariş bu projede 5 ayrı yerde 'completed' oluyor
 * (kart callback, admin havale onayı, abonelik yenileme, kupon, ücretsiz sipariş).
 * Bunların çoğu tarayıcıya HİÇ uğramıyor (admin onayı günler sonra, abonelik cron'da).
 * Client-side purchase bu gelirleri tamamen kaçırırdı; ayrıca sayfa yenilemede
 * çift sayardı. Sunucudan gönderim: eksiksiz + idempotent + reklam engelleyiciden bağımsız.
 *
 * IDEMPOTENCY: orders.ga4_purchase_sent_at dolu ise TEKRAR gönderilmez.
 * Bu yüzden fonksiyonu istediğin kadar çağırabilirsin, GA4'e tek purchase gider.
 *
 * AYARLAR (settings tablosu):
 *   ga4_measurement_id  — örn. G-16FR1976GE (varsayılan aşağıda)
 *   ga4_api_secret      — GA4 Yönetici > Veri Akışları > Measurement Protocol API gizli anahtarları
 *   ga4_mp_enabled      — '0' ise gönderim kapalı (varsayılan açık)
 */

if (!function_exists('ga4MpLog')) {
    function ga4MpLog(string $msg): void
    {
        $dir = __DIR__ . '/../logs';
        if (!is_dir($dir)) { @mkdir($dir, 0755, true); }
        @file_put_contents($dir . '/ga4-mp.log', date('c') . ' ' . $msg . "\n", FILE_APPEND | LOCK_EX);
    }
}

/**
 * Siparişin purchase event'ini GA4'e gönderir (bir kez).
 *
 * @return bool true = gönderildi, false = atlandı/başarısız (akışı ASLA bozmaz)
 */
function ga4SendPurchase(PDO $db, int $orderId): bool
{
    try {
        $measurementId = getSetting($db, 'ga4_measurement_id', 'G-16FR1976GE');
        $apiSecret     = getSetting($db, 'ga4_api_secret', '');
        $enabled       = getSetting($db, 'ga4_mp_enabled', '1');

        if ($enabled === '0') { return false; }
        if (!$measurementId || !$apiSecret) {
            ga4MpLog("order=$orderId ATLANDI: ga4_measurement_id veya ga4_api_secret ayarlanmamis");
            return false;
        }

        // --- Idempotency: zaten gönderildiyse çık ---
        $stmt = $db->prepare(
            "SELECT order_number, total_amount, tax_amount, currency, coupon_code,
                    ga_client_id, ga4_purchase_sent_at, status, user_id
             FROM orders WHERE id = ? LIMIT 1"
        );
        $stmt->execute([$orderId]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$order) { ga4MpLog("order=$orderId ATLANDI: siparis bulunamadi"); return false; }
        if (!empty($order['ga4_purchase_sent_at'])) { return false; } // sessizce atla — normal
        if ($order['status'] !== 'completed') {
            ga4MpLog("order=$orderId ATLANDI: status={$order['status']} (completed degil)");
            return false;
        }

        // --- Ürün satırları (isim/kategori için products JOIN) ---
        $stmt = $db->prepare(
            "SELECT oi.quantity, oi.unit_price, p.product_key, p.name, p.category
             FROM order_items oi
             LEFT JOIN products p ON p.id = oi.product_id
             WHERE oi.order_id = ?"
        );
        $stmt->execute([$orderId]);
        $items = [];
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $item = [
                'item_id'   => (string)($row['product_key'] ?: 'unknown'),
                'item_name' => (string)($row['name'] ?: 'unknown'),
                'price'     => (float)$row['unit_price'],
                'quantity'  => (int)($row['quantity'] ?: 1),
            ];
            if (!empty($row['category'])) { $item['item_category'] = (string)$row['category']; }
            $items[] = $item;
        }

        // --- client_id: reklam atfı için kritik ---
        // Yoksa siparişten türetilmiş SABİT bir kimlik kullan (tekrar denemede yeni
        // kullanıcı yaratmasın). Bu durumda GA4'te "direct" görünür — kaynağı
        // gerçekten bilmiyoruz, uydurmak yanlış olurdu; ama GELİR yine de kaydedilir.
        $clientId = $order['ga_client_id'];
        if (!$clientId) {
            $clientId = sprintf('%u.%u', crc32('khilonfast-' . $order['order_number']), 1000000000);
            ga4MpLog("order=$orderId UYARI: ga_client_id yok, sentetik kimlik kullanildi (direct gorunecek)");
        }

        $payload = [
            'client_id' => $clientId,
            'events' => [[
                'name' => 'purchase',
                'params' => array_filter([
                    'transaction_id' => (string)$order['order_number'],
                    'value'          => round((float)$order['total_amount'], 2),
                    'currency'       => strtoupper((string)($order['currency'] ?: 'TRY')),
                    'tax'            => round((float)$order['tax_amount'], 2),
                    'coupon'         => $order['coupon_code'] ?: null,
                    'items'          => $items,
                ], static fn($v) => $v !== null && $v !== ''),
            ]],
        ];
        // Giriş yapmış kullanıcıda cihazlar arası birleştirme için user_id
        if (!empty($order['user_id'])) { $payload['user_id'] = (string)$order['user_id']; }

        $url = 'https://www.google-analytics.com/mp/collect'
             . '?measurement_id=' . rawurlencode($measurementId)
             . '&api_secret=' . rawurlencode($apiSecret);

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => json_encode($payload, JSON_UNESCAPED_UNICODE),
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 8,
        ]);
        $resp = curl_exec($ch);
        $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err  = curl_error($ch);
        curl_close($ch);

        // MP başarıda 204 (gövde boş) döner
        if ($code >= 200 && $code < 300) {
            $db->prepare("UPDATE orders SET ga4_purchase_sent_at = NOW() WHERE id = ?")->execute([$orderId]);
            ga4MpLog("order=$orderId OK gonderildi (tutar={$order['total_amount']} {$order['currency']}, urun=" . count($items) . ")");
            return true;
        }

        ga4MpLog("order=$orderId HATA http=$code curl=$err resp=" . substr((string)$resp, 0, 200));
        return false;
    } catch (Throwable $e) {
        // Analitik ASLA ödeme/sipariş akışını bozmamalı
        ga4MpLog("order=$orderId ISTISNA: " . $e->getMessage());
        return false;
    }
}
