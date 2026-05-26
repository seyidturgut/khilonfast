<?php
// api/routes/onboarding.php
// Node muadili: backend/routes/onboarding.js
// /api/onboarding-form altında çalışır (controller='onboarding-form')

set_exception_handler(function (Throwable $e) {
    header('Content-Type: application/json', true, 500);
    echo json_encode(['error' => 'PHP Exception: ' . $e->getMessage()]);
    exit;
});

require_once __DIR__ . '/../utils.php';

$db = Database::getInstance();

// Tablo migration
try {
    $db->exec(
        "CREATE TABLE IF NOT EXISTS onboarding_forms (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            order_id INT NOT NULL,
            product_names TEXT,
            form_data JSON NOT NULL,
            status ENUM('new','reviewed') DEFAULT 'new',
            submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user_id (user_id),
            INDEX idx_order_id (order_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
    // status kolonu yoksa ekle
    $stmt = $db->query("SHOW COLUMNS FROM onboarding_forms LIKE 'status'");
    if (!$stmt->fetch()) {
        $db->exec("ALTER TABLE onboarding_forms ADD COLUMN status ENUM('new','reviewed') DEFAULT 'new' AFTER form_data");
    }

    // V2: stratejik brif & sunum akışı kolonları (idempotent)
    $cols = $db->query("SHOW COLUMNS FROM onboarding_forms")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('admin_general_note', $cols, true)) {
        $db->exec("ALTER TABLE onboarding_forms ADD COLUMN admin_general_note TEXT NULL AFTER status");
    }
    if (!in_array('admin_section_notes', $cols, true)) {
        $db->exec("ALTER TABLE onboarding_forms ADD COLUMN admin_section_notes JSON NULL AFTER admin_general_note");
    }
    if (!in_array('admin_followup_questions', $cols, true)) {
        $db->exec("ALTER TABLE onboarding_forms ADD COLUMN admin_followup_questions JSON NULL AFTER admin_section_notes");
    }
    if (!in_array('approved_at', $cols, true)) {
        $db->exec("ALTER TABLE onboarding_forms ADD COLUMN approved_at TIMESTAMP NULL DEFAULT NULL AFTER admin_followup_questions");
    }
    if (!in_array('approved_by', $cols, true)) {
        $db->exec("ALTER TABLE onboarding_forms ADD COLUMN approved_by INT NULL DEFAULT NULL AFTER approved_at");
    }
    // V3: hizmete özel re-brief verisi (template_key + intro + sections)
    if (!in_array('rebrief_data', $cols, true)) {
        $db->exec("ALTER TABLE onboarding_forms ADD COLUMN rebrief_data JSON NULL AFTER admin_followup_questions");
    }
    // V4: ürün-bazlı (sipariş kalemi bazlı) form
    if (!in_array('order_item_id', $cols, true)) {
        $db->exec("ALTER TABLE onboarding_forms ADD COLUMN order_item_id INT NULL AFTER order_id");
        $db->exec("ALTER TABLE onboarding_forms ADD INDEX idx_order_item_id (order_item_id)");
    }
    // Status enum'u genişlet (idempotent — aynı SQL tekrar çalışsa noop)
    $db->exec("ALTER TABLE onboarding_forms MODIFY status ENUM('new','reviewed','awaiting_user_response','approved') NOT NULL DEFAULT 'new'");
} catch (Throwable $e) {
    error_log('[onboarding] migration: ' . $e->getMessage());
}

$payload = requireAuth();

// ─────────────────────────────────────────────
// POST /api/onboarding-form  →  form kaydet + mail gönder
// ─────────────────────────────────────────────
if ($method === 'POST' && empty($action)) {
    $data = getJsonBody();
    $orderId = (int)($data['order_id'] ?? 0);
    $orderItemId = (int)($data['order_item_id'] ?? 0);
    $formData = $data['form_data'] ?? null;
    $productNames = trim((string)($data['product_names'] ?? ''));

    if ($orderId <= 0 || $orderItemId <= 0 || !is_array($formData)) {
        sendResponse(['error' => 'order_id, order_item_id ve form_data zorunlu'], 400);
    }

    // Sipariş 'completed' değilse form doldurmaya izin verme — manuel havale onaylanmadan engellenir.
    $orderStmt = $db->prepare("SELECT status FROM orders WHERE id = ? AND user_id = ? LIMIT 1");
    $orderStmt->execute([$orderId, $payload['id']]);
    $orderRow = $orderStmt->fetch();
    if (!$orderRow) {
        sendResponse(['error' => 'Order not found'], 404);
    }
    if (($orderRow['status'] ?? '') !== 'completed') {
        sendResponse([
            'error' => 'Bu sipariş için ödeme onayı bekleniyor. Ödemeniz onaylandığında form doldurabilirsiniz.',
            'order_status' => $orderRow['status']
        ], 403);
    }

    // order_item siparişe ait mi?
    $itStmt = $db->prepare("SELECT id FROM order_items WHERE id = ? AND order_id = ? LIMIT 1");
    $itStmt->execute([$orderItemId, $orderId]);
    if (!$itStmt->fetch()) {
        sendResponse(['error' => 'Sipariş kalemi geçersiz'], 403);
    }

    // Zaten doldurulmuş mu? (kalem bazlı)
    $stmt = $db->prepare("SELECT id FROM onboarding_forms WHERE order_item_id = ? AND user_id = ? LIMIT 1");
    $stmt->execute([$orderItemId, $payload['id']]);
    if ($stmt->fetch()) {
        sendResponse(['error' => 'Bu ürün için form zaten dolduruldu'], 409);
    }

    // Kullanıcı bilgisi
    $stmtUser = $db->prepare("SELECT first_name, last_name, email FROM users WHERE id = ? LIMIT 1");
    $stmtUser->execute([$payload['id']]);
    $user = $stmtUser->fetch();

    // Kaydet
    $stmt = $db->prepare(
        "INSERT INTO onboarding_forms (user_id, order_id, order_item_id, product_names, form_data) VALUES (?, ?, ?, ?, ?)"
    );
    $stmt->execute([
        $payload['id'],
        $orderId,
        $orderItemId,
        $productNames,
        json_encode($formData, JSON_UNESCAPED_UNICODE)
    ]);
    $formId = (int)$db->lastInsertId();

    // Mailler — sessiz başarısızlık (form yine kaydedilmiş olur)
    try {
        sendOnboardingEmails($db, $user, $productNames, $formData);
    } catch (Throwable $e) {
        error_log('[onboarding] email error: ' . $e->getMessage());
    }

    sendResponse(['success' => true, 'form_id' => $formId]);
}

$subAction = $routes[3] ?? '';

// ─────────────────────────────────────────────
// GET /api/onboarding-form/order/:orderId/items
//   → siparişteki her form-required kalem için durum
// ─────────────────────────────────────────────
if ($method === 'GET' && $action === 'order' && !empty($id) && $subAction === 'items') {
    $orderId = (int)$id;
    // Sipariş kullanıcıya ait mi?
    $oStmt = $db->prepare("SELECT id FROM orders WHERE id = ? AND user_id = ? LIMIT 1");
    $oStmt->execute([$orderId, $payload['id']]);
    if (!$oStmt->fetch()) {
        sendResponse(['error' => 'Sipariş bulunamadı'], 404);
    }
    $stmt = $db->prepare(
        "SELECT oi.id AS order_item_id, oi.product_id, p.name AS product_name,
                p.product_key, COALESCE(p.requires_onboarding, 0) AS requires_onboarding,
                ofm.id AS form_id, ofm.status, ofm.submitted_at
         FROM order_items oi
         JOIN products p ON p.id = oi.product_id
         LEFT JOIN onboarding_forms ofm
                ON ofm.order_item_id = oi.id AND ofm.user_id = ?
         WHERE oi.order_id = ?
         ORDER BY oi.id ASC"
    );
    $stmt->execute([$payload['id'], $orderId]);
    $rows = $stmt->fetchAll();
    $items = array_map(function ($r) {
        return [
            'order_item_id' => (int)$r['order_item_id'],
            'product_id' => (int)$r['product_id'],
            'product_name' => $r['product_name'],
            'product_key' => $r['product_key'],
            'requires_onboarding' => (bool)$r['requires_onboarding'],
            'exists' => !empty($r['form_id']),
            'form_id' => $r['form_id'] ? (int)$r['form_id'] : null,
            'status' => $r['status'] ?? null,
            'submitted_at' => $r['submitted_at'] ?? null,
        ];
    }, $rows);
    sendResponse(['items' => $items]);
}

// ─────────────────────────────────────────────
// GET /api/onboarding-form/order/:orderId  →  geri uyum: ilk form (eski tek-form sayfası için)
// ─────────────────────────────────────────────
if ($method === 'GET' && $action === 'order' && !empty($id)) {
    $orderId = (int)$id;
    $stmt = $db->prepare(
        "SELECT id, submitted_at, status, form_data, product_names,
                admin_general_note, admin_section_notes, admin_followup_questions, rebrief_data, approved_at
         FROM onboarding_forms WHERE order_id = ? AND user_id = ? LIMIT 1"
    );
    $stmt->execute([$orderId, $payload['id']]);
    $row = $stmt->fetch();
    if ($row) {
        // JSON kolonlarını parse et — frontend kolay tüketsin
        if (is_string($row['form_data'])) $row['form_data'] = json_decode($row['form_data'], true);
        if (is_string($row['admin_section_notes'] ?? null)) $row['admin_section_notes'] = json_decode($row['admin_section_notes'], true);
        if (is_string($row['admin_followup_questions'] ?? null)) $row['admin_followup_questions'] = json_decode($row['admin_followup_questions'], true);
        if (is_string($row['rebrief_data'] ?? null)) $row['rebrief_data'] = json_decode($row['rebrief_data'], true);
    }
    sendResponse(['exists' => (bool)$row, 'form' => $row ?: null]);
}

// ─────────────────────────────────────────────
// POST /api/onboarding-form/answer-followup/:formId  →  müşteri ek sorulara cevap verir
// ─────────────────────────────────────────────
if ($method === 'POST' && $action === 'answer-followup' && !empty($id)) {
    $formId = (int)$id;
    $data = getJsonBody();
    $answers = $data['answers'] ?? null; // [{id, answer}, ...]
    if (!is_array($answers)) sendResponse(['error' => 'answers gerekli'], 400);

    // Form'u sahiplik kontrolü ile fetch
    $stmt = $db->prepare(
        "SELECT id, user_id, admin_followup_questions, status
         FROM onboarding_forms WHERE id = ? AND user_id = ? LIMIT 1"
    );
    $stmt->execute([$formId, $payload['id']]);
    $row = $stmt->fetch();
    if (!$row) sendResponse(['error' => 'Form bulunamadı'], 404);

    $questions = is_string($row['admin_followup_questions']) ? json_decode($row['admin_followup_questions'], true) : ($row['admin_followup_questions'] ?? []);
    if (!is_array($questions) || empty($questions)) sendResponse(['error' => 'Cevaplanacak soru yok'], 400);

    $byId = [];
    foreach ($answers as $a) {
        if (isset($a['id']) && isset($a['answer'])) $byId[(string)$a['id']] = (string)$a['answer'];
    }
    foreach ($questions as &$q) {
        $qId = (string)($q['id'] ?? '');
        if ($qId !== '' && array_key_exists($qId, $byId)) {
            $q['answer'] = $byId[$qId];
            $q['answered_at'] = date('Y-m-d H:i:s');
        }
    }
    unset($q);

    $upd = $db->prepare(
        "UPDATE onboarding_forms
         SET admin_followup_questions = ?, status = 'reviewed'
         WHERE id = ?"
    );
    $upd->execute([json_encode($questions, JSON_UNESCAPED_UNICODE), $formId]);

    // Admin'e bilgilendirme maili
    try {
        $adminEmail = (string)getSetting($db, 'contact_email', '');
        if ($adminEmail !== '' && function_exists('sendTransactionalEmail')) {
            $userStmt = $db->prepare("SELECT first_name, last_name, email FROM users WHERE id = ? LIMIT 1");
            $userStmt->execute([$payload['id']]);
            $u = $userStmt->fetch();
            $userName = trim(($u['first_name'] ?? '') . ' ' . ($u['last_name'] ?? ''));
            $subject = 'Onboarding ek sorular cevaplandı — ' . $userName;
            $html = '<p>' . htmlspecialchars($userName, ENT_QUOTES, 'UTF-8') . ' (' . htmlspecialchars((string)($u['email'] ?? ''), ENT_QUOTES, 'UTF-8') . ') eklediğiniz ek soruları cevapladı.</p>'
                  . '<p>Form ID: ' . $formId . '</p>'
                  . '<p>Admin panelinden inceleyebilirsiniz.</p>';
            sendTransactionalEmail($db, $adminEmail, $subject, $html);
        }
    } catch (Throwable $e) { error_log('[onboarding] followup notify admin: ' . $e->getMessage()); }

    sendResponse(['success' => true, 'status' => 'reviewed']);
}

// ─────────────────────────────────────────────
// Admin endpoint'leri — role check
// ─────────────────────────────────────────────
$isAdmin = ($payload['role'] ?? 'user') === 'admin';

// GET /api/onboarding-form/admin/all  →  pagination + search + status filter
if ($method === 'GET' && $action === 'admin' && $id === 'all') {
    if (!$isAdmin) sendResponse(['error' => 'Yetkisiz'], 403);

    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = 20;
    $offset = ($page - 1) * $limit;
    $search = isset($_GET['search']) ? '%' . $_GET['search'] . '%' : null;
    $statusFilter = $_GET['status'] ?? null;

    $conditions = [];
    $params = [];
    if ($search) {
        $conditions[] = '(u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)';
        array_push($params, $search, $search, $search);
    }
    if ($statusFilter && in_array($statusFilter, ['new', 'reviewed'], true)) {
        $conditions[] = 'ofm.status = ?';
        $params[] = $statusFilter;
    }
    $where = $conditions ? 'WHERE ' . implode(' AND ', $conditions) : '';

    // product_names boşsa order_items'dan otomatik doldur (eski formlar için fallback)
    $sql = "SELECT ofm.id, ofm.user_id, ofm.order_id, ofm.status, ofm.submitted_at,
                   COALESCE(NULLIF(ofm.product_names, ''),
                     (SELECT GROUP_CONCAT(p.name SEPARATOR ', ')
                      FROM order_items oi JOIN products p ON p.id = oi.product_id
                      WHERE oi.order_id = ofm.order_id)
                   ) AS product_names,
                   CONCAT(u.first_name, ' ', u.last_name) AS user_name, u.email AS user_email,
                   o.order_number
            FROM onboarding_forms ofm
            JOIN users u ON u.id = ofm.user_id
            JOIN orders o ON o.id = ofm.order_id
            $where
            ORDER BY ofm.submitted_at DESC
            LIMIT $limit OFFSET $offset";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    $countSql = "SELECT COUNT(*) AS total FROM onboarding_forms ofm
                 JOIN users u ON u.id = ofm.user_id
                 $where";
    $countStmt = $db->prepare($countSql);
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();

    sendResponse([
        'forms' => $rows,
        'total' => $total,
        'page' => $page,
        'pages' => (int)ceil($total / $limit)
    ]);
}

// GET /api/onboarding-form/admin/:formId/pdf  →  yazıcı dostu HTML (kullanıcı PDF olarak kaydeder)
// NOT: Bu route mutlaka generic /admin/:id route'undan ÖNCE gelmeli, aksi halde JSON match eder.
if ($method === 'GET' && $action === 'admin' && !empty($id) && ($routes[3] ?? '') === 'pdf') {
    if (!$isAdmin) {
        http_response_code(403);
        header('Content-Type: text/html; charset=UTF-8');
        echo '<h1>Yetkisiz</h1>'; exit;
    }
    $stmt = $db->prepare("
        SELECT f.*, u.first_name, u.last_name, u.email, o.order_number, o.created_at AS order_date
        FROM onboarding_forms f
        JOIN users u ON u.id = f.user_id
        LEFT JOIN orders o ON o.id = f.order_id
        WHERE f.id = ?
        LIMIT 1
    ");
    $stmt->execute([(int)$id]);
    $form = $stmt->fetch();
    if (!$form) {
        http_response_code(404);
        header('Content-Type: text/html; charset=UTF-8');
        echo '<h1>Form bulunamadı</h1>'; exit;
    }
    $formData = is_string($form['form_data']) ? json_decode($form['form_data'], true) : $form['form_data'];
    $userName = trim(($form['first_name'] ?? '') . ' ' . ($form['last_name'] ?? ''));
    $orderNumber = (string)($form['order_number'] ?? '—');
    $submittedAt = (string)($form['submitted_at'] ?? '');

    header('Content-Type: text/html; charset=UTF-8');
    header('Cache-Control: private, no-store');

    $h = function ($s) { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); };
    $title = 'Onboarding Formu — ' . $orderNumber;

    echo "<!doctype html><html lang='tr'><head><meta charset='UTF-8'>";
    echo "<title>" . $h($title) . "</title>";
    echo "<style>
        @page { size: A4; margin: 18mm; }
        * { box-sizing: border-box; }
        body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #102a43; line-height: 1.55; margin: 0; padding: 0; background: #fff; }
        .header { background: linear-gradient(90deg,#1a3a52,#89b004); color: #fff; padding: 22px 28px; border-radius: 10px; margin-bottom: 20px; }
        .header h1 { margin: 0 0 4px; font-size: 22px; }
        .header .subtitle { font-size: 13px; opacity: .9; }
        .meta { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 24px; padding: 14px 18px; background: #f6f8fb; border-radius: 8px; margin-bottom: 24px; font-size: 13px; }
        .meta b { color: #1a3a52; }
        .section { margin-bottom: 22px; page-break-inside: avoid; }
        .section h2 { font-size: 15px; color: #1a3a52; border-bottom: 2px solid #89b004; padding-bottom: 6px; margin: 0 0 10px; }
        .field { padding: 8px 0; border-bottom: 1px solid #eef2f7; }
        .field:last-child { border-bottom: none; }
        .field .label { font-weight: 600; color: #475569; font-size: 12px; text-transform: uppercase; letter-spacing: .3px; margin-bottom: 4px; }
        .field .value { color: #102a43; font-size: 14px; white-space: pre-wrap; word-break: break-word; }
        .field .empty { color: #94a3b8; font-style: italic; }
        .actions { text-align: center; margin: 20px 0; }
        .actions button { background: #1a3a52; color: #fff; border: 0; padding: 10px 22px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 14px; }
        @media print { .actions { display: none; } body { padding: 0; } }
    </style></head><body>";
    echo "<div class='header'><h1>" . $h($title) . "</h1><div class='subtitle'>khilonfast — Onboarding Formu</div></div>";
    echo "<div class='actions'><button onclick='window.print()'>📄 PDF olarak Kaydet / Yazdır</button></div>";
    echo "<div class='meta'>";
    echo "<div><b>Müşteri:</b> " . $h($userName) . "</div>";
    echo "<div><b>E-posta:</b> " . $h($form['email']) . "</div>";
    echo "<div><b>Sipariş No:</b> " . $h($orderNumber) . "</div>";
    echo "<div><b>Form Gönderim:</b> " . $h($submittedAt) . "</div>";
    echo "<div style='grid-column: 1/-1'><b>Ürünler:</b> " . $h($form['product_names']) . "</div>";
    echo "</div>";

    if (is_array($formData) && !empty($formData)) {
        foreach ($formData as $sectionKey => $fields) {
            if (!is_array($fields)) continue;
            echo "<div class='section'><h2>" . $h($sectionKey) . "</h2>";
            foreach ($fields as $label => $value) {
                $valStr = is_array($value) ? implode(', ', $value) : (string)$value;
                $valStr = trim($valStr);
                echo "<div class='field'>";
                echo "<div class='label'>" . $h($label) . "</div>";
                if ($valStr === '') {
                    echo "<div class='value empty'>(boş)</div>";
                } else {
                    echo "<div class='value'>" . nl2br($h($valStr)) . "</div>";
                }
                echo "</div>";
            }
            echo "</div>";
        }
    } else {
        echo "<div class='section'><div class='field'><div class='value empty'>Form verisi bulunamadı.</div></div></div>";
    }

    // Yeni tab'da auto-trigger print dialogu
    echo "<script>window.addEventListener('load', () => setTimeout(() => window.print(), 350));</script>";
    echo "</body></html>";
    exit;
}

// GET /api/onboarding-form/admin/user/:userId  →  o kullanıcının formları
if ($method === 'GET' && $action === 'admin' && !empty($id)) {
    if (!$isAdmin) sendResponse(['error' => 'Yetkisiz'], 403);
    // /admin/user/:userId mi yoksa /admin/:formId mi?
    if ($id === 'user' && !empty($routes[3])) {
        $userId = (int)$routes[3];
        $stmt = $db->prepare(
            "SELECT ofm.*, o.order_number
             FROM onboarding_forms ofm
             JOIN orders o ON o.id = ofm.order_id
             WHERE ofm.user_id = ?
             ORDER BY ofm.submitted_at DESC"
        );
        $stmt->execute([$userId]);
        sendResponse($stmt->fetchAll());
    }

    // /admin/:formId  →  tek form detayı (form_data + admin notlar + ek sorular dahil)
    $formId = (int)$id;
    $stmt = $db->prepare(
        "SELECT ofm.*, CONCAT(u.first_name, ' ', u.last_name) AS user_name, u.email AS user_email, o.order_number
         FROM onboarding_forms ofm
         JOIN users u ON u.id = ofm.user_id
         JOIN orders o ON o.id = ofm.order_id
         WHERE ofm.id = ?"
    );
    $stmt->execute([$formId]);
    $form = $stmt->fetch();
    if (!$form) sendResponse(['error' => 'Form bulunamadı'], 404);
    if (is_string($form['form_data'])) {
        $form['form_data'] = json_decode($form['form_data'], true);
    }
    if (isset($form['admin_section_notes']) && is_string($form['admin_section_notes'])) {
        $form['admin_section_notes'] = json_decode($form['admin_section_notes'], true);
    }
    if (isset($form['admin_followup_questions']) && is_string($form['admin_followup_questions'])) {
        $form['admin_followup_questions'] = json_decode($form['admin_followup_questions'], true);
    }
    if (isset($form['rebrief_data']) && is_string($form['rebrief_data'])) {
        $form['rebrief_data'] = json_decode($form['rebrief_data'], true);
    }
    sendResponse($form);
}

// PUT /api/onboarding-form/admin/:formId/status  →  durum güncelle (legacy)
if ($method === 'PUT' && $action === 'admin' && !empty($id) && ($routes[3] ?? '') === 'status') {
    if (!$isAdmin) sendResponse(['error' => 'Yetkisiz'], 403);
    $data = getJsonBody();
    $newStatus = (string)($data['status'] ?? '');
    if (!in_array($newStatus, ['new', 'reviewed', 'awaiting_user_response', 'approved'], true)) {
        sendResponse(['error' => 'Geçersiz status'], 400);
    }
    $stmt = $db->prepare("UPDATE onboarding_forms SET status = ? WHERE id = ?");
    $stmt->execute([$newStatus, (int)$id]);
    sendResponse(['success' => true]);
}

// PUT /api/onboarding-form/admin/:formId/notes  →  admin genel + section notları + re-brief kaydet
if ($method === 'PUT' && $action === 'admin' && !empty($id) && ($routes[3] ?? '') === 'notes') {
    if (!$isAdmin) sendResponse(['error' => 'Yetkisiz'], 403);
    $data = getJsonBody();
    $generalNote = isset($data['general_note']) ? (string)$data['general_note'] : null;
    $sectionNotes = isset($data['section_notes']) && is_array($data['section_notes']) ? $data['section_notes'] : null;
    $rebrief = isset($data['rebrief_data']) && is_array($data['rebrief_data']) ? $data['rebrief_data'] : null;

    $stmt = $db->prepare(
        "UPDATE onboarding_forms
         SET admin_general_note = ?,
             admin_section_notes = ?,
             rebrief_data = ?,
             status = CASE WHEN status = 'new' THEN 'reviewed' ELSE status END
         WHERE id = ?"
    );
    $stmt->execute([
        $generalNote,
        $sectionNotes !== null ? json_encode($sectionNotes, JSON_UNESCAPED_UNICODE) : null,
        $rebrief !== null ? json_encode($rebrief, JSON_UNESCAPED_UNICODE) : null,
        (int)$id,
    ]);
    sendResponse(['success' => true]);
}

// POST /api/onboarding-form/admin/:formId/questions  →  ek sorular ekle, müşteriye mail
if ($method === 'POST' && $action === 'admin' && !empty($id) && ($routes[3] ?? '') === 'questions') {
    if (!$isAdmin) sendResponse(['error' => 'Yetkisiz'], 403);
    $data = getJsonBody();
    $newQuestions = $data['questions'] ?? null; // [{question}, ...]
    if (!is_array($newQuestions) || empty($newQuestions)) {
        sendResponse(['error' => 'questions array gerekli'], 400);
    }

    // Mevcut soruları yükle, yenilerini append et
    $stmt = $db->prepare(
        "SELECT f.*, u.email AS user_email, u.first_name, o.order_number, o.customer_lang
         FROM onboarding_forms f
         JOIN users u ON u.id = f.user_id
         LEFT JOIN orders o ON o.id = f.order_id
         WHERE f.id = ? LIMIT 1"
    );
    $stmt->execute([(int)$id]);
    $form = $stmt->fetch();
    if (!$form) sendResponse(['error' => 'Form bulunamadı'], 404);

    $existing = is_string($form['admin_followup_questions']) ? json_decode($form['admin_followup_questions'], true) : ($form['admin_followup_questions'] ?? []);
    if (!is_array($existing)) $existing = [];

    foreach ($newQuestions as $q) {
        $qText = trim((string)($q['question'] ?? ''));
        if ($qText === '') continue;
        $existing[] = [
            'id' => 'q' . (count($existing) + 1) . '_' . substr(bin2hex(random_bytes(4)), 0, 6),
            'question' => $qText,
            'answer' => null,
            'answered_at' => null,
            'created_at' => date('Y-m-d H:i:s'),
        ];
    }

    $upd = $db->prepare(
        "UPDATE onboarding_forms
         SET admin_followup_questions = ?, status = 'awaiting_user_response'
         WHERE id = ?"
    );
    $upd->execute([json_encode($existing, JSON_UNESCAPED_UNICODE), (int)$id]);

    // Müşteriye mail
    try {
        if (function_exists('sendTransactionalEmail')) {
            $lang = (string)($form['customer_lang'] ?? 'tr');
            $isEn = $lang === 'en';
            $frontendBase = defined('FRONTEND_URL') ? rtrim(FRONTEND_URL, '/') : 'https://khilonfast.com';
            $link = $frontendBase . ($isEn ? '/en/onboarding-presentation/' : '/onboarding-sunumu/') . (int)$form['order_id'];
            $subject = $isEn
                ? 'We have additional questions for your strategic brief'
                : 'Stratejik brifimiz için ek sorularımız var';
            $html = $isEn
                ? '<p>Hello ' . htmlspecialchars((string)($form['first_name'] ?? ''), ENT_QUOTES, 'UTF-8') . ',</p>'
                  . '<p>Our team has a few additional questions while preparing your strategic brief. Please answer them so we can finalize your roadmap.</p>'
                  . '<p><a href="' . $link . '" style="background:#1a3a52;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">Answer Questions</a></p>'
                : '<p>Merhaba ' . htmlspecialchars((string)($form['first_name'] ?? ''), ENT_QUOTES, 'UTF-8') . ',</p>'
                  . '<p>Stratejik brifinizi hazırlarken birkaç ek sorumuz var. Lütfen cevaplayın ki yol haritanızı tamamlayalım.</p>'
                  . '<p><a href="' . $link . '" style="background:#1a3a52;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">Soruları Cevapla</a></p>';
            sendTransactionalEmail($db, (string)$form['user_email'], $subject, $html);
        }
    } catch (Throwable $e) { error_log('[onboarding] followup mail user: ' . $e->getMessage()); }

    sendResponse(['success' => true, 'status' => 'awaiting_user_response', 'total_questions' => count($existing)]);
}

// POST /api/onboarding-form/admin/:formId/approve  →  sunumu onayla, müşteriye mail
if ($method === 'POST' && $action === 'admin' && !empty($id) && ($routes[3] ?? '') === 'approve') {
    if (!$isAdmin) sendResponse(['error' => 'Yetkisiz'], 403);

    $stmt = $db->prepare(
        "SELECT f.*, u.email AS user_email, u.first_name, o.order_number, o.customer_lang
         FROM onboarding_forms f
         JOIN users u ON u.id = f.user_id
         LEFT JOIN orders o ON o.id = f.order_id
         WHERE f.id = ? LIMIT 1"
    );
    $stmt->execute([(int)$id]);
    $form = $stmt->fetch();
    if (!$form) sendResponse(['error' => 'Form bulunamadı'], 404);

    $upd = $db->prepare(
        "UPDATE onboarding_forms
         SET status = 'approved', approved_at = NOW(), approved_by = ?
         WHERE id = ?"
    );
    $upd->execute([(int)$payload['id'], (int)$id]);

    // Müşteriye mail — stratejik brifi hazır
    try {
        if (function_exists('sendTransactionalEmail')) {
            $lang = (string)($form['customer_lang'] ?? 'tr');
            $isEn = $lang === 'en';
            $frontendBase = defined('FRONTEND_URL') ? rtrim(FRONTEND_URL, '/') : 'https://khilonfast.com';
            $link = $frontendBase . ($isEn ? '/en/onboarding-presentation/' : '/onboarding-sunumu/') . (int)$form['order_id'];
            $subject = $isEn ? 'Your strategic brief is ready' : 'Stratejik brifin hazır';
            $html = $isEn
                ? '<p>Hello ' . htmlspecialchars((string)($form['first_name'] ?? ''), ENT_QUOTES, 'UTF-8') . ',</p>'
                  . '<p>Your personalized strategic brief is ready. Click below to view it.</p>'
                  . '<p><a href="' . $link . '" style="background:linear-gradient(90deg,#1a3a52,#89b004);color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold">View Strategic Brief</a></p>'
                : '<p>Merhaba ' . htmlspecialchars((string)($form['first_name'] ?? ''), ENT_QUOTES, 'UTF-8') . ',</p>'
                  . '<p>Size özel stratejik brifimiz hazır. Aşağıdaki butona tıklayarak görüntüleyebilirsiniz.</p>'
                  . '<p><a href="' . $link . '" style="background:linear-gradient(90deg,#1a3a52,#89b004);color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold">Stratejik Brifimi Gör</a></p>';
            sendTransactionalEmail($db, (string)$form['user_email'], $subject, $html);
        }
    } catch (Throwable $e) { error_log('[onboarding] approve mail user: ' . $e->getMessage()); }

    sendResponse(['success' => true, 'status' => 'approved']);
}

sendResponse(['error' => 'Action not found'], 404);


// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
 * Hem admin hem müşteri için onboarding email'lerini gönderir.
 */
function sendOnboardingEmails(PDO $db, $user, $productNames, $formData)
{
    $adminEmail = (string)getSetting($db, 'contact_email', '');
    $userName = trim(($user['first_name'] ?? '') . ' ' . ($user['last_name'] ?? ''));
    $userEmail = (string)($user['email'] ?? '');

    // Admin maili
    if ($adminEmail) {
        $adminSubject = 'Yeni Onboarding Formu — ' . $userName;
        $adminHtml = buildOnboardingAdminHtml($userName, $userEmail, $productNames, $formData);
        try {
            sendTransactionalEmail($db, $adminEmail, $adminSubject, $adminHtml);
        } catch (Throwable $e) {
            error_log('[onboarding] admin email error: ' . $e->getMessage());
        }
    }

    // Müşteri maili (onay)
    if ($userEmail) {
        $confSubject = 'Onboarding Formunuz Alındı — Khilonfast';
        $confHtml = buildOnboardingConfirmationHtml($user['first_name'] ?? '', $productNames);
        try {
            sendTransactionalEmail($db, $userEmail, $confSubject, $confHtml);
        } catch (Throwable $e) {
            error_log('[onboarding] customer email error: ' . $e->getMessage());
        }
    }
}

function buildOnboardingAdminHtml($userName, $userEmail, $productNames, $formData)
{
    $sections = [
        'bolum1' => 'Temel Bilgiler', 'bolum2' => 'İş & Ürün Tanımı',
        'bolum3' => 'Rekabet', 'bolum4' => 'Hedef Kitle & Organizasyon',
        'bolum5' => 'Müşteri İhtiyaç & Problem', 'bolum6' => 'Değer Önerileri',
        'bolum7' => 'Satın Alma Davranışı', 'bolum8' => 'Beklenti & Sonuç',
        'bolum9' => 'Kanal & Performans', 'bolum10' => 'Teknoloji & Altyapı',
        'bolum11' => 'Operasyon Süreci', 'bolum12' => 'Stratejik Gerçekler',
    ];

    $sectionsHtml = '';
    foreach ($sections as $key => $title) {
        $section = $formData[$key] ?? null;
        if (!$section || !is_array($section)) continue;
        $rows = '';
        foreach ($section as $field => $value) {
            if ($value === '' || $value === null) continue;
            $safeField = htmlspecialchars(str_replace('_', ' ', (string)$field), ENT_QUOTES, 'UTF-8');
            $safeValue = nl2br(htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8'));
            $rows .= "<tr>
                <td style=\"padding:4px 8px;color:#64748b;font-size:12px;width:38%;vertical-align:top\">{$safeField}</td>
                <td style=\"padding:4px 8px;font-size:12px;color:#1e293b\">{$safeValue}</td>
            </tr>";
        }
        if (!$rows) continue;
        $sectionsHtml .= "<h3 style=\"margin:14px 0 4px;font-size:12px;color:#0f766e;text-transform:uppercase\">{$title}</h3>
            <table style=\"width:100%;border-collapse:collapse;background:#f8fafc\">{$rows}</table>";
    }

    $safeUserName = htmlspecialchars($userName, ENT_QUOTES, 'UTF-8');
    $safeUserEmail = htmlspecialchars($userEmail, ENT_QUOTES, 'UTF-8');
    $safeProducts = htmlspecialchars((string)$productNames, ENT_QUOTES, 'UTF-8');
    $productsLine = $safeProducts !== ''
        ? "<p style=\"margin:0 0 12px;font-size:14px;color:#334e68\"><strong>Satın Alınan Hizmet:</strong> {$safeProducts}</p>"
        : '';

    return '<!doctype html><html lang="tr"><head><meta charset="utf-8"/></head>
        <body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,sans-serif;color:#102a43">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:24px 12px">
        <tr><td align="center">
        <table role="presentation" width="620" cellspacing="0" cellpadding="0" style="max-width:620px;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #d9e2ec">
            <tr><td style="background:linear-gradient(135deg,#0f766e,#0ea5a4);padding:20px 24px;color:#fff">
                <h1 style="margin:0;font-size:20px">Yeni Onboarding Formu</h1>
                <p style="margin:6px 0 0;font-size:13px;opacity:.9">' . $safeUserName . ' — ' . $safeUserEmail . '</p>
            </td></tr>
            <tr><td style="padding:20px 24px">' . $productsLine . $sectionsHtml . '</td></tr>
        </table></td></tr></table></body></html>';
}

function buildOnboardingConfirmationHtml($firstName, $productNames)
{
    $safeFirst = htmlspecialchars((string)($firstName ?: 'Değerli Müşterimiz'), ENT_QUOTES, 'UTF-8');
    $safeProducts = htmlspecialchars((string)$productNames, ENT_QUOTES, 'UTF-8');
    $productsTxt = $safeProducts !== '' ? "<strong>{$safeProducts}</strong> hizmeti için " : '';

    return '<!doctype html><html lang="tr"><head><meta charset="utf-8"/></head>
        <body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,sans-serif">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:24px 12px">
        <tr><td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #d9e2ec">
            <tr><td style="background:linear-gradient(135deg,#0f766e,#0ea5a4);padding:20px 24px;color:#fff">
                <h1 style="margin:0;font-size:20px">Formunuz Alındı</h1>
            </td></tr>
            <tr><td style="padding:24px">
                <p style="margin:0 0 14px;font-size:15px">Merhaba ' . $safeFirst . ',</p>
                <p style="margin:0 0 14px;font-size:14px;color:#334e68">' . $productsTxt . 'B2B Growth Onboarding formunuz alınmıştır. Ekibimiz en kısa sürede sizinle iletişime geçecektir.</p>
            </td></tr>
        </table></td></tr></table></body></html>';
}
