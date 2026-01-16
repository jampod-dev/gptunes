import postgres from 'postgres';

// Create a singleton connection
let sql: ReturnType<typeof postgres> | null = null;

export function useDatabase() {
    if (!sql) {
        const connectionString = process.env.DATABASE_URL;

        if (!connectionString) {
            throw new Error('DATABASE_URL environment variable is not set');
        }

        sql = postgres(connectionString, {
            max: 10, // Maximum number of connections
            idle_timeout: 20,
            connect_timeout: 10,
        });
    }

    return sql;
}

// Helper function to safely close the connection (for cleanup)
export async function closeDatabaseConnection() {
    if (sql) {
        await sql.end();
        sql = null;
    }
}
