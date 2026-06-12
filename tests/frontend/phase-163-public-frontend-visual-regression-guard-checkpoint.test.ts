import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PUBLIC_MVP_CSS = 'public/frontend/public-mvp.css';

const PUBLIC_HTML_SHELLS = [
  'public/index.html',
  'public/explore.html',
  'public/login.html',
  'public/registration.html',
  'public/profile.html',
  'public/create-poll.html',
  'public/my-polls.html',
  'public/vote.html',
  'public/results.html',
  'public/faq.html',
  'public/trust-levels.html',
];

const NARROW_SHELL_PAGES = [
  'public/vote.html',
  'public/results.html',
  'public/create-poll.html',
  'public/profile.html',
];

const WIDE_LAYOUT_PAGES = [
  'public/index.html',
  'public/explore.html',
  'public/my-polls.html',
];

const INFO_LAYOUT_PAGES = [
  'public/login.html',
  'public/registration.html',
  'public/faq.html',
  'public/trust-levels.html',
];

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

function mediaQueryIndex(css: string, query: string) {
  return css.indexOf(query);
}

describe('Phase 163 public frontend visual regression guard checkpoint', () => {
  it('locks Phase 161 mobile rhythm and accessibility CSS invariants in public-mvp.css', async () => {
    const css = await readFile(join(process.cwd(), PUBLIC_MVP_CSS), 'utf8');

    expect(css).toContain('Phase 161');
    expect(css).toContain('--mvp-tap-min: 2.75rem');
    expect(css).toContain('--mvp-focus-width');
    expect(css).toContain('--mvp-focus-offset');
    expect(css).toContain('--mvp-space-section');
    expect(css).toContain('--mvp-space-card');
    expect(css).toContain('--mvp-space-form-field');
    expect(css).toContain(':focus:not(:focus-visible)');
    expect(css).toContain('prefers-reduced-motion: reduce');
    expect(css).toContain('touch-action: manipulation');
    expect(css).toMatch(/body\.mvp-body[\s\S]*safe-area-inset-bottom/);
    expect(css).toMatch(/\.mvp-btn[\s\S]*min-height:\s*var\(--mvp-tap-min\)/);
    expect(css).toMatch(/@media \(max-width: 640px\)[\s\S]*\.mvp-card-grid[\s\S]*grid-template-columns:\s*1fr/);
    expect(css).toMatch(/@media \(max-width: 640px\)[\s\S]*safe-area-inset/);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*\.mvp-faq-question::before/);
  });

  it('locks Phase 162 tablet/desktop layout CSS invariants in public-mvp.css', async () => {
    const css = await readFile(join(process.cwd(), PUBLIC_MVP_CSS), 'utf8');

    expect(css).toContain('Phase 162');
    expect(css).toContain('--mvp-content-width: var(--mvp-max-width)');
    expect(css).toContain('--mvp-layout-gutter-md');
    expect(css).toContain('--mvp-layout-gutter-lg');
    expect(css).toContain('--mvp-grid-gap');
    expect(css).toContain('--mvp-grid-gap-md');
    expect(css).toContain('--mvp-grid-gap-lg');
    expect(css).toContain('--mvp-layout-width: 68rem');
    expect(css).toContain('--mvp-max-width: 42rem');
    expect(css).toMatch(/\.mvp-page\.mvp-shell[\s\S]*max-width:\s*var\(--mvp-content-width\)/);
    expect(css).toMatch(/\.mvp-site-header-inner[\s\S]*max-width:\s*var\(--mvp-layout-width\)/);
    expect(css).toMatch(/\.mvp-site-footer-inner[\s\S]*max-width:\s*var\(--mvp-layout-width\)/);
    expect(css).toMatch(
      /@media \(min-width: 641px\)[\s\S]*grid-template-columns:\s*repeat\(auto-fill,\s*minmax\(17\.5rem,\s*1fr\)\)/,
    );
    expect(css).toMatch(
      /@media \(min-width: 1024px\)[\s\S]*grid-template-columns:\s*repeat\(auto-fill,\s*minmax\(19\.5rem,\s*1fr\)\)/,
    );
    expect(css).toMatch(/@media \(min-width: 1024px\)[\s\S]*\.mvp-login-shell \.mvp-auth-state-grid/);
    expect(css).toMatch(/@media \(min-width: 1024px\)[\s\S]*\.mvp-info-page--matrix/);
  });

  it('keeps Phase 161 mobile and Phase 162 tablet/desktop breakpoints non-overlapping and ordered', async () => {
    const css = await readFile(join(process.cwd(), PUBLIC_MVP_CSS), 'utf8');

    const mobileMax = mediaQueryIndex(css, '@media (max-width: 640px)');
    const tabletMin = mediaQueryIndex(css, '@media (min-width: 641px)');
    const desktopMin = mediaQueryIndex(css, '@media (min-width: 1024px)');
    const reducedMotion = mediaQueryIndex(css, '@media (prefers-reduced-motion: reduce)');

    expect(mobileMax).toBeGreaterThan(-1);
    expect(tabletMin).toBeGreaterThan(-1);
    expect(desktopMin).toBeGreaterThan(-1);
    expect(reducedMotion).toBeGreaterThan(-1);
    expect(mobileMax).toBeLessThan(tabletMin);
    expect(tabletMin).toBeLessThan(desktopMin);
    expect(desktopMin).toBeLessThan(reducedMotion);
  });

  it('keeps form, panel, result shell, and empty-state surfaces on shared CSS classes', async () => {
    const css = await readFile(join(process.cwd(), PUBLIC_MVP_CSS), 'utf8');

    expect(css).toMatch(/\.mvp-form-card[\s\S]*padding:\s*var\(--mvp-space-section\)/);
    expect(css).toMatch(/\.mvp-policy-panel[\s\S]*padding:\s*var\(--mvp-space-card\)/);
    expect(css).toMatch(/\.results-intro[\s\S]*border-radius:\s*var\(--mvp-radius\)/);
    expect(css).toMatch(/#result-display[\s\S]*margin:/);
    expect(css).toMatch(/\.mvp-empty-state[\s\S]*border-radius:\s*var\(--mvp-radius\)/);
    expect(css).toMatch(/@media \(min-width: 641px\)[\s\S]*\.mvp-form-card/);
    expect(css).toMatch(/@media \(min-width: 641px\)[\s\S]*\.results-intro/);
    expect(css).toMatch(/@media \(min-width: 641px\)[\s\S]*\.result-collecting-status/);
    expect(css).toMatch(/@media \(min-width: 641px\)[\s\S]*\.mvp-empty-state/);

    const explore = await readFile(join(process.cwd(), 'public/explore.html'), 'utf8');
    const results = await readFile(join(process.cwd(), 'public/results.html'), 'utf8');
    const login = await readFile(join(process.cwd(), 'public/login.html'), 'utf8');

    expect(explore).toContain('class="mvp-empty-state"');
    expect(results).toContain('class="results-intro"');
    expect(results).toContain('id="result-display"');
    expect(login).toContain('class="mvp-form-card');
  });

  it('keeps narrow and wide public shell class contracts without Phase 163 HTML churn', async () => {
    for (const relativePath of NARROW_SHELL_PAGES) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).toMatch(/class="[^"]*\bmvp-page\b[^"]*\bmvp-shell\b/);
      expect(source, relativePath).not.toContain('style="max-width');
    }

    for (const relativePath of WIDE_LAYOUT_PAGES) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).toContain('class="mvp-page');
      expect(source, relativePath).not.toContain('mvp-shell');
    }

    for (const relativePath of INFO_LAYOUT_PAGES) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).toContain('mvp-info-page');
    }

    for (const relativePath of PUBLIC_HTML_SHELLS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).toContain('/frontend/public-mvp.css');
      expect(source, relativePath).toContain('skip-link');
      expect(source, relativePath).toContain('id="main-content"');
      expect(source, relativePath).not.toContain('Phase 163');
    }
  });

  it('does not mark protected backend/auth/schema paths with Phase 163 changes', async () => {
    for (const relativePath of PROTECTED_BACKEND_PATHS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8').catch(() => '');
      if (!source) {
        continue;
      }
      expect(source, relativePath).not.toContain('Phase 163');
    }
  });

  it('does not introduce linkage, identity, eligibility outcome, or observability leakage in public-mvp.css', async () => {
    const css = await readFile(join(process.cwd(), PUBLIC_MVP_CSS), 'utf8');
    expect(css).not.toMatch(FORBIDDEN_LEAKAGE_COPY);
    expect(css).not.toMatch(FORBIDDEN_OBSERVABILITY);
    expect(css).not.toMatch(FORBIDDEN_OUTCOME_COPY);
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
        display_name: 'Visual Guard User',
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
