import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const REVIEWED_CREATOR_RESULTS_FILES = [
  'public/frontend/result-page.js',
  'public/frontend/creator-flow-copy.js',
  'public/results.html',
];

const FORBIDDEN_OUTCOME_COPY =
  /你投過|你尚未投票|你符合資格|你不符合資格|已投過票|選擇了|投給哪個|can_vote|age_passed|region_passed|trust_passed|role_passed/i;

const FORBIDDEN_INTERNAL_COPY =
  /option_id|vote_token|token_sha256|shard_id|session_id|www_session|\buser_id\b|raw_count|poll_option_vote_counters/i;

const FORBIDDEN_EXTRA_PROFILE_FIELDS =
  /gender|性別|exact birthday|精確生日|full date of birth|完整出生日|\baddress\b|GPS|geocode|precise location|精準位置|demographic breakdown/i;

function stripJsComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

async function loadResultPageModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/result-page.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

async function loadLifecycleModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/poll-lifecycle-controls.js'),
  ).href;
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
      append(child: ReturnType<typeof createElement>) {
        this.children.push(child);
      },
      replaceChildren() {
        this.children = [];
      },
      prepend(child: ReturnType<typeof createElement>) {
        this.children.unshift(child);
      },
      querySelector() {
        return null;
      },
    };
  }
  documentObject = { createElement };
  return createElement('div');
}

function collectText(element: ReturnType<typeof createRoot>): string[] {
  return [
    element.textContent,
    ...element.children.flatMap((child) => collectText(child)),
  ].filter(Boolean);
}

const pollId = '22222222-2222-4222-8222-222222222222';
const collectingResult = {
  poll_id: pollId,
  public_lifecycle_state: 'collecting',
  collecting: true,
  display_mode: 'collecting',
  total_votes_display: '收集中',
  options: [{ display_label: '選項甲' }],
};
const displaySafeResult = {
  poll_id: pollId,
  public_lifecycle_state: 'revealed',
  display_mode: 'rounded_with_bucketed_votes',
  total_votes_display: '100–499',
  options: [
    {
      display_label: '選項甲',
      display_percentage: '約 43%',
      display_count: '約 100–150 票',
    },
  ],
};

