<?php
// api/routes/consultants.php

$db = Database::getInstance();

require_once __DIR__ . '/../services/ConsultantMailer.php';

// Idempotent migration: title_en + bio_en + email kolonları
try {
    $cols = $db->query("SHOW COLUMNS FROM consultants")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('title_en', $cols, true)) {
        $db->exec("ALTER TABLE consultants ADD COLUMN title_en VARCHAR(255) DEFAULT NULL AFTER title");
    }
    if (!in_array('bio_en', $cols, true)) {
        $db->exec("ALTER TABLE consultants ADD COLUMN bio_en TEXT DEFAULT NULL AFTER bio");
    }
    if (!in_array('email', $cols, true)) {
        $db->exec("ALTER TABLE consultants ADD COLUMN email VARCHAR(190) DEFAULT NULL AFTER name");
    }
} catch (Throwable $e) {
    error_log('[consultants] schema migration: ' . $e->getMessage());
}

/**
 * Bir randevu için .ics (iCalendar) içeriği üretir — mail eki olarak gönderilir.
 * $start/$end: "Y-m-d H:i:s" formatında. TR yereli (Europe/Istanbul).
 */
function buildIcsInvite(array $opts): string
{
    $uid = ($opts['uid'] ?? uniqid('kf', true)) . '@khilonfast.com';
    $fmt = function ($dt) {
        // Yerel saat → UTC'ye çevirmeden floating local time olarak ver (TZID ile)
        $ts = strtotime($dt);
        return date('Ymd\THis', $ts);
    };
    $esc = function ($s) {
        return preg_replace('/([,;\\\\])/', '\\\\$1', str_replace("\n", '\\n', (string)$s));
    };
    $now = gmdate('Ymd\THis\Z');
    $lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//khilonfast//Danismanlik//TR',
        'CALSCALE:GREGORIAN',
        'METHOD:REQUEST',
        'BEGIN:VEVENT',
        'UID:' . $uid,
        'DTSTAMP:' . $now,
        'DTSTART;TZID=Europe/Istanbul:' . $fmt($opts['start']),
        'DTEND;TZID=Europe/Istanbul:' . $fmt($opts['end']),
        'SUMMARY:' . $esc($opts['summary'] ?? 'Danışmanlık Randevusu'),
        'DESCRIPTION:' . $esc($opts['description'] ?? ''),
        'LOCATION:' . $esc($opts['location'] ?? 'Online'),
        'STATUS:CONFIRMED',
        'END:VEVENT',
        'END:VCALENDAR',
    ];
    return implode("\r\n", $lines) . "\r\n";
}

/**
 * Randevulu booking için danışmana + kullanıcıya bildirim (+ .ics eki).
 * consultants.email doluysa danışmana, her durumda kullanıcıya gönderilir.
 * lead_form ürünlerinde çağrılmaz.
 */
function consultantNotifyBooking(PDO $db, int $bookingId): void
{
    try {
        $stmt = $db->prepare("
            SELECT b.*, c.name AS c_name, c.email AS c_email, c.slug AS c_slug,
                   cs.title AS service_title, cs.booking_type, cs.duration_minutes,
                   cs.fixed_start_time, cs.fixed_end_time
            FROM consultant_bookings b
            JOIN consultants c ON c.id = b.consultant_id
            JOIN consultant_services cs ON cs.id = b.service_id
            WHERE b.id = ?
        ");
        $stmt->execute([$bookingId]);
        $b = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$b) return;
        if (($b['booking_type'] ?? 'slot') === 'lead_form') return;
        if (!function_exists('sendTransactionalEmail')) return;

        // Tarih/saat
        $startAt = $b['start_at'];
        $endAt = $b['end_at'];
        if ((!$startAt || !$endAt) && !empty($b['availability_id'])) {
            $a = $db->prepare("SELECT available_date, start_time, end_time FROM consultant_availability WHERE id=?");
            $a->execute([$b['availability_id']]);
            if ($av = $a->fetch(PDO::FETCH_ASSOC)) {
                $startAt = $av['available_date'] . ' ' . $av['start_time'];
                $endAt = $av['available_date'] . ' ' . $av['end_time'];
            }
        }
        if (!$startAt || !$endAt) return;

        $dateLabel = date('d.m.Y', strtotime($startAt));
        $timeLabel = date('H:i', strtotime($startAt)) . '–' . date('H:i', strtotime($endAt));
        $safe = fn($s) => htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8');

        // .ics eki
        $ics = buildIcsInvite([
            'uid' => 'booking-' . $bookingId,
            'start' => $startAt,
            'end' => $endAt,
            'summary' => $b['service_title'] . ' — ' . $b['c_name'],
            'description' => "Müşteri: {$b['name']} ({$b['email']})\nTelefon: " . ($b['phone'] ?: '-') . "\nKonu: " . ($b['topic'] ?: '-'),
            'location' => 'Online',
        ]);
        $icsAtt = [['name' => 'randevu.ics', 'content' => $ics]];

        // 1) Danışmana bildirim (email kolonu doluysa)
        if (!empty($b['c_email'])) {
            $html = '<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f4f7fb;padding:20px;color:#102a43">'
                . '<div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #dde7f0;border-radius:12px;overflow:hidden">'
                . '<div style="background:linear-gradient(90deg,#1a3a52,#89b004);color:#fff;padding:20px 24px"><h2 style="margin:0;font-size:1.15rem">Yeni Randevunuz Var</h2></div>'
                . '<div style="padding:24px;line-height:1.7">'
                . '<p><strong>Hizmet:</strong> ' . $safe($b['service_title']) . '</p>'
                . '<p><strong>Tarih:</strong> ' . $safe($dateLabel) . ' — <strong>Saat:</strong> ' . $safe($timeLabel) . '</p>'
                . '<p><strong>Müşteri:</strong> ' . $safe($b['name']) . ' (' . $safe($b['email']) . ')</p>'
                . '<p><strong>Telefon:</strong> ' . $safe($b['phone'] ?: '-') . '</p>'
                . '<p><strong>Konu:</strong> ' . $safe($b['topic'] ?: '-') . '</p>'
                . '<p style="color:#6b7280;font-size:0.9rem;margin-top:14px">Takvim daveti ekte (.ics) — tıklayarak kendi takviminize ekleyebilirsiniz.</p>'
                . '</div></div></body></html>';
            sendTransactionalEmail($db, $b['c_email'], '[Khilonfast] Yeni Randevu — ' . $dateLabel . ' ' . $timeLabel, $html, null, $icsAtt);
        }

        // 2) Kullanıcıya onay + .ics
        $html2 = '<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f4f7fb;padding:20px;color:#102a43">'
            . '<div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #dde7f0;border-radius:12px;overflow:hidden">'
            . '<div style="background:linear-gradient(90deg,#1a3a52,#89b004);color:#fff;padding:20px 24px"><h2 style="margin:0;font-size:1.15rem">Randevunuz Oluşturuldu</h2></div>'
            . '<div style="padding:24px;line-height:1.7">'
            . '<p>Merhaba ' . $safe($b['name']) . ',</p>'
            . '<p><strong>' . $safe($b['service_title']) . '</strong> randevunuz oluşturuldu.</p>'
            . '<p><strong>Tarih:</strong> ' . $safe($dateLabel) . '<br><strong>Saat:</strong> ' . $safe($timeLabel) . '<br><strong>Danışman:</strong> ' . $safe($b['c_name']) . '</p>'
            . '<p style="color:#6b7280;font-size:0.9rem;margin-top:14px">Takvim daveti ekte (.ics).</p>'
            . '</div></div></body></html>';
        sendTransactionalEmail($db, $b['email'], '[Khilonfast] Randevu Onayı — ' . $dateLabel . ' ' . $timeLabel, $html2, null, $icsAtt);
    } catch (Throwable $e) {
        error_log('[consultants] booking notify failed: ' . $e->getMessage());
    }
}

