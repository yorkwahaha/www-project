import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

async function loadHomeModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/public-mvp-home.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

async function readIndexHtml() {
  return readFile(join(process.cwd(), 'public/index.html'), 'utf8');
}

async function readHomeSource() {
  return readFile(
    join(process.cwd(), 'public/frontend/public-mvp-home.js'),
    'utf8',
  );
}

const safePoll = {
  poll_id: '11111111-1111-4111-8111-111111111111',
  title: '週末你更想宅在家還是出門？',
  category: 'life',
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
      type: '',
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

describe('Phase 301 home swipe card visual shell', () => {
  it('renders index.html as a minimal collecting-only swipe stage', async () => {
    const html = await readIndexHtml();

    // Brand + minimal shell wiring.
    expect(html).toContain('What We Wonder');
    expect(html).toContain('id="main-content"');
    expect(html).toContain('data-home-swipe-feed="collecting-only"');
    expect(html).toContain('data-auth-banner="off"');
    expect(html).toContain('id="home-swipe-stage"');
    expect(html).toContain('home-swipe-card--skeleton');
    expect(html).toContain('/frontend/public-mvp-home.js');
    expect(html).toContain('/frontend/public-mvp-layout.js');

    // Live status region for assistive tech.
    expect(html).toContain('id="home-swipe-status"');
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');

    // Required homepage actions + non-swipe fallback.
    expect(html).toContain('href="/polls/new"');
    expect(html).toContain('href="/registration"');
    expect(html).toContain('href="/login"');
    expect(html).toContain('href="/explore"');
  });

  it('removes the legacy landing content from the homepage body', async () => {
    const html = await readIndexHtml();

    expect(html).not.toContain('data-static-examples');
    expect(html).not.toContain('mvp-value-grid');
    expect(html).not.toContain('mvp-trust-row');
    expect(html).not.toContain('mvp-quiet-list');
    expect(html).not.toContain('mvp-result-preview');
    expect(html).not.toContain('mvp-featured-question');
    // No aggregate / revealed-result signals anywhere on the home shell.
    expect(html).not.toMatch(/%|票數|百分比|排名|趨勢|進度|共\s*[\d,]+\s*人|已公開|揭曉/);
  });

  it('builds a collecting card with the 回答 CTA and no aggregate fields', async () => {
    const { renderHomeSwipeCard } = await loadHomeModule();
    const documentObject = createDocumentStub();
    const card = renderHomeSwipeCard(documentObject, safePoll);
    const serialized = JSON.stringify(card);

    expect(card.className).toContain('home-swipe-card');
    expect(card.dataset.pollId).toBe(safePoll.poll_id);
    expect(serialized).toContain('收集中');
    expect(serialized).toContain('回答');
    expect(serialized).toContain('/vote/11111111-1111-4111-8111-111111111111');
    // Hard guard: never any aggregate / count / percentage / rank / progress.
    expect(serialized).not.toMatch(
      /%|vote_count|option_id|百分比|票數|排名|趨勢|進度|總計|共\s*[\d,]+\s*人|mvp-result-preview/i,
    );
  });

  it('rejects any feed item that carries an aggregate or extra field', async () => {
    const { isHomeSwipeFeedItemSafe, renderHomeSwipeCard } = await loadHomeModule();
    expect(isHomeSwipeFeedItemSafe(safePoll)).toBe(true);
    expect(isHomeSwipeFeedItemSafe({ ...safePoll, vote_count: 5 })).toBe(false);
    expect(isHomeSwipeFeedItemSafe({ ...safePoll, percentage: 42 })).toBe(false);
    expect(isHomeSwipeFeedItemSafe({ ...safePoll, status: 'revealed' })).toBe(false);

    const documentObject = createDocumentStub();
    expect(() =>
      renderHomeSwipeCard(documentObject, { ...safePoll, vote_count: 5 }),
    ).toThrow();
  });

  it('reuses the existing freshness-only /polls/feed without search or category params', async () => {
    const source = await readHomeSource();

    // Reuses the shared, validated feed data layer.
    expect(source).toContain("from './explore-page.js'");
    expect(source).toContain('fetchExploreFeedPage');

    // No new endpoint, no search box, no category filter params.
    expect(source).not.toMatch(/['"]q['"]|searchParams\.set\(\s*['"]q['"]/);
    expect(source).not.toMatch(/category=|set\(\s*['"]category['"]/);
    expect(source).not.toContain('/polls/search');

    // No revealed-result / aggregate rendering in this phase.
    expect(source).not.toMatch(/百分比|vote_count|option_id|result_preview/i);
  });
});