describe('Phase 131 creator results panel runtime review checkpoint', () => {
  it('enables creator manage mode only for ?creator=1 or ?manage=1', async () => {
    const { parseCreatorManageMode } = await loadLifecycleModule();

    expect(parseCreatorManageMode('')).toBe(false);
    expect(parseCreatorManageMode('?nav=guest')).toBe(false);
    expect(parseCreatorManageMode('?creator=1')).toBe(true);
    expect(parseCreatorManageMode('?manage=1')).toBe(true);
    expect(parseCreatorManageMode('?creator=1&nav=logged-in-mock')).toBe(true);
    expect(parseCreatorManageMode('?creator=0')).toBe(false);
  });

  it('loads results through public GET /polls/:id/results only', async () => {
    const { loadResultDisplay } = await loadResultPageModule();
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => displaySafeResult,
    }));

    await loadResultDisplay({ pollId, fetchImpl });

    expect(fetchImpl).toHaveBeenCalledWith(`/polls/${pollId}/results`, {
      method: 'GET',
      credentials: 'omit',
      cache: 'no-store',
    });
    expect(JSON.stringify(fetchImpl.mock.calls)).not.toMatch(
      /\/creator\/polls|X-User-Id|X-Display-Name/i,
    );
  });

  it('keeps creator refresh on public results API without creator results route', async () => {
    const { refreshResultPageDisplay } = await loadResultPageModule();
    const resultRoot = createRoot();
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => displaySafeResult,
    }));

    const pageContext = {
      pollId,
      root: resultRoot,
      demoOnly: false,
      fetchImpl,
    };

    await refreshResultPageDisplay(pageContext);
    expect(fetchImpl).toHaveBeenCalledWith(`/polls/${pollId}/results`, {
      method: 'GET',
      credentials: 'omit',
      cache: 'no-store',
    });
    expect(JSON.stringify(fetchImpl.mock.calls)).not.toMatch(/\/creator\/polls\/.*\/results/);
  });

  it('gates creator lifecycle panel behind parseCreatorManageMode in result-page runtime', async () => {
    const source = await readFile(
      join(process.cwd(), 'public/frontend/result-page.js'),
      'utf8',
    );

    expect(source).toContain('mountCreatorLifecyclePanel');
    expect(source).toContain('parseCreatorManageMode(search)');
    expect(source).toMatch(/if \(!parseCreatorManageMode\(search\)\)/);
    expect(source).toContain('creator-lifecycle-host');
    expect(source).not.toMatch(/\/creator\/polls\/[^`'"]+\/results/);
    expect(source).toContain('loadResultDisplay');
    expect(source).toContain('refreshResultPageDisplay');
  });

  function createRefreshPageContext(
    resultRoot: ReturnType<typeof createRoot>,
    fetchImpl: ReturnType<typeof vi.fn>,
  ) {
    return {
      pollId,
      root: resultRoot,
      introRoot: createRoot(),
      pageTitle: {
        textContent: '',
        setAttribute() {},
        removeAttribute() {},
      },
      creatorLifecycleHost: null,
      uiMockState: null,
      demoOnly: false,
      search: '?creator=1',
      fetchImpl,
      onRefreshResultDisplay: null as (() => Promise<{ refreshed: boolean }>) | null,
    };
  }

  it('keeps collecting creator refresh counter-free', async () => {
    const { refreshResultPageDisplay } = await loadResultPageModule();
    const resultRoot = createRoot();
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => collectingResult,
    }));
    const pageContext = createRefreshPageContext(resultRoot, fetchImpl);
    pageContext.onRefreshResultDisplay = () => refreshResultPageDisplay(pageContext);

    const outcome = await refreshResultPageDisplay(pageContext);
    expect(outcome.refreshed).toBe(true);

    const text = collectText(resultRoot).join(' ');
    expect(text).toContain('結果尚未公開');
    expect(text).toContain('不顯示總票數、選項票數、百分比、排名或趨勢');
    expect(text).not.toMatch(/約\s*\d+%|\d+\s*票/);
    expect(text).not.toMatch(FORBIDDEN_INTERNAL_COPY);
  });

  it('keeps cancelled creator refresh unavailable without echoing backend user_message', async () => {
    const { refreshResultPageDisplay } = await loadResultPageModule();
    const resultRoot = createRoot();
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => collectingResult,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          public_lifecycle_state: 'cancelled',
          user_message: 'backend-only cancelled detail with option_id secret',
          options: [
            {
              display_label: '選項甲',
              display_percentage: '約 99%',
              display_count: '999 票',
            },
          ],
        }),
      });

    const pageContext = createRefreshPageContext(resultRoot, fetchImpl);
    pageContext.onRefreshResultDisplay = () => refreshResultPageDisplay(pageContext);
    await refreshResultPageDisplay(pageContext);
    await refreshResultPageDisplay(pageContext);

    const text = collectText(resultRoot).join(' ');
    expect(text).toContain('問卷已取消');
    expect(text).toContain('不會產生可公開顯示的聚合結果');
    expect(text).not.toContain('backend-only cancelled detail');
    expect(text).not.toMatch(/約\s*99%|999\s*票/);
  });

  it('refreshes creator results to aggregate-only display after reveal', async () => {
    const { refreshResultPageDisplay } = await loadResultPageModule();
    const resultRoot = createRoot();
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => collectingResult,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => displaySafeResult,
      });

    const pageContext = createRefreshPageContext(resultRoot, fetchImpl);
    pageContext.onRefreshResultDisplay = () => refreshResultPageDisplay(pageContext);
    await refreshResultPageDisplay(pageContext);
    await refreshResultPageDisplay(pageContext);

    const text = collectText(resultRoot).join(' ');
    expect(text).toContain('100–499');
    expect(text).toContain('約 43%');
    expect(text).not.toMatch(FORBIDDEN_INTERNAL_COPY);
  });

  it('maps result load and refresh failures to neutral copy without echoing payloads', async () => {
    const {
      loadResultDisplay,
      refreshResultPageDisplay,
      RESULT_DISPLAY_REFRESH_FAILURE_MESSAGE,
      messageForResultLoadFailure,
    } = await loadResultPageModule();

    expect(messageForResultLoadFailure({ status: 500 })).toBe(
      '目前無法載入結果，請稍後再試。',
    );

    const failingFetch = vi.fn(async () => ({
      ok: false,
      status: 500,
      json: async () => ({
        error: 'INTERNAL',
        message: 'option_id leak and vote_token secret',
      }),
    }));
    await expect(loadResultDisplay({ pollId, fetchImpl: failingFetch })).rejects.toThrow(
      '目前無法載入結果，請稍後再試。',
    );
    await expect(loadResultDisplay({ pollId, fetchImpl: failingFetch })).rejects.not.toThrow(
      /option_id|vote_token/i,
    );

    const resultRoot = createRoot();
    const refreshFetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => collectingResult,
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'INTERNAL',
          message: 'database connection leaked',
          option_id: 'secret',
        }),
      });
    const pageContext = createRefreshPageContext(resultRoot, refreshFetch);
    pageContext.onRefreshResultDisplay = () => refreshResultPageDisplay(pageContext);
    await refreshResultPageDisplay(pageContext);
    const outcome = await refreshResultPageDisplay(pageContext);
    expect(outcome.refreshed).toBe(false);
    const text = collectText(resultRoot).join(' ');
    expect(text).toContain(RESULT_DISPLAY_REFRESH_FAILURE_MESSAGE);
    expect(text).not.toContain('database connection leaked');
    expect(text).not.toContain('secret');
  });

  it('keeps creator results runtime away from ownership storage and vote/profile paths', async () => {
    const source = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/result-page.js'), 'utf8'),
    );

    expect(source).toContain('/polls/');
    expect(source).toContain('parseCreatorManageMode');
    expect(source).not.toMatch(
      /localStorage|sessionStorage|indexedDB|writeManagedPoll|readManagedPoll|\/users\/me|users\/me\/profile|vote-by-index|reference-answer|X-User-Id|X-Display-Name|option_index|option_id/i,
    );
    expect(source).not.toMatch(
      /navigator\.sendBeacon|console\.|analytics|apm\.|trace\./i,
    );
  });

  for (const relativePath of REVIEWED_CREATOR_RESULTS_FILES) {
    it(`keeps reviewed creator results copy neutral in ${relativePath}`, async () => {
      const raw = await readFile(join(process.cwd(), relativePath), 'utf8');
      const source = relativePath.endsWith('.js') ? stripJsComments(raw) : raw;

      expect(source, relativePath).not.toMatch(FORBIDDEN_OUTCOME_COPY);
      expect(source, relativePath).not.toMatch(FORBIDDEN_EXTRA_PROFILE_FIELDS);
      if (relativePath !== 'public/frontend/result-page.js') {
        expect(source, relativePath).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      }
    });
  }

  it('keeps Phase 131 user-visible creator results messages free of forbidden internals', async () => {
    const resultPage = await loadResultPageModule();

    const userVisibleMessages = [
      resultPage.RESULTS_COLLECTING_TITLE,
      resultPage.RESULTS_COLLECTING_SUMMARY,
      resultPage.RESULTS_CANCELLED_MESSAGE,
      resultPage.RESULTS_UNPUBLISHED_MESSAGE,
      resultPage.RESULTS_LOAD_FAILURE_MESSAGE,
      resultPage.RESULTS_POLL_UNAVAILABLE_MESSAGE,
      resultPage.RESULT_DISPLAY_REFRESH_FAILURE_MESSAGE,
    ];

    for (const message of userVisibleMessages) {
      expect(message).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(message).not.toMatch(FORBIDDEN_OUTCOME_COPY);
    }
  });
});
