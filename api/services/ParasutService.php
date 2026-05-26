<?php
// api/services/ParasutService.php
// Paraşüt API v4 — OAuth2 + JSON:API REST helper.
//   - Token cache settings tablosunda (access + refresh + expires_at).
//   - Password grant (refresh fail ederse fallback).
//   - findOrCreateContact, createSalesInvoice, e-Arşiv/e-Fatura tetik.
// Tüm public fonksiyonlar Throwable atabilir; caller try/catch ile sarmalı.

if (!defined('PARASUT_BASE_URL'))   define('PARASUT_BASE_URL',  'https://api.parasut.com/v4');
if (!defined('PARASUT_OAUTH_URL'))  define('PARASUT_OAUTH_URL', 'https://api.parasut.com/oauth/token');
if (!defined('PARASUT_REDIRECT'))   define('PARASUT_REDIRECT',  'urn:ietf:wg:oauth:2.0:oob');

// -----------------------------------------------------------------------------
// OAuth — access_token döner; expired ise refresh, fail ederse password grant
// -----------------------------------------------------------------------------
function parasutGetAccessToken(PDO $db): string
{
    $token = (string)getSetting($db, 'parasut_access_token', '');
    $exp   = (string)getSetting($db, 'parasut_token_expires_at', '');
    if ($token !== '' && $exp !== '' && strtotime($exp) > time() + 60) {
        return $token;
    }

    $clientId  = (string)getSetting($db, 'parasut_client_id', '');
    $secret    = (string)getSetting($db, 'parasut_client_secret', '');
    $email     = (string)getSetting($db, 'parasut_email', '');
    $password  = (string)getSetting($db, 'parasut_password', '');
    $refresh   = (string)getSetting($db, 'parasut_refresh_token', '');

    if ($clientId === '' || $secret === '') {
        throw new RuntimeException('Paraşüt client_id/client_secret eksik (Admin > Ayarlar > Muhasebe).');
    }

    // Önce refresh token dene
    if ($refresh !== '') {
        $resp = parasutOAuthCall([
            'grant_type'    => 'refresh_token',
            'refresh_token' => $refresh,
            'client_id'     => $clientId,
            'client_secret' => $secret,
            'redirect_uri'  => PARASUT_REDIRECT,
        ]);
        if (!empty($resp['access_token'])) {
            parasutPersistToken($db, $resp);
            return $resp['access_token'];
        }
    }

    // Refresh yoksa veya başarısızsa → password grant
    if ($email === '' || $password === '') {
        throw new RuntimeException('Paraşüt e-posta/şifre eksik (Admin > Ayarlar > Muhasebe).');
    }
    $resp = parasutOAuthCall([
        'grant_type'    => 'password',
        'client_id'     => $clientId,
        'client_secret' => $secret,
        'username'      => $email,
        'password'      => $password,
        'redirect_uri'  => PARASUT_REDIRECT,
    ]);
    if (empty($resp['access_token'])) {
        $err = $resp['error_description'] ?? ($resp['error'] ?? 'Bilinmeyen OAuth hatası');
        throw new RuntimeException('Paraşüt OAuth başarısız: ' . $err);
    }
    parasutPersistToken($db, $resp);
    return $resp['access_token'];
}

function parasutOAuthCall(array $form): array
{
    $ch = curl_init(PARASUT_OAUTH_URL);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => http_build_query($form),
        CURLOPT_HTTPHEADER     => ['Content-Type: application/x-www-form-urlencoded', 'Accept: application/json'],
        CURLOPT_TIMEOUT        => 10,
        CURLOPT_CONNECTTIMEOUT => 5,
    ]);
    $body = curl_exec($ch);
    $err  = curl_error($ch);
    curl_close($ch);
    if ($body === false) {
        throw new RuntimeException('Paraşüt OAuth curl hatası: ' . $err);
    }
    $j = json_decode($body, true) ?: [];
    return $j;
}

