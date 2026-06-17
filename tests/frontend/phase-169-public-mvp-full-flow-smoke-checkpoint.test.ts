import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PUBLIC_HTML_SHELLS = [
  'public/index.html',
  'public/registration.html',
  'public/login.html',
  'public/profile.html',
  'public/explore.html',
  'public/create-poll.html',
  'public/my-polls.html',
  'public/vote.html',
  'public/results.html',
  'public/faq.html',
  'public/trust-levels.html',
];

const PUBLIC_RUNTIME_MODULES = [
  'public/frontend/registration-page.js',
  'public/frontend/login-page.js',
  'public/frontend/profile-page.js',
  'public/frontend/explore-page.js',
  'public/frontend/create-poll-page.js',
  'public/frontend/my-polls-page.js',
  'public/frontend/vote-page.js',
  'public/frontend/official-vote-pre-vote-hints.js',
  'public/frontend/result-page.js',
];

const PROTECTED_BACKEND_PATHS = [
  'src/polls/repository.ts',
  'src/polls/feed-config.ts',
  'src/http/registration-routes.ts',
  'src/http/login-session-routes.ts',
  'src/http/official-vote-routes.ts',
  'src/http/creator-session-routes.ts',
  'src/http/creator-poll-routes.ts',
  'src/http/result-routes.ts',
  'src/http/reference-answer-routes.ts',
  'src/auth/user-auth-resolver.ts',
  'migrations',
];

