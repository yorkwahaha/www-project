import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_239_DOC =
  'docs/www-project-phase-239-public-poll-card-metadata-layout-polish-v1.md';

const TOUCHED_MODULES = [
  'public/frontend/public-poll-card.js',
  'public/frontend/explore-page.js',
  'public/frontend/my-polls-page.js',
  'public/frontend/public-mvp.css',
  'public/index.html',
  'public/my-polls.html',
] as const;

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
    const element = {
      tagName,
      className: '',
      textContent: '',
      href: '',
      hidden: false,
      dataset: {} as Record<string, string>,
      children: [] as ReturnType<typeof createElement>[],
      append(...nodes: ReturnType<typeof createElement>[]) {
        this.children.push(...nodes);
      },
    };
    return element;
  }
  return { createElement };
}

function childTagOrder(node: { children: Array<{ tagName?: string; className?: string }> }) {
  return node.children.map((child) => {
    if (child.tagName?.toUpperCase() === 'H3') {
      return 'title';
    }
    if (child.className?.includes('mvp-poll-card-status-row')) {
      return 'status-row';
    }
    if (child.className?.includes('mvp-poll-card-meta')) {
      return 'meta';
    }
    if (child.className?.includes('mvp-poll-card-hint')) {
      return 'hint';
    }
    if (child.className?.includes('mvp-poll-card-footer')) {
      return 'footer';
    }
    return child.tagName ?? 'unknown';
  });
}

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 239 public poll card metadata layout polish', () => {
  it('documents Phase 239 in README and phase doc', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_239_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(doc).toContain('Phase 239');
    expect(doc).toContain('Public Poll Card Metadata Layout Polish');
    expect(doc).toContain('PUBLIC_POLL_CARD_METADATA_LAYOUT_ORDER');
    expect(readme).toContain('Phase 239');
    expect(readme).toContain(PHASE_239_DOC);
  });

  it('exports shared poll card metadata layout helpers', async () => {
    const pollCard = await loadModule('public/frontend/public-poll-card.js');

    expect(pollCard.PUBLIC_POLL_CARD_METADATA_LAYOUT_ORDER).toEqual([
      'title',
      'status-row',
      'meta',
      'hint-or-body',
      'footer-cta',
    ]);
    expect(pollCard.formatPublicPollCardMetaLine('生活', '最近發布')).toBe('生活 · 最近發布');
    expect(pollCard.formatPublicPollCardCloseTimeLabel('2026-06-15T12:00:00.000Z')).toContain(
      '截止',
    );
  });

  it('renders explore cards in title → status → meta → hint → footer order', async () => {
    const explore = await loadModule('public/frontend/explore-page.js');
    const exploreSource = await readFile(
      join(process.cwd(), 'public/frontend/explore-page.js'),
      'utf8',
    );
    const documentObject = createDocumentStub();
    const card = explore.renderExplorePollCard(documentObject, safePoll);

    expect(exploreSource).toContain("from './public-poll-card.js'");
    expect(card.className).toContain('mvp-poll-card');
    expect(childTagOrder(card)).toEqual(['title', 'status-row', 'meta', 'hint', 'footer']);

    const statusRow = card.children.find((child) =>
      child.className?.includes('mvp-poll-card-status-row'),
    );
    expect(statusRow?.children[0]?.textContent).toBe('收集中');
    expect(JSON.stringify(card)).not.toMatch(/%|vote_count|option_id|mvp-result-preview/i);
  });

  it('keeps quality_badge presentation-only on explore cards', async () => {
    const explore = await loadModule('public/frontend/explore-page.js');
    const badge = await loadModule('public/frontend/quality-feedback-badge.js');
    const documentObject = createDocumentStub();

    const withoutBadge = explore.renderExplorePollCard(documentObject, safePoll);
    const withBadge = explore.renderExplorePollCard(documentObject, {
      ...safePoll,
      quality_badge: 'positive_feedback',
    });

    expect(JSON.stringify(withoutBadge)).not.toContain('回饋良好');
    expect(JSON.stringify(withBadge)).toContain('回饋良好');
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: null })).toBe(false);
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: 'positive_feedback' })).toBe(
      true,
    );
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: 'low_quality' })).toBe(false);
  });

  it('keeps shared poll-card status-row layout for explore after Phase 301 home redesign', async () => {
    const indexHtml = await readFile(join(process.cwd(), 'public/index.html'), 'utf8');
    const css = await readFile(join(process.cwd(), 'public/frontend/public-mvp.css'), 'utf8');

    // Phase 301: the homepage no longer renders shared mvp-poll-card static cards
    // (it is now a collecting-only swipe shell using home-only home-swipe-card
    // classes). The shared status-row layout primitive remains in CSS for the
    // explore feed, which is covered by the explore-card tests above.
    expect(indexHtml).not.toContain('mvp-poll-card-status-row');
    expect(indexHtml).toContain('data-home-swipe-feed="collecting-only"');
    expect(css).toContain('.mvp-poll-card-status-row');
  });

  it('aligns my-polls mock dashboard status and time columns', async () => {
    const myPollsHtml = await readFile(join(process.cwd(), 'public/my-polls.html'), 'utf8');
    const myPollsSource = await readFile(
      join(process.cwd(), 'public/frontend/my-polls-page.js'),
      'utf8',
    );
    const css = await readFile(join(process.cwd(), 'public/frontend/public-mvp.css'), 'utf8');

    expect(myPollsHtml).toContain('mvp-poll-card-status-row');
    expect(myPollsHtml).toContain('mvp-poll-card-time-cell');
    expect(myPollsSource).toContain("from './public-poll-card.js'");
    expect(myPollsSource).toContain('appendPublicPollCardStatusRow');
    expect(myPollsSource).toContain('formatPublicPollCardCloseTimeLabel');
    expect(css).toContain('.mvp-dash-table .mvp-poll-card-time-cell');
  });

  it('keeps explore feed allowlist and fetch contract unchanged', async () => {
    const explore = await loadModule('public/frontend/explore-page.js');
    const exploreSource = await readFile(
      join(process.cwd(), 'public/frontend/explore-page.js'),
      'utf8',
    );

    expect(explore.EXPLORE_FEED_ALLOWED_ITEM_KEYS).toEqual([
      'poll_id',
      'title',
      'category',
      'status',
      'published_display',
      'result_page_url',
      'quality_badge',
    ]);
    expect(exploreSource).toContain("fetchImpl(");
    expect(exploreSource).toContain("method: 'GET'");
    expect(exploreSource).not.toMatch(/POST \/creator|POST \/polls|option_index/i);
  });

  it('keeps vote-by-index and Official Vote transaction boundaries', async () => {
    const votePage = await loadModule('public/frontend/vote-page.js');
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 201,
      json: async () => ({
        vote_token: 'secret-token',
        option_id: 'secret-option',
        shard_id: 7,
      }),
    }));

    await votePage.submitVoteByIndex({
      pollId: safePoll.poll_id,
      optionIndex: 1,
      userId: '44444444-4444-4444-8444-444444444444',
      fetchImpl,
    });

    const body = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body));
    expect(body).toEqual({ option_index: 1 });

    const repository = await readFile(join(process.cwd(), 'src/polls/repository.ts'), 'utf8');
    const transactionStart = repository.indexOf('async function castOfficialVote(');
    const transactionEnd = repository.indexOf('async function resolveOfficialVoteOptionIdWithClient');
    const transactionBody = repository.slice(transactionStart, transactionEnd);
    expect(transactionBody.indexOf('isProfileEligibleForOfficialVote')).toBeGreaterThan(-1);
    expect(transactionBody.indexOf('resolveOfficialVoteOptionIdWithClient')).toBeGreaterThan(
      transactionBody.indexOf('isProfileEligibleForOfficialVote'),
    );
    expect(transactionBody.indexOf('insertVoteToken')).toBeGreaterThan(
      transactionBody.indexOf('resolveOfficialVoteOptionIdWithClient'),
    );
    expect(transactionBody.indexOf('incrementVoteCounter')).toBeGreaterThan(
      transactionBody.indexOf('insertVoteToken'),
    );
  });

  it('keeps touched modules free of phase markers and forbidden storage', async () => {
    for (const relativePath of TOUCHED_MODULES) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 239');
      if (relativePath.endsWith('.js')) {
        expect(source, relativePath).not.toMatch(/localStorage|sessionStorage|document\.cookie/i);
      }
    }
  });
});
