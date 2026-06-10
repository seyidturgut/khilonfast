<?php
// api/routes/crm.php — CRM admin endpoints (Faz 1: Contacts Foundation)
// Tüm endpoint'ler admin-only. Pattern: /api/crm/{action}/{id}/{subAction}

set_exception_handler(function (Throwable $e) {
    header('Content-Type: application/json', true, 500);
    echo json_encode(['error' => 'PHP Exception: ' . $e->getMessage(), 'file' => basename($e->getFile()), 'line' => $e->getLine()]);
    exit;
});

require_once __DIR__ . '/../utils.php';
require_once __DIR__ . '/../services/CrmSchema.php';
require_once __DIR__ . '/../services/CrmSmartListEngine.php';
require_once __DIR__ . '/../services/CrmActivityRecorder.php';
require_once __DIR__ . '/../services/CrmScoringEngine.php';
require_once __DIR__ . '/../services/CrmCampaignDispatcher.php';
require_once __DIR__ . '/../services/CrmAutomationBridge.php';
require_once __DIR__ . '/../services/CrmCsvImporter.php';
require_once __DIR__ . '/../services/CrmAnalytics.php';

$db = Database::getInstance();

// Schema bootstrap (idempotent) — her istek başında güvenle çalışır
try { ensureCrmContactsSchema($db); } catch (Throwable $e) { error_log('[crm] ensureCrmContactsSchema: ' . $e->getMessage()); }

// Admin auth check
$token = getBearerToken();
$payload = decodeJWT($token);
if (!$payload) sendResponse(['error' => 'Unauthorized'], 401);

$stmt = $db->prepare("SELECT role FROM users WHERE id = ?");
$stmt->execute([$payload['id']]);
$user = $stmt->fetch();
if (!$user || $user['role'] !== 'admin') {
    sendResponse(['error' => 'Admin privileges required'], 403);
}

$subAction = $routes[3] ?? '';

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function crmContactRow(array $row): array
{
    $custom = null;
    if (!empty($row['custom_fields'])) {
        try { $custom = json_decode((string)$row['custom_fields'], true); } catch (Throwable $e) {}
    }
    return [
        'id' => (int)$row['id'],
        'user_id' => isset($row['user_id']) ? (int)$row['user_id'] : null,
        'email' => $row['email'],
        'first_name' => $row['first_name'] ?? '',
        'last_name' => $row['last_name'] ?? '',
        'phone' => $row['phone'] ?? '',
        'company' => $row['company'] ?? '',
        'status' => $row['status'] ?? 'subscribed',
        'source' => $row['source'] ?? 'manual',
        'score' => isset($row['score']) ? (int)$row['score'] : 0,
        'ltv' => isset($row['ltv']) ? (float)$row['ltv'] : 0.0,
        'ltv_currency' => $row['ltv_currency'] ?? 'TRY',
        'custom_fields' => $custom,
        'last_activity_at' => $row['last_activity_at'] ?? null,
        'created_at' => $row['created_at'] ?? null,
        'updated_at' => $row['updated_at'] ?? null,
    ];
}

