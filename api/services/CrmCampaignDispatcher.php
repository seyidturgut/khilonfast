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

    // Bu kampanyayı AÇANLAR için otomatik canlı akıllı liste oluştur ("{ad}_opened").
    // Gönderim başlar başlamaz boş oluşur, açılmalar geldikçe kendini doldurur (canlı kural).
    // Sonraki kampanyalar bu listeyi hedef seçerek yalnızca açanlara gönderebilir.
    try { crmEnsureOpenersList($db, $campaignId, (string)($campaign['name'] ?? '')); }
    catch (Throwable $e) { error_log('[crm] openers list: ' . $e->getMessage()); }

    return ['audience_count' => $count, 'queued' => $count, 'variants' => $variantStats];
}
}

if (!function_exists('crmEnsureOpenersList')) {
/**
 * Kampanya başına "{kampanya_adı}_opened" CANLI akıllı listesini idempotent oluşturur.
 * Tip: smart, kural: opened_campaign = $campaignId (gönderim anında değil, her kullanımda
 * canlı çözülür → geç açanlar dahil, bakım yok). Slug = campaign-{id}-opened (kampanya başına tekil).
 * Var olan listeyi tekrar oluşturmaz; adı kampanya adına göre günceller (yeniden adlandırma senkron).
 */
function crmEnsureOpenersList(PDO $db, int $campaignId, string $campaignName): int
{
    $slug = 'campaign-' . $campaignId . '-opened';
    $baseName = trim($campaignName) !== '' ? trim($campaignName) : ('Kampanya #' . $campaignId);
    $listName = mb_substr($baseName, 0, 150) . '_opened';
    $rules = json_encode([
        'match' => 'all',
        'rules' => [['field' => 'opened_campaign', 'op' => 'equals', 'value' => $campaignId]],
    ]);

    // Zaten var mı?
    $stmt = $db->prepare("SELECT id FROM crm_lists WHERE slug = ? LIMIT 1");
    $stmt->execute([$slug]);
    $existingId = (int)($stmt->fetchColumn() ?: 0);

    if ($existingId > 0) {
        // Kampanya adı değişmiş olabilir → liste adını + kuralı güncel tut.
        $db->prepare("UPDATE crm_lists SET name = ?, rules_json = ? WHERE id = ?")
           ->execute([$listName, $rules, $existingId]);
        return $existingId;
    }

    $db->prepare(
        "INSERT INTO crm_lists (slug, name, description, type, rules_json)
         VALUES (?, ?, ?, 'smart', ?)"
    )->execute([
        $slug,
        $listName,
        'Otomatik: \"' . $baseName . '\" kampanyasını açan kişiler (canlı).',
        $rules,
    ]);
    return (int)$db->lastInsertId();
}
}

if (!function_exists('crmStandardFooter')) {
/**
 * Tüm CRM kampanya maillerinin altına eklenen STANDART kurumsal footer.
 * Logo + iletişim + sosyal medya + KVKK/ticari ileti metni + abonelikten çık + copyright.
 * Abonelikten çık token'ı = crm-public/unsubscribe ile AYNI: sha256(email|unsub|JWT_SECRET).
 */
function crmStandardFooter(PDO $db, string $email): string
{
    $siteUrl = rtrim((string)getSetting($db, 'frontend_url', 'https://khilonfast.com'), '/');
    $contactEmail = (string)getSetting($db, 'contact_email', 'info@khilonfast.com');
    $secret = defined('JWT_SECRET') ? JWT_SECRET : '';
    $normEmail = strtolower(trim($email));
    $token = hash('sha256', $normEmail . '|unsub|' . $secret);
    $unsubUrl  = $siteUrl . '/abonelikten-cik?e=' . urlencode($normEmail) . '&t=' . $token;
    $privacyUrl = $siteUrl . '/gizlilik-politikasi';
    $logoUrl = $siteUrl . '/email-logo.png';
    $year = date('Y');
    $safe = fn($s) => htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8');

    return '
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:32px;border-top:1px solid #e2e8f0;background:#f8fafc">
      <tr><td align="center" style="padding:28px 24px;text-align:center;font-family:Arial,Helvetica,sans-serif">
        <img src="' . $logoUrl . '" alt="KhilonFast" width="150" style="display:inline-block;width:150px;height:auto;margin-bottom:14px" />
        <p style="margin:0 0 10px;font-size:12px;color:#64748b">
          <a href="mailto:' . $safe($contactEmail) . '" style="color:#1a3a52;text-decoration:none">' . $safe($contactEmail) . '</a>
        </p>
        <p style="margin:0 0 14px;font-size:12px;color:#64748b">
          <a href="https://www.linkedin.com" style="color:#64748b;text-decoration:none">LinkedIn</a> &nbsp;&middot;&nbsp;
          <a href="https://www.instagram.com" style="color:#64748b;text-decoration:none">Instagram</a> &nbsp;&middot;&nbsp;
          <a href="https://www.facebook.com" style="color:#64748b;text-decoration:none">Facebook</a>
        </p>
        <p style="margin:0 0 12px;font-size:11px;line-height:1.6;color:#94a3b8">
          Bu e-posta KhilonFast tarafından ticari elektronik ileti olarak gönderilmiştir.
          Detaylar için <a href="' . $privacyUrl . '" style="color:#64748b">Gizlilik Politikamızı</a> inceleyebilirsiniz.
        </p>
        <p style="margin:0 0 12px;font-size:12px">
          <a href="' . $unsubUrl . '" style="color:#94a3b8;text-decoration:underline">Bu e-postaları almak istemiyorsanız abonelikten çıkın</a>
        </p>
        <p style="margin:0;font-size:11px;color:#cbd5e1">&copy; ' . $year . ' KhilonFast. T&uuml;m haklar&#305; sakl&#305;d&#305;r.</p>
      </td></tr>
    </table>';
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

        // Standart kurumsal footer (logo + iletişim + sosyal + KVKK + abonelikten çık + copyright)
        $html .= crmStandardFooter($db, (string)$r['email']);

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
