<?php
// api/services/AutomationEngine.php
// Otomasyon akışı (v2) execution engine.
// - trigger($event, $contact): customer event geldiğinde aktif automation'ları başlat
// - tick($batch): cron — bekleyen step'leri ilerlet
// - cancelByCondition($event, $email): stop condition sağlanan akışları cancel et
// - cancel($execId, $reason): admin manuel cancel

require_once __DIR__ . '/../utils.php';

class AutomationEngine
{
    /** @var PDO */
    private $db;
    /** @var string Frontend base URL (placeholder linkleri için) */
    private $frontendBase;

    public function __construct(PDO $db)
    {
        $this->db = $db;
        $this->frontendBase = defined('FRONTEND_URL') ? rtrim(FRONTEND_URL, '/') : 'https://khilonfast.com';
    }

    // ──────────────────────────────────────────────
    // Public: trigger
    // ──────────────────────────────────────────────

    /**
     * Customer event olduğunda çağrılır.
     * @param string $event örn 'purchase_completed'
     * @param array $contact ['email','first_name','last_name','user_id','order_id', ...]
     * @return array ['triggered'=>int, 'skipped_duplicate'=>int, 'cancelled_by_stop'=>int]
     */
    public function trigger(string $event, array $contact): array
    {
        $email = strtolower(trim((string)($contact['email'] ?? '')));
        if ($email === '') {
            error_log('[automation] trigger: email boş, event=' . $event);
            return ['triggered' => 0, 'skipped_duplicate' => 0, 'cancelled_by_stop' => 0];
        }

        // Aktif automation'ları event'e göre bul (virtual column üzerinden)
        $stmt = $this->db->prepare(
            "SELECT id, nodes_json, edges_json, stop_condition, restart_after_days
             FROM automations
             WHERE status='active' AND trigger_event_idx = ?"
        );
        $stmt->execute([$event]);
        $rows = $stmt->fetchAll();

        $triggered = 0;
        $skippedDup = 0;

        foreach ($rows as $row) {
            $automationId = (int)$row['id'];

            // Duplicate guard
            $dup = $this->db->prepare(
                "SELECT id FROM automation_executions
                 WHERE automation_id=? AND contact_email=? AND status='running' LIMIT 1"
            );
            $dup->execute([$automationId, $email]);
            if ($dup->fetch()) {
                $skippedDup++;
                continue;
            }

            // Restart-after-days guard
            $restartDays = $row['restart_after_days'] !== null ? (int)$row['restart_after_days'] : null;
            if ($restartDays && $restartDays > 0) {
                $check = $this->db->prepare(
                    "SELECT id FROM automation_executions
                     WHERE automation_id=? AND contact_email=?
                     AND started_at > NOW() - INTERVAL ? DAY
                     LIMIT 1"
                );
                $check->execute([$automationId, $email, $restartDays]);
                if ($check->fetch()) {
                    $skippedDup++;
                    continue;
                }
            }

            // Trigger node id'sini akışın gerçek nodes_json'undan bul.
            // Bazı akışlar 'n1...' bazıları 'a1...' node id şeması kullanıyor;
            // hardcoded 'n1' kullanılırsa 'a1' şemalı akışlar (örn. onboarding
            // hatırlatma) ilk adımda node bulunamayıp anında 'completed' oluyordu.
            $triggerNodeId = 'n1';
            $nodesArr = json_decode((string)$row['nodes_json'], true);
            if (is_array($nodesArr) && $nodesArr) {
                $foundTrigger = null;
                foreach ($nodesArr as $nd) {
                    if (($nd['type'] ?? '') === 'trigger' && !empty($nd['id'])) {
                        $foundTrigger = (string)$nd['id'];
                        break;
                    }
                }
                $triggerNodeId = $foundTrigger ?? (string)($nodesArr[0]['id'] ?? 'n1');
            }

            // INSERT execution — current node = gerçek trigger node, next_run_at = NOW()
            $ins = $this->db->prepare(
                "INSERT INTO automation_executions
                 (automation_id, contact_email, contact_user_id, trigger_event, contact_data_json, status, current_node_id, next_run_at)
                 VALUES (?, ?, ?, ?, ?, 'running', ?, NOW())"
            );
            $ins->execute([
                $automationId,
                $email,
                isset($contact['user_id']) ? (int)$contact['user_id'] : null,
                $event,
                json_encode($contact, JSON_UNESCAPED_UNICODE),
                $triggerNodeId,
            ]);
            $execId = (int)$this->db->lastInsertId();

            // Synchronous bir kez ilerlet — delay-0 mail anında gitsin, wait varsa cron alır
            try {
                $this->advanceExecution($execId);
            } catch (Throwable $e) {
                error_log('[automation] trigger advance fail exec=' . $execId . ': ' . $e->getMessage());
            }
            $triggered++;
        }

        // Stop condition: ilgili event geldiğinde başka akışları cancel
        $cancelled = $this->cancelByCondition($event, $email);

        return [
            'triggered' => $triggered,
            'skipped_duplicate' => $skippedDup,
            'cancelled_by_stop' => $cancelled,
        ];
    }