function parasutPersistToken(PDO $db, array $resp): void
{
    $expiresIn = (int)($resp['expires_in'] ?? 7200);
    $expiresAt = date('Y-m-d H:i:s', time() + $expiresIn);
    parasutSaveSetting($db, 'parasut_access_token',     (string)($resp['access_token'] ?? ''));
    parasutSaveSetting($db, 'parasut_refresh_token',    (string)($resp['refresh_token'] ?? ''));
    parasutSaveSetting($db, 'parasut_token_expires_at', $expiresAt);
}

function parasutSaveSetting(PDO $db, string $key, string $value): void
{
    $st = $db->prepare(
        "INSERT INTO settings (setting_key, setting_value, setting_group)
         VALUES (?, ?, 'accounting')
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)"
    );
    $st->execute([$key, $value]);
}

// -----------------------------------------------------------------------------
// REST — JSON:API çağrı yardımcısı
// -----------------------------------------------------------------------------
function parasutRequest(PDO $db, string $method, string $path, ?array $body = null, array $extraHeaders = []): array
{
    $token = parasutGetAccessToken($db);
    $url = PARASUT_BASE_URL . $path;

    $headers = array_merge([
        'Authorization: Bearer ' . $token,
        'Accept: application/json',
        'Content-Type: application/json',
    ], $extraHeaders);

    $ch = curl_init($url);
    $opts = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST  => $method,
        CURLOPT_HTTPHEADER     => $headers,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_CONNECTTIMEOUT => 5,
    ];
    if ($body !== null && in_array($method, ['POST', 'PUT', 'PATCH'], true)) {
        $opts[CURLOPT_POSTFIELDS] = json_encode($body, JSON_UNESCAPED_UNICODE);
    }
    curl_setopt_array($ch, $opts);
    $raw = curl_exec($ch);
    $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    if ($raw === false) {
        throw new RuntimeException('Paraşüt curl hatası: ' . $err);
    }
    $j = json_decode($raw, true);
    if (!is_array($j)) $j = ['raw' => $raw];
    if ($code >= 400) {
        $msg = $j['errors'][0]['detail'] ?? ($j['errors'][0]['title'] ?? ('HTTP ' . $code));
        throw new RuntimeException('Paraşüt API hatası (' . $code . '): ' . $msg);
    }
    return $j;
}

// -----------------------------------------------------------------------------
// /v4/me — company_id keşfi
// -----------------------------------------------------------------------------
function parasutMe(PDO $db): array
{
    $resp = parasutRequest($db, 'GET', '/me');
    $companyId = null;
    foreach ($resp['data']['relationships']['companies']['data'] ?? [] as $c) {
        $companyId = (int)$c['id'];
        break;
    }
    if ($companyId === null && !empty($resp['included'])) {
        foreach ($resp['included'] as $inc) {
            if (($inc['type'] ?? '') === 'companies') { $companyId = (int)$inc['id']; break; }
        }
    }
    return ['raw' => $resp, 'company_id' => $companyId, 'name' => $resp['data']['attributes']['name'] ?? null];
}

function parasutCompanyId(PDO $db): int
{
    $cid = (int)getSetting($db, 'parasut_company_id', 0);
    if ($cid > 0) return $cid;
    $me = parasutMe($db);
    if (!empty($me['company_id'])) {
        parasutSaveSetting($db, 'parasut_company_id', (string)$me['company_id']);
        return (int)$me['company_id'];
    }
    throw new RuntimeException('Paraşüt company_id bulunamadı — Ayarlar > Muhasebe\'den manuel gir.');
}

