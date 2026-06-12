import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const RESULTS_HTML_SHELLS = ['public/results.html'];

const PROTECTED_BACKEND_PATHS = [
  'src/polls/result-display.ts',
  'src/polls/poll-visibility.ts',
  'src/polls/repository.ts',
  'src/http/result-routes.ts',
  'src/http/reference-answer-routes.ts',
  'src/auth/user-auth-resolver.ts',
  'migrations',
];

const FORBIDDEN_LEAKAGE_COPY =
  /option_id|vote_token|token_sha256|shard_id|session_id|www_session|\buser_id\b|raw_count|poll_option_vote_counters|creator_token|error\.message|JSON\.stringify\(error/i;

const FORBIDDEN_OUTCOME_COPY =
  /你投過|你尚未投票|你符合資格|你不符合資格|已投過票|選擇了|投給哪個|can_vote|age_passed|region_passed|trust_passed|role_passed/i;

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
      children: [] as ReturnType<typeof createElement>[],
      attributes: new Map<string, string>(),
      setAttribute(name: string, value: string) {
        this.attributes.set(name, value);
      },
      removeAttribute(name: string) {
        this.attributes.delete(name);
      },
      prepend(child: ReturnType<typeof createElement>) {
        this.children.unshift(child);
      },
      querySelector() {
        return null;
      },
      append(child: ReturnType<typeof createElement>) {
        this.children.push(child);
      },
      replaceChildren() {
        this.children = [];
      },
    };
  }
  documentObject = { createElement };
  return createElement('div');
}

function collectText(element: ReturnType<typeof createRoot>): string {
  return [
    element.textContent,
    ...element.children.map((child) => collectText(child)),
  ]
    .filter(Boolean)
    .join(' ');
}

