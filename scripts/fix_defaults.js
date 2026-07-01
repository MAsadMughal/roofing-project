import 'dotenv/config';
import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
	console.error('DATABASE_URL is not set');
	process.exit(1);
}

const sql = postgres(databaseUrl);

async function main() {
	try {
		// Find all tables that have updated_at column but no default
		const cols = await sql`
			SELECT table_name, column_name
			FROM information_schema.columns
			WHERE table_schema = 'public'
			  AND column_name = 'updated_at'
			  AND column_default IS NULL
		`;

		console.log('Tables needing updated_at default:', cols.map(c => c.table_name));

		for (const row of cols) {
			console.log(`Setting default now() for ${row.table_name}.updated_at ...`);
			await sql.unsafe(`ALTER TABLE "${row.table_name}" ALTER COLUMN updated_at SET DEFAULT NOW()`);
		}
		console.log('Defaults fixed.');
	} catch (err) {
		console.error('Error fixing defaults:', err);
		process.exitCode = 1;
	} finally {
		await sql.end();
	}
}

main();
