<?php
// api/services/CrmCsvImporter.php
// CSV import/export — kişi listesini CSV'den yükle, filtrelenmiş kişileri CSV olarak indir.

if (!function_exists('crmParseCsvHeader')) {
/**
 * CSV içeriğini parse et, header + ilk N satırı dön.
 * @return array ['headers'=>string[], 'rows'=>array[][], 'total'=>int]
 */
function crmParseCsvPreview(string $csvContent, int $previewRows = 10): array
{
    $lines = preg_split('/\r\n|\n|\r/', trim($csvContent));
    if (!$lines) return ['headers' => [], 'rows' => [], 'total' => 0];

    $headers = str_getcsv(array_shift($lines));
    $rows = [];
    $total = 0;
    foreach ($lines as $line) {
        if (trim($line) === '') continue;
        $total++;
        if (count($rows) < $previewRows) {
            $rows[] = str_getcsv($line);
        }
    }
    return ['headers' => $headers, 'rows' => $rows, 'total' => $total];
}
}

if (!function_exists('crmRunCsvImport')) {
/**
 * CSV import — header→field mapping ile contact'ları yükle.
 * @param string   $csvContent
 * @param array    $mapping     ['email'=>0, 'first_name'=>1, ...] header index map (or string col name)
 * @param array    $opts        ['tag_slugs'=>[], 'list_ids'=>[], 'status'=>'subscribed', 'source'=>'csv_import', 'update_existing'=>true]
 * @return array ['inserted'=>N, 'updated'=>N, 'skipped'=>N, 'errors'=>[]]
 */
function crmRunCsvImport(PDO $db, string $csvContent, array $mapping, array $opts = []): array
{
    $stats = ['inserted' => 0, 'updated' => 0, 'skipped' => 0, 'errors' => []];
    $lines = preg_split('/\r\n|\n|\r/', trim($csvContent));
    if (!$lines || count($lines) < 2) {
        $stats['errors'][] = 'CSV boş veya başlık satırı yok';
        return $stats;
    }
    $headers = str_getcsv(array_shift($lines));

    // Mapping: kolon ismi → indeks
    $colIdx = [];
    foreach ($mapping as $field => $col) {
        if (is_int($col)) $colIdx[$field] = $col;
        else $colIdx[$field] = array_search($col, $headers, true);
    }
    if (!isset($colIdx['email']) || $colIdx['email'] === false) {
        $stats['errors'][] = 'email kolonu mapping zorunlu';
        return $stats;
    }

    $tagSlugs = is_array($opts['tag_slugs'] ?? null) ? $opts['tag_slugs'] : [];
    $listIds = is_array($opts['list_ids'] ?? null) ? array_map('intval', $opts['list_ids']) : [];
    $status = (string)($opts['status'] ?? 'subscribed');
    $source = (string)($opts['source'] ?? 'csv_import');
    $updateExisting = !empty($opts['update_existing']);
    $allowedStatus = ['subscribed', 'unsubscribed', 'bounced', 'complained', 'pending'];
    if (!in_array($status, $allowedStatus, true)) $status = 'subscribed';

    // Tag IDs lookup
    $tagIds = [];
    if ($tagSlugs) {
        $placeholders = implode(',', array_fill(0, count($tagSlugs), '?'));
        $stmt = $db->prepare("SELECT id, slug FROM crm_tags WHERE slug IN ($placeholders)");
        $stmt->execute($tagSlugs);
        foreach ($stmt as $r) $tagIds[$r['slug']] = (int)$r['id'];
    }

    $rowNum = 1;
    $insertStmt = $db->prepare(
        "INSERT INTO crm_contacts (email, first_name, last_name, phone, company, source, status, custom_fields)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
            first_name = COALESCE(NULLIF(VALUES(first_name), ''), crm_contacts.first_name),
            last_name = COALESCE(NULLIF(VALUES(last_name), ''), crm_contacts.last_name),
            phone = COALESCE(NULLIF(VALUES(phone), ''), crm_contacts.phone),
            company = COALESCE(NULLIF(VALUES(company), ''), crm_contacts.company)"
    );
    $tagInsertStmt = $db->prepare("INSERT IGNORE INTO crm_contact_tags (contact_id, tag_id) VALUES (?, ?)");
    $listInsertStmt = $db->prepare("INSERT IGNORE INTO crm_list_contacts (list_id, contact_id) VALUES (?, ?)");
    $emailLookup = $db->prepare("SELECT id FROM crm_contacts WHERE email = ?");

    foreach ($lines as $line) {
        $rowNum++;
        if (trim($line) === '') continue;
        $cols = str_getcsv($line);

        $email = isset($cols[$colIdx['email']]) ? strtolower(trim((string)$cols[$colIdx['email']])) : '';
        if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $stats['skipped']++;
            $stats['errors'][] = "Satır $rowNum: geçersiz email";
            if (count($stats['errors']) > 30) array_shift($stats['errors']);
            continue;
        }

        $firstName = isset($colIdx['first_name'], $cols[$colIdx['first_name']]) ? trim((string)$cols[$colIdx['first_name']]) : '';
        $lastName = isset($colIdx['last_name'], $cols[$colIdx['last_name']]) ? trim((string)$cols[$colIdx['last_name']]) : '';
        $phone = isset($colIdx['phone'], $cols[$colIdx['phone']]) ? trim((string)$cols[$colIdx['phone']]) : '';
        $company = isset($colIdx['company'], $cols[$colIdx['company']]) ? trim((string)$cols[$colIdx['company']]) : '';

        // Var olan kontrolü
        $emailLookup->execute([$email]);
        $existingId = $emailLookup->fetchColumn();

        if ($existingId && !$updateExisting) {
            $stats['skipped']++;
        } else {
            try {
                $insertStmt->execute([$email, $firstName, $lastName, $phone, $company, $source, $status, null]);
                if ($existingId) $stats['updated']++;
                else $stats['inserted']++;
            } catch (Throwable $e) {
                $stats['errors'][] = "Satır $rowNum: " . $e->getMessage();
                $stats['skipped']++;
                continue;
            }
        }

        // Contact ID
        $emailLookup->execute([$email]);
        $contactId = (int)$emailLookup->fetchColumn();
        if (!$contactId) continue;

        // Tag/list ata
        foreach ($tagIds as $tid) {
            try { $tagInsertStmt->execute([$contactId, $tid]); } catch (Throwable $e) {}
        }
        foreach ($listIds as $lid) {
            try { $listInsertStmt->execute([$lid, $contactId]); } catch (Throwable $e) {}
        }
    }

    // Recount
    if ($tagIds) {
        try { $db->exec("UPDATE crm_tags SET contact_count = (SELECT COUNT(*) FROM crm_contact_tags WHERE tag_id = crm_tags.id)"); } catch (Throwable $e) {}
    }
    if ($listIds) {
        try { $db->exec("UPDATE crm_lists SET contact_count = (SELECT COUNT(*) FROM crm_list_contacts WHERE list_id = crm_lists.id) WHERE type = 'static'"); } catch (Throwable $e) {}
    }

    return $stats;
}
}

