import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PUBLIC_UNAVAILABLE_SURFACES = [
  'public/frontend/public-mvp-ui.js',
  'public/frontend/vote-page.js',
  'public/frontend/result-page.js',
  'public/frontend/explore-page.js',
  'public/frontend/my-polls-page.js',
  'public/frontend/poll-lifecycle-controls.js',
  'public/frontend/create-poll-page.js',
  'public/frontend/profile-page.js',
  'public/frontend/auth-state-copy.js',
  'public/frontend/official-vote-pre-vote-hints.js',
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

describe('Phase 141 public disabled / unavailable action copy polish', () => {
  it('exports frontend-owned unavailable allowlist with safe fixed copy', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');

    expect(publicUi.PUBLIC_UNAVAILABLE_USER_MESSAGES.length).toBeGreaterThan(20);
    expect(publicUi.PUBLIC_VOTE_NOT_ACCEPTING_MESSAGE).toBe(
      '此問卷目前不接受投票。',
    );

    for (const message of publicUi.PUBLIC_UNAVAILABLE_USER_MESSAGES) {
      expect(typeof message).toBe('string');
      expect(message.length).toBeGreaterThan(0);
      expect(message).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(message).not.toMatch(FORBIDDEN_OUTCOME_COPY);
    }
  });

  it('maps surface unavailable constants into PUBLIC_UNAVAILABLE_USER_MESSAGES', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const resultPage = await loadModule('public/frontend/result-page.js');
    const explore = await loadModule('public/frontend/explore-page.js');
    const myPolls = await loadModule('public/frontend/my-polls-page.js');
    const profile = await loadModule('public/frontend/profile-page.js');
    const lifecycle = await loadModule('public/frontend/poll-lifecycle-controls.js');
    const createPoll = await loadModule('public/frontend/create-poll-page.js');
    const authCopy = await loadModule('public/frontend/auth-state-copy.js');
    const preVote = await loadModule('public/frontend/official-vote-pre-vote-hints.js');

    expect(publicUi.PUBLIC_UNAVAILABLE_USER_MESSAGES).toContain(
      publicUi.PUBLIC_VOTE_POLL_UNAVAILABLE_MESSAGE,
    );
    expect(publicUi.PUBLIC_UNAVAILABLE_USER_MESSAGES).toContain(
      resultPage.RESULTS_COLLECTING_TITLE,
    );
    expect(publicUi.PUBLIC_UNAVAILABLE_USER_MESSAGES).toContain(
      explore.EXPLORE_LOAD_MORE_FAILURE_MESSAGE,
    );
    expect(publicUi.PUBLIC_UNAVAILABLE_USER_MESSAGES).toContain(
      myPolls.MY_POLLS_SIGN_IN_REQUIRED_MESSAGE,
    );
    expect(publicUi.PUBLIC_UNAVAILABLE_USER_MESSAGES).toContain(
      profile.PROFILE_UNAUTHENTICATED_MESSAGE,
    );
    expect(publicUi.PUBLIC_UNAVAILABLE_USER_MESSAGES).toContain(
      lifecycle.LIFECYCLE_USER_ERROR_MESSAGES[3],
    );
    expect(publicUi.PUBLIC_UNAVAILABLE_USER_MESSAGES).toContain(
      createPoll.CREATE_POLL_DEMO_SUBMIT_LABEL,
    );
    expect(publicUi.PUBLIC_UNAVAILABLE_USER_MESSAGES).toContain(
      authCopy.AUTH_STATE_COPY.guestChipAriaLabel,
    );
    expect(publicUi.PUBLIC_UNAVAILABLE_USER_MESSAGES).toContain(
      preVote.PRE_VOTE_HINT_COPY.anonymous,
    );
  });

  it('keeps vote unavailable copy neutral without option, eligibility, result, token, or shard', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const votePage = await loadModule('public/frontend/vote-page.js');

    const blocked = publicUi.messageForPollVotingBlocked({
      public_lifecycle_state: 'cancelled',
    });
    expect(blocked).toBe(publicUi.PUBLIC_VOTE_POLL_UNAVAILABLE_MESSAGE);
    expect(blocked).not.toMatch(/option|eligibility|shard|token|票數|百分比/i);

    const source = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/vote-page.js'), 'utf8'),
    );
    expect(source).toContain('PUBLIC_VOTE_ROUTE_UNAVAILABLE_TITLE');
    expect(source).toContain('submitButton.disabled = true');
    expect(source).toContain('vote-by-index');
    expect(source).not.toMatch(/option_id\s*:/);

    const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => ({
      ok: true,
      status: 201,
      json: async () => ({ vote_token: 'secret', option_id: 'secret' }),
    }));
    await votePage.submitVoteByIndex({
      pollId: '11111111-1111-4111-8111-111111111111',
      optionIndex: 1,
      userId: '44444444-4444-4444-8444-444444444444',
      fetchImpl,
    });
    const body = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body));
    expect(body).toEqual({ option_index: 1 });
  });

  it('keeps results unavailable copy free of aggregate preview outside display-safe states', async () => {
    const resultPage = await loadModule('public/frontend/result-page.js');
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');

    expect(resultPage.RESULTS_COLLECTING_SUMMARY).toContain('不顯示');
    expect(resultPage.RESULTS_COLLECTING_SUMMARY).not.toMatch(/raw_count|\d+%|第\s*\d+\s*名/i);
    expect(resultPage.resolveUnavailableUserMessage({ public_lifecycle_state: 'cancelled' })).toBe(
      resultPage.RESULTS_CANCELLED_MESSAGE,
    );

    const source = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/result-page.js'), 'utf8'),
    );
    expect(source).toContain('PUBLIC_RESULTS_UNAVAILABLE_AGGREGATE_SUMMARY');
    expect(source).toContain("return 'aggregate'");
    expect(publicUi.PUBLIC_UNAVAILABLE_USER_MESSAGES).toContain(
      publicUi.PUBLIC_RESULTS_UNAVAILABLE_AGGREGATE_SUMMARY,
    );
  });

  it('keeps lifecycle unavailable copy without creator token or internal id', async () => {
    const lifecycle = await loadModule('public/frontend/poll-lifecycle-controls.js');
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');

    expect(
      lifecycle.messageForLifecycleTransitionFailure({
        status: 401,
        errorCode: 'AUTH_REQUIRED',
      }),
    ).toBe(publicUi.PUBLIC_LIFECYCLE_AUTH_REQUIRED_MESSAGE);
    expect(publicUi.PUBLIC_LIFECYCLE_AUTH_REQUIRED_MESSAGE).not.toMatch(
      FORBIDDEN_INTERNAL_COPY,
    );
    expect(publicUi.PUBLIC_LIFECYCLE_AUTH_REQUIRED_MESSAGE).not.toMatch(
      /creator_session|poll_id/i,
    );
  });

  it('keeps create poll demo unavailable label fixed without backend payload echo', async () => {
    const createPoll = await loadModule('public/frontend/create-poll-page.js');
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');

    expect(createPoll.CREATE_POLL_DEMO_SUBMIT_LABEL).toBe(
      publicUi.PUBLIC_CREATE_POLL_DEMO_SUBMIT_LABEL,
    );
    expect(createPoll.CREATE_POLL_DEMO_SUBMIT_LABEL).not.toMatch(FORBIDDEN_INTERNAL_COPY);
  });

  it('keeps auth CTA unavailable copy without session or user internal values', async () => {
    const authCopy = await loadModule('public/frontend/auth-state-copy.js');
    const profile = await loadModule('public/frontend/profile-page.js');

    expect(authCopy.AUTH_STATE_COPY.guestChipAriaLabel).not.toMatch(
      FORBIDDEN_INTERNAL_COPY,
    );
    expect(profile.PROFILE_UNAUTHENTICATED_MESSAGE).not.toMatch(
      FORBIDDEN_INTERNAL_COPY,
    );
    expect(profile.PROFILE_UNAUTHENTICATED_MESSAGE).not.toContain('birth_year_month');
  });

  it('does not add observability hooks to reviewed unavailable surfaces', async () => {
    for (const relativePath of PUBLIC_UNAVAILABLE_SURFACES) {
      const source = stripJsComments(
        await readFile(join(process.cwd(), relativePath), 'utf8'),
      );
      expect(source, relativePath).not.toMatch(FORBIDDEN_OBSERVABILITY);
    }
  });

  for (const relativePath of PUBLIC_UNAVAILABLE_SURFACES) {
    it(`keeps reviewed disabled/unavailable copy neutral in ${relativePath}`, async () => {
      const raw = await readFile(join(process.cwd(), relativePath), 'utf8');
      const source = stripJsComments(raw);

      if (
        relativePath !== 'public/frontend/poll-lifecycle-controls.js' &&
        relativePath !== 'public/frontend/public-mvp-ui.js'
      ) {
        expect(source, relativePath).not.toMatch(FORBIDDEN_BACKEND_ECHO);
      }
      if (
        relativePath !== 'public/frontend/poll-lifecycle-controls.js' &&
        relativePath !== 'public/frontend/result-page.js' &&
        relativePath !== 'public/frontend/official-vote-pre-vote-hints.js'
      ) {
        expect(source, relativePath).not.toMatch(FORBIDDEN_OUTCOME_COPY);
      }
    });
  }
});
