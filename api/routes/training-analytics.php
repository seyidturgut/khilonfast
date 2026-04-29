<?php
// api/routes/training-analytics.php
$db = Database::getInstance();
ensureTrainingAccessPagesSchema($db);

// GET /api/training-analytics/configs — public, returns all training page configs
if ($action === 'configs' && $method === 'GET') {
    $stmt = $db->query("SELECT id, slug, product_key, title_tr, title_en FROM training_access_pages ORDER BY id ASC");
    $rows = $stmt->fetchAll();
    sendResponse($rows);
}

// GET /api/training-analytics/config/:slug — public, no auth required
if ($action === 'config' && $method === 'GET' && !empty($id)) {
    $stmt = $db->prepare("SELECT * FROM training_access_pages WHERE slug=? LIMIT 1");
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) sendResponse(['error' => 'Not found'], 404);

    // Dersleri ekle
    $lessonsStmt = $db->prepare("
        SELECT id, title_tr, title_en, description_tr, description_en,
               vimeo_url_tr, vimeo_url_en, pdf_url, order_index, duration_label
        FROM training_lessons
        WHERE training_id = ? AND is_published = 1
        ORDER BY order_index ASC
    ");
    $lessonsStmt->execute([$row['id']]);
    $row['lessons'] = $lessonsStmt->fetchAll();

    sendResponse($row);
}

$payload = requireAuth();

// GET /api/training-analytics/pdf/:slug?lang=tr|en — auth-protected, streams PDF as blob
if ($action === 'pdf' && $method === 'GET' && !empty($id)) {
    $slug = $id;
    $lang = ($_GET['lang'] ?? 'tr') === 'en' ? 'en' : 'tr';

    $stmt = $db->prepare("SELECT id, product_key, pdf_url, pdf_url_tr, pdf_url_en FROM training_access_pages WHERE slug=? LIMIT 1");
    $stmt->execute([$slug]);
    $row = $stmt->fetch();
    if (!$row) sendResponse(['error' => 'Not found'], 404);

    // Verify user has active subscription
    $sub = $db->prepare("
        SELECT s.id FROM subscriptions s
        JOIN products p ON p.id = s.product_id
        WHERE s.user_id = ? AND p.product_key = ? AND s.status = 'active'
        LIMIT 1
    ");
    $sub->execute([$payload['id'], $row['product_key']]);
    if (!$sub->fetch()) {
        // Allow admin to view
        $u = $db->prepare("SELECT role FROM users WHERE id=?");
        $u->execute([$payload['id']]);
        $usr = $u->fetch();
        if (!$usr || $usr['role'] !== 'admin') sendResponse(['error' => 'No access'], 403);
    }

    $pdfUrl = $lang === 'en'
        ? ($row['pdf_url_en'] ?: $row['pdf_url_tr'] ?: $row['pdf_url'])
        : ($row['pdf_url_tr'] ?: $row['pdf_url_en'] ?: $row['pdf_url']);
    $pdfUrl = trim((string)$pdfUrl);
    if ($pdfUrl === '') sendResponse(['error' => 'PDF not configured'], 404);

    // Resolve to local file path (only allow local /uploads or /egitim-dokumanlar)
    $rel = ltrim(parse_url($pdfUrl, PHP_URL_PATH) ?: '', '/');
    $base = realpath(__DIR__ . '/../..');
    $candidate = $base ? realpath($base . '/' . $rel) : false;
    if (!$candidate || strpos($candidate, $base) !== 0 || !is_file($candidate)) {
        sendResponse(['error' => 'PDF file not found'], 404);
    }

    header('Content-Type: application/pdf');
    header('Content-Length: ' . filesize($candidate));
    header('Content-Disposition: inline; filename="training.pdf"');
    header('Cache-Control: private, no-store');
    readfile($candidate);
    exit;
}

// POST /api/training-analytics/heartbeat
if ($action === 'heartbeat' && $method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $productKey = trim((string)($data['product_key'] ?? ''));
    $secondsDelta = (int)($data['seconds_delta'] ?? 0);

    if ($productKey === '' || $secondsDelta <= 0) {
        sendResponse(['error' => 'Invalid data'], 400);
    }

    // Verify user has active subscription for this product
    $stmt = $db->prepare("
        SELECT s.id FROM subscriptions s
        JOIN products p ON p.id = s.product_id
        WHERE s.user_id = ? AND p.product_key = ? AND s.status = 'active'
        LIMIT 1
    ");
    $stmt->execute([$payload['id'], $productKey]);
    if (!$stmt->fetch()) {
        sendResponse(['error' => 'No active subscription'], 403);
    }

    $today = date('Y-m-d');
    $stmt = $db->prepare("SELECT id FROM training_watch_sessions WHERE user_id=? AND product_key=? AND DATE(session_start)=?");
    $stmt->execute([$payload['id'], $productKey, $today]);
    $existing = $stmt->fetch();

    if ($existing) {
        $db->prepare("UPDATE training_watch_sessions SET seconds_watched = seconds_watched + ? WHERE id=?")->execute([$secondsDelta, $existing['id']]);
    } else {
        $db->prepare("INSERT INTO training_watch_sessions (user_id, product_key, seconds_watched) VALUES (?,?,?)")->execute([$payload['id'], $productKey, $secondsDelta]);
    }

    sendResponse(['success' => true]);
}

sendResponse(['error' => 'Action not found'], 404);
