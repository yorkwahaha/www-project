import { createHash } from 'node:crypto';
import { createServer as createNetServer } from 'node:net';
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
const smokeAuthUserId = '99999999-9999-4999-8999-999999999999';
const smokeAuthToken = 'FAKE-LOCAL-REGISTRATION-LOGIN-SMOKE-ONLY';

const BUSINESS_TABLES = [
  'admin_decision_logs',
  'poll_correction_logs',
  'poll_correction_requests',
  'public_notices',
  'admin_users',
  'creator_sessions',
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

async function findOpenPort() {
  const probe = createNetServer();
  await new Promise((resolve, reject) => {
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', resolve);
  });
  const address = probe.address();
  if (!address || typeof address === 'string') {
    throw new Error('Failed to reserve a local smoke port.');
  }
  const port = address.port;
  await new Promise((resolve, reject) => {
    probe.close((error) => (error ? reject(error) : resolve()));
  });
  return port;
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
            ($2, 'Public Smoke Read Admin', 'low'),
            ($3, 'Public Smoke Creator', 'low')`,
    [voterId, readAdminId, creatorId],
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
  const port = await findOpenPort();
  const baseUrl = `http://127.0.0.1:${port}`;
  process.env.APP_ENV = 'test';
  process.env.CREATOR_SESSION_ALLOW_INSECURE_COOKIE = 'true';
  process.env.CREATOR_SESSION_LOCAL_TEST_ISSUER_ENABLED = 'true';
  process.env.CREATOR_SESSION_ALLOWED_ORIGINS_JSON = JSON.stringify([baseUrl]);
  process.env.LOGIN_SESSION_ALLOWED_ORIGINS_JSON = JSON.stringify([baseUrl]);
  process.env.USER_AUTH_CREDENTIALS_JSON = JSON.stringify([
    {
      token_sha256: tokenDigest(smokeAuthToken),
      user_id: smokeAuthUserId,
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]);
  const { createApp } = await import('../dist/app.js');
  ({ closePool } = await import('../dist/db/client.js'));
  server = createApp().startHttpServer(port);
  await new Promise((resolve) => server.once('listening', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Public flow smoke server failed to bind.');
  }
  const closesAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  {
    const { response, body } = await requestText(baseUrl, '/');
    expectStatus('GET / landing page', response, 200);
    if (!body.includes('href="/polls/new"')) {
      throw new Error('Landing page missing link to /polls/new');
    }
    if (!body.includes('href="/explore"')) {
      throw new Error('Landing page missing link to /explore');
    }
    const hasExploreLiveFeedCopy =
      body.includes('最近發布') &&
      body.includes('靜態範例') &&
      !body.includes('完整探索列表將在正式上線後開放');
    if (!hasExploreLiveFeedCopy) {
      throw new Error(
        'Landing page missing live explore feed copy (recently published + static examples)',
      );
    }
    if (!body.includes('/frontend/public-mvp.css')) {
      throw new Error('Landing page missing shared public MVP stylesheet');
    }
    if (!body.includes('href="/registration"') || !body.includes('href="/login"')) {
      throw new Error('Landing page missing registration/login auth navigation links');
    }
    if (!body.includes('不會自動登入') || !body.includes('登入後頁首才顯示帳號名稱')) {
      throw new Error('Landing page missing registration/login flow copy');
    }
    pass('GET / links /polls/new and /explore with live-feed copy');
    pass('GET / exposes registration/login auth navigation copy');
  }

  {
    const { response, body } = await requestText(baseUrl, '/registration');
    expectStatus('GET /registration page', response, 200);
    if (!body.includes('data-login-state-read="disabled"')) {
      throw new Error('Registration page missing login-state-read opt-out marker');
    }
    if (!body.includes('registration-form') || !body.includes('/frontend/registration-page.js')) {
      throw new Error('Registration page missing registration form runtime');
    }
    if (!body.includes('href="/login"') || !body.match(/不會.*自動登入/)) {
      throw new Error('Registration page missing login guidance copy');
    }
    pass('GET /registration serves opt-out registration shell');
  }

  {
    const registrationScript = await requestText(baseUrl, '/frontend/registration-page.js');
    expectStatus('GET /frontend/registration-page.js', registrationScript.response, 200);
    if (/\/users\/me|\/login\/session|mountLoginStateRead/i.test(registrationScript.body)) {
      throw new Error('Registration page script references forbidden session/login-state calls');
    }
    pass('GET /frontend/registration-page.js avoids session/login-state reads');
  }

  {
    const { response, body } = await requestText(baseUrl, '/login');
    expectStatus('GET /login page', response, 200);
    if (!body.includes('login-shell-form') || !body.includes('/frontend/login-page.js')) {
      throw new Error('Login page missing production login shell');
    }
    if (!body.includes('href="/registration"') || !body.includes('註冊不會自動登入')) {
      throw new Error('Login page missing registration guidance copy');
    }
    pass('GET /login serves production login shell');
  }

  {
    const loginScript = await requestText(baseUrl, '/frontend/login-page.js');
    expectStatus('GET /frontend/login-page.js', loginScript.response, 200);
    if (
      !loginScript.body.includes('submitProductionLoginCredential') ||
      !loginScript.body.includes('mountLoginStateRead') ||
      !loginScript.body.includes('/login/session')
    ) {
      throw new Error('Login page script missing production login submit + state refresh wiring');
    }
    if (/birth_year_month|residential_region|option_id|option_text|option_index/i.test(loginScript.body)) {
      throw new Error('Login page script references forbidden profile or option fields');
    }
    pass('GET /frontend/login-page.js wires login submit and users/me refresh');
  }

  {
    const { response, body } = await requestText(baseUrl, '/profile');
    expectStatus('GET /profile page', response, 200);
    if (!body.includes('profile-unauthenticated') || !body.includes('/frontend/profile-page.js')) {
      throw new Error('Profile page missing production profile shell');
    }
    if (!body.includes('href="/login"') || !body.includes('name="birth_year_month"')) {
      throw new Error('Profile page missing login guidance or profile fields');
    }
  }
  pass('GET /profile serves production profile shell');

  {
    const profileScript = await requestText(baseUrl, '/frontend/profile-page.js');
    expectStatus('GET /frontend/profile-page.js', profileScript.response, 200);
    if (
      !profileScript.body.includes('readLoginState') ||
      !profileScript.body.includes("credentials: 'same-origin'") ||
      !profileScript.body.includes('/users/me/profile')
    ) {
      throw new Error('Profile page script missing session profile load/save wiring');
    }
    if (
      /X-User-Id|\/login\/session|\/registration|\/vote|reference-answer|option_id|option_text|option_index/i.test(
        profileScript.body,
      )
    ) {
      throw new Error('Profile page script references forbidden auth/vote/option paths');
    }
    pass('GET /frontend/profile-page.js wires session profile load/save only');
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

  {
    const registration = await requestJson(baseUrl, '/registration', {
      method: 'POST',
      headers: {
        Origin: baseUrl,
        Authorization: `Bearer ${smokeAuthToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        display_name: 'Public Smoke Registered User',
        birth_year_month: '1998-07',
        residential_region: 'TW-TPE',
      }),
    });
    expectStatus('POST /registration creates account without session', registration.response, 201);
    if (registration.response.headers.get('set-cookie')) {
      throw new Error('POST /registration must not issue Set-Cookie');
    }
    if (
      registration.body?.registered !== true ||
      registration.body?.login_required !== true
    ) {
      throw new Error('POST /registration returned unexpected success body');
    }
    pass('POST /registration returns login_required without Set-Cookie');
  }

  {
    const anonymousMe = await requestJson(baseUrl, '/users/me');
    expectStatus('GET /users/me before login stays anonymous', anonymousMe.response, 401);
    if (anonymousMe.body?.error !== 'AUTH_REQUIRED') {
      throw new Error('GET /users/me before login did not fail closed');
    }
    pass('GET /users/me before login is anonymous');
  }

  let loginCookie;
  {
    const login = await requestJson(baseUrl, '/login/session', {
      method: 'POST',
      headers: {
        Origin: baseUrl,
        Authorization: `Bearer ${smokeAuthToken}`,
      },
    });
    expectStatus('POST /login/session issues session after registration', login.response, 201);
    loginCookie = login.response.headers.get('set-cookie')?.split(';', 1)[0];
    if (!loginCookie) {
      throw new Error('POST /login/session did not set a session cookie');
    }
    pass('POST /login/session issues www_session cookie');
  }

  {
  // APP_ENV=test keeps creator_session + X-User-Id smoke paths available; session-cookie
  // GET /users/me is covered by tests/http/phase-95-registration-login-full-flow.test.ts.
    const { rows } = await client.query(
      `SELECT u.display_name,
              EXISTS (
                SELECT 1
                FROM user_sessions us
                WHERE us.user_id = u.id
                  AND us.revoked_at IS NULL
                  AND us.expires_at > NOW()
              ) AS has_active_session
       FROM users u
       WHERE u.id = $1`,
      [smokeAuthUserId],
    );
    if (rows.length !== 1) {
      throw new Error('Registration/login smoke user missing from users table');
    }
    if (rows[0].display_name !== 'Public Smoke Registered User') {
      throw new Error('Registration/login smoke user missing expected display_name');
    }
    if (!rows[0].has_active_session) {
      throw new Error('POST /login/session did not persist an active user session row');
    }
    pass('POST /login/session persisted active session for registered user display_name');
  }

  {
    const logout = await fetch(`${baseUrl}/login/session`, {
      method: 'DELETE',
      headers: {
        Origin: baseUrl,
        Cookie: loginCookie,
      },
    });
    expectStatus('DELETE /login/session after login', logout, 204);
    pass('DELETE /login/session revokes session');
  }

  {
    const anonymousMe = await requestJson(baseUrl, '/users/me', {
      headers: { Cookie: loginCookie },
    });
    expectStatus('GET /users/me after logout stays anonymous', anonymousMe.response, 401);
    pass('GET /users/me after logout is anonymous again');
  }

  let pollId;
  let creatorCookie;
  {
    const { response, body } = await requestJson(baseUrl, '/creator/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: baseUrl,
      },
      body: JSON.stringify({ user_id: creatorId }),
    });
    expectStatus('POST /creator/session issues local creator cookie', response, 201);
    creatorCookie = response.headers.get('set-cookie')?.split(';', 1)[0];
    if (!creatorCookie) {
      throw new Error('Creator session did not set a cookie');
    }
    assertPublicJsonSafe('POST /creator/session response', body);
  }

  {
    const { response, body } = await requestJson(baseUrl, '/creator/polls', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: creatorCookie,
        Origin: baseUrl,
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
    expectStatus('POST /creator/polls creates poll', response, 201);
    assertPublicJsonSafe('POST /creator/polls response', body);
    pollId = body.poll_id;
    if (typeof pollId !== 'string' || pollId.length === 0) {
      throw new Error('POST /creator/polls did not return poll_id');
    }
    pass(`POST /creator/polls returned poll_id ${pollId}`);
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

console.log(
  '\nPublic flow local smoke passed (/ → registration/login flow → /polls/new → /creator/polls → /vote → /results).',
);
console.log('Docker test container remains running for the next rerun.');
