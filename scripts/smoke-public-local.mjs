import { createHash } from 'node:crypto';
import pg from 'pg';
import {
  LOCAL_DEMO_READ_ADMIN_ID as readAdminId,
  LOCAL_DEMO_READ_TOKEN as readToken,
  LOCAL_DEMO_VOTER_ID as voterId,
} from './local-public-demo-fixtures.mjs';
import {
  LOCAL_TEST_DATABASE_URL,
  localTestEnv,
  runLocalMigrations,
  runNpm,
  startLocalTestPg,
} from './local-test-pg.mjs';

const { Client } = pg;

const creatorId = '11111111-1111-4111-8111-111111111111';

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

const PUBLIC_JSON_DENYLIST =
  /option_id|shard_id|vote_token|selected_option_index|user_id/i;

function tokenDigest(token) {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

function pass(label) {
  console.log(`PASS ${label}`);
}

function expectStatus(label, response, status) {
  if (response.status !== status) {
    throw new Error(`${label} failed: expected ${status}, received ${response.status}`);
  }
  pass(label);
}

function assertPublicJsonSafe(label, value, optionIds = []) {
  const serialized = JSON.stringify(value);
  if (PUBLIC_JSON_DENYLIST.test(serialized)) {
    throw new Error(`${label} exposed a forbidden public field in JSON`);
  }
  for (const optionId of optionIds) {
    if (serialized.includes(optionId)) {
      throw new Error(`${label} exposed internal option id`);
    }
  }
}

async function requestText(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  return { response, body: await response.text() };
}

async function requestJson(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const contentType = response.headers.get('content-type') ?? '';
  const body = contentType.includes('application/json')
    ? await response.json()
    : await response.text();
  return { response, body };
}

async function resetDatabase(client) {
  await client.query(`TRUNCATE TABLE ${BUSINESS_TABLES.join(', ')} RESTART IDENTITY CASCADE`);
  await client.query(
    `INSERT INTO users (id, display_name, trust_level)
     VALUES ($1, 'Public Smoke Voter', 'official'),
            ($2, 'Public Smoke Read Admin', 'low')`,
    [voterId, readAdminId],
  );
  await client.query(
    `INSERT INTO admin_users (user_id, role, status)
     VALUES ($1, 'admin', 'active')`,
    [readAdminId],
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
]);

const client = new Client({ connectionString: LOCAL_TEST_DATABASE_URL });
await client.connect();
let server;
let closePool;

try {
  await resetDatabase(client);
  const { createApp } = await import('../dist/app.js');
  ({ closePool } = await import('../dist/db/client.js'));
  server = createApp().startHttpServer(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Public flow smoke server failed to bind.');
  }
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const closesAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  {
    const { response, body } = await requestText(baseUrl, '/');
    expectStatus('GET / landing page', response, 200);
    if (!body.includes('href="/polls/new"')) {
      throw new Error('Landing page missing link to /polls/new');
    }
    if (!body.includes('href="/explore"')) {
      throw new Error('Landing page missing link to /explore placeholder');
    }
    if (!body.includes('/frontend/public-mvp.css')) {
      throw new Error('Landing page missing shared public MVP stylesheet');
    }
    pass('GET / links /polls/new and /explore');
  }

  {
    const { response, body } = await requestText(baseUrl, '/explore');
    expectStatus('GET /explore feed page', response, 200);
    if (!body.includes('explore-feed') || !body.includes('/frontend/public-mvp.css')) {
      throw new Error('Explore feed page missing layout marker or shared stylesheet');
    }
    if (!body.includes('/frontend/explore-page.js')) {
      throw new Error('Explore feed page missing explore-page script');
    }
    if (!body.includes('data-explore-feed="freshness-only"')) {
      throw new Error('Explore feed page missing freshness-only marker');
    }
    if (/option_id|shard_id|vote_token|personalization|mvp-result-preview/i.test(body)) {
      throw new Error('Explore feed page exposed forbidden technical fields');
    }
    pass('GET /explore serves freshness-only feed UI');
  }

  {
    const exploreScript = await requestText(baseUrl, '/frontend/explore-page.js');
    expectStatus('GET /frontend/explore-page.js', exploreScript.response, 200);
    if (!exploreScript.body.includes('/polls/feed')) {
      throw new Error('Explore page script missing feed API path');
    }
    pass('GET /frontend/explore-page.js serves explore feed client');
  }

  {
    const feed = await requestJson(baseUrl, '/polls/feed?limit=5');
    expectStatus('GET /polls/feed', feed.response, 200);
    const serialized = JSON.stringify(feed.body);
    if (!Array.isArray(feed.body.polls)) {
      throw new Error('Feed response missing polls array');
    }
    if (/option_id|vote_count|published_at|closes_at|rank|hot|trend|personalization/i.test(serialized)) {
      throw new Error('Feed JSON exposed forbidden fields');
    }
    pass('GET /polls/feed returns privacy-safe freshness-only payload');
  }

  {
    const { response, body } = await requestText(baseUrl, '/frontend/public-mvp.css');
    expectStatus('GET /frontend/public-mvp.css', response, 200);
    if (!body.includes('.mvp-shell')) {
      throw new Error('Shared public MVP stylesheet missing layout rules');
    }
    pass('GET /frontend/public-mvp.css serves shared styles');
  }

  {
    const { response, body } = await requestText(baseUrl, '/polls/new');
    expectStatus('GET /polls/new create page', response, 200);
    if (!body.includes('create-poll-page.js')) {
      throw new Error('Create poll page missing create-poll-page.js script');
    }
    if (!body.includes('aria-live') || !body.includes('role="status"')) {
      throw new Error('Create poll page missing accessible status regions');
    }
    if (!body.includes('/frontend/public-mvp.css')) {
      throw new Error('Create poll page missing shared public MVP stylesheet');
    }
    pass('GET /polls/new serves create poll page');
  }

  {
    const { response, body } = await requestText(baseUrl, '/frontend/create-poll-page.js');
    expectStatus('GET /frontend/create-poll-page.js', response, 200);
    if (!body.includes('renderPollSharePanel')) {
      throw new Error('Create poll frontend missing share panel helper');
    }
    pass('Create poll JS wires share panel after creation');
  }

  {
    const { response, body } = await requestText(baseUrl, '/frontend/public-mvp-ui.js');
    expectStatus('GET /frontend/public-mvp-ui.js', response, 200);
    if (!body.includes('複製投票連結') || !body.includes('複製結果連結')) {
      throw new Error('Public MVP UI missing copy-link actions');
    }
    if (!body.includes('buildAbsoluteUrl') || !body.includes('share-url')) {
      throw new Error('Public MVP UI missing absolute share URL helpers');
    }
    const shareSnippet = body.slice(
      body.indexOf('renderPollSharePanel'),
      body.indexOf('renderPollSharePanel') + 1200,
    );
    if (PUBLIC_JSON_DENYLIST.test(shareSnippet)) {
      throw new Error('Share panel helper references forbidden public fields');
    }
    pass('Public MVP UI includes share/copy helpers with safe URLs');
  }

  let pollId;
  {
    const { response, body } = await requestJson(baseUrl, '/polls', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': creatorId,
      },
      body: JSON.stringify({
        title: 'Public Smoke Lunch Poll',
        description: 'Local smoke only',
        category: 'general',
        options: ['Rice', 'Noodles'],
        eligible_rule_id: null,
        closes_at: closesAt,
        publish: true,
      }),
    });
    expectStatus('POST /polls creates poll', response, 201);
    assertPublicJsonSafe('POST /polls response', body);
    pollId = body.poll_id;
    if (typeof pollId !== 'string' || pollId.length === 0) {
      throw new Error('POST /polls did not return poll_id');
    }
    pass(`POST /polls returned poll_id ${pollId}`);
  }

  {
    const { response, body } = await requestText(baseUrl, `/vote/${pollId}`);
    expectStatus('GET /vote/:pollId voting page', response, 200);
    if (!body.includes('/frontend/public-mvp.css')) {
      throw new Error('Vote page missing shared public MVP stylesheet');
    }
    pass('GET /vote/:pollId links shared stylesheet');
  }

  let optionIds = [];
  {
    const { response, body } = await requestJson(baseUrl, `/polls/${pollId}`);
    expectStatus('GET /polls/:pollId public detail', response, 200);
    if (!Array.isArray(body.options) || body.options.length < 2) {
      throw new Error('Public poll detail missing options');
    }
    for (const option of body.options) {
      if (!Number.isInteger(option.option_index) || typeof option.label !== 'string') {
        throw new Error('Public poll detail option shape invalid');
      }
      if ('option_id' in option) {
        throw new Error('Public poll detail exposed option_id');
      }
    }
    const { rows } = await client.query(
      'SELECT id FROM poll_options WHERE poll_id = $1 ORDER BY option_order ASC',
      [pollId],
    );
    optionIds = rows.map((row) => row.id);
    assertPublicJsonSafe('GET /polls/:pollId public detail', body, optionIds);
    pass('GET /polls/:pollId has option_index labels only');
  }

  {
    const { response, body } = await requestJson(
      baseUrl,
      `/polls/${pollId}/vote-by-index`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': voterId,
        },
        body: JSON.stringify({ option_index: 0 }),
      },
    );
    expectStatus('POST /polls/:pollId/vote-by-index', response, 201);
    assertPublicJsonSafe('POST vote-by-index response', body, optionIds);
    pass('POST vote-by-index response is display-safe');
  }

  {
    const { response, body } = await requestJson(baseUrl, `/polls/${pollId}/results`);
    expectStatus('GET /polls/:pollId/results display-safe API', response, 200);
    assertPublicJsonSafe('GET /polls/:pollId/results', body, optionIds);
    pass('GET /polls/:pollId/results is display-safe');
  }

  {
    const { response, body } = await requestText(baseUrl, `/results/${pollId}`);
    expectStatus('GET /results/:pollId result page', response, 200);
    if (!body.includes('/frontend/public-mvp.css')) {
      throw new Error('Results page missing shared public MVP stylesheet');
    }
    if (!body.includes('results-intro') || !body.includes('公開結果（唯讀）')) {
      throw new Error('Results page missing read-only result semantics');
    }
    pass('GET /results/:pollId links shared stylesheet');
  }

  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  server = undefined;
} finally {
  if (server) {
    await new Promise((resolve) => server.close(() => resolve()));
  }
  await closePool?.();
  await client.end();
}

console.log('\nPublic flow local smoke passed (/ → /polls/new → /vote → /results).');
console.log('Docker test container remains running for the next rerun.');
