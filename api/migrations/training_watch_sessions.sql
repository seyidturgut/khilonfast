CREATE TABLE IF NOT EXISTS training_watch_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_key VARCHAR(255) NOT NULL,
  session_start DATETIME DEFAULT CURRENT_TIMESTAMP,
  seconds_watched INT DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_product (user_id, product_key),
  INDEX idx_session_start (session_start)
);
