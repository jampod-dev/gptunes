import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { readFile } from 'fs/promises';
import { join } from 'path';
import postgres from 'postgres';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigrations() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        console.error('ERROR: DATABASE_URL environment variable is not set');
        process.exit(1);
    }

    const sql = postgres(connectionString);

    try {
        console.log('Running database migrations...');

        // Read the schema SQL file
        const schemaPath = join(__dirname, 'schema.sql');
        const schemaSql = await readFile(schemaPath, 'utf-8');

        // Execute the schema SQL
        await sql.unsafe(schemaSql);

        console.log('✓ Database migrations completed successfully!');
        console.log('✓ Created tables: playlists, refinements');

        await sql.end();
        process.exit(0);
    } catch (error) {
        console.error('ERROR: Failed to run migrations:', error);
        await sql.end();
        process.exit(1);
    }
}

runMigrations();
