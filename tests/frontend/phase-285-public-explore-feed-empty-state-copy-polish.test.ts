import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_285_DOC =
  'docs/www-project-phase-285-public-explore-feed-empty-state-copy-polish-v1.md';

const NEW_EMPTY_MESSAGE = '目前沒有可瀏覽的公開問卷。';
const NEW_EMPTY_SUMMARY = '請稍後再回來看看，或建立一則新問卷。';

const FORBIDDEN_OUTCOME_COPY =
  /你投過|你尚未投票|你符合資格|你不符合資格|已投過票|選擇了|投給哪個|熱門|票數|百分比|排名|趨勢/i;

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 285 public explore feed empty state copy polish', () => {
  it('uses polished empty-state copy constants from public-mvp-ui', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const explore = await loadModule('public/frontend/explore-page.js');

    expect(publicUi.PUBLIC_EXPLORE_EMPTY_MESSAGE).toBe(NEW_EMPTY_MESSAGE);
    expect(publicUi.PUBLIC_EXPLORE_EMPTY_SUMMARY).toBe(NEW_EMPTY_SUMMARY);
    expect(publicUi.PUBLIC_EXPLORE_EMPTY_CTA_LABEL).toBe('建立問卷');
    expect(explore.EXPLORE_FEED_EMPTY_MESSAGE).toBe(publicUi.PUBLIC_EXPLORE_EMPTY_MESSAGE);
    expect(explore.EXPLORE_FEED_EMPTY_SUMMARY).toBe(publicUi.PUBLIC_EXPLORE_EMPTY_SUMMARY);
    expect(explore.EXPLORE_FEED_EMPTY_CTA_LABEL).toBe(publicUi.PUBLIC_EXPLORE_EMPTY_CTA_LABEL);
  });

  it('keeps loading and failure copy unchanged while empty copy is polished', async () => {
    const explore = await loadModule('public/frontend/explore-page.js');

    expect(explore.EXPLORE_FEED_LOADING_MESSAGE).toBe('載入探索列表中，請稍候。');
    expect(explore.EXPLORE_LOAD_FAILURE_MESSAGE).toBe(
      '目前無法載入探索列表，請稍後再試。',
    );
    expect(explore.EXPLORE_LOAD_MORE_FAILURE_MESSAGE).toBe(
      '目前無法載入更多問卷，請稍後再試。',
    );
  });

  it('aligns explore.html static empty fallback with runtime copy', async () => {
    const exploreHtml = await readFile(join(process.cwd(), 'public/explore.html'), 'utf8');

    expect(exploreHtml).toContain(NEW_EMPTY_MESSAGE);
    expect(exploreHtml).toContain(NEW_EMPTY_SUMMARY);
    expect(exploreHtml).toContain('href="/polls/new?live=1"');
    expect(exploreHtml).toContain('建立問卷');
    expect(exploreHtml).not.toContain('目前沒有正在收集中的公開問卷');
  });

  it('renders empty panel with existing create-poll CTA and safe copy only', async () => {
    const { renderPublicEmptyStatePanel } = await loadModule(
      'public/frontend/public-unavailable-state.js',
    );
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');

    function createDocumentStub() {
      const documentObject = {
        createElement(tagName: string) {
          return {
            tagName,
            className: '',
            textContent: '',
            href: '',
            children: [] as Array<ReturnType<typeof documentObject.createElement>>,
            append(child: ReturnType<typeof documentObject.createElement>) {
              this.children.push(child);
            },
            replaceChildren() {
              this.children = [];
            },
          };
        },
      };
      return documentObject;
    }

    function collectText(node: {
      textContent: string;
      children: Array<{ textContent: string; children?: unknown[] }>;
    }): string {
      return [
        node.textContent,
        ...node.children.flatMap((child) => collectText(child as typeof node)),
      ].join(' ');
    }

    const documentObject = createDocumentStub();
    const emptyHost = documentObject.createElement('div');
    renderPublicEmptyStatePanel(documentObject, emptyHost, {
      message: publicUi.PUBLIC_EXPLORE_EMPTY_MESSAGE,
      summary: publicUi.PUBLIC_EXPLORE_EMPTY_SUMMARY,
      ctaHref: '/polls/new?live=1',
      ctaLabel: publicUi.PUBLIC_EXPLORE_EMPTY_CTA_LABEL,
    });

    const rendered = collectText(emptyHost);
    expect(rendered).toContain(NEW_EMPTY_MESSAGE);
    expect(rendered).toContain(NEW_EMPTY_SUMMARY);
    expect(rendered).toContain('建立問卷');
    expect(rendered).not.toMatch(FORBIDDEN_OUTCOME_COPY);
  });

  it('keeps explore-page.js free of API, storage, and tracking drift', async () => {
    const source = await readFile(
      join(process.cwd(), 'public/frontend/explore-page.js'),
      'utf8',
    );

    expect(source).not.toMatch(/localStorage|sessionStorage|analytics|option_id|vote_token/i);
    expect(source).toContain('EXPLORE_FEED_PATH');
    expect(source).toContain('syncExploreEmptyStatePanel');
    expect(source).not.toContain('Phase 285');
  });

  it('keeps vote-by-index and registration boundaries unchanged during copy polish', async () => {
    const votePage = await loadModule('public/frontend/vote-page.js');
    const registration = await loadModule('public/frontend/registration-page.js');
    const badge = await loadModule('public/frontend/quality-feedback-badge.js');
    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      if (String(url).includes('/vote')) {
        return { ok: true, status: 201, json: async () => ({}) };
      }
      return { status: 201 };
    });

    await votePage.submitVoteByIndex({
      pollId: '11111111-1111-4111-8111-111111111111',
      optionIndex: 0,
      userId: '44444444-4444-4444-8444-444444444444',
      fetchImpl,
    });

    const voteBody = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body));
    expect(voteBody).toEqual({ option_index: 0 });

    const fetchCalls: string[] = [];
    const registrationFetch = vi.fn(async (url: string) => {
      fetchCalls.push(String(url));
      return { status: 201 };
    });
    await registration.submitRegistrationRequest({
      profile: {
        display_name: 'Explore Empty Copy User',
        birth_year_month: '1994-04',
        residential_region: 'TW-TPE',
      },
      credential: 'proof',
      fetchImpl: registrationFetch,
    });
    expect(fetchCalls).toEqual(['/registration']);
    expect(badge.QUALITY_FEEDBACK_BADGE_LABEL).toBe('回饋良好');
  });

  it('documents Phase 285 implementation record exists', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_285_DOC), 'utf8');
    expect(doc).toContain('explore-page.js');
    expect(doc).toContain('no logic change');
  });
});
