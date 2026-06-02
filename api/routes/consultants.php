<?php
// api/routes/consultants.php

$db = Database::getInstance();

require_once __DIR__ . '/../services/ConsultantMailer.php';

// Idempotent migration: title_en + bio_en kolonları (EN locale için)
try {
    $cols = $db->query("SHOW COLUMNS FROM consultants")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('title_en', $cols, true)) {
        $db->exec("ALTER TABLE consultants ADD COLUMN title_en VARCHAR(255) DEFAULT NULL AFTER title");
    }
    if (!in_array('bio_en', $cols, true)) {
        $db->exec("ALTER TABLE consultants ADD COLUMN bio_en TEXT DEFAULT NULL AFTER bio");
    }
} catch (Throwable $e) {
    error_log('[consultants] schema migration: ' . $e->getMessage());
}

if ($method === 'GET') {
    $lang = $_GET['lang'] ?? 'tr';

    // GET /api/consultants/{slug}/availability
    if (!empty($action) && !empty($id) && $id === 'availability') {
        $stmt = $db->prepare("SELECT id FROM consultants WHERE slug = ? AND is_active = TRUE");
        $stmt->execute([$action]);
        $consultant = $stmt->fetch();
        if (!$consultant) sendResponse(['error' => 'Consultant not found'], 404);

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

        // Slot hold et
        $holdExpires = null;
        if ($availability_id) {
            $stmt = $db->prepare("SELECT * FROM consultant_availability WHERE id = ? AND status = 'available'");
            $stmt->execute([$availability_id]);
            $slot = $stmt->fetch();
            if (!$slot) sendResponse(['error' => 'Bu slot artık müsait değil. Lütfen başka bir zaman seçin.'], 409);
            $holdUntil = date('Y-m-d H:i:s', strtotime('+15 minutes'));
            $db->prepare("UPDATE consultant_availability SET status='held', held_until=? WHERE id=?")->execute([$holdUntil, $availability_id]);
            $holdExpires = date('c', strtotime('+15 minutes'));
        }

        // Booking oluştur
        $stmt = $db->prepare("INSERT INTO consultant_bookings (consultant_id, service_id, availability_id, name, email, phone, company, topic, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')");
        $stmt->execute([$consultantId, $service_id, $availability_id, $name, $email, $phone ?: null, $company ?: null, $topic ?: null]);
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

        sendResponse([
            'booking_id'     => $newBookingId,
            'hold_expires_at' => $holdExpires,
            'message'        => 'Rezervasyon talebi alındı'
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
