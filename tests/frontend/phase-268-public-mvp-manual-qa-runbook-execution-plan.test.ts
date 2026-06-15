import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_267_DOC =
  'docs/www-project-phase-267-public-mvp-launch-readiness-runtime-review-final-checkpoint-v1.md';
const PHASE_268_DOC =
  'docs/www-project-phase-268-public-mvp-manual-qa-runbook-execution-plan-v1.md';

const PUBLIC_HTML_SHELLS = [
  'public/index.html',
  'public/login.html',
  'public/registration.html',
  'public/profile.html',
  'public/vote.html',
  'public/results.html',
  'public/create-poll.html',
  'public/my-polls.html',
  'public/explore.html',
  'public/faq.html',
  'public/trust-levels.html',
] as const;

const PUBLIC_FRONTEND_RUNTIME_MODULES = [
  'public/frontend/public-page-copy.js',
  'public/frontend/public-mvp-ui.js',
  'public/frontend/public-mvp-home.js',
  'public/frontend/vote-page.js',
  'public/frontend/result-page.js',
  'public/frontend/login-page.js',
  'public/frontend/registration-page.js',
  'public/frontend/profile-page.js',
  'public/frontend/create-poll-page.js',
  'public/frontend/my-polls-page.js',
  'public/frontend/explore-page.js',
  'public/frontend/creator-flow-copy.js',
  'public/frontend/public-mvp.css',
] as const;

const PROTECTED_BACKEND_PATHS = [
  'src/polls/repository.ts',
  'src/http/official-vote-routes.ts',
  'src/http/registration-routes.ts',
  'src/http/login-session-routes.ts',
  'src/http/user-profile-routes.ts',
  'src/http/creator-poll-routes.ts',
  'src/http/creator-session-routes.ts',
  'src/auth/user-auth-resolver.ts',
] as const;

const QA_PHASE_MARKERS = ['Phase 268'] as const;

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 268 public MVP manual QA runbook execution plan', () => {
  it('confirms Phase 267 checkpoint and Phase 268 runbook docs exist with README index', async () => {
    const review = await readFile(join(process.cwd(), PHASE_267_DOC), 'utf8');
    const plan = await readFile(join(process.cwd(), PHASE_268_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(review).toContain('Phase 267');
    expect(review).toContain('ready for manual QA / freeze candidate');
    expect(plan).toContain('Phase 268');
    expect(plan).toContain('plan only');
    expect(plan).toContain('not launch approval');
    expect(plan).toContain('PASS');
    expect(plan).toContain('FAIL');
    expect(plan).toContain('BLOCKED');
    expect(plan).toContain('NEEDS FOLLOW-UP');
    expect(plan).toContain('Manual QA Runbook');
    expect(readme).toContain('Phase 268');
    expect(readme).toContain(PHASE_268_DOC);
  });

  it('keeps Phase 268 as docs-only without runtime, HTML, CSS, or JS delivery markers', async () => {
    for (const relativePath of PUBLIC_HTML_SHELLS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      for (const marker of QA_PHASE_MARKERS) {
        expect(source, relativePath).not.toContain(marker);
      }
    }

    for (const relativePath of PUBLIC_FRONTEND_RUNTIME_MODULES) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      for (const marker of QA_PHASE_MARKERS) {
        expect(source, relativePath).not.toContain(marker);
      }
    }
  });

  it('keeps protected backend paths and migrations free of Phase 268 markers', async () => {
    for (const relativePath of PROTECTED_BACKEND_PATHS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      for (const marker of QA_PHASE_MARKERS) {
        expect(source, `${relativePath} must not contain ${marker}`).not.toContain(marker);
      }
    }

    const migrationDir = join(process.cwd(), 'migrations');
    const migrationFiles = await readdir(migrationDir);
    for (const fileName of migrationFiles) {
      const source = await readFile(join(migrationDir, fileName), 'utf8');
      for (const marker of QA_PHASE_MARKERS) {
        expect(source, `migrations/${fileName} must not contain ${marker}`).not.toContain(
          marker,
        );
      }
    }
  });

  it('locks manual-QA boundary checks documented in the runbook plan', async () => {
    const plan = await readFile(join(process.cwd(), PHASE_268_DOC), 'utf8');
    const homeSource = await readFile(
      join(process.cwd(), 'public/frontend/public-mvp-home.js'),
      'utf8',
    );
    const pageCopy = await readFile(
      join(process.cwd(), 'public/frontend/public-page-copy.js'),
      'utf8',
    );

    expect(plan).toContain('smoke:public:local');
    expect(plan).toContain('separate numbered phase');
    expect(plan).toContain('Privacy / integrity regression checklist');
    expect(homeSource).not.toContain('creator_session');
    expect(homeSource).not.toContain('X-User-Id');
    expect(pageCopy).toContain('export const PUBLIC_');
    expect(pageCopy).not.toMatch(/\bexport function\b/);
  });

  it('keeps vote-by-index payload as { option_index } only during plan phase', async () => {
    const votePage = await loadModule('public/frontend/vote-page.js');
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 201,
      json: async () => ({
        vote_token: 'secret-token',
        option_id: 'secret-option',
        shard_id: 4,
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

  it('keeps registration and quality_badge boundaries unchanged during plan phase', async () => {
    const registration = await loadModule('public/frontend/registration-page.js');
    const badge = await loadModule('public/frontend/quality-feedback-badge.js');
    const fetchCalls: string[] = [];
    const fetchImpl = vi.fn(async (url: string) => {
      fetchCalls.push(String(url));
      return { status: 201 };
    });

    await registration.submitRegistrationRequest({
      profile: {
        display_name: 'QA Runbook User',
        birth_year_month: '1993-11',
        residential_region: 'TW-TPE',
      },
      credential: 'proof',
      fetchImpl,
    });

    expect(fetchCalls).toEqual(['/registration']);
    expect(badge.QUALITY_FEEDBACK_BADGE_LABEL).toBe('回饋良好');
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: 'positive_feedback' })).toBe(
      true,
    );
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: null })).toBe(false);
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: 'unexpected' })).toBe(false);
  });
});