// -----------------------------------------------------------------------------
// Müşteri bul/oluştur
// -----------------------------------------------------------------------------
function parasutFindOrCreateContact(PDO $db, array $customer): int
{
    $cid = parasutCompanyId($db);
    $email = trim((string)($customer['email'] ?? ''));

    // E-posta ile ara
    if ($email !== '') {
        $resp = parasutRequest($db, 'GET', "/{$cid}/contacts?filter[email]=" . rawurlencode($email) . '&page[size]=1');
        if (!empty($resp['data'][0]['id'])) {
            return (int)$resp['data'][0]['id'];
        }
    }

    // Yoksa oluştur
    $isCompany = ($customer['customer_type'] ?? 'individual') === 'company';
    $isForeign = !empty($customer['is_foreign']);
    $attrs = [
        'name'            => (string)($customer['name'] ?? ''),
        'short_name'      => (string)($customer['name'] ?? ''),
        'contact_type'    => $isCompany ? 'company' : 'person',
        'account_type'    => 'customer', // Paraşüt: zorunlu (customer | supplier)
        'email'           => $email,
        'phone'           => (string)($customer['phone'] ?? ''),
        'address'         => (string)($customer['address'] ?? ''),
    ];
    if ($isForeign) {
        // Yabancı müşteri — TC/Vergi YOK; Paraşüt bunu normal kontak olarak kabul eder
        // Address'e ülke bilgisi eklenebilir (opsiyonel)
    } elseif ($isCompany) {
        $attrs['tax_office'] = (string)($customer['tax_office'] ?? '');
        $attrs['tax_number'] = (string)($customer['tax_number'] ?? '');
    } else {
        // Bireysel: TC kimlik no tax_number alanına yazılır (Paraşüt bireysel için bunu kabul eder)
        $attrs['tax_number'] = (string)($customer['national_id'] ?? '');
    }

    $payload = ['data' => ['type' => 'contacts', 'attributes' => $attrs]];
    $resp = parasutRequest($db, 'POST', "/{$cid}/contacts", $payload);
    if (empty($resp['data']['id'])) {
        throw new RuntimeException('Paraşüt müşteri oluşturulamadı.');
    }
    return (int)$resp['data']['id'];
}

// -----------------------------------------------------------------------------
// Generic "Hizmet" ürünü bul/oluştur — sales_invoice detayları için referans
// -----------------------------------------------------------------------------
function parasutGenericProductId(PDO $db): int
{
    $cached = (int)getSetting($db, 'parasut_generic_product_id', 0);
    if ($cached > 0) return $cached;

    $cid = parasutCompanyId($db);
    // Mevcut ürünü ara
    try {
        $resp = parasutRequest($db, 'GET', "/{$cid}/products?filter[name]=" . rawurlencode('KhilonFast Hizmet') . '&page[size]=1');
        if (!empty($resp['data'][0]['id'])) {
            $id = (int)$resp['data'][0]['id'];
            parasutSaveSetting($db, 'parasut_generic_product_id', (string)$id);
            return $id;
        }
    } catch (Throwable $e) { /* ignore, oluşturmaya geç */ }

    // Yoksa oluştur
    $resp = parasutRequest($db, 'POST', "/{$cid}/products", [
        'data' => [
            'type' => 'products',
            'attributes' => [
                'name' => 'KhilonFast Hizmet',
                'code' => 'KHF-HIZMET',
                'vat_rate' => 20,
                'list_price' => 0,
                'currency' => 'TRL',
                'unit' => 'Adet',
                'product_type' => 'service',
            ],
        ],
    ]);
    $id = (int)($resp['data']['id'] ?? 0);
    if ($id <= 0) {
        throw new RuntimeException('Paraşüt generic product oluşturulamadı.');
    }
    parasutSaveSetting($db, 'parasut_generic_product_id', (string)$id);
    return $id;
}

