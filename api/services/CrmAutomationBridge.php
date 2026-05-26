<?php
// api/services/CrmAutomationBridge.php
// CRM event'leri (tag/list/score/form) AutomationEngine'in trigger()'ına bağlar.
// Yeni event types: tag_added, tag_removed, list_joined, score_threshold_crossed,
// form_submitted, web_page_visited.

if (!function_exists('crmFireAutomation')) {
/**
 * Bir CRM event'inden automation'ı tetikle. Best-effort — hata olursa sessizce loglar.
 * @param PDO $db
 * @param string $event   örn 'tag_added', 'list_joined'
 * @param int    $contactId
 * @param array  $extra   ek context (tag_slug, list_id, score, vb.)
 */
function crmFireAutomation(PDO $db, string $event, int $contactId, array $extra = []): void
{
    if (!$contactId || !$event) return;

    // Contact bilgilerini topla
    try {
        $stmt = $db->prepare("SELECT email, first_name, last_name, phone, user_id, score
                              FROM crm_contacts WHERE id = ? LIMIT 1");
        $stmt->execute([$contactId]);
        $c = $stmt->fetch();
        if (!$c) return;
    } catch (Throwable $e) {
        error_log('[crm-automation] contact lookup: ' . $e->getMessage());
        return;
    }

    $contactPayload = [
        'email' => $c['email'],
        'first_name' => $c['first_name'] ?? '',
        'last_name' => $c['last_name'] ?? '',
        'phone' => $c['phone'] ?? '',
        'user_id' => $c['user_id'] !== null ? (int)$c['user_id'] : null,
        'crm_contact_id' => $contactId,
        'score' => (int)$c['score'],
    ];
    foreach ($extra as $k => $v) $contactPayload[$k] = $v;

    // AutomationEngine load et
    try {
        require_once __DIR__ . '/AutomationEngine.php';
        $engine = new AutomationEngine($db);
        $engine->trigger($event, $contactPayload);
    } catch (Throwable $e) {
        error_log('[crm-automation] fire ' . $event . ': ' . $e->getMessage());
    }
}
}

if (!function_exists('crmCheckScoreThreshold')) {
/**
 * Skor değişimi sonrası eşik geçildi mi kontrol et.
 * Eski skor < threshold && yeni skor >= threshold → fire 'score_threshold_crossed'.
 */
function crmCheckScoreThreshold(PDO $db, int $contactId, int $oldScore, int $newScore): void
{
    if ($oldScore === $newScore) return;
    // Aktif automation'lar arasında threshold içeren olanları bul
    try {
        $stmt = $db->query("SELECT id, nodes_json FROM automations
                            WHERE status = 'active' AND trigger_event_idx = 'score_threshold_crossed'");
        foreach ($stmt as $row) {
            $nodes = json_decode((string)$row['nodes_json'], true) ?: [];
            // Trigger node'undaki threshold değerini bul (ilk node = trigger)
            $trigger = $nodes[0] ?? null;
            if (!$trigger) continue;
            $threshold = (int)($trigger['data']['threshold'] ?? $trigger['data']['score'] ?? 0);
            if ($threshold === 0) continue;
            // Eşik geçildiyse fire
            if ($oldScore < $threshold && $newScore >= $threshold) {
                crmFireAutomation($db, 'score_threshold_crossed', $contactId, [
                    'old_score' => $oldScore,
                    'new_score' => $newScore,
                    'threshold' => $threshold,
                ]);
            }
        }
    } catch (Throwable $e) {
        error_log('[crm-automation] score threshold: ' . $e->getMessage());
    }
}
}
