<?php
require_once __DIR__ . '/api/config/db.php';

$db = Database::getInstance();

function columnExists(PDO $db, string $table, string $column): bool
{
    $stmt = $db->prepare(
        'SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?'
    );
    $stmt->execute([$table, $column]);
    return (int) $stmt->fetchColumn() > 0;
}

function ensureColumn(PDO $db, string $table, string $column, string $definition): void
{
    if (!columnExists($db, $table, $column)) {
        $db->exec(sprintf('ALTER TABLE %s ADD COLUMN %s %s', $table, $column, $definition));
        echo "Added column {$table}.{$column}\n";
    }
}

function normalizeSlugValue(?string $slug): string
{
    $value = trim((string) $slug);
    if ($value === '') {
        return '';
    }

    $value = preg_replace('#^https?://[^/]+/#i', '', $value);
    $value = preg_replace('#^/+|/+$#', '', $value);
    return preg_replace('#/+#', '/', $value);
}

function slugPrefixByCategory(string $category, string $lang): string
{
    $cat = strtolower(trim($category));
    if (in_array($cat, ['sektorler', 'sectoral', 'sector'], true)) {
        return $lang === 'en' ? 'sectoral-services' : 'sektorel-hizmetler';
    }
    if (in_array($cat, ['egitimler', 'egitim', 'training', 'trainings'], true)) {
        return $lang === 'en' ? 'trainings' : 'egitimler';
    }
    return $lang === 'en' ? 'services' : 'hizmetlerimiz';
}

function frontendSlugMapByKey(): array
{
    return [
        'service-gtm' => ['tr' => 'hizmetlerimiz/go-to-market-stratejisi', 'en' => 'services/go-to-market-strategy'],
        'service-content-strategy' => ['tr' => 'hizmetlerimiz/icerik-stratejisi', 'en' => 'services/content-strategy'],
        'service-idm' => ['tr' => 'hizmetlerimiz/butunlesik-dijital-pazarlama', 'en' => 'services/integrated-digital-marketing'],
        'service-integrated-marketing' => ['tr' => 'hizmetlerimiz/butunlesik-dijital-pazarlama', 'en' => 'services/integrated-digital-marketing'],
        'service-google-ads' => ['tr' => 'hizmetlerimiz/google-ads', 'en' => 'services/google-ads'],
        'service-social-ads' => ['tr' => 'hizmetlerimiz/sosyal-medya-reklamciligi', 'en' => 'services/social-media-advertising'],
        'service-seo' => ['tr' => 'hizmetlerimiz/seo-yonetimi', 'en' => 'services/seo-management'],
        'service-content-production' => ['tr' => 'hizmetlerimiz/icerik-uretimi', 'en' => 'services/content-production'],
        'service-b2b-email' => ['tr' => 'hizmetlerimiz/b2b-email-pazarlama', 'en' => 'services/b2b-email-marketing'],
        'service-b2b-360' => ['tr' => 'sektorel-hizmetler/b2b-firmalari-icin-360-pazarlama-yonetimi', 'en' => 'sectoral-services/b2b-companies-360-marketing-management'],
        'service-payment-systems' => ['tr' => 'sektorel-hizmetler/odeme-sistemleri-firmalari-icin-360-pazarlama-yonetimi', 'en' => 'sectoral-services/payment-systems-companies-360-marketing-management'],
        'service-industrial-food' => ['tr' => 'sektorel-hizmetler/endustriyel-gida-sef-cozumleri-firmalari-icin-360-pazarlama-yonetimi', 'en' => 'sectoral-services/industrial-food-and-chef-solutions-companies-360-marketing-management'],
        'service-fintech-360' => ['tr' => 'sektorel-hizmetler/fintech-firmalari-icin-360-pazarlama-yonetimi', 'en' => 'sectoral-services/fintech-companies-360-marketing-management'],
        'service-tech-software' => ['tr' => 'sektorel-hizmetler/teknoloji-yazilim-firmalari-icin-360-pazarlama-yonetimi', 'en' => 'sectoral-services/technology-and-software-companies-360-marketing-management'],
        'service-energy' => ['tr' => 'sektorel-hizmetler/enerji-firmalari-icin-360-pazarlama-yonetimi', 'en' => 'sectoral-services/energy-companies-360-marketing-management'],
        'service-interior-design' => ['tr' => 'sektorel-hizmetler/ofis-kurumsal-ic-tasarim-firmalari-icin-360-pazarlama-yonetimi', 'en' => 'sectoral-services/office-and-corporate-interior-design-companies-360-marketing-management'],
        'service-fleet-rental' => ['tr' => 'sektorel-hizmetler/filo-kiralama-firmalari-icin-360-pazarlama-yonetimi', 'en' => 'sectoral-services/fleet-rental-companies-360-marketing-management'],
        'service-manufacturing' => ['tr' => 'sektorel-hizmetler/uretim-firmalari-icin-360-pazarlama-yonetimi', 'en' => 'sectoral-services/manufacturing-companies-360-marketing-management'],
        'service-maestro-ai' => ['tr' => 'urunler/maestro-ai', 'en' => 'products/maestro-ai'],
        'service-eye-tracking' => ['tr' => 'urunler/eye-tracking-reklam-analizi', 'en' => 'products/eye-tracking-ad-analysis'],
    ];
}

