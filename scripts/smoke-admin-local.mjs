import { createHash } from 'node:crypto';
import pg from 'pg';
import {
  LOCAL_TEST_DATABASE_URL,
  localTestEnv,
  runLocalMigrations,
  runNpm,
  startLocalTestPg,
} from './local-test-pg.mjs';

const { Client } = pg;
const creatorId = '11111111-1111-4111-8111-111111111111';
const readAdminId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const writeAdminId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const pollId = '22222222-2222-4222-8222-222222222222';
const readToken = 'FAKE-LOCAL-READ-TOKEN-DO-NOT-USE';
const writeToken = 'FAKE-LOCAL-WRITE-TOKEN-DO-NOT-USE';
const BUSINESS_TABLES = [
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
];

function tokenDigest(token) {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

function expectResponse(label, response, body, status, error) {
  if (response.status !== status || (error !== undefined && body.error !== error)) {
    throw new Error(`${label} failed: expected ${status} ${error ?? ''}, received ${response.status}`);
  }
  console.log(`PASS ${label}`);
}

async function request(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  return {
    response,
    body: await response.json(),
  };
}

async function seedFixture(client) {
  await client.query(`TRUNCATE TABLE ${BUSINESS_TABLES.join(', ')} RESTART IDENTITY CASCADE`);
  await client.query(
    `INSERT INTO users (id, display_name)
     VALUES ($1, 'Local Smoke Creator'), ($2, 'Local Smoke Read Admin'), ($3, 'Local Smoke Write Admin')`,
    [creatorId, readAdminId, writeAdminId],
  );
  await client.query(
    `INSERT INTO admin_users (user_id, role, status)
     VALUES ($1, 'admin', 'active'), ($2, 'admin', 'active')`,
    [readAdminId, writeAdminId],
  );
  await client.query(
    `INSERT INTO polls (
       id, creator_id, title, description, category, status, published_at, closes_at
     ) VALUES ($1, $2, 'Local Smoke Original Title', 'Local smoke description', 'general',
       'active', NOW(), NOW() + INTERVAL '1 day')`,
    [pollId, creatorId],
  );
}

startLocalTestPg();
runLocalMigrations();
runNpm(['run', 'build'], localTestEnv);

process.env.DATABASE_URL = LOCAL_TEST_DATABASE_URL;
process.env.ADMIN_AUTH_CREDENTIALS_JSON = JSON.stringify([
  {
    token_sha256: tokenDigest(readToken),
    admin_user_id: readAdminId,
    role: 'admin',
    permissions: ['correction:read'],
  },
  {
    token_sha256: tokenDigest(writeToken),
    admin_user_id: writeAdminId,
    role: 'admin',
    permissions: ['correction:read', 'correction:write'],
  },
]);

const client = new Client({ connectionString: LOCAL_TEST_DATABASE_URL });
await client.connect();
let server;
let closePool;

try {
  await seedFixture(client);
  const { createApp } = await import('../dist/app.js');
  ({ closePool } = await import('../dist/db/client.js'));
  server = createApp().startHttpServer(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Local smoke server failed to bind.');
  }
  const baseUrl = `http://127.0.0.1:${address.port}`;

  {
    const { response, body } = await request(baseUrl, '/admin/correction-audit');
    expectResponse('missing Authorization -> ADMIN_AUTH_REQUIRED', response, body, 401, 'ADMIN_AUTH_REQUIRED');
  }
  {
    const { response, body } = await request(baseUrl, '/admin/correction-audit', {
      headers: { Authorization: 'Bearer FAKE-LOCAL-INVALID-TOKEN' },
    });
    expectResponse('invalid Bearer -> ADMIN_AUTH_INVALID', response, body, 401, 'ADMIN_AUTH_INVALID');
  }
  {
    const { response, body } = await request(baseUrl, '/admin/correction-audit', {
      headers: { 'X-Admin-User-Id': writeAdminId },
    });
    expectResponse('legacy X-Admin-User-Id alone -> ADMIN_AUTH_REQUIRED', response, body, 401, 'ADMIN_AUTH_REQUIRED');
  }
  {
    const { response, body } = await request(baseUrl, '/admin/correction-audit?limit=1', {
      headers: { Authorization: `Bearer ${readToken}` },
    });
    expectResponse('read token GET /admin/correction-audit', response, body, 200);
  }
  const correctionBody = JSON.stringify({
    poll_id: pollId,
    correction_target_field: 'title',
    proposed_text: 'Local Smoke Corrected Title',
    reason: 'Local smoke typo check',
  });
  {
    const { response, body } = await request(baseUrl, '/admin/correction-requests', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${readToken}`,
        'Content-Type': 'application/json',
      },
      body: correctionBody,
    });
    expectResponse('read token write route -> ADMIN_FORBIDDEN', response, body, 403, 'ADMIN_FORBIDDEN');
  }
  {
    const { response, body } = await request(baseUrl, '/admin/correction-requests', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${writeToken}`,
        'Content-Type': 'application/json',
      },
      body: correctionBody,
    });
    expectResponse('write token POST /admin/correction-requests', response, body, 201);
  }
  const noticeCount = await client.query(`SELECT COUNT(*)::integer AS count FROM public_notices`);
  if (noticeCount.rows[0]?.count !== 0) {
    throw new Error('Local smoke correction unexpectedly created a public notice.');
  }
  console.log('PASS active correction smoke created no public notice');

  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  server = undefined;
} finally {
  if (server) {
    await new Promise((resolve) => server.close(() => resolve()));
  }
  await closePool?.();
  await client.end();
}

console.log('\nAdmin Auth local smoke passed. Docker test container remains running.');
