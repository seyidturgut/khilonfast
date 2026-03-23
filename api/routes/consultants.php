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

if ($method === 'POST') {
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
