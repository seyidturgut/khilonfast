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