const FORBIDDEN_LEAKAGE_COPY =
  /option_id|vote_token|token_sha256|shard_id|session_id|www_session|\buser_id\b|raw_count|poll_option_vote_counters|creator_token|error\.message|JSON\.stringify\(error/i;

const FORBIDDEN_OUTCOME_COPY =
  /你投過|你尚未投票|你符合資格|你不符合資格|已投過票|選擇了|投給哪個|可以投票|一定能投票|can_vote|age_passed|region_passed|trust_passed|role_passed/i;

const FORBIDDEN_OBSERVABILITY =
  /console\.(log|info|warn|error|debug)|analytics|datadog|sentry|apm|trackEvent|gtag\(/i;

const pollId = '22222222-2222-4222-8222-222222222222';

function stripJsComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

function createRoot() {
  let documentObject: {
    createElement(tagName: string): ReturnType<typeof createElement>;
  };
  function createElement(tagName: string) {
    return {
      tagName: tagName.toUpperCase(),
      ownerDocument: documentObject,
      className: '',
      href: '',
      textContent: '',
      hidden: false,
      dataset: {} as Record<string, string>,
      children: [] as ReturnType<typeof createElement>[],
      attributes: new Map<string, string>(),
      setAttribute(name: string, value: string) {
        this.attributes.set(name, value);
      },
      append(...nodes: ReturnType<typeof createElement>[]) {
        this.children.push(...nodes);
      },
      replaceChildren() {
        this.children = [];
      },
    };
  }
  documentObject = { createElement };
  return createElement('div');
}

function createDocumentStub() {
  function createElement(tagName: string) {
    return {
      tagName,
      className: '',
      textContent: '',
      href: '',
      hidden: false,
      dataset: {} as Record<string, string>,
      children: [] as ReturnType<typeof createElement>[],
      attributes: new Map<string, string>(),
      setAttribute(name: string, value: string) {
        this.attributes.set(name, value);
      },
      append(...nodes: ReturnType<typeof createElement>[]) {
        this.children.push(...nodes);
      },
    };
  }
  return { createElement };
}

function createPreVoteHintDocument() {
  const elements = new Map<string, ReturnType<ReturnType<typeof createDocumentStub>['createElement']>>();
  function createElement(tagName: string) {
    const element = {
      tagName: tagName.toUpperCase(),
      id: '',
      className: '',
      textContent: '',
      hidden: false,
      href: '',
      attributes: new Map<string, string>(),
      children: [] as ReturnType<typeof createElement>[],
      ownerDocument: null as unknown,
      setAttribute(name: string, value: string) {
        this.attributes.set(name, value);
      },
      replaceChildren() {
        this.children = [];
        this.textContent = '';
      },
      append(...nodes: ReturnType<typeof createElement>[]) {
        this.children.push(...nodes);
      },
      prepend(node: ReturnType<typeof createElement>) {
        this.children.unshift(node);
      },
    };
    element.ownerDocument = documentObject;
    return element;
  }
  const documentObject = {
    createElement,
    getElementById(id: string) {
      return elements.get(id) ?? null;
    },
    defaultView: { fetch: undefined },
  };
  const mount = createElement('aside');
  mount.id = 'official-vote-pre-vote-hint';
  elements.set('official-vote-pre-vote-hint', mount);
  return { documentObject: documentObject as unknown as Document, mount };
}

function collectText(node: unknown): string {
  const record = node as { textContent?: string; children?: unknown[]; href?: string };
  return [
    record.textContent ?? '',
    record.href ?? '',
    ...(record.children ?? []).map((child) => collectText(child)),
  ]
    .filter(Boolean)
    .join(' ');
}

describe('Phase 169 public MVP full-flow smoke checkpoint', () => {
  it('covers all public MVP HTML shells in the full-flow review scope', async () => {
    const index = await readFile(join(process.cwd(), 'public/index.html'), 'utf8');
    const registration = await readFile(join(process.cwd(), 'public/registration.html'), 'utf8');
    const explore = await readFile(join(process.cwd(), 'public/explore.html'), 'utf8');
    const createPoll = await readFile(join(process.cwd(), 'public/create-poll.html'), 'utf8');
    const myPolls = await readFile(join(process.cwd(), 'public/my-polls.html'), 'utf8');
    const faq = await readFile(join(process.cwd(), 'public/faq.html'), 'utf8');
    const trust = await readFile(join(process.cwd(), 'public/trust-levels.html'), 'utf8');

    for (const relativePath of PUBLIC_HTML_SHELLS) {
      const html = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(html.length, relativePath).toBeGreaterThan(0);
      expect(html, relativePath).not.toContain('Phase 169');
    }

    // Phase 301: the homepage is now an ultra-minimal collecting-only swipe
    // shell; its long-form account copy moved to the login/registration pages.
    expect(index).toContain('data-home-swipe-feed="collecting-only"');
    expect(registration).toContain('data-login-state-read="disabled"');
    expect(explore).toContain('data-explore-feed="freshness-only"');
    expect(createPoll).toContain('/frontend/create-poll-page.js');
    expect(myPolls).toContain('data-mock-dashboard="true"');
    expect(faq).toContain('/trust-levels');
    expect(trust).toContain('草案');
  });

  it('keeps registration -> login -> profile onboarding clear and separated', async () => {
    const registrationHtml = await readFile(
      join(process.cwd(), 'public/registration.html'),
      'utf8',
    );
    const loginHtml = await readFile(join(process.cwd(), 'public/login.html'), 'utf8');
    const profileHtml = await readFile(join(process.cwd(), 'public/profile.html'), 'utf8');
    const indexHtml = await readFile(join(process.cwd(), 'public/index.html'), 'utf8');
    const { shouldReadLoginState } = await loadModule('public/frontend/public-mvp-layout.js');

    expect(registrationHtml).toContain('href="/login"');
    expect(loginHtml).toContain('個人資料頁');
    expect(profileHtml).toContain('birth_year_month');
    expect(profileHtml).toContain('residential_region');
    expect(indexHtml).toContain('註冊');
    expect(indexHtml).toContain('登入');
    expect(shouldReadLoginState({ dataset: { loginStateRead: 'disabled' } })).toBe(false);
  });

  it('keeps registration off session creation, Set-Cookie, auto-login, and GET /users/me', async () => {
    const { normalizeRegistrationFormInput, submitRegistrationRequest } =
      await loadModule('public/frontend/registration-page.js');
    const registrationSource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/registration-page.js'), 'utf8'),
    );

    const normalized = normalizeRegistrationFormInput({
      displayName: 'Flow User',
      birthYearMonth: '1998-07',
      residentialRegion: 'TW-TPE',
      credential: 'proof',
    });
    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      expect(url).toBe('/registration');
      const body = JSON.parse(String(init?.body));
      expect(body).toEqual({
        display_name: 'Flow User',
        birth_year_month: '1998-07',
        residential_region: 'TW-TPE',
      });
      return { status: 201 };
    });
    await submitRegistrationRequest({
      profile: normalized.profile,
      credential: normalized.credential,
      fetchImpl,
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(registrationSource).not.toMatch(/\/users\/me|POST \/login\/session|login\/session/i);
  });

  it('keeps login session as the formal session creation boundary', async () => {
    const { submitProductionLoginCredential } = await loadModule('public/frontend/login-page.js');
    const loginFetch = vi.fn(async (url: string, init?: RequestInit) => {
      expect(url).toBe('/login/session');
      expect(init?.method).toBe('POST');
      return { status: 201 };
    });
    await expect(
      submitProductionLoginCredential({
        credential: 'login-proof',
        fetchImpl: loginFetch,
      }),
    ).resolves.toEqual({ ok: true });
  });

  it('keeps profile limited to birth_year_month and residential_region', async () => {
    const { normalizeProfileFormInput } = await loadModule('public/frontend/profile-page.js');
    const profileSource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/profile-page.js'), 'utf8'),
    );

    const normalized = normalizeProfileFormInput({
      birthYearMonth: '1998-07',
      residentialRegion: 'TW-TPE',
    });
    expect(Object.keys(normalized).sort()).toEqual(
      ['birth_year_month', 'residential_region'].sort(),
    );
    expect(profileSource).toMatch(/\/users\/me\/profile/);
    expect(profileSource).not.toMatch(/gender|性別|address|GPS/i);
  });

  it('keeps explore feed freshness-only, counter-free, and non-personalized', async () => {
    const { isExploreFeedItemSafe, buildExploreFeedRequestUrl, fetchExploreFeedPage } =
      await loadModule('public/frontend/explore-page.js');

    const safePoll = {
      poll_id: '11111111-1111-4111-8111-111111111111',
      title: '咖啡攝取調查',
      category: 'general',
      status: 'active' as const,
      published_display: '最近發布' as const,
      result_page_url: '/results/11111111-1111-4111-8111-111111111111',
      quality_badge: null,
    };
    expect(isExploreFeedItemSafe(safePoll)).toBe(true);
    expect(isExploreFeedItemSafe({ ...safePoll, vote_count: 12 })).toBe(false);

    const url = buildExploreFeedRequestUrl({ origin: 'http://127.0.0.1:3000' });
    expect(url.pathname).toBe('/polls/feed');
    expect(url.toString()).not.toMatch(/rank|hot|trend|user_id/i);

    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ polls: [safePoll], next_cursor: null }),
    });
    await fetchExploreFeedPage({ fetchImpl, origin: 'http://127.0.0.1:3000' });
    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringContaining('/polls/feed'),
      expect.objectContaining({ credentials: 'omit' }),
    );
  });

  it('keeps create poll static demo separated from ?live=1 creator flow', async () => {
    const { parseLiveApiMode } = await loadModule('public/frontend/public-mvp-demo.js');
    const { submitCreatePollDemo } = await loadModule('public/frontend/create-poll-page.js');
    const createSource = await readFile(
      join(process.cwd(), 'public/frontend/create-poll-page.js'),
      'utf8',
    );

    expect(parseLiveApiMode('')).toBe(false);
    expect(parseLiveApiMode('?live=1')).toBe(true);
    const demo = submitCreatePollDemo({
      formValues: { title: '示範', description: '說明', options: ['甲', '乙'] },
    });
    expect(demo.status).toBe('demo_static');
    expect(createSource).toContain('parseLiveApiMode(search)');
    expect(createSource).toContain('ensureCreatorSessionForLiveMode');
    expect(createSource).toContain('submitCreatePollDemo');
  });

  it('keeps my-polls creator list on creator_session local/demo/test only', async () => {
    const { parseLiveApiMode } = await loadModule('public/frontend/public-mvp-demo.js');
    const myPollsSource = await readFile(
      join(process.cwd(), 'public/frontend/my-polls-page.js'),
      'utf8',
    );
    const myPollsHtml = await readFile(join(process.cwd(), 'public/my-polls.html'), 'utf8');

    expect(parseLiveApiMode('?live=1')).toBe(true);
    expect(myPollsHtml).toContain('?live=1');
    expect(myPollsHtml).toContain('即時模式');
    expect(myPollsHtml).not.toContain('creator_session');
    expect(myPollsSource).toContain('/creator/polls');
    expect(myPollsSource).toContain('data-mock-dashboard');
    expect(myPollsSource).toContain('data-live-owned-list');
    expect(myPollsSource).not.toMatch(/\/users\/me/i);
  });

  it('keeps results visibility counter-free except revealed/locked/post_lock aggregate', async () => {
    const { resolveResultRenderMode, renderResultDisplay } = await loadModule(
      'public/frontend/result-page.js',
    );

    for (const lifecycle of ['collecting', 'cancelled', 'unpublished'] as const) {
      expect(
        resolveResultRenderMode({ public_lifecycle_state: lifecycle, options: [] }),
      ).not.toBe('aggregate');
    }
    for (const lifecycle of ['revealed', 'locked', 'post_lock'] as const) {
      expect(
        resolveResultRenderMode({
          public_lifecycle_state: lifecycle,
          options: [{ display_label: '選項 A', display_percentage: '約 10%' }],
        }),
      ).toBe('aggregate');
    }

    const collectingRoot = createRoot();
    renderResultDisplay(collectingRoot, {
      public_lifecycle_state: 'collecting',
      total_votes_display: '收集中',
      options: [{ display_label: '選項甲', display_percentage: '約 99%', display_count: '999 票' }],
    });
    expect(collectText(collectingRoot)).not.toMatch(/約\s*99%|999\s*票/);
  });

  it('keeps vote pre-vote UX from revealing eligibility, result preview, or voter state', async () => {
    const { mountOfficialVotePreVoteHint, PRE_VOTE_HINT_COPY } = await loadModule(
      'public/frontend/official-vote-pre-vote-hints.js',
    );
    const { documentObject, mount } = createPreVoteHintDocument();

    await mountOfficialVotePreVoteHint(documentObject, {
      fetchImpl: vi.fn(),
      readLoginStateImpl: vi.fn(async () => ({ status: 'anonymous' })),
    });
    const anonymousText = collectText(mount);
    expect(anonymousText).toContain(PRE_VOTE_HINT_COPY.anonymous);
    expect(anonymousText).not.toMatch(FORBIDDEN_OUTCOME_COPY);

    mount.replaceChildren();
    const profileFetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        birth_year_month: '1998-07',
        residential_region: 'TW-TPE',
        can_vote: true,
      }),
    }));
    await mountOfficialVotePreVoteHint(documentObject, {
      fetchImpl: profileFetch,
      loginState: { status: 'authenticated', display_name: 'Vote User' },
    });
    const completeText = collectText(mount);
    expect(completeText).toContain('此提示不代表一定可以完成投票');
    expect(completeText).not.toMatch(/符合資格|不符合資格|保證可以投票/);
  });

  it('keeps homepage static examples separated from live explore feed', async () => {
    const indexHtml = await readFile(join(process.cwd(), 'public/index.html'), 'utf8');
    const exploreHtml = await readFile(join(process.cwd(), 'public/explore.html'), 'utf8');

    // Phase 301: the homepage no longer carries static sample cards (it is now a
    // collecting-only swipe feed). The explore-side separation below remains the
    // assertion this checkpoint protects.
    expect(indexHtml).toContain('data-home-swipe-feed="collecting-only"');
    expect(indexHtml).not.toContain('data-static-examples');
    expect(exploreHtml).toContain('data-explore-feed="freshness-only"');
    expect(exploreHtml).not.toContain('data-static-examples');
    expect(exploreHtml).not.toContain('/vote/demo');
  });

  it('maps cross-flow failures to neutral copy without echoing backend payloads', async () => {
    const explore = await loadModule('public/frontend/explore-page.js');
    const votePage = await loadModule('public/frontend/vote-page.js');
    const resultPage = await loadModule('public/frontend/result-page.js');
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');

    const failingFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({
        error: 'INTERNAL',
        message: 'option_id leak and vote_token secret',
        stack: 'Error at secret.ts:42',
      }),
    });

    await expect(
      explore.fetchExploreFeedPage({ fetchImpl: failingFetch, origin: 'http://127.0.0.1:3000' }),
    ).rejects.toThrow(explore.EXPLORE_LOAD_FAILURE_MESSAGE);

    await expect(
      votePage.submitVoteByIndex({
        pollId,
        optionIndex: 0,
        userId: 'runtime-user-id',
        fetchImpl: failingFetch,
      }),
    ).rejects.toThrow(publicUi.GENERIC_VOTE_SUBMIT_FAILURE);

    expect(
      resultPage.messageForResultLoadFailure({ status: 500 }),
    ).toBe(resultPage.RESULTS_LOAD_FAILURE_MESSAGE);
    expect(resultPage.RESULTS_LOAD_FAILURE_MESSAGE).not.toMatch(
      /option_id|vote_token|INTERNAL|secret\.ts/i,
    );
  });

  it('keeps HELP_COPY in policy-panel layer only', async () => {
    const layoutSource = await readFile(
      join(process.cwd(), 'public/frontend/public-mvp-layout.js'),
      'utf8',
    );
    const policySource = await readFile(
      join(process.cwd(), 'public/frontend/policy-ui-placeholders.js'),
      'utf8',
    );

    expect(layoutSource).toContain('export const HELP_COPY');
    expect(policySource).toContain('HELP_COPY');

    for (const relativePath of PUBLIC_RUNTIME_MODULES) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('HELP_COPY');
    }
  });

  it('does not mark protected backend/auth/schema paths with Phase 169 changes', async () => {
    for (const relativePath of PROTECTED_BACKEND_PATHS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8').catch(() => '');
      if (!source) {
        continue;
      }
      expect(source, relativePath).not.toContain('Phase 169');
    }
  });

  it('keeps public runtime modules free of linkage leaks and observability hooks', async () => {
    for (const relativePath of PUBLIC_RUNTIME_MODULES) {
      const source = stripJsComments(
        await readFile(join(process.cwd(), relativePath), 'utf8'),
      );
      expect(source, relativePath).not.toMatch(FORBIDDEN_OBSERVABILITY);
      expect(source, relativePath).not.toMatch(
        /localStorage|sessionStorage|indexedDB|navigator\.sendBeacon/i,
      );
      if (
        relativePath !== 'public/frontend/vote-page.js' &&
        relativePath !== 'public/frontend/result-page.js'
      ) {
        expect(source, relativePath).not.toMatch(FORBIDDEN_LEAKAGE_COPY);
      }
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
