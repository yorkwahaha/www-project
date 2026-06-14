import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_221_DOC =
  'docs/www-project-phase-221-public-mvp-state-copy-consistency-milestone-checkpoint-v1.md';

const STATE_COPY_RUNTIME_MODULES = [
  'public/frontend/explore-page.js',
  'public/frontend/vote-page.js',
  'public/frontend/result-page.js',
  'public/frontend/login-page.js',
  'public/frontend/registration-page.js',
  'public/frontend/profile-page.js',
  'public/frontend/create-poll-page.js',
  'public/frontend/my-polls-page.js',
  'public/frontend/poll-lifecycle-controls.js',
  'public/frontend/official-vote-pre-vote-hints.js',
  'public/frontend/public-mvp-ui.js',
  'public/frontend/quality-feedback-badge.js',
] as const;

const FORBIDDEN_ELIGIBILITY_OUTCOME =
  /你符合資格|你不符合資格|已投過票|可以投票|一定能投票|can_vote|age_passed|region_passed/i;

const FORBIDDEN_DEBUG_LEAKAGE =
  /request_id|requestId|trace_id|traceId|stack trace|internal code|error_code/i;

const FORBIDDEN_BACKEND_ECHO =
  /error\.message|body\.message|apiError\.message|response\.text\(\)|JSON\.stringify\(error/i;

function stripJsComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 221 public MVP state copy consistency milestone checkpoint', () => {
  it('confirms Phase 221 is docs/static only with README index reference', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_221_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(doc).toContain('Phase 221');
    expect(doc).toContain('Public MVP State Copy Consistency Milestone Checkpoint');
    expect(doc).toContain('milestone checkpoint');
    expect(doc).toContain('no runtime change');
    expect(doc).toContain('no API change');
    expect(doc).toContain('no frontend change');
    expect(doc).toContain('no migration');
    expect(doc).toContain('no schema change');
    expect(doc).toContain('no CSS/HTML/JS copy changes');
    expect(doc).toContain(
      'APPROVED — Public MVP state copy consistency milestone complete; no runtime/API/DB/backend/auth/vote/result/creator/profile/privacy drift identified.',
    );

    expect(readme).toContain('Phase 221');
    expect(readme).toContain(PHASE_221_DOC);
    expect(readme).toContain('state copy consistency milestone checkpoint');
  });

  it('keeps public-mvp-ui participation/account/creator user-message allowlists', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const uiSource = await readFile(join(process.cwd(), 'public/frontend/public-mvp-ui.js'), 'utf8');

    expect(publicUi.PUBLIC_PENDING_USER_MESSAGES.length).toBeGreaterThan(0);
    expect(publicUi.PUBLIC_LOAD_FAILURE_USER_MESSAGES.length).toBeGreaterThan(0);
    expect(publicUi.PUBLIC_AUTH_STATE_USER_MESSAGES.length).toBeGreaterThan(0);
    expect(publicUi.PUBLIC_CREATOR_STATE_USER_MESSAGES.length).toBeGreaterThan(0);
    expect(uiSource).toContain('PUBLIC_AUTH_STATE_USER_MESSAGES');
    expect(uiSource).toContain('PUBLIC_CREATOR_STATE_USER_MESSAGES');
    expect(uiSource).toContain('resolvePublicErrorUserMessage');
    expect(uiSource).toContain('Never surfaces foreign error.message');

    for (const message of [
      ...publicUi.PUBLIC_AUTH_STATE_USER_MESSAGES,
      ...publicUi.PUBLIC_CREATOR_STATE_USER_MESSAGES,
    ]) {
      expect(message).not.toMatch(FORBIDDEN_DEBUG_LEAKAGE);
    }
  });

  it('keeps vote pre-vote hints neutral without eligibility outcome disclosure', async () => {
    const hints = await loadModule('public/frontend/official-vote-pre-vote-hints.js');
    const hintsSource = await readFile(
      join(process.cwd(), 'public/frontend/official-vote-pre-vote-hints.js'),
      'utf8',
    );

    expect(hints.PRE_VOTE_HINT_COPY.anonymous).toBeTruthy();
    expect(hints.PRE_VOTE_HINT_COPY.incompleteProfile).toBeTruthy();
    expect(hintsSource).not.toMatch(FORBIDDEN_ELIGIBILITY_OUTCOME);
    expect(hintsSource).not.toMatch(FORBIDDEN_DEBUG_LEAKAGE);
  });

  it('keeps results demo and live intro copy separated without weakening visibility gates', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const results = await loadModule('public/frontend/result-page.js');

    expect(publicUi.PUBLIC_RESULTS_PAGE_DEMO_INTRO_LEAD).toContain('展示用');
    expect(publicUi.PUBLIC_RESULTS_PAGE_LIVE_INTRO_LEAD).not.toContain('展示用，不儲存');
    expect(results.RESULTS_PAGE_LIVE_INTRO_LEAD).toBe(
      publicUi.PUBLIC_RESULTS_PAGE_LIVE_INTRO_LEAD,
    );

    const demoIntro = { textContent: '' };
    results.syncResultsPageLeadParagraphs(
      {
        getElementById: (id: string) =>
          id === 'results-page-demo-intro' ? demoIntro : null,
      },
      { demoOnly: true },
    );
    expect(demoIntro.textContent).toBe(publicUi.PUBLIC_RESULTS_PAGE_DEMO_INTRO_LEAD);

    const liveIntro = { textContent: '' };
    results.syncResultsPageLeadParagraphs(
      {
        getElementById: (id: string) =>
          id === 'results-page-demo-intro' ? liveIntro : null,
      },
      { demoOnly: false },
    );
    expect(liveIntro.textContent).toBe(publicUi.PUBLIC_RESULTS_PAGE_LIVE_INTRO_LEAD);
  });

  it('keeps registration success without GET /users/me or Set-Cookie', async () => {
    const registration = await loadModule('public/frontend/registration-page.js');
    const registrationSource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/registration-page.js'), 'utf8'),
    );
    const fetchCalls: string[] = [];
    const fetchImpl = vi.fn(async (url: string) => {
      fetchCalls.push(String(url));
      return {
        status: 201,
        headers: { get: vi.fn() },
      };
    });

    expect(registration.REGISTRATION_SUCCESS_MESSAGE).toContain('不會自動登入');
    expect(registrationSource).toContain("fetchImpl('/registration'");
    expect(registrationSource).not.toMatch(/\/users\/me|Set-Cookie|login\/session/i);

    await registration.submitRegistrationRequest({
      profile: {
        display_name: 'Registered User',
        birth_year_month: '1998-07',
        residential_region: 'TW-TPE',
      },
      credential: 'approved-proof',
      fetchImpl,
    });
    expect(fetchCalls).toEqual(['/registration']);
  });

  it('keeps creator API paths stable across poll creation, my polls, and lifecycle', async () => {
    const createPoll = await loadModule('public/frontend/create-poll-page.js');
    const myPolls = await loadModule('public/frontend/my-polls-page.js');
    const lifecycle = await loadModule('public/frontend/poll-lifecycle-controls.js');
    const pollId = '22222222-2222-4222-8222-222222222222';

    const createFetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ poll_id: pollId, status: 'active' }),
    }));
    await createPoll.submitCreatePoll({
      formValues: { title: '測試', description: '', options: ['A', 'B'] },
      fetchImpl: createFetch,
      now: () => new Date('2026-05-31T12:00:00.000Z'),
    });
    expect(createFetch).toHaveBeenCalledWith(
      '/creator/polls',
      expect.objectContaining({ method: 'POST', credentials: 'same-origin' }),
    );

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

    const lifecycleFetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ refreshed: true }),
    }));
    await lifecycle.postPollLifecycleTransition(pollId, 'close', lifecycleFetch);
    expect(lifecycleFetch).toHaveBeenCalledWith(
      `/creator/polls/${pollId}/close`,
      expect.objectContaining({ method: 'POST', credentials: 'same-origin' }),
    );
  });

  it('keeps quality_badge presentation-only and vote-by-index boundaries', async () => {
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

  it('keeps state-copy runtime modules free of phase markers and backend echo', async () => {
    for (const relativePath of STATE_COPY_RUNTIME_MODULES) {
      const source = stripJsComments(
        await readFile(join(process.cwd(), relativePath), 'utf8'),
      );
      expect(source, relativePath).not.toContain('Phase 214');
      expect(source, relativePath).not.toContain('Phase 215');
      expect(source, relativePath).not.toContain('Phase 217');
      expect(source, relativePath).not.toContain('Phase 219');
      expect(source, relativePath).not.toContain('Phase 221');
      if (relativePath !== 'public/frontend/public-mvp-ui.js') {
        expect(source, relativePath).not.toMatch(FORBIDDEN_BACKEND_ECHO);
      }
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
    expect(repository).not.toContain('Phase 221');
  });
});