// Idempotent migration: randevu davranış modeli (booking_type / süre / sabit blok)
try {
    $svcCols = $db->query("SHOW COLUMNS FROM consultant_services")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('booking_type', $svcCols, true)) {
        $db->exec("ALTER TABLE consultant_services ADD COLUMN booking_type ENUM('slot','fixed_day','lead_form') NOT NULL DEFAULT 'slot'");
    }
    if (!in_array('duration_minutes', $svcCols, true)) {
        $db->exec("ALTER TABLE consultant_services ADD COLUMN duration_minutes INT DEFAULT 60");
    }
    if (!in_array('fixed_start_time', $svcCols, true)) {
        $db->exec("ALTER TABLE consultant_services ADD COLUMN fixed_start_time TIME DEFAULT NULL");
    }
    if (!in_array('fixed_end_time', $svcCols, true)) {
        $db->exec("ALTER TABLE consultant_services ADD COLUMN fixed_end_time TIME DEFAULT NULL");
    }
    if (!in_array('slot_interval_minutes', $svcCols, true)) {
        $db->exec("ALTER TABLE consultant_services ADD COLUMN slot_interval_minutes INT DEFAULT 60");
    }
    $bkCols = $db->query("SHOW COLUMNS FROM consultant_bookings")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('start_at', $bkCols, true)) {
        $db->exec("ALTER TABLE consultant_bookings ADD COLUMN start_at DATETIME DEFAULT NULL");
    }
    if (!in_array('end_at', $bkCols, true)) {
        $db->exec("ALTER TABLE consultant_bookings ADD COLUMN end_at DATETIME DEFAULT NULL");
    }
    if (!in_array('booking_type', $bkCols, true)) {
        $db->exec("ALTER TABLE consultant_bookings ADD COLUMN booking_type VARCHAR(20) DEFAULT 'slot'");
    }
    $db->exec("CREATE TABLE IF NOT EXISTS consultant_leads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        consultant_id INT NOT NULL,
        service_id INT DEFAULT NULL,
        name VARCHAR(160) NOT NULL,
        company VARCHAR(160) DEFAULT NULL,
        position VARCHAR(120) DEFAULT NULL,
        email VARCHAR(160) NOT NULL,
        phone VARCHAR(40) DEFAULT NULL,
        website VARCHAR(200) DEFAULT NULL,
        needs TEXT DEFAULT NULL,
        monthly_pref VARCHAR(120) DEFAULT NULL,
        kvkk_consent TINYINT(1) DEFAULT 0,
        status ENUM('new','contacted','converted','closed') DEFAULT 'new',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (consultant_id), INDEX (status)
    )");
} catch (Throwable $e) {
    error_log('[consultants] booking model migration: ' . $e->getMessage());
}

/**
 * İki zaman aralığı çakışıyor mu? (döküman §8)
 * existing.start < new.end AND existing.end > new.start
 */
