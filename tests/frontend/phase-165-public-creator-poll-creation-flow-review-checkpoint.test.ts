import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const CREATE_POLL_HTML_SHELLS = ['public/create-poll.html'];

const PROTECTED_BACKEND_PATHS = [
  'src/http/creator-session-routes.ts',
  'src/http/creator-poll-routes.ts',
  'src/http/creator-auth.ts',
  'src/polls/repository.ts',
  'src/auth/user-auth-resolver.ts',
  'migrations',
];

const CREATE_POLL_ALLOWED_BODY_KEYS = [
  'title',
  'description',
  'options',
  'category',
  'eligible_rule_id',
  'closes_at',
  'publish',
] as const;

const FORBIDDEN_LEAKAGE_COPY =
  /option_id|vote_token|token_sha256|shard_id|session_id|www_session|\buser_id\b|raw_count|poll_option_vote_counters|creator_token|error\.message|JSON\.stringify\(error/i;

const FORBIDDEN_OUTCOME_COPY =
  /你符合資格|你不符合資格|已投過票|可以投票|一定能投票|can_vote|age_passed|region_passed|trust_passed|role_passed/i;

const FORBIDDEN_EXTRA_PROFILE_FIELDS =
  /gender|性別|exact birthday|精確生日|full date of birth|完整出生日|\baddress\b|GPS|geocode|precise location|精準位置|demographic breakdown/i;

const FORBIDDEN_OBSERVABILITY =
  /console\.(log|info|warn|error|debug)|analytics|datadog|sentry|apm|trackEvent|gtag\(/i;

const COUNTER_PREVIEW_COPY =
  /結果預覽|mvp-result-preview|vote_count|(?<!不顯示)票數|百分比|熱門|趨勢/i;

function stripJsComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 165 public creator poll creation flow review checkpoint', () => {
  it('keeps static showcase and live creator flow separated via parseLiveApiMode', async () => {
    const { parseLiveApiMode } = await loadModule('public/frontend/public-mvp-demo.js');
    const { submitCreatePollDemo } = await loadModule('public/frontend/create-poll-page.js');
    const createSource = await readFile(
      join(process.cwd(), 'public/frontend/create-poll-page.js'),
      'utf8',
    );
    const fetchImpl = vi.fn();

    expect(parseLiveApiMode('')).toBe(false);
    expect(parseLiveApiMode('?nav=guest')).toBe(false);
    expect(parseLiveApiMode('?live=1')).toBe(true);
    expect(parseLiveApiMode('?live=0')).toBe(false);

    const demo = submitCreatePollDemo({
      formValues: { title: '示範問卷', description: '說明', options: ['甲', '乙'] },
    });
    expect(demo.poll_id).toBe('demo');
    expect(demo.status).toBe('demo_static');
    expect(fetchImpl).not.toHaveBeenCalled();

    expect(createSource).toContain('const useLiveApi = parseLiveApiMode(search)');
    expect(createSource).toMatch(/if \(useLiveApi\) \{[\s\S]*ensureCreatorSessionForLiveMode/);
    expect(createSource).toMatch(
      /const created = useLiveApi[\s\S]*submitCreatePoll\([\s\S]*: submitCreatePollDemo/,
    );
    expect(createSource).toContain('demoStatic: !useLiveApi');
  });

  it('keeps live path on creator_session only with localhost demo bootstrap before POST /creator/polls', async () => {
    const { ensureCreatorSessionForLiveMode, LOCAL_DEMO_CREATOR_USER_ID } =
      await loadModule('public/frontend/poll-lifecycle-controls.js');
    const createSource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/create-poll-page.js'), 'utf8'),
    );

    const remote401Fetch = vi.fn().mockResolvedValue({ ok: false, status: 401 });
    await expect(
      ensureCreatorSessionForLiveMode({
        fetchImpl: remote401Fetch,
        locationObject: { hostname: 'example.test' },
      }),
    ).rejects.toThrow('目前無法確認發起者身分，請稍後再試。');

    const localhostFetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 401 })
      .mockResolvedValueOnce({ ok: true });
    await ensureCreatorSessionForLiveMode({
      fetchImpl: localhostFetch,
      locationObject: { hostname: 'localhost' },
    });
    expect(localhostFetch).toHaveBeenNthCalledWith(2, '/creator/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: LOCAL_DEMO_CREATOR_USER_ID }),
      credentials: 'same-origin',
    });

    expect(createSource).toContain('/creator/polls');
    expect(createSource).toContain('ensureCreatorSessionForLiveMode');
    expect(createSource).not.toMatch(/POST\s*\/login\/session|GET\s*\/users\/me/);
    expect(createSource).not.toMatch(/X-User-Id|X-Display-Name/i);
  });

  it('keeps production identity on UserAuthResolver/login session and away from create runtime', async () => {
    const createSource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/create-poll-page.js'), 'utf8'),
    );
    const credentialVerifierTest = await readFile(
      join(process.cwd(), 'tests/auth/production-credential-verifier.test.ts'),
      'utf8',
    );

    expect(createSource).not.toMatch(
      /UserAuthResolver|\/users\/me|users\/me\/profile|vote-by-index|reference-answer/i,
    );
    expect(credentialVerifierTest).toContain('creator_session');
    expect(createSource).not.toContain('creator_session');
  });

  it('limits live POST /creator/polls body to approved poll-definition fields only', async () => {
    const { submitCreatePoll } = await loadModule('public/frontend/create-poll-page.js');
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        poll_id: '22222222-2222-4222-8222-222222222222',
        status: 'active',
      }),
    }));

    await submitCreatePoll({
      formValues: {
        title: '午餐想吃什麼？',
        description: '今天的選擇',
        options: ['飯', '麵'],
      },
      fetchImpl,
      now: () => new Date('2026-05-31T12:00:00.000Z'),
    });

    const [, init] = fetchImpl.mock.calls[0]!;
    const body = JSON.parse(String(init?.body));
    expect(Object.keys(body).sort()).toEqual([...CREATE_POLL_ALLOWED_BODY_KEYS].sort());
    expect(body.eligible_rule_id).toBeNull();
    expect(body.category).toBe('general');
    expect(body.publish).toBe(true);
    expect(JSON.stringify(init)).not.toMatch(
      /birth_year_month|residential_region|display_name|analytics|tracking|demographic|gender/i,
    );
  });

  it('keeps static create-poll.html in demo posture with disabled future eligibility fields', async () => {
    const html = await readFile(join(process.cwd(), 'public/create-poll.html'), 'utf8');

    expect(html).toContain('公開展示版');
    expect(html).toContain('展示用，不儲存');
    expect(html).toContain('資料不會儲存');
    expect(html).toContain('收集中看不到期中結果');
    expect(html).toContain('mvp-form-demo-fields');
    expect(html).toContain('正式上線後開放');
    expect(html).toMatch(/poll-eligibility-age[\s\S]*disabled/);
    expect(html).toMatch(/poll-eligibility-region[\s\S]*disabled/);
    expect(html).toMatch(/poll-close-at[\s\S]*disabled/);
    expect(html).not.toMatch(FORBIDDEN_EXTRA_PROFILE_FIELDS);
  });

  it('maps live create API failures to neutral copy without echoing backend payloads', async () => {
    const { submitCreatePoll } = await loadModule('public/frontend/create-poll-page.js');
    const fetchImpl = vi.fn(async () => ({
      ok: false,
      json: async () => ({
        error: 'INTERNAL',
        message: 'option_id leak and vote_token secret',
      }),
    }));

    await expect(
      submitCreatePoll({
        formValues: { title: 'Question', options: ['One', 'Two'] },
        fetchImpl,
      }),
    ).rejects.toThrow('目前無法建立問卷，請稍後再試。');
    await expect(
      submitCreatePoll({
        formValues: { title: 'Question', options: ['One', 'Two'] },
        fetchImpl,
      }),
    ).rejects.not.toThrow(/option_id|vote_token|INTERNAL/i);
  });

  it('keeps create success share UI on public routes without internal token or counter leakage', async () => {
    const { renderCreatePollSuccess } = await loadModule('public/frontend/create-poll-page.js');

    function createElement(tagName: string) {
      return {
        tagName: tagName.toUpperCase(),
        ownerDocument: documentObject,
        textContent: '',
        href: '',
        hidden: false,
        children: [] as ReturnType<typeof createElement>[],
        attributes: new Map<string, string>(),
        className: '',
        setAttribute(name: string, value: string) {
          this.attributes.set(name, value);
        },
        addEventListener() {},
        append(child: ReturnType<typeof createElement>) {
          this.children.push(child);
        },
        replaceChildren() {
          this.children = [];
        },
      };
    }
    let documentObject: { createElement(tagName: string): ReturnType<typeof createElement> };
    documentObject = { createElement };
    const root = createElement('section');

    renderCreatePollSuccess(
      root as never,
      { poll_id: '22222222-2222-4222-8222-222222222222' },
      {
        locationObject: { origin: 'https://example.test' },
        skipCreatorControls: true,
      },
    );

    const serialized = JSON.stringify(root);
    expect(serialized).toContain('/vote/22222222-2222-4222-8222-222222222222');
    expect(serialized).toContain('/results/22222222-2222-4222-8222-222222222222');
    expect(serialized).not.toMatch(FORBIDDEN_LEAKAGE_COPY);
  });

  it('keeps post-create lifecycle actions limited to collecting and post_lock states', async () => {
    const { lifecycleActionsForState } = await loadModule('public/frontend/poll-lifecycle-controls.js');

    expect(lifecycleActionsForState('collecting')).toEqual(['cancel', 'close']);
    expect(lifecycleActionsForState('revealed')).toEqual([]);
    expect(lifecycleActionsForState('locked')).toEqual([]);
    expect(lifecycleActionsForState('post_lock')).toEqual(['unpublish']);
  });

  it('keeps policy-ui-placeholders.js as independent policy-panel layer from HELP_COPY', async () => {
    const createSource = await readFile(
      join(process.cwd(), 'public/frontend/create-poll-page.js'),
      'utf8',
    );
    const policySource = await readFile(
      join(process.cwd(), 'public/frontend/policy-ui-placeholders.js'),
      'utf8',
    );

    expect(createSource).toContain("from './policy-ui-placeholders.js'");
    expect(createSource).toContain('mountUiMockPreviewChrome');
    expect(createSource).not.toContain('HELP_COPY');
    expect(policySource).toContain('HELP_COPY');
  });

  it('does not mark protected backend/auth/schema paths with Phase 165 changes', async () => {
    for (const relativePath of PROTECTED_BACKEND_PATHS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8').catch(() => '');
      if (!source) {
        continue;
      }
      expect(source, relativePath).not.toContain('Phase 165');
    }
  });

  it('keeps create poll runtime modules free of linkage, eligibility outcomes, and observability hooks', async () => {
    const leakageScanModules = [
      'public/frontend/create-poll-page.js',
      'public/frontend/creator-flow-copy.js',
      'public/frontend/public-mvp-demo.js',
    ];
    for (const relativePath of leakageScanModules) {
      const source = stripJsComments(
        await readFile(join(process.cwd(), relativePath), 'utf8'),
      );
      expect(source, relativePath).not.toMatch(FORBIDDEN_LEAKAGE_COPY);
      expect(source, relativePath).not.toMatch(FORBIDDEN_OBSERVABILITY);
      expect(source, relativePath).not.toMatch(FORBIDDEN_OUTCOME_COPY);
      expect(source, relativePath).not.toMatch(FORBIDDEN_EXTRA_PROFILE_FIELDS);
      if (relativePath === 'public/frontend/create-poll-page.js') {
        expect(source, relativePath).not.toMatch(COUNTER_PREVIEW_COPY);
      }
    }

    const lifecycleSource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/poll-lifecycle-controls.js'), 'utf8'),
    );
    expect(lifecycleSource).not.toMatch(FORBIDDEN_OBSERVABILITY);
    expect(lifecycleSource).not.toMatch(FORBIDDEN_OUTCOME_COPY);

    for (const relativePath of CREATE_POLL_HTML_SHELLS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toMatch(FORBIDDEN_OUTCOME_COPY);
      expect(source, relativePath).not.toContain('Phase 165');
    }
  });

  it('keeps vote-by-index body unchanged and Official Vote transaction order unchanged', async () => {
    const votePage = await loadModule('public/frontend/vote-page.js');
    const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => ({
      ok: true,
      status: 201,
      json: async () => ({
        vote_token: 'secret-token',
        option_id: 'secret-option',
        shard_id: 7,
      }),
    }));

    await votePage.submitVoteByIndex({
      pollId: '11111111-1111-4111-8111-111111111111',
      optionIndex: 1,
      userId: '44444444-4444-4444-8444-444444444444',
      fetchImpl,
    });

    const body = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body));
    expect(body).toEqual({ option_index: 1 });
    expect(body).not.toHaveProperty('option_id');

    const repository = await readFile(join(process.cwd(), 'src/polls/repository.ts'), 'utf8');
    const transactionStart = repository.indexOf('async function castOfficialVote(');
    const transactionEnd = repository.indexOf('async function resolveOfficialVoteOptionIdWithClient');
    const transactionBody = repository.slice(transactionStart, transactionEnd);
    const eligibilityCheck = transactionBody.indexOf('isProfileEligibleForOfficialVote');
    const optionResolution = transactionBody.indexOf('resolveOfficialVoteOptionIdWithClient');
    const tokenWrite = transactionBody.indexOf('insertVoteToken');
    const counterIncrement = transactionBody.indexOf('incrementVoteCounter');

    expect(eligibilityCheck).toBeGreaterThan(-1);
    expect(optionResolution).toBeGreaterThan(eligibilityCheck);
    expect(tokenWrite).toBeGreaterThan(optionResolution);
    expect(counterIncrement).toBeGreaterThan(tokenWrite);
  });
});