    // ──────────────────────────────────────────────
    // Public: tick (cron)
    // ──────────────────────────────────────────────

    /**
     * Cron worker — bekleyen execution step'lerini ilerlet.
     * @param int $batch Bir tick'te işlenecek max execution
     * @return array
     */
    public function tick(int $batch = 50): array
    {
        // Concurrency lock: aynı anda iki tick çakışmasın
        $lock = $this->db->query("SELECT GET_LOCK('automation_tick', 0) AS got")->fetch();
        if (empty($lock['got'])) {
            return ['skipped' => true, 'reason' => 'lock_busy'];
        }

        $advanced = 0;
        $errors = 0;

        try {
            $batch = max(1, min(500, $batch));
            $this->db->beginTransaction();

            // Pessimistic claim — SKIP LOCKED ile concurrent tick'lerden korun
            $stmt = $this->db->prepare(
                "SELECT id FROM automation_executions
                 WHERE status='running' AND next_run_at IS NOT NULL AND next_run_at <= NOW()
                 ORDER BY next_run_at ASC
                 LIMIT $batch FOR UPDATE SKIP LOCKED"
            );
            $stmt->execute();
            $ids = array_column($stmt->fetchAll(), 'id');

            if (!$ids) {
                $this->db->commit();
                $this->db->query("SELECT RELEASE_LOCK('automation_tick')");
                return ['advanced' => 0, 'errors' => 0];
            }

            // Hemen claim et — başka tick almasın
            $placeholders = implode(',', array_fill(0, count($ids), '?'));
            $claim = $this->db->prepare(
                "UPDATE automation_executions SET next_run_at = NULL WHERE id IN ($placeholders)"
            );
            $claim->execute($ids);
            $this->db->commit();

            // Lock dışında advanceExecution çağır
            foreach ($ids as $execId) {
                try {
                    $this->advanceExecution((int)$execId);
                    $advanced++;
                } catch (Throwable $e) {
                    $errors++;
                    error_log('[automation] tick advance fail exec=' . $execId . ': ' . $e->getMessage());
                    // Hata sonrası 5 dk sonra tekrar dene
                    $this->db->prepare(
                        "UPDATE automation_executions
                         SET attempts = attempts + 1, last_error = ?, next_run_at = NOW() + INTERVAL 5 MINUTE
                         WHERE id = ? AND status = 'running'"
                    )->execute([substr($e->getMessage(), 0, 800), (int)$execId]);
                }
            }
        } catch (Throwable $e) {
            if ($this->db->inTransaction()) $this->db->rollBack();
            error_log('[automation] tick error: ' . $e->getMessage());
            $errors++;
        } finally {
            $this->db->query("SELECT RELEASE_LOCK('automation_tick')");
        }

        return ['advanced' => $advanced, 'errors' => $errors];
    }

    // ──────────────────────────────────────────────
    // Public: cancelByCondition (stop event)
    // ──────────────────────────────────────────────

