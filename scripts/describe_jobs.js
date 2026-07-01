import 'dotenv/config';
import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL;
const sql = postgres(databaseUrl);

async function main() {
	try {
		const columns = await sql`
			SELECT column_name, data_type, is_nullable, column_default
			FROM information_schema.columns
			WHERE table_name = 'jobs'
			ORDER BY ordinal_position
		`;
		console.log('Columns in jobs table:');
		console.table(columns);
	} catch (err) {
		console.error(err);
	} finally {
		await sql.end();
	}
}

main();
