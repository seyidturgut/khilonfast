<?php
// api/routes/crm-cron.php
// CRM cron: zamanlanmış kampanyaları başlat + sending durumdaki kampanyaların batch'ini gönder.
// cPanel cron örneği (her dakika):
//   * * * * * curl -s -X POST "https://khilonfast.com/api/crm/cron" -H "X-Cron-Key: <key>"

set_exception_handler(function (Throwable $e) {
    header('Content-Type: application/json', true, 500);
    echo json_encode(['error' => 'PHP Exception: ' . $e->getMessage()]);
    exit;
});

require_once __DIR__ . '/../utils.php';
require_once __DIR__ . '/../services/CrmSchema.php';
require_once __DIR__ . '/../services/CrmSmartListEngine.php';
require_once __DIR__ . '/../services/CrmActivityRecorder.php';
require_once __DIR__ . '/../services/CrmScoringEngine.php';
require_once __DIR__ . '/../services/CrmCampaignDispatcher.php';

$db = Database::getInstance();

// Schema bootstrap (idempotent)
try { ensureCrmContactsSchema($db); } catch (Throwable $e) { error_log('[crm-cron] schema: ' . $e->getMessage()); }

// Cron key auth — automation_cron_key ile aynı anahtarı paylaşır (admin.php'de seed edilir)
$keyHeader = $_SERVER['HTTP_X_CRON_KEY'] ?? '';
$validKey = '';
try {
    $stmt = $db->prepare("SELECT setting_value FROM settings WHERE setting_key = 'automation_cron_key' LIMIT 1");
    $stmt->execute();
    $validKey = (string)($stmt->fetchColumn() ?: '');
} catch (Throwable $e) {}

if ($validKey === '' || !hash_equals($validKey, $keyHeader)) {
    sendResponse(['error' => 'Unauthorized'], 401);
}