    /**
     * Stop condition: gelen event başka bir akışın durdurma kuralına denk geliyorsa cancel et.
     * Örn: purchase_completed → checkout_abandoned akışlarını cancel eder.
     * stop_condition formatı: "purchase_completed=TRUE OR unsubscribed=TRUE"
     */
    public function cancelByCondition(string $event, string $email): int
    {
        $email = strtolower(trim($email));
        if ($email === '') return 0;

        // Bu email için running execution'ların stop_condition'unu kontrol et
        $stmt = $this->db->prepare(
            "SELECT e.id AS exec_id, a.stop_condition
             FROM automation_executions e
             JOIN automations a ON a.id = e.automation_id
             WHERE e.contact_email = ? AND e.status = 'running'
             AND a.stop_condition IS NOT NULL"
        );
        $stmt->execute([$email]);
        $rows = $stmt->fetchAll();

        $cancelled = 0;
        foreach ($rows as $r) {
            $cond = strtolower((string)$r['stop_condition']);
            // Basit pattern match: "event_name=TRUE" geçiyor mu?
            $needle = strtolower($event) . '=true';
            if (strpos($cond, $needle) !== false) {
                $this->db->prepare(
                    "UPDATE automation_executions
                     SET status='cancelled', completed_at=NOW(), last_error = CONCAT('stop:', ?)
                     WHERE id = ? AND status='running'"
                )->execute([$event, (int)$r['exec_id']]);
                $cancelled++;
                $this->logExecution((int)$r['exec_id'], '*', 'system', 'ok', "cancelled by stop condition: $event");
            }
        }
        return $cancelled;
    }

    public function cancel(int $execId, string $reason = ''): void
    {
        $this->db->prepare(
            "UPDATE automation_executions
             SET status='cancelled', completed_at=NOW(), last_error = ?
             WHERE id=? AND status='running'"
        )->execute([substr($reason, 0, 800), $execId]);
        $this->logExecution($execId, '*', 'system', 'ok', "manual cancel: $reason");
    }

    // ──────────────────────────────────────────────
    // Internal: advanceExecution
    // ──────────────────────────────────────────────

    private function advanceExecution(int $execId): void
    {
        $stmt = $this->db->prepare(
            "SELECT e.*, a.nodes_json, a.edges_json
             FROM automation_executions e
             JOIN automations a ON a.id = e.automation_id
             WHERE e.id = ? LIMIT 1"
        );
        $stmt->execute([$execId]);
        $exec = $stmt->fetch();
        if (!$exec || $exec['status'] !== 'running') return;

        $nodes = $this->indexNodes((string)$exec['nodes_json']);
        $edges = json_decode((string)$exec['edges_json'], true) ?: [];
        $contact = json_decode((string)$exec['contact_data_json'], true) ?: [];
        $current = (string)$exec['current_node_id'];

        // 50 hop guard
        for ($i = 0; $i < 50; $i++) {
            $nextId = $this->findNextNodeId($edges, $current);
            if ($nextId === null) {
                $this->markCompleted($execId);
                return;
            }

            $node = $nodes[$nextId] ?? null;
            if (!$node) {
                $this->logExecution($execId, $nextId, 'unknown', 'error', 'node not found in nodes_json');
                $this->markFailed($execId, "node $nextId not found");
                return;
            }

            $type = (string)($node['type'] ?? '');
            $cfg = is_array($node['config'] ?? null) ? $node['config'] : [];

            switch ($type) {
                case 'wait':
                    $seconds = $this->delaySeconds($cfg);
                    $this->db->prepare(
                        "UPDATE automation_executions
                         SET current_node_id = ?, next_run_at = NOW() + INTERVAL ? SECOND, attempts = 0, last_error = NULL
                         WHERE id = ?"
                    )->execute([$nextId, max(1, $seconds), $execId]);
                    $this->logExecution($execId, $nextId, 'wait', 'ok', "scheduled +{$seconds}s");
                    return; // Cron geri alır

                case 'email':
                    $sendResult = $this->sendEmailNode($cfg, $contact);
                    if ($sendResult['ok']) {
                        $this->db->prepare(
                            "UPDATE automation_executions
                             SET current_node_id = ?, attempts = 0, last_error = NULL
                             WHERE id = ?"
                        )->execute([$nextId, $execId]);
                        $this->logExecution($execId, $nextId, 'email', 'ok', $sendResult['msg'] ?? 'sent');
                        $current = $nextId;
                        continue 2; // Loop devam
                    }
                    // Hata — backoff
                    $attempts = (int)$exec['attempts'] + 1;
                    if ($attempts >= 5) {
                        $this->markFailed($execId, 'email send failed 5x: ' . ($sendResult['msg'] ?? ''));
                        $this->logExecution($execId, $nextId, 'email', 'error', 'failed after 5 attempts');
                        return;
                    }
                    $backoff = [5, 15, 60, 240, 720][min($attempts, 4)] * 60; // dakika→saniye
                    $this->db->prepare(
                        "UPDATE automation_executions
                         SET attempts = ?, last_error = ?, next_run_at = NOW() + INTERVAL ? SECOND
                         WHERE id = ?"
                    )->execute([$attempts, substr((string)($sendResult['msg'] ?? ''), 0, 800), $backoff, $execId]);
                    $this->logExecution($execId, $nextId, 'email', 'error', 'attempt ' . $attempts . ': ' . ($sendResult['msg'] ?? ''));
                    return;

                case 'condition':
                    $branch = $this->evaluateCondition($cfg, $contact) ? 'true' : 'false';
                    $branchNext = $this->findNextNodeId($edges, $current, $branch);
                    if ($branchNext === null) {
                        $this->markCompleted($execId);
                        return;
                    }
                    $this->logExecution($execId, $nextId, 'condition', 'ok', "branch=$branch");
                    // condition node'unu sonra tekrar geçmemek için current'i nextId yap
                    $this->db->prepare("UPDATE automation_executions SET current_node_id = ? WHERE id = ?")
                        ->execute([$nextId, $execId]);
                    $current = $nextId;
                    // Sonraki iteration findNextNodeId(edges, $current, ...) devam etsin
                    continue 2;

                case 'end':
                    $this->markCompleted($execId);
                    $this->logExecution($execId, $nextId, 'end', 'ok', 'flow ended');
                    return;

                case 'update_status':
                case 'add_tag':
                case 'webhook':
                    // Phase 2 — şimdilik passthrough
                    $this->logExecution($execId, $nextId, $type, 'skipped', 'not implemented');
                    $this->db->prepare("UPDATE automation_executions SET current_node_id = ? WHERE id = ?")
                        ->execute([$nextId, $execId]);
                    $current = $nextId;
                    continue 2;

                default:
                    $this->logExecution($execId, $nextId, $type, 'skipped', 'unknown node type');
                    $this->db->prepare("UPDATE automation_executions SET current_node_id = ? WHERE id = ?")
                        ->execute([$nextId, $execId]);
                    $current = $nextId;
                    continue 2;
            }
        }

        // 50 hop sınırı aşıldı
        $this->logExecution($execId, $current, 'guard', 'error', 'hop limit exceeded (50)');
        $this->markFailed($execId, 'hop limit (50) exceeded — possible cycle in edges_json');
    }

