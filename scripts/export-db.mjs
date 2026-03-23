import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

const config = {
    host: '127.0.0.1',
    port: 8889,
    user: 'root',
    password: 'root',
    database: 'khilonfastDB'
};

async function exportDb() {
    let connection;
    try {
        connection = await mysql.createConnection(config);
        console.log('Connected to database.');

        const [tables] = await connection.query('SHOW TABLES');
        const tableNames = tables.map(t => Object.values(t)[0]);

        let sql = `-- Khilonfast Database Export\n-- Generated at ${new Date().toISOString()}\n\n`;
        sql += 'SET FOREIGN_KEY_CHECKS = 0;\n\n';

        for (const tableName of tableNames) {
            console.log(`Exporting table: ${tableName}`);
            
            // Drop table
            sql += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;

            // Create table
            const [createTable] = await connection.query(`SHOW CREATE TABLE \`${tableName}\``);
            sql += createTable[0]['Create Table'] + ';\n\n';

            // Insert data
            const [rows] = await connection.query(`SELECT * FROM \`${tableName}\``);
            if (rows.length > 0) {
                sql += `INSERT INTO \`${tableName}\` VALUES\n`;
                const inserts = rows.map(row => {
                    const values = Object.values(row).map(val => {
                        if (val === null) return 'NULL';
                        if (typeof val === 'number') return val;
                        return connection.escape(val);
                    });
                    return `(${values.join(', ')})`;
                });
                sql += inserts.join(',\n') + ';\n\n';
            }
        }

        sql += 'SET FOREIGN_KEY_CHECKS = 1;\n';

        const outputPath = path.resolve('khilonfast_db.sql');
        fs.writeFileSync(outputPath, sql);
        console.log(`Database exported to ${outputPath}`);

    } catch (err) {
        console.error('Export error:', err);
    } finally {
        if (connection) await connection.end();
    }
}

exportDb();
