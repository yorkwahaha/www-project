import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_217_DOC =
  'docs/www-project-phase-217-login-registration-profile-state-copy-runtime-v1.md';
const PHASE_218_DOC =
  'docs/www-project-phase-218-login-registration-profile-state-copy-runtime-review-checkpoint-v1.md';

const PHASE_217_TOUCHED_MODULES = [
  'public/frontend/public-mvp-ui.js',
  'public/frontend/login-page.js',
  'public/frontend/registration-page.js',
  'public/frontend/profile-page.js',
] as const;

const FORBIDDEN_DEBUG_LEAKAGE =
  /request_id|requestId|trace_id|traceId|stack trace|internal code|error_code/i;

const FORBIDDEN_STORAGE = /localStorage|sessionStorage|document\.cookie|Set-Cookie/i;

const FORBIDDEN_BACKEND_ECHO =
  /error\.message|body\.message|apiError\.message|response\.text\(\)|JSON\.stringify\(error/i;

const FORBIDDEN_EXTRA_PROFILE_FIELDS =
  /gender|性別|address|地址|GPS|geocode|precise location|精準位置/i;

function stripJsComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 218 login registration profile state copy runtime review checkpoint', () => {
  it('documents Phase 218 review checkpoint in README', async () => {
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');
    expect(readme).toContain('Phase 218');
    expect(readme).toContain(PHASE_218_DOC);
    expect(readme).toContain('state copy runtime review checkpoint');
  });

  it('keeps Phase 217 delivery documented and runtime modules free of phase markers', async () => {
    const delivery = await readFile(join(process.cwd(), PHASE_217_DOC), 'utf8');
    const review = await readFile(join(process.cwd(), PHASE_218_DOC), 'utf8');

    expect(delivery).toContain('copy-only');
    expect(review).toContain('APPROVED');
    expect(review).toContain(
      'APPROVED — Phase 217 Login / Registration / Profile state copy runtime patch is copy-only; no runtime/API/DB/backend/auth/registration/profile/privacy drift identified.',
    );

    for (const relativePath of PHASE_217_TOUCHED_MODULES) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 217');
      expect(source, relativePath).not.toContain('Phase 218');
    }
  });

  it('keeps login-page re-exporting shared copy without altering login request behavior', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const login = await loadModule('public/frontend/login-page.js');
    const loginSource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/login-page.js'), 'utf8'),
    );
    const fetchImpl = vi.fn(async () => ({ ok: true, status: 201 }));

    expect(login.LOGIN_FORM_LOADING_MESSAGE).toBe(publicUi.PUBLIC_LOGIN_FORM_LOADING_MESSAGE);
    expect(login.LOGIN_FORM_FAILURE_MESSAGE).toBe(publicUi.PUBLIC_LOGIN_FORM_FAILURE_MESSAGE);
    expect(loginSource).toContain('PUBLIC_LOGIN_FORM_LOADING_MESSAGE');
    expect(loginSource).toContain("fetchImpl('/login/session'");
    expect(loginSource).toContain("credentials: 'same-origin'");
    expect(loginSource).toContain('Authorization: `Bearer ${proof}`');
    expect(loginSource).not.toMatch(FORBIDDEN_BACKEND_ECHO);

    await login.submitProductionLoginCredential({
      credential: 'approved-proof',
      fetchImpl,
    });
    expect(fetchImpl).toHaveBeenCalledWith('/login/session', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { Authorization: 'Bearer approved-proof' },
    });
  });

  it('keeps registration success-to-login behavior without users/me or Set-Cookie', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const registration = await loadModule('public/frontend/registration-page.js');
    const registrationSource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/registration-page.js'), 'utf8'),
    );
    const fetchImpl = vi.fn(async () => ({
      status: 201,
      headers: { get: vi.fn() },
    }));

    expect(registration.REGISTRATION_SUCCESS_MESSAGE).toBe(
      publicUi.PUBLIC_REGISTRATION_SUCCESS_MESSAGE,
    );
    expect(publicUi.PUBLIC_REGISTRATION_SUCCESS_MESSAGE).toContain('不會自動登入');
    expect(registrationSource).toContain("fetchImpl('/registration'");
    expect(registrationSource).not.toMatch(/\/users\/me|Set-Cookie|login\/session/i);
    expect(registrationSource).toContain('PUBLIC_REGISTRATION_SUCCESS_MESSAGE');

    await registration.submitRegistrationRequest({
      profile: {
        display_name: 'Registered User',
        birth_year_month: '1998-07',
        residential_region: 'TW-TPE',
      },
      credential: 'approved-proof',
      fetchImpl,
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(String(fetchImpl.mock.calls)).not.toMatch(/\/users\/me/);
  });

  it('keeps profile-page on allowed fields and birth_year_month / residential_region copy only', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const profile = await loadModule('public/frontend/profile-page.js');
    const profileSource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/profile-page.js'), 'utf8'),
    );
    const profileHtml = await readFile(join(process.cwd(), 'public/profile.html'), 'utf8');

    expect(profile.PROFILE_VALIDATION_MESSAGE).toBe(publicUi.PUBLIC_PROFILE_VALIDATION_MESSAGE);
    expect(publicUi.PUBLIC_PROFILE_VIEW_SIGN_IN_REQUIRED_MESSAGE).toMatch(/出生年月/);
    expect(publicUi.PUBLIC_PROFILE_VIEW_SIGN_IN_REQUIRED_MESSAGE).toMatch(/居住地區/);
    expect(profileHtml).toContain(publicUi.PUBLIC_PROFILE_VIEW_SIGN_IN_REQUIRED_MESSAGE);
    expect(profileSource).toContain("fetchImpl('/users/me/profile'");
    expect(profileSource).toContain('birth_year_month');
    expect(profileSource).toContain('residential_region');
    expect(profileSource).not.toMatch(FORBIDDEN_EXTRA_PROFILE_FIELDS);
    expect(profileSource).not.toMatch(/\/registration|\/login\/session/i);
  });

  it('keeps PUBLIC_AUTH_STATE_USER_MESSAGES allowlisted and resolvePublicErrorUserMessage safe', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const uiSource = await readFile(join(process.cwd(), 'public/frontend/public-mvp-ui.js'), 'utf8');

    expect(uiSource).toContain('PUBLIC_AUTH_STATE_USER_MESSAGES');
    expect(publicUi.PUBLIC_AUTH_STATE_USER_MESSAGES).toContain(
      publicUi.PUBLIC_LOGIN_FORM_LOADING_MESSAGE,
    );
    expect(publicUi.PUBLIC_AUTH_STATE_USER_MESSAGES).toContain(
      publicUi.PUBLIC_REGISTRATION_SUCCESS_MESSAGE,
    );
    expect(publicUi.PUBLIC_AUTH_STATE_USER_MESSAGES).toContain(
      publicUi.PUBLIC_PROFILE_VALIDATION_MESSAGE,
    );

    for (const message of publicUi.PUBLIC_AUTH_STATE_USER_MESSAGES) {
      expect(message).not.toMatch(FORBIDDEN_DEBUG_LEAKAGE);
    }

    expect(uiSource).toContain('Never surfaces foreign error.message');
    expect(
      publicUi.resolvePublicErrorUserMessage(
        new Error('backend secret failure'),
        publicUi.PUBLIC_PROFILE_LOAD_FAILURE_MESSAGE,
        publicUi.PUBLIC_AUTH_STATE_USER_MESSAGES,
      ),
    ).toBe(publicUi.PUBLIC_PROFILE_LOAD_FAILURE_MESSAGE);
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

  it('keeps Phase 217 touched modules free of storage, backend echo, and forbidden copy', async () => {
    for (const relativePath of PHASE_217_TOUCHED_MODULES) {
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
    expect(repository).not.toContain('Phase 217');
    expect(repository).not.toContain('Phase 218');
  });
});
