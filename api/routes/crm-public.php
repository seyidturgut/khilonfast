<?php
// api/routes/crm-public.php
// CRM public endpoints — webhook (Brevo), tracking pixel, opt-in.
// Admin auth GEREKMEZ. Webhook signature ile doğrulanır.

set_exception_handler(function (Throwable $e) {
    header('Content-Type: application/json', true, 500);
    echo json_encode(['error' => 'PHP Exception: ' . $e->getMessage()]);
    exit;
});

require_once __DIR__ . '/../utils.php';
require_once __DIR__ . '/../services/CrmSchema.php';
require_once __DIR__ . '/../services/CrmActivityRecorder.php';
require_once __DIR__ . '/../services/CrmScoringEngine.php';

$db = Database::getInstance();

// Schema bootstrap (idempotent)
try { ensureCrmContactsSchema($db); } catch (Throwable $e) { error_log('[crm-public] schema: ' . $e->getMessage()); }

$subAction = $routes[3] ?? '';

// ═══ /api/crm-public/webhook/brevo ═══════════════════════════════════════════
if ($action === 'webhook' && $id === 'brevo' && $method === 'POST') {
    // Brevo signature doğrulama (opsiyonel — settings.brevo_webhook_secret varsa kontrol eder)
    try {
        $stmt = $db->query("SELECT setting_value FROM settings WHERE setting_key = 'brevo_webhook_secret' LIMIT 1");
        $secret = (string)($stmt->fetchColumn() ?: '');
        if ($secret !== '') {
            $sig = $_SERVER['HTTP_X_BREVO_SIGNATURE'] ?? $_SERVER['HTTP_X_SIGNATURE'] ?? '';
            $rawBody = file_get_contents('php://input') ?: '';
            $expected = hash_hmac('sha256', $rawBody, $secret);
            if (!hash_equals($expected, $sig)) {
                // Test/sandbox modunda lognla, ama 401'le reddet
                error_log('[brevo-webhook] signature mismatch');
                sendResponse(['error' => 'Invalid signature'], 401);
            }
        }
    } catch (Throwable $e) {}

    $payload = getJsonBody();
    // Brevo bazen tek olay, bazen array gönderiyor — her ikisini de destekle
    $events = isset($payload['event']) ? [$payload] : (is_array($payload) ? $payload : []);
    if (!$events) sendResponse(['ok' => true, 'processed' => 0]);

    $processed = 0;
    foreach ($events as $e) {
        $event = strtolower((string)($e['event'] ?? $e['type'] ?? ''));
        $email = strtolower(trim((string)($e['email'] ?? '')));
        if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL) || $event === '') continue;

        // Brevo event normalize
        $normalized = $event;
        if (strpos($event, 'open') !== false) $normalized = 'opened';
        elseif (strpos($event, 'click') !== false) $normalized = 'clicked';
        elseif (strpos($event, 'hard_bounce') !== false) $normalized = 'hard_bounce';
        elseif (strpos($event, 'soft_bounce') !== false) $normalized = 'soft_bounce';
        elseif (strpos($event, 'bounce') !== false) $normalized = 'bounced';
        elseif (strpos($event, 'spam') !== false || strpos($event, 'complaint') !== false) $normalized = 'complaint';
        elseif (strpos($event, 'unsubscribe') !== false) $normalized = 'unsubscribed';
        elseif (strpos($event, 'deliver') !== false) $normalized = 'delivered';
        elseif (strpos($event, 'block') !== false) $normalized = 'blocked';

        $contactId = crmFindContactIdByEmail($db, $email);
        // Yoksa otomatik kişi yarat (anonymous webhook tetiklenebilir)
        if (!$contactId) {
            try {
                $stmt = $db->prepare("INSERT IGNORE INTO crm_contacts (email, source, status) VALUES (?, 'webhook', 'subscribed')");
                $stmt->execute([$email]);
                $contactId = crmFindContactIdByEmail($db, $email);
            } catch (Throwable $ex) {}
        }

        // Tracking insert — DB ŞİŞME ÖNLEMİ:
        //  - 'request' eventi HİÇ saklanmaz (satırların ~1/3'ü, analitik değeri yok; gönderim
        //    bilgisi zaten crm_campaign_recipients.sent_at'ta).
        //  - raw_payload (ham webhook JSON, ~600B/satır = boyutun yarısı) sadece SORUN-TEŞHİS
        //    eventlerinde saklanır (bounce/blocked/complaint/deferred). Open/click/delivered
        //    için gereksiz — tüm analitik alanlar ayrı kolonlarda zaten var.
        if ($normalized !== 'request') {
            try {
                $diagnosticEvents = ['hard_bounce', 'soft_bounce', 'bounced', 'blocked', 'complaint', 'deferred', 'error', 'invalid'];
                $storePayload = in_array($normalized, $diagnosticEvents, true) ? json_encode($e) : null;
                $stmt = $db->prepare("INSERT INTO crm_email_tracking
                    (contact_id, email, event, message_id, link_url, reason, ip, user_agent, provider, raw_payload, occurred_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'brevo', ?, ?)");
                $occurredAt = isset($e['date']) ? date('Y-m-d H:i:s', strtotime((string)$e['date'])) : date('Y-m-d H:i:s');
                $stmt->execute([
                    $contactId,
                    $email,
                    $normalized,
                    (string)($e['message-id'] ?? $e['messageId'] ?? '') ?: null,
                    (string)($e['link'] ?? $e['url'] ?? '') ?: null,
                    (string)($e['reason'] ?? '') ?: null,
                    (string)($e['ip'] ?? '') ?: null,
                    substr((string)($e['user_agent'] ?? $e['ua'] ?? ''), 0, 500) ?: null,
                    $storePayload,
                    $occurredAt
                ]);
            } catch (Throwable $ex) { error_log('[brevo-webhook] insert: ' . $ex->getMessage()); }
        }

        // Status side-effect (bounce/complaint/unsubscribe → contact status update)
        if ($contactId) {
            try {
                if (in_array($normalized, ['hard_bounce', 'bounced'], true)) {
                    $db->prepare("UPDATE crm_contacts SET status = 'bounced' WHERE id = ?")->execute([$contactId]);
                } elseif ($normalized === 'complaint' || $normalized === 'spam') {
                    $db->prepare("UPDATE crm_contacts SET status = 'complained' WHERE id = ?")->execute([$contactId]);
                } elseif ($normalized === 'unsubscribed') {
                    $db->prepare("UPDATE crm_contacts SET status = 'unsubscribed' WHERE id = ?")->execute([$contactId]);
                }
            } catch (Throwable $ex) {}
        }

        // Faz 6: campaign_recipients durumu güncelle — SADECE message_id eşleşmesiyle.
        // ÖNEMLİ: Eski "OR contact_id" fallback'i KALDIRILDI — kişinin BAŞKA maillerdeki
        // (otomasyon/hatırlatma) açma/tıklamaları kampanyaya YANLIŞ sayılıyordu.
        // recipients.message_id (Brevo API yanıtı) ile webhook message-id formatı aynı
        // (<...@smtp-relay.mailin.fr>); güvenlik için açılı parantezli/parantezsiz iki varyant denenir.
        try {
            $msgId = trim((string)($e['message-id'] ?? $e['messageId'] ?? ''));
            if ($msgId !== '') {
                $bare = trim($msgId, '<>');
                $mids = array_values(array_unique([$msgId, $bare, '<' . $bare . '>']));
                $ph = implode(',', array_fill(0, count($mids), '?'));
                if ($normalized === 'opened') {
                    $db->prepare("UPDATE crm_campaign_recipients
                                  SET opened_at = COALESCE(opened_at, NOW())
                                  WHERE message_id IN ($ph)")->execute($mids);
                } elseif ($normalized === 'clicked') {
                    // BOT FİLTRESİ: güvenlik tarayıcısı user-agent'ları (python-requests, curl,
                    // scanner botları) kampanyayı "tıklandı" olarak İŞARETLEMEZ. Tracking satırı
                    // yine yazılır (analitik sorguları ayrıca hız-bazlı filtre uygular).
                    $clickUa = strtolower((string)($e['user_agent'] ?? $e['ua'] ?? ''));
                    $isBotUa = $clickUa !== '' && preg_match('/python|curl|wget|bot|crawler|spider|scan|headless|phantom|monitor/', $clickUa);
                    if (!$isBotUa) {
                        $db->prepare("UPDATE crm_campaign_recipients
                                      SET clicked_at = COALESCE(clicked_at, NOW()), opened_at = COALESCE(opened_at, NOW())
                                      WHERE message_id IN ($ph)")->execute($mids);
                    }
                } elseif (in_array($normalized, ['bounced', 'hard_bounce'], true)) {
                    $db->prepare("UPDATE crm_campaign_recipients SET status = 'bounced'
                                  WHERE message_id IN ($ph)")->execute($mids);
                } elseif ($normalized === 'unsubscribed') {
                    $db->prepare("UPDATE crm_campaign_recipients SET status = 'unsubscribed'
                                  WHERE message_id IN ($ph)")->execute($mids);
                }
            }
        } catch (Throwable $e2) {}

        // Activity log
        if ($contactId) {
            $title = '';
            $type = '';
            switch ($normalized) {
                case 'opened':       $title = 'E-posta açıldı'; $type = 'email_opened'; break;
                case 'clicked':      $title = 'E-posta linkine tıkladı'; $type = 'email_clicked'; break;
                case 'bounced':
                case 'hard_bounce':
                case 'soft_bounce':  $title = 'Bounce: ' . ($e['reason'] ?? 'unknown'); $type = 'email_bounced'; break;
                case 'complaint':
                case 'spam':         $title = 'Spam şikayeti'; $type = 'email_spam'; break;
                case 'unsubscribed': $title = 'Listeden çıkış'; $type = 'email_unsubscribed'; break;
                case 'delivered':    $title = 'E-posta teslim'; $type = 'email_delivered'; break;
                default:             $title = 'E-posta olayı: ' . $normalized; $type = 'email_' . $normalized;
            }
            crmRecordActivity($db, $contactId, $type, $title, [
                'ref_type' => 'email_tracking',
                'metadata' => [
                    'event' => $normalized,
                    'link' => $e['link'] ?? null,
                    'message_id' => $e['message-id'] ?? null,
                ]
            ]);
            // Score apply
            crmApplyScore($db, $contactId, $type, [
                'reason' => $title,
                'ref_type' => 'email_tracking',
            ]);
        }
        $processed++;
    }
    sendResponse(['ok' => true, 'processed' => $processed]);
}

// ═══ /api/crm-public/track ═══════════════════════════════════════════════════
// Pixel + JS event endpoint. POST JSON body or GET image pixel.
if ($action === 'track') {
    $isImage = ($method === 'GET' && $id === 'pixel.gif');
    $data = $method === 'POST' ? getJsonBody() : $_GET;

    $url = (string)($data['url'] ?? '');
    $title = substr((string)($data['title'] ?? ''), 0, 240);
    $referrer = (string)($data['referrer'] ?? $_SERVER['HTTP_REFERER'] ?? '');
    $anonId = preg_replace('/[^a-zA-Z0-9_-]/', '', (string)($data['anon_id'] ?? $data['anonymous_id'] ?? ''));
    $sessionId = preg_replace('/[^a-zA-Z0-9_-]/', '', (string)($data['session_id'] ?? ''));
    $email = strtolower(trim((string)($data['email'] ?? '')));
    $duration = isset($data['duration']) ? (int)$data['duration'] : null;
    $customData = isset($data['data']) && is_array($data['data']) ? json_encode($data['data']) : null;

    // Path extraction
    $path = '';
    if ($url) {
        $parsed = @parse_url($url);
        $path = $parsed['path'] ?? '';
    }

    // UTM params
    $utm = [];
    if ($url) {
        $parsed = @parse_url($url);
        if (!empty($parsed['query'])) {
            parse_str($parsed['query'], $q);
            foreach (['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as $k) {
                if (!empty($q[$k])) $utm[$k] = substr((string)$q[$k], 0, 120);
            }
        }
    }

    // Anonymous → contact merge
    $contactId = null;
    if ($email && filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $contactId = crmFindContactIdByEmail($db, $email);
        if (!$contactId) {
            try {
                $db->prepare("INSERT IGNORE INTO crm_contacts (email, source, status) VALUES (?, 'web_track', 'subscribed')")->execute([$email]);
                $contactId = crmFindContactIdByEmail($db, $email);
            } catch (Throwable $e) {}
        }
    }

    if ($url) {
        try {
            $stmt = $db->prepare("INSERT INTO crm_web_visits
                (contact_id, anonymous_id, session_id, url, path, title, referrer,
                 utm_source, utm_medium, utm_campaign, utm_term, utm_content,
                 ip, user_agent, duration_seconds, custom_data)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $contactId,
                $anonId ?: null,
                $sessionId ?: null,
                substr($url, 0, 1024),
                substr($path, 0, 255),
                $title ?: null,
                substr($referrer, 0, 1024) ?: null,
                $utm['utm_source'] ?? null,
                $utm['utm_medium'] ?? null,
                $utm['utm_campaign'] ?? null,
                $utm['utm_term'] ?? null,
                $utm['utm_content'] ?? null,
                $_SERVER['REMOTE_ADDR'] ?? null,
                substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 500),
                $duration,
                $customData
            ]);

            // Activity + score
            if ($contactId) {
                crmRecordActivity($db, $contactId, 'web_page_visited', 'Sayfa ziyaret: ' . ($title ?: $path), [
                    'metadata' => ['url' => $url, 'path' => $path, 'utm' => $utm]
                ]);
                crmApplyScore($db, $contactId, 'web_page_visited', [
                    'reason' => 'Sayfa ziyaret: ' . ($title ?: $path),
                ]);
            }
        } catch (Throwable $e) { error_log('[crm-track]: ' . $e->getMessage()); }
    }

    if ($isImage) {
        // 1x1 transparent GIF
        header('Content-Type: image/gif');
        header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
        echo base64_decode('R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==');
        exit;
    }
    sendResponse(['ok' => true, 'contact_id' => $contactId]);
}

// ═══ /api/crm-public/track.js — public pixel script ═════════════════════════
if ($action === 'track.js' && $method === 'GET') {
    header('Content-Type: application/javascript; charset=utf-8');
    header('Cache-Control: public, max-age=3600');
    $apiBase = rtrim((string)(defined('API_PUBLIC_URL') ? API_PUBLIC_URL : ''), '/');
    if (!$apiBase) {
        $apiBase = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' ? 'https' : 'http') . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost') . '/api';
    }
    echo "(function(){
  var endpoint = '" . addslashes($apiBase) . "/crm-public/track';
  var STORAGE_KEY = '_khc_anon';
  function getAnon(){
    try { var v = localStorage.getItem(STORAGE_KEY); if (v) return v; } catch(e){}
    var id = 'a_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    try { localStorage.setItem(STORAGE_KEY, id); } catch(e){}
    return id;
  }
  function send(payload){
    try {
      var data = JSON.stringify(payload);
      if (navigator.sendBeacon) {
        var blob = new Blob([data], { type: 'application/json' });
        navigator.sendBeacon(endpoint, blob);
      } else {
        fetch(endpoint, { method: 'POST', headers: {'Content-Type':'application/json'}, body: data, keepalive: true }).catch(function(){});
      }
    } catch(e){}
  }
  window.khilonCRM = {
    page: function(extra){
      var anon = getAnon();
      send(Object.assign({
        url: location.href,
        path: location.pathname,
        title: document.title,
        referrer: document.referrer,
        anon_id: anon
      }, extra || {}));
    },
    identify: function(email, extra){
      var anon = getAnon();
      send(Object.assign({
        url: location.href,
        anon_id: anon,
        email: email
      }, extra || {}));
    }
  };
  // Auto page view
  if (document.readyState !== 'loading') window.khilonCRM.page();
  else document.addEventListener('DOMContentLoaded', function(){ window.khilonCRM.page(); });
})();";
    exit;
}

