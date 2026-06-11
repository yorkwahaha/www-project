import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PUBLIC_ERROR_SURFACES = [
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

const FORBIDDEN_INTERNAL_COPY =
  /option_id|vote_token|token_sha256|shard_id|session_id|www_session|\buser_id\b|raw_count|poll_option_vote_counters/i;

const FORBIDDEN_OUTCOME_COPY =
  /你符合資格|你不符合資格|已投過票|可以投票|一定能投票|can_vote|age_passed|region_passed/i;

function stripJsComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 135 public error copy consistency polish', () => {
  it('resolvePublicErrorUserMessage keeps frontend-owned copy and blocks foreign error.message', async () => {
    const {
      resolvePublicErrorUserMessage,
      VOTE_PAGE_LOAD_FAILURE,
      PUBLIC_POLL_LOAD_USER_MESSAGES,
    } = await loadModule('public/frontend/public-mvp-ui.js');

    expect(
      resolvePublicErrorUserMessage(
        new Error('backend INTERNAL option_id leak'),
        VOTE_PAGE_LOAD_FAILURE,
        PUBLIC_POLL_LOAD_USER_MESSAGES,
      ),
    ).toBe(VOTE_PAGE_LOAD_FAILURE);

    expect(
      resolvePublicErrorUserMessage(
        new Error(VOTE_PAGE_LOAD_FAILURE),
        'fallback',
        PUBLIC_POLL_LOAD_USER_MESSAGES,
      ),
    ).toBe(VOTE_PAGE_LOAD_FAILURE);
  });

  it('keeps explore load failure copy neutral with trailing period', async () => {
    const { EXPLORE_LOAD_FAILURE_MESSAGE, fetchExploreFeedPage } =
      await loadModule('public/frontend/explore-page.js');

    expect(EXPLORE_LOAD_FAILURE_MESSAGE).toBe(
      '目前無法載入探索列表，請稍後再試。',
    );

    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({
        error: 'INTERNAL',
        message: 'foreign backend payload',
      }),
    });
    await expect(
      fetchExploreFeedPage({
        fetchImpl,
        origin: 'http://127.0.0.1:3000',
      }),
    ).rejects.toThrow(EXPLORE_LOAD_FAILURE_MESSAGE);
  });

  it('keeps vote page catch paths on allowlisted frontend copy only', async () => {
    const votePage = await loadModule('public/frontend/vote-page.js');
    const source = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/vote-page.js'), 'utf8'),
    );

    expect(source).toContain('resolvePublicErrorUserMessage');
    expect(source).not.toMatch(
      /catch\s*\([^)]*\)\s*\{[^}]*error instanceof Error\s*\?\s*error\.message/s,
    );
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    expect(votePage.VOTE_PAGE_LOAD_USER_MESSAGES).toContain(
      publicUi.VOTE_PAGE_LOAD_FAILURE,
    );
    expect(votePage.VOTE_PAGE_SUBMIT_USER_MESSAGES).toContain(
      votePage.MISSING_SELECTION_MESSAGE,
    );
  });

  it('keeps results unavailable and load failure copy consistent', async () => {
    const resultPage = await loadModule('public/frontend/result-page.js');

    expect(resultPage.RESULTS_POLL_UNAVAILABLE_MESSAGE).toBe('問卷目前無法使用。');
    expect(resultPage.RESULTS_LOAD_FAILURE_MESSAGE).toBe(
      '目前無法載入結果，請稍後再試。',
    );
    expect(resultPage.messageForResultLoadFailure({ status: 404 })).toBe(
      resultPage.RESULTS_POLL_UNAVAILABLE_MESSAGE,
    );
  });

  it('maps my-polls live creator session failure to neutral copy', async () => {
    const myPolls = await loadModule('public/frontend/my-polls-page.js');
    const lifecycle = await loadModule('public/frontend/poll-lifecycle-controls.js');

    expect(myPolls.MY_POLLS_LOAD_FAILURE_MESSAGE).toBe(
      '目前無法載入你建立的問卷，請稍後再試。',
    );
    expect(myPolls.MY_POLLS_SIGN_IN_REQUIRED_MESSAGE).toBe(
      '請先登入後查看你建立的問卷。',
    );
    expect(lifecycle.CREATOR_SESSION_FAILURE).toBe(
      '目前無法確認發起者身分，請稍後再試。',
    );
  });

  it('keeps auth/profile registration failure copy on frontend-owned allowlists', async () => {
    const registration = await loadModule('public/frontend/registration-page.js');
    const profile = await loadModule('public/frontend/profile-page.js');
    const prompt = await loadModule('public/frontend/profile-completion-prompt.js');
    const logout = await loadModule('public/frontend/login-state-logout.js');

    expect(registration.REGISTRATION_USER_ERROR_MESSAGES).toContain(
      registration.REGISTRATION_FAILURE_MESSAGE,
    );
    expect(profile.PROFILE_USER_ERROR_MESSAGES).toContain(
      profile.PROFILE_LOAD_FAILURE_MESSAGE,
    );
    expect(prompt.PROFILE_COMPLETION_PROMPT_LOAD_FAILURE_MESSAGE).toBe(
      '目前無法載入個人資料提示，請稍後再試。',
    );
    expect(logout.LOGIN_LOGOUT_FAILURE_MESSAGE).toBe('目前無法登出，請稍後再試。');
  });

  it('keeps lifecycle transition failures on frontend-owned allowlist', async () => {
    const lifecycle = await loadModule('public/frontend/poll-lifecycle-controls.js');
    const source = stripJsComments(
      await readFile(
        join(process.cwd(), 'public/frontend/poll-lifecycle-controls.js'),
        'utf8',
      ),
    );

    expect(source).toContain('resolvePublicErrorUserMessage');
    expect(lifecycle.LIFECYCLE_USER_ERROR_MESSAGES).toContain(
      lifecycle.LIFECYCLE_GENERIC_FAILURE,
    );
    expect(
      lifecycle.messageForLifecycleTransitionFailure({
        status: 401,
        errorCode: 'AUTH_REQUIRED',
        message: 'secret backend detail',
      }),
    ).toBe('需要發起者身分才能執行此操作。');
  });

  for (const relativePath of PUBLIC_ERROR_SURFACES) {
    it(`keeps reviewed public error copy neutral in ${relativePath}`, async () => {
      const raw = await readFile(join(process.cwd(), relativePath), 'utf8');
      const source = stripJsComments(raw);

      if (relativePath !== 'public/frontend/poll-lifecycle-controls.js') {
        expect(source, relativePath).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      }
      expect(source, relativePath).not.toMatch(FORBIDDEN_OUTCOME_COPY);
    });
  }
});
