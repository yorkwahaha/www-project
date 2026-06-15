import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_256_DOC =
  'docs/www-project-phase-256-public-help-faq-copy-refinement-plan-v1.md';

const PUBLIC_HTML_SHELLS = [
  'public/faq.html',
  'public/index.html',
  'public/login.html',
  'public/registration.html',
  'public/profile.html',
  'public/vote.html',
  'public/results.html',
  'public/create-poll.html',
  'public/my-polls.html',
  'public/explore.html',
  'public/trust-levels.html',
] as const;

const PUBLIC_FRONTEND_RUNTIME_MODULES = [
  'public/frontend/public-mvp-ui.js',
  'public/frontend/faq-page.js',
  'public/frontend/public-mvp-home.js',
  'public/frontend/vote-page.js',
  'public/frontend/result-page.js',
  'public/frontend/login-page.js',
  'public/frontend/registration-page.js',
  'public/frontend/profile-page.js',
  'public/frontend/create-poll-page.js',
  'public/frontend/my-polls-page.js',
  'public/frontend/explore-page.js',
  'public/frontend/quality-feedback-badge.js',
] as const;

const PROTECTED_BACKEND_PATHS = [
  'src/polls/repository.ts',
  'src/http/official-vote-routes.ts',
  'src/http/registration-routes.ts',
  'src/auth/user-auth-resolver.ts',
  'migrations',
] as const;

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 256 public help / FAQ copy refinement plan', () => {
  it('documents Phase 256 plan-only scope in README', async () => {
    const plan = await readFile(join(process.cwd(), PHASE_256_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(plan).toContain('plan only');
    expect(plan).toContain('Phase 257');
    expect(readme).toContain('Phase 256');
    expect(readme).toContain(PHASE_256_DOC);
  });

  it('keeps Phase 256 as plan-only without HTML, JS, or CSS delivery markers', async () => {
    const css = await readFile(join(process.cwd(), 'public/frontend/public-mvp.css'), 'utf8');
    expect(css).not.toContain('Phase 256');

    for (const relativePath of PUBLIC_HTML_SHELLS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 256');
      expect(source, relativePath).not.toContain('Phase 257');
    }

    for (const relativePath of PUBLIC_FRONTEND_RUNTIME_MODULES) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 256');
      expect(source, relativePath).not.toContain('Phase 257');
    }
  });

  it('locks current help/FAQ copy allowlists aligned with plan baseline', async () => {
    const plan = await readFile(join(process.cwd(), PHASE_256_DOC), 'utf8');
    const ui = await loadModule('public/frontend/public-mvp-ui.js');

    expect(ui.PUBLIC_FAQ_ONBOARDING_MESSAGES.length).toBeGreaterThan(10);
    expect(ui.PUBLIC_AUTH_ACCOUNT_ONBOARDING_MESSAGES.length).toBeGreaterThan(5);
    expect(ui.PUBLIC_VOTE_RESULTS_ONBOARDING_MESSAGES.length).toBeGreaterThan(10);
    expect(ui.PUBLIC_CREATOR_ONBOARDING_MESSAGES.length).toBeGreaterThan(10);
    expect(ui.PUBLIC_FAQ_PAGE_HERO_LEAD).toContain('帳號');
    expect(ui.PUBLIC_VOTE_POLICY_COLLECTING_HIDDEN_TEXT).toContain('收集中');

    expect(plan).toContain('PUBLIC_FAQ_ONBOARDING_MESSAGES');
    expect(plan).toContain('faq-page.js');
    expect(plan).toContain('syncFaqPageOnboardingCopy');
  });

  it('authorizes future minimal copy refinement in plan without runtime delivery', async () => {
    const plan = await readFile(join(process.cwd(), PHASE_256_DOC), 'utf8');

    expect(plan).toContain('minimal public help / FAQ copy refinement');
    expect(plan).toContain('static text replacement only');
    expect(plan).toContain('does **not** approve Phase 257 implementation automatically');
    expect(plan).toContain('Clarity');
    expect(plan).toContain('Consistency');
    expect(plan).toContain('Misleading-risk reduction');
  });

  it('keeps vote-by-index payload boundary unchanged during plan phase', async () => {
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
    expect(body).not.toHaveProperty('option_id');
  });

  it('keeps quality_badge presentation gate documented and unchanged', async () => {
    const badge = await loadModule('public/frontend/quality-feedback-badge.js');
    const plan = await readFile(join(process.cwd(), PHASE_256_DOC), 'utf8');

    expect(badge.QUALITY_FEEDBACK_BADGE_LABEL).toBe('回饋良好');
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: 'positive_feedback' })).toBe(
      true,
    );
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: null })).toBe(false);
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: 'unexpected' })).toBe(false);
    expect(plan).toContain('positive_feedback');
    expect(plan).toContain('ranking');
    expect(plan).toContain('tooltip');
  });

  it('keeps registration boundary off auto-login and GET /users/me on submit', async () => {
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
        display_name: 'Copy Plan User',
        birth_year_month: '1998-07',
        residential_region: 'TW-TPE',
      },
      credential: 'proof',
      fetchImpl,
    });

    expect(fetchCalls).toEqual(['/registration']);
    expect(registrationSource).not.toContain('Phase 256');
  });

  it('does not mark Phase 256 changes on protected backend paths', async () => {
    for (const relativePath of PROTECTED_BACKEND_PATHS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8').catch(() => '');
      if (!source) {
        continue;
      }
      expect(source, relativePath).not.toContain('Phase 256');
      expect(source, relativePath).not.toContain('Phase 257');
    }
  });
});
