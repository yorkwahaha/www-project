import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const REVIEWED_CREATE_POLL_FILES = [
  'public/create-poll.html',
  'public/frontend/create-poll-page.js',
  'public/frontend/creator-flow-copy.js',
];

const FORBIDDEN_OUTCOME_COPY =
  /你符合資格|你不符合資格|已投過票|可以投票|一定能投票|can_vote|age_passed|region_passed|trust_passed|role_passed/i;

const FORBIDDEN_INTERNAL_COPY =
  /option_id|vote_token|token_sha256|shard_id|session_id|www_session|\buser_id\b|raw_count|poll_option_vote_counters/i;

const FORBIDDEN_EXTRA_PROFILE_FIELDS =
  /gender|性別|exact birthday|精確生日|full date of birth|完整出生日|\baddress\b|GPS|geocode|precise location|精準位置|demographic breakdown/i;

const COUNTER_PREVIEW_COPY =
  /結果預覽|mvp-result-preview|vote_count|(?<!不顯示)票數|百分比|熱門|趨勢/i;

const CREATE_POLL_ALLOWED_BODY_KEYS = [
  'title',
  'description',
  'options',
  'category',
  'eligible_rule_id',
  'closes_at',
  'publish',
] as const;

function stripJsComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

async function loadCreatePollModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/create-poll-page.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

async function loadDemoModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/public-mvp-demo.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

