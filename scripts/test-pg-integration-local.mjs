import { spawnSync } from 'node:child_process';

const LOCAL_TEST_DATABASE_URL = 'postgres://postgres:postgres@127.0.0.1:5432/www_test';
const REQUIRED_TEST_DATABASE = 'www_test';
const npmCli = process.env.npm_execpath;

function run(command, args, env = process.env) {
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

const databaseName = new URL(LOCAL_TEST_DATABASE_URL).pathname.replace(/^\//, '');
if (databaseName !== REQUIRED_TEST_DATABASE) {
  throw new Error(`Refusing local integration run on database "${databaseName}".`);
}
if (!npmCli) {
  throw new Error('Run this script through npm so npm_execpath is available.');
}

const testArgs = process.argv.slice(2);
const localTestEnv = {
  ...process.env,
  DATABASE_URL: LOCAL_TEST_DATABASE_URL,
};

console.log(`Using isolated local PostgreSQL database: ${REQUIRED_TEST_DATABASE}`);
run('docker', ['compose', '-f', 'docker-compose.test.yml', 'up', '-d', '--wait']);
run(process.execPath, [npmCli, 'run', 'migrate:check'], localTestEnv);
run(process.execPath, [npmCli, 'run', 'migrate'], localTestEnv);
run(process.execPath, [npmCli, 'run', 'test:integration', '--', ...testArgs], localTestEnv);
console.log('\nLocal PostgreSQL test container remains running for the next rerun.');
