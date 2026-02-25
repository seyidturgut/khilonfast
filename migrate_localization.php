<?php
require_once __DIR__ . '/api/config/db.php';

$db = Database::getInstance();

try {
    echo "Starting Multilingual Migration...\n";

    // Add English content columns to products table
    $alterQueries = [
        "ALTER TABLE products ADD COLUMN name_en VARCHAR(255) AFTER name",
        "ALTER TABLE products ADD COLUMN description_en TEXT AFTER description",
        "ALTER TABLE products ADD COLUMN features_en TEXT AFTER features",
        "ALTER TABLE products ADD COLUMN slug_en VARCHAR(255) AFTER product_key",
        "ALTER TABLE products ADD COLUMN meta_title_en VARCHAR(255)",
        "ALTER TABLE products ADD COLUMN meta_description_en TEXT",
        "ALTER TABLE products ADD COLUMN hero_vimeo_id_en VARCHAR(100)",
        "ALTER TABLE products ADD COLUMN hero_image_en VARCHAR(255)"
    ];

    foreach ($alterQueries as $query) {
        try {
            $db->exec($query);
            echo "Executed: $query\n";
        } catch (PDOException $e) {
            echo "Skipping/Error: " . $e->getMessage() . "\n";
        }
    }

    echo "Migration completed successfully!\n";
} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
}
