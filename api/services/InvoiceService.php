<?php
// api/services/InvoiceService.php
// Fatura domain logic: order → invoice payload + kuyruk yönetimi.

require_once __DIR__ . '/ParasutService.php';

// -----------------------------------------------------------------------------
// Kuyruğa al — UPSERT. 3 ödeme başarı noktasından çağrılır.
// Idempotent: aynı sipariş için 2. çağrı status='queued' yapar (failed → retry).
// -----------------------------------------------------------------------------
function invoiceQueueForOrder(PDO $db, int $orderId): void
{
    if ($orderId <= 0) return;
    // Paraşüt aktif değilse kuyruğa eklemeyi atla (admin Ayarlar'dan toggle)
    if ((string)getSetting($db, 'parasut_enabled', '0') !== '1') {
        return;
    }
    $st = $db->prepare(
        "INSERT INTO invoice_jobs (order_id, status, attempts, next_run_at)
         VALUES (?, 'queued', 0, NULL)
         ON DUPLICATE KEY UPDATE
            status = IF(invoice_jobs.status = 'sent', 'sent', 'queued'),
            next_run_at = IF(invoice_jobs.status = 'sent', invoice_jobs.next_run_at, NULL)"
    );
    $st->execute([$orderId]);
    // Order'da pending → queued işaretle
    $db->prepare("UPDATE orders SET invoice_status='queued' WHERE id=? AND invoice_status IN ('pending','failed','skipped')")
       ->execute([$orderId]);
}

// -----------------------------------------------------------------------------
// Sipariş + müşteri + item bilgisini fatura için topla
// -----------------------------------------------------------------------------
function invoiceBuildPayload(PDO $db, int $orderId): array
{
    // Order + user + company
    $orderSt = $db->prepare(
        "SELECT o.*, u.email, u.first_name, u.last_name, u.phone, u.national_id, u.address,
                ci.company_name, ci.tax_number, ci.tax_office, ci.company_address
         FROM orders o
         JOIN users u ON u.id = o.user_id
         LEFT JOIN company_info ci ON ci.user_id = o.user_id
         WHERE o.id = ?"
    );
    $orderSt->execute([$orderId]);
    $order = $orderSt->fetch();
    if (!$order) {
        throw new RuntimeException('Sipariş bulunamadı: ' . $orderId);
    }

    $customerType = (string)($order['customer_type'] ?? 'individual');
    $isCompany = $customerType === 'company';
    // EN site'den gelen siparişler yabancı müşteri (e-Fatura/e-Arşiv DEĞİL, normal sales_invoice)
    $isForeign = strtolower((string)($order['customer_lang'] ?? 'tr')) === 'en';

    $customer = [
        'customer_type' => $customerType,
        'is_foreign' => $isForeign,
        'name'  => $isCompany
            ? trim((string)$order['company_name'] ?: trim($order['first_name'] . ' ' . $order['last_name']))
            : trim($order['first_name'] . ' ' . $order['last_name']),
        'email' => (string)$order['email'],
        'phone' => (string)($order['phone'] ?? ''),
        'address' => $isCompany ? (string)($order['company_address'] ?? '') : (string)($order['address'] ?? ''),
        'tax_office' => (string)($order['tax_office'] ?? ''),
        'tax_number' => (string)($order['tax_number'] ?? ''),
        'national_id' => (string)($order['national_id'] ?? ''),
    ];

    // Items — consultant-booking anchor'ı varsa gerçek consultant_services adıyla göster
    $itemsSt = $db->prepare(
        "SELECT oi.*, p.product_key, p.name AS product_name
         FROM order_items oi
         JOIN products p ON p.id = oi.product_id
         WHERE oi.order_id = ?"
    );
    $itemsSt->execute([$orderId]);
    $rows = $itemsSt->fetchAll();

    // Danışmanlık satırlarında gerçek hizmet ismini çek (consultant_bookings.order_id varsa)
    $consultantBookings = [];
    try {
        $cbSt = $db->prepare("SELECT cb.id, cs.title FROM consultant_bookings cb LEFT JOIN consultant_services cs ON cs.id = cb.service_id WHERE cb.order_id = ?");
        $cbSt->execute([$orderId]);
        foreach ($cbSt->fetchAll() as $b) {
            if (!empty($b['title'])) $consultantBookings[] = $b['title'];
        }
    } catch (Throwable $e) {
        // consultant_bookings.order_id kolonu yoksa (eski şema) — sessiz geç, generic isim kullan
        error_log('[invoice] consultant_bookings.order_id missing: ' . $e->getMessage());
    }

    $vatDefault = (float)getSetting($db, 'default_vat_rate', '20');
    // Fiyatlar KDV DAHİL mi? (varsayılan: evet — KhilonFast satış fiyatları KDV dahil)
    $pricesIncludeVat = (string)getSetting($db, 'prices_include_vat', '1') === '1';
    $vatDivisor = $pricesIncludeVat ? (1 + $vatDefault / 100) : 1.0;

    $lines = [];
    $consultantIdx = 0;
    foreach ($rows as $r) {
        $name = (string)$r['product_name'];
        if (($r['product_key'] ?? '') === 'consultant-booking' && isset($consultantBookings[$consultantIdx])) {
            $name = $consultantBookings[$consultantIdx];
            $consultantIdx++;
        }
        // Paraşüt unit_price KDV HARİÇ ister, KDV'yi ayrıca ekler.
        // KDV dahil ürünleri net'e çeviriyoruz ki toplam doğru çıksın.
        $netUnit = round((float)$r['unit_price'] / $vatDivisor, 4);
        $lines[] = [
            'name'       => $name,
            'quantity'   => (int)$r['quantity'],
            'unit_price' => $netUnit,
            'vat_rate'   => $vatDefault,
        ];
    }

    return [
        'order' => $order,
        'customer' => $customer,
        'lines' => $lines,
        'meta' => [
            'order_id'      => (int)$order['id'],
            'order_number'  => (string)$order['order_number'],
            'customer_type' => $customerType,
            'is_foreign'    => $isForeign,
            'currency'      => 'TRL', // Paraşüt 'TRL' kullanır
        ],
    ];
}

