<?php
// api/services/BossNotifier.php
//
// Boss Panel (boss.khilonfast.com) için anlık push bildirimi — OneSignal REST API.
// Kendi VAPID/Web-Push kriptografimizi yazmak yerine OneSignal kullanılıyor (bkz.
// proje planı) — abone cihaz kaydı OneSignal tarafında tutulur, biz sadece
// "Subscribed Users" segmentine gönderiyoruz (tek kullanıcı/birkaç cihaz için yeterli).
//
// sendTransactionalEmail() ile aynı desen: ayar boşsa sessizce return, hata durumunda
// sadece error_log — çağıran tarafı ASLA bloklamaz. Her çağrı noktasında try/catch
// içine alınmalıdır (bkz. invoiceSendAdminSaleNotification çağrıları).

// Dönüş değeri sadece test-notify endpoint'i gibi teşhis amaçlı çağıranlar için —
// hook noktaları (payment.php vb.) dönüşü kullanmaz, sessiz-başarısız kalmaya devam eder.
function bossNotify(PDO $db, string $title, string $message, array $data = []): array
{
    $appId = (string)getSetting($db, 'onesignal_app_id', '');
    $restApiKey = (string)getSetting($db, 'onesignal_rest_api_key', '');
    if ($appId === '' || $restApiKey === '') {
        return ['ok' => false, 'reason' => 'onesignal_app_id veya onesignal_rest_api_key ayarlı değil'];
    }

    $payload = [
        'app_id' => $appId,
        'target_channel' => 'push',
        // "included_segments: Subscribed Users" bu hesapta API üzerinden hep
        // "All included players are not subscribed" veriyordu (dashboard'dan manuel
        // gönderim farklı bir mekanizma kullandığı için çalışıyordu). Filtre tabanlı
        // hedefleme (tüm gerçek push subscription kayıtlarını doğrudan sorgular,
        // önceden hesaplanmış segment'e bağımlı değildir) test edilip ÇALIŞTIĞI
        // doğrulandı — kalıcı çözüm bu.
        'filters' => [['field' => 'last_session', 'relation' => '>', 'value' => '0']],
        'headings' => ['en' => $title, 'tr' => $title],
        'contents' => ['en' => $message, 'tr' => $message],
    ];
    if (!empty($data)) {
        $payload['data'] = $data;
    }

    // Eski endpoint (onesignal.com/api/v1/notifications) yeni tip (v16 SDK) abonelikleri
    // doğru tanımıyordu — dashboard'dan manuel gönderim çalışıyordu ama bu endpoint üzerinden
    // "All included players are not subscribed" hatası alınıyordu. Güncel endpoint bu.
    $ch = curl_init('https://api.onesignal.com/notifications');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE),
        CURLOPT_HTTPHEADER => [
            // OneSignal'ın güncel REST API'si "Basic" değil "Key" şeması bekliyor
            // (özellikle os_v2_app_ ile başlayan yeni scoped key'lerde) — eski "Basic"
            // formatı sessizce reddediliyordu, try/catch içinde olduğu için hiç
            // görünmüyordu ("test bildirimi basınca bir şey olmuyor" şikayeti buradan).
            'Authorization: Key ' . $restApiKey,
            'Content-Type: application/json',
            'Accept: application/json'
        ],
        CURLOPT_TIMEOUT => 15
    ]);
    $resp = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);

    if ($resp === false) {
        error_log('[boss-notify] curl error: ' . $err);
        return ['ok' => false, 'reason' => 'curl error: ' . $err];
    }
    $decoded = json_decode((string)$resp, true);
    if ($code >= 400) {
        error_log('[boss-notify] OneSignal HTTP ' . $code . ': ' . substr((string)$resp, 0, 300));
        return ['ok' => false, 'reason' => 'OneSignal HTTP ' . $code, 'response' => $decoded];
    }
    // HTTP 200 dönse bile OneSignal "errors" alanında sorun bildirebilir — en yaygını
    // hiçbir cihazın push'a abone olmaması ("All included players are not subscribed").
    // Bunu da başarısız say ki test-notify butonunda görünür olsun.
    if (!empty($decoded['errors'])) {
        $reason = is_array($decoded['errors']) ? implode(', ', $decoded['errors']) : (string)$decoded['errors'];
        error_log('[boss-notify] OneSignal errors: ' . $reason);
        return ['ok' => false, 'reason' => $reason, 'response' => $decoded];
    }
    return ['ok' => true, 'response' => $decoded];
}
