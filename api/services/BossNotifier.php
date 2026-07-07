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

function bossNotify(PDO $db, string $title, string $message, array $data = []): void
{
    $appId = (string)getSetting($db, 'onesignal_app_id', '');
    $restApiKey = (string)getSetting($db, 'onesignal_rest_api_key', '');
    if ($appId === '' || $restApiKey === '') return;

    $payload = [
        'app_id' => $appId,
        'included_segments' => ['Subscribed Users'],
        'headings' => ['en' => $title, 'tr' => $title],
        'contents' => ['en' => $message, 'tr' => $message],
    ];
    if (!empty($data)) {
        $payload['data'] = $data;
    }

    $ch = curl_init('https://onesignal.com/api/v1/notifications');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE),
        CURLOPT_HTTPHEADER => [
            'Authorization: Basic ' . $restApiKey,
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
        return;
    }
    if ($code >= 400) {
        error_log('[boss-notify] OneSignal HTTP ' . $code . ': ' . substr((string)$resp, 0, 300));
    }
}
