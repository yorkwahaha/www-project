import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_135_CATCH_SURFACES = [
  'public/frontend/vote-page.js',
  'public/frontend/result-page.js',
  'public/frontend/profile-page.js',
  'public/frontend/registration-page.js',
  'public/frontend/create-poll-page.js',
  'public/frontend/poll-lifecycle-controls.js',
];

const REVIEWED_ERROR_SURFACES = [
  'public/frontend/explore-page.js',
  'public/frontend/vote-page.js',
  'public/frontend/result-page.js',
  'public/frontend/my-polls-page.js',
  'public/frontend/login-page.js',
  'public/frontend/login-state-logout.js',
  'public/frontend/registration-page.js',
  'public/frontend/profile-page.js',
  'public/frontend/profile-completion-prompt.js',
  'public/frontend/poll-lifecycle-controls.js',
  'public/frontend/create-poll-page.js',
  'public/frontend/public-mvp-ui.js',
];

const FORBIDDEN_OUTCOME_COPY =
  /你投過|你尚未投票|你符合資格|你不符合資格|已投過票|選擇了|投給哪個|can_vote|age_passed|region_passed|trust_passed|role_passed/i;

const FORBIDDEN_INTERNAL_COPY =
  /option_id|vote_token|token_sha256|shard_id|session_id|www_session|\buser_id\b|raw_count|poll_option_vote_counters/i;

const FOREIGN_ERROR_TEXT =
  'backend INTERNAL stack trace option_id vote_token shard_id';

function stripJsComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 136 public error copy runtime review checkpoint', () => {
  it('keeps resolvePublicErrorUserMessage on allowlist copy or fallback only', async () => {
    const {
      resolvePublicErrorUserMessage,
      VOTE_PAGE_LOAD_FAILURE,
      PUBLIC_POLL_LOAD_USER_MESSAGES,
    } = await loadModule('public/frontend/public-mvp-ui.js');

    expect(
      resolvePublicErrorUserMessage(
        new Error(FOREIGN_ERROR_TEXT),
        VOTE_PAGE_LOAD_FAILURE,
        PUBLIC_POLL_LOAD_USER_MESSAGES,
      ),
    ).toBe(VOTE_PAGE_LOAD_FAILURE);

    expect(
      resolvePublicErrorUserMessage(
        new Error(VOTE_PAGE_LOAD_FAILURE),
        'fallback-only',
        PUBLIC_POLL_LOAD_USER_MESSAGES,
      ),
    ).toBe(VOTE_PAGE_LOAD_FAILURE);

    expect(
      resolvePublicErrorUserMessage(
        'not-an-error',
        VOTE_PAGE_LOAD_FAILURE,
        PUBLIC_POLL_LOAD_USER_MESSAGES,
      ),
    ).toBe(VOTE_PAGE_LOAD_FAILURE);
  });

  it('keeps Phase 135 catch surfaces on resolvePublicErrorUserMessage instead of raw error.message', async () => {
    for (const relativePath of PHASE_135_CATCH_SURFACES) {
      const source = stripJsComments(
        await readFile(join(process.cwd(), relativePath), 'utf8'),
      );
      expect(source, relativePath).toContain('resolvePublicErrorUserMessage');
      expect(source, relativePath).not.toMatch(
        /catch\s*\([^)]*\)\s*\{[^}]*error instanceof Error\s*\?\s*error\.message/s,
      );
    }
  });

  it('keeps /explore feed failures on frontend-owned load and empty copy', async () => {
    const explore = await loadModule('public/frontend/explore-page.js');
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({
        error: 'INTERNAL',
        message: FOREIGN_ERROR_TEXT,
      }),
    });

    await expect(
      explore.fetchExploreFeedPage({
        fetchImpl,
        origin: 'http://127.0.0.1:3000',
      }),
    ).rejects.toThrow(explore.EXPLORE_LOAD_FAILURE_MESSAGE);

    expect(explore.EXPLORE_FEED_EMPTY_MESSAGE).toBe(
      '目前沒有可瀏覽的公開問卷。',
    );
  });

  it('keeps /vote/:id submit failures neutral without backend payload echo', async () => {
    const votePage = await loadModule('public/frontend/vote-page.js');
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const fetchImpl = vi.fn(async () => ({
      ok: false,
      status: 403,
      json: async () => ({
        error: 'POLL_FORBIDDEN',
        message: FOREIGN_ERROR_TEXT,
      }),
    }));

    await expect(
      votePage.submitVoteByIndex({
        pollId: '11111111-1111-4111-8111-111111111111',
        optionIndex: 0,
        userId: '44444444-4444-4444-8444-444444444444',
        fetchImpl,
      }),
    ).rejects.toThrow('目前無法完成這次投票。');

    expect(
      publicUi.messageForPollVotingBlocked({
        public_lifecycle_state: 'cancelled',
      }),
    ).toBe('此問卷目前無法使用。');
  });

  it('keeps /results/:id load and unavailable copy frontend-owned', async () => {
    const resultPage = await loadModule('public/frontend/result-page.js');

    expect(
      resultPage.messageForResultLoadFailure({
        status: 500,
        errorCode: 'INTERNAL',
      }),
    ).toBe(resultPage.RESULTS_LOAD_FAILURE_MESSAGE);

    expect(
      resultPage.resolveUnavailableUserMessage({
        public_lifecycle_state: 'draft',
        user_message: FOREIGN_ERROR_TEXT,
      }),
    ).toBe(resultPage.RESULTS_POLL_UNAVAILABLE_MESSAGE);

    expect(resultPage.RESULT_DISPLAY_REFRESH_FAILURE_MESSAGE).toContain(
      '請重新整理頁面',
    );
  });

  it('distinguishes /my-polls?live=1 list failure from creator session failure', async () => {
    const myPolls = await loadModule('public/frontend/my-polls-page.js');
    const lifecycle = await loadModule('public/frontend/poll-lifecycle-controls.js');

    expect(myPolls.MY_POLLS_LOAD_FAILURE_MESSAGE).not.toBe(
      lifecycle.CREATOR_SESSION_FAILURE,
    );

    const sessionError = lifecycle.creatorSessionFailureError();
    expect(lifecycle.isCreatorSessionFailureError(sessionError)).toBe(true);
    expect(sessionError.message).toBe(lifecycle.CREATOR_SESSION_FAILURE);
    expect(sessionError.message).not.toContain('backend');
  });

  it('keeps auth/profile/login/logout/homepage prompt failures on frontend-owned copy', async () => {
    const login = await loadModule('public/frontend/login-page.js');
    const registration = await loadModule('public/frontend/registration-page.js');
    const profile = await loadModule('public/frontend/profile-page.js');
    const logout = await loadModule('public/frontend/login-state-logout.js');
    const prompt = await loadModule('public/frontend/profile-completion-prompt.js');

    expect(login.messageForLoginFailure('network')).toBe(
      login.LOGIN_FORM_NETWORK_FAILURE_MESSAGE,
    );
    expect(registration.messageForRegistrationFailure('auth')).toBe(
      registration.REGISTRATION_AUTH_FAILURE_MESSAGE,
    );
    expect(profile.messageForProfileFailure('unauthenticated', 'save')).toBe(
      profile.PROFILE_UNAUTHENTICATED_EDIT_MESSAGE,
    );
    expect(logout.LOGIN_LOGOUT_FAILURE_MESSAGE).toBe('目前無法登出，請稍後再試。');
    expect(prompt.PROFILE_COMPLETION_PROMPT_LOAD_FAILURE_MESSAGE).toBe(
      '目前無法載入個人資料提示，請稍後再試。',
    );
  });

  it('keeps registration off auto-login, Set-Cookie, and GET /users/me', async () => {
    const { submitRegistrationRequest } = await loadModule(
      'public/frontend/registration-page.js',
    );
    const fetchCalls: string[] = [];
    const fetchImpl = vi.fn(async (url: string) => {
      fetchCalls.push(String(url));
      return { status: 201 };
    });

    await submitRegistrationRequest({
      profile: {
        display_name: 'Checkpoint User',
        birth_year_month: '1998-07',
        residential_region: 'TW-TPE',
      },
      credential: 'proof',
      fetchImpl,
    });

    expect(fetchCalls).toEqual(['/registration']);
  });

  it('keeps lifecycle transition failures mapped to frontend copy only', async () => {
    const lifecycle = await loadModule('public/frontend/poll-lifecycle-controls.js');

    expect(
      lifecycle.messageForLifecycleTransitionFailure({
        status: 404,
        errorCode: 'POLL_NOT_FOUND',
        message: FOREIGN_ERROR_TEXT,
      }),
    ).toBe('找不到此問卷，可能已刪除或連結有誤。');

    expect(lifecycle.LIFECYCLE_USER_ERROR_MESSAGES).toContain(
      lifecycle.LIFECYCLE_GENERIC_FAILURE,
    );
  });

  it('keeps reviewed user-visible error constants free of forbidden internals and outcomes', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const explore = await loadModule('public/frontend/explore-page.js');
    const votePage = await loadModule('public/frontend/vote-page.js');
    const resultPage = await loadModule('public/frontend/result-page.js');
    const myPolls = await loadModule('public/frontend/my-polls-page.js');
    const lifecycle = await loadModule('public/frontend/poll-lifecycle-controls.js');

    const userVisibleMessages = [
      explore.EXPLORE_LOAD_FAILURE_MESSAGE,
      explore.EXPLORE_FEED_EMPTY_MESSAGE,
      publicUi.VOTE_PAGE_LOAD_FAILURE,
      publicUi.GENERIC_VOTE_SUBMIT_FAILURE,
      resultPage.RESULTS_LOAD_FAILURE_MESSAGE,
      resultPage.RESULTS_POLL_UNAVAILABLE_MESSAGE,
      resultPage.RESULT_DISPLAY_REFRESH_FAILURE_MESSAGE,
      myPolls.MY_POLLS_LOAD_FAILURE_MESSAGE,
      myPolls.MY_POLLS_SIGN_IN_REQUIRED_MESSAGE,
      lifecycle.CREATOR_SESSION_FAILURE,
      lifecycle.LIFECYCLE_GENERIC_FAILURE,
    ];

    for (const message of userVisibleMessages) {
      expect(message).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(message).not.toMatch(FORBIDDEN_OUTCOME_COPY);
      expect(message).not.toContain(FOREIGN_ERROR_TEXT);
    }
  });

  for (const relativePath of REVIEWED_ERROR_SURFACES) {
    it(`keeps reviewed public error runtime neutral in ${relativePath}`, async () => {
      const raw = await readFile(join(process.cwd(), relativePath), 'utf8');
      const source = stripJsComments(raw);

      if (relativePath !== 'public/frontend/poll-lifecycle-controls.js') {
        expect(source, relativePath).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      }
      expect(source, relativePath).not.toMatch(FORBIDDEN_OUTCOME_COPY);
    });
  }
});
