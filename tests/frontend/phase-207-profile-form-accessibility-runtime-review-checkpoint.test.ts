import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PUBLIC_MVP_CSS = 'public/frontend/public-mvp.css';

const PROTECTED_BACKEND_PATHS = [
  'src/polls/repository.ts',
  'src/http/user-profile-routes.ts',
  'src/http/user-me-routes.ts',
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

describe('Phase 207 profile form accessibility runtime review checkpoint', () => {
  it('documents Phase 207 review checkpoint in README', async () => {
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');
    expect(readme).toContain('Phase 207');
    expect(readme).toContain(
      'docs/www-project-phase-207-profile-form-accessibility-runtime-review-checkpoint-v1.md',
    );
  });

  it('keeps profile.html change limited to profile-page class on main', async () => {
    const profileHtml = await readFile(join(process.cwd(), 'public/profile.html'), 'utf8');
    expect(profileHtml).toContain(
      '<main id="main-content" class="mvp-page mvp-shell profile-page mvp-profile-shell" aria-labelledby="profile-heading">',
    );
    expect(profileHtml).toContain('name="birth_year_month"');
    expect(profileHtml).toContain('name="residential_region"');
    expect(profileHtml).not.toContain('Phase 206');
    expect(profileHtml).not.toContain('Phase 207');
  });

  it('keeps Phase 206 CSS scoped to profile-page and form selectors', async () => {
    const css = await readFile(join(process.cwd(), PUBLIC_MVP_CSS), 'utf8');
    const phase206Start = css.indexOf('Phase 206');
    const phase206Css = css.slice(phase206Start);

    expect(phase206Css).toContain('.profile-page .mvp-profile-unauthenticated');
    expect(phase206Css).toContain('.profile-page #profile-signed-in-panel');
    expect(phase206Css).toContain('.profile-page #profile-form-message.mvp-profile-status');
    expect(phase206Css).toContain('min-height: var(--mvp-tap-min)');
    expect(phase206Css).toMatch(/@media \(max-width: 640px\)/);
    expect(phase206Css).not.toMatch(/\bfetch\b|addEventListener|localStorage|sessionStorage/);
    expect(phase206Css).not.toMatch(FORBIDDEN_OBSERVABILITY);
    expect(phase206Css).not.toMatch(FORBIDDEN_INTERNAL_COPY);
    expect(phase206Css).not.toMatch(FORBIDDEN_OUTCOME_COPY);
  });

  it('does not mark Phase 206 profile runtime module with Phase 206 or Phase 207 changes', async () => {
    const profileSource = await readFile(
      join(process.cwd(), 'public/frontend/profile-page.js'),
      'utf8',
    );
    expect(profileSource).not.toContain('Phase 206');
    expect(profileSource).not.toContain('Phase 207');
  });

  it('keeps GET /users/me/profile load boundary unchanged after Phase 206', async () => {
    const profile = await loadModule('public/frontend/profile-page.js');
    const profileSource = await readFile(
      join(process.cwd(), 'public/frontend/profile-page.js'),
      'utf8',
    );
    const fetchCalls: string[] = [];
    const fetchImpl = vi.fn(async (url: string) => {
      fetchCalls.push(String(url));
      return {
        ok: true,
        status: 200,
        json: async () => ({
          birth_year_month: '1992-03',
          residential_region: 'TW-TXG',
        }),
      };
    });

    const loaded = await profile.loadUserProfile({ fetchImpl });
    expect(fetchCalls).toEqual(['/users/me/profile']);
    expect(loaded).toEqual({
      birth_year_month: '1992-03',
      residential_region: 'TW-TXG',
    });
    expect(profileSource).not.toMatch(/fetchImpl\(['"`]\/users\/me['"`]/);
    expect(profileSource).not.toMatch(FORBIDDEN_STORAGE);
  });

  it('keeps PUT /users/me/profile save boundary with two fields and null semantics', async () => {
    const profile = await loadModule('public/frontend/profile-page.js');
    const profileSource = await readFile(
      join(process.cwd(), 'public/frontend/profile-page.js'),
      'utf8',
    );
    const fetchCalls: Array<{ url: string; init?: RequestInit }> = [];
    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      fetchCalls.push({ url: String(url), init });
      return {
        ok: true,
        status: 200,
        json: async () => ({
          birth_year_month: null,
          residential_region: null,
        }),
      };
    });

    const normalized = profile.normalizeProfileFormInput({
      birthYearMonth: '',
      residentialRegion: '',
    });
    expect(normalized).toEqual({
      birth_year_month: null,
      residential_region: null,
    });

    await profile.saveUserProfile({ profile: normalized, fetchImpl });
    expect(fetchCalls).toHaveLength(1);
    expect(fetchCalls[0]?.url).toBe('/users/me/profile');
    expect(fetchCalls[0]?.init?.method).toBe('PUT');
    const body = JSON.parse(String(fetchCalls[0]?.init?.body));
    expect(body).toEqual({
      birth_year_month: null,
      residential_region: null,
    });
    expect(body).not.toHaveProperty('display_name');
    expect(body).not.toHaveProperty('gender');
    expect(profileSource).toContain("'birth_year_month'");
    expect(profileSource).toContain("'residential_region'");
    expect(profileSource).not.toMatch(/gender|email|phone/i);
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

  it('keeps quality_badge presentation unchanged after Phase 206', async () => {
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
    expect(repository).not.toContain('Phase 206');
    expect(repository).not.toContain('Phase 207');
  });

  it('keeps protected backend paths free of Phase 206/207 markers', async () => {
    for (const relativePath of PROTECTED_BACKEND_PATHS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8').catch(() => '');
      if (!source) {
        continue;
      }
      expect(source, relativePath).not.toContain('Phase 206');
      expect(source, relativePath).not.toContain('Phase 207');
    }
  });
});
