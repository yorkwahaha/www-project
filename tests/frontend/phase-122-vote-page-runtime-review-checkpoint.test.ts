import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const REVIEWED_VOTE_PAGE_FILES = [
  'public/frontend/vote-page.js',
  'public/frontend/public-mvp-ui.js',
  'public/frontend/official-vote-pre-vote-hints.js',
  'public/frontend/login-state-read.js',
  'public/vote.html',
];

const FORBIDDEN_OUTCOME_COPY =
  /你投過|你尚未投票|你符合資格|你不符合資格|已投過票|選擇了|投給哪個|年齡門檻|地區條件|trust rule|role rule|profile.*完成|完成.*profile/i;

const FORBIDDEN_INTERNAL_COPY =
  /option_id|vote_token|token_sha256|shard_id|session_id|www_session|\buser_id\b|raw_count|poll_option_vote_counters/i;

function stripJsComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

async function loadVotePageModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/vote-page.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

async function loadPublicMvpUiModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/public-mvp-ui.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

async function loadPreVoteHintsModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/official-vote-pre-vote-hints.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

async function loadLoginStateModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/login-state-read.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

function createHintDocument() {
  const elements = new Map<string, { id: string; textContent: string; children: unknown[]; hidden: boolean; href: string }>();
  function createElement(tagName: string) {
    const element = {
      tagName: tagName.toUpperCase(),
      id: '',
      className: '',
      textContent: '',
      hidden: false,
      href: '',
      attributes: new Map<string, string>(),
      children: [] as unknown[],
      ownerDocument: null as unknown,
      setAttribute() {},
      replaceChildren() {
        this.children = [];
        this.textContent = '';
      },
      append(...nodes: unknown[]) {
        this.children.push(...nodes);
      },
      prepend(node: unknown) {
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

  const main = createElement('main');
  main.id = 'main-content';
  const mount = createElement('aside');
  mount.id = 'official-vote-pre-vote-hint';
  elements.set('main-content', main);
  elements.set('official-vote-pre-vote-hint', mount);

  return { documentObject: documentObject as unknown as Document, mount };
}

function collectText(node: unknown): string {
  const record = node as { textContent?: string; children?: unknown[] };
  return [
    record.textContent ?? '',
    ...(record.children ?? []).map((child) => collectText(child)),
  ]
    .filter(Boolean)
    .join(' ');
}

function collectLinks(node: unknown): string[] {
  const record = node as { href?: string; children?: unknown[] };
  return [
    record.href ?? '',
    ...(record.children ?? []).flatMap((child) => collectLinks(child)),
  ].filter(Boolean);
}

describe('Phase 122 vote page runtime review checkpoint', () => {
  it('shows login-only pre-vote hint for anonymous users without profile API reads', async () => {
    const { mountOfficialVotePreVoteHint, PRE_VOTE_HINT_COPY } =
      await loadPreVoteHintsModule();
    const { documentObject, mount } = createHintDocument();
    const fetchImpl = vi.fn();
    const readLoginStateImpl = vi.fn(async () => ({ status: 'anonymous' }));

    const result = await mountOfficialVotePreVoteHint(documentObject, {
      fetchImpl,
      readLoginStateImpl,
    });

    expect(result).toEqual({ status: 'anonymous' });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(collectText(mount)).toContain(PRE_VOTE_HINT_COPY.anonymous);
    expect(collectLinks(mount)).toContain('/login');
    expect(collectText(mount)).not.toMatch(FORBIDDEN_OUTCOME_COPY);
  });

  it('shows /profile guidance for incomplete profile without eligibility outcomes', async () => {
    const { mountOfficialVotePreVoteHint, PRE_VOTE_HINT_COPY } =
      await loadPreVoteHintsModule();
    const { documentObject, mount } = createHintDocument();
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        birth_year_month: null,
        residential_region: 'TW-TPE',
        age_passed: false,
        can_vote: false,
      }),
    }));

    const result = await mountOfficialVotePreVoteHint(documentObject, {
      fetchImpl,
      loginState: { status: 'authenticated', display_name: 'Vote User' },
    });

    expect(result).toEqual({ status: 'profile-incomplete' });
    expect(fetchImpl).toHaveBeenCalledWith('/users/me/profile', {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
    });
    expect(collectText(mount)).toContain(PRE_VOTE_HINT_COPY.incompleteProfile);
    expect(collectLinks(mount)).toContain('/profile');
    expect(collectText(mount)).not.toMatch(FORBIDDEN_OUTCOME_COPY);
  });

  it('does not guarantee eligibility when profile is complete', async () => {
    const { mountOfficialVotePreVoteHint, PRE_VOTE_HINT_COPY } =
      await loadPreVoteHintsModule();
    const { documentObject, mount } = createHintDocument();
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        birth_year_month: '1998-07',
        residential_region: 'TW-TPE',
        age_passed: true,
        can_vote: true,
      }),
    }));

    const result = await mountOfficialVotePreVoteHint(documentObject, {
      fetchImpl,
      loginState: { status: 'authenticated', display_name: 'Vote User' },
    });

    const text = collectText(mount);
    expect(result).toEqual({ status: 'profile-complete' });
    expect(text).toContain(PRE_VOTE_HINT_COPY.completeProfile);
    expect(text).toContain('此提示不代表一定可以完成投票');
    expect(text).not.toMatch(/符合資格|不符合資格|保證可以投票/);
    expect(collectLinks(mount)).toEqual([]);
  });

  it('parses only profile completeness fields and login display_name', async () => {
    const preVote = await loadPreVoteHintsModule();
    const loginState = await loadLoginStateModule();

    expect(
      Object.keys(
        preVote.parsePreVoteProfile({
          birth_year_month: '1998-07',
          residential_region: 'TW-TPE',
          age_passed: false,
          option_id: 'secret',
        }),
      ).sort(),
    ).toEqual(['birth_year_month', 'residential_region']);

    expect(
      loginState.parseAuthenticatedMeBody({
        user_id: '11111111-1111-4111-8111-111111111111',
        display_name: 'Vote User',
      }),
    ).toEqual({ display_name: 'Vote User' });
  });

  it('submits option_index only without early option_id resolution', async () => {
    const { submitVoteByIndex } = await loadVotePageModule();
    const voteSource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/vote-page.js'), 'utf8'),
    );

    expect(voteSource).not.toMatch(/\boption_id\b/);
    expect(voteSource).toContain('option_index: optionIndex');
    expect(voteSource).not.toMatch(/creator_session|reference-answer/i);

    const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      expect(body).toEqual({ option_index: 1 });
      expect(body).not.toHaveProperty('option_id');
      return { ok: true };
    });

    await submitVoteByIndex({
      pollId: '11111111-1111-4111-8111-111111111111',
      optionIndex: 1,
      userId: 'runtime-user-id',
      fetchImpl,
    });
  });

  it('maps load, lifecycle-block, and submit failures to frontend-owned neutral copy', async () => {
    const publicUi = await loadPublicMvpUiModule();
    const votePage = await loadVotePageModule();

    expect(publicUi.VOTE_PAGE_LOAD_FAILURE).toBe('目前無法載入問卷，請稍後再試。');
    expect(publicUi.VOTE_SUBMIT_TRANSPORT_FAILURE).toBe(
      '目前無法送出投票，請稍後再試。',
    );
    expect(publicUi.messageForVoteSubmitFailure()).toBe(
      publicUi.GENERIC_VOTE_SUBMIT_FAILURE,
    );

    const nonOkFetch = vi.fn(async () => ({
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
        fetchImpl: nonOkFetch,
      }),
    ).rejects.toThrow(publicUi.GENERIC_VOTE_SUBMIT_FAILURE);
    await expect(
      votePage.submitVoteByIndex({
        pollId: '11111111-1111-4111-8111-111111111111',
        optionIndex: 0,
        userId: 'runtime-user-id',
        fetchImpl: nonOkFetch,
      }),
    ).rejects.not.toThrow(/option_id|vote_token/i);

    const submitButton = {
      disabled: false,
      attributes: new Map<string, string>(),
      setAttribute(name: string, value: string) {
        this.attributes.set(name, value);
      },
    };
    const message = { textContent: '' };
    const result = votePage.applyVotePageVotingAvailability({
      detail: { public_lifecycle_state: 'revealed' },
      submitButton,
      message,
      collectingNotice: { hidden: false },
    });
    expect(result.votingAllowed).toBe(false);
    expect(result.blockedMessage).toBe('此問卷已結束。');
  });

  it('keeps vote-page runtime away from observability sinks and profile vote-state APIs', async () => {
    const voteSource = await readFile(
      join(process.cwd(), 'public/frontend/vote-page.js'),
      'utf8',
    );

    expect(voteSource).toContain('mountOfficialVotePreVoteHint');
    expect(voteSource).not.toMatch(
      /localStorage|sessionStorage|indexedDB|navigator\.sendBeacon|console\.|analytics|apm\.|trace\./i,
    );
    expect(voteSource).not.toMatch(/creator_session|reference-answer/i);
  });

  for (const relativePath of REVIEWED_VOTE_PAGE_FILES) {
    it(`keeps reviewed vote-page copy neutral in ${relativePath}`, async () => {
      const raw = await readFile(join(process.cwd(), relativePath), 'utf8');
      const source = relativePath.endsWith('.js')
        ? stripJsComments(raw)
        : raw;

      expect(source, relativePath).not.toMatch(FORBIDDEN_OUTCOME_COPY);
      expect(source, relativePath).not.toMatch(FORBIDDEN_INTERNAL_COPY);
    });
  }

  it('keeps Phase 122 user-visible messages free of forbidden internals', async () => {
    const publicUi = await loadPublicMvpUiModule();
    const votePage = await loadVotePageModule();
    const preVote = await loadPreVoteHintsModule();

    const userVisibleMessages = [
      publicUi.GENERIC_VOTE_SUBMIT_FAILURE,
      publicUi.VOTE_SUBMIT_TRANSPORT_FAILURE,
      publicUi.VOTE_PAGE_LOAD_FAILURE,
      votePage.MISSING_SELECTION_MESSAGE,
      votePage.VOTE_SUCCESS_MESSAGE,
      votePage.VOTE_SUCCESS_STATUS_MESSAGE,
      preVote.PRE_VOTE_HINT_COPY.anonymous,
      preVote.PRE_VOTE_HINT_COPY.incompleteProfile,
      preVote.PRE_VOTE_HINT_COPY.completeProfile,
      preVote.PRE_VOTE_HINT_COPY.profileLoadFailed,
      '此問卷已結束。',
      '此問卷目前無法使用。',
      '此問卷已截止，無法再投票。',
    ];

    for (const message of userVisibleMessages) {
      expect(message).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(message).not.toMatch(FORBIDDEN_OUTCOME_COPY);
    }
  });
});
