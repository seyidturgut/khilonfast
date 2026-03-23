<?php
// api/routes/consultants.php

$db = Database::getInstance();

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

    // GET /api/consultants/{slug}
    if (!empty($action)) {
        $stmt = $db->prepare("SELECT * FROM consultants WHERE slug = ? AND is_active = TRUE");
        $stmt->execute([$action]);
        $consultant = $stmt->fetch();
        if (!$consultant) sendResponse(['error' => 'Consultant not found'], 404);

        $consultant['sectors'] = json_decode($consultant['sectors'] ?? '[]', true);

        // Hizmetler (parent + alt paketler)
        $stmt = $db->prepare("
            SELECT * FROM consultant_services
            WHERE consultant_id = ? AND is_active = TRUE
            ORDER BY sort_order
        ");
        $stmt->execute([$consultant['id']]);
        $services = $stmt->fetchAll();

        foreach ($services as &$svc) {
            $svc['scope_items']    = json_decode($svc['scope_items'] ?? '[]', true);
            $svc['scope_items_en'] = json_decode($svc['scope_items_en'] ?? '[]', true);
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

    // GET /api/consultants?sector=fintech
    $sector = $_GET['sector'] ?? null;
    if ($sector) {
        $stmt = $db->prepare("
            SELECT id, slug, name, title, photo_url, stars, review_count, sectors
            FROM consultants WHERE is_active = TRUE
            AND JSON_CONTAINS(sectors, ?)
            ORDER BY id
        ");
        $stmt->execute([json_encode($sector)]);
    } else {
        $stmt = $db->query("
            SELECT id, slug, name, title, photo_url, stars, review_count, sectors
            FROM consultants WHERE is_active = TRUE ORDER BY id
        ");
    }
    $consultants = $stmt->fetchAll();
    foreach ($consultants as &$c) {
        $c['sectors'] = json_decode($c['sectors'] ?? '[]', true);
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

        sendResponse([
            'booking_id'     => $db->lastInsertId(),
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
