import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_236_DOC =
  'docs/www-project-phase-236-faq-onboarding-help-copy-runtime-v1.md';
const PHASE_237_DOC =
  'docs/www-project-phase-237-faq-onboarding-help-copy-runtime-review-checkpoint-v1.md';

const PHASE_236_TOUCHED_MODULES = [
  'public/frontend/public-mvp-ui.js',
  'public/frontend/faq-page.js',
  'public/faq.html',
] as const;

const FORBIDDEN_ELIGIBILITY_OUTCOME =
  /你符合資格|一定能投票|can_vote|age_passed|region_passed/i;

const FORBIDDEN_ENGINEER_COPY =
  /X-User-Id|creator_session|production user-auth wiring|fail closed|AUTH_REQUIRED|UserAuthResolver/i;

const FORBIDDEN_DEBUG_LEAKAGE =
  /request_id|requestId|trace_id|traceId|stack trace|internal code|error_code/i;

const FORBIDDEN_STORAGE = /localStorage|sessionStorage|document\.cookie|Set-Cookie/i;

const FORBIDDEN_BACKEND_ECHO =
  /error\.message|body\.message|apiError\.message|response\.text\(\)|JSON\.stringify\(error/i;

const FAQ_MOUNT_POINT_IDS = [
  'faq-page-hero-lead',
  'faq-account-flow-intro',
  'faq-account-flow-login-step',
  'faq-account-flow-profile-step',
  'faq-creator-flow-demo-step',
  'faq-creator-flow-live-step',
  'faq-creator-flow-my-polls-step',
  'faq-participant-vote-step',
  'faq-participant-demo-step',
  'faq-participant-results-step',
  'faq-participant-collecting-step',
  'faq-profile-fields-purpose-lead',
  'faq-profile-fields-purpose-body',
  'faq-profile-eligibility-hint',
  'faq-profile-demo-boundary-note',
  'faq-collecting-hidden-lead',
  'faq-collecting-hidden-purpose',
  'faq-eligibility-failure-reference-tail',
] as const;

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 237 faq onboarding help copy runtime review checkpoint', () => {
  it('documents Phase 237 review checkpoint in README', async () => {
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');
    expect(readme).toContain('Phase 237');
    expect(readme).toContain(PHASE_237_DOC);
    expect(readme).toContain('FAQ onboarding / help copy runtime review checkpoint');
  });

  it('keeps Phase 236 delivery documented and runtime modules free of phase markers', async () => {
    const delivery = await readFile(join(process.cwd(), PHASE_236_DOC), 'utf8');
    const review = await readFile(join(process.cwd(), PHASE_237_DOC), 'utf8');

    expect(delivery).toContain('copy-only');
    expect(review).toContain('APPROVED');
    expect(review).toContain(
      'APPROVED — Phase 236 FAQ onboarding / help copy runtime patch is copy-only; no runtime/API/DB/backend/auth/vote/result/creator/privacy drift identified.',
    );

    for (const relativePath of PHASE_236_TOUCHED_MODULES) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 236');
      expect(source, relativePath).not.toContain('Phase 237');
    }
  });

  it('keeps PUBLIC_FAQ_ONBOARDING_MESSAGES as frontend-owned copy allowlist', async () => {
    const ui = await loadModule('public/frontend/public-mvp-ui.js');

    expect(ui.PUBLIC_FAQ_ONBOARDING_MESSAGES).toContain(ui.PUBLIC_FAQ_PAGE_HERO_LEAD);
    expect(ui.PUBLIC_FAQ_ONBOARDING_MESSAGES).toContain(ui.PUBLIC_FAQ_ACCOUNT_FLOW_INTRO);
    expect(ui.PUBLIC_FAQ_ONBOARDING_MESSAGES).toContain(ui.PUBLIC_FAQ_CREATOR_FLOW_MY_POLLS_STEP);
    expect(ui.PUBLIC_FAQ_ONBOARDING_MESSAGES).toContain(ui.PUBLIC_FAQ_PARTICIPANT_VOTE_STEP);
    expect(ui.PUBLIC_FAQ_ACCOUNT_FLOW_INTRO).toContain('不會自動登入');
    expect(ui.PUBLIC_FAQ_ACCOUNT_FLOW_PROFILE_STEP).toContain('不表示可保證');
    expect(ui.PUBLIC_FAQ_CREATOR_FLOW_MY_POLLS_STEP).toContain('建立流程');
    expect(ui.PUBLIC_FAQ_PARTICIPANT_COLLECTING_STEP).toBe(
      ui.PUBLIC_VOTE_POLICY_COLLECTING_HIDDEN_TEXT,
    );
    expect(ui.PUBLIC_HINT_TEXT_MESSAGES).toEqual(
      expect.arrayContaining(ui.PUBLIC_FAQ_ONBOARDING_MESSAGES),
    );

    for (const message of ui.PUBLIC_FAQ_ONBOARDING_MESSAGES) {
      expect(message).not.toMatch(FORBIDDEN_ELIGIBILITY_OUTCOME);
      expect(message).not.toMatch(FORBIDDEN_ENGINEER_COPY);
    }
  });

  it('keeps syncFaqPageOnboardingCopy limited to existing mount points', async () => {
    const ui = await loadModule('public/frontend/public-mvp-ui.js');
    const faqPage = await loadModule('public/frontend/faq-page.js');
    const mountPoints = Object.fromEntries(
      FAQ_MOUNT_POINT_IDS.map((id) => [id, { textContent: '' }]),
    );
    const documentObject = {
      getElementById(id: string) {
        return mountPoints[id] ?? null;
      },
    };

    faqPage.syncFaqPageOnboardingCopy(documentObject);

    expect(mountPoints['faq-page-hero-lead'].textContent).toBe(ui.PUBLIC_FAQ_PAGE_HERO_LEAD);
    expect(mountPoints['faq-account-flow-intro'].textContent).toBe(ui.PUBLIC_FAQ_ACCOUNT_FLOW_INTRO);
    expect(mountPoints['faq-creator-flow-demo-step'].textContent).toBe(
      ui.PUBLIC_FAQ_CREATOR_FLOW_DEMO_STEP,
    );
    expect(mountPoints['faq-participant-vote-step'].textContent).toBe(
      ui.PUBLIC_FAQ_PARTICIPANT_VOTE_STEP,
    );
    expect(mountPoints['faq-profile-demo-boundary-note'].textContent).toBe(
      ui.PUBLIC_FAQ_PROFILE_DEMO_BOUNDARY_NOTE,
    );
    expect(mountPoints['faq-eligibility-failure-reference-tail'].textContent).toBe(
      ui.PUBLIC_FAQ_ELIGIBILITY_FAILURE_REFERENCE_NOTE,
    );
  });

  it('keeps bootstrapFaqPage free of fetch, storage, and backend echo', async () => {
    const faqPageSource = await readFile(
      join(process.cwd(), 'public/frontend/faq-page.js'),
      'utf8',
    );

    expect(faqPageSource).toContain('bootstrapFaqPage');
    expect(faqPageSource).toContain('syncFaqPageOnboardingCopy');
    expect(faqPageSource).not.toMatch(/\bfetch\b/);
    expect(faqPageSource).not.toMatch(FORBIDDEN_STORAGE);
    expect(faqPageSource).not.toMatch(FORBIDDEN_BACKEND_ECHO);
  });

  it('keeps faq.html static fallback aligned and free of engineer-facing user copy', async () => {
    const ui = await loadModule('public/frontend/public-mvp-ui.js');
    const faqHtml = await readFile(join(process.cwd(), 'public/faq.html'), 'utf8');

    for (const mountId of FAQ_MOUNT_POINT_IDS) {
      expect(faqHtml).toContain(`id="${mountId}"`);
    }

    expect(faqHtml).toContain(ui.PUBLIC_FAQ_PAGE_HERO_LEAD);
    expect(faqHtml).toContain(ui.PUBLIC_FAQ_ACCOUNT_FLOW_INTRO);
    expect(faqHtml).toContain(ui.PUBLIC_FAQ_CREATOR_FLOW_LIVE_STEP);
    expect(faqHtml).toContain(ui.PUBLIC_FAQ_PARTICIPANT_COLLECTING_STEP);
    expect(faqHtml).toContain('正式投票');
    expect(faqHtml).toContain('試填作答');
    expect(faqHtml).not.toContain('Official Vote');
    expect(faqHtml).not.toContain('Reference Answer');
    expect(faqHtml).not.toMatch(FORBIDDEN_ENGINEER_COPY);
    expect(faqHtml).not.toMatch(FORBIDDEN_ELIGIBILITY_OUTCOME);
    expect(faqHtml).toContain('/frontend/faq-page.js');
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
        display_name: 'FAQ Review User',
        birth_year_month: '1998-07',
        residential_region: 'TW-TPE',
      },
      credential: 'proof',
      fetchImpl,
    });

    expect(fetchCalls).toEqual(['/registration']);
  });

  it('keeps FAQ modules free of forbidden debug patterns', async () => {
    for (const relativePath of PHASE_236_TOUCHED_MODULES) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toMatch(FORBIDDEN_DEBUG_LEAKAGE);
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
    expect(repository).not.toContain('Phase 237');
  });
});
