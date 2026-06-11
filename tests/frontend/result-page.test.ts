import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

async function loadResultPageModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/result-page.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

async function loadSubmissionPrivacyModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/submission-privacy.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

function createRoot() {
  let documentObject: {
    createElement(tagName: string): ReturnType<typeof createElement>;
  };
  function createElement(tagName: string) {
    return {
      tagName,
      ownerDocument: documentObject,
      className: '',
      href: '',
      textContent: '',
      hidden: false,
      attributes: new Map<string, string>(),
      setAttribute(name: string, value: string) {
        this.attributes.set(name, value);
      },
      removeAttribute() {},
      children: [] as ReturnType<typeof createElement>[],
      append(child: ReturnType<typeof createElement>) {
        this.children.push(child);
      },
      replaceChildren() {
        this.children = [];
      },
      prepend(child: ReturnType<typeof createElement>) {
        this.children.unshift(child);
      },
      querySelector(selector: string) {
        if (selector === '.result-refresh-failure-notice') {
          return (
            this.children.find((child) =>
              String(child.className).includes('result-refresh-failure-notice'),
            ) ?? null
          );
        }
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

const displaySafeResult = {
  poll_id: '11111111-1111-4111-8111-111111111111',
  public_lifecycle_state: 'revealed',
  display_mode: 'rounded_with_bucketed_votes',
  total_votes_display: '100–499',
  collecting: false,
  options: [
    {
      option_index: 0,
      display_label: '選項 A',
      display_percentage: '約 43%',
      display_count: '約 100–150 票',
    },
  ],
  updated_display: '最近更新',
};

const collectingResult = {
  poll_id: '11111111-1111-4111-8111-111111111111',
  public_lifecycle_state: 'collecting',
  display_mode: 'collecting',
  total_votes_display: '收集中',
  collecting: true,
  options: [
    {
      option_index: 0,
      display_label: '選項甲',
      display_percentage: null,
      display_count: null,
    },
    {
      option_index: 1,
      display_label: '選項乙',
      display_percentage: null,
      display_count: null,
    },
  ],
  updated_display: '最近更新',
};

const publicNotice = {
  notice_id: '22222222-2222-4222-8222-222222222222',
  poll_id: displaySafeResult.poll_id,
  notice_type: 'suspended_typo_correction_applied',
  title: 'Poll typo correction applied',
  body: 'Correction did not change semantic direction.',
  created_at: '2026-06-15T10:00:00.000Z',
  correction_request_id: 'private-request-id',
  admin_id: 'private-admin-id',
  reason_text: 'private reason',
  review_context: { peer_decisions: ['private decision'] },
  vote_token: 'private-vote-token',
  option_id: 'private-option-id',
};

describe('public result page', () => {
  it('calls only the public display-safe result endpoint once', async () => {
    const { loadResultDisplay } = await loadResultPageModule();
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => displaySafeResult,
    }));

    await expect(
      loadResultDisplay({ pollId: displaySafeResult.poll_id, fetchImpl }),
    ).resolves.toEqual(displaySafeResult);

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledWith(
      `/polls/${displaySafeResult.poll_id}/results`,
      {
        method: 'GET',
        credentials: 'omit',
        cache: 'no-store',
      },
    );
  });

  it('loads public notices from the poll-scoped public endpoint', async () => {
    const { loadPublicNotices } = await loadResultPageModule();
    const noticeList = { notices: [publicNotice] };
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => noticeList,
    }));

    await expect(
      loadPublicNotices({ pollId: displaySafeResult.poll_id, fetchImpl }),
    ).resolves.toEqual(noticeList);

    expect(fetchImpl).toHaveBeenCalledWith(
      `/polls/${displaySafeResult.poll_id}/public-notices`,
      {
        method: 'GET',
        credentials: 'omit',
        cache: 'no-store',
      },
    );
  });

  it('normalizes malformed result payloads without throwing', async () => {
    const { renderResultDisplay } = await loadResultPageModule();
    const root = createRoot();

    renderResultDisplay(root, { options: null });

    expect(collectText(root)).toContain('目前沒有可顯示的聚合結果。');
  });

  it('renders backend-provided display strings without deriving precision', async () => {
    const { renderResultDisplay } = await loadResultPageModule();
    const root = createRoot();

    renderResultDisplay(root, displaySafeResult);

    const text = collectText(root);
    expect(text.slice(0, 5)).toEqual([
      '100–499',
      '最近更新',
      '選項 A',
      '約 43%',
      '約 100–150 票',
    ]);
    expect(text.join(' ')).toMatch(/名詞對照/);
    expect(text.join(' ')).toMatch(/取消/);
  });

  it('explains collecting mode without fake vote counts or percentages', async () => {
    const { isCollectingResult, renderResultDisplay } = await loadResultPageModule();
    const root = createRoot();

    expect(isCollectingResult(collectingResult)).toBe(true);
    renderResultDisplay(root, collectingResult);

    const text = collectText(root).join(' ');
    expect(text).toMatch(/結果尚未公開/);
    expect(text).toMatch(/不顯示總票數、選項票數、百分比/);
    expect(text).toMatch(/目前公開的選項/);
    expect(text).toContain('選項甲');
    expect(text).toContain('選項乙');
    expect(text).toMatch(/關注結果|站內通知/);
    expect(text).not.toMatch(/不代表投票失敗|狀態：收集中/);
    expect(text).not.toMatch(/0\s*票|0%/);
    expect(text).not.toMatch(/option_id|shard|token/i);
  });

  it('prefers public_lifecycle_state over display-tier collecting after reveal', async () => {
    const {
      getPublicLifecycleState,
      isCollectingResult,
      renderResultDisplay,
      resolveResultRenderMode,
    } = await loadResultPageModule();
    const revealedSubThreshold = {
      ...displaySafeResult,
      public_lifecycle_state: 'revealed',
      display_mode: 'collecting',
      total_votes_display: '收集中',
      collecting: true,
      options: [
        {
          option_index: 0,
          display_label: '選項 A',
          display_percentage: null,
          display_count: null,
        },
      ],
    };

    expect(getPublicLifecycleState(revealedSubThreshold)).toBe('revealed');
    expect(isCollectingResult(revealedSubThreshold)).toBe(false);
    expect(resolveResultRenderMode(revealedSubThreshold)).toBe('aggregate');

    const root = createRoot();
    renderResultDisplay(root, revealedSubThreshold);
    const text = collectText(root).join(' ');
    expect(text).not.toMatch(/結果尚未公開/);
    expect(text).toContain('收集中');
    expect(text).toContain('選項 A');
    expect(text).not.toMatch(/約\s*\d+%/);
  });

  it.each([
    {
      public_lifecycle_state: 'cancelled',
      user_message: '此問卷已取消，不會產生可公開顯示的聚合結果。',
      title: '問卷已取消',
    },
    {
      public_lifecycle_state: 'unpublished',
      user_message: '此問卷目前無法查看，頁面不顯示聚合結果。',
      title: '問卷目前無法查看',
    },
    {
      public_lifecycle_state: 'draft',
      user_message: '問卷目前無法使用。',
      title: '問卷目前無法使用。',
    },
  ] as const)(
    'renders unavailable lifecycle shells with safe user_message for %s',
    async ({ public_lifecycle_state, user_message, title }) => {
      const { renderResultDisplay } = await loadResultPageModule();
      const root = createRoot();
      const payload = {
        poll_id: displaySafeResult.poll_id,
        public_lifecycle_state,
        display_mode: 'unavailable',
        total_votes_display: '結果不可用',
        collecting: false,
        user_message,
        options: [
          {
            option_index: 0,
            display_label: '選項 A',
            display_percentage: null,
            display_count: null,
          },
        ],
        updated_display: '最近更新',
      };

      renderResultDisplay(root, payload);
      const text = collectText(root).join(' ');
      expect(text).toContain(title);
      expect(text).toContain(user_message);
      expect(text).toMatch(/不顯示總票數、選項票數、百分比/);
      expect(text).toContain('選項 A');
      expect(text).not.toMatch(/約\s*\d+%|30–99|100–499/);
    },
  );

  it('keeps demo ui_state collecting preview behavior', async () => {
    const { renderResultDisplay } = await loadResultPageModule();
    const policyUrl = pathToFileURL(
      join(process.cwd(), 'public/frontend/policy-ui-placeholders.js'),
    ).href;
    const { resolveMockResultPayload } = await import(/* @vite-ignore */ policyUrl);
    const root = createRoot();
    const payload = resolveMockResultPayload(
      { ...displaySafeResult, public_lifecycle_state: 'revealed' },
      'collecting',
    );

    renderResultDisplay(root, payload);

    const text = collectText(root).join(' ');
    expect(text).toMatch(/結果尚未公開/);
    expect(text).not.toMatch(/狀態：收集中|30–99|100–499/);
  });

  it('uses a safe fallback when unavailable lifecycle omits user_message', async () => {
    const { resolveUnavailableUserMessage, renderResultDisplay } =
      await loadResultPageModule();
    const payload = {
      public_lifecycle_state: 'draft',
      display_mode: 'unavailable',
      total_votes_display: '結果不可用',
      collecting: false,
      options: [],
    };

    expect(resolveUnavailableUserMessage(payload)).toBe('問卷目前無法使用。');

    const root = createRoot();
    renderResultDisplay(root, payload);
    expect(collectText(root).join(' ')).toContain('問卷目前無法使用。');
  });

  it('renders identical content for direct visits and post-vote redirects', async () => {
    const { getPollIdFromResultPath, renderResultDisplay } =
      await loadResultPageModule();
    const { getPublicResultPath } = await loadSubmissionPrivacyModule();
    const directRoot = createRoot();
    const redirectRoot = createRoot();

    const directPollId = getPollIdFromResultPath(`/results/${displaySafeResult.poll_id}`);
    const redirectPollId = getPollIdFromResultPath(
      getPublicResultPath(displaySafeResult.poll_id),
    );
    renderResultDisplay(directRoot, displaySafeResult);
    renderResultDisplay(redirectRoot, displaySafeResult);

    expect(directPollId).toBe(displaySafeResult.poll_id);
    expect(redirectPollId).toBe(displaySafeResult.poll_id);
    expect(collectText(redirectRoot)).toEqual(collectText(directRoot));
  });

  it('hides the public notice region when the API returns no notices', async () => {
    const { renderPublicNotices } = await loadResultPageModule();
    const root = createRoot();

    renderPublicNotices(root, { notices: [] });

    expect(root.hidden).toBe(true);
    expect(collectText(root)).toEqual([]);
  });

  it('renders only allowlisted public notice fields near the result display', async () => {
    const { renderPublicNotices } = await loadResultPageModule();
    const root = createRoot();

    renderPublicNotices(root, {
      notices: [
        publicNotice,
        {
          ...publicNotice,
          notice_type: 'internal_admin_note',
          title: 'Internal only',
          body: 'Private workflow context',
        },
      ],
    });

    expect(root.hidden).toBe(false);
    expect(collectText(root)).toEqual([
      '修正公告',
      publicNotice.title,
      publicNotice.body,
      publicNotice.created_at,
    ]);
    expect(collectText(root).join(' ')).not.toMatch(
      /private-request-id|private-admin-id|private reason|private decision|private-vote-token|private-option-id|Internal only|Private workflow context/,
    );
  });

  it('maps poll-not-found result failures to a friendly message', async () => {
    const { loadResultDisplay } = await loadResultPageModule();
    const fetchImpl = vi.fn(async () => ({
      ok: false,
      status: 404,
      json: async () => ({ error: 'POLL_NOT_FOUND', message: 'Poll not found' }),
    }));

    await expect(
      loadResultDisplay({ pollId: displaySafeResult.poll_id, fetchImpl }),
    ).rejects.toThrow('問卷目前無法使用。');
  });

  it('keeps result content visible when public notice loading fails', async () => {
    const { bootstrapResultPage } = await loadResultPageModule();
    const resultRoot = createRoot();
    const introRoot = createRoot();
    const publicNoticesRoot = createRoot();
    const bottomNav = createRoot();
    publicNoticesRoot.hidden = true;
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => displaySafeResult,
      })
      .mockResolvedValueOnce({ ok: false });

    await bootstrapResultPage({
      windowObject: {
        location: { pathname: `/results/${displaySafeResult.poll_id}` },
      },
      documentObject: {
        getElementById(id: string) {
          if (id === 'result-display') {
            return resultRoot;
          }
          if (id === 'results-intro') {
            return introRoot;
          }
          if (id === 'public-notices') {
            return publicNoticesRoot;
          }
          if (id === 'bottom-nav') {
            return bottomNav;
          }
          return null;
        },
      },
      fetchImpl,
    });

    expect(collectText(resultRoot)).toContain(displaySafeResult.total_votes_display);
    expect(collectText(introRoot).join(' ')).toMatch(/前往投票頁/);
    expect(
      bottomNav.children.some(
        (child) =>
          child.tagName === 'a' &&
          child.className === 'vote-cta-link' &&
          child.textContent === '前往投票頁',
      ),
    ).toBe(true);
    expect(publicNoticesRoot.hidden).toBe(true);
    expect(collectText(publicNoticesRoot)).toEqual([]);
  });

  it('exposes a vote-page link from the read-only intro', async () => {
    const { renderResultsReadOnlyIntro } = await loadResultPageModule();
    const root = createRoot();

    renderResultsReadOnlyIntro(root, displaySafeResult.poll_id);

    const voteLink = root.children.find(
      (child) =>
        child.tagName === 'a' && String(child.className).includes('vote-cta-link'),
    );
    expect(voteLink?.href).toBe(`/vote/${displaySafeResult.poll_id}`);
  });

  it('refreshes main result display when lifecycle payload changes', async () => {
    const { refreshResultPageDisplay } = await loadResultPageModule();
    const resultRoot = createRoot();
    const introRoot = createRoot();
    const pageTitle = {
      textContent: '',
      setAttribute() {},
      removeAttribute() {},
    };
    const pollId = collectingResult.poll_id;
    const cancelledPayload = {
      poll_id: pollId,
      public_lifecycle_state: 'cancelled',
      display_mode: 'unavailable',
      total_votes_display: '結果不可用',
      collecting: false,
      user_message: 'backend-only cancelled detail must not echo',
      options: collectingResult.options,
    };
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => collectingResult,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => cancelledPayload,
      });

    const pageContext = {
      pollId,
      root: resultRoot,
      introRoot,
      pageTitle,
      creatorLifecycleHost: null,
      uiMockState: null,
      demoOnly: false,
      search: '?creator=1',
      fetchImpl,
      onRefreshResultDisplay: null as (() => Promise<{ refreshed: boolean }>) | null,
    };
    pageContext.onRefreshResultDisplay = () => refreshResultPageDisplay(pageContext);

    const firstRefresh = await refreshResultPageDisplay(pageContext);
    expect(firstRefresh.refreshed).toBe(true);
    expect(collectText(resultRoot).join(' ')).toMatch(/結果尚未公開/);

    const secondRefresh = await refreshResultPageDisplay(pageContext);
    expect(secondRefresh.refreshed).toBe(true);
    const text = collectText(resultRoot).join(' ');
    expect(text).toContain('問卷已取消');
    expect(text).toContain('此問卷已取消，不會產生可公開顯示的聚合結果。');
    expect(text).not.toMatch(/結果尚未公開|backend-only cancelled detail/);
    expect(introRoot.hidden).toBe(true);
    expect(pageTitle.textContent).toBe('問卷已取消');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('refreshes to aggregate display after close reveals results', async () => {
    const { refreshResultPageDisplay } = await loadResultPageModule();
    const resultRoot = createRoot();
    const introRoot = createRoot();
    const pageTitle = {
      textContent: '載入結果中…',
      setAttribute() {},
      removeAttribute() {},
    };
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

    const pageContext = {
      pollId: collectingResult.poll_id,
      root: resultRoot,
      introRoot,
      pageTitle,
      creatorLifecycleHost: null,
      uiMockState: null,
      demoOnly: false,
      search: '?creator=1',
      fetchImpl,
      onRefreshResultDisplay: null as (() => Promise<{ refreshed: boolean }>) | null,
    };
    pageContext.onRefreshResultDisplay = () => refreshResultPageDisplay(pageContext);

    await refreshResultPageDisplay(pageContext);
    await refreshResultPageDisplay(pageContext);

    const text = collectText(resultRoot).join(' ');
    expect(text).toContain(displaySafeResult.total_votes_display);
    expect(text).toContain('約 43%');
    expect(text).not.toMatch(/結果尚未公開/);
    expect(pageTitle.textContent).toBe('公開結果（唯讀）');
  });

  it('refreshes to unpublished unavailable shell after unpublish', async () => {
    const { refreshResultPageDisplay } = await loadResultPageModule();
    const resultRoot = createRoot();
    const introRoot = createRoot();
    const pageTitle = {
      textContent: '',
      setAttribute() {},
      removeAttribute() {},
    };
    const pollId = collectingResult.poll_id;
    const unpublishedPayload = {
      poll_id: pollId,
      public_lifecycle_state: 'unpublished',
      display_mode: 'unavailable',
      total_votes_display: '結果不可用',
      collecting: false,
      user_message: 'backend-only unpublished detail must not echo',
      options: collectingResult.options,
    };
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => collectingResult,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => unpublishedPayload,
      });

    const pageContext = {
      pollId,
      root: resultRoot,
      introRoot,
      pageTitle,
      creatorLifecycleHost: null,
      uiMockState: null,
      demoOnly: false,
      search: '?creator=1',
      fetchImpl,
      onRefreshResultDisplay: null as (() => Promise<{ refreshed: boolean }>) | null,
    };
    pageContext.onRefreshResultDisplay = () => refreshResultPageDisplay(pageContext);

    await refreshResultPageDisplay(pageContext);
    const outcome = await refreshResultPageDisplay(pageContext);
    expect(outcome.refreshed).toBe(true);

    const text = collectText(resultRoot).join(' ');
    expect(text).toContain('問卷目前無法查看');
    expect(text).toContain('此問卷目前無法查看，頁面不顯示聚合結果。');
    expect(text).not.toMatch(/結果尚未公開|約\s*\d+%|backend-only unpublished detail/);
    expect(introRoot.hidden).toBe(true);
    expect(pageTitle.textContent).toBe('問卷目前無法查看');
  });

  it('shows a safe notice when refresh fails after transition without leaking API payload', async () => {
    const {
      refreshResultPageDisplay,
      RESULT_DISPLAY_REFRESH_FAILURE_MESSAGE,
    } = await loadResultPageModule();
    const resultRoot = createRoot();
    const introRoot = createRoot();
    const pageTitle = {
      textContent: '',
      setAttribute() {},
      removeAttribute() {},
    };
    const sensitiveBody = {
      error: 'INTERNAL',
      option_id: 'secret-option-id',
      poll_option_vote_counters: [{ option_id: 'x', raw_count: 9999 }],
      message: 'database connection leaked',
    };
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => collectingResult,
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => sensitiveBody,
      });

    const pageContext = {
      pollId: collectingResult.poll_id,
      root: resultRoot,
      introRoot,
      pageTitle,
      creatorLifecycleHost: null,
      uiMockState: null,
      demoOnly: false,
      search: '?creator=1',
      fetchImpl,
      onRefreshResultDisplay: null as (() => Promise<{ refreshed: boolean }>) | null,
    };

    await refreshResultPageDisplay(pageContext);
    const outcome = await refreshResultPageDisplay(pageContext);
    expect(outcome.refreshed).toBe(false);

    const text = collectText(resultRoot).join(' ');
    expect(text).toContain(RESULT_DISPLAY_REFRESH_FAILURE_MESSAGE);
    expect(text).toMatch(/結果尚未公開/);
    expect(text).not.toContain('secret-option-id');
    expect(text).not.toContain('poll_option_vote_counters');
    expect(text).not.toContain('database connection leaked');
    expect(text).not.toContain('raw_count');
  });

  it('contains no auto-refresh, precision reconstruction, or debug output', async () => {
    const source = await readFile(
      join(process.cwd(), 'public/frontend/result-page.js'),
      'utf8',
    );

    expect(source).not.toMatch(
      /setInterval|setTimeout|WebSocket|EventSource|requestAnimationFrame|console\.|Date\(|Math\./,
    );
    expect(source).not.toMatch(/localStorage|indexedDB|document\.cookie/);
    expect(source).not.toMatch(/sessionStorage/);
  });
});