// Dakikalık batch boyutu: ayardan (crm_cron_batch_size, varsayılan 50), ?batch= ile geçersiz kılınabilir.
// Saatlik hız ≈ batch × 60 (cron her dakika). Örn. 100/dk → 6.000/saat → 30K liste ~5 saat.
$settingBatch = 50;
try {
    $db->exec("INSERT INTO settings (setting_key, setting_value, setting_group, description)
               VALUES ('crm_cron_batch_size', '50', 'maintenance', 'CRM kampanya dakikalık gönderim adedi (cron batch)')
               ON DUPLICATE KEY UPDATE setting_key = setting_key");
    $settingBatch = max(1, min(500, (int) getSetting($db, 'crm_cron_batch_size', '50')));
} catch (Throwable $e) {}
$batchSize = isset($_GET['batch']) ? max(1, min(500, (int)$_GET['batch'])) : $settingBatch;

// ÇAKIŞMA KİLİDİ: önceki cron turu hâlâ çalışıyorsa (Brevo yavaş vb.) yenisi BAŞLAMAZ.
// Süreç birikmesi (her dakika üst üste binen istekler) sunucuyu zorlamasın.
try {
    $gotLock = (int)$db->query("SELECT GET_LOCK('khilon_crm_cron', 0)")->fetchColumn();
    if ($gotLock !== 1) {
        sendResponse(['ok' => true, 'skipped' => 'previous run still in progress', 'time' => date('c')]);
    }
} catch (Throwable $e) { /* kilit alınamadıysa bile devam etme riskine girme — ama sorgu hatasında normal akış */ }

// SAATLİK GÖNDERİM LİMİTİ: son 1 saatte gönderilen toplam, limiti aştıysa bu tur gönderim yok.
// Ayar: crm_hourly_send_limit (settings, varsayılan 2000). 0 = limitsiz.
$hourlyLimit = 2000;
try {
    $db->exec("INSERT INTO settings (setting_key, setting_value, setting_group, description)
               VALUES ('crm_hourly_send_limit', '2000', 'maintenance', 'CRM kampanya saatlik gönderim limiti (0=limitsiz)')
               ON DUPLICATE KEY UPDATE setting_key = setting_key");
    $hourlyLimit = (int) getSetting($db, 'crm_hourly_send_limit', '2000');
} catch (Throwable $e) {}
$hourlyAllowance = PHP_INT_MAX;
if ($hourlyLimit > 0) {
    try {
        $sentLastHour = (int)$db->query(
            "SELECT COUNT(*) FROM crm_campaign_recipients WHERE sent_at >= NOW() - INTERVAL 1 HOUR"
        )->fetchColumn();
        $hourlyAllowance = max(0, $hourlyLimit - $sentLastHour);
    } catch (Throwable $e) {}
}

$result = [
    'started_scheduled' => 0,
    'dispatched_batches' => 0,
    'campaigns_completed' => 0,
    'sent' => 0,
    'failed' => 0,
    'hourly_allowance' => ($hourlyLimit > 0 ? $hourlyAllowance : 'unlimited'),
    'time' => date('c'),
];

// 1) Zamanı gelen 'scheduled' kampanyaları başlat → 'sending' yap, audience populate et
try {
    $stmt = $db->prepare("SELECT id FROM crm_campaigns
                          WHERE status = 'scheduled'
                            AND scheduled_at IS NOT NULL
                            AND scheduled_at <= NOW()
                          ORDER BY scheduled_at ASC LIMIT 50");
    $stmt->execute();
    foreach ($stmt as $row) {
        $cid = (int)$row['id'];
        try {
            crmEnqueueCampaign($db, $cid, false);
            $result['started_scheduled']++;
        } catch (Throwable $e) {
            error_log("[crm-cron] enqueue $cid: " . $e->getMessage());
        }
    }
} catch (Throwable $e) {
    error_log('[crm-cron] scheduled lookup: ' . $e->getMessage());
}

// 2) 'sending' durumdaki tüm kampanyaların batch'ini gönder (her birinden $batchSize alıcı)
try {
    $stmt = $db->prepare("SELECT id FROM crm_campaigns WHERE status = 'sending' ORDER BY started_at ASC LIMIT 20");
    $stmt->execute();
    $sendingIds = [];
    foreach ($stmt as $row) $sendingIds[] = (int)$row['id'];

    foreach ($sendingIds as $cid) {
        // Saatlik limit doldu → bu tur başka gönderim yapma (kuyruk bekler, sonraki saatte devam).
        if ($hourlyAllowance <= 0) { $result['hourly_limit_reached'] = true; break; }
        $effBatch = (int) min($batchSize, $hourlyAllowance);
        try {
            $r = crmDispatchCampaignBatch($db, $cid, $effBatch);
            $result['dispatched_batches']++;
            $result['sent'] += (int)($r['sent'] ?? 0);
            $result['failed'] += (int)($r['failed'] ?? 0);
            $hourlyAllowance -= (int)($r['sent'] ?? 0);
            if ((int)($r['remaining'] ?? 0) === 0) {
                $result['campaigns_completed']++;
            }
        } catch (Throwable $e) {
            error_log("[crm-cron] dispatch $cid: " . $e->getMessage());
        }
    }
} catch (Throwable $e) {
    error_log('[crm-cron] sending lookup: ' . $e->getMessage());
}

// 3) CRM log otomatik temizlik (ayar açıksa, günde 1 kez). crm_contacts'a DOKUNMAZ.
try {
    require_once __DIR__ . '/../services/CrmCleanup.php';
    crmCleanupEnsureSettings($db);
    if ((string) getSetting($db, 'crm_cleanup_enabled', '0') === '1') {
        $last = (string) getSetting($db, 'crm_cleanup_last_run', '');
        if ($last === '' || strtotime($last) < strtotime('-24 hours')) {
            $days = crmCleanupSafeDays(getSetting($db, 'crm_cleanup_retention_days', '90'));
            $cl = crmCleanupRun($db, $days, false);
            $result['cleanup'] = $cl['deleted'];
            // Büyük silme olduysa diski geri kazan (OPTIMIZE) — aksi halde DELETE boşluğu
            // tabloda kalır ve tablo raporlanan boyutuyla "şişmiş" görünmeye devam eder.
            $totalDeleted = 0;
            foreach ((array)$cl['deleted'] as $n) { if (is_numeric($n)) $totalDeleted += (int)$n; }
            if ($totalDeleted > 5000) {
                crmCleanupOptimize($db);
                $result['cleanup_optimized'] = true;
            }
            // Günlük bot-tıklama temizliği: son kampanyaların clicked_at damgaları
            // İNSAN tıklamalarıyla yeniden kurulur (rapor sayıları kendini düzeltir).
            try { $result['bot_scrub'] = crmScrubBotClicks($db, 9); }
            catch (Throwable $e) { error_log('[crm-cron] bot scrub: ' . $e->getMessage()); }
        }
    }
} catch (Throwable $e) {
    error_log('[crm-cron] cleanup: ' . $e->getMessage());
}

// Çakışma kilidini bırak (sendResponse exit etmeden önce)
try { $db->query("SELECT RELEASE_LOCK('khilon_crm_cron')"); } catch (Throwable $e) {}

sendResponse(['ok' => true] + $result);
