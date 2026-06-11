import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const REVIEWED_UNAVAILABLE_SURFACES = [
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

const FOREIGN_BACKEND_TEXT =
  'backend INTERNAL stack trace option_id vote_token shard_id session_id';

const FORBIDDEN_OUTCOME_COPY =
  /你符合資格|你不符合資格|已投過票|可以投票|一定能投票|can_vote|age_passed|region_passed/i;

const FORBIDDEN_INTERNAL_COPY =
  /option_id|vote_token|token_sha256|shard_id|session_id|www_session|\buser_id\b|raw_count|poll_option_vote_counters|creator_token/i;

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

describe('Phase 142 public disabled / unavailable action runtime review checkpoint', () => {
  it('keeps PUBLIC_UNAVAILABLE_USER_MESSAGES on fixed frontend safe copy only', async () => {
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
      expect(message).not.toContain(FOREIGN_BACKEND_TEXT);
    }
  });

  it('maps reviewed surface unavailable constants into PUBLIC_UNAVAILABLE_USER_MESSAGES', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const resultPage = await loadModule('public/frontend/result-page.js');
    const explore = await loadModule('public/frontend/explore-page.js');
    const myPolls = await loadModule('public/frontend/my-polls-page.js');
    const profile = await loadModule('public/frontend/profile-page.js');
    const lifecycle = await loadModule('public/frontend/poll-lifecycle-controls.js');
    const createPoll = await loadModule('public/frontend/create-poll-page.js');
    const authCopy = await loadModule('public/frontend/auth-state-copy.js');
    const preVote = await loadModule('public/frontend/official-vote-pre-vote-hints.js');

    const mappedMessages = [
      publicUi.PUBLIC_VOTE_POLL_UNAVAILABLE_MESSAGE,
      resultPage.RESULTS_COLLECTING_TITLE,
      explore.EXPLORE_LOAD_MORE_FAILURE_MESSAGE,
      myPolls.MY_POLLS_SIGN_IN_REQUIRED_MESSAGE,
      profile.PROFILE_UNAUTHENTICATED_MESSAGE,
      lifecycle.LIFECYCLE_USER_ERROR_MESSAGES[3],
      createPoll.CREATE_POLL_DEMO_SUBMIT_LABEL,
      authCopy.AUTH_STATE_COPY.guestChipAriaLabel,
      preVote.PRE_VOTE_HINT_COPY.anonymous,
    ];

    for (const message of mappedMessages) {
      expect(publicUi.PUBLIC_UNAVAILABLE_USER_MESSAGES).toContain(message);
      expect(message).not.toContain(FOREIGN_BACKEND_TEXT);
    }
  });

  it('keeps vote blocked / unavailable neutral without option, eligibility, result, token, or shard', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const votePage = await loadModule('public/frontend/vote-page.js');

    const blocked = publicUi.messageForPollVotingBlocked({
      public_lifecycle_state: 'cancelled',
    });
    expect(blocked).toBe(publicUi.PUBLIC_VOTE_POLL_UNAVAILABLE_MESSAGE);
    expect(blocked).not.toMatch(/option|eligibility|shard|token|票數|百分比/i);
    expect(blocked).not.toMatch(FORBIDDEN_OUTCOME_COPY);

    const source = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/vote-page.js'), 'utf8'),
    );
    expect(source).toContain('PUBLIC_VOTE_ROUTE_UNAVAILABLE_TITLE');
    expect(source).toContain('submitButton.disabled = true');
    expect(source).toContain('vote-by-index');
    expect(source).toContain('option_index: optionIndex');
    expect(source).not.toMatch(/option_id\s*:/);
  });

  it('keeps vote-by-index body unchanged and does not pre-resolve option index to option_id', async () => {
    const votePage = await loadModule('public/frontend/vote-page.js');
    const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => ({
      ok: true,
      status: 201,
      json: async () => ({
        vote_token: 'secret-token',
        option_id: 'secret-option',
        shard_id: 7,
        message: FOREIGN_BACKEND_TEXT,
      }),
    }));

    const response = await votePage.submitVoteByIndex({
      pollId: '11111111-1111-4111-8111-111111111111',
      optionIndex: 1,
      userId: '44444444-4444-4444-8444-444444444444',
      fetchImpl,
    });

    expect(response.ok).toBe(true);
    const body = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body));
    expect(body).toEqual({ option_index: 1 });
    expect(body).not.toHaveProperty('option_id');
  });

  it('keeps Official Vote transaction order unchanged in backend source', async () => {
    const repository = await readFile(
      join(process.cwd(), 'src/polls/repository.ts'),
      'utf8',
    );
    const transactionStart = repository.indexOf('async function castOfficialVote(');
    const transactionEnd = repository.indexOf('async function resolveOfficialVoteOptionIdWithClient');
    const transactionBody = repository.slice(transactionStart, transactionEnd);
    const eligibilityCheck = transactionBody.indexOf('isProfileEligibleForOfficialVote');
    const optionResolution = transactionBody.indexOf('resolveOfficialVoteOptionIdWithClient');
    const tokenWrite = transactionBody.indexOf('insertVoteToken');
    const counterIncrement = transactionBody.indexOf('incrementVoteCounter');

    expect(eligibilityCheck).toBeGreaterThan(-1);
    expect(optionResolution).toBeGreaterThan(eligibilityCheck);
    expect(tokenWrite).toBeGreaterThan(optionResolution);
    expect(counterIncrement).toBeGreaterThan(tokenWrite);
  });

  it('keeps results collecting / cancelled / unpublished free of aggregate preview', async () => {
    const resultPage = await loadModule('public/frontend/result-page.js');
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');

    expect(resultPage.RESULTS_COLLECTING_SUMMARY).toContain('不顯示');
    expect(resultPage.RESULTS_COLLECTING_SUMMARY).not.toMatch(/raw_count|\d+%|第\s*\d+\s*名/i);
    expect(resultPage.resolveUnavailableUserMessage({ public_lifecycle_state: 'cancelled' })).toBe(
      resultPage.RESULTS_CANCELLED_MESSAGE,
    );
    expect(resultPage.resolveUnavailableUserMessage({ public_lifecycle_state: 'unpublished' })).toBe(
      resultPage.RESULTS_UNPUBLISHED_MESSAGE,
    );

    const source = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/result-page.js'), 'utf8'),
    );
    expect(source).toContain("new Set(['revealed', 'locked', 'post_lock'])");
    expect(source).toContain("return 'aggregate'");
    expect(publicUi.PUBLIC_UNAVAILABLE_USER_MESSAGES).toContain(
      publicUi.PUBLIC_RESULTS_UNAVAILABLE_AGGREGATE_SUMMARY,
    );
  });

  it('allows display-safe aggregate mode only for revealed / locked / post_lock', async () => {
    const resultPage = await loadModule('public/frontend/result-page.js');

    for (const state of ['revealed', 'locked', 'post_lock'] as const) {
      expect(
        resultPage.resolveResultRenderMode({ public_lifecycle_state: state }),
      ).toBe('aggregate');
    }
    expect(
      resultPage.resolveResultRenderMode({ public_lifecycle_state: 'collecting' }),
    ).toBe('collecting');
    for (const state of ['cancelled', 'unpublished'] as const) {
      expect(
        resultPage.resolveResultRenderMode({ public_lifecycle_state: state }),
      ).toBe('unavailable');
    }
  });

  it('keeps lifecycle unavailable copy without creator token, session id, or internal id', async () => {
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

  it('keeps profile unavailable on fixed copy without raw profile field echo', async () => {
    const profile = await loadModule('public/frontend/profile-page.js');
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');

    expect(profile.PROFILE_UNAUTHENTICATED_MESSAGE).toBe(
      publicUi.PUBLIC_PROFILE_VIEW_SIGN_IN_REQUIRED_MESSAGE,
    );
    expect(profile.PROFILE_UNAUTHENTICATED_EDIT_MESSAGE).toBe(
      publicUi.PUBLIC_PROFILE_EDIT_SIGN_IN_REQUIRED_MESSAGE,
    );
    expect(profile.PROFILE_UNAUTHENTICATED_MESSAGE).not.toContain('birth_year_month');
    expect(profile.PROFILE_UNAUTHENTICATED_MESSAGE).not.toContain('residential_region');
    expect(profile.PROFILE_UNAUTHENTICATED_MESSAGE).not.toMatch(FORBIDDEN_INTERNAL_COPY);
  });

  it('keeps my-polls and auth CTA unavailable without user_id, session id, or token', async () => {
    const myPolls = await loadModule('public/frontend/my-polls-page.js');
    const authCopy = await loadModule('public/frontend/auth-state-copy.js');

    expect(myPolls.MY_POLLS_SIGN_IN_REQUIRED_MESSAGE).not.toMatch(FORBIDDEN_INTERNAL_COPY);
    expect(authCopy.AUTH_STATE_COPY.guestChipAriaLabel).not.toMatch(FORBIDDEN_INTERNAL_COPY);
  });

  it('keeps create poll demo unavailable label fixed without backend payload echo', async () => {
    const createPoll = await loadModule('public/frontend/create-poll-page.js');
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const source = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/create-poll-page.js'), 'utf8'),
    );

    expect(createPoll.CREATE_POLL_DEMO_SUBMIT_LABEL).toBe(
      publicUi.PUBLIC_CREATE_POLL_DEMO_SUBMIT_LABEL,
    );
    expect(createPoll.CREATE_POLL_DEMO_SUBMIT_LABEL).not.toMatch(FORBIDDEN_INTERNAL_COPY);
    expect(source).toContain('CREATE_POLL_DEMO_SUBMIT_LABEL');
    expect(source).not.toMatch(/textContent\s*=\s*body\./);
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
        display_name: 'Checkpoint User',
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

  it('does not add observability hooks to reviewed unavailable surfaces', async () => {
    for (const relativePath of REVIEWED_UNAVAILABLE_SURFACES) {
      const source = stripJsComments(
        await readFile(join(process.cwd(), relativePath), 'utf8'),
      );
      expect(source, relativePath).not.toMatch(FORBIDDEN_OBSERVABILITY);
    }
  });

  for (const relativePath of REVIEWED_UNAVAILABLE_SURFACES) {
    it(`keeps reviewed disabled/unavailable runtime neutral in ${relativePath}`, async () => {
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
