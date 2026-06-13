import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_214_DOC =
  'docs/www-project-phase-214-public-mvp-state-copy-consistency-plan-v1.md';
const PHASE_214R_DOC =
  'docs/www-project-phase-214r-public-mvp-state-copy-consistency-plan-review-checkpoint-v1.md';

const STATE_COPY_RUNTIME_MODULES = [
  'public/frontend/explore-page.js',
  'public/frontend/vote-page.js',
  'public/frontend/result-page.js',
  'public/frontend/login-page.js',
  'public/frontend/registration-page.js',
  'public/frontend/profile-page.js',
  'public/frontend/create-poll-page.js',
  'public/frontend/my-polls-page.js',
  'public/frontend/profile-completion-prompt.js',
  'public/frontend/official-vote-pre-vote-hints.js',
  'public/frontend/public-mvp-ui.js',
  'public/frontend/quality-feedback-badge.js',
] as const;

const FORBIDDEN_ELIGIBILITY_OUTCOME =
  /你符合資格|你不符合資格|已投過票|可以投票|一定能投票|can_vote|age_passed|region_passed/i;

const FORBIDDEN_DEBUG_LEAKAGE =
  /request_id|requestId|option_id|trace_id|traceId|stack trace|internal code|error_code/i;

const FORBIDDEN_STORAGE = /localStorage|sessionStorage|document\.cookie|Set-Cookie/i;

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 214-R public MVP state copy consistency plan review checkpoint', () => {
  it('documents Phase 214-R review checkpoint in README', async () => {
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');
    expect(readme).toContain('Phase 214-R');
    expect(readme).toContain(PHASE_214R_DOC);
    expect(readme).toContain('state copy consistency plan review checkpoint');
  });

  it('keeps Phase 214 plan as plan-only without runtime module markers', async () => {
    const plan = await readFile(join(process.cwd(), PHASE_214_DOC), 'utf8');
    const review = await readFile(join(process.cwd(), PHASE_214R_DOC), 'utf8');

    expect(plan).toContain('plan only');
    expect(plan).toContain('PUBLIC_PENDING_USER_MESSAGES');
    expect(plan).toContain('Phase 214-R');
    expect(review).toContain('copy-only');

    for (const relativePath of STATE_COPY_RUNTIME_MODULES) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 214');
      expect(source, relativePath).not.toContain('Phase 214-R');
      expect(source, relativePath).not.toContain('Phase 215');
    }
  });

  it('keeps frontend-owned pending and load-failure copy constants in public-mvp-ui', async () => {
    const ui = await loadModule('public/frontend/public-mvp-ui.js');
    const uiSource = await readFile(join(process.cwd(), 'public/frontend/public-mvp-ui.js'), 'utf8');

    expect(ui.PUBLIC_PENDING_USER_MESSAGES.length).toBeGreaterThan(0);
    expect(ui.PUBLIC_LOAD_FAILURE_USER_MESSAGES.length).toBeGreaterThan(0);
    expect(uiSource).toContain('resolvePublicErrorUserMessage');
    expect(uiSource).toContain('Never surfaces foreign error.message');
    expect(uiSource).not.toMatch(FORBIDDEN_ELIGIBILITY_OUTCOME);
    expect(uiSource).not.toMatch(FORBIDDEN_DEBUG_LEAKAGE);
  });

  it('keeps resolvePublicErrorUserMessage from echoing foreign backend errors', async () => {
    const ui = await loadModule('public/frontend/public-mvp-ui.js');
    const allowed = ['允許的錯誤訊息'];

    expect(
      ui.resolvePublicErrorUserMessage(
        new Error('backend secret failure'),
        '目前無法載入，請稍後再試。',
        allowed,
      ),
    ).toBe('目前無法載入，請稍後再試。');

    expect(
      ui.resolvePublicErrorUserMessage(
        new Error('允許的錯誤訊息'),
        '目前無法載入，請稍後再試。',
        allowed,
      ),
    ).toBe('允許的錯誤訊息');
  });

  it('keeps vote pre-vote hints neutral without eligibility outcome disclosure', async () => {
    const hints = await loadModule('public/frontend/official-vote-pre-vote-hints.js');
    const hintsSource = await readFile(
      join(process.cwd(), 'public/frontend/official-vote-pre-vote-hints.js'),
      'utf8',
    );

    expect(hints.PRE_VOTE_HINT_COPY.anonymous).toBeTruthy();
    expect(hints.PRE_VOTE_HINT_COPY.incompleteProfile).toBeTruthy();
    expect(hints.PRE_VOTE_HINT_LINKS.login.href).toBe('/login');
    expect(hints.PRE_VOTE_HINT_LINKS.profile.href).toBe('/profile');
    expect(hintsSource).not.toMatch(FORBIDDEN_ELIGIBILITY_OUTCOME);
    expect(hintsSource).not.toMatch(FORBIDDEN_DEBUG_LEAKAGE);
  });

  it('keeps registration no-auto-login boundary for future state copy polish', async () => {
    const registration = await loadModule('public/frontend/registration-page.js');
    const registrationSource = await readFile(
      join(process.cwd(), 'public/frontend/registration-page.js'),
      'utf8',
    );
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
    expect(registrationSource).toContain('resolvePublicErrorUserMessage');
    expect(registrationSource).not.toContain("fetchImpl('/users/me'");
    expect(registrationSource).not.toContain("fetchImpl('/login/session'");
    expect(registrationSource).not.toMatch(FORBIDDEN_STORAGE);
  });

  it('keeps vote-by-index body and quality_badge presentation boundaries', async () => {
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
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: 'positive_feedback' })).toBe(
      true,
    );
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: null })).toBe(false);
  });

  it('keeps results demo intro distinct and profile two-field boundary', async () => {
    const resultsHtml = await readFile(join(process.cwd(), 'public/results.html'), 'utf8');
    const profileSource = await readFile(
      join(process.cwd(), 'public/frontend/profile-page.js'),
      'utf8',
    );

    expect(resultsHtml).toContain('results-page-demo-intro');
    expect(resultsHtml).not.toMatch(/results-page-demo-intro[\s\S]*style="/);
    expect(profileSource).toContain("'birth_year_month'");
    expect(profileSource).toContain("'residential_region'");
    expect(profileSource).toContain("fetchImpl('/users/me/profile'");
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
    expect(repository).not.toContain('Phase 214');
    expect(repository).not.toContain('Phase 214-R');
  });
});
