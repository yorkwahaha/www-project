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

describe('Phase 161 public mobile visual rhythm & accessibility polish', () => {
  it('documents Phase 161 rhythm and tap-target tokens in public-mvp.css', async () => {
    const css = await readFile(join(process.cwd(), PUBLIC_MVP_CSS), 'utf8');

    expect(css).toContain('Phase 161');
    expect(css).toContain('--mvp-tap-min: 2.75rem');
    expect(css).toContain('--mvp-focus-width');
    expect(css).toContain('--mvp-space-section');
    expect(css).toContain('--mvp-space-card');
    expect(css).toContain('--mvp-space-form-field');
    expect(css).toContain(':focus:not(:focus-visible)');
    expect(css).toContain('prefers-reduced-motion: reduce');
    expect(css).toContain('touch-action: manipulation');
  });

  it('keeps interactive public controls at practical tap-target and focus-visible coverage', async () => {
    const css = await readFile(join(process.cwd(), PUBLIC_MVP_CSS), 'utf8');

    expect(css).toMatch(/\.mvp-btn[\s\S]*min-height:\s*var\(--mvp-tap-min\)/);
    expect(css).toMatch(
      /\.mvp-form input:not\(\[type="checkbox"\]\):not\(\[type="radio"\]\)[\s\S]*min-height:\s*var\(--mvp-tap-min\)/,
    );
    expect(css).toMatch(/\.copy-link-button[\s\S]*min-height:\s*var\(--mvp-tap-min\)/);
    expect(css).toMatch(/\.mvp-faq-question[\s\S]*min-height:\s*var\(--mvp-tap-min\)/);
    expect(css).toMatch(/\.mvp-help[\s\S]*min-height:\s*var\(--mvp-tap-min\)/);
    expect(css).toContain('a:focus-visible');
    expect(css).toContain('button:focus-visible');
    expect(css).toContain('summary:focus-visible');
    expect(css).toContain('[role="button"]:focus-visible');
  });

  it('keeps mobile card, panel, and form rhythm readable on small screens', async () => {
    const css = await readFile(join(process.cwd(), PUBLIC_MVP_CSS), 'utf8');

    expect(css).toMatch(/@media \(max-width: 640px\)[\s\S]*\.mvp-policy-panel/);
    expect(css).toMatch(/@media \(max-width: 640px\)[\s\S]*\.mvp-form-card/);
    expect(css).toMatch(/@media \(max-width: 640px\)[\s\S]*\.vote-option/);
    expect(css).toMatch(/@media \(max-width: 640px\)[\s\S]*safe-area-inset/);
    expect(css).toMatch(/\.mvp-policy-panel \.policy-field-list li/);
    expect(css).toMatch(/\.mvp-form-card[\s\S]*padding:\s*var\(--mvp-space-section\)/);
  });

  it('keeps public HTML shells on shared public-mvp.css without Phase 161 markup churn', async () => {
    for (const relativePath of PUBLIC_HTML_SHELLS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).toContain('/frontend/public-mvp.css');
      expect(source, relativePath).toContain('skip-link');
      expect(source, relativePath).toContain('id="main-content"');
    }
  });

  it('does not mark protected backend/auth/schema paths with Phase 161 changes', async () => {
    for (const relativePath of PROTECTED_BACKEND_PATHS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8').catch(() => '');
      if (!source) {
        continue;
      }
      expect(source, relativePath).not.toContain('Phase 161');
    }
  });

  it('does not introduce linkage, identity, or observability leakage in public-mvp.css', async () => {
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
        display_name: 'Mobile Polish User',
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