// -----------------------------------------------------------------------------
// İşi işle — Paraşüt'e gönder, sonucu kaydet, hata varsa retry kuyruğunda bırak
// -----------------------------------------------------------------------------
function invoiceProcessJob(PDO $db, int $jobId): array
{
    $st = $db->prepare("SELECT * FROM invoice_jobs WHERE id = ?");
    $st->execute([$jobId]);
    $job = $st->fetch();
    if (!$job) return ['ok' => false, 'error' => 'Job not found'];
    if ($job['status'] === 'sent') return ['ok' => true, 'skipped' => 'already sent'];

    $orderId = (int)$job['order_id'];
    $attempt = (int)$job['attempts'] + 1;

    // processing'e geç
    $db->prepare("UPDATE invoice_jobs SET status='processing', attempts=? WHERE id=?")
       ->execute([$attempt, $jobId]);
    $db->prepare("UPDATE orders SET invoice_status='processing' WHERE id=?")->execute([$orderId]);

    try {
        $payload = invoiceBuildPayload($db, $orderId);
        $cust = $payload['customer'];

        // Vergi no / TC zorunluluk kontrolü (UI zorunlu kılıyor ama defansif)
        // Yabancı müşteri (EN site) için zorunluluk YOK
        if (empty($cust['is_foreign'])) {
            if ($cust['customer_type'] === 'individual' && $cust['national_id'] === '') {
                throw new RuntimeException('TC kimlik numarası eksik.');
            }
            if ($cust['customer_type'] === 'company' && ($cust['tax_number'] === '' || $cust['tax_office'] === '')) {
                throw new RuntimeException('Vergi numarası / vergi dairesi eksik.');
            }
        }

        $contactId = parasutFindOrCreateContact($db, $cust);
        $meta = array_merge($payload['meta'], ['attempt' => $attempt]);
        $result = parasutCreateSalesInvoice($db, $contactId, $payload['lines'], $meta);

        // Başarılı
        $db->prepare("UPDATE invoice_jobs SET status='sent', parasut_invoice_id=?, last_error=NULL WHERE id=?")
           ->execute([$result['invoice_id'], $jobId]);
        $db->prepare("UPDATE orders SET invoice_status='sent', parasut_invoice_id=?, parasut_invoice_type=?, invoice_sent_at=NOW() WHERE id=?")
           ->execute([$result['invoice_id'], $result['invoice_type'], $orderId]);

        return ['ok' => true, 'invoice_id' => $result['invoice_id']];

    } catch (Throwable $e) {
        $err = $e->getMessage();
        $maxAttempts = 3;
        if ($attempt >= $maxAttempts) {
            $db->prepare("UPDATE invoice_jobs SET status='failed', last_error=?, next_run_at=NULL WHERE id=?")
               ->execute([$err, $jobId]);
            $db->prepare("UPDATE orders SET invoice_status='failed' WHERE id=?")->execute([$orderId]);
        } else {
            $nextRun = date('Y-m-d H:i:s', time() + 3600); // 1 saat sonra tekrar
            $db->prepare("UPDATE invoice_jobs SET status='queued', last_error=?, next_run_at=? WHERE id=?")
               ->execute([$err, $nextRun, $jobId]);
            $db->prepare("UPDATE orders SET invoice_status='queued' WHERE id=?")->execute([$orderId]);
        }
        error_log('[invoice job ' . $jobId . '] ' . $err);
        return ['ok' => false, 'error' => $err, 'attempt' => $attempt];
    }
}