function slugifyEnglish(string $text): string
{
    $ascii = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $text);
    $ascii = strtolower((string) $ascii);
    $ascii = preg_replace('/[^a-z0-9]+/', '-', $ascii);
    $ascii = trim((string) $ascii, '-');
    return $ascii !== '' ? $ascii : 'item';
}

function translatePrefixToEnglish(string $slug): string
{
    $translated = normalizeSlugValue($slug);
    $translated = preg_replace('#^hizmetlerimiz/#', 'services/', $translated);
    $translated = preg_replace('#^sektorel-hizmetler/#', 'sectoral-services/', $translated);
    $translated = preg_replace('#^egitimler/#', 'trainings/', $translated);
    $translated = preg_replace('#^urunler/#', 'products/', $translated);
    return $translated;
}

function getDeeplConfig(PDO $db): array
{
    $stmt = $db->query("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('deepl_api_key', 'deepl_plan_type')");
    $settings = [];
    foreach ($stmt->fetchAll() as $row) {
        $settings[$row['setting_key']] = $row['setting_value'];
    }

    $apiKey = trim((string) ($settings['deepl_api_key'] ?? ''));
    $planType = trim((string) ($settings['deepl_plan_type'] ?? 'free'));
    $endpoint = $planType === 'pro' ? 'https://api.deepl.com/v2/translate' : 'https://api-free.deepl.com/v2/translate';

    return [$apiKey, $endpoint];
}

function translateText(string $text, string $apiKey, string $endpoint, array &$cache): string
{
    $trimmed = trim($text);
    if ($trimmed === '' || $apiKey === '') {
        return $text;
    }

    if (isset($cache[$trimmed])) {
        return $cache[$trimmed];
    }

    if (preg_match('#^(https?://|/uploads/|/images/|[0-9 .,%:+-]+)$#i', $trimmed)) {
        $cache[$trimmed] = $text;
        return $text;
    }

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $endpoint,
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_POSTFIELDS => http_build_query([
            'auth_key' => $apiKey,
            'text' => [$trimmed],
            'target_lang' => 'EN'
        ])
    ]);

    $response = curl_exec($ch);
    $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);

    if ($httpCode !== 200 || !$response) {
        $cache[$trimmed] = $text;
        return $text;
    }

    $decoded = json_decode($response, true);
    $translated = $decoded['translations'][0]['text'] ?? $text;
    $cache[$trimmed] = $translated;
    return $translated;
}

function translateValue($value, string $apiKey, string $endpoint, array &$cache)
{
    if (is_string($value)) {
        return translateText($value, $apiKey, $endpoint, $cache);
    }

    if (is_array($value)) {
        $translated = [];
        foreach ($value as $key => $item) {
            $translated[$key] = translateValue($item, $apiKey, $endpoint, $cache);
        }
        return $translated;
    }

    return $value;
}

function resolveEnglishSlug(array $product, PDO $db): string
{
    $map = frontendSlugMapByKey();
    $productKey = trim((string) ($product['product_key'] ?? ''));
    if ($productKey !== '' && isset($map[$productKey])) {
        return $map[$productKey]['en'];
    }

    $current = normalizeSlugValue((string) ($product['slug_en'] ?? ''));
    if ($current !== '') {
        return $current;
    }

    $translatedPrefix = translatePrefixToEnglish((string) ($product['slug'] ?? ''));
    if ($translatedPrefix !== '' && $translatedPrefix !== normalizeSlugValue((string) ($product['slug'] ?? ''))) {
        return $translatedPrefix;
    }

    if (!empty($product['parent_id'])) {
        $stmt = $db->prepare('SELECT product_key, slug_en FROM products WHERE id = ? LIMIT 1');
        $stmt->execute([(int) $product['parent_id']]);
        $parent = $stmt->fetch();
        if ($parent) {
            $parentSlug = normalizeSlugValue((string) ($parent['slug_en'] ?? ''));
            $parentKey = trim((string) ($parent['product_key'] ?? ''));
            $leaf = $productKey;
            if ($parentKey !== '' && str_starts_with($productKey, $parentKey . '-')) {
                $leaf = substr($productKey, strlen($parentKey) + 1);
            }
            $leaf = slugifyEnglish($leaf);
            if ($parentSlug !== '') {
                return $parentSlug . '/' . $leaf;
            }
        }
    }

    $prefix = slugPrefixByCategory((string) ($product['category'] ?? ''), 'en');
    $leafSource = (string) ($product['name_en'] ?? $product['name'] ?? $productKey);
    return $prefix . '/' . slugifyEnglish($leafSource);
}

