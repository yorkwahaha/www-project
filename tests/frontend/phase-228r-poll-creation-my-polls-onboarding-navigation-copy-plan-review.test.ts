import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_228_DOC =
  'docs/www-project-phase-228-poll-creation-my-polls-onboarding-navigation-copy-plan-v1.md';
const PHASE_228R_DOC =
  'docs/www-project-phase-228r-poll-creation-my-polls-onboarding-navigation-copy-plan-review-v1.md';

const CREATOR_ONBOARDING_RUNTIME_MODULES = [
  'public/frontend/create-poll-page.js',
  'public/frontend/my-polls-page.js',
  'public/frontend/creator-flow-copy.js',
  'public/frontend/poll-lifecycle-controls.js',
] as const;

const FORBIDDEN_ELIGIBILITY_OUTCOME =
  /你符合資格|你不符合資格|已投過票|可以投票|一定能投票|can_vote|age_passed|region_passed/i;

const FORBIDDEN_DEBUG_LEAKAGE =
  /request_id|requestId|trace_id|traceId|stack trace|internal code|error_code/i;

const FORBIDDEN_STORAGE = /localStorage|sessionStorage|document\.cookie|Set-Cookie/i;

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 228-R poll creation my polls onboarding navigation copy plan review', () => {
  it('documents Phase 228-R review in README', async () => {
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');
    expect(readme).toContain('Phase 228-R');
    expect(readme).toContain(PHASE_228R_DOC);
    expect(readme).toContain(
      'Poll creation / my-polls onboarding navigation copy plan review',
    );
  });

  it('keeps Phase 228 plan as plan-only without runtime module markers', async () => {
    const plan = await readFile(join(process.cwd(), PHASE_228_DOC), 'utf8');
    const review = await readFile(join(process.cwd(), PHASE_228R_DOC), 'utf8');

    expect(plan).toContain('plan only');
    expect(plan).toContain('/polls/new');
    expect(plan).toContain('/my-polls');
    expect(plan).toContain('creator-flow-copy.js');
    expect(plan).toContain('Phase 228-R');
    expect(review).toContain('copy-only');
    expect(review).toContain('APPROVED');

    for (const relativePath of CREATOR_ONBOARDING_RUNTIME_MODULES) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 228');
      expect(source, relativePath).not.toContain('Phase 228-R');
      expect(source, relativePath).not.toContain('Phase 229');
    }
  });

  it('keeps creator-flow copy grouped on poll creation and my-polls surfaces', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const creator = await loadModule('public/frontend/creator-flow-copy.js');
    const createPollHtml = await readFile(join(process.cwd(), 'public/create-poll.html'), 'utf8');
    const myPollsHtml = await readFile(join(process.cwd(), 'public/my-polls.html'), 'utf8');

    expect(publicUi.PUBLIC_CREATE_POLL_PAGE_LEAD).toBeTruthy();
    expect(publicUi.PUBLIC_MY_POLLS_PAGE_LEAD).toBeTruthy();
    expect(creator.CREATOR_FLOW_COPY.createSuccessLead).toBe(
      publicUi.PUBLIC_CREATOR_CREATE_SUCCESS_LEAD_HINT,
    );
    expect(creator.CREATOR_FLOW_COPY.myPollsLead).toBe(
      publicUi.PUBLIC_CREATOR_MY_POLLS_LEAD_HINT,
    );
    expect(createPollHtml).toContain('id="create-poll-page-lead"');
    expect(myPollsHtml).toContain('id="my-polls-page-lead"');
    expect(createPollHtml).toContain('展示用');
    expect(myPollsHtml).toContain('?live=1');
  });

  it('keeps demo vs live creator API paths unchanged', async () => {
    const createPoll = await loadModule('public/frontend/create-poll-page.js');
    const myPolls = await loadModule('public/frontend/my-polls-page.js');
    const createPollSource = await readFile(
      join(process.cwd(), 'public/frontend/create-poll-page.js'),
      'utf8',
    );
    const myPollsSource = await readFile(
      join(process.cwd(), 'public/frontend/my-polls-page.js'),
      'utf8',
    );
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

    expect(createPollSource).toContain('submitCreatePollDemo');
    expect(createPollSource).toContain("fetchImpl('/creator/polls'");
    expect(myPollsSource).toContain("fetchImpl('/creator/polls'");
    expect(createPollSource).not.toMatch(FORBIDDEN_STORAGE);
    expect(myPollsSource).not.toMatch(FORBIDDEN_ELIGIBILITY_OUTCOME);
  });

  it('keeps registration boundary without auto-login or GET /users/me', async () => {
    const registration = await loadModule('public/frontend/registration-page.js');
    const fetchCalls: string[] = [];
    const fetchImpl = vi.fn(async (url: string) => {
      fetchCalls.push(String(url));
      return { status: 201 };
    });

    await registration.submitRegistrationRequest({
      profile: {
        display_name: 'Plan Review User',
        birth_year_month: '1998-07',
        residential_region: 'TW-TPE',
      },
      credential: 'proof',
      fetchImpl,
    });

    expect(fetchCalls).toEqual(['/registration']);
  });

  it('keeps creator modules free of forbidden debug and storage patterns', async () => {
    for (const relativePath of CREATOR_ONBOARDING_RUNTIME_MODULES) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toMatch(FORBIDDEN_DEBUG_LEAKAGE);
      expect(source, relativePath).not.toMatch(FORBIDDEN_STORAGE);
    }
  });

  it('keeps vote-by-index and quality_badge presentation boundaries', async () => {
    const votePage = await loadModule('public/frontend/vote-page.js');
    const badge = await loadModule('public/frontend/quality-feedback-badge.js');
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
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: null })).toBe(false);
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
    expect(repository).not.toContain('Phase 228-R');
  });
});
