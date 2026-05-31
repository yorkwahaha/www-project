import { spawnSync } from 'node:child_process';

export const LOCAL_TEST_DATABASE_URL =
  'postgres://postgres:postgres@127.0.0.1:5432/www_test';

const REQUIRED_TEST_DATABASE = 'www_test';
const npmCli = process.env.npm_execpath;

export const localTestEnv = {
  ...process.env,
  DATABASE_URL: LOCAL_TEST_DATABASE_URL,
};

export function assertLocalTestDatabaseUrl() {
  const url = new URL(LOCAL_TEST_DATABASE_URL);
  const databaseName = url.pathname.replace(/^\//, '');
  if (
    url.hostname !== '127.0.0.1' ||
    url.port !== '5432' ||
    databaseName !== REQUIRED_TEST_DATABASE
  ) {
    throw new Error('Refusing local test run outside 127.0.0.1:5432/www_test.');
  }
}

export function run(command, args, env = process.env) {
  console.log(`\n> ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, {
    env,
    stdio: 'inherit',
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

export function runNpm(args, env = process.env) {
  if (!npmCli) {
    throw new Error('Run this script through npm so npm_execpath is available.');
  }
  run(process.execPath, [npmCli, ...args], env);
}

export function startLocalTestPg() {
  assertLocalTestDatabaseUrl();
  console.log(`Using isolated local PostgreSQL database: ${REQUIRED_TEST_DATABASE}`);
  run('docker', ['compose', '-f', 'docker-compose.test.yml', 'up', '-d', '--wait']);
}

export function runLocalMigrations() {
  runNpm(['run', 'migrate:check'], localTestEnv);
  runNpm(['run', 'migrate'], localTestEnv);
}
