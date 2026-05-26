<?php
// api/routes/manual-bank-accounts.php
// Manuel havale hesap yönetimi — Lidio'dan bağımsız.
// PUBLIC: GET /api/manual-bank-accounts (aktif hesapları liste)
// ADMIN:  GET/POST/PUT/DELETE /api/admin/manual-bank-accounts (CRUD)

set_exception_handler(function (Throwable $e) {
    header('Content-Type: application/json', true, 500);
    echo json_encode(['error' => 'PHP Exception: ' . $e->getMessage()]);
    exit;
});

require_once __DIR__ . '/../utils.php';

$db = Database::getInstance();

// Tablo migration — ilk istekte auto-create
try {
    $db->exec(
        "CREATE TABLE IF NOT EXISTS manual_bank_accounts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            bank_name VARCHAR(100) NOT NULL,
            account_holder VARCHAR(150) NOT NULL,
            iban VARCHAR(50) NOT NULL,
            swift VARCHAR(20) DEFAULT NULL,
            currency VARCHAR(3) NOT NULL DEFAULT 'TRY',
            notes TEXT DEFAULT NULL,
            is_active TINYINT(1) DEFAULT 1,
            display_order INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_iban (iban),
            KEY idx_active_order (is_active, display_order),
            KEY idx_currency (currency)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );
} catch (Throwable $e) {
    error_log('[manual-bank-accounts] migration: ' . $e->getMessage());
}

// PUBLIC endpoint — sadece aktif hesapları listele (lang opsiyonel filtrasyon TRY/USD)
if ($controller === 'manual-bank-accounts') {
    if ($method !== 'GET') {
        sendResponse(['error' => 'Method not allowed'], 405);
    }
    $currencyFilter = isset($_GET['currency']) ? strtoupper(trim((string)$_GET['currency'])) : null;
    $where = 'WHERE is_active = 1';
    $params = [];
    if ($currencyFilter && in_array($currencyFilter, ['TRY', 'USD'], true)) {
        $where .= ' AND currency = ?';
        $params[] = $currencyFilter;
    }
    $sql = "SELECT id, bank_name, account_holder, iban, swift, currency, notes, display_order
            FROM manual_bank_accounts
            $where
            ORDER BY display_order ASC, bank_name ASC";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    sendResponse(['accounts' => $stmt->fetchAll()]);
}

// ADMIN endpoints — buraya gelinmiyorsa controller='admin' route'undan delege ediliyordur
$payload = requireAuth();
$isAdmin = ($payload['role'] ?? 'user') === 'admin';
if (!$isAdmin) {
    sendResponse(['error' => 'Forbidden'], 403);
}

// GET /api/admin/manual-bank-accounts — tümünü listele (aktif/pasif)
if ($method === 'GET' && empty($id)) {
    $stmt = $db->query(
        "SELECT id, bank_name, account_holder, iban, swift, currency, notes, is_active, display_order, created_at, updated_at
         FROM manual_bank_accounts
         ORDER BY display_order ASC, bank_name ASC"
    );
    sendResponse(['accounts' => $stmt->fetchAll()]);
}

// POST /api/admin/manual-bank-accounts — yeni hesap
if ($method === 'POST' && empty($id)) {
    $data = getJsonBody();
    $bankName = trim((string)($data['bank_name'] ?? ''));
    $accountHolder = trim((string)($data['account_holder'] ?? ''));
    $iban = strtoupper(preg_replace('/\s+/', '', (string)($data['iban'] ?? '')));
    $swift = trim((string)($data['swift'] ?? '')) ?: null;
    $currency = strtoupper(trim((string)($data['currency'] ?? 'TRY')));
    $notes = trim((string)($data['notes'] ?? '')) ?: null;
    $isActive = isset($data['is_active']) ? (int)(bool)$data['is_active'] : 1;
    $displayOrder = (int)($data['display_order'] ?? 0);

    if ($bankName === '' || $accountHolder === '' || $iban === '') {
        sendResponse(['error' => 'bank_name, account_holder ve iban zorunludur'], 400);
    }
    if (!in_array($currency, ['TRY', 'USD'], true)) {
        sendResponse(['error' => 'currency TRY veya USD olmali'], 400);
    }

    $exists = $db->prepare("SELECT id FROM manual_bank_accounts WHERE iban = ? LIMIT 1");
    $exists->execute([$iban]);
    if ($exists->fetch()) {
        sendResponse(['error' => 'Bu IBAN zaten kayitli'], 409);
    }

    $stmt = $db->prepare(
        "INSERT INTO manual_bank_accounts (bank_name, account_holder, iban, swift, currency, notes, is_active, display_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    );
    $stmt->execute([$bankName, $accountHolder, $iban, $swift, $currency, $notes, $isActive, $displayOrder]);
    sendResponse(['id' => (int)$db->lastInsertId(), 'message' => 'Hesap eklendi'], 201);
}

// PUT /api/admin/manual-bank-accounts/:id — güncelle
if ($method === 'PUT' && !empty($id)) {
    $data = getJsonBody();
    $fields = [];
    $params = [];
    foreach (['bank_name', 'account_holder', 'iban', 'swift', 'currency', 'notes', 'is_active', 'display_order'] as $f) {
        if (!array_key_exists($f, $data)) continue;
        $val = $data[$f];
        if ($f === 'iban' && is_string($val)) $val = strtoupper(preg_replace('/\s+/', '', $val));
        if ($f === 'currency' && is_string($val)) {
            $val = strtoupper(trim($val));
            if (!in_array($val, ['TRY', 'USD'], true)) {
                sendResponse(['error' => 'currency TRY veya USD olmali'], 400);
            }
        }
        if ($f === 'is_active') $val = (int)(bool)$val;
        if ($f === 'display_order') $val = (int)$val;
        $fields[] = "$f = ?";
        $params[] = $val;
    }
    if (!$fields) sendResponse(['error' => 'Guncellenecek alan yok'], 400);
    $params[] = (int)$id;
    $stmt = $db->prepare("UPDATE manual_bank_accounts SET " . implode(', ', $fields) . " WHERE id = ?");
    $stmt->execute($params);
    sendResponse(['message' => 'Guncellendi']);
}

// DELETE /api/admin/manual-bank-accounts/:id
if ($method === 'DELETE' && !empty($id)) {
    $stmt = $db->prepare("DELETE FROM manual_bank_accounts WHERE id = ?");
    $stmt->execute([(int)$id]);
    sendResponse(['message' => 'Silindi']);
}

sendResponse(['error' => 'Action not found'], 404);