    // ──────────────────────────────────────────────
    // Internal helpers
    // ──────────────────────────────────────────────

    private function indexNodes(string $nodesJson): array
    {
        $list = json_decode($nodesJson, true) ?: [];
        $out = [];
        foreach ($list as $n) {
            if (isset($n['id'])) $out[(string)$n['id']] = $n;
        }
        return $out;
    }

    /**
     * Mevcut node'dan sonraki node id'sini bulur.
     * $branch verilirse sourceHandle/label eşleşmesi gözetilir (condition için).
     */
    private function findNextNodeId(array $edges, string $current, ?string $branch = null): ?string
    {
        foreach ($edges as $e) {
            if ((string)($e['source'] ?? '') !== $current) continue;
            if ($branch !== null) {
                $handle = strtolower((string)($e['sourceHandle'] ?? $e['label'] ?? ''));
                if ($handle !== '' && $handle !== $branch) continue;
            }
            return (string)($e['target'] ?? '') ?: null;
        }
        return null;
    }

    private function delaySeconds(array $cfg): int
    {
        $type = (string)($cfg['delay_type'] ?? 'minutes');
        $val = (int)($cfg['delay_value'] ?? 0);
        if ($val <= 0) return 1;
        switch ($type) {
            case 'weeks':   return $val * 604800;
            case 'days':    return $val * 86400;
            case 'hours':   return $val * 3600;
            case 'minutes':
            default:        return $val * 60;
        }
    }

    private function evaluateCondition(array $cfg, array $contact): bool
    {
        // Basit alan/operator tabanlı condition.
        // cfg = ['field'=>'order_status', 'operator'=>'equals', 'value'=>'completed']
        $field = (string)($cfg['field'] ?? '');
        $op = (string)($cfg['operator'] ?? 'equals');
        $expected = $cfg['value'] ?? null;
        $actual = $contact[$field] ?? null;

        switch ($op) {
            case 'equals':       return (string)$actual === (string)$expected;
            case 'not_equals':   return (string)$actual !== (string)$expected;
            case 'contains':     return is_string($actual) && strpos($actual, (string)$expected) !== false;
            case 'is_empty':     return $actual === null || $actual === '';
            case 'is_not_empty': return $actual !== null && $actual !== '';
            case 'gt':           return (float)$actual > (float)$expected;
            case 'lt':           return (float)$actual < (float)$expected;
            default:             return false;
        }
    }

