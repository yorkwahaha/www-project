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

async function readHomeSource() {
  return readFile(
    join(process.cwd(), 'public/frontend/public-mvp-home.js'),
    'utf8',
  );
}

async function readIndexHtml() {
  return readFile(join(process.cwd(), 'public/index.html'), 'utf8');
}

function createStageWithCards(count: number) {
  const cards = Array.from({ length: count }, (_, index) => ({
    className: 'home-swipe-card',
    dataset: { state: 'collecting', pollId: `card-${index}` },
    getBoundingClientRect: () => ({ top: index * 320, height: 300, bottom: (index + 1) * 320 }),
  }));
  return {
    getBoundingClientRect: () => ({ top: 0, height: 400, bottom: 400 }),
    querySelectorAll: (selector: string) => {
      if (selector.includes('skeleton')) {
        return cards;
      }
      return cards;
    },
  };
}

describe('Phase 305 home feed auto paging polish', () => {
  it('gates auto paging conservatively and keeps manual load-more fallback in the shell', async () => {
    const { shouldHomeAutoLoadMore } = await loadHomeModule();
    const html = await readIndexHtml();

    expect(shouldHomeAutoLoadMore({ nextCursor: 'abc', loading: false, cardCount: 2 })).toBe(
      true,
    );
    expect(shouldHomeAutoLoadMore({ nextCursor: null, loading: false, cardCount: 2 })).toBe(
      false,
    );
    expect(shouldHomeAutoLoadMore({ nextCursor: 'abc', loading: true, cardCount: 2 })).toBe(
      false,
    );
    expect(shouldHomeAutoLoadMore({ nextCursor: 'abc', loading: false, cardCount: 0 })).toBe(
      false,
    );

    expect(html).toContain('id="home-swipe-load-more"');
    expect(html).toContain('載入更多');
  });

  it('observes the last rendered card inside the stage scroll root', async () => {
    const {
      getHomeAutoLoadObserveTarget,
      createHomeAutoLoadIntersectionObserver,
      HOME_SWIPE_AUTO_LOAD_INTERSECTION_THRESHOLD,
    } = await loadHomeModule();
    const stage = createStageWithCards(3);
    const target = getHomeAutoLoadObserveTarget(stage);
    expect(target?.dataset.pollId).toBe('card-2');

    const observe = vi.fn();
    const disconnect = vi.fn();
    const onIntersect = vi.fn();
    const observer = createHomeAutoLoadIntersectionObserver(stage, onIntersect, {
      IntersectionObserver: class {
        root = null;
        constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
          this.root = options?.root ?? null;
          (
            this as unknown as { callback: IntersectionObserverCallback }
          ).callback = callback;
        }
        callback: IntersectionObserverCallback;
        observe = observe;
        disconnect = disconnect;
      },
    } as unknown as Window);

    expect(observer).not.toBeNull();
    observer?.observe(target as Element);

    const ctor = (
      observer as unknown as {
        callback: IntersectionObserverCallback;
      }
    ).callback;
    ctor(
      [
        {
          isIntersecting: true,
          intersectionRatio: HOME_SWIPE_AUTO_LOAD_INTERSECTION_THRESHOLD,
        } as IntersectionObserverEntry,
      ],
      observer as unknown as IntersectionObserver,
    );
    expect(onIntersect).toHaveBeenCalledTimes(1);

    onIntersect.mockClear();
    ctor(
      [
        {
          isIntersecting: true,
          intersectionRatio: HOME_SWIPE_AUTO_LOAD_INTERSECTION_THRESHOLD - 0.1,
        } as IntersectionObserverEntry,
      ],
      observer as unknown as IntersectionObserver,
    );
    expect(onIntersect).not.toHaveBeenCalled();
    expect(observe).toHaveBeenCalledWith(target);
    expect(disconnect).not.toHaveBeenCalled();
  });

  it('wires IntersectionObserver auto paging without changing /home/feed or privacy guards', async () => {
    const source = await readHomeSource();
    const { isHomeSwipeFeedItemSafe } = await loadHomeModule();

    expect(source).toContain('createHomeAutoLoadIntersectionObserver');
    expect(source).toContain('syncAutoLoadObserver');
    expect(source).toContain('disconnectAutoLoadObserver');
    expect(source).toContain('fetchHomeFeedPage');
    expect(source).not.toContain('fetchExploreFeedPage');
    expect(source).not.toMatch(/searchParams\.set\(\s*['"]q['"]/);
    expect(source).not.toMatch(/searchParams\.set\(\s*['"]category['"]/);

    const safePoll = {
      state: 'collecting' as const,
      poll_id: '11111111-1111-4111-8111-111111111111',
      title: '週末你更想宅在家還是出門？',
      category: 'life',
      lifecycle_label: '收集中' as const,
      published_display: '最近發布' as const,
      vote_page_url: '/vote/11111111-1111-4111-8111-111111111111',
    };
    expect(isHomeSwipeFeedItemSafe(safePoll)).toBe(true);
    expect(isHomeSwipeFeedItemSafe({ ...safePoll, vote_count: 1 })).toBe(false);
    expect(isHomeSwipeFeedItemSafe({ ...safePoll, percentage: 42 })).toBe(false);
  });
});
