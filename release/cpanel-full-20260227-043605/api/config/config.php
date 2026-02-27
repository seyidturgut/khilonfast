<?php
// api/config/config.php

// Database Configuration
define('DB_HOST', '127.0.0.1');
define('DB_PORT', 8889);
define('DB_NAME', 'khilonfastDB');
define('DB_USER', 'root');
define('DB_PASS', 'root'); // Note: User will need to update this for cPanel

// JWT Configuration
define('JWT_SECRET', 'lZm+b6WWuuyISB4lXop1S0ncStNZI74Hy7rE4Km9CHyi6lWgXztVzOG2ZuIfsXC2');
define('JWT_EXPIRY', 604800); // 7 days in seconds

// Lidio Configuration
define('LIDIO_API_KEY', 'your-lidio-api-key');
define('LIDIO_SECRET_KEY', 'your-lidio-secret-key');
define('LIDIO_MERCHANT_ID', 'your-merchant-id');
define('LIDIO_API_URL', 'https://api.lidio.com');
define('LIDIO_TEST_MODE', true);

// Google OAuth
define('GOOGLE_CLIENT_ID', ''); // Set this in production

// CORS Configuration
define('ALLOWED_ORIGIN', 'https://khilonfast.com'); // Production origin
