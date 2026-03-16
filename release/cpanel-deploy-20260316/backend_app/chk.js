import pool from './config/database.js';

async function check() {
    try {
        const [rows] = await pool.execute("SELECT id, product_key, name, price, parent_id FROM products WHERE product_key LIKE '%content-strategy%'");
        console.log(rows);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
check();
