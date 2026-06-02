<?php
/**
 * Tek seferlik migration: Mevcut geniş danışmanlık müsaitlik slot'larını
 * (örn. 09:00-17:00) 60 dakikalık dilimlere böler.
 *
 * Sebep: Admin geçmişte 09:00-17:00 gibi tek blok slot girmiş; booking modal
 * her slot'u tek buton gösterdiği için kullanıcı 60dk seans seçemiyordu.
 * Bu script geniş 'available' slot'ları 60dk dilimlere böler, böylece her dilim
 * ayrı buton olur. 'booked' / 'held' slot'lara DOKUNMAZ (rezervasyonlar korunur).
 *
 * İdempotent: tekrar çalıştırılırsa zaten <=60dk olan slot'lara dokunmaz.
 *
 * Çalıştırma (lokal/cPanel terminal):
 *   php api/migrations/split_availability_60min.php
 * veya tarayıcıdan (admin doğrulamalı bir endpoint'e bağlanmadığı için CLI önerilir).
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/db.php';

$db = Database::getInstance();

// Sadece geniş (>60dk) ve müsait slot'ları al
$stmt = $db->query("
    SELECT id, consultant_id, service_id, available_date, start_time, end_time
    FROM consultant_availability
    WHERE status = 'available'
      AND TIME_TO_SEC(TIMEDIFF(end_time, start_time)) > 3600
    ORDER BY available_date, start_time
");
$wideSlots = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (empty($wideSlots)) {
    echo "Bölünecek geniş slot yok. (Hepsi zaten <=60dk veya rezerve.)\n";
    exit(0);
}

$totalDeleted = 0;
$totalInserted = 0;

$db->beginTransaction();
try {
    $insertStmt = $db->prepare("
        INSERT INTO consultant_availability
            (consultant_id, service_id, available_date, start_time, end_time, status)
        VALUES (?, ?, ?, ?, ?, 'available')
    ");
    $deleteStmt = $db->prepare("DELETE FROM consultant_availability WHERE id = ?");

    foreach ($wideSlots as $slot) {
        [$sh, $sm] = array_map('intval', explode(':', substr($slot['start_time'], 0, 5)));
        [$eh, $em] = array_map('intval', explode(':', substr($slot['end_time'], 0, 5)));
        $startMin = $sh * 60 + $sm;
        $endMin   = $eh * 60 + $em;

        $segments = [];
        for ($cur = $startMin; $cur + 60 <= $endMin; $cur += 60) {
            $s = sprintf('%02d:%02d:00', intdiv($cur, 60), $cur % 60);
            $next = $cur + 60;
            $e = sprintf('%02d:%02d:00', intdiv($next, 60), $next % 60);
            $segments[] = [$s, $e];
        }

        if (empty($segments)) {
            continue; // güvenlik
        }

        // Eski geniş kaydı sil
        $deleteStmt->execute([$slot['id']]);
        $totalDeleted++;

        // Çakışmayı önle: aynı consultant+date+start için zaten kayıt varsa atla
        foreach ($segments as [$s, $e]) {
            $dupe = $db->prepare("
                SELECT COUNT(*) FROM consultant_availability
                WHERE consultant_id = ? AND available_date = ? AND start_time = ?
            ");
            $dupe->execute([$slot['consultant_id'], $slot['available_date'], $s]);
            if ((int)$dupe->fetchColumn() > 0) {
                continue;
            }
            $insertStmt->execute([
                $slot['consultant_id'],
                $slot['service_id'],
                $slot['available_date'],
                $s,
                $e
            ]);
            $totalInserted++;
        }
    }

    $db->commit();
    echo "✓ Bölme tamamlandı.\n";
    echo "  Silinen geniş slot: {$totalDeleted}\n";
    echo "  Eklenen 60dk slot:  {$totalInserted}\n";
} catch (Throwable $e) {
    $db->rollBack();
    echo "✗ HATA — değişiklikler geri alındı: " . $e->getMessage() . "\n";
    exit(1);
}
