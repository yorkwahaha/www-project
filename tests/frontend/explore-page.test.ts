import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

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
  quality_badge: null as const,
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

describe('explore page feed helpers', () => {
  it('builds freshness-only feed URLs with limit and cursor', async () => {
    const { buildExploreFeedRequestUrl } = await loadExplorePageModule();
    const first = buildExploreFeedRequestUrl({
      origin: 'http://127.0.0.1:3000',
      limit: 10,
    });
    const second = buildExploreFeedRequestUrl({
      origin: 'http://127.0.0.1:3000',
      limit: 10,
      cursor: 'v1.cursor',
    });

    expect(first.pathname).toBe('/polls/feed');
    expect(first.searchParams.get('limit')).toBe('10');
    expect(first.searchParams.has('cursor')).toBe(false);
    expect(second.searchParams.get('cursor')).toBe('v1.cursor');
    expect(first.toString()).not.toMatch(/user_id|rank|hot|trend/i);
  });

  it('rejects feed items that expose counters or extra fields', async () => {
    const { isExploreFeedItemSafe } = await loadExplorePageModule();
    expect(isExploreFeedItemSafe(safePoll)).toBe(true);
    expect(
      isExploreFeedItemSafe({
        ...safePoll,
        vote_count: 12,
      }),
    ).toBe(false);
    expect(
      isExploreFeedItemSafe({
        ...safePoll,
        option_id: 'secret',
      }),
    ).toBe(false);
    expect(
      isExploreFeedItemSafe({
        ...safePoll,
        published_at: '2026-01-01T00:00:00.000Z',
      }),
    ).toBe(false);
    expect(
      isExploreFeedItemSafe({
        ...safePoll,
        quality_badge: null,
      }),
    ).toBe(true);
    expect(
      isExploreFeedItemSafe({
        ...safePoll,
        quality_badge: 'positive_feedback',
      }),
    ).toBe(true);
    expect(
      isExploreFeedItemSafe({
        ...safePoll,
        quality_badge: 'low_quality',
      }),
    ).toBe(false);
  });

  it('renders a collecting card without percentages or result preview', async () => {
    const { renderExplorePollCard } = await loadExplorePageModule();
    const documentObject = createDocumentStub();
    const card = renderExplorePollCard(documentObject, safePoll);
    const serialized = JSON.stringify(card);

    expect(card.className).toContain('mvp-poll-card');
    expect(serialized).toContain('收集中');
    expect(serialized).toContain('不顯示票數');
    expect(serialized).not.toMatch(/%|熱門|趨勢|option_id|vote_count|mvp-result-preview/i);
    expect(serialized).toContain('/vote/11111111-1111-4111-8111-111111111111');
    expect(serialized).not.toContain('回饋良好');
  });

  it('renders quality feedback badge on explore cards when quality_badge is positive_feedback', async () => {
    const { renderExplorePollCard } = await loadExplorePageModule();
    const documentObject = createDocumentStub();
    const card = renderExplorePollCard(documentObject, {
      ...safePoll,
      quality_badge: 'positive_feedback',
    });
    const serialized = JSON.stringify(card);

    expect(serialized).toContain('回饋良好');
    expect(serialized).toContain('positive-feedback-badge');
    expect(serialized).not.toMatch(/尚未達標|回饋不足|品質不足|優質題目|高分題目|熱門|排名|品質分數|低品質/i);
  });

  it('fetches and validates a safe feed payload', async () => {
    const { fetchExploreFeedPage } = await loadExplorePageModule();
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        polls: [safePoll],
        next_cursor: null,
      }),
    });

    const body = await fetchExploreFeedPage({
      fetchImpl,
      origin: 'http://127.0.0.1:3000',
    });

    expect(body.polls).toHaveLength(1);
    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(String(fetchImpl.mock.calls[0]![0])).toContain('/polls/feed?limit=20');
  });

  it('explore.html wires freshness-only feed UI copy', async () => {
    const html = await readFile(join(process.cwd(), 'public/explore.html'), 'utf8');
    expect(html).toContain('data-explore-feed="freshness-only"');
    expect(html).toContain('/frontend/explore-page.js');
    expect(html).toContain('不顯示');
    expect(html).toContain('目前沒有可瀏覽的公開問卷');
    expect(html).not.toContain('mvp-result-preview');
    expect(html).not.toContain('/vote/demo');
    expect(html).not.toContain('data-static-examples');
  });

  it('homepage swipe shell keeps /explore as the list fallback (Phase 301)', async () => {
    // Phase 301 superseded the old content-rich homepage with an ultra-minimal
    // collecting-only swipe card feed. The home no longer carries static sample
    // cards; /explore remains the non-swipe list fallback. Current homepage
    // structure assertions live in
    // tests/frontend/phase-301-home-swipe-card-visual-shell.test.ts.
    const html = await readFile(join(process.cwd(), 'public/index.html'), 'utf8');
    expect(html).toContain('href="/explore"');
    expect(html).toContain('data-home-swipe-feed="collecting-only"');
    expect(html).not.toContain('data-static-examples');
    expect(html).not.toContain('靜態範例');
    expect(html).not.toMatch(/完整探索列表將在正式上線後開放/);
  });

  it('manual QA docs describe live explore feed not placeholder', async () => {
    const crossBrowserLog = await readFile(
      join(process.cwd(), 'docs/www-project-public-mvp-cross-browser-qa-log-v1.md'),
      'utf8',
    );
    const productionBoundary = await readFile(
      join(process.cwd(), 'docs/www-project-production-readiness-boundary-v1.md'),
      'utf8',
    );
    const demoHandoff = await readFile(
      join(process.cwd(), 'docs/www-project-public-mvp-demo-release-handoff-v1.md'),
      'utf8',
    );
    const manualQa = await readFile(
      join(process.cwd(), 'docs/www-project-public-mvp-manual-qa-v1.md'),
      'utf8',
    );

    for (const doc of [crossBrowserLog, productionBoundary, demoHandoff, manualQa]) {
      expect(doc).toMatch(/freshness-only|GET \/polls\/feed/);
      expect(doc).not.toMatch(
        /GET \/explore.*placeholder|explore placeholder|尚無列表.*不列出問卷/i,
      );
    }
    expect(demoHandoff).toMatch(/\?live=1/);
    expect(demoHandoff).toMatch(/\?creator=1/);
  });
});
