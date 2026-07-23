<?php

if (!function_exists('crmClickExcludePatterns')) {
/**
 * "İçerik linkine tıklayanlar" listesinden HARİÇ tutulacak URL kalıpları.
 *
 * Kaynak: settings.crm_click_exclude_patterns (satır başına 1 kalıp, LIKE %kalip% olarak uygulanır).
 * Ayar yoksa/boşsa aşağıdaki varsayılan kullanılır — bunlar crmStandardFooter()'ın
 * kampanya maillerine otomatik eklediği linklerdir (bkz. CrmCampaignDispatcher.php):
 *   /abonelikten-cik      → abonelikten çık
 *   facebook/instagram/linkedin.com → sosyal medya
 *   /gizlilik-politikasi  → KVKK
 *   mailto:               → iletişim e-postası
 * Böylece liste yalnızca GERÇEK içerik ilgisini gösterir (+ footer'a saldıran
 * kurumsal mail güvenlik tarayıcısı botları da elenmiş olur).
 */
function crmClickExcludePatterns(?PDO $db = null): array
{
    $default = "/abonelikten-cik\nfacebook.com\ninstagram.com\nlinkedin.com\n/gizlilik-politikasi\nmailto:";
    // $db yoksa (SQL builder'a geçilmemişse) ayara bakmadan varsayılanı kullan
    $raw = $db instanceof PDO ? (string)getSetting($db, 'crm_click_exclude_patterns', $default) : $default;
    if (trim($raw) === '') { $raw = $default; }
    $out = [];
    foreach (preg_split('/\r\n|\r|\n/', $raw) as $line) {
        $line = trim($line);
        if ($line !== '') { $out[] = $line; }
    }
    return $out;
}
}

// api/services/CrmSmartListEngine.php
// Smart list rules_json → SQL builder.
//
// Rules JSON şeması:
// {
//   "match": "all" | "any",   // AND / OR
//   "rules": [
//     { "field": "email", "op": "contains", "value": "..." },
//     { "field": "score", "op": "gt", "value": 10 },
//     { "field": "status", "op": "equals", "value": "subscribed" },
//     { "field": "source", "op": "in", "value": ["user_account","order"] },
//     { "field": "created_at", "op": "within_days", "value": 30 },
//     { "field": "last_activity_at", "op": "within_days", "value": 7 },
//     { "field": "has_tag", "op": "equals", "value": "premium" },
//     { "field": "in_list", "op": "equals", "value": 5 }
//   ]
// }
//
// Sonuç: ['where' => 'WHERE ...', 'params' => [...]]
// Tablolarda c.* prefix kullanılır (crm_contacts AS c).

