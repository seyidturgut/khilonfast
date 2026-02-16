<?php
// api/config/config.php

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'khilonfastDB');
define('DB_USER', 'root');
define('DB_PASS', 'root'); // Note: User will need to update this for cPanel

// JWT Configuration
define('JWT_SECRET', 'your-super-secret-jwt-key-change-in-production');
define('JWT_EXPIRY', 604800); // 7 days in seconds

// Lidio Configuration
define('LIDIO_API_KEY', 'your-lidio-api-key');
define('LIDIO_SECRET_KEY', 'your-lidio-secret-key');
define('LIDIO_MERCHANT_ID', 'your-merchant-id');
define('LIDIO_API_URL', 'https://api.lidio.com');
define('LIDIO_TEST_MODE', true);

// CORS Configuration
define('ALLOWED_ORIGIN', '*'); // Update for production if needed
