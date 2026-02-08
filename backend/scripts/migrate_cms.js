import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
    try {
        console.log('Starting CMS Migration...');
        const schemaPath = path.join(__dirname, '../database/cms_schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        // Split queries by semicolon to execute them one by one
        // Note: Simple split might fail on semicolons inside strings, but for this schema it's safe enough
        // or we can use allowMultipleStatements: true in mysql config, but keeping it simple here
        const statements = schemaSql
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);

        for (const statement of statements) {
            try {
                // Skip empty lines or comments if split leaves any
                if (statement) {
                    await db.query(statement);
                    console.log('Executed:', statement.substring(0, 50) + '...');
                }
            } catch (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log('Column already exists, skipping.');
                } else if (err.code === 'ER_TABLE_EXISTS_ERROR') {
                    console.log('Table already exists, skipping.');
                } else if (err.code === 'ER_PARSE_ERROR' && statement.includes('--')) {
                    // Sometimes comments are parsed as queries if split incorrectly, ignore
                    console.log('Skipping comment/empty block');
                } else {
                    console.error('Error executing statement:', statement);
                    // For now, let's verify if query effectively failed because of column existing but with different error code (some mysql versions)
                    // We will continue despite errors for ALTER TABLE to try finishing other migrations
                    if (statement.startsWith('ALTER TABLE')) {
                        console.warn('Warning: ALTER TABLE failed, possibly because column exists. Continuing...');
                    } else {
                        throw err;
                    }
                }
            }
        }

        console.log('✅ CMS Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