// ═══ /l/:slug — Smart link redirect ══════════════════════════════════════════
// Note: actual /l/:slug routing also requires entry in api/index.php — fallback
// below handles /api/crm-public/l/:slug too.
if ($action === 'l' && !empty($id)) {
    $slug = preg_replace('/[^a-zA-Z0-9_-]/', '', (string)$id);
    if (!$slug) {
        http_response_code(404);
        exit('Not found');
    }
    $stmt = $db->prepare("SELECT * FROM crm_smart_links WHERE slug = ? AND is_active = 1 LIMIT 1");
    $stmt->execute([$slug]);
    $link = $stmt->fetch();
    if (!$link) {
        http_response_code(404);
        echo 'Link bulunamadı.';
        exit;
    }
    if ($link['expires_at'] && strtotime((string)$link['expires_at']) < time()) {
        http_response_code(410);
        echo 'Link süresi dolmuş.';
        exit;
    }

    // Click log
    $contactId = null;
    $contactQ = (string)($_GET['c'] ?? $_GET['contact'] ?? '');
    if ($contactQ && ctype_digit($contactQ)) $contactId = (int)$contactQ;
    $anonId = preg_replace('/[^a-zA-Z0-9_-]/', '', (string)($_GET['anon'] ?? ''));

    try {
        $db->prepare("INSERT INTO crm_smart_link_clicks (link_id, contact_id, anonymous_id, ip, user_agent, referrer)
                      VALUES (?, ?, ?, ?, ?, ?)")->execute([
            (int)$link['id'],
            $contactId,
            $anonId ?: null,
            $_SERVER['REMOTE_ADDR'] ?? null,
            substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 500),
            substr((string)($_SERVER['HTTP_REFERER'] ?? ''), 0, 1024)
        ]);
        $db->prepare("UPDATE crm_smart_links SET click_count = click_count + 1 WHERE id = ?")->execute([(int)$link['id']]);
        if ($contactId) {
            crmRecordActivity($db, $contactId, 'smart_link_clicked', 'Smart link tıklandı: ' . ($link['label'] ?: $slug), [
                'ref_type' => 'smart_link', 'ref_id' => (int)$link['id'],
                'metadata' => ['slug' => $slug, 'target' => $link['target_url']]
            ]);
            crmApplyScore($db, $contactId, 'email_clicked', ['reason' => 'Smart link tıklandı', 'ref_type' => 'smart_link', 'ref_id' => (int)$link['id']]);
        }
    } catch (Throwable $e) { error_log('[smart-link] click: ' . $e->getMessage()); }

    header('Location: ' . $link['target_url'], true, 302);
    exit;
}

