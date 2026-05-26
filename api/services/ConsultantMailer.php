<?php
// api/services/ConsultantMailer.php
// Danışmanlık randevu e-postaları: şablon yükle → placeholder render → gönder.
// Şablonlar automation_email_templates id 70-73 (2026_05_21_consultant_emails.sql).

if (!defined('CONSULTANT_TPL_CONFIRM'))  define('CONSULTANT_TPL_CONFIRM', 70);  // Randevu Onaylandı
if (!defined('CONSULTANT_TPL_REMINDER')) define('CONSULTANT_TPL_REMINDER', 71); // Görüşmeye 1 Gün Kala
if (!defined('CONSULTANT_TPL_RESCHEDULE')) define('CONSULTANT_TPL_RESCHEDULE', 72); // Takvim Değişikliği
if (!defined('CONSULTANT_TPL_PAYMENT'))  define('CONSULTANT_TPL_PAYMENT', 73);  // Ödeme Son Adım

/**
 * Booking için tahmin edilemez token üretir (reschedule/cancel linkleri).
 */
function consultantBookingToken(int $bookingId): string
{
    $secret = defined('JWT_SECRET') ? JWT_SECRET : 'khilonfast-consultant';
    return substr(hash_hmac('sha256', 'consultant-booking-' . $bookingId, $secret), 0, 32);
}

/**
 * {{key}} placeholder'larını değiştir. AutomationEngine::renderPlaceholders mantığı.
 */
function consultantRender(string $tpl, array $vars): string
{
    return preg_replace_callback('/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/', function ($m) use ($vars) {
        return (string)($vars[$m[1]] ?? '');
    }, $tpl) ?? $tpl;
}

/**
 * Booking satırından ortak şablon değişkenlerini üretir.
 * $booking: consultant_bookings satırı (en az id, name, email, meeting_link, availability_id, service_id, consultant_id).
 */
function consultantBuildVars(PDO $db, array $booking): array
{
    $frontend = defined('FRONTEND_URL') ? rtrim(FRONTEND_URL, '/') : 'https://khilonfast.com';

    // Paket adı (hizmet başlığı)
    $packageName = '';
    if (!empty($booking['service_id'])) {
        $st = $db->prepare("SELECT title FROM consultant_services WHERE id = ?");
        $st->execute([$booking['service_id']]);
        $packageName = (string)($st->fetchColumn() ?: '');
    }

    // Randevu tarih-saati (consultant_availability)
    $appointment = '';
    if (!empty($booking['availability_id'])) {
        $st = $db->prepare("SELECT available_date, start_time, end_time FROM consultant_availability WHERE id = ?");
        $st->execute([$booking['availability_id']]);
        $slot = $st->fetch();
        if ($slot) {
            $appointment = date('d.m.Y', strtotime($slot['available_date']))
                . ' ' . substr((string)$slot['start_time'], 0, 5);
            if (!empty($slot['end_time'])) {
                $appointment .= ' - ' . substr((string)$slot['end_time'], 0, 5);
            }
        }
    }

    $bid = (int)($booking['id'] ?? 0);
    $tok = consultantBookingToken($bid);

    return [
        'name'                 => (string)($booking['name'] ?? ''),
        'package_name'         => $packageName,
        'appointment_datetime' => $appointment,
        'meeting_link'         => (string)($booking['meeting_link'] ?? ''),
        'reschedule_link'      => $frontend . '/danismanlik/randevu/' . $bid . '?t=' . $tok,
        'payment_link'         => $frontend . '/danismanlik-odeme/' . $bid,
    ];
}

/**
 * Şablonu yükle, render et, müşteriye gönder. Hata fırlatmaz (log'a yazar).
 */
function consultantSendMail(PDO $db, int $templateId, string $to, array $vars): bool
{
    if ($to === '') return false;
    try {
        $st = $db->prepare("SELECT subject, body_html, sender_email FROM automation_email_templates WHERE id = ?");
        $st->execute([$templateId]);
        $tpl = $st->fetch();
        if (!$tpl) {
            error_log('[consultant mail] template not found: ' . $templateId);
            return false;
        }
        $subject = consultantRender((string)$tpl['subject'], $vars);
        $html    = consultantRender((string)$tpl['body_html'], $vars);
        $sender  = $tpl['sender_email'] ?: null;

        if (!function_exists('sendTransactionalEmail')) {
            error_log('[consultant mail] sendTransactionalEmail not available');
            return false;
        }
        sendTransactionalEmail($db, $to, $subject, $html, $sender);
        return true;
    } catch (Throwable $e) {
        error_log('[consultant mail] tpl ' . $templateId . ' err: ' . $e->getMessage());
        return false;
    }
}

/**
 * "Takvim Değişikliği" maili — HAZIR ama henüz çağrılmıyor.
 * TODO: Reschedule özelliği eklendiğinde reschedule endpoint'inden çağrılacak.
 */
function consultantSendRescheduleMail(PDO $db, array $booking): bool
{
    $vars = consultantBuildVars($db, $booking);
    return consultantSendMail($db, CONSULTANT_TPL_RESCHEDULE, (string)($booking['email'] ?? ''), $vars);
}