// ═══ /api/crm/contacts ═══════════════════════════════════════════════════════
if ($action === 'contacts') {
    // GET /api/crm/contacts/:id  → tek kayıt
    if ($method === 'GET' && !empty($id) && empty($subAction)) {
        $stmt = $db->prepare("SELECT * FROM crm_contacts WHERE id = ? LIMIT 1");
        $stmt->execute([(int)$id]);
        $row = $stmt->fetch();
        if (!$row) sendResponse(['error' => 'Not found'], 404);
        sendResponse(['contact' => crmContactRow($row)]);
    }

    // GET /api/crm/contacts → liste + arama + filtre + sayfalama
    if ($method === 'GET' && empty($id)) {
        $q = trim((string)($_GET['q'] ?? ''));
        $status = trim((string)($_GET['status'] ?? ''));
        $source = trim((string)($_GET['source'] ?? ''));
        $minScore = isset($_GET['min_score']) ? (int)$_GET['min_score'] : null;
        $page = max(1, (int)($_GET['page'] ?? 1));
        $perPage = min(200, max(10, (int)($_GET['per_page'] ?? 50)));
        $offset = ($page - 1) * $perPage;
        $sortBy = (string)($_GET['sort'] ?? 'created_at');
        $sortDir = strtolower((string)($_GET['dir'] ?? 'desc')) === 'asc' ? 'ASC' : 'DESC';
        $allowedSorts = ['created_at','updated_at','last_activity_at','score','email'];
        if (!in_array($sortBy, $allowedSorts, true)) $sortBy = 'created_at';

        $where = [];
        $params = [];
        if ($q !== '') {
            $where[] = '(email LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR phone LIKE ? OR company LIKE ?)';
            $like = '%' . $q . '%';
            array_push($params, $like, $like, $like, $like, $like);
        }
        if ($status !== '' && in_array($status, ['subscribed','unsubscribed','bounced','complained','pending'], true)) {
            $where[] = 'status = ?';
            $params[] = $status;
        }
        if ($source !== '') {
            $where[] = 'source = ?';
            $params[] = $source;
        }
        if ($minScore !== null) {
            $where[] = 'score >= ?';
            $params[] = $minScore;
        }
        $whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

        $countStmt = $db->prepare("SELECT COUNT(*) FROM crm_contacts $whereSql");
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();

        $sql = "SELECT * FROM crm_contacts $whereSql ORDER BY $sortBy $sortDir LIMIT $perPage OFFSET $offset";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        sendResponse([
            'contacts' => array_map('crmContactRow', $rows),
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
            'pages' => $total > 0 ? (int)ceil($total / $perPage) : 0
        ]);
    }

    // POST /api/crm/contacts → yeni contact
    if ($method === 'POST' && empty($id)) {
        $data = getJsonBody();
        $email = strtolower(trim((string)($data['email'] ?? '')));
        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            sendResponse(['error' => 'Geçerli email zorunlu'], 400);
        }
        $first = trim((string)($data['first_name'] ?? ''));
        $last = trim((string)($data['last_name'] ?? ''));
        $phone = trim((string)($data['phone'] ?? ''));
        $company = trim((string)($data['company'] ?? ''));
        $status = (string)($data['status'] ?? 'subscribed');
        if (!in_array($status, ['subscribed','unsubscribed','bounced','complained','pending'], true)) $status = 'subscribed';
        $source = (string)($data['source'] ?? 'manual');
        $custom = isset($data['custom_fields']) && is_array($data['custom_fields']) ? json_encode($data['custom_fields']) : null;

        try {
            $stmt = $db->prepare("INSERT INTO crm_contacts (email, first_name, last_name, phone, company, status, source, custom_fields)
                                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$email, $first, $last, $phone, $company, $status, $source, $custom]);
            $newId = (int)$db->lastInsertId();
        } catch (Throwable $e) {
            // UNIQUE conflict — varolanı dön
            $stmt = $db->prepare("SELECT id FROM crm_contacts WHERE email = ? LIMIT 1");
            $stmt->execute([$email]);
            $existing = $stmt->fetchColumn();
            if ($existing) {
                sendResponse(['error' => 'Bu email zaten kayıtlı', 'existing_id' => (int)$existing], 409);
            }
            sendResponse(['error' => 'Insert error: ' . $e->getMessage()], 500);
        }

        $stmt = $db->prepare("SELECT * FROM crm_contacts WHERE id = ?");
        $stmt->execute([$newId]);
        sendResponse(['contact' => crmContactRow($stmt->fetch())], 201);
    }

    // PUT /api/crm/contacts/:id → güncelle
    if ($method === 'PUT' && !empty($id) && empty($subAction)) {
        $data = getJsonBody();
        $allowed = ['first_name','last_name','phone','company','status','source','score','ltv','ltv_currency'];
        $sets = []; $params = [];
        foreach ($allowed as $k) {
            if (array_key_exists($k, $data)) {
                $sets[] = "$k = ?";
                $params[] = $data[$k];
            }
        }
        if (array_key_exists('custom_fields', $data) && is_array($data['custom_fields'])) {
            $sets[] = 'custom_fields = ?';
            $params[] = json_encode($data['custom_fields']);
        }
        if (!$sets) sendResponse(['error' => 'No fields to update'], 400);
        $params[] = (int)$id;
        $stmt = $db->prepare("UPDATE crm_contacts SET " . implode(', ', $sets) . " WHERE id = ?");
        $stmt->execute($params);
        $stmt = $db->prepare("SELECT * FROM crm_contacts WHERE id = ?");
        $stmt->execute([(int)$id]);
        $row = $stmt->fetch();
        if (!$row) sendResponse(['error' => 'Not found'], 404);
        sendResponse(['contact' => crmContactRow($row)]);
    }

    // DELETE /api/crm/contacts/:id
    if ($method === 'DELETE' && !empty($id) && empty($subAction)) {
        $stmt = $db->prepare("DELETE FROM crm_contacts WHERE id = ?");
        $stmt->execute([(int)$id]);
        sendResponse(['ok' => true, 'deleted' => $stmt->rowCount()]);
    }

    // POST /api/crm/contacts/bulk-delete
    if ($method === 'POST' && $id === 'bulk-delete') {
        $data = getJsonBody();
        $ids = array_filter(array_map('intval', $data['ids'] ?? []));
        if (!$ids) sendResponse(['error' => 'ids required'], 400);
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $stmt = $db->prepare("DELETE FROM crm_contacts WHERE id IN ($placeholders)");
        $stmt->execute($ids);
        sendResponse(['ok' => true, 'deleted' => $stmt->rowCount()]);
    }

    // /api/crm/contacts/:id/score-history (Faz 4)
    if (!empty($id) && $subAction === 'score-history' && ctype_digit((string)$id)) {
        $contactId = (int)$id;
        if ($method === 'GET') {
            $stmt = $db->prepare("SELECT * FROM crm_score_history WHERE contact_id = ?
                                  ORDER BY created_at DESC LIMIT 100");
            $stmt->execute([$contactId]);
            sendResponse(['history' => array_map(function ($r) {
                return [
                    'id' => (int)$r['id'],
                    'rule_key' => $r['rule_key'],
                    'delta' => (int)$r['delta'],
                    'score_after' => (int)$r['score_after'],
                    'reason' => $r['reason'],
                    'ref_type' => $r['ref_type'],
                    'ref_id' => $r['ref_id'] !== null ? (int)$r['ref_id'] : null,
                    'created_at' => $r['created_at'],
                ];
            }, $stmt->fetchAll())]);
        }
        sendResponse(['error' => 'Method not supported'], 405);
    }

    // /api/crm/contacts/:id/recompute-score (Faz 4)
    if (!empty($id) && $subAction === 'recompute-score' && $method === 'POST' && ctype_digit((string)$id)) {
        $contactId = (int)$id;
        $newScore = crmRecomputeScoreFromHistory($db, $contactId);
        sendResponse(['ok' => true, 'score' => $newScore]);
    }

    // /api/crm/contacts/:id/web-visits (Faz 5)
    if (!empty($id) && $subAction === 'web-visits' && ctype_digit((string)$id)) {
        $contactId = (int)$id;
        if ($method === 'GET') {
            $stmt = $db->prepare("SELECT * FROM crm_web_visits WHERE contact_id = ?
                                  ORDER BY occurred_at DESC LIMIT 100");
            $stmt->execute([$contactId]);
            sendResponse(['visits' => array_map(function ($r) {
                return [
                    'id' => (int)$r['id'],
                    'url' => $r['url'],
                    'path' => $r['path'],
                    'title' => $r['title'],
                    'referrer' => $r['referrer'],
                    'utm_source' => $r['utm_source'],
                    'utm_campaign' => $r['utm_campaign'],
                    'duration_seconds' => $r['duration_seconds'] !== null ? (int)$r['duration_seconds'] : null,
                    'occurred_at' => $r['occurred_at'],
                ];
            }, $stmt->fetchAll())]);
        }
        sendResponse(['error' => 'Method not supported'], 405);
    }

    // /api/crm/contacts/:id/email-tracking (Faz 4)
    if (!empty($id) && $subAction === 'email-tracking' && ctype_digit((string)$id)) {
        $contactId = (int)$id;
        if ($method === 'GET') {
            $stmt = $db->prepare("SELECT * FROM crm_email_tracking WHERE contact_id = ?
                                  ORDER BY occurred_at DESC LIMIT 100");
            $stmt->execute([$contactId]);
            sendResponse(['events' => array_map(function ($r) {
                return [
                    'id' => (int)$r['id'],
                    'event' => $r['event'],
                    'message_id' => $r['message_id'],
                    'link_url' => $r['link_url'],
                    'reason' => $r['reason'],
                    'campaign_id' => $r['campaign_id'] !== null ? (int)$r['campaign_id'] : null,
                    'occurred_at' => $r['occurred_at'],
                ];
            }, $stmt->fetchAll())]);
        }
        sendResponse(['error' => 'Method not supported'], 405);
    }

    // /api/crm/contacts/:id/timeline  (Faz 3)
    if (!empty($id) && $subAction === 'timeline' && ctype_digit((string)$id)) {
        $contactId = (int)$id;
        if ($method === 'GET') {
            $limit = min(200, max(10, (int)($_GET['limit'] ?? 50)));
            $beforeId = isset($_GET['before_id']) ? (int)$_GET['before_id'] : 0;
            $typeFilter = trim((string)($_GET['type'] ?? ''));
            $where = ["contact_id = ?"];
            $params = [$contactId];
            if ($beforeId > 0) { $where[] = 'id < ?'; $params[] = $beforeId; }
            if ($typeFilter !== '') {
                $where[] = 'type LIKE ?'; $params[] = $typeFilter . '%';
            }
            $sql = "SELECT * FROM crm_activity_log WHERE " . implode(' AND ', $where)
                 . " ORDER BY occurred_at DESC, id DESC LIMIT $limit";
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            $rows = $stmt->fetchAll();
            $events = array_map(function ($r) {
                $meta = null;
                if (!empty($r['metadata'])) {
                    try { $meta = json_decode((string)$r['metadata'], true); } catch (Throwable $e) {}
                }
                return [
                    'id' => (int)$r['id'],
                    'type' => $r['type'],
                    'title' => $r['title'],
                    'ref_type' => $r['ref_type'],
                    'ref_id' => $r['ref_id'] !== null ? (int)$r['ref_id'] : null,
                    'metadata' => $meta,
                    'occurred_at' => $r['occurred_at'],
                ];
            }, $rows);
            sendResponse(['events' => $events, 'has_more' => count($events) === $limit]);
        }
        sendResponse(['error' => 'Method not supported'], 405);
    }

    // /api/crm/contacts/:id/tags  (Faz 2)
    if (!empty($id) && $subAction === 'tags' && ctype_digit((string)$id)) {
        $contactId = (int)$id;
        if ($method === 'GET') {
            $stmt = $db->prepare("SELECT t.*, ct.added_at FROM crm_contact_tags ct
                                  JOIN crm_tags t ON t.id = ct.tag_id
                                  WHERE ct.contact_id = ? ORDER BY ct.added_at DESC");
            $stmt->execute([$contactId]);
            sendResponse(['tags' => array_map(function ($r) {
                return [
                    'id' => (int)$r['id'], 'slug' => $r['slug'], 'name' => $r['name'],
                    'color' => $r['color'], 'added_at' => $r['added_at']
                ];
            }, $stmt->fetchAll())]);
        }
        if ($method === 'POST') {
            $data = getJsonBody();
            $tagIds = array_filter(array_map('intval', $data['tag_ids'] ?? []));
            if (!$tagIds) sendResponse(['error' => 'tag_ids gerekli'], 400);
            $addedBy = (int)$payload['id'];
            $stmt = $db->prepare("INSERT IGNORE INTO crm_contact_tags (contact_id, tag_id, added_by) VALUES (?, ?, ?)");
            $newlyAdded = [];
            foreach ($tagIds as $tid) {
                $stmt->execute([$contactId, $tid, $addedBy]);
                if ($stmt->rowCount() > 0) $newlyAdded[] = $tid;
            }
            crmRecountTagContacts($db);
            // Faz 8: tag_added trigger fire
            if ($newlyAdded) {
                $tagSlugStmt = $db->prepare("SELECT slug FROM crm_tags WHERE id = ?");
                foreach ($newlyAdded as $tid) {
                    $tagSlugStmt->execute([$tid]);
                    $slug = $tagSlugStmt->fetchColumn();
                    if ($slug) {
                        crmFireAutomation($db, 'tag_added', $contactId, ['tag_slug' => $slug, 'tag_id' => $tid]);
                    }
                }
            }
            sendResponse(['ok' => true, 'added' => count($newlyAdded)]);
        }
        if ($method === 'DELETE') {
            $data = getJsonBody();
            $tagIds = array_filter(array_map('intval', $data['tag_ids'] ?? []));
            if (!$tagIds) sendResponse(['error' => 'tag_ids gerekli'], 400);
            $placeholders = implode(',', array_fill(0, count($tagIds), '?'));
            $stmt = $db->prepare("DELETE FROM crm_contact_tags WHERE contact_id = ? AND tag_id IN ($placeholders)");
            $stmt->execute(array_merge([$contactId], $tagIds));
            crmRecountTagContacts($db);
            sendResponse(['ok' => true, 'deleted' => $stmt->rowCount()]);
        }
        sendResponse(['error' => 'Method not supported'], 405);
    }

    // /api/crm/contacts/bulk-tag
    if ($id === 'bulk-tag' && $method === 'POST') {
        $data = getJsonBody();
        $contactIds = array_filter(array_map('intval', $data['contact_ids'] ?? []));
        $tagIds = array_filter(array_map('intval', $data['tag_ids'] ?? []));
        $mode = (string)($data['mode'] ?? 'add');
        if (!$contactIds || !$tagIds) sendResponse(['error' => 'contact_ids ve tag_ids gerekli'], 400);

        if ($mode === 'remove') {
            $cph = implode(',', array_fill(0, count($contactIds), '?'));
            $tph = implode(',', array_fill(0, count($tagIds), '?'));
            $stmt = $db->prepare("DELETE FROM crm_contact_tags WHERE contact_id IN ($cph) AND tag_id IN ($tph)");
            $stmt->execute(array_merge($contactIds, $tagIds));
            $count = $stmt->rowCount();
        } else {
            $addedBy = (int)$payload['id'];
            $stmt = $db->prepare("INSERT IGNORE INTO crm_contact_tags (contact_id, tag_id, added_by) VALUES (?, ?, ?)");
            $count = 0;
            foreach ($contactIds as $cid) {
                foreach ($tagIds as $tid) {
                    $stmt->execute([$cid, $tid, $addedBy]);
                    $count += $stmt->rowCount();
                }
            }
        }
        crmRecountTagContacts($db);
        sendResponse(['ok' => true, 'affected' => $count]);
    }

    sendResponse(['error' => 'Method/action not supported'], 405);
}

// ═══ /api/crm/backfill ═══════════════════════════════════════════════════════
if ($action === 'backfill' && $method === 'POST') {
    $stats = runCrmContactsBackfill($db);
    sendResponse(['ok' => true, 'stats' => $stats]);
}

// ═══ /api/crm/activity-backfill ══════════════════════════════════════════════
if ($action === 'activity-backfill' && $method === 'POST') {
    $stats = runCrmActivityBackfill($db);
    sendResponse(['ok' => true, 'stats' => $stats]);
}

// ═══ /api/crm/scoring-rules ══════════════════════════════════════════════════
if ($action === 'scoring-rules') {
    if ($method === 'GET' && empty($id)) {
        $rows = $db->query("SELECT * FROM crm_score_rules ORDER BY event_type ASC")->fetchAll();
        sendResponse(['rules' => array_map(function ($r) {
            return [
                'id' => (int)$r['id'],
                'rule_key' => $r['rule_key'],
                'label' => $r['label'],
                'event_type' => $r['event_type'],
                'points' => (int)$r['points'],
                'decay_days' => (int)$r['decay_days'],
                'is_active' => (int)$r['is_active'] === 1,
                'created_at' => $r['created_at'],
                'updated_at' => $r['updated_at'],
            ];
        }, $rows)]);
    }

    if ($method === 'POST' && empty($id)) {
        $data = getJsonBody();
        $ruleKey = preg_replace('/[^a-z0-9_]/', '', strtolower((string)($data['rule_key'] ?? $data['event_type'] ?? '')));
        $label = trim((string)($data['label'] ?? ''));
        $eventType = trim((string)($data['event_type'] ?? ''));
        $points = (int)($data['points'] ?? 0);
        $decay = max(0, (int)($data['decay_days'] ?? 0));
        $isActive = !empty($data['is_active']) ? 1 : 1; // default active
        if (!$ruleKey || !$label || !$eventType) sendResponse(['error' => 'rule_key, label, event_type zorunlu'], 400);
        try {
            $stmt = $db->prepare("INSERT INTO crm_score_rules (rule_key, label, event_type, points, decay_days, is_active)
                                  VALUES (?, ?, ?, ?, ?, ?)
                                  ON DUPLICATE KEY UPDATE
                                  label = VALUES(label), event_type = VALUES(event_type),
                                  points = VALUES(points), decay_days = VALUES(decay_days),
                                  is_active = VALUES(is_active)");
            $stmt->execute([$ruleKey, $label, $eventType, $points, $decay, $isActive]);
            sendResponse(['ok' => true]);
        } catch (Throwable $e) {
            sendResponse(['error' => $e->getMessage()], 500);
        }
    }

    if ($method === 'PUT' && !empty($id)) {
        $data = getJsonBody();
        $sets = []; $params = [];
        foreach (['label', 'event_type', 'points', 'decay_days'] as $k) {
            if (array_key_exists($k, $data)) { $sets[] = "$k = ?"; $params[] = $data[$k]; }
        }
        if (array_key_exists('is_active', $data)) {
            $sets[] = 'is_active = ?';
            $params[] = !empty($data['is_active']) ? 1 : 0;
        }
        if (!$sets) sendResponse(['error' => 'No fields'], 400);
        $params[] = (int)$id;
        $stmt = $db->prepare("UPDATE crm_score_rules SET " . implode(', ', $sets) . " WHERE id = ?");
        $stmt->execute($params);
        sendResponse(['ok' => true]);
    }

    if ($method === 'DELETE' && !empty($id)) {
        $db->prepare("DELETE FROM crm_score_rules WHERE id = ?")->execute([(int)$id]);
        sendResponse(['ok' => true]);
    }

    sendResponse(['error' => 'Method not supported'], 405);
}

// ═══ /api/crm/email-tracking (admin liste — son N olay) ═════════════════════
// ═══ /api/crm/smart-links ════════════════════════════════════════════════════
if ($action === 'smart-links') {
    if ($method === 'GET' && empty($id)) {
        $rows = $db->query("SELECT * FROM crm_smart_links ORDER BY created_at DESC")->fetchAll();
        sendResponse(['links' => array_map(function ($r) {
            return [
                'id' => (int)$r['id'],
                'slug' => $r['slug'],
                'target_url' => $r['target_url'],
                'label' => $r['label'],
                'campaign_id' => $r['campaign_id'] !== null ? (int)$r['campaign_id'] : null,
                'click_count' => (int)$r['click_count'],
                'is_active' => (int)$r['is_active'] === 1,
                'expires_at' => $r['expires_at'],
                'created_at' => $r['created_at'],
            ];
        }, $rows)]);
    }

    if ($method === 'POST' && empty($id)) {
        $data = getJsonBody();
        $slug = preg_replace('/[^a-zA-Z0-9_-]/', '', (string)($data['slug'] ?? ''));
        $url = trim((string)($data['target_url'] ?? ''));
        $label = trim((string)($data['label'] ?? ''));
        if (!$slug) {
            // Auto-generate
            $slug = substr(bin2hex(random_bytes(4)), 0, 8);
        }
        if (!$url || !filter_var($url, FILTER_VALIDATE_URL)) {
            sendResponse(['error' => 'Geçerli target_url zorunlu'], 400);
        }
        try {
            $stmt = $db->prepare("INSERT INTO crm_smart_links (slug, target_url, label, created_by) VALUES (?, ?, ?, ?)");
            $stmt->execute([$slug, $url, $label ?: null, (int)$payload['id']]);
            $newId = (int)$db->lastInsertId();
        } catch (Throwable $e) {
            sendResponse(['error' => 'Bu slug zaten kayıtlı'], 409);
        }
        sendResponse(['link' => ['id' => $newId, 'slug' => $slug, 'target_url' => $url]], 201);
    }

    if ($method === 'PUT' && !empty($id)) {
        $data = getJsonBody();
        $sets = []; $params = [];
        foreach (['target_url', 'label', 'expires_at'] as $k) {
            if (array_key_exists($k, $data)) { $sets[] = "$k = ?"; $params[] = $data[$k]; }
        }
        if (array_key_exists('is_active', $data)) {
            $sets[] = 'is_active = ?'; $params[] = !empty($data['is_active']) ? 1 : 0;
        }
        if (!$sets) sendResponse(['error' => 'No fields'], 400);
        $params[] = (int)$id;
        $stmt = $db->prepare("UPDATE crm_smart_links SET " . implode(', ', $sets) . " WHERE id = ?");
        $stmt->execute($params);
        sendResponse(['ok' => true]);
    }

    if ($method === 'DELETE' && !empty($id)) {
        $db->prepare("DELETE FROM crm_smart_link_clicks WHERE link_id = ?")->execute([(int)$id]);
        $db->prepare("DELETE FROM crm_smart_links WHERE id = ?")->execute([(int)$id]);
        sendResponse(['ok' => true]);
    }

    if ($method === 'GET' && !empty($id)) {
        // Click istatistikleri
        $stmt = $db->prepare("SELECT lc.*, c.email FROM crm_smart_link_clicks lc
                              LEFT JOIN crm_contacts c ON c.id = lc.contact_id
                              WHERE lc.link_id = ? ORDER BY lc.clicked_at DESC LIMIT 100");
        $stmt->execute([(int)$id]);
        sendResponse(['clicks' => array_map(function ($r) {
            return [
                'id' => (int)$r['id'],
                'contact_id' => $r['contact_id'] !== null ? (int)$r['contact_id'] : null,
                'contact_email' => $r['email'] ?? null,
                'anonymous_id' => $r['anonymous_id'],
                'ip' => $r['ip'],
                'referrer' => $r['referrer'],
                'clicked_at' => $r['clicked_at'],
            ];
        }, $stmt->fetchAll())]);
    }

    sendResponse(['error' => 'Method not supported'], 405);
}

// ═══ /api/crm/campaigns ══════════════════════════════════════════════════════
if ($action === 'campaigns') {
    if ($method === 'GET' && empty($id)) {
        $rows = $db->query("SELECT * FROM crm_campaigns ORDER BY created_at DESC")->fetchAll();
        sendResponse(['campaigns' => array_map(function ($r) {
            $stats = null;
            if (!empty($r['stats_json'])) { try { $stats = json_decode((string)$r['stats_json'], true); } catch (Throwable $e) {} }
            $listIds = []; $tagSlugs = [];
            try { $listIds = json_decode((string)($r['target_list_ids'] ?? '[]'), true) ?: []; } catch (Throwable $e) {}
            try { $tagSlugs = json_decode((string)($r['target_tag_slugs'] ?? '[]'), true) ?: []; } catch (Throwable $e) {}
            return [
                'id' => (int)$r['id'],
                'name' => $r['name'],
                'description' => $r['description'],
                'subject' => $r['subject'],
                'status' => $r['status'],
                'ab_enabled' => (int)$r['ab_enabled'] === 1,
                'target_list_ids' => $listIds,
                'target_tag_slugs' => $tagSlugs,
                'target_status' => $r['target_status'],
                'scheduled_at' => $r['scheduled_at'],
                'started_at' => $r['started_at'],
                'completed_at' => $r['completed_at'],
                'stats' => $stats,
                'created_at' => $r['created_at'],
            ];
        }, $rows)]);
    }

    if ($method === 'GET' && !empty($id) && empty($subAction)) {
        $stmt = $db->prepare("SELECT * FROM crm_campaigns WHERE id = ?");
        $stmt->execute([(int)$id]);
        $r = $stmt->fetch();
        if (!$r) sendResponse(['error' => 'Not found'], 404);
        $stats = null;
        if (!empty($r['stats_json'])) { try { $stats = json_decode((string)$r['stats_json'], true); } catch (Throwable $e) {} }
        sendResponse(['campaign' => [
            'id' => (int)$r['id'],
            'name' => $r['name'],
            'description' => $r['description'],
            'template_id' => $r['template_id'] !== null ? (int)$r['template_id'] : null,
            'from_email' => $r['from_email'],
            'from_name' => $r['from_name'],
            'subject' => $r['subject'],
            'preview_text' => $r['preview_text'] ?? null,
            'body_html' => $r['body_html'],
            'design_json' => $r['design_json'] ?? null,
            'target_list_ids' => json_decode((string)($r['target_list_ids'] ?? '[]'), true) ?: [],
            'target_tag_slugs' => json_decode((string)($r['target_tag_slugs'] ?? '[]'), true) ?: [],
            'target_status' => $r['target_status'],
            'ab_enabled' => (int)$r['ab_enabled'] === 1,
            'ab_subject_b' => $r['ab_subject_b'],
            'ab_winner_after_hours' => (int)$r['ab_winner_after_hours'],
            'ab_winner' => $r['ab_winner'],
            'status' => $r['status'],
            'scheduled_at' => $r['scheduled_at'],
            'started_at' => $r['started_at'],
            'completed_at' => $r['completed_at'],
            'stats' => $stats,
            'created_at' => $r['created_at'],
            'updated_at' => $r['updated_at'],
        ]]);
    }

    if ($method === 'POST' && empty($id)) {
        $data = getJsonBody();
        $name = trim((string)($data['name'] ?? ''));
        $subject = trim((string)($data['subject'] ?? ''));
        if (!$name || !$subject) sendResponse(['error' => 'name ve subject zorunlu'], 400);

        $listIds = is_array($data['target_list_ids'] ?? null) ? array_values(array_filter(array_map('intval', $data['target_list_ids']))) : [];
        $tagSlugs = is_array($data['target_tag_slugs'] ?? null) ? array_values(array_filter(array_map('strval', $data['target_tag_slugs']))) : [];

        // Status: scheduled_at varsa ve gelecek zamansa scheduled, yoksa draft
        $scheduledAt = !empty($data['scheduled_at']) ? (string)$data['scheduled_at'] : null;
        $initialStatus = 'draft';
        if ($scheduledAt) {
            $ts = strtotime($scheduledAt);
            if ($ts && $ts > time()) {
                $initialStatus = 'scheduled';
            } else {
                $scheduledAt = null; // geçmiş tarih → ignore
            }
        }

        $stmt = $db->prepare("INSERT INTO crm_campaigns
            (name, description, template_id, from_email, from_name, subject, preview_text, body_html, design_json,
             target_list_ids, target_tag_slugs, target_status,
             ab_enabled, ab_subject_b, ab_winner_after_hours,
             scheduled_at, status, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $name,
            $data['description'] ?? null,
            isset($data['template_id']) ? (int)$data['template_id'] : null,
            $data['from_email'] ?? null,
            $data['from_name'] ?? null,
            $subject,
            $data['preview_text'] ?? null,
            $data['body_html'] ?? null,
            $data['design_json'] ?? null,
            json_encode($listIds),
            json_encode($tagSlugs),
            $data['target_status'] ?? 'subscribed',
            !empty($data['ab_enabled']) ? 1 : 0,
            $data['ab_subject_b'] ?? null,
            (int)($data['ab_winner_after_hours'] ?? 4),
            $scheduledAt,
            $initialStatus,
            (int)$payload['id']
        ]);
        sendResponse(['campaign' => ['id' => (int)$db->lastInsertId(), 'name' => $name, 'status' => $initialStatus]], 201);
    }

    if ($method === 'PUT' && !empty($id) && empty($subAction)) {
        $data = getJsonBody();
        $sets = []; $params = [];
        $allowed = ['name','description','template_id','from_email','from_name','subject','preview_text','body_html','design_json',
                    'target_status','ab_enabled','ab_subject_b','ab_winner_after_hours','scheduled_at','status'];
        foreach ($allowed as $k) {
            if (array_key_exists($k, $data)) {
                $sets[] = "$k = ?";
                if ($k === 'ab_enabled') $params[] = !empty($data[$k]) ? 1 : 0;
                else $params[] = $data[$k];
            }
        }
        if (array_key_exists('target_list_ids', $data)) {
            $sets[] = 'target_list_ids = ?';
            $params[] = json_encode(array_map('intval', $data['target_list_ids']));
        }
        if (array_key_exists('target_tag_slugs', $data)) {
            $sets[] = 'target_tag_slugs = ?';
            $params[] = json_encode(array_map('strval', $data['target_tag_slugs']));
        }
        if (!$sets) sendResponse(['error' => 'No fields'], 400);
        $params[] = (int)$id;
        $stmt = $db->prepare("UPDATE crm_campaigns SET " . implode(', ', $sets) . " WHERE id = ?");
        $stmt->execute($params);
        sendResponse(['ok' => true]);
    }

    if ($method === 'DELETE' && !empty($id) && empty($subAction)) {
        $db->prepare("DELETE FROM crm_campaign_recipients WHERE campaign_id = ?")->execute([(int)$id]);
        $db->prepare("DELETE FROM crm_campaigns WHERE id = ?")->execute([(int)$id]);
        sendResponse(['ok' => true]);
    }

    // /api/crm/campaigns/preview — dry run audience
    if ($method === 'POST' && $id === 'preview') {
        $data = getJsonBody();
        $temp = [
            'target_list_ids' => json_encode(array_map('intval', $data['target_list_ids'] ?? [])),
            'target_tag_slugs' => json_encode(array_map('strval', $data['target_tag_slugs'] ?? [])),
            'target_status' => $data['target_status'] ?? 'subscribed',
        ];
        $audience = crmResolveCampaignAudience($db, $temp);
        sendResponse([
            'count' => count($audience),
            'sample' => array_slice(array_map(fn($r) => [
                'id' => (int)$r['id'], 'email' => $r['email'],
                'first_name' => $r['first_name'], 'last_name' => $r['last_name']
            ], $audience), 0, 10)
        ]);
    }

    // /api/crm/campaigns/:id/schedule — set scheduled_at + status='scheduled'
    if ($method === 'POST' && !empty($id) && $subAction === 'schedule') {
        $data = getJsonBody();
        $scheduledAt = trim((string)($data['scheduled_at'] ?? ''));
        if (!$scheduledAt) sendResponse(['error' => 'scheduled_at zorunlu (ISO 8601 ya da Y-m-d H:i:s)'], 400);
        $ts = strtotime($scheduledAt);
        if (!$ts) sendResponse(['error' => 'Geçersiz tarih formatı'], 400);
        if ($ts <= time()) sendResponse(['error' => 'Zamanlama geçmiş bir tarih olamaz'], 400);

        // Sadece draft / scheduled / paused state'ten zamanlama ayarlanabilir
        $stmt = $db->prepare("SELECT status FROM crm_campaigns WHERE id = ?");
        $stmt->execute([(int)$id]);
        $cur = $stmt->fetchColumn();
        if (!$cur) sendResponse(['error' => 'Not found'], 404);
        if (!in_array($cur, ['draft', 'scheduled', 'paused'], true)) {
            sendResponse(['error' => "Bu durumdaki ($cur) kampanya zamanlanamaz"], 400);
        }

        $isoStr = date('Y-m-d H:i:s', $ts);
        $db->prepare("UPDATE crm_campaigns SET status = 'scheduled', scheduled_at = ? WHERE id = ?")
           ->execute([$isoStr, (int)$id]);
        sendResponse(['ok' => true, 'status' => 'scheduled', 'scheduled_at' => $isoStr]);
    }

    // /api/crm/campaigns/:id/cancel-schedule — geri taslağa al
    if ($method === 'POST' && !empty($id) && $subAction === 'cancel-schedule') {
        $stmt = $db->prepare("SELECT status FROM crm_campaigns WHERE id = ?");
        $stmt->execute([(int)$id]);
        $cur = $stmt->fetchColumn();
        if (!$cur) sendResponse(['error' => 'Not found'], 404);
        if ($cur !== 'scheduled') sendResponse(['error' => 'Sadece scheduled durumdaki kampanya iptal edilebilir'], 400);
        $db->prepare("UPDATE crm_campaigns SET status = 'draft', scheduled_at = NULL WHERE id = ?")
           ->execute([(int)$id]);
        sendResponse(['ok' => true, 'status' => 'draft']);
    }

    // /api/crm/campaigns/:id/pause — gönderimi DURAKLAT (kuyruk korunur, cron dokunmaz)
    if ($method === 'POST' && !empty($id) && $subAction === 'pause') {
        $stmt = $db->prepare("SELECT status FROM crm_campaigns WHERE id = ?");
        $stmt->execute([(int)$id]);
        $cur = $stmt->fetchColumn();
        if (!$cur) sendResponse(['error' => 'Not found'], 404);
        if ($cur !== 'sending') sendResponse(['error' => 'Sadece gönderimdeki (sending) kampanya duraklatılabilir'], 400);
        $db->prepare("UPDATE crm_campaigns SET status = 'paused' WHERE id = ?")->execute([(int)$id]);
        sendResponse(['ok' => true, 'status' => 'paused']);
    }

    // /api/crm/campaigns/:id/resume — kaldığı yerden DEVAM (queued alıcılar; gönderilenler tekrarlanmaz)
    if ($method === 'POST' && !empty($id) && $subAction === 'resume') {
        $stmt = $db->prepare("SELECT status FROM crm_campaigns WHERE id = ?");
        $stmt->execute([(int)$id]);
        $cur = $stmt->fetchColumn();
        if (!$cur) sendResponse(['error' => 'Not found'], 404);
        if ($cur !== 'paused') sendResponse(['error' => 'Sadece duraklatılmış (paused) kampanya devam ettirilebilir'], 400);
        $db->prepare("UPDATE crm_campaigns SET status = 'sending' WHERE id = ?")->execute([(int)$id]);
        sendResponse(['ok' => true, 'status' => 'sending']);
    }

    // /api/crm/campaigns/:id/send — enqueue
    if ($method === 'POST' && !empty($id) && $subAction === 'send') {
        $data = getJsonBody();
        $dryRun = !empty($data['dry_run']);
        try {
            $result = crmEnqueueCampaign($db, (int)$id, $dryRun);
            sendResponse(['ok' => true] + $result);
        } catch (Throwable $e) {
            sendResponse(['error' => $e->getMessage()], 500);
        }
    }

    // /api/crm/campaigns/:id/dispatch-batch — Brevo'ya bir grup gönder
    if ($method === 'POST' && !empty($id) && $subAction === 'dispatch-batch') {
        $data = getJsonBody();
        $batchSize = max(1, min(200, (int)($data['batch_size'] ?? 50)));
        try {
            $result = crmDispatchCampaignBatch($db, (int)$id, $batchSize);
            sendResponse(['ok' => true] + $result);
        } catch (Throwable $e) {
            sendResponse(['error' => $e->getMessage()], 500);
        }
    }

    // /api/crm/campaigns/:id/report
    if ($method === 'GET' && !empty($id) && $subAction === 'report') {
        $report = crmCampaignReport($db, (int)$id);
        sendResponse(['report' => $report]);
    }

    // /api/crm/campaigns/:id/recipients
    if ($method === 'GET' && !empty($id) && $subAction === 'recipients') {
        $stmt = $db->prepare("SELECT r.*, c.first_name, c.last_name FROM crm_campaign_recipients r
                              LEFT JOIN crm_contacts c ON c.id = r.contact_id
                              WHERE r.campaign_id = ? ORDER BY r.id DESC LIMIT 200");
        $stmt->execute([(int)$id]);
        sendResponse(['recipients' => array_map(function ($r) {
            return [
                'id' => (int)$r['id'],
                'contact_id' => (int)$r['contact_id'],
                'email' => $r['email'],
                'first_name' => $r['first_name'] ?? '',
                'last_name' => $r['last_name'] ?? '',
                'ab_variant' => $r['ab_variant'],
                'status' => $r['status'],
                'sent_at' => $r['sent_at'],
                'opened_at' => $r['opened_at'],
                'clicked_at' => $r['clicked_at'],
                'error' => $r['error'],
            ];
        }, $stmt->fetchAll())]);
    }

    sendResponse(['error' => 'Method not supported'], 405);
}

// ═══ /api/crm/forms ══════════════════════════════════════════════════════════
if ($action === 'forms') {
    if ($method === 'GET' && empty($id)) {
        $rows = $db->query("SELECT * FROM crm_forms ORDER BY created_at DESC")->fetchAll();
        sendResponse(['forms' => array_map(function ($r) {
            return [
                'id' => (int)$r['id'],
                'slug' => $r['slug'],
                'name' => $r['name'],
                'description' => $r['description'],
                'submission_count' => (int)$r['submission_count'],
                'double_opt_in' => (int)$r['double_opt_in'] === 1,
                'is_active' => (int)$r['is_active'] === 1,
                'created_at' => $r['created_at'],
            ];
        }, $rows)]);
    }

    if ($method === 'GET' && !empty($id) && empty($subAction)) {
        $stmt = $db->prepare("SELECT * FROM crm_forms WHERE id = ?");
        $stmt->execute([(int)$id]);
        $r = $stmt->fetch();
        if (!$r) sendResponse(['error' => 'Not found'], 404);
        sendResponse(['form' => [
            'id' => (int)$r['id'],
            'slug' => $r['slug'],
            'name' => $r['name'],
            'description' => $r['description'],
            'fields' => json_decode((string)$r['fields_json'], true) ?: [],
            'actions' => json_decode((string)($r['actions_json'] ?? '[]'), true) ?: [],
            'success_message' => $r['success_message'],
            'success_redirect' => $r['success_redirect'],
            'double_opt_in' => (int)$r['double_opt_in'] === 1,
            'opt_in_subject' => $r['opt_in_subject'],
            'opt_in_body' => $r['opt_in_body'],
            'opt_in_redirect' => $r['opt_in_redirect'],
            'submission_count' => (int)$r['submission_count'],
            'is_active' => (int)$r['is_active'] === 1,
            'created_at' => $r['created_at'],
        ]]);
    }

    if ($method === 'POST' && empty($id)) {
        $data = getJsonBody();
        $slug = preg_replace('/[^a-z0-9_-]/', '', strtolower((string)($data['slug'] ?? $data['name'] ?? '')));
        $name = trim((string)($data['name'] ?? ''));
        $fields = is_array($data['fields'] ?? null) ? $data['fields'] : [];
        if (!$slug || !$name || !$fields) sendResponse(['error' => 'slug, name ve fields zorunlu'], 400);

        try {
            $stmt = $db->prepare("INSERT INTO crm_forms
                (slug, name, description, fields_json, actions_json,
                 success_message, success_redirect,
                 double_opt_in, opt_in_subject, opt_in_body, opt_in_redirect, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $slug, $name, $data['description'] ?? null,
                json_encode($fields),
                json_encode(is_array($data['actions'] ?? null) ? $data['actions'] : []),
                $data['success_message'] ?? null,
                $data['success_redirect'] ?? null,
                !empty($data['double_opt_in']) ? 1 : 0,
                $data['opt_in_subject'] ?? null,
                $data['opt_in_body'] ?? null,
                $data['opt_in_redirect'] ?? null,
                (int)$payload['id']
            ]);
            sendResponse(['form' => ['id' => (int)$db->lastInsertId(), 'slug' => $slug]], 201);
        } catch (Throwable $e) {
            sendResponse(['error' => 'Bu slug zaten kayıtlı veya hata: ' . $e->getMessage()], 409);
        }
    }

    if ($method === 'PUT' && !empty($id) && empty($subAction)) {
        $data = getJsonBody();
        $sets = []; $params = [];
        foreach (['name','description','success_message','success_redirect','opt_in_subject','opt_in_body','opt_in_redirect'] as $k) {
            if (array_key_exists($k, $data)) { $sets[] = "$k = ?"; $params[] = $data[$k]; }
        }
        if (array_key_exists('fields', $data) && is_array($data['fields'])) {
            $sets[] = 'fields_json = ?'; $params[] = json_encode($data['fields']);
        }
        if (array_key_exists('actions', $data) && is_array($data['actions'])) {
            $sets[] = 'actions_json = ?'; $params[] = json_encode($data['actions']);
        }
        if (array_key_exists('double_opt_in', $data)) {
            $sets[] = 'double_opt_in = ?'; $params[] = !empty($data['double_opt_in']) ? 1 : 0;
        }
        if (array_key_exists('is_active', $data)) {
            $sets[] = 'is_active = ?'; $params[] = !empty($data['is_active']) ? 1 : 0;
        }
        if (!$sets) sendResponse(['error' => 'No fields'], 400);
        $params[] = (int)$id;
        $stmt = $db->prepare("UPDATE crm_forms SET " . implode(', ', $sets) . " WHERE id = ?");
        $stmt->execute($params);
        sendResponse(['ok' => true]);
    }

    if ($method === 'DELETE' && !empty($id) && empty($subAction)) {
        $db->prepare("DELETE FROM crm_form_submissions WHERE form_id = ?")->execute([(int)$id]);
        $db->prepare("DELETE FROM crm_forms WHERE id = ?")->execute([(int)$id]);
        sendResponse(['ok' => true]);
    }

    // /api/crm/forms/:id/submissions
    if ($method === 'GET' && !empty($id) && $subAction === 'submissions') {
        $stmt = $db->prepare("SELECT * FROM crm_form_submissions WHERE form_id = ? ORDER BY created_at DESC LIMIT 200");
        $stmt->execute([(int)$id]);
        sendResponse(['submissions' => array_map(function ($r) {
            $data = null;
            if (!empty($r['data_json'])) { try { $data = json_decode((string)$r['data_json'], true); } catch (Throwable $e) {} }
            return [
                'id' => (int)$r['id'],
                'contact_id' => $r['contact_id'] !== null ? (int)$r['contact_id'] : null,
                'email' => $r['email'],
                'data' => $data,
                'status' => $r['status'],
                'confirmed_at' => $r['confirmed_at'],
                'created_at' => $r['created_at'],
            ];
        }, $stmt->fetchAll())]);
    }

    sendResponse(['error' => 'Method not supported'], 405);
}

// ═══ /api/crm/csv-preview ════════════════════════════════════════════════════
if ($action === 'csv-preview' && $method === 'POST') {
    $data = getJsonBody();
    $csv = (string)($data['csv'] ?? '');
    if ($csv === '') sendResponse(['error' => 'csv body required'], 400);
    $preview = crmParseCsvPreview($csv, 10);
    sendResponse($preview);
}

// ═══ /api/crm/csv-import ═════════════════════════════════════════════════════
if ($action === 'csv-import' && $method === 'POST') {
    $data = getJsonBody();
    $csv = (string)($data['csv'] ?? '');
    $mapping = is_array($data['mapping'] ?? null) ? $data['mapping'] : [];
    if (!$csv || !$mapping) sendResponse(['error' => 'csv ve mapping gerekli'], 400);
    $result = crmRunCsvImport($db, $csv, $mapping, [
        'tag_slugs' => $data['tag_slugs'] ?? [],
        'list_ids' => $data['list_ids'] ?? [],
        'status' => $data['status'] ?? 'subscribed',
        'source' => $data['source'] ?? 'csv_import',
        'update_existing' => !empty($data['update_existing']),
    ]);
    sendResponse(['ok' => true, 'stats' => $result]);
}

// ═══ /api/crm/csv-export ═════════════════════════════════════════════════════
if ($action === 'csv-export' && $method === 'GET') {
    $csv = crmExportContactsCsv($db, [
        'status' => $_GET['status'] ?? null,
        'source' => $_GET['source'] ?? null,
        'min_score' => $_GET['min_score'] ?? null,
        'list_id' => $_GET['list_id'] ?? null,
        'tag_slug' => $_GET['tag_slug'] ?? null,
    ]);
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="crm-contacts-' . date('Y-m-d') . '.csv"');
    header('Content-Length: ' . strlen($csv));
    echo $csv;
    exit;
}

// ═══ /api/crm/dashboard ══════════════════════════════════════════════════════
if ($action === 'dashboard' && $method === 'GET') {
    $stats = crmDashboardStats($db);
    $growthDays = max(7, min(180, (int)($_GET['growth_days'] ?? 30)));
    $stats['growth_timeseries'] = crmGrowthTimeseries($db, $growthDays);
    sendResponse(['stats' => $stats]);
}

// ═══ /api/crm/funnels ════════════════════════════════════════════════════════
if ($action === 'funnels') {
    if ($method === 'GET' && empty($id)) {
        $rows = $db->query("SELECT * FROM crm_funnels ORDER BY created_at DESC")->fetchAll();
        sendResponse(['funnels' => array_map(function ($r) {
            $steps = json_decode((string)$r['steps_json'], true) ?: [];
            return [
                'id' => (int)$r['id'],
                'slug' => $r['slug'],
                'name' => $r['name'],
                'description' => $r['description'],
                'steps' => $steps,
                'is_active' => (int)$r['is_active'] === 1,
                'created_at' => $r['created_at'],
            ];
        }, $rows)]);
    }

    if ($method === 'GET' && !empty($id) && empty($subAction)) {
        $stmt = $db->prepare("SELECT * FROM crm_funnels WHERE id = ?");
        $stmt->execute([(int)$id]);
        $r = $stmt->fetch();
        if (!$r) sendResponse(['error' => 'Not found'], 404);
        sendResponse(['funnel' => [
            'id' => (int)$r['id'],
            'slug' => $r['slug'],
            'name' => $r['name'],
            'description' => $r['description'],
            'steps' => json_decode((string)$r['steps_json'], true) ?: [],
            'is_active' => (int)$r['is_active'] === 1,
            'created_at' => $r['created_at'],
        ]]);
    }

    if ($method === 'POST' && empty($id)) {
        $data = getJsonBody();
        $slug = preg_replace('/[^a-z0-9_-]/', '', strtolower((string)($data['slug'] ?? $data['name'] ?? '')));
        $name = trim((string)($data['name'] ?? ''));
        $steps = is_array($data['steps'] ?? null) ? $data['steps'] : [];
        if (!$slug || !$name || !$steps) sendResponse(['error' => 'slug, name ve steps zorunlu'], 400);
        try {
            $stmt = $db->prepare("INSERT INTO crm_funnels (slug, name, description, steps_json, created_by)
                                  VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$slug, $name, $data['description'] ?? null, json_encode($steps), (int)$payload['id']]);
            sendResponse(['funnel' => ['id' => (int)$db->lastInsertId(), 'slug' => $slug]], 201);
        } catch (Throwable $e) {
            sendResponse(['error' => 'Bu slug zaten var'], 409);
        }
    }

    if ($method === 'PUT' && !empty($id) && empty($subAction)) {
        $data = getJsonBody();
        $sets = []; $params = [];
        foreach (['name', 'description'] as $k) {
            if (array_key_exists($k, $data)) { $sets[] = "$k = ?"; $params[] = $data[$k]; }
        }
        if (array_key_exists('steps', $data) && is_array($data['steps'])) {
            $sets[] = 'steps_json = ?'; $params[] = json_encode($data['steps']);
        }
        if (array_key_exists('is_active', $data)) {
            $sets[] = 'is_active = ?'; $params[] = !empty($data['is_active']) ? 1 : 0;
        }
        if (!$sets) sendResponse(['error' => 'No fields'], 400);
        $params[] = (int)$id;
        $stmt = $db->prepare("UPDATE crm_funnels SET " . implode(', ', $sets) . " WHERE id = ?");
        $stmt->execute($params);
        sendResponse(['ok' => true]);
    }

    if ($method === 'DELETE' && !empty($id) && empty($subAction)) {
        $db->prepare("DELETE FROM crm_funnels WHERE id = ?")->execute([(int)$id]);
        sendResponse(['ok' => true]);
    }

    // /api/crm/funnels/:id/compute
    if ($method === 'GET' && !empty($id) && $subAction === 'compute') {
        $stmt = $db->prepare("SELECT steps_json FROM crm_funnels WHERE id = ?");
        $stmt->execute([(int)$id]);
        $row = $stmt->fetch();
        if (!$row) sendResponse(['error' => 'Not found'], 404);
        $steps = json_decode((string)$row['steps_json'], true) ?: [];
        $rangeDays = max(1, min(365, (int)($_GET['range_days'] ?? 30)));
        $result = crmComputeFunnel($db, $steps, $rangeDays);
        sendResponse(['steps' => $result, 'range_days' => $rangeDays]);
    }

    // /api/crm/funnels/preview — kaydedilmemiş steps ile
    if ($method === 'POST' && $id === 'preview') {
        $data = getJsonBody();
        $steps = is_array($data['steps'] ?? null) ? $data['steps'] : [];
        $rangeDays = max(1, min(365, (int)($data['range_days'] ?? 30)));
        $result = crmComputeFunnel($db, $steps, $rangeDays);
        sendResponse(['steps' => $result, 'range_days' => $rangeDays]);
    }

    sendResponse(['error' => 'Method not supported'], 405);
}

if ($action === 'email-tracking' && $method === 'GET') {
    $limit = min(500, max(20, (int)($_GET['limit'] ?? 100)));
    $event = trim((string)($_GET['event'] ?? ''));
    $where = ''; $params = [];
    if ($event !== '') { $where = 'WHERE event = ?'; $params[] = $event; }
    $sql = "SELECT t.*, c.email AS contact_email, c.first_name, c.last_name
            FROM crm_email_tracking t
            LEFT JOIN crm_contacts c ON c.id = t.contact_id
            $where
            ORDER BY t.occurred_at DESC LIMIT $limit";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    sendResponse(['events' => array_map(function ($r) {
        return [
            'id' => (int)$r['id'],
            'contact_id' => $r['contact_id'] !== null ? (int)$r['contact_id'] : null,
            'contact_email' => $r['contact_email'] ?? $r['email'],
            'event' => $r['event'],
            'message_id' => $r['message_id'],
            'link_url' => $r['link_url'],
            'reason' => $r['reason'],
            'occurred_at' => $r['occurred_at'],
        ];
    }, $stmt->fetchAll())]);
}

// ═══ /api/crm/stats ══════════════════════════════════════════════════════════
if ($action === 'stats' && $method === 'GET') {
    $stats = [
        'total' => 0,
        'by_status' => [],
        'by_source' => [],
        'recent_7d' => 0,
    ];
    try {
        $stats['total'] = (int)$db->query("SELECT COUNT(*) FROM crm_contacts")->fetchColumn();
        foreach ($db->query("SELECT status, COUNT(*) c FROM crm_contacts GROUP BY status") as $r) {
            $stats['by_status'][$r['status']] = (int)$r['c'];
        }
        foreach ($db->query("SELECT source, COUNT(*) c FROM crm_contacts GROUP BY source") as $r) {
            $stats['by_source'][$r['source']] = (int)$r['c'];
        }
        $stats['recent_7d'] = (int)$db->query("SELECT COUNT(*) FROM crm_contacts WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)")->fetchColumn();
    } catch (Throwable $e) { /* ignore */ }
    sendResponse(['stats' => $stats]);
}

// ═══ /api/crm/custom-fields ══════════════════════════════════════════════════
if ($action === 'custom-fields') {
    if ($method === 'GET') {
        $rows = $db->query("SELECT * FROM crm_custom_fields ORDER BY sort_order ASC, id ASC")->fetchAll();
        $out = array_map(function ($r) {
            $opts = null;
            if (!empty($r['options_json'])) {
                try { $opts = json_decode((string)$r['options_json'], true); } catch (Throwable $e) {}
            }
            return [
                'id' => (int)$r['id'],
                'field_key' => $r['field_key'],
                'label' => $r['label'],
                'type' => $r['type'],
                'options' => $opts,
                'sort_order' => (int)$r['sort_order'],
            ];
        }, $rows);
        sendResponse(['fields' => $out]);
    }

    if ($method === 'POST') {
        $data = getJsonBody();
        $key = preg_replace('/[^a-z0-9_]/', '', strtolower((string)($data['field_key'] ?? '')));
        $label = trim((string)($data['label'] ?? ''));
        $type = (string)($data['type'] ?? 'text');
        if (!$key || !$label) sendResponse(['error' => 'field_key ve label zorunlu'], 400);
        if (!in_array($type, ['text','textarea','number','select','multi_select','date','checkbox'], true)) $type = 'text';
        $opts = isset($data['options']) && is_array($data['options']) ? json_encode($data['options']) : null;
        $sort = (int)($data['sort_order'] ?? 0);

        $stmt = $db->prepare("INSERT INTO crm_custom_fields (field_key, label, type, options_json, sort_order)
                              VALUES (?, ?, ?, ?, ?)
                              ON DUPLICATE KEY UPDATE label = VALUES(label), type = VALUES(type),
                              options_json = VALUES(options_json), sort_order = VALUES(sort_order)");
        $stmt->execute([$key, $label, $type, $opts, $sort]);
        sendResponse(['ok' => true]);
    }

    if ($method === 'DELETE' && !empty($id)) {
        $stmt = $db->prepare("DELETE FROM crm_custom_fields WHERE id = ?");
        $stmt->execute([(int)$id]);
        sendResponse(['ok' => true]);
    }

    sendResponse(['error' => 'Method not supported'], 405);
}

// ═══ /api/crm/tags ═══════════════════════════════════════════════════════════
if ($action === 'tags') {
    if ($method === 'GET' && empty($id)) {
        $rows = $db->query("SELECT * FROM crm_tags ORDER BY name ASC")->fetchAll();
        sendResponse(['tags' => array_map(function ($r) {
            return [
                'id' => (int)$r['id'],
                'slug' => $r['slug'],
                'name' => $r['name'],
                'color' => $r['color'],
                'description' => $r['description'],
                'contact_count' => (int)$r['contact_count'],
                'created_at' => $r['created_at'],
            ];
        }, $rows)]);
    }

    if ($method === 'POST' && empty($id)) {
        $data = getJsonBody();
        $slug = preg_replace('/[^a-z0-9_-]/', '', strtolower((string)($data['slug'] ?? $data['name'] ?? '')));
        $name = trim((string)($data['name'] ?? ''));
        $color = trim((string)($data['color'] ?? '#2563eb'));
        $desc = trim((string)($data['description'] ?? ''));
        if (!$slug || !$name) sendResponse(['error' => 'slug ve name zorunlu'], 400);
        try {
            $stmt = $db->prepare("INSERT INTO crm_tags (slug, name, color, description) VALUES (?, ?, ?, ?)");
            $stmt->execute([$slug, $name, $color, $desc ?: null]);
            $newId = (int)$db->lastInsertId();
        } catch (Throwable $e) {
            sendResponse(['error' => 'Bu slug zaten kayıtlı'], 409);
        }
        $stmt = $db->prepare("SELECT * FROM crm_tags WHERE id = ?");
        $stmt->execute([$newId]);
        $r = $stmt->fetch();
        sendResponse(['tag' => [
            'id' => (int)$r['id'], 'slug' => $r['slug'], 'name' => $r['name'],
            'color' => $r['color'], 'description' => $r['description'],
            'contact_count' => 0, 'created_at' => $r['created_at']
        ]], 201);
    }

    if ($method === 'PUT' && !empty($id)) {
        $data = getJsonBody();
        $sets = []; $params = [];
        foreach (['name', 'color', 'description'] as $k) {
            if (array_key_exists($k, $data)) { $sets[] = "$k = ?"; $params[] = $data[$k]; }
        }
        if (!$sets) sendResponse(['error' => 'No fields'], 400);
        $params[] = (int)$id;
        $stmt = $db->prepare("UPDATE crm_tags SET " . implode(', ', $sets) . " WHERE id = ?");
        $stmt->execute($params);
        sendResponse(['ok' => true]);
    }

    if ($method === 'DELETE' && !empty($id)) {
        $db->prepare("DELETE FROM crm_contact_tags WHERE tag_id = ?")->execute([(int)$id]);
        $db->prepare("DELETE FROM crm_tags WHERE id = ?")->execute([(int)$id]);
        sendResponse(['ok' => true]);
    }

    sendResponse(['error' => 'Method not supported'], 405);
}

// ═══ /api/crm/lists ══════════════════════════════════════════════════════════
if ($action === 'lists') {
    if ($method === 'GET' && empty($id)) {
        $rows = $db->query("SELECT * FROM crm_lists ORDER BY created_at DESC")->fetchAll();
        sendResponse(['lists' => array_map(function ($r) {
            $rules = null;
            if (!empty($r['rules_json'])) {
                try { $rules = json_decode((string)$r['rules_json'], true); } catch (Throwable $e) {}
            }
            return [
                'id' => (int)$r['id'], 'slug' => $r['slug'], 'name' => $r['name'],
                'description' => $r['description'], 'type' => $r['type'],
                'rules' => $rules, 'contact_count' => (int)$r['contact_count'],
                'created_at' => $r['created_at'], 'updated_at' => $r['updated_at'],
            ];
        }, $rows)]);
    }

    if ($method === 'GET' && !empty($id) && empty($subAction)) {
        $stmt = $db->prepare("SELECT * FROM crm_lists WHERE id = ?");
        $stmt->execute([(int)$id]);
        $r = $stmt->fetch();
        if (!$r) sendResponse(['error' => 'Not found'], 404);
        $rules = null;
        if (!empty($r['rules_json'])) {
            try { $rules = json_decode((string)$r['rules_json'], true); } catch (Throwable $e) {}
        }
        // Smart list ise dinamik sayıyı hesapla
        $count = (int)$r['contact_count'];
        if ($r['type'] === 'smart' && $rules) {
            try {
                $built = crmBuildSmartListSql($rules);
                $w = $built['where'] ? "WHERE " . $built['where'] : '';
                $cs = $db->prepare("SELECT COUNT(*) FROM crm_contacts c $w");
                $cs->execute($built['params']);
                $count = (int)$cs->fetchColumn();
            } catch (Throwable $e) {}
        }
        sendResponse(['list' => [
            'id' => (int)$r['id'], 'slug' => $r['slug'], 'name' => $r['name'],
            'description' => $r['description'], 'type' => $r['type'],
            'rules' => $rules, 'contact_count' => $count,
            'created_at' => $r['created_at'], 'updated_at' => $r['updated_at'],
        ]]);
    }

    if ($method === 'POST' && empty($id)) {
        $data = getJsonBody();
        $slug = preg_replace('/[^a-z0-9_-]/', '', strtolower((string)($data['slug'] ?? $data['name'] ?? '')));
        $name = trim((string)($data['name'] ?? ''));
        $type = in_array(($data['type'] ?? 'static'), ['static', 'smart'], true) ? $data['type'] : 'static';
        $desc = trim((string)($data['description'] ?? ''));
        $rules = ($type === 'smart' && isset($data['rules']) && is_array($data['rules'])) ? json_encode($data['rules']) : null;
        if (!$slug || !$name) sendResponse(['error' => 'slug ve name zorunlu'], 400);
        try {
            $stmt = $db->prepare("INSERT INTO crm_lists (slug, name, description, type, rules_json) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$slug, $name, $desc ?: null, $type, $rules]);
            $newId = (int)$db->lastInsertId();
        } catch (Throwable $e) {
            sendResponse(['error' => 'Bu slug zaten kayıtlı'], 409);
        }
        sendResponse(['list' => ['id' => $newId, 'slug' => $slug, 'name' => $name, 'type' => $type]], 201);
    }

    if ($method === 'PUT' && !empty($id) && empty($subAction)) {
        $data = getJsonBody();
        $sets = []; $params = [];
        foreach (['name', 'description'] as $k) {
            if (array_key_exists($k, $data)) { $sets[] = "$k = ?"; $params[] = $data[$k]; }
        }
        if (array_key_exists('rules', $data)) {
            $sets[] = 'rules_json = ?';
            $params[] = is_array($data['rules']) ? json_encode($data['rules']) : null;
        }
        if (!$sets) sendResponse(['error' => 'No fields'], 400);
        $params[] = (int)$id;
        $stmt = $db->prepare("UPDATE crm_lists SET " . implode(', ', $sets) . " WHERE id = ?");
        $stmt->execute($params);
        sendResponse(['ok' => true]);
    }

    if ($method === 'DELETE' && !empty($id)) {
        $db->prepare("DELETE FROM crm_list_contacts WHERE list_id = ?")->execute([(int)$id]);
        $db->prepare("DELETE FROM crm_lists WHERE id = ?")->execute([(int)$id]);
        sendResponse(['ok' => true]);
    }

    // Preview (henüz kaydedilmemiş kurallar için)
    if ($method === 'POST' && $id === 'preview') {
        $data = getJsonBody();
        $rules = $data['rules'] ?? [];
        $preview = crmRunSmartListPreview($db, $rules, 10);
        sendResponse($preview);
    }

    // Liste içindekiler
    if ($method === 'GET' && !empty($id) && $subAction === 'contacts') {
        $page = max(1, (int)($_GET['page'] ?? 1));
        $perPage = min(200, max(10, (int)($_GET['per_page'] ?? 50)));
        $offset = ($page - 1) * $perPage;

        $stmt = $db->prepare("SELECT * FROM crm_lists WHERE id = ?");
        $stmt->execute([(int)$id]);
        $list = $stmt->fetch();
        if (!$list) sendResponse(['error' => 'Not found'], 404);

        if ($list['type'] === 'smart') {
            $rules = json_decode((string)$list['rules_json'], true) ?: [];
            $built = crmBuildSmartListSql($rules);
            $w = $built['where'] ? "WHERE " . $built['where'] : '';
            $cs = $db->prepare("SELECT COUNT(*) FROM crm_contacts c $w");
            $cs->execute($built['params']);
            $total = (int)$cs->fetchColumn();
            $sql = "SELECT c.* FROM crm_contacts c $w ORDER BY c.created_at DESC LIMIT $perPage OFFSET $offset";
            $rs = $db->prepare($sql);
            $rs->execute($built['params']);
            $contacts = $rs->fetchAll();
        } else {
            $cs = $db->prepare("SELECT COUNT(*) FROM crm_list_contacts WHERE list_id = ?");
            $cs->execute([(int)$id]);
            $total = (int)$cs->fetchColumn();
            $sql = "SELECT c.* FROM crm_list_contacts lc JOIN crm_contacts c ON c.id = lc.contact_id
                    WHERE lc.list_id = ? ORDER BY lc.added_at DESC LIMIT $perPage OFFSET $offset";
            $rs = $db->prepare($sql);
            $rs->execute([(int)$id]);
            $contacts = $rs->fetchAll();
        }

        sendResponse([
            'contacts' => array_map('crmContactRow', $contacts),
            'total' => $total, 'page' => $page, 'per_page' => $perPage,
            'pages' => $total > 0 ? (int)ceil($total / $perPage) : 0
        ]);
    }

    // Static list'e contact ekle/çıkar
    if ($method === 'POST' && !empty($id) && $subAction === 'add') {
        $data = getJsonBody();
        $contactIds = array_filter(array_map('intval', $data['contact_ids'] ?? []));
        if (!$contactIds) sendResponse(['error' => 'contact_ids gerekli'], 400);
        $stmt = $db->prepare("INSERT IGNORE INTO crm_list_contacts (list_id, contact_id) VALUES (?, ?)");
        $added = [];
        foreach ($contactIds as $cid) {
            $stmt->execute([(int)$id, $cid]);
            if ($stmt->rowCount() > 0) $added[] = $cid;
        }
        crmRecountListContacts($db, (int)$id);
        // Faz 8: list_joined trigger
        foreach ($added as $cid) {
            crmFireAutomation($db, 'list_joined', $cid, ['list_id' => (int)$id]);
        }
        sendResponse(['ok' => true, 'added' => count($added)]);
    }

    if ($method === 'POST' && !empty($id) && $subAction === 'remove') {
        $data = getJsonBody();
        $contactIds = array_filter(array_map('intval', $data['contact_ids'] ?? []));
        if (!$contactIds) sendResponse(['error' => 'contact_ids gerekli'], 400);
        $placeholders = implode(',', array_fill(0, count($contactIds), '?'));
        $stmt = $db->prepare("DELETE FROM crm_list_contacts WHERE list_id = ? AND contact_id IN ($placeholders)");
        $stmt->execute(array_merge([(int)$id], $contactIds));
        crmRecountListContacts($db, (int)$id);
        sendResponse(['ok' => true]);
    }

    sendResponse(['error' => 'Method not supported'], 405);
}

sendResponse(['error' => 'CRM endpoint not found: ' . $path], 404);
