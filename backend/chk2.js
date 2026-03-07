import pool from './config/database.js';

async function fix() {
    try {
        const [res] = await pool.execute("DELETE FROM products WHERE product_key = 'service-content-strategy-core'");
        console.log(`Deleted ${res.affectedRows} row from products.`);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
fix();
