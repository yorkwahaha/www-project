import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_265_DOC =
  'docs/www-project-phase-265-public-mvp-launch-readiness-checklist-plan-v1.md';
const PHASE_266_DOC =
  'docs/www-project-phase-266-public-mvp-launch-readiness-checklist-checkpoint-v1.md';
const PHASE_267_DOC =
  'docs/www-project-phase-267-public-mvp-launch-readiness-runtime-review-final-checkpoint-v1.md';

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

const READINESS_PHASE_MARKERS = ['Phase 265', 'Phase 266', 'Phase 267'] as const;
const PHASE_267_MARKER = 'Phase 267';

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 267 public MVP launch readiness runtime review final checkpoint', () => {
  it('confirms Phase 265/266 docs and Phase 267 final checkpoint doc exist with README index', async () => {
    const plan = await readFile(join(process.cwd(), PHASE_265_DOC), 'utf8');
    const checkpoint = await readFile(join(process.cwd(), PHASE_266_DOC), 'utf8');
    const review = await readFile(join(process.cwd(), PHASE_267_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(plan).toContain('Phase 265');
    expect(plan).toContain('plan only');
    expect(plan).toContain('not** approve launch');
    expect(checkpoint).toContain('Phase 266');
    expect(checkpoint).toContain('not launch approval');
    expect(checkpoint).toContain('Manual QA Checklist');
    expect(review).toContain('Phase 267');
    expect(review).toContain('APPROVED — launch readiness final checkpoint complete');
    expect(review).toContain('ready for manual QA / freeze candidate');
    expect(review).toContain('Runtime bugs require a separate numbered phase');
    expect(readme).toContain('Phase 267');
    expect(readme).toContain(PHASE_267_DOC);
  });

  it('keeps Phase 267 as docs-only without runtime, HTML, CSS, or JS delivery markers', async () => {
    for (const relativePath of PUBLIC_HTML_SHELLS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain(PHASE_267_MARKER);
    }

    for (const relativePath of PUBLIC_FRONTEND_RUNTIME_MODULES) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain(PHASE_267_MARKER);
    }
  });

  it('keeps protected backend paths and migrations free of Phase 265-267 readiness markers', async () => {
    for (const relativePath of PROTECTED_BACKEND_PATHS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      for (const marker of READINESS_PHASE_MARKERS) {
        expect(source, `${relativePath} must not contain ${marker}`).not.toContain(marker);
      }
    }

    const migrationDir = join(process.cwd(), 'migrations');
    const migrationFiles = await readdir(migrationDir);
    for (const fileName of migrationFiles) {
      const source = await readFile(join(migrationDir, fileName), 'utf8');
      for (const marker of READINESS_PHASE_MARKERS) {
        expect(source, `migrations/${fileName} must not contain ${marker}`).not.toContain(
          marker,
        );
      }
    }
  });

  it('locks launch-readiness boundary checks documented in the final checkpoint', async () => {
    const review = await readFile(join(process.cwd(), PHASE_267_DOC), 'utf8');
    const homeSource = await readFile(
      join(process.cwd(), 'public/frontend/public-mvp-home.js'),
      'utf8',
    );
    const pageCopy = await readFile(
      join(process.cwd(), 'public/frontend/public-page-copy.js'),
      'utf8',
    );
    const repository = await readFile(join(process.cwd(), 'src/polls/repository.ts'), 'utf8');

    expect(review).toContain('smoke:public:local');
    expect(review).toContain('migrate:check');
    expect(review).toContain('separate numbered phase');
    expect(homeSource).not.toContain('creator_session');
    expect(homeSource).not.toContain('X-User-Id');
    expect(pageCopy).toContain('export const PUBLIC_');
    expect(pageCopy).not.toMatch(/\bexport function\b/);

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

  it('keeps vote-by-index payload as { option_index } only during final checkpoint phase', async () => {
    const votePage = await loadModule('public/frontend/vote-page.js');
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 201,
      json: async () => ({
        vote_token: 'secret-token',
        option_id: 'secret-option',
        shard_id: 5,
      }),
    }));

    await votePage.submitVoteByIndex({
      pollId: '11111111-1111-4111-8111-111111111111',
      optionIndex: 2,
      userId: '44444444-4444-4444-8444-444444444444',
      fetchImpl,
    });

    const body = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body));
    expect(body).toEqual({ option_index: 2 });
    expect(body).not.toHaveProperty('option_id');
  });

  it('keeps registration and quality_badge boundaries unchanged during final checkpoint phase', async () => {
    const registration = await loadModule('public/frontend/registration-page.js');
    const registrationSource = await readFile(
      join(process.cwd(), 'public/frontend/registration-page.js'),
      'utf8',
    );
    const badge = await loadModule('public/frontend/quality-feedback-badge.js');
    const fetchCalls: string[] = [];
    const fetchImpl = vi.fn(async (url: string) => {
      fetchCalls.push(String(url));
      return { status: 201 };
    });

    expect(registrationSource).toContain("fetchImpl('/registration'");
    expect(registrationSource).not.toMatch(/\/users\/me|Set-Cookie|login\/session/i);

    await registration.submitRegistrationRequest({
      profile: {
        display_name: 'Final Checkpoint User',
        birth_year_month: '1992-03',
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
