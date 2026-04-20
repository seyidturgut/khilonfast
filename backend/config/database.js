import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 8889,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'khilonfastDB',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4'
});

// Test connection + ensure utf8mb4
pool.getConnection()
    .then(async connection => {
        await connection.query("SET NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci'");
        console.log('✅ MySQL Database connected successfully');
        connection.release();
    })
    .catch(err => {
        console.error('❌ MySQL connection error:', err.message);
    });

// Ensure every new connection uses utf8mb4
pool.on('connection', (connection) => {
    connection.query("SET NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci'");
});

export default pool;
