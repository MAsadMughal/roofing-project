import 'dotenv/config';
import postgres from 'postgres';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const seedFile = path.resolve(__dirname, '../seeds/sample.sql');

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
	console.error('DATABASE_URL is not set');
	process.exit(1);
}

const sql = postgres(databaseUrl, {
	max: 5,
	idle_timeout: 10,
	connect_timeout: 10,
	prepare: true
});

async function main() {
	const sqlText = await readFile(seedFile, 'utf8');
	await sql.begin(async (tx) => {
		await tx.unsafe(sqlText);
	});
	console.log('Seed data inserted.');
}

main()
	.catch((err) => {
		console.error(err);
		process.exitCode = 1;
	})
	.finally(() => sql.end({ timeout: 5 }));


