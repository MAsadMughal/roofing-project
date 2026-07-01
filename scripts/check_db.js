import 'dotenv/config';
import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL;
const sql = postgres(databaseUrl);

async function main() {
	try {
		const tables = await sql`
			SELECT table_name 
			FROM information_schema.tables 
			WHERE table_schema = 'public'
		`;
		console.log('Tables in DB:', tables.map(t => t.table_name));

		const hasMigrationsTable = tables.some(t => t.table_name === 'schema_migrations');
		if (hasMigrationsTable) {
			const migrations = await sql`SELECT filename FROM schema_migrations ORDER BY filename`;
			console.log('Applied migrations:', migrations.map(m => m.filename));
		} else {
			console.log('schema_migrations table does not exist.');
		}
	} catch (err) {
		console.error(err);
	} finally {
		await sql.end();
	}
}

main();