    /**
     * Email node'unu işler — template fetch + placeholder substitution + Brevo gönderim.
     * @return array ['ok'=>bool, 'msg'=>string]
     */
    private function sendEmailNode(array $cfg, array $contact): array
    {
        $mode = (string)($cfg['mode'] ?? 'template');
        $to = (string)($contact['email'] ?? '');
        if ($to === '') return ['ok' => false, 'msg' => 'contact email empty'];

        // Abonelikten çıkmış/bounced/complained kişiye mail ATMA. Akış tetiklendiğinde
        // (örn. purchase_completed) kişi henüz subscribed olabilir ama akış günler
        // sürdüğü için bu node işlenene kadar unsubscribe etmiş olabilir — o yüzden
        // her gönderimde crm_contacts'tan TAZE status okunur (trigger anındaki
        // $contact verisine güvenilmez). CRM kampanyalarındaki (crmResolveCampaignAudience)
        // aynı 'subscribed' kontrolüyle tutarlı. 'ok'=>true dönülür ki akış hata sanıp
        // retry döngüsüne girmesin, sadece bu adımı atlasın.
        try {
            $statusStmt = $this->db->prepare("SELECT status FROM crm_contacts WHERE email = ? LIMIT 1");
            $statusStmt->execute([strtolower(trim($to))]);
            $contactStatus = (string)($statusStmt->fetchColumn() ?: '');
            if (in_array($contactStatus, ['unsubscribed', 'bounced', 'complained'], true)) {
                return ['ok' => true, 'msg' => "skipped — contact status: $contactStatus"];
            }
        } catch (Throwable $e) {
            error_log('[automation] unsubscribe check failed: ' . $e->getMessage());
        }

        $subject = (string)($cfg['subject'] ?? '');
        $sender = trim((string)($cfg['sender_email'] ?? ''));
        $bodyHtml = '';

        if ($mode === 'template') {
            $tplId = (int)($cfg['template_id'] ?? 0);
            if ($tplId <= 0) return ['ok' => false, 'msg' => 'template_id missing'];
            $tplStmt = $this->db->prepare(
                "SELECT subject, body_html, sender_email FROM automation_email_templates WHERE id = ? LIMIT 1"
            );
            $tplStmt->execute([$tplId]);
            $tpl = $tplStmt->fetch();
            if (!$tpl) return ['ok' => false, 'msg' => "template id $tplId not found"];
            if ($subject === '') $subject = (string)$tpl['subject'];
            if ($sender === '') $sender = (string)($tpl['sender_email'] ?? '');
            $bodyHtml = (string)$tpl['body_html'];
        } else {
            // Inline mode
            $bodyHtml = (string)($cfg['body_html'] ?? '');
        }

        if ($bodyHtml === '') return ['ok' => false, 'msg' => 'body_html empty'];

        // Placeholder substitution
        $vars = $this->buildPlaceholderVars($contact);
        $renderedSubject = $this->renderPlaceholders($subject, $vars, false);
        $renderedHtml = $this->renderPlaceholders($bodyHtml, $vars, true);

        // Gmail clipping önle: her mail'e benzersiz görünmez marker ekle. Aksi halde
        // benzer içerikli hatırlatma mailleri (Formu Doldur, Devam Et) "..." ile kırpılıyor,
        // CTA görünmez kalıyor. Body sonu </body> öncesine inject edilir.
        $marker = '<div style="font-size:0;color:transparent;line-height:0;opacity:0;mso-hide:all" aria-hidden="true">'
            . htmlspecialchars($execContextId = uniqid('m', true), ENT_QUOTES, 'UTF-8')
            . '</div>';
        if (stripos($renderedHtml, '</body>') !== false) {
            $renderedHtml = preg_replace('/<\/body>/i', $marker . '</body>', $renderedHtml, 1);
        } else {
            $renderedHtml .= $marker;
        }

        try {
            // sendTransactionalEmail başarıda:
            //   - Brevo: array döner (örn ['messageId' => '<...>'])
            //   - SMTP: void/null döner (throw etmezse başarılı sayılır)
            // Hata durumunda: Exception fırlatır.
            // Sadece açıkça false dönerse hata kabul et.
            $ok = sendTransactionalEmail($this->db, $to, $renderedSubject, $renderedHtml, $sender ?: null);
            if ($ok === false) {
                return ['ok' => false, 'msg' => 'sendTransactionalEmail returned false'];
            }
            $msgId = (is_array($ok) && isset($ok['messageId'])) ? (' [' . $ok['messageId'] . ']') : '';
            return ['ok' => true, 'msg' => "sent to $to" . $msgId];
        } catch (Throwable $e) {
            return ['ok' => false, 'msg' => 'send error: ' . $e->getMessage()];
        }
    }