if (!function_exists('crmExportContactsCsv')) {
/**
 * Filtrelenmiş contact'ları CSV string olarak dön.
 */
function crmExportContactsCsv(PDO $db, array $filters = []): string
{
    $where = [];
    $params = [];
    if (!empty($filters['status'])) {
        $where[] = 'status = ?';
        $params[] = $filters['status'];
    }
    if (!empty($filters['source'])) {
        $where[] = 'source = ?';
        $params[] = $filters['source'];
    }
    if (!empty($filters['min_score'])) {
        $where[] = 'score >= ?';
        $params[] = (int)$filters['min_score'];
    }
    if (!empty($filters['list_id'])) {
        $lid = (int)$filters['list_id'];
        // ÖNEMLİ: Smart (akıllı) listelerin üyeliği crm_list_contacts'ta TUTULMAZ —
        // rules_json'dan canlı hesaplanır. Tip kontrolü yapılmazsa akıllı listeler
        // (örn. otomatik "Açanlar"/"Tıklayanlar") boş CSV döner.
        $listType = null; $listRules = null;
        try {
            $ls = $db->prepare("SELECT type, rules_json FROM crm_lists WHERE id = ? LIMIT 1");
            $ls->execute([$lid]);
            if ($lr = $ls->fetch()) { $listType = $lr['type'] ?? null; $listRules = $lr['rules_json'] ?? null; }
        } catch (Throwable $e) {}

        if ($listType === 'smart') {
            require_once __DIR__ . '/CrmSmartListEngine.php';
            $rules = json_decode((string)$listRules, true) ?: [];
            $built = crmBuildSmartListSql($rules, $db);
            if (!empty($built['where'])) {
                $where[] = 'id IN (SELECT c.id FROM crm_contacts c WHERE ' . $built['where'] . ')';
                $params = array_merge($params, $built['params']);
            }
        } else {
            $where[] = 'id IN (SELECT contact_id FROM crm_list_contacts WHERE list_id = ?)';
            $params[] = $lid;
        }
    }
    if (!empty($filters['tag_slug'])) {
        $where[] = "id IN (SELECT contact_id FROM crm_contact_tags ct
                          JOIN crm_tags t ON t.id = ct.tag_id WHERE t.slug = ?)";
        $params[] = (string)$filters['tag_slug'];
    }
    $whereSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';
    $sql = "SELECT email, first_name, last_name, phone, company, status, source, score, last_activity_at, created_at
            FROM crm_contacts $whereSql ORDER BY id ASC";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);

    $out = fopen('php://temp', 'r+');
    fputcsv($out, ['email','first_name','last_name','phone','company','status','source','score','last_activity_at','created_at']);
    while ($row = $stmt->fetch()) {
        fputcsv($out, [
            $row['email'], $row['first_name'], $row['last_name'], $row['phone'],
            $row['company'], $row['status'], $row['source'], $row['score'],
            $row['last_activity_at'], $row['created_at']
        ]);
    }
    rewind($out);
    return stream_get_contents($out);
}
}
