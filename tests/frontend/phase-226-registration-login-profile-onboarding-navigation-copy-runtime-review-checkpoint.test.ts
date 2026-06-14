import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_225_DOC =
  'docs/www-project-phase-225-registration-login-profile-onboarding-navigation-copy-runtime-v1.md';
const PHASE_226_DOC =
  'docs/www-project-phase-226-registration-login-profile-onboarding-navigation-copy-runtime-review-checkpoint-v1.md';

const PHASE_225_TOUCHED_MODULES = [
  'public/frontend/public-mvp-ui.js',
  'public/frontend/registration-page.js',
  'public/frontend/login-page.js',
  'public/frontend/profile-page.js',
] as const;

const FORBIDDEN_DEBUG_LEAKAGE =
  /request_id|requestId|trace_id|traceId|stack trace|internal code|error_code/i;

const FORBIDDEN_STORAGE = /localStorage|sessionStorage|document\.cookie|Set-Cookie/i;

const FORBIDDEN_ELIGIBILITY_OUTCOME =
  /你符合資格|你不符合資格|已投過票|可以投票|一定能投票|can_vote|age_passed|region_passed/i;

const FORBIDDEN_ENGINEER_COPY = /fail closed|AUTH_REQUIRED/i;

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

describe('Phase 226 registration login profile onboarding navigation copy runtime review checkpoint', () => {
  it('documents Phase 226 review checkpoint in README', async () => {
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');
    expect(readme).toContain('Phase 226');
    expect(readme).toContain(PHASE_226_DOC);
    expect(readme).toContain('onboarding navigation copy runtime review checkpoint');
  });

  it('keeps Phase 225 delivery documented and runtime modules free of phase markers', async () => {
    const delivery = await readFile(join(process.cwd(), PHASE_225_DOC), 'utf8');
    const review = await readFile(join(process.cwd(), PHASE_226_DOC), 'utf8');

    expect(delivery).toContain('copy-only');
    expect(review).toContain('APPROVED');
    expect(review).toContain(
      'APPROVED — Phase 225 Registration / Login / Profile onboarding navigation copy runtime patch is copy-only; no runtime/API/DB/backend/auth/registration/profile/vote/result/creator/privacy drift identified.',
    );

    for (const relativePath of [
      'public/frontend/registration-page.js',
      'public/frontend/login-page.js',
      'public/frontend/profile-page.js',
    ] as const) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 225');
      expect(source, relativePath).not.toContain('Phase 226');
    }
  });

  it('keeps PUBLIC_AUTH_ACCOUNT_ONBOARDING_MESSAGES allowlisted and profile copy safe', async () => {
    const ui = await loadModule('public/frontend/public-mvp-ui.js');
    const uiSource = await readFile(join(process.cwd(), 'public/frontend/public-mvp-ui.js'), 'utf8');

    expect(uiSource).toContain('PUBLIC_AUTH_ACCOUNT_ONBOARDING_MESSAGES');
    expect(ui.PUBLIC_AUTH_ACCOUNT_ONBOARDING_MESSAGES).toContain(
      ui.PUBLIC_REGISTRATION_SUCCESS_MESSAGE,
    );
    expect(ui.PUBLIC_AUTH_ACCOUNT_ONBOARDING_MESSAGES).toContain(
      ui.PUBLIC_LOGIN_PROFILE_NEXT_STEP_HINT,
    );
    expect(ui.PUBLIC_REGISTRATION_SUCCESS_MESSAGE).toContain('不會自動登入');
    expect(ui.PUBLIC_LOGIN_PAGE_BANNER_BODY).toContain('會拒絕存取');
    expect(ui.PUBLIC_LOGIN_PAGE_BANNER_BODY).not.toMatch(FORBIDDEN_ENGINEER_COPY);
    expect(ui.PUBLIC_LOGIN_PAGE_LEAD_SECONDARY).not.toMatch(FORBIDDEN_ENGINEER_COPY);
    expect(ui.PUBLIC_PROFILE_PAGE_LEAD).toMatch(/出生年月/);
    expect(ui.PUBLIC_PROFILE_PAGE_LEAD).toMatch(/居住地區/);
    expect(ui.PUBLIC_PROFILE_PAGE_LEAD).toContain('不表示可保證符合或不符合');
    expect(ui.PUBLIC_PROFILE_SIGNED_IN_GUIDANCE_NOTE).toContain(
      '不表示可保證符合或不符合',
    );
    expect(ui.PUBLIC_PROFILE_SIGNED_IN_GUIDANCE_NOTE).not.toMatch(
      FORBIDDEN_ELIGIBILITY_OUTCOME,
    );

    for (const message of ui.PUBLIC_AUTH_ACCOUNT_ONBOARDING_MESSAGES) {
      expect(message).not.toMatch(FORBIDDEN_DEBUG_LEAKAGE);
    }
  });

  it('keeps registration onboarding sync copy-only without new API calls', async () => {
    const ui = await loadModule('public/frontend/public-mvp-ui.js');
    const registration = await loadModule('public/frontend/registration-page.js');
    const registrationSource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/registration-page.js'), 'utf8'),
    );
    const banner = { textContent: '' };
    const successMessage = { textContent: '' };
    const documentObject = {
      getElementById(id: string) {
        if (id === 'registration-page-banner') {
          return banner;
        }
        if (id === 'registration-success-message') {
          return successMessage;
        }
        if (id === 'registration-heading' || id === 'registration-success-heading') {
          return { textContent: '' };
        }
        if (id === 'registration-lead-primary' || id === 'registration-lead-secondary') {
          return { textContent: '' };
        }
        return null;
      },
      querySelector: () => null,
    };

    registration.syncRegistrationPageOnboardingCopy(documentObject);
    expect(banner.textContent).toBe(ui.PUBLIC_REGISTRATION_PAGE_BANNER_BODY);
    expect(successMessage.textContent).toBe(ui.PUBLIC_REGISTRATION_SUCCESS_MESSAGE);
    expect(registrationSource).toContain('syncRegistrationPageBanner');
    expect(registrationSource).toContain("fetchImpl('/registration'");
    expect(registrationSource).not.toMatch(/\/users\/me/);
  });

  it('keeps login onboarding navigation hints without session behavior drift', async () => {
    const ui = await loadModule('public/frontend/public-mvp-ui.js');
    const login = await loadModule('public/frontend/login-page.js');
    const loginSource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/login-page.js'), 'utf8'),
    );
    const profileHint = { textContent: '' };
    const registrationHint = {
      replaceChildren: vi.fn(),
      append: vi.fn(),
    };
    const documentObject = {
      getElementById(id: string) {
        if (id === 'login-page-banner') {
          return { textContent: '' };
        }
        if (id === 'login-profile-next-step-hint') {
          return profileHint;
        }
        if (id === 'login-registration-crosslink-hint') {
          return registrationHint;
        }
        if (
          id === 'login-heading' ||
          id === 'login-lead-primary' ||
          id === 'login-lead-secondary' ||
          id === 'login-credential' ||
          id === 'login-shell-hint' ||
          id === 'login-form-ready-hint' ||
          id === 'login-shell-submit' ||
          id === 'login-register-cta' ||
          id === 'login-home-cta'
        ) {
          return { textContent: '' };
        }
        return null;
      },
      querySelector: () => null,
      querySelectorAll: () => [],
      createElement: (tag: string) => ({ href: '', textContent: '' }),
      createTextNode: (text: string) => ({ text }),
    };

    login.syncLoginPageOnboardingCopy(documentObject);
    expect(profileHint.textContent).toBe(ui.PUBLIC_LOGIN_PROFILE_NEXT_STEP_HINT);
    expect(registrationHint.replaceChildren).toHaveBeenCalled();
    expect(loginSource).toContain("fetchImpl('/login/session'");
    expect(loginSource).toContain('syncLoginOnboardingNavigationHints');
    expect(loginSource).not.toMatch(FORBIDDEN_STORAGE);
  });

  it('keeps profile onboarding sync copy-only with profile API field boundary', async () => {
    const ui = await loadModule('public/frontend/public-mvp-ui.js');
    const profile = await loadModule('public/frontend/profile-page.js');
    const profileSource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/profile-page.js'), 'utf8'),
    );
    const pageLead = { textContent: '' };
    const unauthMessage = { textContent: '' };
    const guidance = { textContent: '' };
    const documentObject = {
      getElementById(id: string) {
        if (id === 'profile-page-lead') {
          return pageLead;
        }
        if (id === 'profile-unauth-message') {
          return unauthMessage;
        }
        if (id === 'profile-signed-in-guidance') {
          return guidance;
        }
        if (id === 'profile-heading' || id === 'profile-unauth-heading') {
          return { textContent: '' };
        }
        if (id === 'profile-login-cta' || id === 'profile-register-cta') {
          return { textContent: '' };
        }
        return null;
      },
      querySelector: () => null,
    };

    profile.syncProfilePageOnboardingCopy(documentObject);
    expect(pageLead.textContent).toBe(ui.PUBLIC_PROFILE_PAGE_LEAD);
    expect(unauthMessage.textContent).toBe(ui.PUBLIC_PROFILE_VIEW_SIGN_IN_REQUIRED_MESSAGE);
    expect(guidance.textContent).toBe(ui.PUBLIC_PROFILE_SIGNED_IN_GUIDANCE_NOTE);
    expect(profileSource).toContain("fetchImpl('/users/me/profile'");
    expect(profileSource).toContain('birth_year_month');
    expect(profileSource).toContain('residential_region');
    expect(profileSource).not.toMatch(FORBIDDEN_ELIGIBILITY_OUTCOME);
  });

  it('keeps static HTML fallback aligned with shared onboarding constants', async () => {
    const ui = await loadModule('public/frontend/public-mvp-ui.js');
    const registrationHtml = await readFile(
      join(process.cwd(), 'public/registration.html'),
      'utf8',
    );
    const loginHtml = await readFile(join(process.cwd(), 'public/login.html'), 'utf8');
    const profileHtml = await readFile(join(process.cwd(), 'public/profile.html'), 'utf8');

    expect(registrationHtml).toContain('data-login-state-read="disabled"');
    expect(registrationHtml).toContain(ui.PUBLIC_REGISTRATION_PAGE_BANNER_BODY);
    expect(registrationHtml).toContain(ui.PUBLIC_REGISTRATION_SUCCESS_MESSAGE);
    expect(loginHtml).toContain(ui.PUBLIC_LOGIN_PAGE_BANNER_BODY);
    expect(loginHtml).toContain(ui.PUBLIC_LOGIN_PROFILE_NEXT_STEP_HINT);
    expect(loginHtml).not.toMatch(FORBIDDEN_ENGINEER_COPY);
    expect(profileHtml).toContain(ui.PUBLIC_PROFILE_PAGE_LEAD);
    expect(profileHtml).toContain(ui.PUBLIC_PROFILE_SIGNED_IN_GUIDANCE_NOTE);
    expect(profileHtml).toContain(ui.PUBLIC_PROFILE_VIEW_SIGN_IN_REQUIRED_MESSAGE);
    expect(registrationHtml).not.toMatch(FORBIDDEN_AUTO_LOGIN);
    expect(registrationHtml).not.toMatch(/\/users\/me/);
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

  it('keeps Phase 225 touched modules free of storage and forbidden copy patterns', async () => {
    for (const relativePath of PHASE_225_TOUCHED_MODULES) {
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
    expect(repository).not.toContain('Phase 225');
    expect(repository).not.toContain('Phase 226');
  });
});