// -----------------------------------------------------------------------------
// Bir order için zorla retry (admin "Yeniden Dene" butonu)
// -----------------------------------------------------------------------------
function invoiceRetryForOrder(PDO $db, int $orderId): array
{
    $st = $db->prepare("SELECT id FROM invoice_jobs WHERE order_id = ?");
    $st->execute([$orderId]);
    $jobId = (int)$st->fetchColumn();
    if ($jobId <= 0) {
        // Job yoksa yeniden kuyruğa al
        invoiceQueueForOrder($db, $orderId);
        $st->execute([$orderId]);
        $jobId = (int)$st->fetchColumn();
    } else {
        // Failed/sent durumdan queued'a çek + attempts sıfırla
        $db->prepare("UPDATE invoice_jobs SET status='queued', attempts=0, next_run_at=NULL, last_error=NULL WHERE id=?")
           ->execute([$jobId]);
        $db->prepare("UPDATE orders SET invoice_status='queued' WHERE id=?")->execute([$orderId]);
    }
    return invoiceProcessJob($db, $jobId);
}

// -----------------------------------------------------------------------------
// Satış gerçekleştiğinde ADMİN'e (contact_email ayarı) ürün/tutar/KDV dökümü +
// ödeme yöntemi + fatura kesimi için gerekli müşteri bilgilerini içeren bildirim
// maili gönder. Paraşüt entegrasyonunun aktif/pasif olmasından TAMAMEN
// BAĞIMSIZDIR — Paraşüt'e gönderim ayrı bir kuyruk/cron işidir
// (invoiceQueueForOrder), bu fonksiyon admin'e anlık bilgi maili atar.
// 3 ödeme başarı noktasından çağrılır (payment.php CC + 3DS callback,
// admin.php manuel havale onayı) — kart/havale/kupon/hediye hepsi dahil.
// Hata durumunda sipariş akışını bloklamamak için çağıran taraf try/catch
// içine almalı. Dil sabit TR (admin bildirimi, mevcut havale-bekliyor admin
// mailiyle tutarlı — bkz payment.php:720-742).
// -----------------------------------------------------------------------------
function invoiceSendAdminSaleNotification(PDO $db, int $orderId, string $paymentMethod): void
{
    $adminEmail = (string)getSetting($db, 'contact_email', '');
    if ($adminEmail === '') return;

    $payload = invoiceBuildPayload($db, $orderId);
    $order = $payload['order'];
    $customer = $payload['customer'];

    $currency = (string)($order['currency'] ?? 'TRY');
    $orderNumber = htmlspecialchars((string)($order['order_number'] ?? ''), ENT_QUOTES, 'UTF-8');
    $custEmail = htmlspecialchars((string)($order['email'] ?? ''), ENT_QUOTES, 'UTF-8');
    $fmt = fn($n) => number_format((float)$n, 2, ',', '.') . ' ' . $currency;

    $paymentMethodLabels = [
        'credit_card' => 'Kredi/Banka Kartı',
        'manual_transfer' => 'Banka Havalesi',
        'coupon_free' => 'Kupon (Ücretsiz)',
        'manual_admin_gift' => 'Admin Hediyesi',
    ];
    $paymentMethodLabel = $paymentMethodLabels[$paymentMethod] ?? $paymentMethod;

    // Ürün satırları — order_items.unit_price KDV DAHİL (müşterinin ödediği fiyat).
    $itemsSt = $db->prepare(
        "SELECT oi.quantity, oi.unit_price, oi.total_price, p.name AS product_name
         FROM order_items oi JOIN products p ON p.id = oi.product_id
         WHERE oi.order_id = ?"
    );
    $itemsSt->execute([$orderId]);
    $itemRows = $itemsSt->fetchAll();

    $rowsHtml = '';
    foreach ($itemRows as $r) {
        $name = htmlspecialchars((string)$r['product_name'], ENT_QUOTES, 'UTF-8');
        $qty = (int)$r['quantity'];
        $rowsHtml .= "<tr>
            <td style='padding:10px 12px;border-bottom:1px solid #f1f5f9'>{$name}" . ($qty > 1 ? " × {$qty}" : '') . "</td>
            <td style='padding:10px 12px;border-bottom:1px solid #f1f5f9;text-align:right;white-space:nowrap'>" . $fmt($r['total_price']) . "</td>
        </tr>";
    }

    // orders.tax_amount siparişte GERÇEKTEN uygulanmış KDV tutarıdır — kendi hesabımızı
    // yapmak yerine bunu kullanıyoruz (ayar geçmişte değişmiş olabilir, hesaplarsak
    // sipariş anındaki gerçek değerle tutarsız çıkabilir — daha önce bu hataya düşüldü).
    $vatDefault = (float)getSetting($db, 'default_vat_rate', '20');
    $subtotal = (float)($order['subtotal_amount'] ?? 0);
    $discount = (float)($order['coupon_discount_amount'] ?? 0);
    $total = (float)($order['total_amount'] ?? 0);
    $vatAmount = (float)($order['tax_amount'] ?? 0);

    $discountRow = $discount > 0
        ? "<tr><td style='padding:6px 12px;color:#166534'>İndirim" . ($order['coupon_code'] ? ' (' . htmlspecialchars((string)$order['coupon_code'], ENT_QUOTES, 'UTF-8') . ')' : '') . "</td><td style='padding:6px 12px;text-align:right;color:#166534'>-" . $fmt($discount) . "</td></tr>"
        : '';

    // Fatura bilgileri — fatura kesimi için kullanılan müşteri/şirket bilgileri
    $isCompany = $customer['customer_type'] === 'company';
    $billingRows = "<tr><td style='padding:6px 12px;color:#64748b;width:40%'>Ad Soyad/Ünvan</td><td style='padding:6px 12px'>" . htmlspecialchars($customer['name'], ENT_QUOTES, 'UTF-8') . "</td></tr>";
    $billingRows .= "<tr><td style='padding:6px 12px;color:#64748b'>E-posta</td><td style='padding:6px 12px'>{$custEmail}</td></tr>";
    if ($customer['phone'] !== '') {
        $billingRows .= "<tr><td style='padding:6px 12px;color:#64748b'>Telefon</td><td style='padding:6px 12px'>" . htmlspecialchars($customer['phone'], ENT_QUOTES, 'UTF-8') . "</td></tr>";
    }
    if ($isCompany) {
        if ($customer['tax_number'] !== '') {
            $billingRows .= "<tr><td style='padding:6px 12px;color:#64748b'>Vergi No</td><td style='padding:6px 12px'>" . htmlspecialchars($customer['tax_number'], ENT_QUOTES, 'UTF-8') . "</td></tr>";
        }
        if ($customer['tax_office'] !== '') {
            $billingRows .= "<tr><td style='padding:6px 12px;color:#64748b'>Vergi Dairesi</td><td style='padding:6px 12px'>" . htmlspecialchars($customer['tax_office'], ENT_QUOTES, 'UTF-8') . "</td></tr>";
        }
    } elseif ($customer['national_id'] !== '') {
        $billingRows .= "<tr><td style='padding:6px 12px;color:#64748b'>TC Kimlik No</td><td style='padding:6px 12px'>" . htmlspecialchars($customer['national_id'], ENT_QUOTES, 'UTF-8') . "</td></tr>";
    }
    if ($customer['address'] !== '') {
        $billingRows .= "<tr><td style='padding:6px 12px;color:#64748b'>Adres</td><td style='padding:6px 12px'>" . htmlspecialchars($customer['address'], ENT_QUOTES, 'UTF-8') . "</td></tr>";
    }

    $subject = "[Khilonfast] Yeni Satış — {$orderNumber} ({$paymentMethodLabel})";
    $orderDate = date('d.m.Y H:i', strtotime((string)($order['created_at'] ?? 'now')));

    $html = "<!doctype html><html><body style='font-family:Arial,sans-serif;background:#f6f8fb;padding:20px;margin:0'>
        <div style='max-width:600px;margin:0 auto;background:#fff;border:1px solid #dde7f0;border-radius:12px;overflow:hidden'>
        <div style='background:linear-gradient(90deg,#1a3a52,#89b004);color:#fff;padding:20px 24px'>
            <h2 style='margin:0;font-size:1.3rem'>Yeni Satış — {$orderNumber}</h2>
        </div>
        <div style='padding:24px;color:#102a43;line-height:1.6'>
            <p style='margin-top:0'><strong>{$orderNumber}</strong> numaralı sipariş ({$orderDate}) tamamlandı.</p>

            <h3 style='font-size:0.85rem;color:#64748b;text-transform:uppercase;margin:20px 0 8px'>Ürünler</h3>
            <table style='width:100%;border-collapse:collapse;font-size:0.92rem'>{$rowsHtml}</table>

            <table style='width:100%;border-collapse:collapse;font-size:0.92rem;margin-top:10px'>
                <tr><td style='padding:6px 12px;color:#64748b'>Ara Toplam</td><td style='padding:6px 12px;text-align:right'>" . $fmt($subtotal) . "</td></tr>
                {$discountRow}
                <tr><td style='padding:6px 12px;color:#64748b'>KDV ({$vatDefault}%)</td><td style='padding:6px 12px;text-align:right'>" . $fmt($vatAmount) . "</td></tr>
                <tr><td style='padding:10px 12px;font-weight:700;font-size:1.05rem;border-top:1px solid #e2e8f0'>Toplam</td><td style='padding:10px 12px;text-align:right;font-weight:700;font-size:1.05rem;border-top:1px solid #e2e8f0'>" . $fmt($total) . "</td></tr>
            </table>

            <h3 style='font-size:0.85rem;color:#64748b;text-transform:uppercase;margin:20px 0 8px'>Ödeme Yöntemi</h3>
            <p style='margin:0 0 4px'><strong>{$paymentMethodLabel}</strong></p>

            <h3 style='font-size:0.85rem;color:#64748b;text-transform:uppercase;margin:20px 0 8px'>Fatura Bilgileri (Müşteri)</h3>
            <table style='width:100%;border-collapse:collapse;font-size:0.92rem;background:#f8fafc;border-radius:8px'>{$billingRows}</table>

            <hr style='border:none;border-top:1px solid #e2e8f0;margin:18px 0'/>
            <p style='font-size:0.82rem;color:#94a3b8;margin:0'>Khilonfast — otomatik satış bildirimi</p>
        </div></div></body></html>";

    sendTransactionalEmail($db, $adminEmail, $subject, $html);
}
