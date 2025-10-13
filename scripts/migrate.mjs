import 'dotenv/config';
import postgres from 'postgres';
import { readdir, readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.resolve(__dirname, '../migrations');

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

async function ensureMigrationsTable() {
	await sql`
		create table if not exists schema_migrations (
			id bigserial primary key,
			filename text unique not null,
			applied_at timestamptz not null default now()
		);
	`;
}

async function getAppliedMigrations() {
	const rows = await sql`select filename from schema_migrations order by filename`;
	return new Set(rows.map((r) => r.filename));
}

async function getMigrationFiles() {
	const entries = await readdir(migrationsDir, { withFileTypes: true });
	return entries
		.filter((e) => e.isFile() && e.name.endsWith('.sql'))
		.map((e) => e.name)
		.sort();
}

async function applyMigration(filename) {
	const filePath = path.join(migrationsDir, filename);
	const sqlText = await readFile(filePath, 'utf8');
	await sql.begin(async (tx) => {
		await tx.unsafe(sqlText);
		await tx`
			insert into schema_migrations (filename)
			values (${filename})
		`;
	});
}

async function up() {
	await ensureMigrationsTable();
	const applied = await getAppliedMigrations();
	const files = await getMigrationFiles();
	for (const f of files) {
		if (!applied.has(f)) {
			console.log(`Applying migration ${f} ...`);
			await applyMigration(f);
			console.log(`Applied ${f}`);
		}
	}
	console.log('Migrations complete.');
}

const cmd = process.argv[2] || 'up';
up()
	.catch((err) => {
		console.error(err);
		process.exitCode = 1;
	})
	.finally(() => sql.end({ timeout: 5 }));