// ═══ /api/crm-public/form/:slug — public form metadata (JSON) ════════════════
if ($action === 'form' && !empty($id) && empty($subAction) && $method === 'GET') {
    $slug = preg_replace('/[^a-zA-Z0-9_-]/', '', (string)$id);
    if (!$slug) sendResponse(['error' => 'Form slug required'], 400);
    $stmt = $db->prepare("SELECT id, slug, name, description, fields_json, success_message, success_redirect,
                                  double_opt_in, opt_in_redirect, is_active
                          FROM crm_forms WHERE slug = ? AND is_active = 1 LIMIT 1");
    $stmt->execute([$slug]);
    $f = $stmt->fetch();
    if (!$f) sendResponse(['error' => 'Form not found'], 404);
    $fields = json_decode((string)$f['fields_json'], true) ?: [];
    sendResponse([
        'id' => (int)$f['id'],
        'slug' => $f['slug'],
        'name' => $f['name'],
        'description' => $f['description'],
        'fields' => $fields,
        'success_message' => $f['success_message'],
        'success_redirect' => $f['success_redirect'],
        'double_opt_in' => (int)$f['double_opt_in'] === 1,
        'opt_in_redirect' => $f['opt_in_redirect'],
    ]);
}

// ═══ /api/crm-public/form/:slug/submit — public form submission ══════════════
if ($action === 'form' && !empty($id) && $subAction === 'submit' && $method === 'POST') {
    $slug = preg_replace('/[^a-zA-Z0-9_-]/', '', (string)$id);
    $stmt = $db->prepare("SELECT * FROM crm_forms WHERE slug = ? AND is_active = 1 LIMIT 1");
    $stmt->execute([$slug]);
    $form = $stmt->fetch();
    if (!$form) sendResponse(['error' => 'Form not found'], 404);

    $data = getJsonBody();
    $email = strtolower(trim((string)($data['email'] ?? '')));
    if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sendResponse(['error' => 'Geçerli e-posta zorunlu'], 400);
    }

    // Honeypot anti-spam
    if (!empty($data['website']) || !empty($data['_gotcha'])) {
        // Spam — sessizce kabul et, ama insert etme
        sendResponse(['ok' => true, 'spam' => true]);
    }

    // Field validation (zorunlu alanları kontrol et)
    $fields = json_decode((string)$form['fields_json'], true) ?: [];
    $cleaned = ['email' => $email];
    foreach ($fields as $f) {
        $key = (string)($f['key'] ?? '');
        if (!$key || $key === 'email') continue;
        $val = $data[$key] ?? null;
        if (!empty($f['required']) && ($val === null || $val === '' || (is_array($val) && !$val))) {
            sendResponse(['error' => "$key zorunlu"], 400);
        }
        $cleaned[$key] = $val;
    }

    $doubleOptIn = (int)$form['double_opt_in'] === 1;
    $token = bin2hex(random_bytes(24));
    $contactId = crmFindContactIdByEmail($db, $email);

    if (!$doubleOptIn) {
        // Hemen onayla, contact oluştur/güncelle
        if (!$contactId) {
            $first = isset($cleaned['first_name']) ? trim((string)$cleaned['first_name']) : '';
            $last = isset($cleaned['last_name']) ? trim((string)$cleaned['last_name']) : '';
            $phone = isset($cleaned['phone']) ? trim((string)$cleaned['phone']) : '';
            $company = isset($cleaned['company']) ? trim((string)$cleaned['company']) : '';
            try {
                $stmt = $db->prepare("INSERT IGNORE INTO crm_contacts (email, first_name, last_name, phone, company, source, status)
                                      VALUES (?, ?, ?, ?, ?, 'form_submit', 'subscribed')");
                $stmt->execute([$email, $first, $last, $phone, $company]);
                $contactId = crmFindContactIdByEmail($db, $email);
            } catch (Throwable $e) {}
        }
    } else {
        // Pending kayıt; onay e-postası gönder
        if (!$contactId) {
            try {
                $stmt = $db->prepare("INSERT IGNORE INTO crm_contacts (email, source, status) VALUES (?, 'form_submit', 'pending')");
                $stmt->execute([$email]);
                $contactId = crmFindContactIdByEmail($db, $email);
            } catch (Throwable $e) {}
        }
    }

    // Submission insert
    $stmt = $db->prepare("INSERT INTO crm_form_submissions
        (form_id, contact_id, email, data_json, status, opt_in_token, confirmed_at, ip, user_agent, referrer)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        (int)$form['id'],
        $contactId,
        $email,
        json_encode($cleaned),
        $doubleOptIn ? 'pending_optin' : 'confirmed',
        $doubleOptIn ? $token : null,
        $doubleOptIn ? null : date('Y-m-d H:i:s'),
        $_SERVER['REMOTE_ADDR'] ?? null,
        substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 500),
        substr((string)($_SERVER['HTTP_REFERER'] ?? ''), 0, 1024)
    ]);
    $submissionId = (int)$db->lastInsertId();

    // Form actions işle (sadece confirmed durumda) — add_tag, add_to_list, etc.
    if (!$doubleOptIn && $contactId) {
        $actions = json_decode((string)($form['actions_json'] ?? '[]'), true) ?: [];
        foreach ($actions as $act) {
            try {
                if ($act['type'] === 'add_tag' && !empty($act['tag_slug'])) {
                    $tstmt = $db->prepare("SELECT id FROM crm_tags WHERE slug = ? LIMIT 1");
                    $tstmt->execute([$act['tag_slug']]);
                    $tagId = $tstmt->fetchColumn();
                    if ($tagId) {
                        $db->prepare("INSERT IGNORE INTO crm_contact_tags (contact_id, tag_id) VALUES (?, ?)")
                           ->execute([$contactId, (int)$tagId]);
                    }
                } elseif ($act['type'] === 'add_to_list' && !empty($act['list_id'])) {
                    $db->prepare("INSERT IGNORE INTO crm_list_contacts (list_id, contact_id) VALUES (?, ?)")
                       ->execute([(int)$act['list_id'], $contactId]);
                }
            } catch (Throwable $e) { error_log('[form-action]: ' . $e->getMessage()); }
        }

        crmRecordActivity($db, $contactId, 'form_submitted', 'Form: ' . $form['name'], [
            'ref_type' => 'form_submission', 'ref_id' => $submissionId,
            'metadata' => ['form_slug' => $form['slug']]
        ]);
        crmApplyScore($db, $contactId, 'form_submitted', [
            'reason' => 'Form: ' . $form['name'],
            'ref_type' => 'form_submission', 'ref_id' => $submissionId
        ]);
    }

    // Counter
    $db->prepare("UPDATE crm_forms SET submission_count = submission_count + 1 WHERE id = ?")
       ->execute([(int)$form['id']]);

    // Double opt-in: confirm e-posta gönder
    if ($doubleOptIn) {
        try {
            // Brevo settings + base URL
            $apiKey = ''; $fromEmail = 'info@khilon.com'; $fromName = 'Khilonfast';
            try {
                $rs = $db->query("SELECT setting_key, setting_value FROM settings
                                  WHERE setting_key IN ('brevo_api_key','sender_email','sender_name')");
                foreach ($rs as $r) {
                    if ($r['setting_key'] === 'brevo_api_key') $apiKey = (string)$r['setting_value'];
                    if ($r['setting_key'] === 'sender_email') $fromEmail = (string)$r['setting_value'];
                    if ($r['setting_key'] === 'sender_name') $fromName = (string)$r['setting_value'];
                }
            } catch (Throwable $e) {}

            $base = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' ? 'https' : 'http') . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost');
            $confirmUrl = $base . "/api/crm-public/form/$slug/confirm?token=$token";
            $subject = $form['opt_in_subject'] ?: 'E-posta adresinizi onaylayın';
            $body = $form['opt_in_body'] ?: '<p>Merhaba,</p><p>Kayıt isteğinizi onaylamak için aşağıdaki bağlantıya tıklayın:</p>';
            $html = $body . '<p><a href="' . $confirmUrl . '" style="display:inline-block;padding:10px 20px;background:#2563eb;color:white;text-decoration:none;border-radius:6px;">Onayla</a></p><p style="font-size:12px;color:#94a3b8">Bu maili siz istemediyseniz görmezden gelebilirsiniz.</p>';

            if ($apiKey && function_exists('sendBrevoApiEmail')) {
                sendBrevoApiEmail($apiKey, $fromEmail, $fromName, $email, $subject, $html);
            }
        } catch (Throwable $e) { error_log('[form-optin]: ' . $e->getMessage()); }

        sendResponse([
            'ok' => true, 'pending_optin' => true,
            'message' => 'Onay e-postası gönderildi. Kaydı tamamlamak için gelen kutunuzu kontrol edin.'
        ]);
    }

    sendResponse([
        'ok' => true, 'submission_id' => $submissionId,
        'message' => $form['success_message'] ?: 'Teşekkürler, kaydınız alındı.',
        'redirect' => $form['success_redirect']
    ]);
}

