import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const REVIEWED_STATUS_SURFACES = [
  'public/frontend/public-mvp-ui.js',
  'public/frontend/auth-state-copy.js',
  'public/frontend/login-state-ui.js',
  'public/frontend/vote-page.js',
  'public/frontend/result-page.js',
  'public/frontend/explore-page.js',
  'public/frontend/my-polls-page.js',
  'public/frontend/create-poll-page.js',
  'public/frontend/profile-completion-prompt.js',
  'public/frontend/poll-lifecycle-controls.js',
  'public/frontend/public-mvp-demo.js',
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

describe('Phase 146 public status badge / state label runtime review checkpoint', () => {
  it('keeps PUBLIC_STATUS_LABELS and PUBLIC_*_STATUS_* on fixed frontend safe copy only', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');

    expect(publicUi.PUBLIC_STATUS_LABELS.length).toBeGreaterThan(25);
    expect(publicUi.PUBLIC_AUTH_GUEST_CHIP_STATUS_LABEL).toBe('未登入');
    expect(publicUi.PUBLIC_POLL_LIFECYCLE_COLLECTING_STATUS_LABEL).toBe('收集中');
    expect(publicUi.PUBLIC_INCOMPLETE_USER_DATA_STATUS_LABEL).toBe('資料未完成');

    for (const label of publicUi.PUBLIC_STATUS_LABELS) {
      expect(typeof label).toBe('string');
      expect(label.length).toBeGreaterThan(0);
      expect(label).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(label).not.toMatch(FORBIDDEN_OUTCOME_COPY);
      expect(label).not.toMatch(/\d+%|第\s*\d+\s*名|raw_count/i);
      expect(label).not.toContain(FOREIGN_BACKEND_TEXT);
    }
  });

  it('keeps formatPublicPollLifecycleStatusLabel on allowlist labels or draft fallback only', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const allowlist = new Set(Object.values(publicUi.PUBLIC_POLL_LIFECYCLE_STATUS_LABELS));

    for (const state of [
      'draft',
      'collecting',
      'revealed',
      'locked',
      'post_lock',
      'cancelled',
      'unpublished',
    ] as const) {
      const label = publicUi.formatPublicPollLifecycleStatusLabel(state);
      expect(allowlist.has(label)).toBe(true);
      expect(label).not.toContain(FOREIGN_BACKEND_TEXT);
    }

    expect(publicUi.formatPublicPollLifecycleStatusLabel('unknown_state')).toBe(
      publicUi.PUBLIC_POLL_LIFECYCLE_DRAFT_STATUS_LABEL,
    );
    expect(publicUi.formatPublicPollLifecycleStatusLabel(null)).toBe(
      publicUi.PUBLIC_POLL_LIFECYCLE_DRAFT_STATUS_LABEL,
    );
  });

  it('maps reviewed surface status constants into PUBLIC_STATUS_LABELS', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const authCopy = await loadModule('public/frontend/auth-state-copy.js');
    const loginState = await loadModule('public/frontend/login-state-ui.js');
    const votePage = await loadModule('public/frontend/vote-page.js');
    const resultPage = await loadModule('public/frontend/result-page.js');
    const explore = await loadModule('public/frontend/explore-page.js');
    const createPoll = await loadModule('public/frontend/create-poll-page.js');
    const profilePrompt = await loadModule('public/frontend/profile-completion-prompt.js');
    const demo = await loadModule('public/frontend/public-mvp-demo.js');

    const mappedLabels = [
      authCopy.AUTH_STATE_COPY.guestChipLabel,
      authCopy.AUTH_STATE_COPY.demoIdentityChipLabel,
      votePage.VOTE_SUCCESS_STATUS_MESSAGE,
      resultPage.RESULTS_COLLECTING_TITLE,
      explore.EXPLORE_COLLECTING_STATUS_LABEL,
      createPoll.CREATE_POLL_LIVE_SUBMIT_STATUS_LABEL,
      profilePrompt.PROFILE_COMPLETION_INCOMPLETE_STATUS_LABEL,
      ...demo.RESULT_UI_STATE_PREVIEW_LINKS.map((item: { label: string }) => item.label),
    ];

    for (const label of mappedLabels) {
      expect(publicUi.PUBLIC_STATUS_LABELS).toContain(label);
      expect(label).not.toContain(FOREIGN_BACKEND_TEXT);
    }

    expect(loginState.LOGIN_LOGOUT_PENDING_MESSAGE).not.toMatch(FORBIDDEN_INTERNAL_COPY);
    expect(publicUi.PUBLIC_STATUS_LABELS).toContain(
      publicUi.PUBLIC_AUTH_SIGNED_IN_STATUS_ARIA_PREFIX,
    );
    expect(publicUi.PUBLIC_STATUS_LABELS).toContain(
      publicUi.PUBLIC_AUTH_LOGOUT_STATUS_LABEL,
    );
  });

  it('keeps auth/login state chip labels without user_id, session id, token, or raw auth payload', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const authCopy = await loadModule('public/frontend/auth-state-copy.js');

    expect(authCopy.AUTH_STATE_COPY.guestChipLabel).toBe(
      publicUi.PUBLIC_AUTH_GUEST_CHIP_STATUS_LABEL,
    );
    expect(authCopy.AUTH_STATE_COPY.demoIdentityChipLabel).toBe(
      publicUi.PUBLIC_AUTH_DEMO_IDENTITY_CHIP_STATUS_LABEL,
    );
    expect(authCopy.AUTH_STATE_COPY.guestChipLabel).not.toMatch(FORBIDDEN_INTERNAL_COPY);
    expect(authCopy.AUTH_STATE_COPY.guestChipAriaLabel).not.toMatch(
      FORBIDDEN_INTERNAL_COPY,
    );
  });

  it('keeps profile prompt/status labels without raw profile field echo', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const profilePrompt = await loadModule('public/frontend/profile-completion-prompt.js');

    expect(profilePrompt.PROFILE_COMPLETION_INCOMPLETE_STATUS_LABEL).toBe(
      publicUi.PUBLIC_INCOMPLETE_USER_DATA_STATUS_LABEL,
    );
    expect(profilePrompt.PROFILE_COMPLETION_INCOMPLETE_STATUS_LABEL).not.toContain(
      'birth_year_month',
    );
    expect(profilePrompt.PROFILE_COMPLETION_INCOMPLETE_STATUS_LABEL).not.toContain(
      'residential_region',
    );
    expect(profilePrompt.PROFILE_COMPLETION_INCOMPLETE_STATUS_LABEL).not.toMatch(
      FORBIDDEN_INTERNAL_COPY,
    );
  });

  it('keeps vote status/success aria neutral without option, eligibility, result, token, or shard', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const votePage = await loadModule('public/frontend/vote-page.js');

    expect(votePage.VOTE_SUCCESS_STATUS_MESSAGE).toBe(
      publicUi.PUBLIC_VOTE_SUCCESS_STATUS_MESSAGE,
    );
    expect(publicUi.PUBLIC_VOTE_SUCCESS_PANEL_ARIA_LABEL).not.toMatch(
      /option|eligibility|shard|token|票數|百分比/i,
    );

    const source = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/vote-page.js'), 'utf8'),
    );
    expect(source).toContain('PUBLIC_VOTE_SUCCESS_PANEL_ARIA_LABEL');
    expect(source).toContain('vote-by-index');
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

  it('keeps results collecting/cancelled/unpublished/unavailable status free of aggregate preview', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const resultPage = await loadModule('public/frontend/result-page.js');

    expect(resultPage.RESULTS_COLLECTING_TITLE).toBe(
      publicUi.PUBLIC_RESULTS_COLLECTING_TITLE,
    );
    expect(resultPage.RESULTS_COLLECTING_SUMMARY).toContain('不顯示');
    expect(resultPage.RESULTS_COLLECTING_SUMMARY).not.toMatch(/raw_count|\d+%|第\s*\d+\s*名/i);
    expect(resultPage.resolveUnavailableUserMessage({ public_lifecycle_state: 'cancelled' })).toBe(
      resultPage.RESULTS_CANCELLED_MESSAGE,
    );
    expect(resultPage.resolveUnavailableUserMessage({ public_lifecycle_state: 'unpublished' })).toBe(
      resultPage.RESULTS_UNPUBLISHED_MESSAGE,
    );
    expect(publicUi.PUBLIC_RESULTS_NOT_YET_VISIBLE_STATUS_LABEL).toBe('尚不可查看結果');
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

  it('keeps explore, my-polls, create-poll, lifecycle, and demo status labels without creator token or internal id', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const explore = await loadModule('public/frontend/explore-page.js');
    const myPolls = await loadModule('public/frontend/my-polls-page.js');
    const createPoll = await loadModule('public/frontend/create-poll-page.js');
    const lifecycle = await loadModule('public/frontend/poll-lifecycle-controls.js');
    const demo = await loadModule('public/frontend/public-mvp-demo.js');

    expect(explore.EXPLORE_COLLECTING_STATUS_HINT).toBe(
      publicUi.PUBLIC_EXPLORE_COLLECTING_STATUS_HINT,
    );
    expect(myPolls.formatMyPollsLifecycleLabel('revealed')).toBe('已公開');
    expect(createPoll.CREATE_POLL_LIVE_SUBMIT_STATUS_LABEL).toBe(
      publicUi.PUBLIC_CREATE_POLL_LIVE_SUBMIT_STATUS_LABEL,
    );
    expect(lifecycle.lifecycleNoteForState('unpublished')).toBe(
      publicUi.PUBLIC_LIFECYCLE_UNPUBLISHED_VISITOR_MESSAGE,
    );
    for (const item of demo.RESULT_UI_STATE_PREVIEW_LINKS) {
      expect(item.label).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(item.label).not.toMatch(/creator_session|poll_id/i);
    }
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

  it('does not add observability hooks to reviewed status surfaces', async () => {
    for (const relativePath of REVIEWED_STATUS_SURFACES) {
      const source = stripJsComments(
        await readFile(join(process.cwd(), relativePath), 'utf8'),
      );
      expect(source, relativePath).not.toMatch(FORBIDDEN_OBSERVABILITY);
    }
  });

  for (const relativePath of REVIEWED_STATUS_SURFACES) {
    it(`keeps reviewed status badge / state label runtime neutral in ${relativePath}`, async () => {
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
