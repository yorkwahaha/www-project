import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const REQUIRED_TEST_DATABASE = 'www_test';

const BUSINESS_TABLES = [
  'poll_eligibility_rules',
  'admin_decision_logs',
  'poll_correction_logs',
  'poll_correction_requests',
  'public_notices',
  'admin_users',
  'poll_option_vote_counters',
  'poll_vote_tokens',
  'poll_reference_answer_tokens',
  'poll_options',
  'polls',
  'users',
] as const;

export function assertIntegrationDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error(
      [
        'Integration tests require DATABASE_URL (opt-in, local/manual only).',
        '',
        'Use an isolated database named www_test (PostgreSQL 17+). Example:',
        '  docker compose -f docker-compose.test.yml up -d',
        '  set DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/www_test',
        '  npm run migrate',
        '  npm run test:integration',
      ].join('\n'),
    );
  }

  let databaseName: string;
  try {
    databaseName = new URL(databaseUrl).pathname.replace(/^\//, '');
  } catch {
    throw new Error('DATABASE_URL must be a valid postgres connection URL.');
  }

  if (databaseName !== REQUIRED_TEST_DATABASE) {
    throw new Error(
      `Refusing integration tests on database "${databaseName}". Use isolated database "${REQUIRED_TEST_DATABASE}" only.`,
    );
  }

  return databaseUrl;
}

export function createIntegrationPool(): pg.Pool {
  return new pg.Pool({ connectionString: assertIntegrationDatabaseUrl() });
}

export async function applyMigrations(): Promise<void> {
  const migrateScript = fileURLToPath(new URL('../../scripts/migrate.mjs', import.meta.url));
  await new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, [migrateScript], {
      env: process.env,
      stdio: 'inherit',
      cwd: fileURLToPath(new URL('../..', import.meta.url)),
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`migrate script exited with code ${code ?? 'unknown'}`));
    });
  });
}

export async function truncateBusinessTables(pool: pg.Pool): Promise<void> {
  const tableList = BUSINESS_TABLES.join(', ');
  await pool.query(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE`);
}

export async function setUserTrustLevel(
  pool: pg.Pool,
  userId: string,
  trustLevel: 'low' | 'official',
): Promise<void> {
  await pool.query(`UPDATE users SET trust_level = $2, updated_at = NOW() WHERE id = $1`, [
    userId,
    trustLevel,
  ]);
}

export async function waitForBlockedPollLocks(
  pool: pg.Pool,
  blockerPid: number,
  expectedCount: number,
): Promise<void> {
  const deadline = Date.now() + 2_000;
  while (Date.now() < deadline) {
    const result = await pool.query<{ waiter_count: number }>(
      `SELECT COUNT(*)::int AS waiter_count
       FROM pg_stat_activity
       WHERE pid <> $1
         AND wait_event_type = 'Lock'
         AND query LIKE '%FROM polls%'
         AND query LIKE '%FOR UPDATE%'`,
      [blockerPid],
    );
    if (result.rows[0]!.waiter_count >= expectedCount) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error(`Timed out waiting for ${expectedCount} blocked poll row locks`);
}

export async function listTableColumns(pool: pg.Pool, tableName: string): Promise<string[]> {
  const result = await pool.query<{ column_name: string }>(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1
     ORDER BY ordinal_position ASC`,
    [tableName],
  );
  return result.rows.map((row) => row.column_name);
}
