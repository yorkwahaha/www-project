import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PUBLIC_HINT_SURFACES = [
  'public/frontend/public-mvp-ui.js',
  'public/frontend/login-page.js',
  'public/frontend/registration-page.js',
  'public/frontend/profile-completion-prompt.js',
  'public/frontend/official-vote-pre-vote-hints.js',
  'public/frontend/explore-page.js',
  'public/frontend/result-page.js',
  'public/frontend/creator-flow-copy.js',
  'public/frontend/create-poll-page.js',
  'public/frontend/vote-page.js',
  'public/frontend/public-mvp-demo.js',
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

describe('Phase 149 public help / hint text consistency polish', () => {
  it('exports frontend-owned PUBLIC_HINT_TEXT_MESSAGES allowlist with safe fixed copy', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');

    expect(publicUi.PUBLIC_HINT_TEXT_MESSAGES.length).toBeGreaterThanOrEqual(20);
    expect(publicUi.PUBLIC_LOGIN_FORM_READY_HINT).toContain('production credential proof');
    expect(publicUi.PUBLIC_REGISTRATION_READY_HINT).toContain('註冊完成後仍須前往登入');
    expect(publicUi.PUBLIC_PROFILE_COMPLETION_PROMPT_HINT).toContain('不代表你一定符合或不符合');

    for (const message of publicUi.PUBLIC_HINT_TEXT_MESSAGES) {
      expect(typeof message).toBe('string');
      expect(message.length).toBeGreaterThan(0);
      expect(message).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(message).not.toMatch(FORBIDDEN_OUTCOME_COPY);
      expect(message).not.toMatch(/\d+%|第\s*\d+\s*名|raw_count/i);
    }
  });

  it('maps login and registration helper hints into PUBLIC_HINT_TEXT_MESSAGES', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const login = await loadModule('public/frontend/login-page.js');
    const registration = await loadModule('public/frontend/registration-page.js');

    expect(login.LOGIN_FORM_READY_MESSAGE).toBe(publicUi.PUBLIC_LOGIN_FORM_READY_HINT);
    expect(login.LOGIN_SHELL_DEMO_HINT_MESSAGE).toBe(publicUi.PUBLIC_LOGIN_SHELL_DEMO_HINT);
    expect(registration.REGISTRATION_READY_MESSAGE).toBe(
      publicUi.PUBLIC_REGISTRATION_READY_HINT,
    );
    expect(publicUi.PUBLIC_HINT_TEXT_MESSAGES).toContain(
      publicUi.PUBLIC_LOGIN_FORM_READY_HINT,
    );
    expect(publicUi.PUBLIC_HINT_TEXT_MESSAGES).toContain(
      publicUi.PUBLIC_REGISTRATION_READY_HINT,
    );
  });

  it('maps profile prompt and pre-vote hints into PUBLIC_HINT_TEXT_MESSAGES', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const profilePrompt = await loadModule('public/frontend/profile-completion-prompt.js');
    const preVote = await loadModule('public/frontend/official-vote-pre-vote-hints.js');

    expect(profilePrompt.PROFILE_COMPLETION_PROMPT_MESSAGE).toBe(
      publicUi.PUBLIC_PROFILE_COMPLETION_PROMPT_HINT,
    );
    expect(preVote.PRE_VOTE_HINT_COPY.anonymous).toBe(
      publicUi.PUBLIC_VOTE_PRE_VOTE_ANONYMOUS_HINT,
    );
    expect(preVote.PRE_VOTE_HINT_COPY.incompleteProfile).toBe(
      publicUi.PUBLIC_VOTE_PRE_VOTE_INCOMPLETE_PROFILE_HINT,
    );
    expect(publicUi.PUBLIC_HINT_TEXT_MESSAGES).toContain(
      publicUi.PUBLIC_VOTE_PRE_VOTE_NEUTRAL_SUBMIT_HINT,
    );
  });

  it('maps explore, results intro, and creator flow hints into PUBLIC_HINT_TEXT_MESSAGES', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const explore = await loadModule('public/frontend/explore-page.js');
    const resultPage = await loadModule('public/frontend/result-page.js');
    const creatorFlow = await loadModule('public/frontend/creator-flow-copy.js');

    expect(explore.EXPLORE_FEED_LIST_SUMMARY).toBe(
      publicUi.PUBLIC_EXPLORE_FEED_LIST_SUMMARY_HINT,
    );
    expect(resultPage.RESULTS_INTRO_LEAD_HINT).toBe(
      publicUi.PUBLIC_RESULTS_INTRO_LEAD_HINT,
    );
    expect(creatorFlow.CREATOR_FLOW_COPY.myPollsLead).toBe(
      publicUi.PUBLIC_CREATOR_MY_POLLS_LEAD_HINT,
    );
    expect(creatorFlow.CREATOR_FLOW_COPY.actionClose).toBe(
      publicUi.PUBLIC_CREATOR_ACTION_CLOSE_HINT,
    );
    expect(publicUi.PUBLIC_HINT_TEXT_MESSAGES).toContain(
      publicUi.PUBLIC_RESULTS_INTRO_VOTE_HINT,
    );
    expect(publicUi.PUBLIC_HINT_TEXT_MESSAGES).toContain(
      publicUi.PUBLIC_CREATOR_LIFECYCLE_COLLECTING_LEAD_HINT,
    );
  });

  it('keeps hint copy free of vote counts, eligibility outcomes, and internal identifiers', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');

    expect(publicUi.PUBLIC_VOTE_PRE_VOTE_ANONYMOUS_HINT).not.toMatch(
      /option|shard|token|user_id|session_id/i,
    );
    expect(publicUi.PUBLIC_RESULTS_INTRO_SCOPE_HINT).toContain('區間化摘要');
    expect(publicUi.PUBLIC_RESULTS_INTRO_SCOPE_HINT).not.toMatch(/raw_count|\d+%/i);
    expect(publicUi.PUBLIC_CREATOR_VOTE_URL_HINT_PREFIX).not.toMatch(
      FORBIDDEN_INTERNAL_COPY,
    );
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

  it('keeps registration boundary off auto-login, Set-Cookie, and GET /users/me', async () => {
    const registration = await loadModule('public/frontend/registration-page.js');
    const fetchCalls: string[] = [];
    const fetchImpl = vi.fn(async (url: string) => {
      fetchCalls.push(String(url));
      return { status: 201 };
    });

    await registration.submitRegistrationRequest({
      profile: {
        display_name: 'Hint Polish User',
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

  it('does not add observability hooks to reviewed hint surfaces', async () => {
    for (const relativePath of PUBLIC_HINT_SURFACES) {
      const source = stripJsComments(
        await readFile(join(process.cwd(), relativePath), 'utf8'),
      );
      expect(source, relativePath).not.toMatch(FORBIDDEN_OBSERVABILITY);
    }
  });

  for (const relativePath of PUBLIC_HINT_SURFACES) {
    it(`keeps reviewed help / hint copy neutral in ${relativePath}`, async () => {
      const raw = await readFile(join(process.cwd(), relativePath), 'utf8');
      const source = stripJsComments(raw);

      if (
        relativePath !== 'public/frontend/public-mvp-ui.js' &&
        relativePath !== 'public/frontend/official-vote-pre-vote-hints.js'
      ) {
        expect(source, relativePath).not.toMatch(FORBIDDEN_BACKEND_ECHO);
      }
      if (relativePath !== 'public/frontend/creator-flow-copy.js') {
        expect(source, relativePath).not.toMatch(FORBIDDEN_OUTCOME_COPY);
      }
    });
  }
});
