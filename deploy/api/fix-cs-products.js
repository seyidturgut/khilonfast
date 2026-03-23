import pool from './config/database.js';

async function fixContentStrategyProducts() {
    try {
        console.log("Removing duplicate Content Strategy packages from DB...");
        const [result] = await pool.execute(`
            DELETE FROM products 
            WHERE product_key IN ('service-content-strategy-growth', 'service-content-strategy-ultimate')
        `);
        console.log(`Deleted ${result.affectedRows} extra content strategy packages.`);

        console.log("Ensuring base Content Strategy package exists and is priced correctly...");
         await pool.execute(`
            UPDATE products 
            SET price = 80000 
            WHERE product_key = 'service-content-strategy'
        `);
        
        console.log("Done fixing Content Strategy products.");
    } catch (error) {
        console.error("Error fixing DB:", error);
    } finally {
        process.exit();
    }
}

fixContentStrategyProducts();
