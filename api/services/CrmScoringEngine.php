<?php
// api/services/CrmScoringEngine.php
// Lead Scoring motoru — event_type → puan delta hesabı + history kayıt.

if (!function_exists('crmGetActiveScoreRules')) {
function crmGetActiveScoreRules(PDO $db): array
{
    static $cache = null;
    if ($cache !== null) return $cache;
    $rows = $db->query("SELECT * FROM crm_score_rules WHERE is_active = 1")->fetchAll();
    $map = [];
    foreach ($rows as $r) {
        $map[$r['event_type']] = [
            'id' => (int)$r['id'],
            'rule_key' => $r['rule_key'],
            'label' => $r['label'],
            'points' => (int)$r['points'],
            'decay_days' => (int)$r['decay_days'],
        ];
    }
    $cache = $map;
    return $map;
}
}

if (!function_exists('crmApplyScore')) {
/**
 * Bir event'i contact'a uygula — kuralı varsa skor güncellenir + history yazılır.
 * @param int    $contactId
 * @param string $eventType
 * @param array  $opts ['ref_type','ref_id','reason']
 * @return int|null delta puan (uygulanmadıysa null)
 */
function crmApplyScore(PDO $db, int $contactId, string $eventType, array $opts = []): ?int
{
    if ($contactId <= 0 || $eventType === '') return null;
    $rules = crmGetActiveScoreRules($db);
    if (!isset($rules[$eventType])) return null;

    $rule = $rules[$eventType];
    $delta = (int)$rule['points'];
    if ($delta === 0) return 0;

    // Atomic update + read-back
    $oldStmt = $db->prepare("SELECT score FROM crm_contacts WHERE id = ?");
    $oldStmt->execute([$contactId]);
    $oldScore = (int)($oldStmt->fetchColumn() ?: 0);
    $db->prepare("UPDATE crm_contacts SET score = score + ? WHERE id = ?")
       ->execute([$delta, $contactId]);
    $scoreAfter = $oldScore + $delta;

    // History
    try {
        $db->prepare("INSERT INTO crm_score_history
            (contact_id, rule_id, rule_key, delta, score_after, reason, ref_type, ref_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
           ->execute([
               $contactId,
               $rule['id'],
               $rule['rule_key'],
               $delta,
               $scoreAfter,
               $opts['reason'] ?? $rule['label'],
               $opts['ref_type'] ?? null,
               isset($opts['ref_id']) ? (int)$opts['ref_id'] : null,
           ]);
    } catch (Throwable $e) { error_log('[crm-score] history: ' . $e->getMessage()); }

    // Faz 8: score_threshold_crossed automation trigger
    try {
        if (function_exists('crmCheckScoreThreshold') && isset($oldScore)) {
            crmCheckScoreThreshold($db, $contactId, $oldScore, $scoreAfter);
        }
    } catch (Throwable $e) {}

    return $delta;
}
}

if (!function_exists('crmRecomputeScoreFromHistory')) {
/**
 * Bir kişinin skorunu sıfırlayıp history'den yeniden hesaplar.
 * Kural değişimleri sonrası eski kayıtları geriye dönük uygular.
 */
function crmRecomputeScoreFromHistory(PDO $db, int $contactId): int
{
    $stmt = $db->prepare("SELECT COALESCE(SUM(delta), 0) FROM crm_score_history WHERE contact_id = ?");
    $stmt->execute([$contactId]);
    $total = (int)$stmt->fetchColumn();
    $db->prepare("UPDATE crm_contacts SET score = ? WHERE id = ?")->execute([$total, $contactId]);
    return $total;
}
}