async function loadLifecycleModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/poll-lifecycle-controls.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 129 creator poll creation runtime review checkpoint', () => {
  it('separates static showcase from live creator flow via parseLiveApiMode', async () => {
    const { parseLiveApiMode } = await loadDemoModule();

    expect(parseLiveApiMode('')).toBe(false);
    expect(parseLiveApiMode('?nav=guest')).toBe(false);
    expect(parseLiveApiMode('?live=1')).toBe(true);
    expect(parseLiveApiMode('?live=1&nav=logged-in-mock')).toBe(true);
    expect(parseLiveApiMode('?live=0')).toBe(false);
  });

  it('keeps static submitCreatePollDemo off creator APIs with demo poll id', async () => {
    const { submitCreatePollDemo } = await loadCreatePollModule();
    const fetchImpl = vi.fn();

    const created = submitCreatePollDemo({
      formValues: {
        title: '示範問卷',
        description: '說明',
        options: ['甲', '乙'],
      },
    });

    expect(created.poll_id).toBe('demo');
    expect(created.status).toBe('demo_static');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('limits live POST /creator/polls body to approved poll-definition fields only', async () => {
    const { submitCreatePoll } = await loadCreatePollModule();
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

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [, init] = fetchImpl.mock.calls[0]!;
    const body = JSON.parse(String(init?.body));
    expect(Object.keys(body).sort()).toEqual([...CREATE_POLL_ALLOWED_BODY_KEYS].sort());
    expect(body.eligible_rule_id).toBeNull();
    expect(body.category).toBe('general');
    expect(body.publish).toBe(true);
    expect(JSON.stringify(init)).not.toMatch(
      /birth_year_month|residential_region|display_name|analytics|tracking|demographic|gender|X-User-Id|X-Display-Name/i,
    );
  });

  it('maps live create API failures to neutral copy without echoing backend payloads', async () => {
    const { submitCreatePoll } = await loadCreatePollModule();
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

  it('bootstraps live path through ensureCreatorSessionForLiveMode before POST /creator/polls', async () => {
    const source = await readFile(
      join(process.cwd(), 'public/frontend/create-poll-page.js'),
      'utf8',
    );

    expect(source).toContain('const useLiveApi = parseLiveApiMode(search)');
    expect(source).toMatch(/if \(useLiveApi\) \{[\s\S]*ensureCreatorSessionForLiveMode/);
    expect(source).toMatch(
      /const created = useLiveApi[\s\S]*submitCreatePoll\([\s\S]*: submitCreatePollDemo/,
    );
    expect(source).toContain('demoStatic: !useLiveApi');
    expect(source).toContain('SAFE_FAILURE_MESSAGE');
    expect(source).toMatch(/if \(!response\.ok\) \{[\s\S]*throw new Error\(SAFE_FAILURE_MESSAGE\)/);
  });

  it('keeps creator session bootstrap on localhost demo boundary with neutral failure copy', async () => {
    const { ensureCreatorSessionForLiveMode, LOCAL_DEMO_CREATOR_USER_ID } =
      await loadLifecycleModule();

    const remote401Fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
    });
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
  });

  it('keeps create runtime away from vote/profile/Reference Answer paths and observability sinks', async () => {
    const source = stripJsComments(
      await readFile(
        join(process.cwd(), 'public/frontend/create-poll-page.js'),
        'utf8',
      ),
    );

    expect(source).toContain('/creator/polls');
    expect(source).toContain('ensureCreatorSessionForLiveMode');
    expect(source).not.toMatch(
      /\/users\/me|users\/me\/profile|vote-by-index|reference-answer|\/polls\/feed|\/polls\/.*\/results|X-User-Id|X-Display-Name|localStorage|sessionStorage|indexedDB|navigator\.sendBeacon|console\.|analytics|apm\.|trace\./i,
    );
    expect(source).not.toMatch(/POST \/login\/session|GET \/users\/me/);
  });

  it('keeps static create-poll.html in demo posture with disabled future eligibility fields', async () => {
    const html = await readFile(join(process.cwd(), 'public/create-poll.html'), 'utf8');

    expect(html).toContain('展示模式');
    expect(html).toContain('展示用，不儲存');
    expect(html).toContain('資料不會儲存');
    expect(html).toContain('收集中看不到期中票數或百分比');
    expect(html).toContain('mvp-form-demo-fields');
    expect(html).toContain('正式上線後開放');
    expect(html).toMatch(/poll-eligibility-age[\s\S]*disabled/);
    expect(html).toMatch(/poll-eligibility-region[\s\S]*disabled/);
    expect(html).toMatch(/poll-close-at[\s\S]*disabled/);
    expect(html).not.toMatch(FORBIDDEN_INTERNAL_COPY);
    expect(html).not.toMatch(FORBIDDEN_EXTRA_PROFILE_FIELDS);
  });

  it('keeps create success share UI free of counter internals', async () => {
    const { renderCreatePollSuccess } = await loadCreatePollModule();

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
    expect(serialized).not.toMatch(FORBIDDEN_INTERNAL_COPY);
  });

  it('keeps post-create lifecycle actions limited to collecting and post_lock states', async () => {
    const { lifecycleActionsForState } = await loadLifecycleModule();

    expect(lifecycleActionsForState('collecting')).toEqual(['cancel', 'close']);
    expect(lifecycleActionsForState('revealed')).toEqual([]);
    expect(lifecycleActionsForState('locked')).toEqual([]);
    expect(lifecycleActionsForState('post_lock')).toEqual(['unpublish']);
  });

  for (const relativePath of REVIEWED_CREATE_POLL_FILES) {
    it(`keeps reviewed create-poll copy neutral in ${relativePath}`, async () => {
      const raw = await readFile(join(process.cwd(), relativePath), 'utf8');
      const source = relativePath.endsWith('.js') ? stripJsComments(raw) : raw;

      expect(source, relativePath).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(source, relativePath).not.toMatch(FORBIDDEN_EXTRA_PROFILE_FIELDS);
      expect(source, relativePath).not.toMatch(FORBIDDEN_OUTCOME_COPY);
      if (relativePath === 'public/frontend/create-poll-page.js') {
        expect(source, relativePath).not.toMatch(COUNTER_PREVIEW_COPY);
      }
    });
  }

  it('keeps Phase 129 user-visible create messages free of forbidden internals', async () => {
    const { normalizeCreatePollForm } = await loadCreatePollModule();
    const { LIFECYCLE_TRANSITION_COPY } = await loadLifecycleModule();

    expect(() =>
      normalizeCreatePollForm({ title: ' ', options: ['One', 'Two'] }),
    ).toThrow('請填寫問卷標題。');
    expect(() =>
      normalizeCreatePollForm({ title: 'Q', options: ['One', '  '] }),
    ).toThrow('請至少填寫兩個選項。');

    const userVisibleMessages = [
      '目前無法建立問卷，請稍後再試。',
      '目前無法確認發起者身分，請稍後再試。',
      '建立問卷（展示用，不儲存）',
      '建立問卷',
      '表單通過檢查（展示用），資料不會儲存。',
      '問卷已建立。',
      '建立中，請稍候。',
      '請填寫問卷標題。',
      '請至少填寫兩個選項。',
      ...Object.values(LIFECYCLE_TRANSITION_COPY).map((copy) => copy.success),
    ];

    for (const message of userVisibleMessages) {
      expect(message).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(message).not.toMatch(FORBIDDEN_OUTCOME_COPY);
    }
  });
});