// ═══ /api/crm-public/form/:slug/confirm?token=... — opt-in onayı ═════════════
if ($action === 'form' && !empty($id) && $subAction === 'confirm' && $method === 'GET') {
    $slug = preg_replace('/[^a-zA-Z0-9_-]/', '', (string)$id);
    $token = preg_replace('/[^a-f0-9]/', '', (string)($_GET['token'] ?? ''));
    if (!$slug || !$token) {
        http_response_code(400);
        echo 'Geçersiz onay bağlantısı.';
        exit;
    }
    $stmt = $db->prepare("SELECT s.*, f.actions_json, f.name AS form_name, f.opt_in_redirect, f.success_message
                          FROM crm_form_submissions s
                          JOIN crm_forms f ON f.id = s.form_id
                          WHERE f.slug = ? AND s.opt_in_token = ? AND s.status = 'pending_optin' LIMIT 1");
    $stmt->execute([$slug, $token]);
    $sub = $stmt->fetch();
    if (!$sub) {
        http_response_code(404);
        echo 'Bu onay bağlantısı geçersiz veya zaten kullanılmış.';
        exit;
    }

    // Onayla — submission + contact status
    $db->prepare("UPDATE crm_form_submissions SET status = 'confirmed', confirmed_at = NOW(), opt_in_token = NULL WHERE id = ?")
       ->execute([(int)$sub['id']]);

    $contactId = (int)$sub['contact_id'];
    if ($contactId) {
        $db->prepare("UPDATE crm_contacts SET status = 'subscribed' WHERE id = ?")->execute([$contactId]);

        // Form actions
        $actions = json_decode((string)($sub['actions_json'] ?? '[]'), true) ?: [];
        foreach ($actions as $act) {
            try {
                if ($act['type'] === 'add_tag' && !empty($act['tag_slug'])) {
                    $tstmt = $db->prepare("SELECT id FROM crm_tags WHERE slug = ? LIMIT 1");
                    $tstmt->execute([$act['tag_slug']]);
                    $tagId = $tstmt->fetchColumn();
                    if ($tagId) {
                        $db->prepare("INSERT IGNORE INTO crm_contact_tags (contact_id, tag_id) VALUES (?, ?)")
                           ->execute([$contactId, (int)$tagId]);
                    }
                } elseif ($act['type'] === 'add_to_list' && !empty($act['list_id'])) {
                    $db->prepare("INSERT IGNORE INTO crm_list_contacts (list_id, contact_id) VALUES (?, ?)")
                       ->execute([(int)$act['list_id'], $contactId]);
                }
            } catch (Throwable $e) {}
        }

        crmRecordActivity($db, $contactId, 'form_submitted', 'Form (onaylı): ' . $sub['form_name'], [
            'ref_type' => 'form_submission', 'ref_id' => (int)$sub['id'],
            'metadata' => ['double_opt_in_confirmed' => true]
        ]);
        crmApplyScore($db, $contactId, 'form_submitted', [
            'reason' => 'Form onaylandı: ' . $sub['form_name'],
            'ref_type' => 'form_submission', 'ref_id' => (int)$sub['id']
        ]);
    }

    if (!empty($sub['opt_in_redirect'])) {
        header('Location: ' . $sub['opt_in_redirect'], true, 302);
        exit;
    }

    // Default success page (HTML)
    header('Content-Type: text/html; charset=utf-8');
    echo '<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Onaylandı</title>
    <style>body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#f8fafc;margin:0;padding:60px 20px;text-align:center}
    .card{max-width:480px;margin:0 auto;background:white;padding:40px;border-radius:12px;box-shadow:0 4px 20px rgba(15,23,42,0.08)}
    h1{color:#16a34a;font-size:24px;margin:0 0 12px}
    p{color:#475569;line-height:1.5}</style></head><body>
    <div class="card"><div style="font-size:48px;margin-bottom:14px">✓</div>
    <h1>Kayıt onaylandı!</h1>
    <p>' . htmlspecialchars($sub['success_message'] ?: 'Teşekkürler, e-posta adresiniz başarıyla onaylandı.') . '</p>
    </div></body></html>';
    exit;
}

// ═══ /api/crm-public/unsubscribe?token=... ═══════════════════════════════════
// Token = sha256(email + 'unsub' + JWT_SECRET) — Brevo email içinde unsubscribe URL.
if ($action === 'unsubscribe' && $method === 'GET') {
    $email = strtolower(trim((string)($_GET['email'] ?? '')));
    $token = (string)($_GET['token'] ?? '');
    $listId = isset($_GET['list_id']) ? (int)$_GET['list_id'] : 0;

    if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL) || !$token) {
        http_response_code(400);
        echo 'Geçersiz unsubscribe bağlantısı.';
        exit;
    }

    // Token doğrula
    $secret = defined('JWT_SECRET') ? JWT_SECRET : '';
    $expected = hash('sha256', $email . '|unsub|' . $secret);
    if (!hash_equals($expected, $token)) {
        http_response_code(403);
        echo 'Geçersiz onay.';
        exit;
    }

    $contactId = crmFindContactIdByEmail($db, $email);
    if ($contactId) {
        if ($listId > 0) {
            // Liste-bazlı çıkış
            $db->prepare("DELETE FROM crm_list_contacts WHERE list_id = ? AND contact_id = ?")
               ->execute([$listId, $contactId]);
            $msg = 'Bu listeden başarıyla çıkartıldınız.';
        } else {
            // Tüm pazarlama iletişiminden çıkış
            $db->prepare("UPDATE crm_contacts SET status = 'unsubscribed' WHERE id = ?")->execute([$contactId]);
            $msg = 'Pazarlama listemizden çıkış işleminiz tamamlandı.';
        }
        crmRecordActivity($db, $contactId, 'email_unsubscribed', 'Listeden çıkış (manuel)', [
            'metadata' => ['list_id' => $listId, 'self_service' => true]
        ]);
        crmApplyScore($db, $contactId, 'email_unsubscribed', ['reason' => 'Manual unsubscribe']);
    } else {
        $msg = 'E-posta adresimiz sistemimizde kayıtlı değil — yine de bir daha mail almayacaksınız.';
    }

    header('Content-Type: text/html; charset=utf-8');
    echo '<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Çıkış tamamlandı</title>
    <style>body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#f8fafc;margin:0;padding:60px 20px;text-align:center}
    .card{max-width:480px;margin:0 auto;background:white;padding:40px;border-radius:12px;box-shadow:0 4px 20px rgba(15,23,42,0.08)}
    h1{color:#0f172a;font-size:24px;margin:0 0 12px}
    p{color:#475569;line-height:1.5}</style></head><body>
    <div class="card"><div style="font-size:48px;margin-bottom:14px">👋</div>
    <h1>Çıkış işlemi tamamlandı</h1>
    <p>' . htmlspecialchars($msg) . '</p>
    <p style="font-size:13px;color:#94a3b8;margin-top:20px">Yanlışlıkla mı çıkış yaptınız? Web sitemizdeki abonelik formundan tekrar kayıt olabilirsiniz.</p>
    </div></body></html>';
    exit;
}

// ═══ POST /api/crm-public/unsubscribe ════════════════════════════════════════
// Frontend "Abonelikten Çık" sayfası — sayfa açılınca ANINDA çıkış (JSON).
if ($action === 'unsubscribe' && $method === 'POST') {
    $body = getJsonBody();
    $email = strtolower(trim((string)($body['email'] ?? '')));
    $token = (string)($body['token'] ?? '');
    if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL) || !$token) {
        sendResponse(['error' => 'Geçersiz istek'], 400);
    }
    $secret = defined('JWT_SECRET') ? JWT_SECRET : '';
    $expected = hash('sha256', $email . '|unsub|' . $secret);
    if (!hash_equals($expected, $token)) {
        sendResponse(['error' => 'Geçersiz onay'], 403);
    }
    $contactId = crmFindContactIdByEmail($db, $email);
    if ($contactId) {
        $db->prepare("UPDATE crm_contacts SET status = 'unsubscribed', unsubscribed_at = NOW() WHERE id = ?")
           ->execute([$contactId]);
        crmRecordActivity($db, $contactId, 'email_unsubscribed', 'Listeden çıkış (abonelikten çık sayfası)', [
            'metadata' => ['self_service' => true]
        ]);
        crmApplyScore($db, $contactId, 'email_unsubscribed', ['reason' => 'Manual unsubscribe']);
    }
    sendResponse(['ok' => true]);
}

// ═══ POST /api/crm-public/unsubscribe-reason ═════════════════════════════════
// Opsiyonel: kullanıcı çıkış sebebini paylaşırsa kaydet.
if ($action === 'unsubscribe-reason' && $method === 'POST') {
    $body = getJsonBody();
    $email = strtolower(trim((string)($body['email'] ?? '')));
    $token = (string)($body['token'] ?? '');
    $reason = substr(trim((string)($body['reason'] ?? '')), 0, 60);
    $detail = substr(trim((string)($body['detail'] ?? '')), 0, 2000);
    if (!$email || !$token) sendResponse(['error' => 'Geçersiz istek'], 400);
    $secret = defined('JWT_SECRET') ? JWT_SECRET : '';
    $expected = hash('sha256', $email . '|unsub|' . $secret);
    if (!hash_equals($expected, $token)) sendResponse(['error' => 'Geçersiz onay'], 403);
    $contactId = crmFindContactIdByEmail($db, $email);
    if ($contactId) {
        $db->prepare("UPDATE crm_contacts SET unsubscribe_reason = ?, unsubscribe_detail = ? WHERE id = ?")
           ->execute([$reason ?: null, $detail ?: null, $contactId]);
    }
    sendResponse(['ok' => true]);
}

sendResponse(['error' => 'CRM public endpoint not found'], 404);
