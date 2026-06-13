import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const EXPLORE_HTML_SHELLS = ['public/explore.html'];

const PROTECTED_BACKEND_PATHS = [
  'src/polls/feed-config.ts',
  'src/polls/feed-cursor.ts',
  'src/polls/repository.ts',
  'src/http/poll-routes.ts',
  'src/http/reference-answer-routes.ts',
  'src/auth/user-auth-resolver.ts',
  'migrations',
];

const FORBIDDEN_LEAKAGE_COPY =
  /option_id|vote_token|token_sha256|shard_id|session_id|www_session|\buser_id\b|raw_count|poll_option_vote_counters|creator_token|error\.message|JSON\.stringify\(error/i;

const FORBIDDEN_OUTCOME_COPY =
  /你投過|你尚未投票|你符合資格|你不符合資格|已投過票|選擇了|投給哪個|can_vote|age_passed|region_passed|trust_passed|role_passed/i;

const FORBIDDEN_RANKING_COPY =
  /熱門榜|個人化排序|結果預覽|mvp-result-preview|popularity_score|ranking_score|trending/i;

const FORBIDDEN_OBSERVABILITY =
  /console\.(log|info|warn|error|debug)|analytics|datadog|sentry|apm|trackEvent|gtag\(/i;

const safePoll = {
  poll_id: '11111111-1111-4111-8111-111111111111',
  title: '咖啡攝取調查',
  category: 'general',
  status: 'active' as const,
  published_display: '最近發布' as const,
  result_page_url: '/results/11111111-1111-4111-8111-111111111111',
  quality_badge: null,
};

function stripJsComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
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

function collectText(element: {
  textContent: string;
  children: ReturnType<typeof createDocumentStub>['createElement'][];
}): string {
  return [
    element.textContent,
    ...element.children.map((child) => collectText(child)),
  ]
    .filter(Boolean)
    .join(' ');
}

describe('Phase 168 public explore feed UX review checkpoint', () => {
  it('accepts only display-safe public poll feed items with whitelisted keys', async () => {
    const {
      isExploreFeedItemSafe,
      isExploreFeedPayloadSafe,
      EXPLORE_FEED_ALLOWED_ITEM_KEYS,
    } = await loadModule('public/frontend/explore-page.js');

    expect(EXPLORE_FEED_ALLOWED_ITEM_KEYS).toEqual([
      'poll_id',
      'title',
      'category',
      'status',
      'published_display',
      'result_page_url',
      'quality_badge',
    ]);
    expect(isExploreFeedItemSafe(safePoll)).toBe(true);
    expect(isExploreFeedItemSafe({ ...safePoll, vote_count: 12 })).toBe(false);
    expect(isExploreFeedItemSafe({ ...safePoll, display_percentage: '約 10%' })).toBe(
      false,
    );
    expect(isExploreFeedItemSafe({ ...safePoll, status: 'cancelled' })).toBe(false);
    expect(
      isExploreFeedPayloadSafe({
        polls: [{ ...safePoll, option_id: 'secret' }],
        next_cursor: null,
      }),
    ).toBe(false);
  });

  it('renders collecting cards without vote counts, result previews, or voter state', async () => {
    const { renderExplorePollCard, EXPLORE_COLLECTING_STATUS_HINT } = await loadModule(
      'public/frontend/explore-page.js',
    );
    const documentObject = createDocumentStub();
    const card = renderExplorePollCard(documentObject, safePoll);
    const text = collectText(card);

    expect(text).toContain('收集中');
    expect(text).toContain(EXPLORE_COLLECTING_STATUS_HINT);
    expect(text).toContain('最近發布');
    expect(text).not.toMatch(/%|熱門|趨勢|vote_count|option_id/i);
    expect(text).not.toMatch(FORBIDDEN_OUTCOME_COPY);
    expect(text).not.toMatch(FORBIDDEN_LEAKAGE_COPY);
    expect(text).not.toMatch(FORBIDDEN_RANKING_COPY);
  });

  it('keeps feed requests freshness-only with credentials omit and no personalization params', async () => {
    const { buildExploreFeedRequestUrl, fetchExploreFeedPage } = await loadModule(
      'public/frontend/explore-page.js',
    );
    const url = buildExploreFeedRequestUrl({
      origin: 'http://127.0.0.1:3000',
      limit: 20,
      cursor: 'v1.cursor',
    });

    expect(url.pathname).toBe('/polls/feed');
    expect(url.searchParams.get('limit')).toBe('20');
    expect(url.searchParams.get('cursor')).toBe('v1.cursor');
    expect(url.toString()).not.toMatch(/user_id|rank|hot|trend|personal/i);

    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ polls: [safePoll], next_cursor: null }),
    });
    await fetchExploreFeedPage({ fetchImpl, origin: 'http://127.0.0.1:3000' });
    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringContaining('/polls/feed?limit=20'),
      {
        method: 'GET',
        credentials: 'omit',
        cache: 'no-store',
      },
    );
  });

  it('separates homepage static sample cards from live explore feed', async () => {
    const indexHtml = await readFile(join(process.cwd(), 'public/index.html'), 'utf8');
    const exploreHtml = await readFile(join(process.cwd(), 'public/explore.html'), 'utf8');

    expect(indexHtml).toContain('data-static-examples="true"');
    expect(indexHtml).toContain('靜態範例');
    expect(indexHtml).toContain('/vote/demo');
    expect(exploreHtml).toContain('data-explore-feed="freshness-only"');
    expect(exploreHtml).toContain('id="explore-feed-list"');
    expect(exploreHtml).not.toContain('/vote/demo');
    expect(exploreHtml).not.toContain('data-static-examples');
  });

  it('maps load and pagination failures to neutral copy without echoing backend payloads', async () => {
    const {
      EXPLORE_LOAD_FAILURE_MESSAGE,
      EXPLORE_LOAD_MORE_FAILURE_MESSAGE,
      EXPLORE_FEED_LOADING_MESSAGE,
      EXPLORE_LOAD_MORE_PENDING_MESSAGE,
      fetchExploreFeedPage,
    } = await loadModule('public/frontend/explore-page.js');

    expect(EXPLORE_FEED_LOADING_MESSAGE).toBe('載入探索列表中，請稍候。');
    expect(EXPLORE_LOAD_MORE_PENDING_MESSAGE).toBe('載入更多中，請稍候。');
    expect(EXPLORE_LOAD_FAILURE_MESSAGE).toBe('目前無法載入探索列表，請稍後再試。');
    expect(EXPLORE_LOAD_MORE_FAILURE_MESSAGE).toBe('無法載入更多問卷，請稍後再試。');

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
      fetchExploreFeedPage({ fetchImpl: failingFetch, origin: 'http://127.0.0.1:3000' }),
    ).rejects.toThrow(EXPLORE_LOAD_FAILURE_MESSAGE);
    await expect(
      fetchExploreFeedPage({ fetchImpl: failingFetch, origin: 'http://127.0.0.1:3000' }),
    ).rejects.not.toThrow(/option_id|vote_token|INTERNAL|secret\.ts/i);
  });

  it('keeps explore runtime away from UserAuthResolver, profile eligibility, and Reference Answer', async () => {
    const source = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/explore-page.js'), 'utf8'),
    );
    const referenceAnswerTest = await readFile(
      join(process.cwd(), 'tests/http/reference-answer-hardening.test.ts'),
      'utf8',
    );

    expect(source).not.toMatch(
      /UserAuthResolver|\/users\/me|users\/me\/profile|reference-answer|vote-by-index|X-User-Id|X-Display-Name/i,
    );
    expect(referenceAnswerTest).toContain('does not apply profile eligibility rules');
    expect(source).toContain("credentials: 'omit'");
  });

  it('keeps policy-ui-placeholders.js and HELP_COPY as independent policy-panel layer', async () => {
    const exploreSource = await readFile(
      join(process.cwd(), 'public/frontend/explore-page.js'),
      'utf8',
    );
    const policySource = await readFile(
      join(process.cwd(), 'public/frontend/policy-ui-placeholders.js'),
      'utf8',
    );

    expect(exploreSource).not.toContain('policy-ui-placeholders.js');
    expect(exploreSource).not.toContain('HELP_COPY');
    expect(exploreSource).not.toContain('POLICY_UI_COPY');
    expect(policySource).toContain('HELP_COPY');
  });

  it('does not mark protected backend/auth/schema paths with Phase 168 changes', async () => {
    for (const relativePath of PROTECTED_BACKEND_PATHS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8').catch(() => '');
      if (!source) {
        continue;
      }
      expect(source, relativePath).not.toContain('Phase 168');
    }
  });

  it('keeps explore runtime modules free of linkage, voter outcomes, and observability hooks', async () => {
    const source = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/explore-page.js'), 'utf8'),
    );
    expect(source).not.toMatch(FORBIDDEN_LEAKAGE_COPY);
    expect(source).not.toMatch(FORBIDDEN_OBSERVABILITY);
    expect(source).not.toMatch(FORBIDDEN_OUTCOME_COPY);
    expect(source).not.toMatch(/localStorage|sessionStorage|indexedDB|navigator\.sendBeacon/i);

    for (const relativePath of EXPLORE_HTML_SHELLS) {
      const html = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(html, relativePath).not.toContain('Phase 168');
      expect(html, relativePath).not.toMatch(FORBIDDEN_RANKING_COPY);
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
