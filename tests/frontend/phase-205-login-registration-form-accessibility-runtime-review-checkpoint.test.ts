import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PUBLIC_MVP_CSS = 'public/frontend/public-mvp.css';

const PHASE_204_RUNTIME_MODULES = [
  'public/frontend/login-page.js',
  'public/frontend/registration-page.js',
] as const;

const PROTECTED_BACKEND_PATHS = [
  'src/polls/repository.ts',
  'src/http/registration-routes.ts',
  'src/http/login-session-routes.ts',
  'src/http/official-vote-routes.ts',
  'src/auth/user-auth-resolver.ts',
  'migrations',
];

const FORBIDDEN_INTERNAL_COPY =
  /option_id|vote_token|token_sha256|shard_id|session_id|www_session|\buser_id\b|raw_count|poll_option_vote_counters|creator_token/i;

const FORBIDDEN_OUTCOME_COPY =
  /你符合資格|你不符合資格|已投過票|可以投票|一定能投票|can_vote|age_passed|region_passed/i;

const FORBIDDEN_STORAGE = /localStorage|sessionStorage|document\.cookie|Set-Cookie/i;

const FORBIDDEN_OBSERVABILITY =
  /console\.(log|info|warn|error|debug)|analytics|datadog|sentry|apm|trackEvent|gtag\(/i;

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 205 login / registration form accessibility runtime review checkpoint', () => {
  it('documents Phase 205 review checkpoint in README', async () => {
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');
    expect(readme).toContain('Phase 205');
    expect(readme).toContain(
      'docs/www-project-phase-205-login-registration-form-accessibility-runtime-review-checkpoint-v1.md',
    );
  });

  it('keeps login.html change limited to login-page class on main', async () => {
    const loginHtml = await readFile(join(process.cwd(), 'public/login.html'), 'utf8');
    expect(loginHtml).toContain(
      '<main id="main-content" class="mvp-page mvp-info-page login-page mvp-login-shell" aria-labelledby="login-heading">',
    );
    expect(loginHtml).not.toContain('Phase 204');
    expect(loginHtml).not.toContain('Phase 205');
  });

  it('keeps registration.html change limited to registration-page class on main', async () => {
    const registrationHtml = await readFile(join(process.cwd(), 'public/registration.html'), 'utf8');
    expect(registrationHtml).toContain(
      '<main id="main-content" class="mvp-page mvp-info-page registration-page mvp-registration-shell" aria-labelledby="registration-heading">',
    );
    expect(registrationHtml).toContain('data-login-state-read="disabled"');
    expect(registrationHtml).not.toContain('Phase 204');
    expect(registrationHtml).not.toContain('Phase 205');
  });

  it('keeps Phase 204 CSS scoped to login/registration page classes and form selectors', async () => {
    const css = await readFile(join(process.cwd(), PUBLIC_MVP_CSS), 'utf8');
    const phase204Start = css.indexOf('Phase 204');
    const phase204Css = css.slice(phase204Start);

    expect(phase204Css).toContain('.login-page .mvp-login-form-card');
    expect(phase204Css).toContain('.registration-page .mvp-registration-form-card');
    expect(phase204Css).toContain('.login-page #login-shell-message.mvp-login-shell-status');
    expect(phase204Css).toContain('.registration-page #registration-form-message.mvp-registration-status');
    expect(phase204Css).toContain('min-height: var(--mvp-tap-min)');
    expect(phase204Css).toMatch(/@media \(max-width: 640px\)/);
    expect(phase204Css).not.toMatch(/\bfetch\b|addEventListener|localStorage|sessionStorage/);
    expect(phase204Css).not.toMatch(FORBIDDEN_OBSERVABILITY);
    expect(phase204Css).not.toMatch(FORBIDDEN_INTERNAL_COPY);
    expect(phase204Css).not.toMatch(FORBIDDEN_OUTCOME_COPY);
  });

  it('does not mark Phase 204 login/registration runtime modules with Phase 204 or Phase 205 changes', async () => {
    for (const relativePath of PHASE_204_RUNTIME_MODULES) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 204');
      expect(source, relativePath).not.toContain('Phase 205');
    }
  });

  it('keeps login session API boundary unchanged after Phase 204', async () => {
    const loginSource = await readFile(
      join(process.cwd(), 'public/frontend/login-page.js'),
      'utf8',
    );

    expect(loginSource).toContain("fetchImpl('/login/session'");
    expect(loginSource).toContain('submitProductionLoginForm');
    expect(loginSource).toContain('refreshLoginState');
    expect(loginSource).toContain('mountLoginStateRead');
    expect(loginSource).not.toMatch(/fetchImpl\(['"`]\/users\/me['"`]/);
    expect(loginSource).not.toMatch(FORBIDDEN_STORAGE);
  });

  it('keeps registration payload and no-auto-login boundary unchanged after Phase 204', async () => {
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
        display_name: 'Phase 205 Review User',
        birth_year_month: '1998-07',
        residential_region: 'TW-TPE',
      },
      credential: 'proof',
      fetchImpl,
    });

    expect(fetchCalls).toEqual(['/registration']);
    expect(registrationSource).toContain("'display_name'");
    expect(registrationSource).toContain("'birth_year_month'");
    expect(registrationSource).toContain("'residential_region'");
    expect(registrationSource).not.toMatch(/fetchImpl\(['"`]\/users\/me['"`]/);
    expect(registrationSource).not.toMatch(FORBIDDEN_STORAGE);
  });

  it('keeps /users/me display ceiling on display_name only in login-state read', async () => {
    const loginStateSource = await readFile(
      join(process.cwd(), 'public/frontend/login-state-read.js'),
      'utf8',
    );

    expect(loginStateSource).toContain('display_name');
    expect(loginStateSource).not.toContain('email');
    expect(loginStateSource).not.toContain('phone');
    expect(loginStateSource).not.toMatch(FORBIDDEN_STORAGE);
  });

  it('keeps quality_badge presentation unchanged after Phase 204', async () => {
    const badge = await loadModule('public/frontend/quality-feedback-badge.js');
    const badgeSource = await readFile(
      join(process.cwd(), 'public/frontend/quality-feedback-badge.js'),
      'utf8',
    );

    expect(badge.QUALITY_FEEDBACK_BADGE_LABEL).toBe('回饋良好');
    expect(badgeSource).not.toMatch(
      /tooltip|title\s*=|aria-describedby|debug|score|rank|ranking|recommend|personaliz|trust|governance/i,
    );
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: 'positive_feedback' })).toBe(
      true,
    );
    for (const poll of [
      { quality_badge: null },
      {},
      { quality_badge: 'low_quality' },
      { quality_badge: 'unknown' },
    ]) {
      expect(badge.shouldRenderQualityFeedbackBadge(poll)).toBe(false);
    }
  });

  it('keeps vote-by-index body unchanged and eligibility-before-option-resolve boundary', async () => {
    const votePage = await loadModule('public/frontend/vote-page.js');
    const voteSource = await readFile(
      join(process.cwd(), 'public/frontend/vote-page.js'),
      'utf8',
    );
    const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => ({
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
    expect(body).not.toHaveProperty('option_id');
    expect(voteSource).toContain('submitVoteByIndex');
    expect(voteSource).not.toMatch(FORBIDDEN_STORAGE);
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
    expect(repository).not.toContain('Phase 204');
    expect(repository).not.toContain('Phase 205');
  });

  it('keeps protected backend paths free of Phase 204/205 markers', async () => {
    for (const relativePath of PROTECTED_BACKEND_PATHS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8').catch(() => '');
      if (!source) {
        continue;
      }
      expect(source, relativePath).not.toContain('Phase 204');
      expect(source, relativePath).not.toContain('Phase 205');
    }
  });
});
