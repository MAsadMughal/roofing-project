import postgres from 'postgres';
import { env } from '$env/dynamic/private';

// Create a singleton Postgres client using environment variables.
// In dev, Vite may hot-reload; reuse the same client if it already exists on the global object.
const databaseUrl = env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
}

const globalForPg = globalThis as unknown as { __pg?: ReturnType<typeof postgres> };

export const sql =
    globalForPg.__pg ??
    postgres(databaseUrl, {
        max: 5,
        idle_timeout: 10,
        connect_timeout: 10,
        prepare: true
    });

if (!globalForPg.__pg) {
    globalForPg.__pg = sql;
}

export async function pingDatabase(): Promise<boolean> {
    try {
        // simple lightweight query
        await sql`select 1`;
        return true;
    } catch {
        return false;
    }
}


