import {
  localTestEnv,
  runLocalMigrations,
  runNpm,
  startLocalTestPg,
} from './local-test-pg.mjs';

const testArgs = process.argv.slice(2);

startLocalTestPg();
runLocalMigrations();
runNpm(['run', 'test:integration', '--', ...testArgs], localTestEnv);
console.log('\nLocal PostgreSQL test container remains running for the next rerun.');
