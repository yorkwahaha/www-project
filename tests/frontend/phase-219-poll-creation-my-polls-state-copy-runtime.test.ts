import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_219_MODULES = [
  'public/frontend/public-mvp-ui.js',
  'public/frontend/create-poll-page.js',
  'public/frontend/my-polls-page.js',
  'public/frontend/poll-lifecycle-controls.js',
] as const;

const FORBIDDEN_DEBUG_LEAKAGE =
  /request_id|requestId|option_id|trace_id|traceId|stack trace|internal code|error_code/i;

const FORBIDDEN_BACKEND_ECHO =
  /error\.message|body\.message|apiError\.message|response\.text\(\)|JSON\.stringify\(error/i;

const FORBIDDEN_COUNTER_LEAKAGE =
  /票數|百分比|總計|排名|shard|counter|raw_count|\d+%/i;

function stripJsComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 219 poll creation my polls state copy runtime', () => {
  it('documents Phase 219 in README', async () => {
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');
    expect(readme).toContain('Phase 219');
    expect(readme).toContain(
      'docs/www-project-phase-219-poll-creation-my-polls-state-copy-runtime-v1.md',
    );
  });

  it('centralizes create-poll state copy in public-mvp-ui and re-exports from create-poll-page', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const createPoll = await loadModule('public/frontend/create-poll-page.js');

    expect(publicUi.PUBLIC_CREATE_POLL_SUBMIT_PENDING_MESSAGE).toBe('建立中，請稍候。');
    expect(createPoll.CREATE_POLL_SUBMIT_PENDING_MESSAGE).toBe(
      publicUi.PUBLIC_CREATE_POLL_SUBMIT_PENDING_MESSAGE,
    );
    expect(createPoll.CREATE_POLL_FAILURE_MESSAGE).toBe(
      publicUi.PUBLIC_CREATE_POLL_FAILURE_MESSAGE,
    );
    expect(createPoll.CREATE_POLL_USER_ERROR_MESSAGES).toEqual(
      publicUi.PUBLIC_CREATE_POLL_USER_ERROR_MESSAGES,
    );
    expect(publicUi.PUBLIC_PENDING_USER_MESSAGES).toContain(
      publicUi.PUBLIC_CREATE_POLL_SUBMIT_PENDING_MESSAGE,
    );
    expect(publicUi.PUBLIC_CREATE_POLL_DEMO_SUCCESS_MESSAGE).toContain('展示用');
    expect(publicUi.PUBLIC_CREATE_POLL_DEMO_SUCCESS_MESSAGE).toContain('不會儲存');
    expect(publicUi.PUBLIC_CREATE_POLL_SUCCESS_MESSAGE).toBe('問卷已建立。');
  });

  it('keeps create-poll failure copy frontend-owned without backend echo', async () => {
    const createPoll = await loadModule('public/frontend/create-poll-page.js');
    const {
      submitCreatePoll,
      CREATE_POLL_FAILURE_MESSAGE,
      CREATE_POLL_USER_ERROR_MESSAGES,
      resolvePublicErrorUserMessage,
    } = { ...createPoll, ...(await loadModule('public/frontend/public-mvp-ui.js')) };
    const rejectedFetch = vi.fn(async () => ({
      ok: false,
      status: 500,
      json: async () => ({
        error: 'INTERNAL_FAILURE',
        message: 'creator poll create failed',
      }),
    }));

    await expect(
      submitCreatePoll({
        formValues: {
          title: '午餐想吃什麼？',
          description: '',
          options: ['飯', '麵'],
        },
        fetchImpl: rejectedFetch,
      }),
    ).rejects.toThrow(CREATE_POLL_FAILURE_MESSAGE);

    expect(
      resolvePublicErrorUserMessage(
        new Error('backend secret failure'),
        CREATE_POLL_FAILURE_MESSAGE,
        CREATE_POLL_USER_ERROR_MESSAGES,
      ),
    ).toBe(CREATE_POLL_FAILURE_MESSAGE);

    for (const message of CREATE_POLL_USER_ERROR_MESSAGES) {
      expect(message).not.toMatch(FORBIDDEN_DEBUG_LEAKAGE);
    }
  });

  it('keeps create-poll request payload and API path unchanged', async () => {
    const { submitCreatePoll } = await loadModule('public/frontend/create-poll-page.js');
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        poll_id: '22222222-2222-4222-8222-222222222222',
        status: 'active',
        created_at: '2026-05-31T12:00:00.000Z',
      }),
    }));

    await submitCreatePoll({
      formValues: {
        title: '午餐想吃什麼？',
        description: '今天的選擇',
        options: ['飯', '麵'],
      },
      fetchImpl,
      now: () => new Date('2026-05-31T12:00:00.000Z'),
    });

    expect(fetchImpl).toHaveBeenCalledWith('/creator/polls', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: '午餐想吃什麼？',
        description: '今天的選擇',
        options: ['飯', '麵'],
        category: 'general',
        eligible_rule_id: null,
        closes_at: '2026-06-07T12:00:00.000Z',
        publish: true,
      }),
      credentials: 'same-origin',
    });
  });

  it('centralizes my-polls state copy and creator session failure message', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const myPolls = await loadModule('public/frontend/my-polls-page.js');
    const lifecycle = await loadModule('public/frontend/poll-lifecycle-controls.js');

    expect(myPolls.MY_POLLS_LOADING_MESSAGE).toBe(publicUi.PUBLIC_MY_POLLS_LOADING_MESSAGE);
    expect(myPolls.MY_POLLS_LOAD_FAILURE_MESSAGE).toBe(
      publicUi.PUBLIC_MY_POLLS_LOAD_FAILURE_MESSAGE,
    );
    expect(myPolls.MY_POLLS_EMPTY_MESSAGE).toBe(publicUi.PUBLIC_MY_POLLS_EMPTY_MESSAGE);
    expect(myPolls.MY_POLLS_SIGN_IN_REQUIRED_MESSAGE).toBe(
      publicUi.PUBLIC_MY_POLLS_SIGN_IN_REQUIRED_MESSAGE,
    );
    expect(myPolls.MY_POLLS_CREATOR_SESSION_FAILURE_MESSAGE).toBe(
      publicUi.PUBLIC_CREATOR_SESSION_FAILURE_MESSAGE,
    );
    expect(lifecycle.CREATOR_SESSION_FAILURE).toBe(
      publicUi.PUBLIC_CREATOR_SESSION_FAILURE_MESSAGE,
    );
    expect(publicUi.PUBLIC_CREATOR_STATE_USER_MESSAGES).toContain(
      publicUi.PUBLIC_MY_POLLS_LOADING_MESSAGE,
    );
    expect(publicUi.PUBLIC_CREATOR_STATE_USER_MESSAGES).toContain(
      publicUi.PUBLIC_CREATE_POLL_FAILURE_MESSAGE,
    );
  });

  it('keeps my-polls loading/error/empty copy neutral without counter leakage', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');

    for (const message of [
      publicUi.PUBLIC_MY_POLLS_LOADING_MESSAGE,
      publicUi.PUBLIC_MY_POLLS_LOAD_FAILURE_MESSAGE,
      publicUi.PUBLIC_MY_POLLS_EMPTY_MESSAGE,
      publicUi.PUBLIC_MY_POLLS_EMPTY_SUMMARY,
      publicUi.PUBLIC_MY_POLLS_SIGN_IN_REQUIRED_MESSAGE,
      publicUi.PUBLIC_CREATOR_SESSION_FAILURE_MESSAGE,
    ]) {
      expect(message).not.toMatch(FORBIDDEN_DEBUG_LEAKAGE);
      expect(message).not.toMatch(/creator_session|session_id|token_sha256|www_session/i);
    }

    expect(publicUi.PUBLIC_MY_POLLS_EMPTY_MESSAGE).not.toMatch(FORBIDDEN_COUNTER_LEAKAGE);
    expect(publicUi.PUBLIC_MY_POLLS_SIGN_IN_REQUIRED_MESSAGE).not.toMatch(
      FORBIDDEN_COUNTER_LEAKAGE,
    );
  });

  it('keeps my-polls creator session and owned-list API calls unchanged', async () => {
    const { prepareMyPollsLiveSession, fetchCreatorOwnedPolls, MY_POLLS_LOAD_FAILURE_MESSAGE } =
      await loadModule('public/frontend/my-polls-page.js');

    const sessionFetch = vi.fn(async (url: string) => {
      if (url === '/creator/session') {
        return { ok: true, status: 200, json: async () => ({}) };
      }
      throw new Error('unexpected');
    });
    await prepareMyPollsLiveSession({
      fetchImpl: sessionFetch,
      locationObject: { hostname: '127.0.0.1' },
    });
    expect(sessionFetch).toHaveBeenCalledWith('/creator/session', {
      method: 'GET',
      credentials: 'same-origin',
    });

    const pollsFetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ polls: [] }),
    }));
    await fetchCreatorOwnedPolls(pollsFetch);
    expect(pollsFetch).toHaveBeenCalledWith('/creator/polls', {
      method: 'GET',
      credentials: 'same-origin',
    });

    const badPollsFetch = vi.fn(async () => ({
      ok: false,
      status: 500,
      json: async () => ({ error: 'INTERNAL', message: 'hidden backend detail' }),
    }));
    await expect(fetchCreatorOwnedPolls(badPollsFetch)).rejects.toThrow(
      MY_POLLS_LOAD_FAILURE_MESSAGE,
    );
  });

  it('keeps quality_badge presentation-only and creator modules free of backend echo', async () => {
    const badge = await loadModule('public/frontend/quality-feedback-badge.js');

    expect(badge.QUALITY_FEEDBACK_BADGE_LABEL).toBe('回饋良好');
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: 'positive_feedback' })).toBe(
      true,
    );
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: null })).toBe(false);
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: 'unexpected' })).toBe(false);

    for (const relativePath of PHASE_219_MODULES) {
      const source = stripJsComments(
        await readFile(join(process.cwd(), relativePath), 'utf8'),
      );
      if (relativePath !== 'public/frontend/public-mvp-ui.js') {
        expect(source, relativePath).not.toMatch(FORBIDDEN_BACKEND_ECHO);
      }
      expect(source, relativePath).not.toMatch(FORBIDDEN_DEBUG_LEAKAGE);
    }
  });
});