describe('Phase 167 public results page visibility UX review checkpoint', () => {
  it('keeps collecting, cancelled, and unpublished states counter-free', async () => {
    const {
      renderResultDisplay,
      RESULTS_COLLECTING_TITLE,
      RESULTS_CANCELLED_MESSAGE,
      RESULTS_UNPUBLISHED_MESSAGE,
    } = await loadModule('public/frontend/result-page.js');

    const collectingRoot = createRoot();
    renderResultDisplay(collectingRoot, {
      public_lifecycle_state: 'collecting',
      total_votes_display: '收集中',
      options: [{ display_label: '選項甲', display_percentage: '約 99%', display_count: '999 票' }],
    });
    const collectingText = collectText(collectingRoot);
    expect(collectingText).toContain(RESULTS_COLLECTING_TITLE);
    expect(collectingText).not.toMatch(/約\s*99%|999\s*票/);

    for (const [lifecycle, message] of [
      ['cancelled', RESULTS_CANCELLED_MESSAGE],
      ['unpublished', RESULTS_UNPUBLISHED_MESSAGE],
    ] as const) {
      const root = createRoot();
      renderResultDisplay(root, {
        public_lifecycle_state: lifecycle,
        user_message: `backend-only ${lifecycle} detail with option_id secret`,
        options: [
          {
            display_label: '選項 A',
            display_percentage: '約 99%',
            display_count: '999 票',
          },
        ],
      });
      const text = collectText(root);
      expect(text).toContain(message);
      expect(text).not.toContain(`backend-only ${lifecycle} detail`);
      expect(text).not.toMatch(/約\s*99%|999\s*票/);
    }
  });

  it('allows display-safe aggregate only for revealed, locked, and post_lock states', async () => {
    const { resolveResultRenderMode, renderResultDisplay } = await loadModule(
      'public/frontend/result-page.js',
    );

    for (const lifecycle of ['revealed', 'locked', 'post_lock'] as const) {
      expect(
        resolveResultRenderMode({
          public_lifecycle_state: lifecycle,
          options: [{ display_label: '選項 A', display_percentage: '約 10%' }],
        }),
      ).toBe('aggregate');
    }

    for (const lifecycle of ['collecting', 'cancelled', 'unpublished', 'draft'] as const) {
      expect(
        resolveResultRenderMode({ public_lifecycle_state: lifecycle, options: [] }),
      ).not.toBe('aggregate');
    }

    const root = createRoot();
    renderResultDisplay(root, {
      public_lifecycle_state: 'revealed',
      total_votes_display: '100–499',
      options: [
        {
          display_label: '選項 A',
          display_percentage: '約 43%',
          display_count: '約 100–150 票',
        },
      ],
    });
    const text = collectText(root);
    expect(text).toContain('100–499');
    expect(text).toContain('約 43%');
    expect(text).not.toMatch(FORBIDDEN_LEAKAGE_COPY);
  });

  it('keeps creator result links on public GET /polls/:id/results without visibility bypass', async () => {
    const { loadResultDisplay, refreshResultPageDisplay } = await loadModule(
      'public/frontend/result-page.js',
    );
    const { parseCreatorManageMode } = await loadModule(
      'public/frontend/poll-lifecycle-controls.js',
    );
    const source = await readFile(join(process.cwd(), 'public/frontend/result-page.js'), 'utf8');
    const collectingResult = {
      public_lifecycle_state: 'collecting',
      collecting: true,
      options: [{ display_label: '選項甲' }],
    };

    expect(parseCreatorManageMode('?creator=1')).toBe(true);
    expect(source).toContain('parseCreatorManageMode(search)');
    expect(source).toMatch(/if \(!parseCreatorManageMode\(search\)\)/);
    expect(source).not.toMatch(/\/creator\/polls\/[^`'"]+\/results/);

    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => collectingResult,
    }));
    await loadResultDisplay({ pollId, fetchImpl });
    expect(fetchImpl).toHaveBeenCalledWith(`/polls/${pollId}/results`, {
      method: 'GET',
      credentials: 'omit',
      cache: 'no-store',
    });

    const resultRoot = createRoot();
    const pageContext = {
      pollId,
      root: resultRoot,
      introRoot: createRoot(),
      pageTitle: {
        textContent: '',
        setAttribute() {},
        removeAttribute() {},
        ownerDocument: { querySelector: () => null },
      },
      creatorLifecycleHost: null,
      uiMockState: null,
      demoOnly: false,
      search: '?creator=1',
      fetchImpl,
      onRefreshResultDisplay: null as (() => Promise<{ refreshed: boolean }>) | null,
    };
    pageContext.onRefreshResultDisplay = () => refreshResultPageDisplay(pageContext);
    const outcome = await refreshResultPageDisplay(pageContext);
    expect(outcome.refreshed).toBe(true);
    expect(collectText(resultRoot)).toContain('結果尚未公開');
    expect(collectText(resultRoot)).not.toMatch(/約\s*\d+%|\d+\s*票/);
  });

  it('maps load, unavailable, and refresh failures to neutral copy without echoing backend payloads', async () => {
    const {
      loadResultDisplay,
      refreshResultPageDisplay,
      messageForResultLoadFailure,
      RESULTS_POLL_UNAVAILABLE_MESSAGE,
      RESULTS_LOAD_FAILURE_MESSAGE,
      RESULT_DISPLAY_REFRESH_FAILURE_MESSAGE,
    } = await loadModule('public/frontend/result-page.js');

    expect(
      messageForResultLoadFailure({ status: 404, errorCode: 'POLL_NOT_FOUND' }),
    ).toBe(RESULTS_POLL_UNAVAILABLE_MESSAGE);
    expect(messageForResultLoadFailure({ status: 500 })).toBe(RESULTS_LOAD_FAILURE_MESSAGE);

    const failingFetch = vi.fn(async () => ({
      ok: false,
      status: 500,
      json: async () => ({
        error: 'INTERNAL',
        message: 'option_id leak and vote_token secret',
        stack: 'Error at secret.ts:42',
      }),
    }));
    await expect(loadResultDisplay({ pollId, fetchImpl: failingFetch })).rejects.toThrow(
      RESULTS_LOAD_FAILURE_MESSAGE,
    );
    await expect(loadResultDisplay({ pollId, fetchImpl: failingFetch })).rejects.not.toThrow(
      /option_id|vote_token|INTERNAL|secret\.ts/i,
    );

    const resultRoot = createRoot();
    const refreshFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          public_lifecycle_state: 'collecting',
          options: [{ display_label: '選項甲' }],
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'INTERNAL',
          message: 'database connection leaked',
        }),
      });
    const pageContext = {
      pollId,
      root: resultRoot,
      demoOnly: false,
      fetchImpl: refreshFetch,
    };
    await refreshResultPageDisplay(pageContext);
    const outcome = await refreshResultPageDisplay(pageContext);
    expect(outcome.refreshed).toBe(false);
    expect(collectText(resultRoot)).toContain(RESULT_DISPLAY_REFRESH_FAILURE_MESSAGE);
    expect(collectText(resultRoot)).not.toContain('database connection leaked');
  });

  it('keeps results runtime away from UserAuthResolver, profile eligibility, and Reference Answer', async () => {
    const source = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/result-page.js'), 'utf8'),
    );
    const referenceAnswerTest = await readFile(
      join(process.cwd(), 'tests/http/reference-answer-hardening.test.ts'),
      'utf8',
    );

    expect(source).not.toMatch(
      /UserAuthResolver|\/users\/me|users\/me\/profile|reference-answer|vote-by-index|X-User-Id|X-Display-Name/i,
    );
    expect(referenceAnswerTest).toContain('does not apply profile eligibility rules');
    expect(source).toContain('credentials: \'omit\'');
  });

  it('keeps policy-ui-placeholders.js and HELP_COPY as independent policy-panel layer', async () => {
    const resultSource = await readFile(
      join(process.cwd(), 'public/frontend/result-page.js'),
      'utf8',
    );
    const policySource = await readFile(
      join(process.cwd(), 'public/frontend/policy-ui-placeholders.js'),
      'utf8',
    );

    expect(resultSource).toContain("from './policy-ui-placeholders.js'");
    expect(resultSource).toContain('POLICY_UI_COPY');
    expect(resultSource).not.toContain('HELP_COPY');
    expect(policySource).toContain('HELP_COPY');
  });

  it('does not mark protected backend/auth/schema paths with Phase 167 changes', async () => {
    for (const relativePath of PROTECTED_BACKEND_PATHS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8').catch(() => '');
      if (!source) {
        continue;
      }
      expect(source, relativePath).not.toContain('Phase 167');
    }
  });

  it('keeps results runtime modules free of linkage, voter outcomes, and observability hooks', async () => {
    const source = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/result-page.js'), 'utf8'),
    );
    expect(source).not.toMatch(FORBIDDEN_LEAKAGE_COPY);
    expect(source).not.toMatch(FORBIDDEN_OBSERVABILITY);
    expect(source).not.toMatch(FORBIDDEN_OUTCOME_COPY);
    expect(source).not.toMatch(
      /localStorage|sessionStorage|indexedDB|navigator\.sendBeacon/i,
    );

    for (const relativePath of RESULTS_HTML_SHELLS) {
      const html = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(html, relativePath).not.toContain('Phase 167');
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