if (!function_exists('crmBuildSmartListSql')) {
function crmBuildSmartListSql($rulesJson, ?PDO $db = null): array
{
    $rules = is_array($rulesJson) ? $rulesJson : (json_decode((string)$rulesJson, true) ?: []);
    $match = ($rules['match'] ?? 'all') === 'any' ? 'OR' : 'AND';
    $items = is_array($rules['rules'] ?? null) ? $rules['rules'] : [];

    $clauses = [];
    $params = [];

    $allowedTextFields = ['email', 'first_name', 'last_name', 'phone', 'company', 'source', 'status'];
    $allowedNumFields = ['score', 'ltv', 'user_id'];
    $allowedDateFields = ['created_at', 'updated_at', 'last_activity_at'];

    foreach ($items as $r) {
        $field = (string)($r['field'] ?? '');
        $op = (string)($r['op'] ?? 'equals');
        $val = $r['value'] ?? null;

        // ─── Tag özel durum ───
        if ($field === 'has_tag') {
            $sub = "EXISTS (SELECT 1 FROM crm_contact_tags ct JOIN crm_tags t ON t.id = ct.tag_id
                    WHERE ct.contact_id = c.id AND t.slug = ?)";
            if ($op === 'not_equals') $sub = "NOT $sub";
            $clauses[] = $sub;
            $params[] = (string)$val;
            continue;
        }
        if ($field === 'has_any_tag') {
            $tags = is_array($val) ? array_values(array_filter(array_map('strval', $val))) : [];
            if (!$tags) continue;
            $placeholders = implode(',', array_fill(0, count($tags), '?'));
            $clauses[] = "EXISTS (SELECT 1 FROM crm_contact_tags ct JOIN crm_tags t ON t.id = ct.tag_id
                          WHERE ct.contact_id = c.id AND t.slug IN ($placeholders))";
            $params = array_merge($params, $tags);
            continue;
        }

        // ─── Kampanya etkileşimi (mail açtı / tıkladı) ───
        // opened_campaign:  belirli/herhangi bir kampanyayı AÇMIŞ kişiler
        // clicked_campaign: belirli/herhangi bir kampanyada TIKLAMIŞ kişiler
        // Kaynak: crm_campaign_recipients (contact_id bazlı, kampanya başına tekil — açılma=opened_at).
        // op 'equals'      → o kampanyayı açtı/tıkladı (value=campaign_id)
        // op 'not_equals'  → o kampanyayı açmadı/tıklamadı
        // op 'any'         → herhangi bir kampanyayı açtı/tıkladı (value gerekmez)
        if ($field === 'opened_campaign' || $field === 'clicked_campaign') {
            $col = $field === 'clicked_campaign' ? 'clicked_at' : 'opened_at';
            $sub = "EXISTS (SELECT 1 FROM crm_campaign_recipients r
                    WHERE r.contact_id = c.id AND r.$col IS NOT NULL";
            $needsId = ($op === 'equals' || $op === 'not_equals');
            if ($needsId) {
                $sub .= " AND r.campaign_id = ?";
            }
            $sub .= ")";
            if ($op === 'not_equals') $sub = "NOT $sub";
            $clauses[] = $sub;
            if ($needsId) $params[] = (int)$val;
            continue;
        }

        // ─── İÇERİK linkine tıklayanlar (footer/sosyal/unsubscribe HARİÇ) ───
        // Neden ayrı bir kural: yukarıdaki clicked_campaign, crm_campaign_recipients.clicked_at
        // (evet/hayır bayrağı) bakar — HANGİ linke tıklandığını bilemez. Müşteri ise
        // "abonelikten çık ve sosyal medya dışındaki linklere tıklayanlar" istiyor.
        // Bu kural crm_email_tracking.link_url üzerinden gider (her tıklama URL'iyle kayıtlı).
        // BONUS: footer linkleri geçmişte eşit ~3030 tık almıştı = kurumsal mail güvenlik
        // tarayıcıları (bot). Footer'ı dışlamak bot gürültüsünü de temizler.
        // Hariç kalıplar 'crm_click_exclude_patterns' ayarından (satır başına 1 kalıp) okunur;
        // yeni bir sosyal ağ eklenirse DEPLOY GEREKMEDEN güncellenebilir.
        if ($field === 'clicked_link_campaign') {
            $patterns = crmClickExcludePatterns($db); // $db yoksa varsayılan kalıplar
            $sub = "EXISTS (SELECT 1 FROM crm_email_tracking et
                    WHERE et.contact_id = c.id AND et.event = 'clicked'
                      AND et.link_url IS NOT NULL AND et.link_url <> ''";
            foreach ($patterns as $pat) {
                $sub .= " AND et.link_url NOT LIKE ?";
            }
            $needsId = ($op === 'equals' || $op === 'not_equals');
            if ($needsId) { $sub .= " AND et.campaign_id = ?"; }
            $sub .= ")";
            if ($op === 'not_equals') $sub = "NOT $sub";
            $clauses[] = $sub;
            foreach ($patterns as $pat) { $params[] = '%' . $pat . '%'; }
            if ($needsId) $params[] = (int)$val;
            continue;
        }

        // ─── Liste üyeliği ───
        if ($field === 'in_list') {
            $sub = "EXISTS (SELECT 1 FROM crm_list_contacts lc WHERE lc.contact_id = c.id AND lc.list_id = ?)";
            if ($op === 'not_equals') $sub = "NOT $sub";
            $clauses[] = $sub;
            $params[] = (int)$val;
            continue;
        }

        // ─── Standart alanlar ───
        if (in_array($field, $allowedTextFields, true)) {
            switch ($op) {
                case 'equals':       $clauses[] = "c.$field = ?"; $params[] = (string)$val; break;
                case 'not_equals':   $clauses[] = "c.$field <> ?"; $params[] = (string)$val; break;
                case 'contains':     $clauses[] = "c.$field LIKE ?"; $params[] = '%' . $val . '%'; break;
                case 'not_contains': $clauses[] = "c.$field NOT LIKE ?"; $params[] = '%' . $val . '%'; break;
                case 'starts_with':  $clauses[] = "c.$field LIKE ?"; $params[] = $val . '%'; break;
                case 'ends_with':    $clauses[] = "c.$field LIKE ?"; $params[] = '%' . $val; break;
                case 'is_empty':     $clauses[] = "(c.$field IS NULL OR c.$field = '')"; break;
                case 'is_not_empty': $clauses[] = "(c.$field IS NOT NULL AND c.$field <> '')"; break;
                case 'in':
                    $vals = is_array($val) ? array_values(array_map('strval', $val)) : [];
                    if (!$vals) { $clauses[] = "1=0"; break; }
                    $ph = implode(',', array_fill(0, count($vals), '?'));
                    $clauses[] = "c.$field IN ($ph)";
                    $params = array_merge($params, $vals);
                    break;
            }
            continue;
        }

        if (in_array($field, $allowedNumFields, true)) {
            switch ($op) {
                case 'equals':     $clauses[] = "c.$field = ?"; $params[] = (float)$val; break;
                case 'not_equals': $clauses[] = "c.$field <> ?"; $params[] = (float)$val; break;
                case 'gt':         $clauses[] = "c.$field > ?"; $params[] = (float)$val; break;
                case 'gte':        $clauses[] = "c.$field >= ?"; $params[] = (float)$val; break;
                case 'lt':         $clauses[] = "c.$field < ?"; $params[] = (float)$val; break;
                case 'lte':        $clauses[] = "c.$field <= ?"; $params[] = (float)$val; break;
                case 'between':
                    if (is_array($val) && count($val) === 2) {
                        $clauses[] = "c.$field BETWEEN ? AND ?";
                        $params[] = (float)$val[0];
                        $params[] = (float)$val[1];
                    }
                    break;
                case 'is_null':     $clauses[] = "c.$field IS NULL"; break;
                case 'is_not_null': $clauses[] = "c.$field IS NOT NULL"; break;
            }
            continue;
        }

        if (in_array($field, $allowedDateFields, true)) {
            switch ($op) {
                case 'within_days':
                    $days = max(1, (int)$val);
                    $clauses[] = "c.$field >= DATE_SUB(NOW(), INTERVAL $days DAY)";
                    break;
                case 'older_than_days':
                    $days = max(1, (int)$val);
                    $clauses[] = "c.$field < DATE_SUB(NOW(), INTERVAL $days DAY)";
                    break;
                case 'is_null':     $clauses[] = "c.$field IS NULL"; break;
                case 'is_not_null': $clauses[] = "c.$field IS NOT NULL"; break;
                case 'between':
                    if (is_array($val) && count($val) === 2) {
                        $clauses[] = "c.$field BETWEEN ? AND ?";
                        $params[] = (string)$val[0];
                        $params[] = (string)$val[1];
                    }
                    break;
            }
            continue;
        }
    }

    if (!$clauses) {
        return ['where' => '', 'params' => []];
    }
    $where = '(' . implode(") $match (", $clauses) . ')';
    return ['where' => $where, 'params' => $params];
}
}

if (!function_exists('crmRunSmartListPreview')) {
function crmRunSmartListPreview(PDO $db, $rulesJson, int $sampleLimit = 10): array
{
    $built = crmBuildSmartListSql($rulesJson, $db);
    $whereSql = $built['where'] ? "WHERE " . $built['where'] : '';
    $params = $built['params'];

    $countStmt = $db->prepare("SELECT COUNT(*) FROM crm_contacts c $whereSql");
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();

    $sampleStmt = $db->prepare("SELECT c.id, c.email, c.first_name, c.last_name, c.score, c.status, c.source
                                FROM crm_contacts c $whereSql
                                ORDER BY c.created_at DESC LIMIT $sampleLimit");
    $sampleStmt->execute($params);
    $sample = $sampleStmt->fetchAll();

    return [
        'total' => $total,
        'sample' => array_map(function ($r) {
            return [
                'id' => (int)$r['id'],
                'email' => $r['email'],
                'first_name' => $r['first_name'] ?? '',
                'last_name' => $r['last_name'] ?? '',
                'score' => (int)($r['score'] ?? 0),
                'status' => $r['status'] ?? '',
                'source' => $r['source'] ?? '',
            ];
        }, $sample),
    ];
}
}
