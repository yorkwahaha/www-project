import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_222_DOC =
  'docs/www-project-phase-222-public-mvp-onboarding-navigation-copy-consistency-plan-v1.md';
const PHASE_222R_DOC =
  'docs/www-project-phase-222r-public-mvp-onboarding-navigation-copy-consistency-plan-review-checkpoint-v1.md';

const ONBOARDING_NAV_RUNTIME_MODULES = [
  'public/frontend/auth-state-copy.js',
  'public/frontend/public-mvp-layout.js',
  'public/frontend/login-state-ui.js',
  'public/frontend/login-state-read.js',
  'public/frontend/registration-page.js',
  'public/frontend/login-page.js',
  'public/frontend/profile-completion-prompt.js',
  'public/frontend/profile-page.js',
  'public/frontend/create-poll-page.js',
  'public/frontend/my-polls-page.js',
  'public/frontend/vote-page.js',
  'public/frontend/official-vote-pre-vote-hints.js',
  'public/frontend/result-page.js',
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

describe('Phase 222-R public MVP onboarding navigation copy consistency plan review checkpoint', () => {
  it('documents Phase 222-R review checkpoint in README', async () => {
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');
    expect(readme).toContain('Phase 222-R');
    expect(readme).toContain(PHASE_222R_DOC);
    expect(readme).toContain(
      'onboarding navigation copy consistency plan review checkpoint',
    );
  });

  it('keeps Phase 222 plan as plan-only without runtime module markers', async () => {
    const plan = await readFile(join(process.cwd(), PHASE_222_DOC), 'utf8');
    const review = await readFile(join(process.cwd(), PHASE_222R_DOC), 'utf8');

    expect(plan).toContain('plan only');
    expect(plan).toContain('auth-state-copy.js');
    expect(plan).toContain('Phase 222-R');
    expect(review).toContain('copy-only');

    for (const relativePath of ONBOARDING_NAV_RUNTIME_MODULES) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 222');
      expect(source, relativePath).not.toContain('Phase 222-R');
      expect(source, relativePath).not.toContain('Phase 223');
    }
  });

  it('keeps auth-state navigation copy from implying auto-login', async () => {
    const authCopy = await loadModule('public/frontend/auth-state-copy.js');
    const authSource = await readFile(
      join(process.cwd(), 'public/frontend/auth-state-copy.js'),
      'utf8',
    );

    expect(authCopy.AUTH_STATE_COPY.guestChipTitle).toContain('不會自動登入');
    expect(authCopy.AUTH_STATE_COPY.bannerGuestBody).toContain('不會自動登入');
    expect(authCopy.AUTH_STATE_COPY.guestSecondaryCta).toBeTruthy();
    expect(authSource).not.toMatch(FORBIDDEN_ELIGIBILITY_OUTCOME);
    expect(authSource).not.toMatch(FORBIDDEN_DEBUG_LEAKAGE);
    expect(authSource).not.toMatch(FORBIDDEN_STORAGE);
  });

  it('keeps registration routing to login after success without calling /users/me', async () => {
    const registration = await loadModule('public/frontend/registration-page.js');
    const registrationHtml = await readFile(
      join(process.cwd(), 'public/registration.html'),
      'utf8',
    );
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
    expect(registrationHtml).toContain('href="/login"');
    expect(registrationHtml).toContain('不會自動登入');
    expect(registrationSource).not.toContain("fetchImpl('/users/me'");
    expect(registrationSource).not.toContain("fetchImpl('/login/session'");
    expect(registrationSource).not.toMatch(FORBIDDEN_STORAGE);
  });

  it('keeps profile guidance limited to allowed profile fields', async () => {
    const prompt = await loadModule('public/frontend/profile-completion-prompt.js');
    const profileSource = await readFile(
      join(process.cwd(), 'public/frontend/profile-page.js'),
      'utf8',
    );
    const promptSource = await readFile(
      join(process.cwd(), 'public/frontend/profile-completion-prompt.js'),
      'utf8',
    );

    expect(prompt.PROFILE_COMPLETION_PROMPT_CTA_HREF).toBe('/profile');
    expect(prompt.isProfileIncomplete({ birth_year_month: null, residential_region: 'TW-TPE' })).toBe(
      true,
    );
    expect(prompt.isProfileIncomplete({ birth_year_month: '1998-07', residential_region: 'TW-TPE' })).toBe(
      false,
    );
    expect(profileSource).toContain("'birth_year_month'");
    expect(profileSource).toContain("'residential_region'");
    expect(promptSource).not.toMatch(FORBIDDEN_ELIGIBILITY_OUTCOME);
    expect(promptSource).not.toMatch(FORBIDDEN_DEBUG_LEAKAGE);
  });

  it('keeps vote and result guidance from exposing eligibility or weakening visibility', async () => {
    const hints = await loadModule('public/frontend/official-vote-pre-vote-hints.js');
    const voteHtml = await readFile(join(process.cwd(), 'public/vote.html'), 'utf8');
    const resultsHtml = await readFile(join(process.cwd(), 'public/results.html'), 'utf8');
    const hintsSource = await readFile(
      join(process.cwd(), 'public/frontend/official-vote-pre-vote-hints.js'),
      'utf8',
    );

    expect(hints.PRE_VOTE_HINT_COPY.anonymous).toBeTruthy();
    expect(hints.PRE_VOTE_HINT_LINKS.login.href).toBe('/login');
    expect(hints.PRE_VOTE_HINT_LINKS.profile.href).toBe('/profile');
    expect(voteHtml).toContain('/trust-levels');
    expect(voteHtml).not.toMatch(FORBIDDEN_ELIGIBILITY_OUTCOME);
    expect(resultsHtml).toContain('results-page-demo-intro');
    expect(hintsSource).not.toMatch(FORBIDDEN_ELIGIBILITY_OUTCOME);
    expect(hintsSource).not.toMatch(FORBIDDEN_DEBUG_LEAKAGE);
  });

  it('keeps creator guidance from altering creator session or lifecycle assumptions', async () => {
    const createPollSource = await readFile(
      join(process.cwd(), 'public/frontend/create-poll-page.js'),
      'utf8',
    );
    const myPollsSource = await readFile(
      join(process.cwd(), 'public/frontend/my-polls-page.js'),
      'utf8',
    );
    const createPollHtml = await readFile(join(process.cwd(), 'public/create-poll.html'), 'utf8');

    expect(createPollSource).toContain("fetchImpl('/creator/polls'");
    expect(myPollsSource).toContain("fetchImpl('/creator/session'");
    expect(myPollsSource).toContain("fetchImpl('/creator/polls'");
    expect(createPollHtml).toContain('/trust-levels');
    expect(createPollSource).not.toMatch(FORBIDDEN_ELIGIBILITY_OUTCOME);
    expect(myPollsSource).not.toMatch(FORBIDDEN_DEBUG_LEAKAGE);
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
    expect(repository).not.toContain('Phase 222');
    expect(repository).not.toContain('Phase 222-R');
  });
});
