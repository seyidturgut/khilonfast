<?php
// api/routes/contact-submit.php
// Genel iletişim formu — admin'e mail gönderir + müşteriye thank-you döner.

require_once __DIR__ . '/../utils.php';
$db = Database::getInstance();

if ($method !== 'POST') {
    sendResponse(['error' => 'Method not allowed'], 405);
}

$data = json_decode(file_get_contents('php://input'), true) ?: [];
$firstName = trim((string)($data['firstName'] ?? ''));
$lastName  = trim((string)($data['lastName'] ?? ''));
$email     = trim((string)($data['email'] ?? ''));
$phone     = trim((string)($data['phone'] ?? ''));
$brand     = trim((string)($data['brand'] ?? ''));
$detail    = trim((string)($data['detail'] ?? ''));
$lang      = strtolower(trim((string)($data['lang'] ?? 'tr')));

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendResponse(['error' => 'Geçerli bir e-posta adresi giriniz.'], 400);
}
if ($firstName === '' || $detail === '') {
    sendResponse(['error' => 'Ad ve mesaj alanları zorunludur.'], 400);
}

$adminEmail = (string)getSetting($db, 'contact_email', '');
$fullName = trim($firstName . ' ' . $lastName);
$safe = fn($s) => htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8');

if ($adminEmail !== '' && function_exists('sendTransactionalEmail')) {
    try {
        $html = '<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f4f7fb;padding:20px;margin:0;color:#102a43">'
            . '<div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #dde7f0;border-radius:12px;overflow:hidden">'
            . '<div style="background:linear-gradient(90deg,#1a3a52,#89b004);color:#fff;padding:20px 24px">'
            . '<h2 style="margin:0;font-size:1.15rem">Yeni İletişim Mesajı</h2></div>'
            . '<div style="padding:24px;line-height:1.7">'
            . '<p><strong>Ad Soyad:</strong> ' . $safe($fullName) . '</p>'
            . '<p><strong>E-posta:</strong> ' . $safe($email) . '</p>'
            . '<p><strong>Telefon:</strong> ' . $safe($phone ?: '-') . '</p>'
            . '<p><strong>Marka/Şirket:</strong> ' . $safe($brand ?: '-') . '</p>'
            . '<p><strong>Mesaj:</strong></p>'
            . '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;white-space:pre-wrap">' . $safe($detail) . '</div>'
            . '</div></div></body></html>';
        sendTransactionalEmail($db, $adminEmail, '[Khilonfast] Yeni İletişim Mesajı — ' . $fullName, $html);
    } catch (Throwable $e) {
        error_log('[contact-submit] admin notify failed: ' . $e->getMessage());
    }
}

// CRM tarafında basic kayıt
try {
    $stmt = $db->prepare("INSERT IGNORE INTO crm_contacts (email, first_name, last_name, phone, company, source, status)
                          VALUES (?, ?, ?, ?, ?, 'contact_form', 'subscribed')");
    $stmt->execute([$email, $firstName, $lastName, $phone ?: null, $brand ?: null]);
} catch (Throwable $e) {
    error_log('[contact-submit] crm insert failed: ' . $e->getMessage());
}

sendResponse([
    'ok' => true,
    'message' => $lang === 'en'
        ? 'Thank you! Your message has been received. We will get back to you soon.'
        : 'Teşekkürler! Mesajınız alındı, en kısa sürede size geri dönüş yapacağız.',
]);
