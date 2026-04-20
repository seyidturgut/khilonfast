<?php
// api/services/EmailAutomationService.php
// Schema oluşturma + seed fonksiyonları — hem email-automation.php hem admin.php tarafından kullanılır.

function ensureEmailAutomationSchema(PDO $db)
{
    static $checked = false;
    if ($checked) return;

    $db->exec("CREATE TABLE IF NOT EXISTS email_sequences (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        trigger_event ENUM('checkout_abandoned','purchase_completed','no_login_after_purchase') NOT NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        restart_after_days INT NULL DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $db->exec("CREATE TABLE IF NOT EXISTS email_sequence_steps (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sequence_id INT NOT NULL,
        step_order INT NOT NULL,
        delay_minutes INT NOT NULL,
        subject VARCHAR(500) NOT NULL,
        body_html TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sequence_id) REFERENCES email_sequences(id) ON DELETE CASCADE,
        INDEX idx_steps_sequence (sequence_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $db->exec("CREATE TABLE IF NOT EXISTS email_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        event_type ENUM('checkout_email_entered','purchase_completed','login') NOT NULL,
        email VARCHAR(255) NOT NULL,
        user_id INT NULL,
        cart_data JSON NULL,
        metadata JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email_events_email (email),
        INDEX idx_email_events_type_created (event_type, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $db->exec("CREATE TABLE IF NOT EXISTS email_queue (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        user_id INT NULL,
        sequence_id INT NULL,
        step_id INT NULL,
        event_id INT NULL,
        subject VARCHAR(500) NOT NULL,
        body_html TEXT NOT NULL,
        status ENUM('pending','sent','failed','cancelled') NOT NULL DEFAULT 'pending',
        scheduled_at TIMESTAMP NOT NULL,
        sent_at TIMESTAMP NULL,
        error_message TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email_queue_status_scheduled (status, scheduled_at),
        INDEX idx_email_queue_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $db->exec("CREATE TABLE IF NOT EXISTS email_unsubscribes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // Cron key settings yoksa ekle
    try {
        $db->exec("INSERT IGNORE INTO settings (setting_key, setting_value, setting_group, description)
            VALUES ('email_cron_key', '" . bin2hex(random_bytes(16)) . "', 'mail', 'Email otomasyon cron güvenlik anahtarı')");
    } catch (Throwable $ignored) {}

    // Seed: tablolar boşsa Excel'deki akışları ekle
    try {
        $existing = (int)$db->query("SELECT COUNT(*) FROM email_sequences")->fetchColumn();
        if ($existing === 0) {
            seedEmailSequences($db);
        }
    } catch (Throwable $ignored) {}

    $checked = true;
}

function seedEmailSequences(PDO $db)
{
    $baseUrl = 'https://khilonfast.com';

    // Sekans 1: Terk Edilen Sepet — Excel'deki 6 e-posta (Hizmetler TekSeferlik)
    $db->prepare("INSERT INTO email_sequences (name, trigger_event, is_active, restart_after_days) VALUES (?, 'checkout_abandoned', 1, 30)")
        ->execute(['Terk Edilen Sepet - Hizmetler']);
    $seqId = (int)$db->lastInsertId();

    $steps = [
        [1, 60,     'İşleminizi sadece 2 dakikada tamamlayabilirsiniz!',
            emailTemplate('Merhaba {{first_name}},', 'Kaldığınız yerden satın alma işleminize devam ederek süreci kolay ve hızlı bir şekilde sonuçlandırabilirsiniz.', '{{cart_link}}', 'Devam Et', $baseUrl)],
        [2, 1440,   'Aradığınız Çözümlere Ulaşmak İçin Son 1 Adım!',
            emailTemplate('Merhaba {{first_name}},', 'Başvurunuzu henüz tamamlamadınız. Khilonfast hizmetlerinden yararlanan pek çok kullanıcımız gibi siz de ihtiyaçlarınıza uygun çözümlerimizle avantajlardan yararlanmaya hemen başlayabilirsiniz!', '{{cart_link}}', 'Devam Et', $baseUrl)],
        [3, 4320,   'Biz başlamaya hazırız! Ya siz?',
            emailTemplate('Merhaba {{first_name}},', 'Başvurunuzu henüz tamamlamadığınızı fark ettik. Size en uygun çözümlerimizle iş süreçlerinizde fark yaratmaya başlamak için sabırsızlanıyoruz.', '{{cart_link}}', 'Devam Et', $baseUrl)],
        [4, 10080,  'İşleminizi birlikte tamamlamak ister misiniz?',
            emailTemplate('Merhaba {{first_name}},', 'Henüz tamamlamadığınızı gördüğümüz işlemleriniz için dilerseniz size süreçle ilgili yardımcı olabilir ve sorularınızı yanıtlayabiliriz.', '{{cart_link}}', 'Devam Et', $baseUrl)],
        [5, 43200,  'khilonfast Çözümleri Hala Gündeminizde Mi?',
            emailTemplate('Merhaba {{first_name}},', 'Hala tamamlanmayı bekleyen bir işleminiz olduğunu size hatırlatmak istedik. 😊 Eğer şu an doğru zaman değilse sizi anlıyoruz. Dilerseniz işleminize istediğiniz zaman devam edebilirsiniz.', '{{cart_link}}', 'Devam Et', $baseUrl)],
        [6, 129600, 'khilonfast Çözümlerine Göz Atmak İster Misiniz?',
            emailTemplate('Merhaba {{first_name}},', 'Daha evvel ilgilendiğiniz hizmetlerimizi ve diğer khilonfast çözümlerini tekrar incelemek ister misiniz? Eğer ihtiyaçlarınız farklılaştıysa, sizin için yeni bir plan oluşturabiliriz.', $baseUrl . '/hizmetlerimiz', 'Yeni Plan Oluştur', $baseUrl)],
    ];

    $insertStep = $db->prepare("INSERT INTO email_sequence_steps (sequence_id, step_order, delay_minutes, subject, body_html) VALUES (?, ?, ?, ?, ?)");
    foreach ($steps as $step) {
        $insertStep->execute([$seqId, $step[0], $step[1], $step[2], $step[3]]);
    }

    // Sekans 2: Satın Alma Sonrası — İçerik Erişim Hatırlatması
    $db->prepare("INSERT INTO email_sequences (name, trigger_event, is_active, restart_after_days) VALUES (?, 'purchase_completed', 1, NULL)")
        ->execute(['Satın Alma Sonrası - İçerik Erişim Hatırlatması']);
    $seqId2 = (int)$db->lastInsertId();

    $db->prepare("INSERT INTO email_sequence_steps (sequence_id, step_order, delay_minutes, subject, body_html) VALUES (?, 1, 4320, ?, ?)")
        ->execute([
            $seqId2,
            'Satın aldığınız içeriklere erişmeyi unutmayın!',
            emailTemplate(
                'Merhaba {{first_name}},',
                'Satın aldığınız içeriklere hâlâ erişmediğinizi fark ettik. Dashboard\'unuza giriş yaparak içeriklerinize kolayca ulaşabilirsiniz.',
                $baseUrl . '/dashboard',
                'Dashboard\'a Git',
                $baseUrl
            )
        ]);
}

function emailTemplate($greeting, $body, $ctaUrl, $ctaText, $baseUrl)
{
    $safeBody    = nl2br(htmlspecialchars($body, ENT_QUOTES, 'UTF-8'));
    $safeCtaText = htmlspecialchars($ctaText, ENT_QUOTES, 'UTF-8');

    return "<!doctype html><html lang='tr'><head><meta charset='UTF-8'></head>
<body style='margin:0;padding:0;font-family:Arial,sans-serif;background:#f6f8fb;'>
<div style='max-width:600px;margin:0 auto;padding:20px;'>
  <div style='background:#fff;border:1px solid #dde7f0;border-radius:12px;overflow:hidden;'>
    <div style='background:linear-gradient(90deg,#1a3a52,#89b004);padding:20px 24px;'>
      <a href='{$baseUrl}' style='text-decoration:none;'>
        <span style='color:#fff;font-size:1.4rem;font-weight:800;letter-spacing:-0.5px;'>khilon<span style='color:#d4f06b;'>fast</span></span>
      </a>
    </div>
    <div style='padding:28px 24px;color:#102a43;line-height:1.7;'>
      <p style='margin-top:0;font-size:1rem;'>{$greeting}</p>
      <p style='font-size:0.97rem;color:#334155;'>{$safeBody}</p>
      <div style='text-align:center;margin:28px 0;'>
        <a href='{$ctaUrl}'
           style='background:linear-gradient(90deg,#1a3a52,#2d5570);color:#fff;text-decoration:none;
                  padding:14px 36px;border-radius:8px;font-weight:700;font-size:1rem;display:inline-block;'>
          {$safeCtaText} &rarr;
        </a>
      </div>
      <p style='font-size:0.88rem;color:#64748b;'>Saygılarımızla,<br><strong>Khilonfast Ekibi</strong></p>
      <hr style='border:none;border-top:1px solid #e2e8f0;margin:20px 0;'/>
      <p style='font-size:0.78rem;color:#94a3b8;margin:0;text-align:center;'>
        Bu e-postayı almak istemiyorsanız <a href='{{unsubscribe_link}}' style='color:#64748b;'>listeden çıkabilirsiniz</a>.
      </p>
    </div>
  </div>
</div>
</body></html>";
}
