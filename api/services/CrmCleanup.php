<?php
/**
 * api/services/CrmCleanup.php
 *
 * CRM log/geçmiş tablolarının GÜVENLİ bakımı (budama).
 * SADECE append-only log/analitik tabloları temizlenir:
 *   - crm_email_tracking (e-posta açılma/tıklanma olayları)
 *   - crm_activity_log   (kişi aktivite logu)
 *   - crm_score_history  (lead skoru değişim geçmişi)
 * crm_contacts / crm_list_contacts (gerçek kişi listesi) ASLA budanmaz.
 *
 * Operasyonel veriye (sipariş/ödeme/abonelik/ürün) dokunmaz — sistemi bozmaz.
 */

/** Budanacak tablolar + tarih kolonu. Liste BİLEREK sabit (yanlışlıkla contacts eklenemez). */
function crmCleanupTables(): array
{
    return [
        ['table' => 'crm_email_tracking', 'date_col' => 'occurred_at'],
        ['table' => 'crm_activity_log',   'date_col' => 'occurred_at'],
        ['table' => 'crm_score_history',  'date_col' => 'created_at'],
    ];
}

/** Ayar key'lerini garanti et (settings POST sadece UPDATE yapar → önceden var olmalı). */
function crmCleanupEnsureSettings(PDO $db): void
{
    try {
        $db->exec(
            "INSERT INTO settings (setting_key, setting_value, setting_group, description) VALUES
             ('crm_cleanup_enabled', '0', 'maintenance', 'CRM log otomatik temizlik aç/kapa'),
             ('crm_cleanup_retention_days', '90', 'maintenance', 'CRM log saklama süresi (gün)'),
             ('crm_cleanup_last_run', '', 'maintenance', 'Son CRM temizlik zamanı'),
             ('crm_hourly_send_limit', '2000', 'maintenance', 'CRM kampanya saatlik gönderim limiti (0=limitsiz)'),
             ('crm_cron_batch_size', '50', 'maintenance', 'CRM kampanya dakikalık gönderim adedi (cron batch)')
             ON DUPLICATE KEY UPDATE setting_key = setting_key"
        );
    } catch (Throwable $e) { /* settings tablosu yoksa sessiz geç */ }
}

/** Saklama gününü güvenli aralığa sıkıştır (kazara her şeyi silmeyi engelle). */
function crmCleanupSafeDays($raw): int
{
    $d = (int) $raw;
    if ($d < 7) $d = 7;          // EN AZ 7 gün sakla (güvenlik tabanı)
    if ($d > 3650) $d = 3650;
    return $d;
}

/** Önizleme: kaç eski kayıt budanabilir + tablo/DB boyutları. Hiçbir şey silmez. */
function crmCleanupPreview(PDO $db, int $retentionDays): array
{
    $retentionDays = crmCleanupSafeDays($retentionDays);
    $out = ['retention_days' => $retentionDays, 'tables' => [], 'total_old' => 0, 'db_size_mb' => 0.0];

    // MySQL 8 boyut istatistiğini 24 saat cache'ler → OPTIMIZE sonrası MB geç güncellenir.
    // Bu oturumda CANLI okuma için cache'i kapat (boyutlar anlık doğru gelsin).
    try { $db->exec("SET SESSION information_schema_stats_expiry = 0"); } catch (Throwable $e) {}

    foreach (crmCleanupTables() as $t) {
        $old = 0; $mb = 0.0;
        try {
            // $retentionDays int (crmCleanupSafeDays) — inline güvenli.
            $st = $db->query("SELECT COUNT(*) FROM `{$t['table']}` WHERE `{$t['date_col']}` < (NOW() - INTERVAL {$retentionDays} DAY)");
            $old = (int) $st->fetchColumn();
        } catch (Throwable $e) { $old = 0; }
        try {
            $sz = $db->prepare("SELECT ROUND((DATA_LENGTH+INDEX_LENGTH)/1024/1024,1) FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=?");
            $sz->execute([$t['table']]);
            $mb = (float) $sz->fetchColumn();
        } catch (Throwable $e) { $mb = 0.0; }
        $out['tables'][] = ['table' => $t['table'], 'old_rows' => $old, 'size_mb' => $mb];
        $out['total_old'] += $old;
    }
    try {
        $out['db_size_mb'] = (float) $db->query("SELECT ROUND(SUM(DATA_LENGTH+INDEX_LENGTH)/1024/1024,1) FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE()")->fetchColumn();
    } catch (Throwable $e) {}
    return $out;
}

/**
 * BOT TIKLAMA TEMİZLİĞİ (scrub) — son $days günde başlayan kampanyaların
 * clicked_at damgalarını tracking'ten İNSAN tıklamalarıyla yeniden kurar.
 * Bot tanımı (3 kural):
 *   R1) bot user-agent (python-requests/curl/scanner...)
 *   R2) aynı kişi aynı mailde ≤30 sn içinde 3+ FARKLI link (hız patlaması)
 *   R3) teslimattan ≤120 sn sonra 2+ FARKLI link tıklanmış mail (teslimat-anı tarayıcısı)
 * opened_at'a DOKUNMAZ (open zaten sektörde yaklaşık metrik; sadece tıklama netleştirilir).
 * Webhook anlık olarak sadece R1'i uygulayabilir; R2/R3 geçmişe bakmayı gerektirir —
 * bu yüzden günlük cron'da çağrılır (kampanya raporu ertesi gün kesinleşir).
 */
