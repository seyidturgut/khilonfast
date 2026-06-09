<?php
/**
 * api/sync_calendar.php
 *
 * iCal Takvim Senkronizasyon Scripti
 *
 * 2 modda çalışır:
 *   1) Standalone (cPanel cron): php /path/to/api/sync_calendar.php
 *   2) Include (admin.php'den manuel tetikleme): require_once + syncConsultant($id, $db)
 */

// ─── Standalone cron modu ───────────────────────────────────────────────────
if (basename(__FILE__) === basename($_SERVER['SCRIPT_FILENAME'] ?? '')) {
    define('ICAL_STANDALONE', true);
    require_once __DIR__ . '/config/config.php';
    require_once __DIR__ . '/config/db.php';
    require_once __DIR__ . '/utils.php';

    $db = Database::getInstance();
    icalSyncAll($db);
    exit;
}
// ─── Include modu — sadece fonksiyon tanımları yüklenir ────────────────────

/**
 * Tüm aktif danışmanların takvimlerini senkronize et
 */
function icalSyncAll(PDO $db): void
{
    $stmt = $db->prepare(
        "SELECT id, name, ical_url FROM consultants
         WHERE ical_sync_enabled = 1 AND ical_url IS NOT NULL AND ical_url != '' AND is_active = 1"
    );
    $stmt->execute();
    $consultants = $stmt->fetchAll();

    foreach ($consultants as $c) {
        $result = syncConsultant((int)$c['id'], $db, $c['ical_url']);
        error_log("[ical_sync] {$c['name']} (id={$c['id']}): {$result['added']} eklendi, {$result['removed']} silindi");
    }
}

/**
 * consultant_ical_busy tablosunu garanti et (idempotent).
 * iCal'den gelen MEŞGUL (busy) aralıklar burada tutulur — manuel müsaitlikten AYRI.
 */
function ensureIcalBusyTable(PDO $db): void
{
    $db->exec("CREATE TABLE IF NOT EXISTS consultant_ical_busy (
        id INT AUTO_INCREMENT PRIMARY KEY,
        consultant_id INT NOT NULL,
        start_at DATETIME NOT NULL,
        end_at DATETIME NOT NULL,
        summary VARCHAR(255) DEFAULT NULL,
        synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_consultant_start (consultant_id, start_at),
        INDEX idx_end (end_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
}

/**
 * Tek bir danışmanı senkronize et — GÜVENLİ MOD.
 *
 * DAVRANIŞ (A + B):
 *  - (A) consultant_availability'e (manuel müsaitliklere) ASLA DOKUNMAZ — hiçbir slot silinmez/eklenmez.
 *  - (B) iCal'deki etkinlikler MEŞGULIYET olarak consultant_ical_busy tablosuna yazılır.
 *        Slot üretimi (generateSlotsForService) bu meşgul aralıklara denk gelen slotları gizler.
 *  - iCal erişilemez/boş/hatalıysa HİÇBİR ŞEY değiştirmez (eski busy kayıtları korunur).
 *
 * @return array{added: int, removed: int, busy: int, error?: string, message?: string}
 */
function syncConsultant(int $consultantId, PDO $db, ?string $icalUrlOverride = null): array
{
    $stmt = $db->prepare("SELECT id, name, ical_url FROM consultants WHERE id = ?");
    $stmt->execute([$consultantId]);
    $consultant = $stmt->fetch();
    if (!$consultant) {
        return ['added' => 0, 'removed' => 0, 'busy' => 0, 'error' => 'Consultant not found'];
    }

    $icalUrl = $icalUrlOverride ?? $consultant['ical_url'];
    if (!$icalUrl) {
        return ['added' => 0, 'removed' => 0, 'busy' => 0, 'error' => 'iCal URL tanımlanmamış'];
    }

    // .ics dosyasını çek — başarısızsa hiçbir şeyi değiştirme.
    $icsContent = fetchIcalUrl($icalUrl);
    if ($icsContent === false || trim($icsContent) === '') {
        return ['added' => 0, 'removed' => 0, 'busy' => 0,
                'error' => 'iCal URL erişilemez veya boş. URL\'nin herkese açık (public) olduğundan emin olun. (Mevcut müsaitlikler ve meşgul kayıtları korundu.)'];
    }

    $events = parseIcalEvents($icsContent);

    // Gelecek (bugün ve sonrası biten) meşgul aralıkları topla
    $today = new DateTime('today', new DateTimeZone('Europe/Istanbul'));
    $busyRows = [];
    foreach ($events as $event) {
        if (!$event['start'] || !$event['end']) continue;
        if ($event['end'] < $today) continue; // tamamen geçmiş — atla
        $busyRows[] = [
            $event['start']->format('Y-m-d H:i:s'),
            $event['end']->format('Y-m-d H:i:s'),
            substr((string)($event['summary'] ?? ''), 0, 255),
        ];
    }

    ensureIcalBusyTable($db);

    // Sadece consultant_ical_busy tablosunu güncelle — consultant_availability'e DOKUNMA (A).
    $db->beginTransaction();
    try {
        // Bu danışmanın gelecek meşgul kayıtlarını tazele (geçmişe dokunma)
        $db->prepare("DELETE FROM consultant_ical_busy WHERE consultant_id = ? AND end_at >= NOW()")
           ->execute([$consultantId]);
        $ins = $db->prepare("INSERT INTO consultant_ical_busy (consultant_id, start_at, end_at, summary) VALUES (?, ?, ?, ?)");
        foreach ($busyRows as $r) {
            $ins->execute([$consultantId, $r[0], $r[1], $r[2]]);
        }
        $db->commit();
    } catch (Throwable $e) {
        if ($db->inTransaction()) $db->rollBack();
        return ['added' => 0, 'removed' => 0, 'busy' => 0, 'error' => 'Meşgul aralıklar kaydedilemedi: ' . $e->getMessage()];
    }

    $db->prepare("UPDATE consultants SET ical_last_sync = NOW() WHERE id = ?")->execute([$consultantId]);

    $busyCount = count($busyRows);
    return [
        'added' => 0,
        'removed' => 0,
        'busy' => $busyCount,
        'message' => $busyCount . ' meşgul aralık takvimden alındı. Bu saatler rezervasyona kapatıldı. Manuel müsaitlikleriniz korundu.'
    ];
}

/**
 * .ics URL'sini çek — cURL önce (allow_url_fopen kapalı olsa bile çalışır),
 * cURL yoksa file_get_contents fallback.
 */
function fetchIcalUrl(string $url): string|false
{
    if (function_exists('curl_init')) {
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL            => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS      => 5,
            CURLOPT_TIMEOUT        => 15,
            CURLOPT_USERAGENT      => 'KhilonFast-iCalSync/1.0',
            CURLOPT_SSL_VERIFYPEER => true,
        ]);
        $body = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        // curl_close PHP 8.0+ no-op (8.5'te deprecated) — çağrılmıyor

        if ($body !== false && $httpCode >= 200 && $httpCode < 300) {
            return $body;
        }
        return false;
    }

    // cURL yoksa file_get_contents dene
    $context = stream_context_create([
        'http'  => ['timeout' => 15, 'user_agent' => 'KhilonFast-iCalSync/1.0', 'ignore_errors' => true],
        'https' => ['timeout' => 15, 'user_agent' => 'KhilonFast-iCalSync/1.0', 'ignore_errors' => true],
    ]);
    return @file_get_contents($url, false, $context);
}

