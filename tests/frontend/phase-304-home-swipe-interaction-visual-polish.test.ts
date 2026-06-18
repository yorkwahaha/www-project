import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

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

async function readCss() {
  return readFile(join(process.cwd(), 'public/frontend/public-mvp.css'), 'utf8');
}

const collectingItem = {
  state: 'collecting',
  poll_id: '11111111-1111-4111-8111-111111111111',
  title: '週末你更想宅在家還是出門？',
  category: 'life',
  lifecycle_label: '收集中',
  published_display: '最近發布',
  vote_page_url: '/vote/11111111-1111-4111-8111-111111111111',
};

const revealedItem = {
  state: 'revealed',
  poll_id: '22222222-2222-4222-8222-222222222222',
  title: '遠端工作一週幾天最適合？',
  category: 'workplace',
  lifecycle_label: '已公開',
  published_display: '最近發布',
  result_page_url: '/results/22222222-2222-4222-8222-222222222222',
  result_summary: {
    display_mode: 'rounded_with_bucketed_votes',
    total_votes_display: '100–499',
    leading_option: { display_label: '三天', display_percentage: '約 42%' },
  },
  quality_badge: null,
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

function createStageStub(cardRects: Array<{ top: number; height: number }>) {
  const cards = cardRects.map((rect, index) => ({
    className: 'home-swipe-card',
    dataset: { state: index % 2 === 0 ? 'collecting' : 'revealed' },
    getBoundingClientRect: () => ({
      top: rect.top,
      height: rect.height,
      bottom: rect.top + rect.height,
    }),
    scrollIntoView: vi.fn(),
  }));

  const stage = {
    tabIndex: 0,
    getBoundingClientRect: () => ({ top: 0, height: 400, bottom: 400 }),
    querySelectorAll: (selector: string) => {
      if (selector.includes('skeleton')) {
        return cards;
      }
      return cards;
    },
    addEventListener: vi.fn(),
  };

  return { stage, cards };
}

describe('Phase 304 home swipe interaction / visual polish', () => {
  it('keeps the polished shell wiring, keyboard stage target, and card-system panels', async () => {
    const html = await readIndexHtml();

    expect(html).toContain('tabindex="0"');
    expect(html).toContain('方向鍵或 Page Up／Page Down 可切換卡片');
    expect(html).toContain('home-swipe-card--panel');
    expect(html).toContain('home-swipe-card--empty');
    expect(html).toContain('home-swipe-card--error');
    expect(html).toContain('id="home-explore-fallback"');
    expect(html).toContain('href="/explore"');
    expect(html).toContain('發起提問');
  });

  it('documents Phase 304 polish in CSS with snap rhythm, focus, and reduced-motion guards', async () => {
    const css = await readCss();

    expect(css).toContain('Phase 304');
    expect(css).toContain('scroll-snap-stop: always');
    expect(css).toContain('home-swipe-card--panel');
    expect(css).toContain('home-swipe-card--revealed');
    expect(css).toContain('home-swipe-stage:focus-visible');
    expect(css).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.home-swipe-stage[\s\S]*scroll-behavior:\s*auto/,
    );
    expect(css).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*home-swipe-skeleton[\s\S]*animation:\s*none/,
    );
  });

  it('exposes keyboard adjacent-card helpers without making cards themselves focus traps', async () => {
    const source = await readHomeSource();
    const {
      handleHomeSwipeStageKeydown,
      resolveFocusedHomeSwipeCardIndex,
      scrollAdjacentHomeSwipeCard,
    } = await loadHomeModule();

    expect(source).toContain('handleHomeSwipeStageKeydown');
    expect(source).toContain('pointerdown');
    expect(source).not.toContain('tabindex="0"');
    expect(source).not.toMatch(/article\.tabIndex\s*=\s*0/);

    const { stage, cards } = createStageStub([
      { top: 10, height: 300 },
      { top: 340, height: 300 },
    ]);
    expect(resolveFocusedHomeSwipeCardIndex(stage)).toBe(0);

    const scrolled = scrollAdjacentHomeSwipeCard(stage, 'next', { behavior: 'auto' });
    expect(scrolled).toBe(true);
    expect(cards[1]?.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'auto',
      block: 'center',
    });

    const event = {
      key: 'ArrowDown',
      preventDefault: vi.fn(),
    };
    handleHomeSwipeStageKeydown(event, stage, {
      matchMedia: () => ({ matches: true }),
    } as unknown as Window);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('keeps collecting and revealed CTA copy and collecting no-leak guards', async () => {
    const { renderHomeSwipeCard, renderHomeRevealedCard, isHomeSwipeFeedItemSafe } =
      await loadHomeModule();
    const documentObject = createDocumentStub();

    const collecting = renderHomeSwipeCard(documentObject, collectingItem);
    const revealed = renderHomeRevealedCard(documentObject, revealedItem);
    const collectingJson = JSON.stringify(collecting);
    const revealedJson = JSON.stringify(revealed);

    expect(collectingJson).toContain('回答');
    expect(collectingJson).not.toMatch(
      /%|vote_count|option_id|百分比|票數|排名|趨勢|進度|總計|共\s*[\d,]+\s*人/i,
    );
    expect(revealedJson).toContain('看完整結果');
    expect(revealedJson).toContain('已公開 · 點擊看完整結果');
    expect(revealed.className).toContain('home-swipe-card--revealed');

    expect(isHomeSwipeFeedItemSafe({ ...collectingItem, vote_count: 3 })).toBe(false);
  });

  it('still consumes /home/feed only and leaves /polls/feed untouched', async () => {
    const source = await readHomeSource();
    const homeFeedSource = await readFile(
      join(process.cwd(), 'public/frontend/home-feed.js'),
      'utf8',
    );
    const exploreSource = await readFile(
      join(process.cwd(), 'public/frontend/explore-page.js'),
      'utf8',
    );

    expect(source).toContain("from './home-feed.js'");
    expect(source).toContain('fetchHomeFeedPage');
    expect(source).not.toContain('fetchExploreFeedPage');
    expect(homeFeedSource).toContain("'/home/feed'");
    expect(exploreSource).toContain("'/polls/feed'");
    expect(source).not.toMatch(/searchParams\.set\(\s*['"]q['"]/);
    expect(source).not.toMatch(/searchParams\.set\(\s*['"]category['"]/);
    expect(source).not.toContain('/polls/search');
  });
});
