import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_223_DOC =
  'docs/www-project-phase-223-home-header-auth-state-onboarding-copy-runtime-v1.md';
const PHASE_224_DOC =
  'docs/www-project-phase-224-home-header-auth-state-onboarding-copy-runtime-review-checkpoint-v1.md';

const PHASE_223_TOUCHED_MODULES = [
  'public/frontend/public-mvp-ui.js',
  'public/frontend/auth-state-copy.js',
  'public/frontend/public-mvp-home.js',
] as const;

const FORBIDDEN_DEBUG_LEAKAGE =
  /request_id|requestId|trace_id|traceId|stack trace|internal code|error_code/i;

const FORBIDDEN_STORAGE = /localStorage|sessionStorage|document\.cookie|Set-Cookie/i;

const FORBIDDEN_ELIGIBILITY_OUTCOME =
  /你符合資格|你不符合資格|已投過票|可以投票|一定能投票|can_vote|age_passed|region_passed/i;

const FORBIDDEN_AUTO_LOGIN =
  /auto-login|自動建立.*session|自動登入後|Set-Cookie/i;

function stripJsComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 224 home header auth state onboarding copy runtime review checkpoint', () => {
  it('documents Phase 224 review checkpoint in README', async () => {
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');
    expect(readme).toContain('Phase 224');
    expect(readme).toContain(PHASE_224_DOC);
    expect(readme).toContain('onboarding copy runtime review checkpoint');
  });

  it('keeps Phase 223 delivery documented and runtime modules free of phase markers', async () => {
    const delivery = await readFile(join(process.cwd(), PHASE_223_DOC), 'utf8');
    const review = await readFile(join(process.cwd(), PHASE_224_DOC), 'utf8');

    expect(delivery).toContain('copy-only');
    expect(review).toContain('APPROVED');
    expect(review).toContain(
      'APPROVED — Phase 223 Home + Header/Auth-State onboarding copy runtime patch is copy-only; no runtime/API/DB/backend/auth/registration/profile/vote/result/creator/privacy drift identified.',
    );

    for (const relativePath of [
      'public/frontend/auth-state-copy.js',
      'public/frontend/public-mvp-home.js',
    ] as const) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 223');
      expect(source, relativePath).not.toContain('Phase 224');
    }
  });

  it('keeps auth-state-copy.js re-exporting shared onboarding copy without auth runtime', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const auth = await loadModule('public/frontend/auth-state-copy.js');
    const authSource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/auth-state-copy.js'), 'utf8'),
    );

    expect(auth.AUTH_STATE_COPY.guestChipTitle).toBe(publicUi.PUBLIC_AUTH_GUEST_CHIP_TITLE);
    expect(auth.AUTH_STATE_COPY.bannerGuestBody).toBe(publicUi.PUBLIC_AUTH_BANNER_GUEST_BODY);
    expect(publicUi.PUBLIC_AUTH_BANNER_GUEST_BODY).toContain('不會自動登入');
    expect(publicUi.PUBLIC_AUTH_BANNER_GUEST_BODY).toContain('會拒絕存取');
    expect(publicUi.PUBLIC_AUTH_BANNER_GUEST_BODY).not.toMatch(/fail closed/i);
    expect(publicUi.PUBLIC_AUTH_STATE_ONBOARDING_MESSAGES).toContain(
      publicUi.PUBLIC_AUTH_GUEST_CHIP_TITLE,
    );
    expect(authSource).toContain('PUBLIC_AUTH_BANNER_GUEST_BODY');
    expect(authSource).not.toMatch(/\bfetch\s*\(/);
    expect(authSource).not.toMatch(FORBIDDEN_STORAGE);
  });

  it('keeps public-mvp-home.js syncing copy into mount points without API calls', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const home = await loadModule('public/frontend/public-mvp-home.js');
    const homeSource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/public-mvp-home.js'), 'utf8'),
    );
    const documentObject = {
      getElementById(id: string) {
        if (
          id === 'home-sample-polls-section-note' ||
          id === 'home-static-examples-footer-note' ||
          id === 'home-account-flow-note'
        ) {
          return { replaceChildren: vi.fn(), append: vi.fn() };
        }
        if (id === 'home-hero-lead') {
          return { textContent: '' };
        }
        return null;
      },
      querySelector: () => null,
      querySelectorAll: () => [],
      createElement: (tag: string) => {
        const element: Record<string, unknown> = { href: '', textContent: '' };
        if (tag === 'a') {
          element.append = vi.fn();
        }
        if (tag === 'code') {
          element.textContent = '';
        }
        return element;
      },
      createTextNode: (text: string) => ({ text }),
    };

    home.syncHomePageOnboardingCopy(documentObject);

    expect(publicUi.PUBLIC_HOME_ACCOUNT_FLOW_REGISTRATION_NOTE).toContain('不會自動登入');
    expect(publicUi.PUBLIC_HOME_SAMPLE_POLLS_SECTION_NOTE).toContain('靜態範例');
    expect(homeSource).toContain('syncHomePageAccountFlowNote');
    expect(homeSource).toContain('syncHomePageSamplePollsSectionNote');
    expect(homeSource).toContain('syncHomePageStaticExamplesFooterNote');
    expect(homeSource).not.toMatch(/\bfetch\s*\(/);
    expect(homeSource).not.toMatch(FORBIDDEN_STORAGE);
    expect(homeSource).not.toMatch(FORBIDDEN_ELIGIBILITY_OUTCOME);
  });

  it('keeps public/index.html static fallback and mount points only', async () => {
    const indexHtml = await readFile(join(process.cwd(), 'public/index.html'), 'utf8');

    for (const mountId of [
      'home-account-flow-note',
      'home-sample-polls-section-note',
      'home-static-examples-footer-note',
    ]) {
      expect(indexHtml).toContain(`id="${mountId}"`);
    }

    expect(indexHtml).toContain('不會自動登入');
    expect(indexHtml).toContain('/registration');
    expect(indexHtml).toContain('/login');
    expect(indexHtml).toContain('public-mvp-home.js');
    expect(indexHtml).not.toMatch(FORBIDDEN_AUTO_LOGIN);
    expect(indexHtml).not.toMatch(/\/users\/me/);
  });

  it('keeps PUBLIC_AUTH_STATE_ONBOARDING_MESSAGES allowlisted and profile-completion copy safe', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const prompt = await loadModule('public/frontend/profile-completion-prompt.js');
    const uiSource = await readFile(join(process.cwd(), 'public/frontend/public-mvp-ui.js'), 'utf8');

    expect(uiSource).toContain('PUBLIC_AUTH_STATE_ONBOARDING_MESSAGES');
    expect(publicUi.PUBLIC_AUTH_STATE_ONBOARDING_MESSAGES).toContain(
      publicUi.PUBLIC_AUTH_BANNER_GUEST_BODY,
    );
    expect(prompt.PROFILE_COMPLETION_PROMPT_MESSAGE).toBe(
      publicUi.PUBLIC_PROFILE_COMPLETION_PROMPT_HINT,
    );
    expect(publicUi.PUBLIC_PROFILE_COMPLETION_PROMPT_HINT).toMatch(/出生年月/);
    expect(publicUi.PUBLIC_PROFILE_COMPLETION_PROMPT_HINT).toMatch(/居住地區/);
    expect(publicUi.PUBLIC_VOTE_PRE_VOTE_INCOMPLETE_PROFILE_HINT).toBe(
      publicUi.PUBLIC_PROFILE_COMPLETION_PROMPT_HINT,
    );
    expect(publicUi.PUBLIC_PROFILE_COMPLETION_PROMPT_HINT).not.toMatch(
      FORBIDDEN_ELIGIBILITY_OUTCOME,
    );

    for (const message of publicUi.PUBLIC_AUTH_STATE_ONBOARDING_MESSAGES) {
      expect(message).not.toMatch(FORBIDDEN_DEBUG_LEAKAGE);
    }
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
        display_name: 'Review Checkpoint User',
        birth_year_month: '1998-07',
        residential_region: 'TW-TPE',
      },
      credential: 'proof',
      fetchImpl,
    });

    expect(fetchCalls).toEqual(['/registration']);
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
  });

  it('keeps Phase 223 touched modules free of storage and forbidden copy patterns', async () => {
    for (const relativePath of PHASE_223_TOUCHED_MODULES) {
      const source = stripJsComments(
        await readFile(join(process.cwd(), relativePath), 'utf8'),
      );
      expect(source, relativePath).not.toMatch(FORBIDDEN_STORAGE);
      expect(source, relativePath).not.toMatch(FORBIDDEN_DEBUG_LEAKAGE);
      expect(source, relativePath).not.toMatch(FORBIDDEN_ELIGIBILITY_OUTCOME);
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
    expect(repository).not.toContain('Phase 223');
    expect(repository).not.toContain('Phase 224');
  });
});
