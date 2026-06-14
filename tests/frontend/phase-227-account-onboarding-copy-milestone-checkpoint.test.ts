import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_227_DOC =
  'docs/www-project-phase-227-account-onboarding-copy-milestone-checkpoint-v1.md';

const ONBOARDING_COPY_MODULES = [
  'public/frontend/public-mvp-ui.js',
  'public/frontend/auth-state-copy.js',
  'public/frontend/public-mvp-home.js',
  'public/frontend/registration-page.js',
  'public/frontend/login-page.js',
  'public/frontend/profile-page.js',
] as const;

const FORBIDDEN_ELIGIBILITY_OUTCOME =
  /你符合資格|你不符合資格|已投過票|可以投票|一定能投票|can_vote|age_passed|region_passed/i;

const FORBIDDEN_DEBUG_LEAKAGE =
  /request_id|requestId|trace_id|traceId|stack trace|internal code|error_code/i;

const FORBIDDEN_ENGINEER_COPY = /fail closed|AUTH_REQUIRED/i;

const FORBIDDEN_STORAGE = /localStorage|sessionStorage|document\.cookie|Set-Cookie/i;

function stripJsComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 227 account onboarding copy milestone checkpoint', () => {
  it('confirms Phase 227 is docs/static only with README index reference', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_227_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(doc).toContain('Phase 227');
    expect(doc).toContain('Account Onboarding Copy Milestone Checkpoint');
    expect(doc).toContain('milestone checkpoint');
    expect(doc).toContain('no runtime change');
    expect(doc).toContain('no API change');
    expect(doc).toContain('no frontend change');
    expect(doc).toContain('no migration');
    expect(doc).toContain('no schema change');
    expect(doc).toContain('no CSS/HTML/JS copy changes');
    expect(doc).toContain(
      'APPROVED — Account onboarding copy milestone complete; no runtime/API/DB/backend/auth/vote/result/creator/profile/privacy drift identified.',
    );

    expect(readme).toContain('Phase 227');
    expect(readme).toContain(PHASE_227_DOC);
    expect(readme).toContain('Account onboarding copy milestone checkpoint');
  });

  it('keeps shared onboarding allowlists for home/header and account surfaces', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const auth = await loadModule('public/frontend/auth-state-copy.js');
    const uiSource = await readFile(join(process.cwd(), 'public/frontend/public-mvp-ui.js'), 'utf8');

    expect(uiSource).toContain('PUBLIC_AUTH_STATE_ONBOARDING_MESSAGES');
    expect(uiSource).toContain('PUBLIC_AUTH_ACCOUNT_ONBOARDING_MESSAGES');
    expect(publicUi.PUBLIC_AUTH_STATE_ONBOARDING_MESSAGES.length).toBeGreaterThan(0);
    expect(publicUi.PUBLIC_AUTH_ACCOUNT_ONBOARDING_MESSAGES.length).toBeGreaterThan(0);
    expect(publicUi.PUBLIC_AUTH_STATE_ONBOARDING_MESSAGES).toContain(
      publicUi.PUBLIC_AUTH_BANNER_GUEST_BODY,
    );
    expect(publicUi.PUBLIC_AUTH_ACCOUNT_ONBOARDING_MESSAGES).toContain(
      publicUi.PUBLIC_REGISTRATION_SUCCESS_MESSAGE,
    );
    expect(publicUi.PUBLIC_AUTH_ACCOUNT_ONBOARDING_MESSAGES).toContain(
      publicUi.PUBLIC_LOGIN_PROFILE_NEXT_STEP_HINT,
    );
    expect(auth.AUTH_STATE_COPY.bannerGuestBody).toBe(publicUi.PUBLIC_AUTH_BANNER_GUEST_BODY);
    expect(publicUi.PUBLIC_AUTH_BANNER_GUEST_BODY).toContain('不會自動登入');
    expect(publicUi.PUBLIC_AUTH_BANNER_GUEST_BODY).not.toMatch(FORBIDDEN_ENGINEER_COPY);

    for (const message of [
      ...publicUi.PUBLIC_AUTH_STATE_ONBOARDING_MESSAGES,
      ...publicUi.PUBLIC_AUTH_ACCOUNT_ONBOARDING_MESSAGES,
    ]) {
      expect(message).not.toMatch(FORBIDDEN_DEBUG_LEAKAGE);
    }
  });

  it('keeps home onboarding sync copy-only without API calls', async () => {
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
        return element;
      },
      createTextNode: (text: string) => ({ text }),
    };

    home.syncHomePageOnboardingCopy(documentObject);
    expect(publicUi.PUBLIC_HOME_ACCOUNT_FLOW_REGISTRATION_NOTE).toContain('不會自動登入');
    expect(homeSource).not.toMatch(/\bfetch\s*\(/);
    expect(homeSource).not.toMatch(FORBIDDEN_STORAGE);
  });

  it('keeps registration login profile onboarding copy aligned across static HTML and sync', async () => {
    const ui = await loadModule('public/frontend/public-mvp-ui.js');
    const registrationHtml = await readFile(
      join(process.cwd(), 'public/registration.html'),
      'utf8',
    );
    const loginHtml = await readFile(join(process.cwd(), 'public/login.html'), 'utf8');
    const profileHtml = await readFile(join(process.cwd(), 'public/profile.html'), 'utf8');
    const indexHtml = await readFile(join(process.cwd(), 'public/index.html'), 'utf8');

    expect(registrationHtml).toContain('data-login-state-read="disabled"');
    expect(registrationHtml).toContain(ui.PUBLIC_REGISTRATION_PAGE_BANNER_BODY);
    expect(registrationHtml).toContain(ui.PUBLIC_REGISTRATION_SUCCESS_MESSAGE);
    expect(loginHtml).toContain(ui.PUBLIC_LOGIN_PAGE_BANNER_BODY);
    expect(loginHtml).toContain(ui.PUBLIC_LOGIN_PROFILE_NEXT_STEP_HINT);
    expect(loginHtml).not.toMatch(FORBIDDEN_ENGINEER_COPY);
    expect(profileHtml).toContain(ui.PUBLIC_PROFILE_PAGE_LEAD);
    expect(profileHtml).toContain(ui.PUBLIC_PROFILE_SIGNED_IN_GUIDANCE_NOTE);
    expect(profileHtml).toContain(ui.PUBLIC_PROFILE_VIEW_SIGN_IN_REQUIRED_MESSAGE);
    expect(indexHtml).toContain('home-account-flow-note');
    expect(ui.PUBLIC_PROFILE_PAGE_LEAD).toContain('不表示可保證符合或不符合');
    expect(ui.PUBLIC_PROFILE_SIGNED_IN_GUIDANCE_NOTE).not.toMatch(
      FORBIDDEN_ELIGIBILITY_OUTCOME,
    );
  });

  it('keeps registration success without GET /users/me or Set-Cookie', async () => {
    const registration = await loadModule('public/frontend/registration-page.js');
    const registrationSource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/registration-page.js'), 'utf8'),
    );
    const fetchCalls: string[] = [];
    const fetchImpl = vi.fn(async (url: string) => {
      fetchCalls.push(String(url));
      return { status: 201 };
    });

    expect(registrationSource).toContain("fetchImpl('/registration'");
    expect(registrationSource).not.toMatch(/\/users\/me|Set-Cookie|login\/session/i);

    await registration.submitRegistrationRequest({
      profile: {
        display_name: 'Milestone User',
        birth_year_month: '1998-07',
        residential_region: 'TW-TPE',
      },
      credential: 'proof',
      fetchImpl,
    });
    expect(fetchCalls).toEqual(['/registration']);
  });

  it('keeps login session path POST /login/session then GET /users/me', async () => {
    const loginSource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/login-page.js'), 'utf8'),
    );
    const profileSource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/profile-page.js'), 'utf8'),
    );

    expect(loginSource).toContain("fetchImpl('/login/session'");
    expect(profileSource).toContain("fetchImpl('/users/me/profile'");
    expect(profileSource).toContain('birth_year_month');
    expect(profileSource).toContain('residential_region');
    expect(profileSource).not.toMatch(FORBIDDEN_ELIGIBILITY_OUTCOME);
  });

  it('keeps quality_badge presentation and vote-by-index boundaries', async () => {
    const badge = await loadModule('public/frontend/quality-feedback-badge.js');
    const votePage = await loadModule('public/frontend/vote-page.js');
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

  it('keeps onboarding copy modules free of storage and forbidden patterns', async () => {
    for (const relativePath of ONBOARDING_COPY_MODULES) {
      const source = stripJsComments(
        await readFile(join(process.cwd(), relativePath), 'utf8'),
      );
      expect(source, relativePath).not.toMatch(FORBIDDEN_STORAGE);
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
    expect(repository).not.toContain('Phase 227');
  });
});
