import pg from 'pg';
import {
  LOCAL_TEST_DATABASE_URL,
  assertLocalTestDatabaseUrl,
  localTestEnv,
  runLocalMigrations,
  runNpm,
  startLocalTestPg,
} from './local-test-pg.mjs';
import {
  LOCAL_DEMO_VOTER_B_ID,
  LOCAL_DEMO_VOTER_ID,
  localDemoAdminCredentialsJson,
  seedLocalPublicDemoData,
} from './local-public-demo-fixtures.mjs';

const { Client } = pg;

assertLocalTestDatabaseUrl();

const port = Number(process.env.PORT ?? 3000);
const baseUrl = `http://127.0.0.1:${port}`;

console.log('WWW Project — local public MVP demo');
console.log(`Database: ${LOCAL_TEST_DATABASE_URL} (refuses non-www_test)`);
console.log('');

startLocalTestPg();
runLocalMigrations();
runNpm(['run', 'build'], localTestEnv);

const client = new Client({ connectionString: LOCAL_TEST_DATABASE_URL });
await client.connect();
let server;
let closePool;

try {
  await seedLocalPublicDemoData(client);
  console.log('Seeded local demo users (official trust for voting):');
  console.log(`  Voter A (default on 127.0.0.1 vote page): ${LOCAL_DEMO_VOTER_ID}`);
  console.log(`  Voter B (second browser / incognito):       ${LOCAL_DEMO_VOTER_B_ID}`);
  console.log('Admin registry: fake read-only token (not committed to git).');
  console.log('');

  process.env.DATABASE_URL = LOCAL_TEST_DATABASE_URL;
  process.env.ADMIN_AUTH_CREDENTIALS_JSON = localDemoAdminCredentialsJson();
  process.env.PORT = String(port);

  const { createApp } = await import('../dist/app.js');
  ({ closePool } = await import('../dist/db/client.js'));
  server = createApp().startHttpServer(port);
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', (error) => {
      if (error && typeof error === 'object' && error.code === 'EADDRINUSE') {
        reject(
          new Error(
            `Port ${port} is already in use. Stop the other server or run: $env:PORT=3001; npm run demo:public:local`,
          ),
        );
        return;
      }
      reject(error);
    });
  });

  console.log(`Open: ${baseUrl}/`);
  console.log('Flow: / → /polls/new → vote link → /results/:pollId');
  console.log('');
  console.log('CSS: GET /frontend/public-mvp.css (lightweight skeleton, not a full design system).');
  console.log('Stop: Ctrl+C in this terminal.');
  console.log('');

  await new Promise((resolve) => {
    const shutdown = () => {
      server.close(() => resolve());
    };
    process.once('SIGINT', shutdown);
    process.once('SIGTERM', shutdown);
  });
} finally {
  await client.end().catch(() => {});
  if (closePool) {
    await closePool().catch(() => {});
  }
}

console.log('\nDemo server stopped. Docker test Postgres left running.');
