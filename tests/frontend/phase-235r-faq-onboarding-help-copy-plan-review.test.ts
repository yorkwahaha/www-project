import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_235_DOC =
  'docs/www-project-phase-235-faq-onboarding-help-copy-plan-v1.md';
const PHASE_235R_DOC =
  'docs/www-project-phase-235r-faq-onboarding-help-copy-plan-review-v1.md';

const FAQ_HELP_RUNTIME_MODULES = [
  'public/faq.html',
  'public/trust-levels.html',
  'public/frontend/public-mvp-ui.js',
  'public/frontend/public-mvp-home.js',
  'public/frontend/vote-page.js',
  'public/frontend/my-polls-page.js',
  'public/frontend/quality-feedback-badge.js',
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

describe('Phase 235-R faq onboarding help copy plan review', () => {
  it('documents Phase 235-R review in README', async () => {
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');
    expect(readme).toContain('Phase 235-R');
    expect(readme).toContain(PHASE_235R_DOC);
    expect(readme).toContain('FAQ onboarding / help copy plan review');
  });

  it('keeps Phase 235 plan as plan-only without runtime module markers', async () => {
    const plan = await readFile(join(process.cwd(), PHASE_235_DOC), 'utf8');
    const review = await readFile(join(process.cwd(), PHASE_235R_DOC), 'utf8');

    expect(plan).toContain('plan only');
    expect(plan).toContain('/faq');
    expect(plan).toContain('/trust-levels');
    expect(plan).toContain('faq.html');
    expect(plan).toContain('Phase 235-R');
    expect(review).toContain('copy-only');
    expect(review).toContain('APPROVED');

    for (const relativePath of FAQ_HELP_RUNTIME_MODULES) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 235');
      expect(source, relativePath).not.toContain('Phase 235-R');
      expect(source, relativePath).not.toContain('Phase 236');
    }
  });

  it('keeps faq.html engineer-facing residue as future copy cleanup target', async () => {
    const faqHtml = await readFile(join(process.cwd(), 'public/faq.html'), 'utf8');
    const plan = await readFile(join(process.cwd(), PHASE_235_DOC), 'utf8');

    expect(faqHtml).toContain('X-User-Id');
    expect(faqHtml).toContain('production user-auth wiring later');
    expect(plan).toContain('Engineer-facing residue');
    expect(plan).toContain('X-User-Id');
    expect(plan).toContain('creator_session');
    expect(plan).toContain('production user-auth wiring later');
  });

  it('keeps completed onboarding allowlists and FAQ link label available', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const faqHtml = await readFile(join(process.cwd(), 'public/faq.html'), 'utf8');
    const trustLevelsHtml = await readFile(
      join(process.cwd(), 'public/trust-levels.html'),
      'utf8',
    );

    expect(publicUi.PUBLIC_AUTH_STATE_ONBOARDING_MESSAGES.length).toBeGreaterThan(0);
    expect(publicUi.PUBLIC_AUTH_ACCOUNT_ONBOARDING_MESSAGES.length).toBeGreaterThan(0);
    expect(publicUi.PUBLIC_CREATOR_ONBOARDING_MESSAGES.length).toBeGreaterThan(0);
    expect(publicUi.PUBLIC_VOTE_RESULTS_ONBOARDING_MESSAGES.length).toBeGreaterThan(0);
    expect(publicUi.PUBLIC_VOTE_POLICY_FAQ_LINK_LABEL).toBe('常見問題');
    expect(publicUi.PUBLIC_PROFILE_COMPLETION_PROMPT_HINT).toBeTruthy();
    expect(publicUi.PUBLIC_VOTE_POLICY_COLLECTING_HIDDEN_TEXT).toBeTruthy();
    expect(faqHtml).toContain('id="faq-heading"');
    expect(faqHtml).toContain('/trust-levels');
    expect(trustLevelsHtml).toContain('/faq');
    expect('PUBLIC_FAQ_ONBOARDING_MESSAGES' in publicUi).toBe(false);
  });

  it('keeps FAQ cross-links as static href-only surfaces', async () => {
    const votePage = await readFile(join(process.cwd(), 'public/frontend/vote-page.js'), 'utf8');
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');

    expect(votePage).toContain('PUBLIC_VOTE_POLICY_FAQ_LINK_LABEL');
    expect(votePage).toContain('/faq');
    expect(publicUi.PUBLIC_VOTE_POLICY_FAQ_LINK_LABEL).toBe('常見問題');
    expect(votePage).not.toMatch(FORBIDDEN_ELIGIBILITY_OUTCOME);
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

  it('keeps FAQ/help modules free of forbidden debug and storage patterns', async () => {
    for (const relativePath of FAQ_HELP_RUNTIME_MODULES) {
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
    expect(repository).not.toContain('Phase 235-R');
  });
});
