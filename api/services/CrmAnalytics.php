<?php
// api/services/CrmAnalytics.php
// CRM dashboard ve funnel analytics aggregation katmanı.

if (!function_exists('crmDashboardStats')) {
function crmDashboardStats(PDO $db): array
{
    $stats = [
        'contacts' => ['total' => 0, 'subscribed' => 0, 'unsubscribed' => 0, 'bounced' => 0, 'pending' => 0],
        'growth_30d' => 0,
        'growth_7d' => 0,
        'top_sources' => [],
        'top_tags' => [],
        'list_health' => [],
        'campaigns' => ['total' => 0, 'sent' => 0, 'avg_open_rate' => 0, 'avg_click_rate' => 0],
        'recent_campaigns' => [],
        'forms' => ['total' => 0, 'submissions_30d' => 0, 'top_forms' => []],
        'activity_30d' => [
            'email_events' => 0,
            'orders' => 0,
            'consents' => 0,
            'web_visits' => 0,
            'form_submissions' => 0,
        ],
        'score_distribution' => ['cold' => 0, 'warm' => 0, 'hot' => 0],
    ];

    try {
        // Contacts by status
        $rs = $db->query("SELECT status, COUNT(*) c FROM crm_contacts GROUP BY status");
        foreach ($rs as $r) {
            $stats['contacts'][$r['status']] = (int)$r['c'];
        }
        $stats['contacts']['total'] = (int)$db->query("SELECT COUNT(*) FROM crm_contacts")->fetchColumn();
    } catch (Throwable $e) {}

    try {
        $stats['growth_30d'] = (int)$db->query("SELECT COUNT(*) FROM crm_contacts WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)")->fetchColumn();
        $stats['growth_7d'] = (int)$db->query("SELECT COUNT(*) FROM crm_contacts WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)")->fetchColumn();
    } catch (Throwable $e) {}

    try {
        $rs = $db->query("SELECT source, COUNT(*) c FROM crm_contacts GROUP BY source ORDER BY c DESC LIMIT 6");
        foreach ($rs as $r) $stats['top_sources'][] = ['source' => $r['source'], 'count' => (int)$r['c']];
    } catch (Throwable $e) {}

    try {
        $rs = $db->query("SELECT t.name, t.slug, t.color, t.contact_count
                          FROM crm_tags t WHERE t.contact_count > 0
                          ORDER BY t.contact_count DESC LIMIT 10");
        foreach ($rs as $r) {
            $stats['top_tags'][] = [
                'name' => $r['name'], 'slug' => $r['slug'],
                'color' => $r['color'], 'count' => (int)$r['contact_count']
            ];
        }
    } catch (Throwable $e) {}

    try {
        // List health (per liste % deliverable)
        $rs = $db->query("SELECT l.id, l.name, l.type, l.contact_count,
                                 (SELECT COUNT(*) FROM crm_list_contacts lc
                                  JOIN crm_contacts c ON c.id = lc.contact_id
                                  WHERE lc.list_id = l.id AND c.status = 'subscribed') AS deliverable
                          FROM crm_lists l ORDER BY l.contact_count DESC LIMIT 10");
        foreach ($rs as $r) {
            $count = (int)$r['contact_count'];
            $deliv = (int)$r['deliverable'];
            $health = $count > 0 ? round(($deliv / $count) * 100) : 100;
            $stats['list_health'][] = [
                'id' => (int)$r['id'], 'name' => $r['name'], 'type' => $r['type'],
                'count' => $count, 'deliverable' => $deliv, 'health' => $health
            ];
        }
    } catch (Throwable $e) {}

    try {
        $stats['campaigns']['total'] = (int)$db->query("SELECT COUNT(*) FROM crm_campaigns")->fetchColumn();
        $stats['campaigns']['sent'] = (int)$db->query("SELECT COUNT(*) FROM crm_campaigns WHERE status='sent'")->fetchColumn();

        // Avg open/click across all campaigns
        $rs = $db->query("SELECT
            SUM(CASE WHEN opened_at IS NOT NULL THEN 1 ELSE 0 END) AS opened,
            SUM(CASE WHEN clicked_at IS NOT NULL THEN 1 ELSE 0 END) AS clicked,
            SUM(CASE WHEN status='sent' OR opened_at IS NOT NULL THEN 1 ELSE 0 END) AS sent
            FROM crm_campaign_recipients");
        $r = $rs->fetch();
        $sent = (int)($r['sent'] ?? 0);
        $stats['campaigns']['avg_open_rate'] = $sent > 0 ? round(((int)$r['opened'] / $sent) * 1000) / 10 : 0;
        $stats['campaigns']['avg_click_rate'] = $sent > 0 ? round(((int)$r['clicked'] / $sent) * 1000) / 10 : 0;

        // Recent campaigns
        $rs = $db->query("SELECT id, name, subject, status, completed_at FROM crm_campaigns
                          ORDER BY created_at DESC LIMIT 5");
        foreach ($rs as $r) {
            $stats['recent_campaigns'][] = [
                'id' => (int)$r['id'], 'name' => $r['name'], 'subject' => $r['subject'],
                'status' => $r['status'], 'completed_at' => $r['completed_at']
            ];
        }
    } catch (Throwable $e) {}

    try {
        $stats['forms']['total'] = (int)$db->query("SELECT COUNT(*) FROM crm_forms WHERE is_active=1")->fetchColumn();
        $stats['forms']['submissions_30d'] = (int)$db->query(
            "SELECT COUNT(*) FROM crm_form_submissions WHERE status='confirmed' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)"
        )->fetchColumn();
        $rs = $db->query("SELECT id, slug, name, submission_count FROM crm_forms
                          WHERE is_active=1 ORDER BY submission_count DESC LIMIT 5");
        foreach ($rs as $r) {
            $stats['forms']['top_forms'][] = [
                'id' => (int)$r['id'], 'slug' => $r['slug'], 'name' => $r['name'],
                'count' => (int)$r['submission_count']
            ];
        }
    } catch (Throwable $e) {}

    try {
        $stats['activity_30d']['email_events'] = (int)$db->query(
            "SELECT COUNT(*) FROM crm_email_tracking WHERE occurred_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)"
        )->fetchColumn();
        $stats['activity_30d']['orders'] = (int)$db->query(
            "SELECT COUNT(*) FROM crm_activity_log WHERE type LIKE 'order%' AND occurred_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)"
        )->fetchColumn();
        $stats['activity_30d']['consents'] = (int)$db->query(
            "SELECT COUNT(*) FROM crm_activity_log WHERE type LIKE 'consent%' AND occurred_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)"
        )->fetchColumn();
        $stats['activity_30d']['web_visits'] = (int)$db->query(
            "SELECT COUNT(*) FROM crm_web_visits WHERE occurred_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)"
        )->fetchColumn();
        $stats['activity_30d']['form_submissions'] = (int)$db->query(
            "SELECT COUNT(*) FROM crm_form_submissions WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)"
        )->fetchColumn();
    } catch (Throwable $e) {}

    try {
        $stats['score_distribution']['cold'] = (int)$db->query("SELECT COUNT(*) FROM crm_contacts WHERE score <= 0")->fetchColumn();
        $stats['score_distribution']['warm'] = (int)$db->query("SELECT COUNT(*) FROM crm_contacts WHERE score > 0 AND score <= 10")->fetchColumn();
        $stats['score_distribution']['hot'] = (int)$db->query("SELECT COUNT(*) FROM crm_contacts WHERE score > 10")->fetchColumn();
    } catch (Throwable $e) {}

    return $stats;
}
}

if (!function_exists('crmGrowthTimeseries')) {
function crmGrowthTimeseries(PDO $db, int $days = 30): array
{
    $sql = "SELECT DATE(created_at) AS d, COUNT(*) c
            FROM crm_contacts
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY DATE(created_at)
            ORDER BY d ASC";
    $stmt = $db->prepare($sql);
    $stmt->execute([$days]);
    $points = [];
    foreach ($stmt as $r) {
        $points[] = ['date' => $r['d'], 'count' => (int)$r['c']];
    }
    return $points;
}
}

if (!function_exists('crmComputeFunnel')) {
/**
 * Funnel computation — steps_json'daki her adıma karşılık gelen kişi sayısını hesapla.
 * Step types:
 *   - {type: 'tag', value: 'newsletter'}        — has tag
 *   - {type: 'list', value: 5}                  — in list
 *   - {type: 'event', value: 'order_completed'} — activity_log type contains
 *   - {type: 'status', value: 'subscribed'}     — contact status
 *   - {type: 'min_score', value: 10}            — score >= N
 */
function crmComputeFunnel(PDO $db, array $steps, int $rangeDays = 30): array
{
    $cumulativeIds = null; // null = tüm contact'lar
    $results = [];

    foreach ($steps as $idx => $step) {
        $type = (string)($step['type'] ?? '');
        $value = $step['value'] ?? null;
        $label = (string)($step['label'] ?? $type);

        $sql = "SELECT c.id FROM crm_contacts c WHERE 1=1";
        $params = [];

        switch ($type) {
            case 'tag':
                $sql .= " AND EXISTS (SELECT 1 FROM crm_contact_tags ct
                          JOIN crm_tags t ON t.id = ct.tag_id
                          WHERE ct.contact_id = c.id AND t.slug = ?)";
                $params[] = (string)$value;
                break;
            case 'list':
                $sql .= " AND EXISTS (SELECT 1 FROM crm_list_contacts lc
                          WHERE lc.contact_id = c.id AND lc.list_id = ?)";
                $params[] = (int)$value;
                break;
            case 'event':
                $sql .= " AND EXISTS (SELECT 1 FROM crm_activity_log al
                          WHERE al.contact_id = c.id AND al.type LIKE ?
                          AND al.occurred_at >= DATE_SUB(NOW(), INTERVAL ? DAY))";
                $params[] = (string)$value . '%';
                $params[] = $rangeDays;
                break;
            case 'status':
                $sql .= " AND c.status = ?";
                $params[] = (string)$value;
                break;
            case 'min_score':
                $sql .= " AND c.score >= ?";
                $params[] = (int)$value;
                break;
            default:
                continue 2;
        }

        // Önceki adımın ID'leriyle kesişim
        if ($cumulativeIds !== null) {
            if (empty($cumulativeIds)) {
                $results[] = [
                    'idx' => $idx, 'label' => $label, 'type' => $type,
                    'count' => 0, 'rate_from_first' => 0, 'rate_from_prev' => 0,
                    'drop_from_prev' => 0
                ];
                continue;
            }
            $placeholders = implode(',', array_fill(0, count($cumulativeIds), '?'));
            $sql .= " AND c.id IN ($placeholders)";
            $params = array_merge($params, $cumulativeIds);
        }

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $ids = [];
        foreach ($stmt as $r) $ids[] = (int)$r['id'];
        $count = count($ids);

        $firstCount = $results ? $results[0]['count'] : $count;
        $prevCount = $results ? $results[count($results) - 1]['count'] : $count;
        $rateFromFirst = $firstCount > 0 ? round(($count / $firstCount) * 1000) / 10 : 100;
        $rateFromPrev = $prevCount > 0 ? round(($count / $prevCount) * 1000) / 10 : 100;
        $dropFromPrev = $prevCount > 0 ? $prevCount - $count : 0;

        $results[] = [
            'idx' => $idx, 'label' => $label, 'type' => $type,
            'count' => $count,
            'rate_from_first' => $rateFromFirst,
            'rate_from_prev' => $rateFromPrev,
            'drop_from_prev' => $dropFromPrev,
        ];
        $cumulativeIds = $ids;
    }

    return $results;
}
}
