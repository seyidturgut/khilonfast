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

$batchSize = isset($_GET['batch']) ? max(1, min(500, (int)$_GET['batch'])) : 50;

$result = [
    'started_scheduled' => 0,
    'dispatched_batches' => 0,
    'campaigns_completed' => 0,
    'sent' => 0,
    'failed' => 0,
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
        try {
            $r = crmDispatchCampaignBatch($db, $cid, $batchSize);
            $result['dispatched_batches']++;
            $result['sent'] += (int)($r['sent'] ?? 0);
            $result['failed'] += (int)($r['failed'] ?? 0);
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

sendResponse(['ok' => true] + $result);
