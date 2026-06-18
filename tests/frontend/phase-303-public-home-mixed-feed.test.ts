import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

const loadHomeFeed = () => loadModule('public/frontend/home-feed.js');
const loadHome = () => loadModule('public/frontend/public-mvp-home.js');

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

describe('Phase 303 home mixed feed — validators', () => {
  it('keeps collecting and revealed validators separate and exact-key-set', async () => {
    const { isHomeCollectingFeedItemSafe, isHomeRevealedFeedItemSafe } =
      await loadHomeFeed();

    expect(isHomeCollectingFeedItemSafe(collectingItem)).toBe(true);
    expect(isHomeRevealedFeedItemSafe(collectingItem)).toBe(false);
    expect(isHomeRevealedFeedItemSafe(revealedItem)).toBe(true);
    expect(isHomeCollectingFeedItemSafe(revealedItem)).toBe(false);

    // Extra key fails the exact-key-set check.
    expect(isHomeCollectingFeedItemSafe({ ...collectingItem, extra: 1 })).toBe(false);
    expect(isHomeRevealedFeedItemSafe({ ...revealedItem, extra: 1 })).toBe(false);
    // Missing key fails too.
    const { vote_page_url: _omit, ...missing } = collectingItem;
    expect(isHomeCollectingFeedItemSafe(missing)).toBe(false);
  });

  it('rejects collecting items that carry any aggregate / result field', async () => {
    const { isHomeCollectingFeedItemSafe } = await loadHomeFeed();
    for (const leak of [
      { result_summary: {} },
      { vote_count: 5 },
      { percentage: 42 },
      { rank: 1 },
      { progress: 0.5 },
      { total: 100 },
      { person_count: 100 },
      { leading_option: {} },
      { winner: 'A' },
    ]) {
      expect(isHomeCollectingFeedItemSafe({ ...collectingItem, ...leak })).toBe(false);
    }
  });

  it('accepts only a display-safe revealed summary and rejects raw counts / linkage / identity', async () => {
    const { isHomeRevealedFeedItemSafe } = await loadHomeFeed();

    expect(isHomeRevealedFeedItemSafe(revealedItem)).toBe(true);
    expect(
      isHomeRevealedFeedItemSafe({ ...revealedItem, lifecycle_label: '收集中' }),
    ).toBe(false);
    // Raw count inside the summary (extra key) is rejected.
    expect(
      isHomeRevealedFeedItemSafe({
        ...revealedItem,
        result_summary: { ...revealedItem.result_summary, total_votes: 327 },
      }),
    ).toBe(false);
    // Collecting/unavailable display modes are rejected on revealed.
    expect(
      isHomeRevealedFeedItemSafe({
        ...revealedItem,
        result_summary: { ...revealedItem.result_summary, display_mode: 'collecting' },
      }),
    ).toBe(false);
    // Non-bucket total is rejected.
    expect(
      isHomeRevealedFeedItemSafe({
        ...revealedItem,
        result_summary: { ...revealedItem.result_summary, total_votes_display: '收集中' },
      }),
    ).toBe(false);
    // Option linkage inside leading_option is rejected.
    expect(
      isHomeRevealedFeedItemSafe({
        ...revealedItem,
        result_summary: {
          ...revealedItem.result_summary,
          leading_option: { display_label: '三天', display_percentage: '約 42%', option_id: 'x' },
        },
      }),
    ).toBe(false);
    // Identity field anywhere is rejected (extra key).
    expect(isHomeRevealedFeedItemSafe({ ...revealedItem, voter_id: 'x' })).toBe(false);
  });

  it('discriminated union dispatcher fails closed and the payload validator rejects bad items', async () => {
    const { isHomeFeedItemSafe, isHomeFeedPayloadSafe } = await loadHomeFeed();

    expect(isHomeFeedItemSafe(collectingItem)).toBe(true);
    expect(isHomeFeedItemSafe(revealedItem)).toBe(true);
    expect(isHomeFeedItemSafe({ ...collectingItem, state: 'unknown' })).toBe(false);
    const { state: _state, ...noState } = collectingItem;
    expect(isHomeFeedItemSafe(noState)).toBe(false);
    // Malformed mixed item carrying both states' fields fails closed.
    expect(isHomeFeedItemSafe({ ...collectingItem, ...revealedItem, state: 'collecting' })).toBe(
      false,
    );

    expect(
      isHomeFeedPayloadSafe({ items: [collectingItem, revealedItem], next_cursor: null }),
    ).toBe(true);
    expect(
      isHomeFeedPayloadSafe({ items: [collectingItem, { bad: true }], next_cursor: null }),
    ).toBe(false);
    expect(isHomeFeedPayloadSafe({ items: [], next_cursor: 5 })).toBe(false);
    expect(isHomeFeedPayloadSafe({ polls: [] })).toBe(false);
  });

  it('fetchHomeFeedPage targets /home/feed and validates the payload', async () => {
    const { fetchHomeFeedPage } = await loadHomeFeed();
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ items: [collectingItem, revealedItem], next_cursor: null }),
    });

    const body = await fetchHomeFeedPage({ fetchImpl, origin: 'http://127.0.0.1:3000' });
    expect(body.items).toHaveLength(2);
    expect(String(fetchImpl.mock.calls[0]![0])).toContain('/home/feed?limit=');

    const badFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ items: [{ state: 'collecting', vote_count: 1 }], next_cursor: null }),
    });
    await expect(
      fetchHomeFeedPage({ fetchImpl: badFetch, origin: 'http://127.0.0.1:3000' }),
    ).rejects.toThrow();
  });

  it('home-feed.js builds no search or category query params', async () => {
    const source = await readFile(
      join(process.cwd(), 'public/frontend/home-feed.js'),
      'utf8',
    );
    expect(source).toContain("'/home/feed'");
    expect(source).not.toMatch(/searchParams\.set\(\s*['"]q['"]/);
    expect(source).not.toMatch(/searchParams\.set\(\s*['"]category['"]/);
    expect(source).not.toContain('/polls/search');
  });
});

describe('Phase 303 home mixed feed — rendering', () => {
  it('renders a revealed card with the public-safe summary and 看完整結果 CTA', async () => {
    const { renderHomeRevealedCard } = await loadHome();
    const documentObject = createDocumentStub();
    const card = renderHomeRevealedCard(documentObject, revealedItem);
    const serialized = JSON.stringify(card);

    expect(card.dataset.state).toBe('revealed');
    expect(serialized).toContain('已公開');
    expect(serialized).toContain('看完整結果');
    expect(serialized).toContain('/results/22222222-2222-4222-8222-222222222222');
    expect(serialized).toContain('三天');
    expect(serialized).toContain('約 42%');
    expect(serialized).toContain('100–499');
    // Never any raw count / option linkage / identity.
    expect(serialized).not.toMatch(/option_id|option_index|vote_count|user_id|shard|token/i);
  });

  it('dispatches each validated state to its renderer and drops invalid items', async () => {
    const { renderHomeFeedItem } = await loadHome();
    const documentObject = createDocumentStub();

    const collecting = renderHomeFeedItem(documentObject, collectingItem);
    const revealed = renderHomeFeedItem(documentObject, revealedItem);
    const invalid = renderHomeFeedItem(documentObject, { state: 'collecting', vote_count: 1 });

    expect(collecting?.dataset.state).toBe('collecting');
    expect(revealed?.dataset.state).toBe('revealed');
    expect(invalid).toBeNull();
  });

  it('revealed card throws on an unsafe item so leaks cannot reach the DOM', async () => {
    const { renderHomeRevealedCard } = await loadHome();
    const documentObject = createDocumentStub();
    expect(() =>
      renderHomeRevealedCard(documentObject, {
        ...revealedItem,
        result_summary: { ...revealedItem.result_summary, total_votes: 327 },
      }),
    ).toThrow();
  });
});
