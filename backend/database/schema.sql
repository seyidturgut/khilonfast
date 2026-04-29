-- khilonfast Database Schema
-- Database: khilonfastDB

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    must_change_password TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_key VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    features TEXT,
    price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'TRY',
    category VARCHAR(50),
    type ENUM('service', 'subscription', 'video_course', 'digital_download') DEFAULT 'service',
    duration_days INT DEFAULT NULL,
    access_content_url VARCHAR(255) DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    parent_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product_key (product_key),
    INDEX idx_category (category),
    INDEX idx_parent_id (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    subtotal_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    coupon_discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    shipping_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    coupon_id INT DEFAULT NULL,
    coupon_code VARCHAR(100) DEFAULT NULL,
    coupon_name VARCHAR(255) DEFAULT NULL,
    applied_coupon_snapshot_json JSON DEFAULT NULL,
    currency VARCHAR(3) DEFAULT 'TRY',
    status ENUM('pending', 'processing', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_order_number (order_number),
    INDEX idx_status (status),
    INDEX idx_orders_coupon_id (coupon_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Order Items table
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_order_id (order_id),
    INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    payment_method VARCHAR(50),
    lidio_transaction_id VARCHAR(255),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'TRY',
    status ENUM('pending', 'success', 'failed', 'refunded') DEFAULT 'pending',
    lidio_response JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_order_id (order_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Anında Havale (Lidio DirectWireTransfer) için banka hesap listesi
CREATE TABLE IF NOT EXISTS bank_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lidio_bank_account_id INT NOT NULL,
    bank_name VARCHAR(100) NOT NULL,
    bank_code VARCHAR(20) DEFAULT NULL,
    logo_url VARCHAR(500) DEFAULT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_lidio_bank_account_id (lidio_bank_account_id),
    KEY idx_active_order (is_active, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS coupons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    discount_type ENUM('percentage', 'fixed') NOT NULL DEFAULT 'percentage',
    discount_value DECIMAL(10, 2) NOT NULL DEFAULT 0,
    minimum_cart_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    maximum_discount_amount DECIMAL(10, 2) DEFAULT NULL,
    starts_at DATETIME DEFAULT NULL,
    ends_at DATETIME DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    total_usage_limit INT DEFAULT NULL,
    per_user_limit INT DEFAULT NULL,
    restricted_products_json JSON DEFAULT NULL,
    restricted_categories_json JSON DEFAULT NULL,
    new_customers_only BOOLEAN DEFAULT FALSE,
    is_stackable BOOLEAN DEFAULT FALSE,
    usage_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_coupon_code (code),
    INDEX idx_coupon_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS coupon_usages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    coupon_id INT NOT NULL,
    user_id INT DEFAULT NULL,
    order_id INT NOT NULL,
    discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    released_at TIMESTAMP NULL DEFAULT NULL,
    status ENUM('used', 'released') DEFAULT 'used',
    FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE RESTRICT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    UNIQUE KEY uniq_coupon_usage_order (order_id),
    INDEX idx_coupon_usage_coupon (coupon_id),
    INDEX idx_coupon_usage_user_coupon (user_id, coupon_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    order_id INT,
    status ENUM('active', 'expired', 'cancelled') DEFAULT 'active',
    starts_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    auto_renew TINYINT(1) NOT NULL DEFAULT 0,
    next_renewal_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample products
INSERT INTO products (product_key, name, description, price, currency, category) VALUES
('gtm-core', 'Go To Market - Core', 'Pazara hızlı giriş yapmak, temel satış ve değer önerisi oluşturmak isteyen küçük ve orta ölçekli işletmeler için ideal.', 9900.00, 'USD', 'service'),
('gtm-growth', 'Go To Market - Growth', 'Gelişmiş bir dijital, içerik ve pazarlama otomasyonu, satış stratejisi ile büyümeyi hedefleyen orta ölçekli işletmeler için ideal.', 14900.00, 'USD', 'service'),
('gtm-ultimate', 'Go To Market - Ultimate', 'Kapsamlı strateji, marka kimliği ve satış hunisi tasarımıyla kalıcı rekabet avantajı isteyen firmalar için ideal.', 29900.00, 'USD', 'service'),
('b2b-training', 'B2B Pazarlama Eğitimi', 'Tüm modüllere ömür boyu erişim ve uygulamalı egzersizler.', 5000.00, 'TRY', 'training');
