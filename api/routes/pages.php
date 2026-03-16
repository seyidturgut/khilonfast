<?php
// api/routes/pages.php

$db = Database::getInstance();

// Public: GET /api/pages/slug/:slug?lang=tr|en
if ($method === 'GET' && $action === 'slug' && !empty($id)) {
    $slug = urldecode((string)$id);
    $lang = strtolower(trim((string)($_GET['lang'] ?? 'tr')));
    if ($lang !== 'en') $lang = 'tr';

    $stmt = $db->prepare("SELECT id, slug FROM cms_pages WHERE slug = ? LIMIT 1");
    $stmt->execute([$slug]);
    $page = $stmt->fetch();
    if (!$page) {
        sendResponse(['error' => 'Page not found'], 404);
    }

    $stmt = $db->prepare(
        "SELECT content_json
         FROM cms_page_contents
         WHERE page_id = ? AND is_published = 1
         ORDER BY id DESC
         LIMIT 1"
    );
    $stmt->execute([(int)$page['id']]);
    $contentRow = $stmt->fetch();
    if (!$contentRow) {
        sendResponse(['content' => null]);
    }

    $raw = $contentRow['content_json'] ?? null;
    $content = null;
    if (is_array($raw)) {
        $content = $raw[$lang] ?? $raw;
    } else {
        $decoded = json_decode((string)$raw, true);
        if (is_array($decoded)) {
            if ($lang === 'en' && !isset($decoded['en']) && isset($decoded['tr'])) {
                error_log(sprintf('Localization fallback used for CMS page "%s" (page_id=%d)', $slug, (int) $page['id']));
            }
            $content = $decoded[$lang] ?? $decoded;
        }
    }

    sendResponse(['content' => $content]);
}

sendResponse(['error' => 'Action not found'], 404);
