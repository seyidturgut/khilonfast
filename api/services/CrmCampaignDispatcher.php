<?php
// api/services/CrmCampaignDispatcher.php
// One-off kampanyalar için audience resolve + send + A/B test motoru.

require_once __DIR__ . '/CrmSmartListEngine.php';

if (!function_exists('crmResolveCampaignAudience')) {
/**
 * Bir kampanyanın hedef kişilerini birleştir (lists + tags + status filter).
 * Bounced/complained/unsubscribed otomatik hariç (status filtresi parametre olarak gelmiyorsa varsayılan 'subscribed').
 */
function crmResolveCampaignAudience(PDO $db, array $campaign): array
{
    $listIds = json_decode((string)($campaign['target_list_ids'] ?? '[]'), true) ?: [];
    $tagSlugs = json_decode((string)($campaign['target_tag_slugs'] ?? '[]'), true) ?: [];
    $status = (string)($campaign['target_status'] ?? 'subscribed');

    $contactIds = [];

    // 1) Static + smart listelerinden topla
    foreach ($listIds as $lid) {
        $lid = (int)$lid;
        if (!$lid) continue;
        $stmt = $db->prepare("SELECT type, rules_json FROM crm_lists WHERE id = ?");
        $stmt->execute([$lid]);
        $list = $stmt->fetch();
        if (!$list) continue;
        if ($list['type'] === 'static') {
            $rs = $db->prepare("SELECT contact_id FROM crm_list_contacts WHERE list_id = ?");
            $rs->execute([$lid]);
            foreach ($rs as $r) $contactIds[(int)$r['contact_id']] = true;
        } else {
            $rules = json_decode((string)$list['rules_json'], true) ?: [];
            $built = crmBuildSmartListSql($rules);
            $w = $built['where'] ? "WHERE " . $built['where'] : '';
            $sql = "SELECT c.id FROM crm_contacts c $w";
            $rs = $db->prepare($sql);
            $rs->execute($built['params']);
            foreach ($rs as $r) $contactIds[(int)$r['id']] = true;
        }
    }

    // 2) Tag slugs'tan topla (OR)
    if ($tagSlugs) {
        $placeholders = implode(',', array_fill(0, count($tagSlugs), '?'));
        $sql = "SELECT DISTINCT ct.contact_id FROM crm_contact_tags ct
                JOIN crm_tags t ON t.id = ct.tag_id
                WHERE t.slug IN ($placeholders)";
        $rs = $db->prepare($sql);
        $rs->execute($tagSlugs);
        foreach ($rs as $r) $contactIds[(int)$r['contact_id']] = true;
    }

    if (!$contactIds) return [];

    // 3) status filter + bounced/complained/unsubscribed her zaman hariç
    $ids = array_keys($contactIds);
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $sql = "SELECT id, email, first_name, last_name FROM crm_contacts
            WHERE id IN ($placeholders)
              AND status = ?
              AND email IS NOT NULL AND email <> ''
            ORDER BY id ASC";
    $params = array_merge($ids, [$status]);
    $rs = $db->prepare($sql);
    $rs->execute($params);
    return $rs->fetchAll();
}
}

