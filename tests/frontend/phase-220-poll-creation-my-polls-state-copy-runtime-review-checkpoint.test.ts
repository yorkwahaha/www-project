import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_219_DOC =
  'docs/www-project-phase-219-poll-creation-my-polls-state-copy-runtime-v1.md';
const PHASE_220_DOC =
  'docs/www-project-phase-220-poll-creation-my-polls-state-copy-runtime-review-checkpoint-v1.md';

const PHASE_219_TOUCHED_MODULES = [
  'public/frontend/public-mvp-ui.js',
  'public/frontend/create-poll-page.js',
  'public/frontend/my-polls-page.js',
  'public/frontend/poll-lifecycle-controls.js',
] as const;

const FORBIDDEN_DEBUG_LEAKAGE =
  /request_id|requestId|trace_id|traceId|stack trace|internal code|error_code/i;

const FORBIDDEN_STORAGE = /localStorage|sessionStorage|document\.cookie|Set-Cookie/i;

const FORBIDDEN_BACKEND_ECHO =
  /error\.message|body\.message|apiError\.message|response\.text\(\)|JSON\.stringify\(error/i;

const FORBIDDEN_COUNTER_LEAKAGE =
  /raw_count|shard_id|vote_count|option_id.*user|user.*option_id/i;

function stripJsComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 220 poll creation my polls state copy runtime review checkpoint', () => {
  it('documents Phase 220 review checkpoint in README', async () => {
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');
    expect(readme).toContain('Phase 220');
    expect(readme).toContain(PHASE_220_DOC);
    expect(readme).toContain('state copy runtime review checkpoint');
  });

  it('keeps Phase 219 delivery documented and runtime modules free of phase markers', async () => {
    const delivery = await readFile(join(process.cwd(), PHASE_219_DOC), 'utf8');
    const review = await readFile(join(process.cwd(), PHASE_220_DOC), 'utf8');

    expect(delivery).toContain('copy-only');
    expect(review).toContain('APPROVED');
    expect(review).toContain(
      'APPROVED — Phase 219 Poll Creation / My Polls state copy runtime patch is copy-only; no runtime/API/DB/backend/auth/creator/lifecycle/result/privacy drift identified.',
    );

    for (const relativePath of PHASE_219_TOUCHED_MODULES) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 219');
      expect(source, relativePath).not.toContain('Phase 220');
    }
  });

  it('keeps create-poll-page re-exporting shared copy without altering POST /creator/polls', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const createPoll = await loadModule('public/frontend/create-poll-page.js');
    const createPollSource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/create-poll-page.js'), 'utf8'),
    );
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        poll_id: '22222222-2222-4222-8222-222222222222',
        status: 'active',
        created_at: '2026-05-31T12:00:00.000Z',
      }),
    }));

    expect(createPoll.CREATE_POLL_SUBMIT_PENDING_MESSAGE).toBe(
      publicUi.PUBLIC_CREATE_POLL_SUBMIT_PENDING_MESSAGE,
    );
    expect(createPoll.CREATE_POLL_FAILURE_MESSAGE).toBe(
      publicUi.PUBLIC_CREATE_POLL_FAILURE_MESSAGE,
    );
    expect(createPoll.CREATE_POLL_USER_ERROR_MESSAGES).toEqual(
      publicUi.PUBLIC_CREATE_POLL_USER_ERROR_MESSAGES,
    );
    expect(createPollSource).toContain('PUBLIC_CREATE_POLL_SUBMIT_PENDING_MESSAGE');
    expect(createPollSource).toContain("fetchImpl('/creator/polls'");
    expect(createPollSource).toContain("credentials: 'same-origin'");
    expect(createPollSource).toContain('resolvePublicErrorUserMessage');
    expect(createPollSource).not.toMatch(FORBIDDEN_BACKEND_ECHO);

    await createPoll.submitCreatePoll({
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

  it('keeps my-polls-page on creator session and owned-list APIs unchanged', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const myPolls = await loadModule('public/frontend/my-polls-page.js');
    const myPollsSource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/my-polls-page.js'), 'utf8'),
    );

    expect(myPolls.MY_POLLS_LOADING_MESSAGE).toBe(publicUi.PUBLIC_MY_POLLS_LOADING_MESSAGE);
    expect(myPolls.MY_POLLS_CREATOR_SESSION_FAILURE_MESSAGE).toBe(
      publicUi.PUBLIC_CREATOR_SESSION_FAILURE_MESSAGE,
    );
    expect(myPollsSource).toContain("fetchImpl('/creator/session'");
    expect(myPollsSource).toContain("fetchImpl('/creator/polls'");
    expect(myPollsSource).toContain("credentials: 'same-origin'");
    expect(myPollsSource).toContain('CREATOR_OWNED_POLL_ALLOWED_KEYS');
    expect(myPollsSource).not.toMatch(FORBIDDEN_COUNTER_LEAKAGE);

    const sessionFetch = vi.fn(async (url: string) => {
      if (url === '/creator/session') {
        return { ok: true, status: 200, json: async () => ({}) };
      }
      throw new Error('unexpected');
    });
    await myPolls.prepareMyPollsLiveSession({
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
    await myPolls.fetchCreatorOwnedPolls(pollsFetch);
    expect(pollsFetch).toHaveBeenCalledWith('/creator/polls', {
      method: 'GET',
      credentials: 'same-origin',
    });
  });

  it('keeps poll-lifecycle-controls lifecycle POST paths unchanged', async () => {
    const lifecycle = await loadModule('public/frontend/poll-lifecycle-controls.js');
    const lifecycleSource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/poll-lifecycle-controls.js'), 'utf8'),
    );
    const pollId = '22222222-2222-4222-8222-222222222222';
    const fetchImpl = vi.fn(async () => ({ ok: true, json: async () => ({ refreshed: true }) }));

    expect(lifecycle.CREATOR_SESSION_FAILURE).toBe(
      (await loadModule('public/frontend/public-mvp-ui.js'))
        .PUBLIC_CREATOR_SESSION_FAILURE_MESSAGE,
    );
    expect(lifecycleSource).toContain('/creator/polls/${encodeURIComponent(pollId)}/');
    expect(lifecycleSource).toContain("method: 'POST'");

    await lifecycle.postPollLifecycleTransition(pollId, 'close', fetchImpl);
    expect(fetchImpl).toHaveBeenCalledWith(
      `/creator/polls/${pollId}/close`,
      expect.objectContaining({
        method: 'POST',
        credentials: 'same-origin',
      }),
    );
  });

  it('keeps PUBLIC_CREATOR_STATE_USER_MESSAGES allowlisted and demo/live copy distinct', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const uiSource = await readFile(join(process.cwd(), 'public/frontend/public-mvp-ui.js'), 'utf8');

    expect(uiSource).toContain('PUBLIC_CREATOR_STATE_USER_MESSAGES');
    expect(publicUi.PUBLIC_CREATOR_STATE_USER_MESSAGES).toContain(
      publicUi.PUBLIC_CREATE_POLL_SUBMIT_PENDING_MESSAGE,
    );
    expect(publicUi.PUBLIC_CREATOR_STATE_USER_MESSAGES).toContain(
      publicUi.PUBLIC_MY_POLLS_LOAD_FAILURE_MESSAGE,
    );
    expect(publicUi.PUBLIC_CREATOR_STATE_USER_MESSAGES).toContain(
      publicUi.PUBLIC_CREATOR_SESSION_FAILURE_MESSAGE,
    );
    expect(publicUi.PUBLIC_CREATE_POLL_DEMO_SUCCESS_MESSAGE).toContain('展示用');
    expect(publicUi.PUBLIC_CREATE_POLL_DEMO_SUCCESS_MESSAGE).toContain('不會儲存');
    expect(publicUi.PUBLIC_CREATE_POLL_SUCCESS_MESSAGE).not.toContain('展示用');

    for (const message of publicUi.PUBLIC_CREATOR_STATE_USER_MESSAGES) {
      expect(message).not.toMatch(FORBIDDEN_DEBUG_LEAKAGE);
    }

    expect(uiSource).toContain('Never surfaces foreign error.message');
    expect(
      publicUi.resolvePublicErrorUserMessage(
        new Error('backend secret failure'),
        publicUi.PUBLIC_CREATE_POLL_FAILURE_MESSAGE,
        publicUi.PUBLIC_CREATE_POLL_USER_ERROR_MESSAGES,
      ),
    ).toBe(publicUi.PUBLIC_CREATE_POLL_FAILURE_MESSAGE);
  });

  it('keeps quality_badge presentation and vote-by-index boundaries', async () => {
    const badge = await loadModule('public/frontend/quality-feedback-badge.js');
    const votePage = await loadModule('public/frontend/vote-page.js');
    const badgeSource = await readFile(
      join(process.cwd(), 'public/frontend/quality-feedback-badge.js'),
      'utf8',
    );
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 201,
      json: async () => ({
        vote_token: 'secret-token',
        option_id: 'secret-option',
        shard_id: 7,
      }),
    }));

    await votePage.submitVoteByIndex({
      pollId: '11111111-1111-4111-8111-111111111111',
      optionIndex: 1,
      userId: '44444444-4444-4444-8444-444444444444',
      fetchImpl,
    });

    const body = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body));
    expect(body).toEqual({ option_index: 1 });

    expect(badge.QUALITY_FEEDBACK_BADGE_LABEL).toBe('回饋良好');
    expect(badgeSource).not.toMatch(/tooltip|title\s*=|aria-describedby|debug|score|rank/i);
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: 'positive_feedback' })).toBe(
      true,
    );
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: null })).toBe(false);
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: 'unexpected' })).toBe(false);
  });

  it('keeps Phase 219 touched modules free of storage, backend echo, and forbidden copy', async () => {
    for (const relativePath of PHASE_219_TOUCHED_MODULES) {
      const source = stripJsComments(
        await readFile(join(process.cwd(), relativePath), 'utf8'),
      );
      if (relativePath !== 'public/frontend/public-mvp-ui.js') {
        expect(source, relativePath).not.toMatch(FORBIDDEN_BACKEND_ECHO);
      }
      expect(source, relativePath).not.toMatch(FORBIDDEN_STORAGE);
      expect(source, relativePath).not.toMatch(FORBIDDEN_DEBUG_LEAKAGE);
    }
  });

  it('keeps Official Vote transaction order unchanged in backend source', async () => {
    const repository = await readFile(join(process.cwd(), 'src/polls/repository.ts'), 'utf8');
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
    expect(repository).not.toContain('Phase 219');
    expect(repository).not.toContain('Phase 220');
  });
});
