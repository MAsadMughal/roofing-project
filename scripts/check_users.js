import 'dotenv/config';
import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL;
const sql = postgres(databaseUrl);

async function main() {
	try {
		const users = await sql`SELECT id, email, role FROM users`;
		console.log('Users in database:', users);
	} catch (err) {
		console.error(err);
	} finally {
		await sql.end();
	}
}

main();