if (!function_exists('crmEnqueueCampaign')) {
/**
 * Kampanya gönderimi başlat — recipients tablosunu doldur, A/B variant ata, status='sending' yap.
 * dry_run=true ise sadece audience resolve ediyor, recipient yazmıyor.
 * Brevo gönderimi için crmDispatchCampaignBatch() ayrı çağrılır.
 */
function crmEnqueueCampaign(PDO $db, int $campaignId, bool $dryRun = false): array
{
    $stmt = $db->prepare("SELECT * FROM crm_campaigns WHERE id = ?");
    $stmt->execute([$campaignId]);
    $campaign = $stmt->fetch();
    if (!$campaign) throw new Exception('Campaign not found');

    $audience = crmResolveCampaignAudience($db, $campaign);
    $count = count($audience);

    if ($dryRun) {
        return ['audience_count' => $count, 'dry_run' => true, 'sample' => array_slice($audience, 0, 5)];
    }

    if ($count === 0) {
        $db->prepare("UPDATE crm_campaigns SET status = 'sent', completed_at = NOW(),
                      stats_json = ? WHERE id = ?")
           ->execute([json_encode(['audience' => 0, 'sent' => 0, 'reason' => 'no audience']), $campaignId]);
        return ['audience_count' => 0, 'queued' => 0];
    }

    // Recipients yaz (A/B varianti rastgele 50/50 ata)
    $abEnabled = !empty($campaign['ab_enabled']);
    $stmt = $db->prepare("INSERT IGNORE INTO crm_campaign_recipients
        (campaign_id, contact_id, email, ab_variant, status)
        VALUES (?, ?, ?, ?, 'queued')");
    $variantStats = ['A' => 0, 'B' => 0, 'none' => 0];
    foreach ($audience as $c) {
        $variant = null;
        if ($abEnabled) {
            $variant = (mt_rand(0, 99) < 50) ? 'A' : 'B';
            $variantStats[$variant]++;
        } else {
            $variantStats['none']++;
        }
        $stmt->execute([$campaignId, (int)$c['id'], $c['email'], $variant]);
    }

    $db->prepare("UPDATE crm_campaigns SET status = 'sending', started_at = NOW(),
                  stats_json = ? WHERE id = ?")
       ->execute([
           json_encode(['audience' => $count, 'queued' => $count, 'variants' => $variantStats]),
           $campaignId
       ]);

    return ['audience_count' => $count, 'queued' => $count, 'variants' => $variantStats];
}
}

if (!function_exists('crmDispatchCampaignBatch')) {
/**
 * Kampanya recipient batch'ini gönder. Brevo HTTP API ile tek tek gönderir.
 * Return: ['sent' => N, 'failed' => N, 'remaining' => N]
 */
function crmDispatchCampaignBatch(PDO $db, int $campaignId, int $batchSize = 50): array
{
    $stmt = $db->prepare("SELECT * FROM crm_campaigns WHERE id = ?");
    $stmt->execute([$campaignId]);
    $campaign = $stmt->fetch();
    if (!$campaign) throw new Exception('Campaign not found');
    if (!in_array($campaign['status'], ['sending', 'scheduled'], true)) {
        return ['sent' => 0, 'failed' => 0, 'remaining' => 0, 'reason' => 'campaign not in sending state'];
    }

    // Brevo settings
    $apiKey = ''; $fromEmail = ''; $fromName = '';
    try {
        $rs = $db->query("SELECT setting_key, setting_value FROM settings
                          WHERE setting_key IN ('brevo_api_key','sender_email','sender_name','from_email','from_name')");
        foreach ($rs as $r) {
            if ($r['setting_key'] === 'brevo_api_key') $apiKey = (string)$r['setting_value'];
            if (in_array($r['setting_key'], ['sender_email', 'from_email'], true) && !$fromEmail) $fromEmail = (string)$r['setting_value'];
            if (in_array($r['setting_key'], ['sender_name', 'from_name'], true) && !$fromName) $fromName = (string)$r['setting_value'];
        }
    } catch (Throwable $e) {}

    $fromEmail = $campaign['from_email'] ?: $fromEmail ?: 'info@khilon.com';
    $fromName = $campaign['from_name'] ?: $fromName ?: 'Khilonfast';

    $rs = $db->prepare("SELECT * FROM crm_campaign_recipients
                        WHERE campaign_id = ? AND status = 'queued' LIMIT $batchSize");
    $rs->execute([$campaignId]);
    $queued = $rs->fetchAll();

    $sent = 0; $failed = 0;
    foreach ($queued as $r) {
        $variant = $r['ab_variant'];
        $subject = ($variant === 'B' && $campaign['ab_subject_b'])
            ? $campaign['ab_subject_b']
            : $campaign['subject'];
        $html = (string)$campaign['body_html'];

        // Variable substitution (kişi başı)
        $cstmt = $db->prepare("SELECT first_name, last_name FROM crm_contacts WHERE id = ?");
        $cstmt->execute([(int)$r['contact_id']]);
        $contact = $cstmt->fetch();
        $vars = [
            'first_name' => $contact['first_name'] ?? '',
            'last_name' => $contact['last_name'] ?? '',
            'email' => $r['email'],
        ];
        foreach ($vars as $k => $v) {
            $subject = str_replace('{{' . $k . '}}', $v, $subject);
            $html = str_replace('{{' . $k . '}}', $v, $html);
        }

        try {
            if (!$apiKey || !function_exists('sendBrevoApiEmail')) {
                throw new Exception('Brevo API key veya gönderici fonksiyonu yok');
            }
            $ok = sendBrevoApiEmail($apiKey, $fromEmail, $fromName, $r['email'], $subject, $html);
            $messageId = is_array($ok) ? ($ok['messageId'] ?? null) : null;
            $db->prepare("UPDATE crm_campaign_recipients
                          SET status = 'sent', sent_at = NOW(), message_id = ? WHERE id = ?")
               ->execute([$messageId, (int)$r['id']]);
            $sent++;
        } catch (Throwable $e) {
            $db->prepare("UPDATE crm_campaign_recipients
                          SET status = 'failed', error = ? WHERE id = ?")
               ->execute([substr($e->getMessage(), 0, 500), (int)$r['id']]);
            $failed++;
        }
    }

    // Remaining queued
    $r2 = $db->prepare("SELECT COUNT(*) FROM crm_campaign_recipients WHERE campaign_id = ? AND status = 'queued'");
    $r2->execute([$campaignId]);
    $remaining = (int)$r2->fetchColumn();

    if ($remaining === 0) {
        $db->prepare("UPDATE crm_campaigns SET status = 'sent', completed_at = NOW() WHERE id = ?")
           ->execute([$campaignId]);
    }

    return ['sent' => $sent, 'failed' => $failed, 'remaining' => $remaining];
}
}

if (!function_exists('crmCampaignReport')) {
/**
 * Kampanya raporu: open/click/bounce sayıları (recipients tablosundan + email_tracking JOIN).
 */
function crmCampaignReport(PDO $db, int $campaignId): array
{
    $stmt = $db->prepare("SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status='sent' OR opened_at IS NOT NULL OR clicked_at IS NOT NULL THEN 1 ELSE 0 END) AS sent,
        SUM(CASE WHEN status='failed' THEN 1 ELSE 0 END) AS failed,
        SUM(CASE WHEN opened_at IS NOT NULL THEN 1 ELSE 0 END) AS opened,
        SUM(CASE WHEN clicked_at IS NOT NULL THEN 1 ELSE 0 END) AS clicked,
        SUM(CASE WHEN status='bounced' THEN 1 ELSE 0 END) AS bounced,
        SUM(CASE WHEN status='unsubscribed' THEN 1 ELSE 0 END) AS unsubscribed,
        SUM(CASE WHEN ab_variant='A' THEN 1 ELSE 0 END) AS variant_a_count,
        SUM(CASE WHEN ab_variant='B' THEN 1 ELSE 0 END) AS variant_b_count,
        SUM(CASE WHEN ab_variant='A' AND opened_at IS NOT NULL THEN 1 ELSE 0 END) AS variant_a_opened,
        SUM(CASE WHEN ab_variant='B' AND opened_at IS NOT NULL THEN 1 ELSE 0 END) AS variant_b_opened
        FROM crm_campaign_recipients WHERE campaign_id = ?");
    $stmt->execute([$campaignId]);
    $row = $stmt->fetch() ?: [];

    $total = (int)($row['total'] ?? 0);
    $sentCount = (int)($row['sent'] ?? 0);
    $opened = (int)($row['opened'] ?? 0);
    $clicked = (int)($row['clicked'] ?? 0);
    $bounced = (int)($row['bounced'] ?? 0);

    return [
        'total' => $total,
        'sent' => $sentCount,
        'failed' => (int)($row['failed'] ?? 0),
        'opened' => $opened,
        'clicked' => $clicked,
        'bounced' => $bounced,
        'unsubscribed' => (int)($row['unsubscribed'] ?? 0),
        'open_rate' => $sentCount > 0 ? round(($opened / $sentCount) * 100, 1) : 0,
        'click_rate' => $sentCount > 0 ? round(($clicked / $sentCount) * 100, 1) : 0,
        'bounce_rate' => $total > 0 ? round(($bounced / $total) * 100, 1) : 0,
        'variant_a' => [
            'sent' => (int)($row['variant_a_count'] ?? 0),
            'opened' => (int)($row['variant_a_opened'] ?? 0),
            'open_rate' => ($row['variant_a_count'] ?? 0) > 0
                ? round(($row['variant_a_opened'] / $row['variant_a_count']) * 100, 1) : 0,
        ],
        'variant_b' => [
            'sent' => (int)($row['variant_b_count'] ?? 0),
            'opened' => (int)($row['variant_b_opened'] ?? 0),
            'open_rate' => ($row['variant_b_count'] ?? 0) > 0
                ? round(($row['variant_b_opened'] / $row['variant_b_count']) * 100, 1) : 0,
        ]
    ];
}
}