function bookingsOverlap($aStart, $aEnd, $bStart, $bEnd): bool
{
    return strtotime($aStart) < strtotime($bEnd) && strtotime($aEnd) > strtotime($bStart);
}

/**
 * Bir ürün (service) için, danışmanın müsaitlik aralıklarından runtime slot üretir.
 * - booking_type='slot'      → duration_minutes uzunlukta, slot_interval adımla dilimler
 * - booking_type='fixed_day' → müsaitlik fixed_start–fixed_end'i KAPSIYORSA tek blok
 * - booking_type='lead_form' → boş (takvim yok)
 * Mevcut booking'lerle (pending/confirmed/paid) çakışan slot'lar elenir.
 * Dönüş: [{ id?, available_date, start_time, end_time }]
 */
function generateSlotsForService(PDO $db, int $consultantId, array $service): array
{
    $bookingType = $service['booking_type'] ?? 'slot';
    if ($bookingType === 'lead_form') {
        return [];
    }

    // Danışmanın ham müsaitlik aralıkları (gelecek tarihler)
    $stmt = $db->prepare("
        SELECT id, available_date, start_time, end_time
        FROM consultant_availability
        WHERE consultant_id = ? AND status = 'available' AND available_date >= CURDATE()
        ORDER BY available_date, start_time
    ");
    $stmt->execute([$consultantId]);
    $ranges = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Aktif booking'ler (çakışma kontrolü için) — hem yeni (start_at) hem eski (availability) model
    $stmt = $db->prepare("
        SELECT b.start_at, b.end_at, b.availability_id,
               a.available_date AS a_date, a.start_time AS a_start, a.end_time AS a_end
        FROM consultant_bookings b
        LEFT JOIN consultant_availability a ON a.id = b.availability_id
        WHERE b.consultant_id = ? AND b.status IN ('pending','confirmed','completed')
    ");
    $stmt->execute([$consultantId]);
    $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Booking aralıklarını normalize et: [date => [[start,end],...]]
    $busy = [];
    foreach ($bookings as $bk) {
        if (!empty($bk['start_at']) && !empty($bk['end_at'])) {
            $d = substr($bk['start_at'], 0, 10);
            $busy[$d][] = [substr($bk['start_at'], 11, 8), substr($bk['end_at'], 11, 8)];
        } elseif (!empty($bk['a_date'])) {
            $busy[$bk['a_date']][] = [$bk['a_start'], $bk['a_end']];
        }
    }

    $isFree = function (string $date, string $start, string $end) use ($busy): bool {
        foreach ($busy[$date] ?? [] as [$bs, $be]) {
            if (bookingsOverlap($start, $end, $bs, $be)) return false;
        }
        return true;
    };

    $out = [];

    if ($bookingType === 'fixed_day') {
        $fs = $service['fixed_start_time'] ?: '10:00:00';
        $fe = $service['fixed_end_time'] ?: '16:00:00';
        foreach ($ranges as $r) {
            // Müsaitlik, sabit bloğu tamamen kapsamalı (avail_start <= fs AND avail_end >= fe)
            if (strtotime($r['start_time']) <= strtotime($fs) && strtotime($r['end_time']) >= strtotime($fe)) {
                if ($isFree($r['available_date'], $fs, $fe)) {
                    $out[] = [
                        'available_date' => $r['available_date'],
                        'start_time' => $fs,
                        'end_time' => $fe,
                    ];
                }
            }
        }
        return $out;
    }

    // booking_type === 'slot'
    $dur = (int)($service['duration_minutes'] ?: 60);
    $interval = (int)($service['slot_interval_minutes'] ?: 60);
    if ($dur <= 0) $dur = 60;
    if ($interval <= 0) $interval = 60;

    foreach ($ranges as $r) {
        $startSec = strtotime($r['start_time']);
        $endSec = strtotime($r['end_time']);
        for ($s = $startSec; $s + $dur * 60 <= $endSec; $s += $interval * 60) {
            $slotStart = date('H:i:s', $s);
            $slotEnd = date('H:i:s', $s + $dur * 60);
            if ($isFree($r['available_date'], $slotStart, $slotEnd)) {
                $out[] = [
                    'available_date' => $r['available_date'],
                    'start_time' => $slotStart,
                    'end_time' => $slotEnd,
                ];
            }
        }
    }
    return $out;
}

if ($method === 'GET') {
    $lang = $_GET['lang'] ?? 'tr';

    // GET /api/consultants/{slug}/availability?service_id=X
    // service_id verilirse ürün tipine göre runtime slot üretir (dinamik).
    // Verilmezse geriye-uyumlu ham müsaitlik döndürür.
    if (!empty($action) && !empty($id) && $id === 'availability') {
        $stmt = $db->prepare("SELECT id FROM consultants WHERE slug = ? AND is_active = TRUE");
        $stmt->execute([$action]);
        $consultant = $stmt->fetch();
        if (!$consultant) sendResponse(['error' => 'Consultant not found'], 404);

        $serviceId = isset($_GET['service_id']) ? (int)$_GET['service_id'] : 0;
        if ($serviceId) {
            $svcStmt = $db->prepare("SELECT * FROM consultant_services WHERE id = ?");
            $svcStmt->execute([$serviceId]);
            $service = $svcStmt->fetch(PDO::FETCH_ASSOC);
            if (!$service) sendResponse(['error' => 'Service not found'], 404);

            $bookingType = $service['booking_type'] ?? 'slot';
            if ($bookingType === 'lead_form') {
                sendResponse(['slots' => [], 'booking_type' => 'lead_form']);
            }
            $slots = generateSlotsForService($db, (int)$consultant['id'], $service);
            sendResponse(['slots' => $slots, 'booking_type' => $bookingType]);
        }

        // Legacy: ham müsaitlik
        $stmt = $db->prepare("
            SELECT id, available_date, start_time, end_time, status, service_id
            FROM consultant_availability
            WHERE consultant_id = ? AND status = 'available' AND available_date >= CURDATE()
            ORDER BY available_date, start_time
        ");
        $stmt->execute([$consultant['id']]);
        $slots = $stmt->fetchAll();
        sendResponse(['slots' => $slots]);
    }

    // GET /api/consultants/bookings/{id} — ödeme devam sayfası için booking özeti
    if ($action === 'bookings' && !empty($id) && ctype_digit((string)$id)) {
        $stmt = $db->prepare(
            "SELECT b.id, b.name, b.email, b.status, b.service_id, b.availability_id,
                    cs.title AS service_title, cs.price, cs.currency, cs.plus_vat,
                    c.name AS consultant_name, c.slug AS consultant_slug,
                    a.available_date, a.start_time, a.end_time
             FROM consultant_bookings b
             JOIN consultant_services cs ON cs.id = b.service_id
             JOIN consultants c ON c.id = b.consultant_id
             LEFT JOIN consultant_availability a ON a.id = b.availability_id
             WHERE b.id = ?"
        );
        $stmt->execute([(int)$id]);
        $booking = $stmt->fetch();
        if (!$booking) sendResponse(['error' => 'Booking not found'], 404);
        sendResponse(['booking' => $booking]);
    }

    // GET /api/consultants/{slug}
    if (!empty($action)) {
        $stmt = $db->prepare("SELECT * FROM consultants WHERE slug = ? AND is_active = TRUE");
        $stmt->execute([$action]);
        $consultant = $stmt->fetch();
        if (!$consultant) sendResponse(['error' => 'Consultant not found'], 404);

        $consultant['sectors'] = json_decode($consultant['sectors'] ?? '[]', true);

        // EN locale: bio/title swap (boşsa TR fallback)
        if ($lang === 'en') {
            if (!empty($consultant['title_en'])) $consultant['title'] = $consultant['title_en'];
            if (!empty($consultant['bio_en']))   $consultant['bio']   = $consultant['bio_en'];
        }

        // Hizmetler (parent + alt paketler)
        $stmt = $db->prepare("
            SELECT * FROM consultant_services
            WHERE consultant_id = ? AND is_active = TRUE
            ORDER BY sort_order
        ");
        $stmt->execute([$consultant['id']]);
        $services = $stmt->fetchAll();

        foreach ($services as &$svc) {
            $svc['scope_items']    = decodeScopeItemsSafe($svc['scope_items'] ?? null);
            $svc['scope_items_en'] = decodeScopeItemsSafe($svc['scope_items_en'] ?? null);
            if ($lang === 'en') {
                $svc['title']       = !empty($svc['title_en']) ? $svc['title_en'] : $svc['title'];
                $svc['description'] = !empty($svc['description_en']) ? $svc['description_en'] : $svc['description'];
                $svc['scope_items'] = !empty($svc['scope_items_en']) ? $svc['scope_items_en'] : $svc['scope_items'];
                $svc['cta_text']    = !empty($svc['cta_text_en']) ? $svc['cta_text_en'] : $svc['cta_text'];
            }
        }
        unset($svc);

        $consultant['services'] = $services;
        sendResponse(['consultant' => $consultant]);
    }

    // GET /api/consultants?sektor=fintech (frontend) veya ?sector=fintech (fallback)
    $sector = $_GET['sektor'] ?? $_GET['sector'] ?? null;
    if ($sector) {
        $stmt = $db->prepare("
            SELECT id, slug, name, title, title_en, photo_url, stars, review_count, sectors
            FROM consultants WHERE is_active = TRUE
            AND JSON_CONTAINS(sectors, ?)
            ORDER BY id
        ");
        $stmt->execute([json_encode($sector)]);
    } else {
        $stmt = $db->query("
            SELECT id, slug, name, title, title_en, photo_url, stars, review_count, sectors
            FROM consultants WHERE is_active = TRUE ORDER BY id
        ");
    }
    $consultants = $stmt->fetchAll();
    foreach ($consultants as &$c) {
        $c['sectors'] = json_decode($c['sectors'] ?? '[]', true);
        if ($lang === 'en' && !empty($c['title_en'])) $c['title'] = $c['title_en'];
        unset($c['title_en']);
    }
    unset($c);
    sendResponse(['consultants' => $consultants]);
}

$subAction = $routes[3] ?? '';

if ($method === 'POST') {
    // POST /api/consultants/bookings/hold — Slot tut + booking oluştur
    if ($action === 'bookings' && $id === 'hold') {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $consultant_slug = trim($data['consultant_slug'] ?? '');
        $service_id      = (int)($data['service_id'] ?? 0);
        $availability_id = !empty($data['availability_id']) ? (int)$data['availability_id'] : null;
        $start_at        = !empty($data['start_at']) ? trim($data['start_at']) : null; // "YYYY-MM-DD HH:MM:SS"
        $name            = trim($data['name'] ?? '');
        $email           = trim($data['email'] ?? '');
        $phone           = trim($data['phone'] ?? '');
        $company         = trim($data['company'] ?? '');
        $topic           = trim($data['topic'] ?? '');

        if (!$consultant_slug || !$service_id || !$name || !$email) {
            sendResponse(['error' => 'consultant_slug, service_id, name ve email zorunlu'], 400);
        }

        // Süresi geçmiş hold'ları serbest bırak
        $db->prepare("UPDATE consultant_availability SET status='available', held_until=NULL WHERE status='held' AND held_until < NOW()")->execute([]);

        $stmt = $db->prepare("SELECT id FROM consultants WHERE slug = ? AND is_active = TRUE");
        $stmt->execute([$consultant_slug]);
        $consultant = $stmt->fetch();
        if (!$consultant) sendResponse(['error' => 'Consultant not found'], 404);
        $consultantId = $consultant['id'];

        // Ürün davranışını çek (süre / sabit blok)
        $svcStmt = $db->prepare("SELECT * FROM consultant_services WHERE id = ?");
        $svcStmt->execute([$service_id]);
        $service = $svcStmt->fetch(PDO::FETCH_ASSOC);
        if (!$service) sendResponse(['error' => 'Service not found'], 404);
        $bookingType = $service['booking_type'] ?? 'slot';

        // lead_form ürünleri buraya gelmemeli (frontend /leads kullanır)
        if ($bookingType === 'lead_form') {
            sendResponse(['error' => 'Bu hizmet randevu değil, başvuru formu ile alınır.'], 400);
        }

        // start_at + end_at hesapla (yeni model). Eski availability_id de desteklenir.
        $end_at = null;
        if ($start_at) {
            $startSec = strtotime($start_at);
            if ($bookingType === 'fixed_day') {
                $fe = $service['fixed_end_time'] ?: '16:00:00';
                $end_at = substr($start_at, 0, 10) . ' ' . $fe;
            } else {
                $dur = (int)($service['duration_minutes'] ?: 60);
                if ($dur <= 0) $dur = 60;
                $end_at = date('Y-m-d H:i:s', $startSec + $dur * 60);
            }

            // ÇAKIŞMA KONTROLÜ (döküman §8): aynı danışmanda overlap eden aktif booking var mı?
            $confStmt = $db->prepare("
                SELECT id, start_at, end_at, availability_id
                FROM consultant_bookings
                WHERE consultant_id = ? AND status IN ('pending','confirmed','completed')
                  AND ((start_at IS NOT NULL AND DATE(start_at) = ?) OR availability_id IS NOT NULL)
            ");
            $confStmt->execute([$consultantId, substr($start_at, 0, 10)]);
            foreach ($confStmt->fetchAll(PDO::FETCH_ASSOC) as $ex) {
                $exStart = $ex['start_at'];
                $exEnd = $ex['end_at'];
                if ((!$exStart || !$exEnd) && $ex['availability_id']) {
                    // eski model: availability'den al
                    $aStmt = $db->prepare("SELECT available_date, start_time, end_time FROM consultant_availability WHERE id = ?");
                    $aStmt->execute([$ex['availability_id']]);
                    if ($a = $aStmt->fetch(PDO::FETCH_ASSOC)) {
                        $exStart = $a['available_date'] . ' ' . $a['start_time'];
                        $exEnd = $a['available_date'] . ' ' . $a['end_time'];
                    }
                }
                if ($exStart && $exEnd && bookingsOverlap($start_at, $end_at, $exStart, $exEnd)) {
                    sendResponse(['error' => 'Bu saat artık dolu. Lütfen başka bir zaman seçin.'], 409);
                }
            }
        }

        // Eski model: availability_id hold et (geriye uyum)
        $holdExpires = null;
        if ($availability_id) {
            $stmt = $db->prepare("SELECT * FROM consultant_availability WHERE id = ? AND status = 'available'");
            $stmt->execute([$availability_id]);
            $slot = $stmt->fetch();
            if (!$slot) sendResponse(['error' => 'Bu slot artık müsait değil. Lütfen başka bir zaman seçin.'], 409);
            $holdUntil = date('Y-m-d H:i:s', strtotime('+10 minutes'));
            $db->prepare("UPDATE consultant_availability SET status='held', held_until=? WHERE id=?")->execute([$holdUntil, $availability_id]);
            $holdExpires = date('c', strtotime('+10 minutes'));
        }

        // Booking oluştur (start_at/end_at + booking_type ile)
        $stmt = $db->prepare("INSERT INTO consultant_bookings (consultant_id, service_id, availability_id, start_at, end_at, booking_type, name, email, phone, company, topic, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')");
        $stmt->execute([$consultantId, $service_id, $availability_id, $start_at, $end_at, $bookingType, $name, $email, $phone ?: null, $company ?: null, $topic ?: null]);
        $newBookingId = (int)$db->lastInsertId();

        // Admin'e yeni randevu bildirimi
        try {
            $adminEmail = (string)getSetting($db, 'contact_email', '');
            if ($adminEmail !== '' && function_exists('sendTransactionalEmail')) {
                $bRow = ['id' => $newBookingId, 'service_id' => $service_id, 'availability_id' => $availability_id, 'name' => $name];
                $v = consultantBuildVars($db, $bRow);
                $frontend = defined('FRONTEND_URL') ? rtrim(FRONTEND_URL, '/') : 'https://khilonfast.com';
                $safe = fn($s) => htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8');
                $html = '<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f4f7fb;padding:20px;margin:0;color:#102a43">'
                    . '<div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #dde7f0;border-radius:12px;overflow:hidden">'
                    . '<div style="background:linear-gradient(90deg,#1a3a52,#89b004);color:#fff;padding:20px 24px">'
                    . '<h2 style="margin:0;font-size:1.15rem">Yeni Danışmanlık Randevusu</h2></div>'
                    . '<div style="padding:24px;line-height:1.7">'
                    . '<p><strong>Müşteri:</strong> ' . $safe($name) . ' (' . $safe($email) . ')</p>'
                    . '<p><strong>Telefon:</strong> ' . $safe($phone ?: '-') . '</p>'
                    . '<p><strong>Hizmet:</strong> ' . $safe($v['package_name'] ?: ('#' . $service_id)) . '</p>'
                    . '<p><strong>Seçilen Tarih &amp; Saat:</strong> ' . $safe($v['appointment_datetime'] ?: 'Belirtilmedi') . '</p>'
                    . '<p><strong>Konu:</strong> ' . $safe($topic ?: '-') . '</p>'
                    . '<p style="margin-top:18px"><a href="' . $frontend . '/admin/bookings" '
                    . 'style="background:#1a3a52;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Admin Panelinde Aç</a></p>'
                    . '</div></div></body></html>';
                sendTransactionalEmail($db, $adminEmail, '[Khilonfast] Yeni Danışmanlık Randevusu — ' . $name, $html);
            }
        } catch (Throwable $e) {
            error_log('[consultants] admin notify failed: ' . $e->getMessage());
        }

        // Danışman + kullanıcı bildirimi (+ .ics takvim daveti) — randevulu ürünlerde
        consultantNotifyBooking($db, $newBookingId);

        sendResponse([
            'booking_id'     => $newBookingId,
            'hold_expires_at' => $holdExpires,
            'message'        => 'Rezervasyon talebi alındı'
        ]);
    }

    // POST /api/consultants/leads — Fractional CMO (lead_form) başvurusu (takvimsiz)
    if ($action === 'leads' && empty($id)) {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $consultant_slug = trim($data['consultant_slug'] ?? '');
        $service_id  = !empty($data['service_id']) ? (int)$data['service_id'] : null;
        $name        = trim($data['name'] ?? '');
        $company     = trim($data['company'] ?? '');
        $position    = trim($data['position'] ?? '');
        $email       = trim($data['email'] ?? '');
        $phone       = trim($data['phone'] ?? '');
        $website     = trim($data['website'] ?? '');
        $needs       = trim($data['needs'] ?? '');
        $monthlyPref = trim($data['monthly_pref'] ?? '');
        $kvkk        = !empty($data['kvkk_consent']) ? 1 : 0;

        if (!$consultant_slug || !$name || !$email) {
            sendResponse(['error' => 'Ad, e-posta ve danışman zorunlu'], 400);
        }
        if (!$kvkk) {
            sendResponse(['error' => 'KVKK onayı gereklidir'], 400);
        }

        $stmt = $db->prepare("SELECT id, name, email FROM consultants WHERE slug = ? AND is_active = TRUE");
        $stmt->execute([$consultant_slug]);
        $consultant = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$consultant) sendResponse(['error' => 'Consultant not found'], 404);
        $consultantId = (int)$consultant['id'];

        // Lead kaydı
        $stmt = $db->prepare("INSERT INTO consultant_leads
            (consultant_id, service_id, name, company, position, email, phone, website, needs, monthly_pref, kvkk_consent, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')");
        $stmt->execute([$consultantId, $service_id, $name, $company ?: null, $position ?: null, $email, $phone ?: null, $website ?: null, $needs ?: null, $monthlyPref ?: null, $kvkk]);
        $leadId = (int)$db->lastInsertId();

        // CRM'e de düşür (varsa) — best-effort. crm_contacts: first_name/last_name + UNIQUE email
        try {
            $parts = preg_split('/\s+/', trim($name), 2);
            $first = $parts[0] ?? $name;
            $last  = $parts[1] ?? '';
            $db->prepare("INSERT INTO crm_contacts (first_name, last_name, email, phone, company, source, status, created_at)
                          VALUES (?, ?, ?, ?, ?, 'consultant_lead', 'subscribed', NOW())
                          ON DUPLICATE KEY UPDATE phone=VALUES(phone), company=VALUES(company), source='consultant_lead'")
               ->execute([$first, $last, $email, $phone ?: null, $company ?: null]);
        } catch (Throwable $e) { error_log('[consultants] crm lead insert: ' . $e->getMessage()); }

        // Danışmana + admin'e bildirim
        try {
            $frontend = defined('FRONTEND_URL') ? rtrim(FRONTEND_URL, '/') : 'https://khilonfast.com';
            $safe = fn($s) => htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8');
            $svcTitle = '';
            if ($service_id) {
                $t = $db->prepare("SELECT title FROM consultant_services WHERE id = ?");
                $t->execute([$service_id]);
                $svcTitle = (string)($t->fetchColumn() ?: '');
            }
            $html = '<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f4f7fb;padding:20px;margin:0;color:#102a43">'
                . '<div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #dde7f0;border-radius:12px;overflow:hidden">'
                . '<div style="background:linear-gradient(90deg,#1a3a52,#89b004);color:#fff;padding:20px 24px">'
                . '<h2 style="margin:0;font-size:1.15rem">Yeni Danışmanlık Başvurusu (Lead)</h2></div>'
                . '<div style="padding:24px;line-height:1.7">'
                . '<p><strong>Program:</strong> ' . $safe($svcTitle ?: 'Fractional CMO') . '</p>'
                . '<p><strong>Ad Soyad:</strong> ' . $safe($name) . '</p>'
                . '<p><strong>Şirket:</strong> ' . $safe($company ?: '-') . ' — <strong>Pozisyon:</strong> ' . $safe($position ?: '-') . '</p>'
                . '<p><strong>E-posta:</strong> ' . $safe($email) . ' — <strong>Telefon:</strong> ' . $safe($phone ?: '-') . '</p>'
                . '<p><strong>Web sitesi:</strong> ' . $safe($website ?: '-') . '</p>'
                . '<p><strong>Aylık tercih:</strong> ' . $safe($monthlyPref ?: '-') . '</p>'
                . '<p><strong>İhtiyaç / Beklenti:</strong><br>' . nl2br($safe($needs ?: '-')) . '</p>'
                . '<p style="margin-top:18px"><a href="' . $frontend . '/admin/bookings" '
                . 'style="background:#1a3a52;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Admin Panelinde Aç</a></p>'
                . '</div></div></body></html>';
            if (function_exists('sendTransactionalEmail')) {
                // Danışmana bildirim (email kolonu doluysa)
                if (!empty($consultant['email'])) {
                    sendTransactionalEmail($db, $consultant['email'], '[Khilonfast] Yeni Program Başvurusu — ' . $name, $html);
                }
                // Admin'e bildirim
                $adminEmail = (string)getSetting($db, 'contact_email', '');
                if ($adminEmail !== '' && strcasecmp($adminEmail, (string)($consultant['email'] ?? '')) !== 0) {
                    sendTransactionalEmail($db, $adminEmail, '[Khilonfast] Yeni Danışmanlık Başvurusu — ' . $name, $html);
                }
            }
        } catch (Throwable $e) {
            error_log('[consultants] lead notify failed: ' . $e->getMessage());
        }

        sendResponse([
            'lead_id' => $leadId,
            'message' => 'Başvurunuz alınmıştır. Ekibimiz sizinle iletişime geçecektir.'
        ]);
    }

    // POST /api/consultants/bookings/:id/confirm — ödeme sonrası onayla
    if ($action === 'bookings' && !empty($id) && $subAction === 'confirm') {
        $data     = json_decode(file_get_contents('php://input'), true) ?? [];
        $order_id = $data['order_id'] ?? null;

        $stmt = $db->prepare("SELECT * FROM consultant_bookings WHERE id = ?");
        $stmt->execute([$id]);
        $booking = $stmt->fetch();
        if (!$booking) sendResponse(['error' => 'Booking not found'], 404);

        $db->prepare("UPDATE consultant_bookings SET status='confirmed', order_id=? WHERE id=?")->execute([$order_id, $id]);
        if ($booking['availability_id']) {
            $db->prepare("UPDATE consultant_availability SET status='booked', held_until=NULL WHERE id=?")->execute([$booking['availability_id']]);
        }

        // "Randevu Onaylandı" maili — tekrar göndermeyi önle
        if (empty($booking['confirmation_sent_at'])) {
            $vars = consultantBuildVars($db, $booking);
            if (consultantSendMail($db, CONSULTANT_TPL_CONFIRM, (string)$booking['email'], $vars)) {
                $db->prepare("UPDATE consultant_bookings SET confirmation_sent_at = NOW() WHERE id = ?")->execute([$id]);
            }
        }

        sendResponse(['success' => true]);
    }

    // POST /api/consultants/bookings/:id/defer — "Daha Sonra Öde" → ödeme son-adım maili
    if ($action === 'bookings' && !empty($id) && $subAction === 'defer') {
        $stmt = $db->prepare("SELECT * FROM consultant_bookings WHERE id = ?");
        $stmt->execute([$id]);
        $booking = $stmt->fetch();
        if (!$booking) sendResponse(['error' => 'Booking not found'], 404);

        if (empty($booking['payment_reminder_sent_at'])) {
            $vars = consultantBuildVars($db, $booking);
            if (consultantSendMail($db, CONSULTANT_TPL_PAYMENT, (string)$booking['email'], $vars)) {
                $db->prepare("UPDATE consultant_bookings SET payment_reminder_sent_at = NOW() WHERE id = ?")->execute([$id]);
            }
        }
        sendResponse(['success' => true]);
    }

    // POST /api/consultants/bookings/:id/reschedule — takvim değiştir (48 saat kuralı)
    if ($action === 'bookings' && !empty($id) && $subAction === 'reschedule') {
        $data  = json_decode(file_get_contents('php://input'), true) ?? [];
        $token = (string)($data['token'] ?? '');
        $newAvailId = (int)($data['availability_id'] ?? 0);

        if (!hash_equals(consultantBookingToken((int)$id), $token)) {
            sendResponse(['error' => 'Geçersiz bağlantı.'], 403);
        }
        if (!$newAvailId) sendResponse(['error' => 'Yeni slot seçilmedi.'], 400);

        $stmt = $db->prepare("SELECT * FROM consultant_bookings WHERE id = ?");
        $stmt->execute([$id]);
        $booking = $stmt->fetch();
        if (!$booking) sendResponse(['error' => 'Booking not found'], 404);
        if (in_array($booking['status'], ['cancelled', 'completed'], true)) {
            sendResponse(['error' => 'Bu randevu güncellenemez.'], 409);
        }

        // 48 saat kuralı — mevcut randevuya 48 saatten az kaldıysa değiştirilemez
        if (!empty($booking['availability_id'])) {
            $cur = $db->prepare("SELECT TIMESTAMP(available_date, start_time) AS appt FROM consultant_availability WHERE id = ?");
            $cur->execute([$booking['availability_id']]);
            $appt = $cur->fetchColumn();
            if ($appt && strtotime($appt) < time() + 48 * 3600) {
                sendResponse(['error' => 'Randevunuza 48 saatten az kaldığı için değişiklik yapılamaz.'], 409);
            }
        }

        // Yeni slot müsait mi?
        $ns = $db->prepare("SELECT * FROM consultant_availability WHERE id = ? AND status = 'available'");
        $ns->execute([$newAvailId]);
        if (!$ns->fetch()) sendResponse(['error' => 'Seçilen slot artık müsait değil.'], 409);

        // Eski slotu serbest bırak, yeni slotu booked yap
        if (!empty($booking['availability_id'])) {
            $db->prepare("UPDATE consultant_availability SET status='available', held_until=NULL WHERE id=?")
               ->execute([$booking['availability_id']]);
        }
        $db->prepare("UPDATE consultant_availability SET status='booked', held_until=NULL WHERE id=?")->execute([$newAvailId]);
        // Booking güncelle + hatırlatmayı sıfırla (yeni tarihe göre tekrar gitsin)
        $db->prepare("UPDATE consultant_bookings SET availability_id=?, reminder_sent_at=NULL WHERE id=?")
           ->execute([$newAvailId, $id]);

        // "Takvim Değişikliği" maili
        $booking['availability_id'] = $newAvailId;
        consultantSendRescheduleMail($db, $booking);

        sendResponse(['success' => true]);
    }

    // POST /api/consultants/bookings/:id/cancel — randevu iptali (48 saat kuralı)
    if ($action === 'bookings' && !empty($id) && $subAction === 'cancel') {
        $data  = json_decode(file_get_contents('php://input'), true) ?? [];
        $token = (string)($data['token'] ?? '');

        if (!hash_equals(consultantBookingToken((int)$id), $token)) {
            sendResponse(['error' => 'Geçersiz bağlantı.'], 403);
        }

        $stmt = $db->prepare("SELECT * FROM consultant_bookings WHERE id = ?");
        $stmt->execute([$id]);
        $booking = $stmt->fetch();
        if (!$booking) sendResponse(['error' => 'Booking not found'], 404);
        if ($booking['status'] === 'cancelled') sendResponse(['success' => true]);
        if ($booking['status'] === 'completed') sendResponse(['error' => 'Tamamlanmış randevu iptal edilemez.'], 409);

        if (!empty($booking['availability_id'])) {
            $cur = $db->prepare("SELECT TIMESTAMP(available_date, start_time) AS appt FROM consultant_availability WHERE id = ?");
            $cur->execute([$booking['availability_id']]);
            $appt = $cur->fetchColumn();
            if ($appt && strtotime($appt) < time() + 48 * 3600) {
                sendResponse(['error' => 'Randevunuza 48 saatten az kaldığı için iptal yapılamaz.'], 409);
            }
        }

        $db->prepare("UPDATE consultant_bookings SET status='cancelled' WHERE id=?")->execute([$id]);
        if (!empty($booking['availability_id'])) {
            $db->prepare("UPDATE consultant_availability SET status='available', held_until=NULL WHERE id=?")
               ->execute([$booking['availability_id']]);
        }
        sendResponse(['success' => true]);
    }

    // POST /api/consultants/{slug}/book — Rezervasyon talebi
    if (!empty($action) && !empty($id) && $id === 'book') {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $stmt = $db->prepare("SELECT id FROM consultants WHERE slug = ? AND is_active = TRUE");
        $stmt->execute([$action]);
        $consultant = $stmt->fetch();
        if (!$consultant) sendResponse(['error' => 'Consultant not found'], 404);

        $name           = trim($data['name'] ?? '');
        $email          = trim($data['email'] ?? '');
        $service_id     = (int)($data['service_id'] ?? 0);
        $availability_id = !empty($data['availability_id']) ? (int)$data['availability_id'] : null;
        $phone          = trim($data['phone'] ?? '');
        $company        = trim($data['company'] ?? '');
        $topic          = trim($data['topic'] ?? '');

        if (!$name || !$email || !$service_id) {
            sendResponse(['error' => 'name, email ve service_id zorunlu'], 400);
        }

        // Slot varsa 'held' yap
        if ($availability_id) {
            $stmt = $db->prepare("
                UPDATE consultant_availability SET status = 'booked'
                WHERE id = ? AND consultant_id = ? AND status = 'available'
            ");
            $stmt->execute([$availability_id, $consultant['id']]);
        }

        $stmt = $db->prepare("
            INSERT INTO consultant_bookings
                (consultant_id, service_id, availability_id, name, email, phone, company, topic)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $consultant['id'], $service_id, $availability_id,
            $name, $email, $phone, $company, $topic
        ]);

        sendResponse(['success' => true, 'booking_id' => $db->lastInsertId()], 201);
    }
}

sendResponse(['error' => 'Action not found'], 404);