    private function buildPlaceholderVars(array $contact): array
    {
        $email = (string)($contact['email'] ?? '');
        $orderId = (string)($contact['order_id'] ?? '');
        $cartToken = (string)($contact['cart_token'] ?? '');
        // KIRIK LİNK FIX: eskiden '/email/unsubscribe?t=...' — bu path hiçbir SPA route'una
        // karşılık gelmiyordu (kullanıcı tıklayınca hiçbir şey olmuyordu, sessizce ana
        // sayfaya düşüyordu). Gerçek endpoint api/routes/email-automation.php'deki
        // GET /api/email-automation/unsubscribe?email=&token= — email parametresi de
        // eksikti. Token algoritması (hash_hmac sha256, JWT_SECRET) makeUnsubscribeToken()
        // ile birebir aynı olmalı (email lowercase+trim edilmiş halde).
        $unsub = $this->frontendBase . '/api/email-automation/unsubscribe?email=' . urlencode($email)
            . '&token=' . hash_hmac('sha256', strtolower(trim($email)), defined('JWT_SECRET') ? JWT_SECRET : 'khilonfast');
        $formLink = $orderId !== ''
            ? $this->frontendBase . '/onboarding-formu?order_id=' . urlencode($orderId)
            : $this->frontendBase . '/onboarding-formu';
        $courseLink = $this->frontendBase . '/hesabim/egitimlerim';
        $profileLink = $this->frontendBase . '/hesabim';
        return array_merge([
            'first_name' => (string)($contact['first_name'] ?? ''),
            'last_name'  => (string)($contact['last_name'] ?? ''),
            'email'      => $email,
            'order_number' => $orderId,
            'order_id'   => $orderId,
            'cart_link'  => $cartToken !== ''
                ? $this->frontendBase . '/sepet?resume=' . urlencode($cartToken)
                : $this->frontendBase . '/sepet',
            'form_link'  => $formLink,
            'onboarding_link' => $formLink,
            'course_link' => $courseLink,
            'profile_link' => $profileLink,
            'account_link' => $profileLink,
            'unsubscribe_link' => $unsub,
            'course_title' => (string)($contact['course_title'] ?? ''),
            'product_name' => (string)($contact['product_name'] ?? ''),
            'frontend_url' => $this->frontendBase,
        ], is_array($contact['extra'] ?? null) ? $contact['extra'] : []);
    }

    private function renderPlaceholders(string $tpl, array $vars, bool $escapeHtml): string
    {
        return preg_replace_callback('/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/', function ($m) use ($vars, $escapeHtml) {
            $key = $m[1];
            $val = (string)($vars[$key] ?? '');
            return $escapeHtml ? htmlspecialchars($val, ENT_QUOTES, 'UTF-8') : $val;
        }, $tpl) ?? $tpl;
    }

    private function markCompleted(int $execId): void
    {
        $this->db->prepare(
            "UPDATE automation_executions
             SET status='completed', completed_at=NOW(), next_run_at=NULL, last_error=NULL
             WHERE id=? AND status='running'"
        )->execute([$execId]);
    }

    private function markFailed(int $execId, string $reason): void
    {
        $this->db->prepare(
            "UPDATE automation_executions
             SET status='failed', completed_at=NOW(), next_run_at=NULL, last_error=?
             WHERE id=? AND status='running'"
        )->execute([substr($reason, 0, 800), $execId]);
    }

    private function logExecution(int $execId, string $nodeId, string $nodeType, string $status, string $message): void
    {
        try {
            $this->db->prepare(
                "INSERT INTO automation_execution_logs
                 (execution_id, node_id, node_type, status, message)
                 VALUES (?, ?, ?, ?, ?)"
            )->execute([$execId, $nodeId, $nodeType, $status, substr($message, 0, 800)]);
        } catch (Throwable $e) {
            // Log fail kritik değil
            error_log('[automation] log fail: ' . $e->getMessage());
        }
    }
}
