import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function fixDashboardSchema() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('Connected to database');

        // Add phone column
        try {
            await connection.query('ALTER TABLE users ADD COLUMN phone VARCHAR(20)');
            console.log('✅ Added phone column to users table');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️  phone column already exists');
            } else {
                throw err;
            }
        }

        // Add address column
        try {
            await connection.query('ALTER TABLE users ADD COLUMN address TEXT');
            console.log('✅ Added address column to users table');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️  address column already exists');
            } else {
                throw err;
            }
        }

        // Create company_info table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS company_info (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL UNIQUE,
                company_name VARCHAR(255),
                tax_number VARCHAR(50),
                company_address TEXT,
                company_phone VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_id (user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Created company_info table');

        console.log('\n🎉 Database schema updated successfully!');
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await connection.end();
    }
}

fixDashboardSchema();
