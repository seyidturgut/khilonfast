<?php
// api/routes/automation-test.php
// Admin için otomasyon test simülatörü.
// Senaryolar gerçek event'lerin yerine geçer; preview modunda DB rollback yapar.

set_exception_handler(function (Throwable $e) {
    header('Content-Type: application/json', true, 500);
    echo json_encode(['error' => 'PHP Exception: ' . $e->getMessage(), 'file' => basename($e->getFile()), 'line' => $e->getLine()]);
    exit;
});

require_once __DIR__ . '/../utils.php';
require_once __DIR__ . '/../services/CrmSchema.php';
require_once __DIR__ . '/../services/CrmActivityRecorder.php';
require_once __DIR__ . '/../services/CrmScoringEngine.php';
require_once __DIR__ . '/../services/CrmAutomationBridge.php';
require_once __DIR__ . '/../services/AutomationEngine.php';

$db = Database::getInstance();
try { ensureCrmContactsSchema($db); } catch (Throwable $e) {}

// Admin auth
$token = getBearerToken();
$payload = decodeJWT($token);
if (!$payload) sendResponse(['error' => 'Unauthorized'], 401);
$stmt = $db->prepare("SELECT role FROM users WHERE id = ?");
$stmt->execute([$payload['id']]);
$user = $stmt->fetch();
if (!$user || $user['role'] !== 'admin') sendResponse(['error' => 'Admin only'], 403);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function snapshotState(PDO $db, string $email): array
{
    $email = strtolower(trim($email));
    $state = [
        'email' => $email,
        'contact' => null,
        'tags' => [],
        'active_executions' => [],
        'queued_emails_count' => 0,
        'recent_activities' => [],
        'recent_score_changes' => [],
    ];

    try {
        $stmt = $db->prepare("SELECT id, email, first_name, last_name, score, status, source FROM crm_contacts WHERE email = ?");
        $stmt->execute([$email]);
        $c = $stmt->fetch();
        if ($c) {
            $state['contact'] = [
                'id' => (int)$c['id'],
                'first_name' => $c['first_name'],
                'last_name' => $c['last_name'],
                'score' => (int)$c['score'],
                'status' => $c['status'],
                'source' => $c['source'],
            ];

            $stmt = $db->prepare("SELECT t.slug, t.name FROM crm_contact_tags ct
                                  JOIN crm_tags t ON t.id = ct.tag_id WHERE ct.contact_id = ?");
            $stmt->execute([(int)$c['id']]);
            $state['tags'] = array_column($stmt->fetchAll(), 'slug');
        }
    } catch (Throwable $e) {}

    try {
        $stmt = $db->prepare("SELECT ae.id, ae.automation_id, a.name, ae.status, ae.current_node_id, ae.next_run_at, ae.started_at
                              FROM automation_executions ae
                              LEFT JOIN automations a ON a.id = ae.automation_id
                              WHERE ae.contact_email = ? ORDER BY ae.started_at DESC LIMIT 20");
        $stmt->execute([$email]);
        foreach ($stmt as $r) {
            $state['active_executions'][] = [
                'id' => (int)$r['id'],
                'automation_id' => (int)$r['automation_id'],
                'automation_name' => $r['name'],
                'status' => $r['status'],
                'current_node' => $r['current_node_id'],
                'next_run_at' => $r['next_run_at'],
                'started_at' => $r['started_at'],
            ];
        }
    } catch (Throwable $e) {}

    try {
        $stmt = $db->prepare("SELECT COUNT(*) FROM email_queue WHERE recipient_email = ? AND status = 'pending'");
        $stmt->execute([$email]);
        $state['queued_emails_count'] = (int)$stmt->fetchColumn();
    } catch (Throwable $e) {}

    if ($state['contact']) {
        $cid = $state['contact']['id'];
        try {
            $stmt = $db->prepare("SELECT type, title, occurred_at FROM crm_activity_log
                                  WHERE contact_id = ? ORDER BY occurred_at DESC LIMIT 8");
            $stmt->execute([$cid]);
            $state['recent_activities'] = $stmt->fetchAll();
        } catch (Throwable $e) {}
        try {
            $stmt = $db->prepare("SELECT delta, score_after, reason, created_at FROM crm_score_history
                                  WHERE contact_id = ? ORDER BY created_at DESC LIMIT 6");
            $stmt->execute([$cid]);
            $state['recent_score_changes'] = $stmt->fetchAll();
        } catch (Throwable $e) {}
    }

    return $state;
}

function diffState(array $before, array $after): array
{
    $diff = ['changes' => []];

    $beforeContact = $before['contact'];
    $afterContact = $after['contact'];

    if (!$beforeContact && $afterContact) {
        $diff['changes'][] = ['type' => 'contact_created', 'detail' => 'Yeni CRM kişisi oluşturuldu (id=' . $afterContact['id'] . ')'];
    }

    if ($beforeContact && $afterContact) {
        if ($beforeContact['score'] !== $afterContact['score']) {
            $delta = $afterContact['score'] - $beforeContact['score'];
            $sign = $delta > 0 ? '+' : '';
            $diff['changes'][] = ['type' => 'score_change', 'detail' => "Skor: {$beforeContact['score']} → {$afterContact['score']} ($sign$delta)"];
        }
        if ($beforeContact['status'] !== $afterContact['status']) {
            $diff['changes'][] = ['type' => 'status_change', 'detail' => "Durum: {$beforeContact['status']} → {$afterContact['status']}"];
        }
    }

    $newTags = array_diff($after['tags'], $before['tags']);
    foreach ($newTags as $t) {
        $diff['changes'][] = ['type' => 'tag_added', 'detail' => "Etiket eklendi: $t"];
    }
    $removedTags = array_diff($before['tags'], $after['tags']);
    foreach ($removedTags as $t) {
        $diff['changes'][] = ['type' => 'tag_removed', 'detail' => "Etiket kaldırıldı: $t"];
    }

    $beforeIds = array_column($before['active_executions'], 'id');
    $afterIds = array_column($after['active_executions'], 'id');
    $newExecIds = array_diff($afterIds, $beforeIds);
    foreach ($after['active_executions'] as $e) {
        if (in_array($e['id'], $newExecIds, true)) {
            $diff['changes'][] = [
                'type' => 'automation_started',
                'detail' => "Otomasyon başlatıldı: \"{$e['automation_name']}\" — durum: {$e['status']}",
                'execution_id' => $e['id'],
                'automation_id' => $e['automation_id'],
                'automation_name' => $e['automation_name'],
                'next_run_at' => $e['next_run_at'],
            ];
        }
    }

    $queueDelta = $after['queued_emails_count'] - $before['queued_emails_count'];
    if ($queueDelta > 0) {
        $diff['changes'][] = ['type' => 'emails_queued', 'detail' => "$queueDelta yeni e-posta gönderim kuyruğuna alındı"];
    }

    return $diff;
}

function getQueuedEmails(PDO $db, string $email, ?string $afterTime = null): array
{
    try {
        $sql = "SELECT eq.id, eq.recipient_email, eq.scheduled_at, eq.status,
                       ess.subject, ess.body_html, es.name AS sequence_name
                FROM email_queue eq
                LEFT JOIN email_sequence_steps ess ON ess.id = eq.sequence_step_id
                LEFT JOIN email_sequences es ON es.id = ess.sequence_id
                WHERE eq.recipient_email = ?";
        $params = [$email];
        if ($afterTime) {
            $sql .= " AND eq.created_at >= ?";
            $params[] = $afterTime;
        }
        $sql .= " ORDER BY eq.scheduled_at ASC LIMIT 20";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    } catch (Throwable $e) {
        return [];
    }
}

// ─── Scenarios ───────────────────────────────────────────────────────────────

function scenarioAbandonedCart(PDO $db, array $contact): array
{
    $engine = new AutomationEngine($db);
    $payload = array_merge($contact, [
        'cart_items' => [
            ['product_id' => 1, 'name' => 'Go-to-Market Paketi', 'price' => 5000, 'currency' => 'TRY'],
        ],
        'cart_total' => 5000,
        'cart_link' => 'https://khilonfast.com/odeme?cart=test',
    ]);
    $result = $engine->trigger('checkout_email_entered', $payload);

    // CRM event de tetikle
    try {
        if (function_exists('emailEventInsert')) {
            // (Opsiyonel — projede bu helper yok, atla)
        }
    } catch (Throwable $e) {}

    return [
        'scenario' => 'abandoned_cart',
        'event' => 'checkout_email_entered',
        'engine_result' => $result,
        'description' => 'Kullanıcı sepete ürün ekledi, e-posta girdi ama ödeme yapmadı. "Terk Edilen Sepet" akışı tetiklenir.',
    ];
}

function scenarioPurchaseCompleted(PDO $db, array $contact): array
{
    $engine = new AutomationEngine($db);
    $payload = array_merge($contact, [
        'order_id' => 999999,
        'order_number' => 'TEST-ORD-' . time(),
        'product_id' => 1,
        'product_name' => 'Go-to-Market Paketi',
        'amount' => 5000,
        'currency' => 'TRY',
    ]);
    $result = $engine->trigger('purchase_completed', $payload);
    return [
        'scenario' => 'purchase_completed',
        'event' => 'purchase_completed',
        'engine_result' => $result,
        'description' => 'Kullanıcı tek seferlik bir hizmet satın aldı. "Aldı/Kullanmadı" akışı tetiklenir.',
    ];
}

function scenarioNewsletterSignup(PDO $db, array $contact, string $email): array
{
    // 1) Contact yoksa oluştur
    $contactId = crmFindContactIdByEmail($db, $email);
    if (!$contactId) {
        $stmt = $db->prepare("INSERT INTO crm_contacts (email, first_name, last_name, source, status)
                              VALUES (?, ?, ?, 'test_simulator', 'subscribed')");
        $stmt->execute([$email, $contact['first_name'] ?? 'Test', $contact['last_name'] ?? 'User']);
        $contactId = (int)$db->lastInsertId();
    }

    // 2) Newsletter tag yoksa oluştur
    $tagStmt = $db->prepare("SELECT id FROM crm_tags WHERE slug = 'newsletter' LIMIT 1");
    $tagStmt->execute();
    $tagId = $tagStmt->fetchColumn();
    if (!$tagId) {
        $db->prepare("INSERT INTO crm_tags (slug, name, color) VALUES ('newsletter','Newsletter','#16a34a')")->execute();
        $tagId = (int)$db->lastInsertId();
    }

    // 3) Tag at + tag_added otomasyon trigger'ı
    $db->prepare("INSERT IGNORE INTO crm_contact_tags (contact_id, tag_id) VALUES (?, ?)")
       ->execute([$contactId, (int)$tagId]);
    $db->exec("UPDATE crm_tags SET contact_count = (SELECT COUNT(*) FROM crm_contact_tags WHERE tag_id = crm_tags.id) WHERE id = " . (int)$tagId);
    crmFireAutomation($db, 'tag_added', $contactId, ['tag_slug' => 'newsletter', 'tag_id' => (int)$tagId]);

    // 4) Aktivite + skor (form_submitted ruleset varsa skor ekler)
    crmRecordActivity($db, $contactId, 'form_submitted', 'Newsletter formundan kayıt (test)', [
        'metadata' => ['form' => 'test_simulator']
    ]);
    crmApplyScore($db, $contactId, 'form_submitted', ['reason' => 'Newsletter signup test']);

    return [
        'scenario' => 'newsletter_signup',
        'event' => 'tag_added (newsletter)',
        'description' => 'Kullanıcı newsletter formunu doldurdu. CRM tag uygulandı, "tag_added" trigger\'ı + form_submitted skoru çalıştı.',
    ];
}

function scenarioCourseCompleted(PDO $db, array $contact): array
{
    $engine = new AutomationEngine($db);
    $payload = array_merge($contact, [
        'course_id' => 1,
        'course_name' => 'Test Eğitim',
        'completed_at' => date('c'),
    ]);
    $result = $engine->trigger('course_completed', $payload);
    return [
        'scenario' => 'course_completed',
        'event' => 'course_completed',
        'engine_result' => $result,
        'description' => 'Kullanıcı bir eğitimi tamamladı. Cross-sell akışı tetiklenir.',
    ];
}

function scenarioWebVisit(PDO $db, array $contact, string $email): array
{
    $contactId = crmFindContactIdByEmail($db, $email);
    if (!$contactId) {
        $stmt = $db->prepare("INSERT INTO crm_contacts (email, first_name, last_name, source, status)
                              VALUES (?, ?, ?, 'test_simulator', 'subscribed')");
        $stmt->execute([$email, $contact['first_name'] ?? 'Test', $contact['last_name'] ?? 'User']);
        $contactId = (int)$db->lastInsertId();
    }

    crmRecordActivity($db, $contactId, 'web_page_visited', 'Sayfa ziyaret: /pricing (test)', [
        'metadata' => ['url' => 'https://khilonfast.com/pricing', 'utm_source' => 'test']
    ]);
    crmApplyScore($db, $contactId, 'web_page_visited', ['reason' => 'Test web visit']);
    crmFireAutomation($db, 'web_page_visited', $contactId, ['url' => 'https://khilonfast.com/pricing']);

    return [
        'scenario' => 'web_visit',
        'event' => 'web_page_visited',
        'description' => 'Kullanıcı /pricing sayfasını ziyaret etti. Skor +1, web_page_visited automation trigger\'ı çalıştı.',
    ];
}

function scenarioConsultingAppointment(PDO $db, array $contact): array
{
    $engine = new AutomationEngine($db);
    $payload = array_merge($contact, [
        'consultant_id' => 1,
        'consultant_name' => 'Test Danışman',
        'appointment_date' => date('c', strtotime('+3 days')),
    ]);
    $result = $engine->trigger('consulting_appointment', $payload);
    return [
        'scenario' => 'consulting_appointment',
        'event' => 'consulting_appointment',
        'engine_result' => $result,
        'description' => 'Kullanıcı bir danışmanlık seansı rezerve etti. Hatırlatma akışı tetiklenir.',
    ];
}

// ─── Routes ──────────────────────────────────────────────────────────────────

if ($action === 'scenarios' && $method === 'GET') {
    sendResponse(['scenarios' => [
        ['key' => 'abandoned_cart', 'label' => '🛒 Terk Edilen Sepet', 'description' => 'Sepete ürün eklendi, ödeme yapılmadı. 6 adımlı drip akışı tetiklenir.'],
        ['key' => 'purchase_completed', 'label' => '💳 Satın Alma Tamamlandı', 'description' => 'Tek seferlik hizmet alındı. Aldı/Kullanmadı akışı tetiklenir.'],
        ['key' => 'newsletter_signup', 'label' => '📧 Newsletter Abonelik', 'description' => 'Form gönderildi, newsletter tag uygulandı, tag_added trigger.'],
        ['key' => 'course_completed', 'label' => '🎓 Eğitim Tamamlandı', 'description' => 'Eğitim bitti, cross-sell akışı tetiklenir.'],
        ['key' => 'consulting_appointment', 'label' => '📅 Danışmanlık Randevusu', 'description' => 'Randevu kuruldu, hatırlatma akışı tetiklenir.'],
        ['key' => 'web_visit', 'label' => '🌐 Web Sayfa Ziyaret', 'description' => 'Pricing sayfası ziyaret + web_page_visited automation trigger.'],
        ['key' => 'run_all', 'label' => '⚡ Hepsini Sırayla Çalıştır', 'description' => 'Yukarıdaki tüm senaryolar sırayla çalıştırılır.'],
    ]]);
}

if ($action === 'run' && $method === 'POST') {
    $data = getJsonBody();
    $email = strtolower(trim((string)($data['email'] ?? '')));
    $scenario = (string)($data['scenario'] ?? '');
    $mode = (string)($data['mode'] ?? 'preview');
    $firstName = trim((string)($data['first_name'] ?? 'Test'));
    $lastName = trim((string)($data['last_name'] ?? 'User'));

    if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sendResponse(['error' => 'Geçerli email zorunlu'], 400);
    }
    if (!$scenario) sendResponse(['error' => 'scenario zorunlu'], 400);
    if (!in_array($mode, ['preview', 'live'], true)) $mode = 'preview';

    $contact = [
        'email' => $email,
        'first_name' => $firstName,
        'last_name' => $lastName,
        'user_id' => null,
    ];
    // Eğer mevcut user var ise user_id'yi al
    try {
        $stmt = $db->prepare("SELECT id, first_name, last_name FROM users WHERE email = ? LIMIT 1");
        $stmt->execute([$email]);
        if ($u = $stmt->fetch()) {
            $contact['user_id'] = (int)$u['id'];
            if ($u['first_name']) $contact['first_name'] = $u['first_name'];
            if ($u['last_name']) $contact['last_name'] = $u['last_name'];
        }
    } catch (Throwable $e) {}

    $startTime = date('Y-m-d H:i:s');
    $before = snapshotState($db, $email);

    $scenarios = ['abandoned_cart','purchase_completed','newsletter_signup','course_completed','consulting_appointment','web_visit'];
    $toRun = $scenario === 'run_all' ? $scenarios : [$scenario];

    $results = [];

    if ($mode === 'preview') {
        $db->beginTransaction();
    }

    try {
        foreach ($toRun as $sc) {
            switch ($sc) {
                case 'abandoned_cart':
                    $results[] = scenarioAbandonedCart($db, $contact); break;
                case 'purchase_completed':
                    $results[] = scenarioPurchaseCompleted($db, $contact); break;
                case 'newsletter_signup':
                    $results[] = scenarioNewsletterSignup($db, $contact, $email); break;
                case 'course_completed':
                    $results[] = scenarioCourseCompleted($db, $contact); break;
                case 'consulting_appointment':
                    $results[] = scenarioConsultingAppointment($db, $contact); break;
                case 'web_visit':
                    $results[] = scenarioWebVisit($db, $contact, $email); break;
                default:
                    $results[] = ['scenario' => $sc, 'error' => 'Unknown scenario'];
            }
        }

        $after = snapshotState($db, $email);
        $diff = diffState($before, $after);
        $queuedEmails = getQueuedEmails($db, $email, $startTime);

        // Otomasyon execution detayları (scenario'lar başlattığı yeni execution'lar için)
        $newExecutions = [];
        foreach ($after['active_executions'] as $exec) {
            $isNew = !in_array($exec['id'], array_column($before['active_executions'], 'id'), true);
            if ($isNew) {
                // İlk node'un içeriğini çek (genelde trigger node)
                try {
                    $stmt = $db->prepare("SELECT a.nodes_json FROM automations a WHERE a.id = ?");
                    $stmt->execute([$exec['automation_id']]);
                    $nodesJson = $stmt->fetchColumn();
                    $nodes = json_decode((string)$nodesJson, true) ?: [];
                    $exec['nodes_count'] = count($nodes);
                    $exec['next_step'] = null;
                    foreach ($nodes as $n) {
                        if (($n['id'] ?? '') === $exec['current_node']) {
                            $exec['next_step'] = [
                                'type' => $n['type'] ?? '',
                                'data' => $n['data'] ?? null,
                            ];
                            break;
                        }
                    }
                } catch (Throwable $e) {}
                $newExecutions[] = $exec;
            }
        }

        if ($mode === 'preview') {
            $db->rollBack();
            // Snapshot'ları rollback'ten ÖNCE almıştık, ama queued_emails sorgusu rollback olmuş olabilir
            // Onları manuel olarak yapay listele (rollback öncesinde alındılar)
        }

        $report = [
            'ok' => true,
            'mode' => $mode,
            'rolled_back' => $mode === 'preview',
            'email' => $email,
            'scenario' => $scenario,
            'scenarios_run' => count($toRun),
            'before' => [
                'contact_exists' => $before['contact'] !== null,
                'score' => $before['contact']['score'] ?? 0,
                'tags' => $before['tags'],
                'active_executions' => count($before['active_executions']),
                'queued_emails' => $before['queued_emails_count'],
            ],
            'after' => [
                'contact_exists' => $after['contact'] !== null,
                'score' => $after['contact']['score'] ?? 0,
                'tags' => $after['tags'],
                'active_executions' => count($after['active_executions']),
                'queued_emails' => $after['queued_emails_count'],
            ],
            'changes' => $diff['changes'],
            'new_automations' => $newExecutions,
            'queued_emails' => array_map(function ($e) {
                return [
                    'id' => (int)$e['id'],
                    'subject' => $e['subject'] ?? '(direct send)',
                    'sequence_name' => $e['sequence_name'] ?? null,
                    'scheduled_at' => $e['scheduled_at'],
                    'status' => $e['status'],
                ];
            }, $queuedEmails),
            'scenario_results' => $results,
            'summary' => buildSummary($before, $after, $diff, $newExecutions, $queuedEmails),
        ];

        sendResponse($report);

    } catch (Throwable $e) {
        if ($mode === 'preview' && $db->inTransaction()) $db->rollBack();
        sendResponse(['error' => 'Test failed: ' . $e->getMessage(), 'trace' => $e->getTraceAsString()], 500);
    }
}

function buildSummary(array $before, array $after, array $diff, array $newExecs, array $queuedEmails): string
{
    $lines = [];
    $lines[] = '🎯 **Test Sonucu**';
    $lines[] = '';
    if (!$before['contact'] && $after['contact']) {
        $lines[] = '✅ Yeni CRM kişisi oluşturuldu';
    } else if ($before['contact']) {
        $lines[] = '✓ Mevcut CRM kişisi güncellendi (id=' . $before['contact']['id'] . ')';
    }
    $scoreBefore = $before['contact']['score'] ?? 0;
    $scoreAfter = $after['contact']['score'] ?? 0;
    if ($scoreBefore !== $scoreAfter) {
        $delta = $scoreAfter - $scoreBefore;
        $lines[] = '📊 Skor: ' . $scoreBefore . ' → ' . $scoreAfter . ' (' . ($delta > 0 ? '+' : '') . $delta . ')';
    }
    $newTags = array_diff($after['tags'], $before['tags']);
    if ($newTags) $lines[] = '🏷️ Eklenen etiketler: ' . implode(', ', $newTags);

    if (count($newExecs) > 0) {
        $lines[] = '';
        $lines[] = '⚡ **Tetiklenen ' . count($newExecs) . ' Otomasyon:**';
        foreach ($newExecs as $e) {
            $lines[] = '   • ' . $e['automation_name'] . ' (#' . $e['automation_id'] . ') — durum: ' . $e['status'];
            if ($e['next_run_at']) $lines[] = '     ↳ Sonraki çalışma: ' . $e['next_run_at'];
        }
    } else {
        $lines[] = '';
        $lines[] = '⚠️ Hiç otomasyon tetiklenmedi (event\'e karşılık gelen aktif akış yok ya da contact zaten o akışta).';
    }

    if (count($queuedEmails) > 0) {
        $lines[] = '';
        $lines[] = '📧 **' . count($queuedEmails) . ' E-posta Kuyruğa Alındı:**';
        foreach (array_slice($queuedEmails, 0, 5) as $e) {
            $lines[] = '   • "' . ($e['subject'] ?? '(direct send)') . '" → ' . $e['scheduled_at'] . ' (durum: ' . $e['status'] . ')';
        }
        if (count($queuedEmails) > 5) $lines[] = '   ...ve ' . (count($queuedEmails) - 5) . ' tane daha';
    }

    return implode("\n", $lines);
}

sendResponse(['error' => 'Action not found: ' . $action], 404);
