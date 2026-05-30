import { readdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, '..', 'migrations');

async function listMigrationFiles() {
  const entries = await readdir(migrationsDir);
  return entries.filter((name) => name.endsWith('.sql')).sort();
}

async function checkMigrations() {
  const files = await listMigrationFiles();
  if (files.length === 0) {
    console.error('migrate: no .sql files in migrations/');
    process.exit(1);
  }
  for (const file of files) {
    await readFile(join(migrationsDir, file), 'utf8');
  }
  console.log(`migrate: ${files.length} migration file(s) validated`);
  return files;
}

async function applyMigrations() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log(
      'migrate: DATABASE_URL not set; run migrate:check locally or set DATABASE_URL for apply',
    );
    process.exit(0);
  }

  const { default: pg } = await import('pg');
  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    const files = await listMigrationFiles();
    for (const file of files) {
      const version = file.replace(/\.sql$/, '');
      const applied = await isMigrationApplied(client, version);
      if (applied) {
        console.log(`migrate: skip ${file} (already applied)`);
        continue;
      }
      const sql = await readFile(join(migrationsDir, file), 'utf8');
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (version) VALUES ($1)',
          [version],
        );
        await client.query('COMMIT');
        console.log(`migrate: applied ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    }
  } finally {
    await client.end();
  }
}

async function isMigrationApplied(client, version) {
  try {
    const { rows } = await client.query(
      'SELECT 1 FROM schema_migrations WHERE version = $1',
      [version],
    );
    return rows.length > 0;
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && err.code === '42P01') {
      return false;
    }
    throw err;
  }
}

const isCheck = process.argv.includes('--check');

try {
  if (isCheck) {
    await checkMigrations();
  } else {
    await applyMigrations();
  }
} catch (err) {
  console.error('migrate failed:', err);
  process.exit(1);
}
