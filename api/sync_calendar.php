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
 * Tek bir danışmanı senkronize et
 * Admin panelinden manuel tetikleme için de kullanılır.
 *
 * @param int    $consultantId
 * @param PDO    $db
 * @param string|null $icalUrlOverride  — Yoksa DB'den alınır
 * @return array{added: int, removed: int, error?: string}
 */
function syncConsultant(int $consultantId, PDO $db, ?string $icalUrlOverride = null): array
{
    // Danışmanı yükle
    $stmt = $db->prepare("SELECT id, name, ical_url FROM consultants WHERE id = ?");
    $stmt->execute([$consultantId]);
    $consultant = $stmt->fetch();

    if (!$consultant) {
        return ['added' => 0, 'removed' => 0, 'error' => 'Consultant not found'];
    }

    $icalUrl = $icalUrlOverride ?? $consultant['ical_url'];
    if (!$icalUrl) {
        return ['added' => 0, 'removed' => 0, 'error' => 'iCal URL tanımlanmamış'];
    }

    // .ics dosyasını çek — cURL önce, file_get_contents fallback
    $icsContent = fetchIcalUrl($icalUrl);
    if ($icsContent === false || trim($icsContent) === '') {
        return ['added' => 0, 'removed' => 0, 'error' => 'iCal URL erişilemez veya boş. URL\'nin herkese açık (public) olduğundan emin olun.'];
    }

    // VEVENT listesini parse et
    $events = parseIcalEvents($icsContent);

    // DB'deki mevcut available slotlarını al (held/booked'a dokunmayacağız)
    $stmt = $db->prepare(
        "SELECT id, available_date, start_time FROM consultant_availability
         WHERE consultant_id = ? AND status = 'available'"
    );
    $stmt->execute([$consultantId]);
    $existingSlots = $stmt->fetchAll();

    // Mevcut slotları (tarih+saat) → id map'i oluştur
    $existingMap = [];
    foreach ($existingSlots as $slot) {
        $key = $slot['available_date'] . '_' . $slot['start_time'];
        $existingMap[$key] = (int)$slot['id'];
    }

    // iCal'den gelen event anahtarlarını topla
    $icalKeys = [];
    $added = 0;

    foreach ($events as $event) {
        if (!$event['start'] || !$event['end']) continue;

        $dateStr  = $event['start']->format('Y-m-d');
        $startStr = $event['start']->format('H:i:s');
        $endStr   = $event['end']->format('H:i:s');
        $key      = $dateStr . '_' . $startStr;

        $icalKeys[$key] = true;

        // Geçmiş slotları atla
        $today = new DateTime('today', new DateTimeZone('Europe/Istanbul'));
        if ($event['start'] < $today) continue;

        // Zaten DB'de varsa ekleme
        if (isset($existingMap[$key])) continue;

        // Held/booked çakışması kontrolü (aynı danışman + tarih + saat)
        $checkStmt = $db->prepare(
            "SELECT id FROM consultant_availability
             WHERE consultant_id = ? AND available_date = ? AND start_time = ?
             AND status IN ('held','booked')"
        );
        $checkStmt->execute([$consultantId, $dateStr, $startStr]);
        if ($checkStmt->fetch()) continue; // aktif rezervasyon var, atla

        // Yeni slot ekle
        $insertStmt = $db->prepare(
            "INSERT INTO consultant_availability
                (consultant_id, available_date, start_time, end_time, status)
             VALUES (?, ?, ?, ?, 'available')"
        );
        $insertStmt->execute([$consultantId, $dateStr, $startStr, $endStr]);
        $added++;
    }

    // iCal'den çıkan ama DB'de hâlâ available olan slotları sil
    $removed = 0;
    foreach ($existingMap as $key => $slotId) {
        if (!isset($icalKeys[$key])) {
            $db->prepare("DELETE FROM consultant_availability WHERE id = ? AND status = 'available'")
               ->execute([$slotId]);
            $removed++;
        }
    }

    // Son senkronizasyon zamanını güncelle
    $db->prepare("UPDATE consultants SET ical_last_sync = NOW() WHERE id = ?")
       ->execute([$consultantId]);

    return ['added' => $added, 'removed' => $removed];
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
        curl_close($ch);

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
