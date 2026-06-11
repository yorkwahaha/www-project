import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PUBLIC_PARTICIPATION_SURFACES = [
  'public/frontend/explore-page.js',
  'public/frontend/vote-page.js',
  'public/frontend/official-vote-pre-vote-hints.js',
  'public/frontend/result-page.js',
  'public/explore.html',
  'public/vote.html',
  'public/results.html',
  'public/faq.html',
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

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

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

function createHintDocument() {
  const elements = new Map<string, ReturnType<ReturnType<typeof createDocumentStub>['createElement']>>();
  function createElement(tagName: string) {
    const element = {
      tagName: tagName.toUpperCase(),
      id: '',
      className: '',
      textContent: '',
      hidden: false,
      href: '',
      attributes: new Map<string, string>(),
      children: [] as ReturnType<typeof createElement>[],
      ownerDocument: null as unknown,
      setAttribute(name: string, value: string) {
        this.attributes.set(name, value);
      },
      replaceChildren() {
        this.children = [];
        this.textContent = '';
      },
      append(...nodes: ReturnType<typeof createElement>[]) {
        this.children.push(...nodes);
      },
      prepend(node: ReturnType<typeof createElement>) {
        this.children.unshift(node);
      },
    };
    element.ownerDocument = documentObject;
    return element;
  }
  const documentObject = {
    createElement,
    getElementById(id: string) {
      return elements.get(id) ?? null;
    },
    defaultView: { fetch: undefined },
  };
  const mount = createElement('aside');
  mount.id = 'official-vote-pre-vote-hint';
  elements.set('official-vote-pre-vote-hint', mount);
  return { documentObject: documentObject as unknown as Document, mount };
}

function collectText(node: unknown): string {
  const record = node as { textContent?: string; children?: unknown[]; href?: string };
  return [
    record.textContent ?? '',
    record.href ?? '',
    ...(record.children ?? []).map((child) => collectText(child)),
  ]
    .filter(Boolean)
    .join(' ');
}

describe('Phase 133 public participation results flow milestone review checkpoint', () => {
  it('keeps /explore on collecting-only feed items without counters or eligibility leakage', async () => {
    const { isExploreFeedItemSafe, renderExplorePollCard } = await loadModule(
      'public/frontend/explore-page.js',
    );

    const safePoll = {
      poll_id: '11111111-1111-4111-8111-111111111111',
      title: '咖啡攝取調查',
      category: 'general',
      status: 'active' as const,
      published_display: '最近發布' as const,
      result_page_url: '/results/11111111-1111-4111-8111-111111111111',
    };

    expect(isExploreFeedItemSafe(safePoll)).toBe(true);
    expect(isExploreFeedItemSafe({ ...safePoll, status: 'closed' })).toBe(false);
    expect(isExploreFeedItemSafe({ ...safePoll, vote_count: 12 })).toBe(false);

    const documentObject = createDocumentStub();
    const card = renderExplorePollCard(documentObject, safePoll);
    const serialized = JSON.stringify(card);
    expect(serialized).toContain('收集中');
    expect(serialized).toContain('不顯示票數');
    expect(serialized).not.toMatch(/%|熱門|趨勢|vote_count/i);
  });

  it('keeps /vote/:id pre-vote hints within login/profile guidance boundaries', async () => {
    const { mountOfficialVotePreVoteHint, PRE_VOTE_HINT_COPY } = await loadModule(
      'public/frontend/official-vote-pre-vote-hints.js',
    );
    const { documentObject, mount } = createHintDocument();

    const anonymousFetch = vi.fn();
    await mountOfficialVotePreVoteHint(documentObject, {
      fetchImpl: anonymousFetch,
      readLoginStateImpl: vi.fn(async () => ({ status: 'anonymous' })),
    });
    expect(anonymousFetch).not.toHaveBeenCalled();
    expect(collectText(mount)).toContain(PRE_VOTE_HINT_COPY.anonymous);
    expect(collectText(mount)).toContain('/login');

    mount.replaceChildren();
    const profileFetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        birth_year_month: null,
        residential_region: 'TW-TPE',
        can_vote: false,
      }),
    }));
    await mountOfficialVotePreVoteHint(documentObject, {
      fetchImpl: profileFetch,
      loginState: { status: 'authenticated', display_name: 'Vote User' },
    });
    expect(profileFetch).toHaveBeenCalledWith('/users/me/profile', {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
    });
    expect(collectText(mount)).toContain(PRE_VOTE_HINT_COPY.incompleteProfile);
    expect(collectText(mount)).not.toMatch(FORBIDDEN_OUTCOME_COPY);

    mount.replaceChildren();
    const completeFetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        birth_year_month: '1998-07',
        residential_region: 'TW-TPE',
        can_vote: true,
      }),
    }));
    await mountOfficialVotePreVoteHint(documentObject, {
      fetchImpl: completeFetch,
      loginState: { status: 'authenticated', display_name: 'Vote User' },
    });
    const completeText = collectText(mount);
    expect(completeText).toContain(PRE_VOTE_HINT_COPY.completeProfile);
    expect(completeText).toContain('此提示不代表一定可以完成投票');
    expect(completeText).not.toMatch(/符合資格|不符合資格|保證可以投票/);
  });

  it('keeps vote submit on option_index only with neutral failure copy', async () => {
    const votePage = await loadModule('public/frontend/vote-page.js');
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');

    const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      expect(body).toEqual({ option_index: 1 });
      expect(body).not.toHaveProperty('option_id');
      return { ok: true };
    });
    await votePage.submitVoteByIndex({
      pollId: '11111111-1111-4111-8111-111111111111',
      optionIndex: 1,
      userId: 'runtime-user-id',
      fetchImpl,
    });

    const failingFetch = vi.fn(async () => ({
      ok: false,
      status: 500,
      json: async () => ({
        error: 'INTERNAL',
        message: 'option_id leak and vote_token secret',
      }),
    }));
    await expect(
      votePage.submitVoteByIndex({
        pollId: '11111111-1111-4111-8111-111111111111',
        optionIndex: 0,
        userId: 'runtime-user-id',
        fetchImpl: failingFetch,
      }),
    ).rejects.toThrow(publicUi.GENERIC_VOTE_SUBMIT_FAILURE);
    await expect(
      votePage.submitVoteByIndex({
        pollId: '11111111-1111-4111-8111-111111111111',
        optionIndex: 0,
        userId: 'runtime-user-id',
        fetchImpl: failingFetch,
      }),
    ).rejects.not.toThrow(/option_id|vote_token/i);
  });

  it('keeps /results/:id on public results API with lifecycle-tier display only', async () => {
    const lifecycle = await loadModule('public/frontend/poll-lifecycle-controls.js');
    const resultPage = await loadModule('public/frontend/result-page.js');
    const pollId = '22222222-2222-4222-8222-222222222222';

    expect(lifecycle.parseCreatorManageMode('')).toBe(false);
    expect(lifecycle.parseCreatorManageMode('?creator=1')).toBe(true);

    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        poll_id: pollId,
        public_lifecycle_state: 'collecting',
        collecting: true,
        display_mode: 'collecting',
        total_votes_display: '收集中',
        options: [{ display_label: '選項甲' }],
      }),
    }));
    const collecting = await resultPage.loadResultDisplay({ pollId, fetchImpl });
    expect(fetchImpl).toHaveBeenCalledWith(`/polls/${pollId}/results`, {
      method: 'GET',
      credentials: 'omit',
      cache: 'no-store',
    });
    expect(collecting.public_lifecycle_state).toBe('collecting');
    expect(JSON.stringify(fetchImpl.mock.calls)).not.toMatch(/\/creator\/polls/i);
  });

  it('keeps static public copy from implying creator per-choice visibility or collecting counts', async () => {
    const faq = await readFile(join(process.cwd(), 'public/faq.html'), 'utf8');
    const voteHtml = await readFile(join(process.cwd(), 'public/vote.html'), 'utf8');
    const exploreHtml = await readFile(join(process.cwd(), 'public/explore.html'), 'utf8');

    expect(faq).toContain('發起者也不例外，無法查看中途統計');
    expect(faq).toContain('不對外公開個人投票紀錄');
    expect(faq).toContain('收集期間完全不顯示票數、百分比、排名或趨勢');
    expect(voteHtml).not.toMatch(/你符合資格|一定能投票|保證可以投票/);
    expect(exploreHtml).toMatch(/不顯示票數|票數|百分比/);
    expect(faq).not.toMatch(/發起者.*可.*查看.*個別/i);
  });

  it('keeps public participation runtime away from creator_session and Reference Answer paths', async () => {
    for (const relativePath of [
      'public/frontend/explore-page.js',
      'public/frontend/vote-page.js',
      'public/frontend/result-page.js',
    ]) {
      const source = stripJsComments(
        await readFile(join(process.cwd(), relativePath), 'utf8'),
      );
      expect(source, relativePath).not.toMatch(
        /creator_session|\/creator\/session|reference-answer|localStorage|sessionStorage|indexedDB/i,
      );
      expect(source, relativePath).not.toMatch(
        /navigator\.sendBeacon|console\.|analytics|apm\.|trace\./i,
      );
    }
  });

  for (const relativePath of PUBLIC_PARTICIPATION_SURFACES) {
    it(`keeps reviewed public participation copy neutral in ${relativePath}`, async () => {
      const raw = await readFile(join(process.cwd(), relativePath), 'utf8');
      const source = relativePath.endsWith('.js') ? stripJsComments(raw) : raw;

      expect(source, relativePath).not.toMatch(FORBIDDEN_OUTCOME_COPY);
      expect(source, relativePath).not.toMatch(FORBIDDEN_EXTRA_PROFILE_FIELDS);
      if (
        relativePath !== 'public/frontend/vote-page.js' &&
        relativePath !== 'public/frontend/result-page.js'
      ) {
        expect(source, relativePath).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      }
    });
  }

  it('keeps milestone user-visible public messages free of forbidden internals', async () => {
    const explore = await loadModule('public/frontend/explore-page.js');
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const resultPage = await loadModule('public/frontend/result-page.js');

    const userVisibleMessages = [
      explore.EXPLORE_LOAD_FAILURE_MESSAGE,
      explore.EXPLORE_FEED_EMPTY_MESSAGE,
      explore.EXPLORE_FEED_LIST_SUMMARY,
      publicUi.VOTE_PAGE_LOAD_FAILURE,
      publicUi.GENERIC_VOTE_SUBMIT_FAILURE,
      resultPage.RESULTS_COLLECTING_TITLE,
      resultPage.RESULTS_COLLECTING_SUMMARY,
      resultPage.RESULTS_LOAD_FAILURE_MESSAGE,
      resultPage.RESULTS_CANCELLED_MESSAGE,
    ];

    for (const message of userVisibleMessages) {
      expect(message).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(message).not.toMatch(FORBIDDEN_OUTCOME_COPY);
    }
  });
});
