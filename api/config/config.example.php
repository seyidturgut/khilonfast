<?php
// api/config/config.example.php — Template dosyası
// Bu dosyayı `config.php` olarak kopyalayıp kendi local değerlerinizi girin.
// `config.php` git tarafından izlenmiyor (ortama göre değişir).

// ──────────────────────────────────────────────────
// Database — Local geliştirme için MAMP varsayılanları
// Production ortamında: cpanel MySQL Databases'ten alınır
// ──────────────────────────────────────────────────
define('DB_HOST', '127.0.0.1');
define('DB_PORT', 8889);          // Production: 3306
define('DB_NAME', 'khilonfastDB');  // Production: khilonfa_db2026
define('DB_USER', 'root');          // Production: khilonfa_db_user
define('DB_PASS', 'root');          // Production: cpanel'den

// ──────────────────────────────────────────────────
// JWT — Token imzalama için secret key
// ÖNEMLİ: Production'da farklı bir secret olmalı, eski token'ları geçersiz
// kılmamak için sabit kalmalı.
// ──────────────────────────────────────────────────
define('JWT_SECRET', 'change-me-to-a-random-64-char-string');
define('JWT_EXPIRY', 604800);

// ──────────────────────────────────────────────────
// Lidio — Asıl credential'lar admin > Ayarlar tablosunda; burada sadece varsayılan
// ──────────────────────────────────────────────────
define('LIDIO_API_KEY', '');
define('LIDIO_SECRET_KEY', '');
define('LIDIO_MERCHANT_ID', '');
define('LIDIO_API_URL', 'https://api.lidio.com');
define('LIDIO_TEST_MODE', true);    // Local geliştirme: true; Production: false

// ──────────────────────────────────────────────────
// Google OAuth
// ──────────────────────────────────────────────────
define('GOOGLE_CLIENT_ID', '');

// ──────────────────────────────────────────────────
// CORS
// ──────────────────────────────────────────────────
define('ALLOWED_ORIGIN', '*');      // Production: 'https://khilonfast.com'

// ──────────────────────────────────────────────────
// URL'ler
// ──────────────────────────────────────────────────
define('FRONTEND_URL', 'http://localhost:5173');           // Production: https://khilonfast.com
define('BACKEND_PUBLIC_URL', 'http://localhost:8099');     // Production: https://khilonfast.com

// ──────────────────────────────────────────────────
// SMTP
// ──────────────────────────────────────────────────
define('SMTP_HOST', '');
define('SMTP_PORT', 465);
define('SMTP_USER', '');
define('SMTP_PASS', '');
define('SMTP_FROM', 'merhaba@khilonfast.com');