/**
 * .ics içeriğinden VEVENT dizisi döndür
 * Her eleman: ['start' => DateTime|null, 'end' => DateTime|null, 'summary' => string]
 *
 * @return array<int, array{start: ?DateTime, end: ?DateTime, summary: string}>
 */
function parseIcalEvents(string $icsContent): array
{
    // Satır katlamayı (line folding) düzelt — RFC 5545
    $icsContent = preg_replace("/\r\n[ \t]/", '', $icsContent);
    $icsContent = preg_replace("/\n[ \t]/", '', $icsContent);

    $events  = [];
    $inEvent = false;
    $current = [];

    $lines = preg_split('/\r\n|\r|\n/', $icsContent);

    foreach ($lines as $line) {
        $line = rtrim($line);

        if ($line === 'BEGIN:VEVENT') {
            $inEvent = true;
            $current = ['start' => null, 'end' => null, 'summary' => '', 'status' => ''];
            continue;
        }

        if ($line === 'END:VEVENT') {
            $inEvent = false;
            // İptal edilmiş eventleri atla
            if (strtoupper($current['status']) !== 'CANCELLED') {
                $events[] = $current;
            }
            continue;
        }

        if (!$inEvent) continue;

        // property:value veya property;param=val:value
        $colonPos = strpos($line, ':');
        if ($colonPos === false) continue;

        $propFull = substr($line, 0, $colonPos);
        $value    = substr($line, $colonPos + 1);

        // Property adı (parametrelerden önce)
        $semicolonPos = strpos($propFull, ';');
        $propName     = $semicolonPos !== false ? substr($propFull, 0, $semicolonPos) : $propFull;
        $params       = $semicolonPos !== false ? substr($propFull, $semicolonPos + 1) : '';

        switch (strtoupper($propName)) {
            case 'DTSTART':
                $current['start'] = parseIcalDateTime($value, $params);
                break;
            case 'DTEND':
                $current['end'] = parseIcalDateTime($value, $params);
                break;
            case 'SUMMARY':
                $current['summary'] = $value;
                break;
            case 'STATUS':
                $current['status'] = $value;
                break;
        }
    }

    return $events;
}

/**
 * iCal tarih/saat değerini DateTime'a çevir
 * Desteklenen formatlar:
 *   - YYYYMMDD            (tüm gün — 00:00:00 local)
 *   - YYYYMMDDTHHMMSS     (lokal)
 *   - YYYYMMDDTHHMMSSZ    (UTC)
 * Params:
 *   - TZID=Europe/Istanbul  → verilen timezone ile parse et
 */
function parseIcalDateTime(string $value, string $params = ''): ?DateTime
{
    $tz = new DateTimeZone('Europe/Istanbul');

    // TZID parametresini çıkar
    if (preg_match('/TZID=([^;:]+)/i', $params, $m)) {
        try {
            $tz = new DateTimeZone($m[1]);
        } catch (Exception $e) {
            $tz = new DateTimeZone('Europe/Istanbul');
        }
    }

    $value = trim($value);

    // UTC: YYYYMMDDTHHMMSSZ
    if (preg_match('/^(\d{8})T(\d{6})Z$/', $value, $m)) {
        $dt = DateTime::createFromFormat('Ymd\THis', $m[1] . 'T' . $m[2], new DateTimeZone('UTC'));
        if ($dt) $dt->setTimezone(new DateTimeZone('Europe/Istanbul'));
        return $dt ?: null;
    }

    // Local datetime: YYYYMMDDTHHMMSS
    if (preg_match('/^(\d{8})T(\d{6})$/', $value, $m)) {
        return DateTime::createFromFormat('Ymd\THis', $m[1] . 'T' . $m[2], $tz) ?: null;
    }

    // All-day date: YYYYMMDD
    if (preg_match('/^(\d{8})$/', $value, $m)) {
        return DateTime::createFromFormat('Ymd', $m[1], $tz) ?: null;
    }

    return null;
}