try {
    echo "Starting localization migration...\n";

    $productColumns = [
        'name_en' => 'VARCHAR(255) DEFAULT NULL AFTER name',
        'description_en' => 'TEXT DEFAULT NULL AFTER description',
        'features_en' => 'TEXT DEFAULT NULL AFTER features',
        'slug_en' => 'VARCHAR(255) DEFAULT NULL AFTER slug',
        'meta_title_en' => 'VARCHAR(255) DEFAULT NULL',
        'meta_description_en' => 'TEXT DEFAULT NULL',
        'hero_vimeo_id_en' => 'VARCHAR(100) DEFAULT NULL',
        'hero_image_en' => 'VARCHAR(255) DEFAULT NULL'
    ];

    foreach ($productColumns as $column => $definition) {
        ensureColumn($db, 'products', $column, $definition);
    }

    [$deeplApiKey, $deeplEndpoint] = getDeeplConfig($db);
    $translationCache = [];

    $products = $db->query('SELECT * FROM products ORDER BY id ASC')->fetchAll();
    $productStmt = $db->prepare(
        'UPDATE products
         SET name_en = ?, description_en = ?, features_en = ?, slug_en = ?, meta_title_en = ?, meta_description_en = ?, hero_vimeo_id_en = ?, hero_image_en = ?
         WHERE id = ?'
    );

    $updatedProducts = 0;
    foreach ($products as $product) {
        $nameEn = trim((string) ($product['name_en'] ?? '')) ?: translateText((string) ($product['name'] ?? ''), $deeplApiKey, $deeplEndpoint, $translationCache);
        $descriptionEn = trim((string) ($product['description_en'] ?? '')) ?: translateText((string) ($product['description'] ?? ''), $deeplApiKey, $deeplEndpoint, $translationCache);
        $featuresEn = trim((string) ($product['features_en'] ?? '')) ?: translateText((string) ($product['features'] ?? ''), $deeplApiKey, $deeplEndpoint, $translationCache);
        $metaTitleEn = trim((string) ($product['meta_title_en'] ?? '')) ?: translateText((string) ($product['meta_title'] ?? ''), $deeplApiKey, $deeplEndpoint, $translationCache);
        $metaDescriptionEn = trim((string) ($product['meta_description_en'] ?? '')) ?: translateText((string) ($product['meta_description'] ?? ''), $deeplApiKey, $deeplEndpoint, $translationCache);
        $heroVimeoEn = trim((string) ($product['hero_vimeo_id_en'] ?? '')) ?: (string) ($product['hero_vimeo_id'] ?? '');
        $heroImageEn = trim((string) ($product['hero_image_en'] ?? '')) ?: (string) ($product['hero_image'] ?? '');
        $slugEn = resolveEnglishSlug(array_merge($product, ['name_en' => $nameEn]), $db);

        $hasChanges =
            $nameEn !== (string) ($product['name_en'] ?? '') ||
            $descriptionEn !== (string) ($product['description_en'] ?? '') ||
            $featuresEn !== (string) ($product['features_en'] ?? '') ||
            $slugEn !== normalizeSlugValue((string) ($product['slug_en'] ?? '')) ||
            $metaTitleEn !== (string) ($product['meta_title_en'] ?? '') ||
            $metaDescriptionEn !== (string) ($product['meta_description_en'] ?? '') ||
            $heroVimeoEn !== (string) ($product['hero_vimeo_id_en'] ?? '') ||
            $heroImageEn !== (string) ($product['hero_image_en'] ?? '');

        if (!$hasChanges) {
            continue;
        }

        $productStmt->execute([
            $nameEn !== '' ? $nameEn : null,
            $descriptionEn !== '' ? $descriptionEn : null,
            $featuresEn !== '' ? $featuresEn : null,
            $slugEn !== '' ? $slugEn : null,
            $metaTitleEn !== '' ? $metaTitleEn : null,
            $metaDescriptionEn !== '' ? $metaDescriptionEn : null,
            $heroVimeoEn !== '' ? $heroVimeoEn : null,
            $heroImageEn !== '' ? $heroImageEn : null,
            (int) $product['id']
        ]);
        $updatedProducts++;
    }
    echo "Updated {$updatedProducts} products.\n";

    $pageRows = $db->query('SELECT id, content_json FROM cms_page_contents ORDER BY id ASC')->fetchAll();
    $pageStmt = $db->prepare('UPDATE cms_page_contents SET content_json = ? WHERE id = ?');
    $updatedPages = 0;

    foreach ($pageRows as $row) {
        $decoded = json_decode((string) $row['content_json'], true);
        if (!is_array($decoded)) {
            continue;
        }

        $next = $decoded;
        if (isset($decoded['tr']) && !isset($decoded['en'])) {
            $next['en'] = translateValue($decoded['tr'], $deeplApiKey, $deeplEndpoint, $translationCache);
        } elseif (!isset($decoded['tr']) && !isset($decoded['en'])) {
            $next = [
                'tr' => $decoded,
                'en' => translateValue($decoded, $deeplApiKey, $deeplEndpoint, $translationCache)
            ];
        }

        if ($next !== $decoded) {
            $pageStmt->execute([json_encode($next, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), (int) $row['id']]);
            $updatedPages++;
        }
    }
    echo "Updated {$updatedPages} CMS page content rows.\n";
    echo "Localization migration completed successfully.\n";
} catch (Throwable $e) {
    fwrite(STDERR, "Localization migration failed: " . $e->getMessage() . "\n");
    exit(1);
}
