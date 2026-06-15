import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_283_DOC =
  'docs/www-project-phase-283-public-mvp-documentation-cleanup-release-docs-cross-link-plan-v1.md';
const PHASE_284_DOC =
  'docs/www-project-phase-284-public-mvp-documentation-cleanup-release-docs-cross-link-implementation-v1.md';

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

const PHASE_284_MARKER = 'Phase 284';

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 284 public MVP documentation cleanup release docs cross-link implementation', () => {
  it('confirms Phase 283 plan and Phase 284 implementation exist with README arc summary', async () => {
    const plan = await readFile(join(process.cwd(), PHASE_283_DOC), 'utf8');
    const implementation = await readFile(join(process.cwd(), PHASE_284_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(plan).toContain('readiness arc');
    expect(implementation).toContain('Phase 284');
    expect(implementation).toContain('cross-link implementation');
    expect(implementation).toContain('Release docs arc navigation (Phase 284)');
    expect(implementation).toContain('does not perform deployment');
    expect(implementation).toContain('does not add deploy scripts');
    expect(implementation).toContain('does not modify production configuration');
    expect(implementation).toContain('separately executed and recorded');
    expect(implementation).toContain('separate numbered phase');
    expect(implementation).toContain('6c35cac');
    expect(readme).toContain('Phase 284');
    expect(readme).toContain(PHASE_284_DOC);
    expect(readme).toContain('Public MVP release documentation arcs (Phase 265–296)');
  });

  it('keeps Phase 284 as docs-only without runtime, HTML, CSS, or JS delivery markers', async () => {
    for (const relativePath of PUBLIC_HTML_SHELLS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain(PHASE_284_MARKER);
    }

    for (const relativePath of PUBLIC_FRONTEND_RUNTIME_MODULES) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain(PHASE_284_MARKER);
    }
  });

  it('keeps protected backend paths and migrations free of Phase 284 markers', async () => {
    for (const relativePath of PROTECTED_BACKEND_PATHS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, `${relativePath} must not contain ${PHASE_284_MARKER}`).not.toContain(
        PHASE_284_MARKER,
      );
    }

    const migrationDir = join(process.cwd(), 'migrations');
    const migrationFiles = await readdir(migrationDir);
    for (const fileName of migrationFiles) {
      const source = await readFile(join(migrationDir, fileName), 'utf8');
      expect(source, `migrations/${fileName} must not contain ${PHASE_284_MARKER}`).not.toContain(
        PHASE_284_MARKER,
      );
    }
  });

  it('locks cross-link implementation boundary checks without runtime or deploy changes', async () => {
    const implementation = await readFile(join(process.cwd(), PHASE_284_DOC), 'utf8');
    const phase265 = await readFile(
      join(
        process.cwd(),
        'docs/www-project-phase-265-public-mvp-launch-readiness-checklist-plan-v1.md',
      ),
      'utf8',
    );
    const homeSource = await readFile(
      join(process.cwd(), 'public/frontend/public-mvp-home.js'),
      'utf8',
    );

    expect(implementation).toContain('smoke:public:local');
    expect(implementation).toContain('no deploy scripts');
    expect(implementation).toContain('no deployment performed');
    expect(implementation).toContain('No historical docs were deleted or renamed');
    expect(phase265).toContain('Release docs arc navigation (Phase 284)');
    expect(phase265).toContain('readiness arc');
    expect(homeSource).not.toContain('creator_session');
    expect(homeSource).not.toContain('X-User-Id');
  });

  it('keeps vote-by-index payload as { option_index } only during cross-link implementation phase', async () => {
    const votePage = await loadModule('public/frontend/vote-page.js');
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 201,
      json: async () => ({
        vote_token: 'secret-token',
        option_id: 'secret-option',
        shard_id: 6,
      }),
    }));

    await votePage.submitVoteByIndex({
      pollId: '11111111-1111-4111-8111-111111111111',
      optionIndex: 0,
      userId: '44444444-4444-4444-8444-444444444444',
      fetchImpl,
    });

    const body = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body));
    expect(body).toEqual({ option_index: 0 });
    expect(body).not.toHaveProperty('option_id');
  });

  it('keeps registration and quality_badge boundaries unchanged during cross-link implementation phase', async () => {
    const registration = await loadModule('public/frontend/registration-page.js');
    const badge = await loadModule('public/frontend/quality-feedback-badge.js');
    const fetchCalls: string[] = [];
    const fetchImpl = vi.fn(async (url: string) => {
      fetchCalls.push(String(url));
      return { status: 201 };
    });

    await registration.submitRegistrationRequest({
      profile: {
        display_name: 'Cross-Link Implementation User',
        birth_year_month: '1994-04',
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
  });
});
