import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PUBLIC_MVP_CSS = 'public/frontend/public-mvp.css';

const PHASE_201_HTML_SURFACES = [
  { path: 'public/explore.html', pageClass: 'explore-page' },
  { path: 'public/vote.html', pageClass: 'vote-page' },
  { path: 'public/results.html', pageClass: 'results-page' },
] as const;

const PHASE_201_RUNTIME_MODULES = [
  'public/frontend/explore-page.js',
  'public/frontend/vote-page.js',
  'public/frontend/result-page.js',
  'public/frontend/quality-feedback-badge.js',
] as const;

const PROTECTED_BACKEND_PATHS = [
  'src/polls/repository.ts',
  'src/http/registration-routes.ts',
  'src/http/login-session-routes.ts',
  'src/http/official-vote-routes.ts',
  'src/http/vote-by-index.ts',
  'src/auth/user-auth-resolver.ts',
  'migrations',
];

const FORBIDDEN_LEAKAGE_COPY =
  /option_id|vote_token|token_sha256|shard_id|session_id|www_session|\buser_id\b|raw_count|poll_option_vote_counters|creator_token|error\.message|JSON\.stringify\(error/i;

const FORBIDDEN_OUTCOME_COPY =
  /你符合資格|你不符合資格|已投過票|可以投票|一定能投票|can_vote|age_passed|region_passed/i;

const FORBIDDEN_OBSERVABILITY =
  /console\.(log|info|warn|error|debug)|analytics|datadog|sentry|apm|trackEvent|gtag\(/i;

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 201 public MVP mobile readability polish', () => {
  it('documents Phase 201 mobile readability rules in public-mvp.css', async () => {
    const css = await readFile(join(process.cwd(), PUBLIC_MVP_CSS), 'utf8');

    expect(css).toContain('Phase 201');
    expect(css).toContain('.explore-page #explore-status');
    expect(css).toContain('.explore-page #explore-load-more');
    expect(css).toContain('.vote-page #poll-title');
    expect(css).toContain('.results-page .results-page-demo-intro');
    expect(css).toMatch(
      /@media \(max-width: 640px\)[\s\S]*\.explore-page \.mvp-poll-card h3/,
    );
    expect(css).toMatch(
      /@media \(max-width: 640px\)[\s\S]*\.vote-page \.mvp-form fieldset legend/,
    );
    expect(css).toMatch(
      /@media \(max-width: 640px\)[\s\S]*\.results-page #bottom-nav\.mvp-result-footer/,
    );
  });

  it('keeps participation HTML shells on page-class wrappers without runtime module churn', async () => {
    for (const { path: relativePath, pageClass } of PHASE_201_HTML_SURFACES) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).toContain(`class="mvp-page`);
      expect(source, relativePath).toContain(pageClass);
      expect(source, relativePath).toContain('/frontend/public-mvp.css');
      expect(source, relativePath).not.toContain('Phase 201');
    }

    const resultsHtml = await readFile(join(process.cwd(), 'public/results.html'), 'utf8');
    expect(resultsHtml).toContain('results-page-demo-intro');
    expect(resultsHtml).not.toMatch(/results-page-demo-intro[\s\S]*style="/);
  });

  it('does not mark Phase 201 participation runtime modules or protected backend paths', async () => {
    for (const relativePath of PHASE_201_RUNTIME_MODULES) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 201');
    }

    for (const relativePath of PROTECTED_BACKEND_PATHS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8').catch(() => '');
      if (!source) {
        continue;
      }
      expect(source, relativePath).not.toContain('Phase 201');
    }
  });

  it('does not introduce linkage, identity, or observability leakage in Phase 201 CSS', async () => {
    const css = await readFile(join(process.cwd(), PUBLIC_MVP_CSS), 'utf8');
    const phase201Start = css.indexOf('Phase 201');
    const phase201Css = css.slice(phase201Start);

    expect(phase201Css).not.toMatch(FORBIDDEN_LEAKAGE_COPY);
    expect(phase201Css).not.toMatch(FORBIDDEN_OBSERVABILITY);
    expect(phase201Css).not.toMatch(FORBIDDEN_OUTCOME_COPY);
  });

  it('keeps quality_badge presentation-only with positive_feedback label only', async () => {
    const badge = await loadModule('public/frontend/quality-feedback-badge.js');

    expect(badge.QUALITY_FEEDBACK_BADGE_LABEL).toBe('回饋良好');
    expect(badge.shouldRenderQualityFeedbackBadge(null)).toBe(false);
    expect(badge.shouldRenderQualityFeedbackBadge(undefined)).toBe(false);
    expect(
      badge.shouldRenderQualityFeedbackBadge({ quality_badge: 'positive_feedback' }),
    ).toBe(true);
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: null })).toBe(false);
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: 'unexpected' })).toBe(
      false,
    );
  });

  it('keeps registration boundary off auto-login, Set-Cookie, and GET /users/me', async () => {
    const registration = await loadModule('public/frontend/registration-page.js');
    const fetchCalls: string[] = [];
    const fetchImpl = vi.fn(async (url: string) => {
      fetchCalls.push(String(url));
      return { status: 201 };
    });

    await registration.submitRegistrationRequest({
      profile: {
        display_name: 'Mobile Readability User',
        birth_year_month: '1998-07',
        residential_region: 'TW-TPE',
      },
      credential: 'proof',
      fetchImpl,
    });

    expect(fetchCalls).toEqual(['/registration']);
  });

  it('keeps vote-by-index body unchanged and does not pre-resolve option index to option_id', async () => {
    const votePage = await loadModule('public/frontend/vote-page.js');
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
  });
});