function crmScrubBotClicks(PDO $db, int $days = 9): array
{
    $days = max(1, min(30, $days));
    $reset = 0; $set = 0;
    try {
        // 1) Kapsamdaki kampanyaların tıklama damgalarını sıfırla
        $st = $db->prepare(
            "UPDATE crm_campaign_recipients r
             JOIN crm_campaigns c ON c.id = r.campaign_id
             SET r.clicked_at = NULL
             WHERE c.started_at >= NOW() - INTERVAL {$days} DAY AND r.clicked_at IS NOT NULL"
        );
        $st->execute();
        $reset = $st->rowCount();

        // 2) İNSAN tıklamalarından yeniden kur (ilk insan tıklaması)
        $st = $db->prepare(
            "UPDATE crm_campaign_recipients r
             JOIN crm_campaigns c ON c.id = r.campaign_id AND c.started_at >= NOW() - INTERVAL {$days} DAY
             JOIN (
                 SELECT REPLACE(REPLACE(t.message_id,'<',''),'>','') AS mid, MIN(t.occurred_at) AS t
                 FROM crm_email_tracking t
                 LEFT JOIN (
                     SELECT email, message_id FROM crm_email_tracking
                     WHERE event = 'clicked'
                     GROUP BY email, message_id
                     HAVING COUNT(DISTINCT link_url) >= 3
                        AND TIMESTAMPDIFF(SECOND, MIN(occurred_at), MAX(occurred_at)) <= 30
                 ) bot ON bot.email = t.email AND bot.message_id = t.message_id
                 LEFT JOIN (
                     SELECT email, message_id, MIN(occurred_at) AS delivered_at
                     FROM crm_email_tracking WHERE event = 'delivered'
                     GROUP BY email, message_id
                 ) d ON d.email = t.email AND d.message_id = t.message_id
                 LEFT JOIN (
                     SELECT email, message_id, COUNT(DISTINCT link_url) AS nlinks, MIN(occurred_at) AS first_click
                     FROM crm_email_tracking WHERE event = 'clicked'
                     GROUP BY email, message_id
                 ) g ON g.email = t.email AND g.message_id = t.message_id
                 WHERE t.event = 'clicked' AND t.message_id IS NOT NULL AND t.message_id <> ''
                   AND bot.email IS NULL
                   AND (t.user_agent IS NULL OR t.user_agent NOT REGEXP 'python|curl|wget|bot|crawler|spider|scan|headless|phantom|monitor')
                   AND NOT (g.nlinks >= 2 AND d.delivered_at IS NOT NULL
                            AND TIMESTAMPDIFF(SECOND, d.delivered_at, g.first_click) <= 120)
                 GROUP BY mid
             ) k ON k.mid = REPLACE(REPLACE(r.message_id,'<',''),'>','')
             SET r.clicked_at = k.t, r.opened_at = COALESCE(r.opened_at, k.t)"
        );
        $st->execute();
        $set = $st->rowCount();
    } catch (Throwable $e) {
        return ['error' => $e->getMessage(), 'reset' => $reset, 'set' => $set];
    }
    return ['reset' => $reset, 'human_clicks' => $set];
}

/** Log tablolarında OPTIMIZE çalıştır — silinen satırların diski geri verilsin.
 *  OPTIMIZE TABLE sonuç kümesi döner → fetchAll+closeCursor ile tüketilmeli,
 *  yoksa sonraki sorgular "unbuffered query" hatası verir. */
function crmCleanupOptimize(PDO $db): void
{
    foreach (crmCleanupTables() as $t) {
        try {
            $opt = $db->query("OPTIMIZE TABLE `{$t['table']}`");
            if ($opt) { $opt->fetchAll(); $opt->closeCursor(); }
        } catch (Throwable $e) { /* OPTIMIZE başarısız → veri zaten silindi, kritik değil */ }
    }
}

/** Temizliği çalıştır: eski log kayıtlarını sil. $optimize=true ise diski geri kazan (OPTIMIZE). */
function crmCleanupRun(PDO $db, int $retentionDays, bool $optimize = false): array
{
    $retentionDays = crmCleanupSafeDays($retentionDays);
    $deleted = [];
    foreach (crmCleanupTables() as $t) {
        try {
            // PDO::exec() DELETE'te etkilenen satır sayısını döner (sonuç kümesi yok → unbuffered sorunu olmaz).
            $n = $db->exec("DELETE FROM `{$t['table']}` WHERE `{$t['date_col']}` < (NOW() - INTERVAL {$retentionDays} DAY)");
            $deleted[$t['table']] = (int) $n;
        } catch (Throwable $e) {
            $deleted[$t['table']] = 'hata: ' . $e->getMessage();
        }
    }
    // OPTIMIZE'ı TÜM silmelerden SONRA yap.
    if ($optimize) {
        crmCleanupOptimize($db);
    }
    crmCleanupEnsureSettings($db);
    try {
        $db->prepare("UPDATE settings SET setting_value = ? WHERE setting_key = 'crm_cleanup_last_run'")
           ->execute([date('Y-m-d H:i:s')]);
    } catch (Throwable $e) {}

    return [
        'deleted'        => $deleted,
        'retention_days' => $retentionDays,
        'optimized'      => $optimize,
        'ran_at'         => date('Y-m-d H:i:s'),
    ];
}