// -----------------------------------------------------------------------------
// Satış faturası oluştur + e-Arşiv / e-Fatura
// -----------------------------------------------------------------------------
function parasutCreateSalesInvoice(PDO $db, int $contactId, array $lines, array $meta): array
{
    $cid = parasutCompanyId($db);
    $productId = parasutGenericProductId($db);

    $details = [];
    foreach ($lines as $line) {
        $details[] = [
            'type' => 'sales_invoice_details',
            'attributes' => [
                'description'   => (string)($line['name'] ?? 'Hizmet'),
                'quantity'      => (string)($line['quantity'] ?? 1),
                'unit_price'    => (string)($line['unit_price'] ?? 0),
                'vat_rate'      => (string)($line['vat_rate'] ?? 20),
                'discount_type' => 'percentage',
                'discount_value'=> 0,
            ],
            'relationships' => [
                'product' => ['data' => ['type' => 'products', 'id' => (string)$productId]],
            ],
        ];
    }

    $payload = [
        'data' => [
            'type' => 'sales_invoices',
            'attributes' => [
                'item_type'    => 'invoice',
                'description'  => (string)($meta['description'] ?? ('Sipariş #' . ($meta['order_number'] ?? ''))),
                'issue_date'   => date('Y-m-d'),
                'currency'     => (string)($meta['currency'] ?? 'TRL'),
                'order_no'     => (string)($meta['order_number'] ?? ''),
            ],
            'relationships' => [
                'contact' => ['data' => ['type' => 'contacts', 'id' => $contactId]],
                'details' => ['data' => $details],
            ],
        ],
    ];

    $idem = ['Idempotency-Key: order-' . ($meta['order_id'] ?? '0') . '-' . ($meta['attempt'] ?? 1)];
    $resp = parasutRequest($db, 'POST', "/{$cid}/sales_invoices", $payload, $idem);
    $invoiceId = (int)($resp['data']['id'] ?? 0);
    if ($invoiceId <= 0) {
        throw new RuntimeException('Paraşüt satış faturası ID alınamadı.');
    }

    // e-Arşiv (bireysel) veya e-Fatura (kurumsal). Hata olursa sales_invoice yine durur.
    // Yabancı müşteri (EN site) için e-belge oluşturulmaz — sadece normal sales_invoice kalır.
    $isCompany = ($meta['customer_type'] ?? 'individual') === 'company';
    $isForeign = !empty($meta['is_foreign']);
    $invoiceType = 'sales_invoice';
    if ($isForeign) {
        return ['invoice_id' => $invoiceId, 'invoice_type' => 'sales_invoice'];
    }
    try {
        if ($isCompany) {
            parasutRequest($db, 'POST', "/{$cid}/e_invoices", [
                'data' => [
                    'type' => 'e_invoices',
                    'attributes' => ['vat_withholding_code' => '', 'note' => ''],
                    'relationships' => [
                        'invoice' => ['data' => ['type' => 'sales_invoices', 'id' => (string)$invoiceId]],
                    ],
                ],
            ]);
            $invoiceType = 'e_invoice';
        } else {
            parasutRequest($db, 'POST', "/{$cid}/e_archives", [
                'data' => [
                    'type' => 'e_archives',
                    'attributes' => ['vat_withholding_code' => '', 'note' => ''],
                    'relationships' => [
                        'sales_invoice' => ['data' => ['type' => 'sales_invoices', 'id' => (string)$invoiceId]],
                    ],
                ],
            ]);
            $invoiceType = 'e_archive';
        }
    } catch (Throwable $e) {
        // e-belge başarısız — sales_invoice DURUR; admin Paraşüt panelinden elle dönüştürebilir.
        error_log('[parasut e-doc] ' . $e->getMessage() . ' (invoice ' . $invoiceId . ')');
    }

    return ['invoice_id' => $invoiceId, 'invoice_type' => $invoiceType];
}

// -----------------------------------------------------------------------------
// Test — admin Ayarlar'daki "Bağlantıyı Test Et" butonu
// -----------------------------------------------------------------------------
function parasutTestConnection(PDO $db): array
{
    $token = parasutGetAccessToken($db); // password grant fırsat
    $me = parasutMe($db);
    if (!empty($me['company_id'])) {
        parasutSaveSetting($db, 'parasut_company_id', (string)$me['company_id']);
    }
    return [
        'ok' => true,
        'company_id' => $me['company_id'] ?? null,
        'company_name' => $me['name'] ?? null,
        'token_prefix' => substr($token, 0, 12) . '…',
    ];
}
