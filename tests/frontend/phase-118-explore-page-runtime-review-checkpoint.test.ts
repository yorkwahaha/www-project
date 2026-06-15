import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const REVIEWED_EXPLORE_FILES = [
  'public/frontend/explore-page.js',
  'public/explore.html',
];

const FORBIDDEN_OUTCOME_COPY =
  /你投過|你尚未投票|你符合資格|你不符合資格|已投過票|選擇了|投給哪個|年齡門檻|地區條件|trust rule|role rule|profile.*完成|完成.*profile/i;

const FORBIDDEN_INTERNAL_COPY =
  /option_id|vote_token|token_sha256|shard_id|session_id|www_session|\buser_id\b|raw_count|poll_option_vote_counters/i;

async function loadExplorePageModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/explore-page.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

const safePoll = {
  poll_id: '11111111-1111-4111-8111-111111111111',
  title: '咖啡攝取調查',
  category: 'general',
  status: 'active' as const,
  published_display: '最近發布' as const,
  result_page_url: '/results/11111111-1111-4111-8111-111111111111',
  quality_badge: null,
};

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

describe('Phase 118 explore page runtime review checkpoint', () => {
  it('shows display-safe poll summary only for collecting feed items', async () => {
    const { renderExplorePollCard } = await loadExplorePageModule();
    const documentObject = createDocumentStub();
    const card = renderExplorePollCard(documentObject, safePoll);
    const serialized = JSON.stringify(card);

    expect(serialized).toContain('收集中');
    expect(serialized).toContain('不顯示票數');
    expect(serialized).toContain('最近發布');
    expect(serialized).not.toMatch(/%|熱門|趨勢|mvp-result-preview|vote_count/i);
    expect(serialized).not.toMatch(FORBIDDEN_OUTCOME_COPY);
    expect(serialized).not.toMatch(FORBIDDEN_INTERNAL_COPY);
  });

  it('uses Phase 116/117 empty and populated feed copy constants', async () => {
    const {
      EXPLORE_FEED_LIST_MESSAGE,
      EXPLORE_FEED_LIST_SUMMARY,
      EXPLORE_FEED_EMPTY_MESSAGE,
      EXPLORE_FEED_EMPTY_SUMMARY,
    } = await loadExplorePageModule();

    expect(EXPLORE_FEED_LIST_MESSAGE).toBe('顯示公開問卷列表');
    expect(EXPLORE_FEED_LIST_SUMMARY).toBe(
      '依最近發布排序；非熱門、票數、個人化或榜單。',
    );
    expect(EXPLORE_FEED_EMPTY_MESSAGE).toBe('目前沒有可瀏覽的公開問卷。');
    expect(EXPLORE_FEED_EMPTY_SUMMARY).toBe(
      '請稍後再回來看看，或建立一則新問卷。',
    );
  });

  it('maps feed load and pagination failures to neutral copy without echoing payloads', async () => {
    const {
      EXPLORE_LOAD_FAILURE_MESSAGE,
      EXPLORE_LOAD_MORE_FAILURE_MESSAGE,
      fetchExploreFeedPage,
    } = await loadExplorePageModule();

    expect(EXPLORE_LOAD_FAILURE_MESSAGE).toBe(
      '目前無法載入探索列表，請稍後再試。',
    );
    expect(EXPLORE_LOAD_MORE_FAILURE_MESSAGE).toBe(
      '目前無法載入更多問卷，請稍後再試。',
    );

    const nonOkFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({
        error: 'INTERNAL',
        message: 'option_id leak and vote_token secret',
      }),
    });
    await expect(
      fetchExploreFeedPage({ fetchImpl: nonOkFetch, origin: 'http://127.0.0.1:3000' }),
    ).rejects.toThrow(EXPLORE_LOAD_FAILURE_MESSAGE);
    await expect(
      fetchExploreFeedPage({ fetchImpl: nonOkFetch, origin: 'http://127.0.0.1:3000' }),
    ).rejects.not.toThrow(/option_id|vote_token/i);
  });

  it('excludes non-collecting and unsafe feed payloads from live explore rendering', async () => {
    const { isExploreFeedItemSafe, isExploreFeedPayloadSafe } =
      await loadExplorePageModule();

    expect(isExploreFeedItemSafe({ ...safePoll, status: 'cancelled' })).toBe(
      false,
    );
    expect(isExploreFeedItemSafe({ ...safePoll, vote_count: 12 })).toBe(false);
    expect(
      isExploreFeedPayloadSafe({
        polls: [{ ...safePoll, status: 'unpublished' }],
        next_cursor: null,
      }),
    ).toBe(false);
  });

  it('separates homepage static examples from live explore feed markup', async () => {
    const indexHtml = await readFile(join(process.cwd(), 'public/index.html'), 'utf8');
    const exploreHtml = await readFile(join(process.cwd(), 'public/explore.html'), 'utf8');

    expect(indexHtml).toContain('data-static-examples="true"');
    expect(indexHtml).toContain('靜態範例');
    expect(indexHtml).toContain('/vote/demo');
    expect(exploreHtml).toContain('data-explore-feed="freshness-only"');
    expect(exploreHtml).toContain('id="explore-feed-list"');
    expect(exploreHtml).toContain('目前沒有可瀏覽的公開問卷');
    expect(exploreHtml).not.toContain('/vote/demo');
    expect(exploreHtml).not.toContain('data-static-examples');
  });

  it('keeps explore runtime away from vote/profile paths and observability sinks', async () => {
    const source = await readFile(
      join(process.cwd(), 'public/frontend/explore-page.js'),
      'utf8',
    );

    expect(source).toContain('/polls/feed');
    expect(source).not.toMatch(/error\.message/);
    expect(source).not.toMatch(
      /\/users\/me|users\/me\/profile|vote-by-index|reference-answer|localStorage|sessionStorage|indexedDB|navigator\.sendBeacon|console\.|analytics|apm\.|trace\./i,
    );
  });

  for (const relativePath of REVIEWED_EXPLORE_FILES) {
    it(`keeps reviewed explore copy neutral in ${relativePath}`, async () => {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');

      expect(source, relativePath).not.toMatch(FORBIDDEN_OUTCOME_COPY);
      expect(source, relativePath).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(source, relativePath).not.toMatch(/熱門榜|個人化排序|結果預覽|mvp-result-preview/i);
    });
  }

  it('keeps Phase 118 user-visible messages free of forbidden internals', async () => {
    const explorePage = await loadExplorePageModule();
    const userVisibleMessages = [
      explorePage.EXPLORE_FEED_LIST_MESSAGE,
      explorePage.EXPLORE_FEED_LIST_SUMMARY,
      explorePage.EXPLORE_FEED_EMPTY_MESSAGE,
      explorePage.EXPLORE_FEED_EMPTY_SUMMARY,
      explorePage.EXPLORE_LOAD_FAILURE_MESSAGE,
      explorePage.EXPLORE_LOAD_MORE_FAILURE_MESSAGE,
      explorePage.EXPLORE_FEED_LOADING_MESSAGE,
    ];

    for (const message of userVisibleMessages) {
      expect(message).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(message).not.toMatch(FORBIDDEN_OUTCOME_COPY);
    }
  });
});
