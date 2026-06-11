import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PUBLIC_CTA_SURFACES = [
  'public/frontend/public-mvp-ui.js',
  'public/frontend/auth-state-copy.js',
  'public/frontend/login-page.js',
  'public/frontend/registration-page.js',
  'public/frontend/profile-page.js',
  'public/frontend/profile-completion-prompt.js',
  'public/frontend/official-vote-pre-vote-hints.js',
  'public/frontend/vote-page.js',
  'public/frontend/result-page.js',
  'public/frontend/explore-page.js',
  'public/frontend/my-polls-page.js',
  'public/frontend/create-poll-page.js',
  'public/frontend/creator-flow-copy.js',
  'public/frontend/poll-lifecycle-controls.js',
];

const FORBIDDEN_INTERNAL_COPY =
  /option_id|vote_token|token_sha256|shard_id|session_id|www_session|\buser_id\b|raw_count|poll_option_vote_counters|creator_token/i;

const FORBIDDEN_OUTCOME_COPY =
  /你符合資格|你不符合資格|已投過票|可以投票|一定能投票|can_vote|age_passed|region_passed/i;

const FORBIDDEN_BACKEND_ECHO =
  /error\.message|body\.message|apiError\.message|response\.text\(\)|JSON\.stringify\(error/i;

const FORBIDDEN_OBSERVABILITY =
  /console\.(log|info|warn|error|debug)|analytics|datadog|sentry|apm|trackEvent|gtag\(/i;

function stripJsComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 143 public CTA / link label consistency polish', () => {
  it('exports frontend-owned CTA allowlist with safe fixed copy', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');

    expect(publicUi.PUBLIC_CTA_LINK_LABELS.length).toBeGreaterThan(25);
    expect(publicUi.PUBLIC_CTA_GO_TO_LOGIN_LABEL).toBe('前往登入');
    expect(publicUi.PUBLIC_CTA_GO_TO_VOTE_PAGE_LABEL).toBe('前往投票頁');

    for (const label of publicUi.PUBLIC_CTA_LINK_LABELS) {
      expect(typeof label).toBe('string');
      expect(label.length).toBeGreaterThan(0);
      expect(label).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(label).not.toMatch(FORBIDDEN_OUTCOME_COPY);
      expect(label).not.toMatch(/\d+%|第\s*\d+\s*名|raw_count/i);
    }
  });

  it('maps surface CTA constants into PUBLIC_CTA_LINK_LABELS', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const authCopy = await loadModule('public/frontend/auth-state-copy.js');
    const login = await loadModule('public/frontend/login-page.js');
    const registration = await loadModule('public/frontend/registration-page.js');
    const profile = await loadModule('public/frontend/profile-page.js');
    const profilePrompt = await loadModule('public/frontend/profile-completion-prompt.js');
    const preVote = await loadModule('public/frontend/official-vote-pre-vote-hints.js');
    const votePage = await loadModule('public/frontend/vote-page.js');
    const resultPage = await loadModule('public/frontend/result-page.js');
    const explore = await loadModule('public/frontend/explore-page.js');
    const myPolls = await loadModule('public/frontend/my-polls-page.js');
    const createPoll = await loadModule('public/frontend/create-poll-page.js');
    const creatorFlow = await loadModule('public/frontend/creator-flow-copy.js');
    const lifecycle = await loadModule('public/frontend/poll-lifecycle-controls.js');

    const mappedLabels = [
      authCopy.AUTH_STATE_COPY.guestPrimaryCta,
      authCopy.AUTH_STATE_COPY.guestSecondaryCta,
      login.LOGIN_SUBMIT_CTA_LABEL,
      registration.REGISTRATION_SUBMIT_CTA_LABEL,
      profile.PROFILE_GO_TO_LOGIN_CTA_LABEL,
      profilePrompt.PROFILE_COMPLETION_PROMPT_CTA_LABEL,
      preVote.PRE_VOTE_HINT_LINKS.login.label,
      preVote.PRE_VOTE_HINT_LINKS.profile.label,
      votePage.VOTE_RESULT_CTA_LABEL,
      resultPage.RESULTS_VOTE_CTA_LABEL,
      resultPage.RESULTS_MY_POLLS_CTA_LABEL,
      explore.EXPLORE_VOTE_CTA_LABEL,
      myPolls.MY_POLLS_LOGIN_CTA_LABEL,
      createPoll.CREATE_POLL_DEMO_VOTE_CTA_LABEL,
      creatorFlow.CREATOR_FLOW_RESULTS_CTA_LABEL,
      lifecycle.LIFECYCLE_CREATOR_RESULTS_CTA_LABEL,
      publicUi.PUBLIC_CTA_OPEN_VOTE_PAGE_LABEL,
      publicUi.PUBLIC_CTA_COPY_VOTE_LINK_LABEL,
    ];

    for (const label of mappedLabels) {
      expect(publicUi.PUBLIC_CTA_LINK_LABELS).toContain(label);
    }
  });

  it('keeps auth CTA labels without session or user internal values', async () => {
    const authCopy = await loadModule('public/frontend/auth-state-copy.js');
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');

    expect(authCopy.AUTH_STATE_COPY.guestPrimaryCta).toBe(publicUi.PUBLIC_CTA_REGISTER_LABEL);
    expect(authCopy.AUTH_STATE_COPY.guestSecondaryCta).toBe(publicUi.PUBLIC_CTA_SIGN_IN_LABEL);
    expect(authCopy.AUTH_STATE_COPY.guestPrimaryCtaAriaLabel).not.toMatch(
      FORBIDDEN_INTERNAL_COPY,
    );
    expect(authCopy.AUTH_STATE_COPY.guestSecondaryCtaAriaLabel).not.toMatch(
      FORBIDDEN_INTERNAL_COPY,
    );
  });

  it('keeps profile CTA labels without raw profile payload echo', async () => {
    const profile = await loadModule('public/frontend/profile-page.js');
    const profilePrompt = await loadModule('public/frontend/profile-completion-prompt.js');

    expect(profile.PROFILE_GO_TO_PROFILE_CTA_LABEL).not.toContain('birth_year_month');
    expect(profile.PROFILE_GO_TO_PROFILE_CTA_LABEL).not.toContain('residential_region');
    expect(profilePrompt.PROFILE_COMPLETION_PROMPT_CTA_LABEL).toBe(
      profile.PROFILE_GO_TO_PROFILE_CTA_LABEL,
    );
    expect(profilePrompt.PROFILE_COMPLETION_PROMPT_CTA_LABEL).not.toMatch(
      FORBIDDEN_INTERNAL_COPY,
    );
  });

  it('keeps vote CTA labels neutral without option, eligibility, result, token, or shard', async () => {
    const votePage = await loadModule('public/frontend/vote-page.js');
    const preVote = await loadModule('public/frontend/official-vote-pre-vote-hints.js');

    expect(votePage.VOTE_RESULT_CTA_LABEL).toBe('查看公開結果頁');
    expect(votePage.VOTE_RESULT_CTA_LABEL).not.toMatch(
      /option|eligibility|shard|token|票數|百分比/i,
    );
    expect(preVote.PRE_VOTE_HINT_LINKS.login.label).not.toMatch(FORBIDDEN_OUTCOME_COPY);

    const source = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/vote-page.js'), 'utf8'),
    );
    expect(source).toContain('VOTE_RESULT_CTA_LABEL');
    expect(source).toContain('vote-by-index');
    expect(source).not.toMatch(/option_id\s*:/);
  });

  it('keeps results CTA labels free of aggregate preview or result leakage', async () => {
    const resultPage = await loadModule('public/frontend/result-page.js');

    for (const label of [
      resultPage.RESULTS_VOTE_CTA_LABEL,
      resultPage.RESULTS_MY_POLLS_CTA_LABEL,
    ]) {
      expect(label).not.toMatch(/raw_count|\d+%|第\s*\d+\s*名|option_id/i);
      expect(label).not.toMatch(FORBIDDEN_INTERNAL_COPY);
    }
  });

  it('keeps create poll and lifecycle CTAs without creator token or internal id', async () => {
    const createPoll = await loadModule('public/frontend/create-poll-page.js');
    const creatorFlow = await loadModule('public/frontend/creator-flow-copy.js');
    const lifecycle = await loadModule('public/frontend/poll-lifecycle-controls.js');

    for (const label of [
      createPoll.CREATE_POLL_DEMO_VOTE_CTA_LABEL,
      createPoll.CREATE_POLL_DEMO_MY_POLLS_CTA_LABEL,
      creatorFlow.CREATOR_FLOW_RESULTS_CTA_LABEL,
      lifecycle.LIFECYCLE_CREATOR_RESULTS_CTA_LABEL,
    ]) {
      expect(label).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(label).not.toMatch(/creator_session|poll_id/i);
    }
  });

  it('keeps my-polls CTAs without user_id, session id, or token', async () => {
    const myPolls = await loadModule('public/frontend/my-polls-page.js');

    for (const label of [
      myPolls.MY_POLLS_LOGIN_CTA_LABEL,
      myPolls.MY_POLLS_CREATE_POLL_CTA_LABEL,
      myPolls.MY_POLLS_VOTE_CTA_LABEL,
    ]) {
      expect(label).not.toMatch(FORBIDDEN_INTERNAL_COPY);
    }
  });

  it('keeps registration CTA off auto-login, Set-Cookie, and GET /users/me', async () => {
    const registration = await loadModule('public/frontend/registration-page.js');
    const fetchCalls: string[] = [];
    const fetchImpl = vi.fn(async (url: string) => {
      fetchCalls.push(String(url));
      return { status: 201 };
    });

    await registration.submitRegistrationRequest({
      profile: {
        display_name: 'CTA Polish User',
        birth_year_month: '1998-07',
        residential_region: 'TW-TPE',
      },
      credential: 'proof',
      fetchImpl,
    });

    expect(fetchCalls).toEqual(['/registration']);

    const source = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/registration-page.js'), 'utf8'),
    );
    expect(source).not.toMatch(/mountLoginStateRead|\/users\/me|Set-Cookie|document\.cookie/i);
  });

  it('keeps vote-by-index body unchanged with only option_index', async () => {
    const votePage = await loadModule('public/frontend/vote-page.js');
    const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => ({
      ok: true,
      status: 201,
      json: async () => ({ vote_token: 'secret', option_id: 'secret' }),
    }));

    await votePage.submitVoteByIndex({
      pollId: '11111111-1111-4111-8111-111111111111',
      optionIndex: 0,
      userId: '44444444-4444-4444-8444-444444444444',
      fetchImpl,
    });

    const body = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body));
    expect(body).toEqual({ option_index: 0 });
  });

  it('does not add observability hooks to reviewed CTA surfaces', async () => {
    for (const relativePath of PUBLIC_CTA_SURFACES) {
      const source = stripJsComments(
        await readFile(join(process.cwd(), relativePath), 'utf8'),
      );
      expect(source, relativePath).not.toMatch(FORBIDDEN_OBSERVABILITY);
    }
  });

  for (const relativePath of PUBLIC_CTA_SURFACES) {
    it(`keeps reviewed CTA/link label copy neutral in ${relativePath}`, async () => {
      const raw = await readFile(join(process.cwd(), relativePath), 'utf8');
      const source = stripJsComments(raw);

      if (
        relativePath !== 'public/frontend/poll-lifecycle-controls.js' &&
        relativePath !== 'public/frontend/public-mvp-ui.js' &&
        relativePath !== 'public/frontend/auth-state-copy.js'
      ) {
        expect(source, relativePath).not.toMatch(FORBIDDEN_BACKEND_ECHO);
      }
      if (
        relativePath !== 'public/frontend/official-vote-pre-vote-hints.js' &&
        relativePath !== 'public/frontend/creator-flow-copy.js'
      ) {
        expect(source, relativePath).not.toMatch(FORBIDDEN_OUTCOME_COPY);
      }
    });
  }
});
