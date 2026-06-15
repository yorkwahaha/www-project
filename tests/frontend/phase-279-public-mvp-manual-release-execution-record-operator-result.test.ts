import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_278_DOC =
  'docs/www-project-phase-278-public-mvp-manual-release-execution-authorization-record-v1.md';
const PHASE_279_DOC =
  'docs/www-project-phase-279-public-mvp-manual-release-execution-record-operator-result-v1.md';

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

const PHASE_279_MARKER = 'Phase 279';

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 279 public MVP manual release execution record operator result', () => {
  it('confirms Phase 278 authorization and Phase 279 operator result exist with README index', async () => {
    const authorization = await readFile(join(process.cwd(), PHASE_278_DOC), 'utf8');
    const result = await readFile(join(process.cwd(), PHASE_279_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(authorization).toContain('AUTHORIZED');
    expect(result).toContain('Phase 279');
    expect(result).toContain('Manual Release Execution Result (Operator)');
    expect(result).toContain('NOT EXECUTED');
    expect(result).toContain('does not add deploy scripts');
    expect(result).toContain('does not modify production configuration');
    expect(result).toContain('separate numbered phase');
    expect(result).toContain('separately recorded');
    expect(result).toContain('97ba87f');
    expect(result).toContain('Manual release execution result: NOT EXECUTED');
    expect(readme).toContain('Phase 279');
    expect(readme).toContain(PHASE_279_DOC);
  });

  it('keeps Phase 279 as docs-only without runtime, HTML, CSS, or JS delivery markers', async () => {
    for (const relativePath of PUBLIC_HTML_SHELLS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain(PHASE_279_MARKER);
    }

    for (const relativePath of PUBLIC_FRONTEND_RUNTIME_MODULES) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain(PHASE_279_MARKER);
    }
  });

  it('keeps protected backend paths and migrations free of Phase 279 markers', async () => {
    for (const relativePath of PROTECTED_BACKEND_PATHS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, `${relativePath} must not contain ${PHASE_279_MARKER}`).not.toContain(
        PHASE_279_MARKER,
      );
    }

    const migrationDir = join(process.cwd(), 'migrations');
    const migrationFiles = await readdir(migrationDir);
    for (const fileName of migrationFiles) {
      const source = await readFile(join(migrationDir, fileName), 'utf8');
      expect(source, `migrations/${fileName} must not contain ${PHASE_279_MARKER}`).not.toContain(
        PHASE_279_MARKER,
      );
    }
  });

  it('locks operator result boundary checks without runtime or deploy changes', async () => {
    const result = await readFile(join(process.cwd(), PHASE_279_DOC), 'utf8');
    const homeSource = await readFile(
      join(process.cwd(), 'public/frontend/public-mvp-home.js'),
      'utf8',
    );

    expect(result).toContain('smoke:public:local');
    expect(result).toContain('no deploy scripts');
    expect(result).toContain('no deployment performed');
    expect(result).toContain('post-release smoke result');
    expect(homeSource).not.toContain('creator_session');
    expect(homeSource).not.toContain('X-User-Id');
  });

  it('keeps vote-by-index payload as { option_index } only during operator result phase', async () => {
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

  it('keeps registration and quality_badge boundaries unchanged during operator result phase', async () => {
    const registration = await loadModule('public/frontend/registration-page.js');
    const badge = await loadModule('public/frontend/quality-feedback-badge.js');
    const fetchCalls: string[] = [];
    const fetchImpl = vi.fn(async (url: string) => {
      fetchCalls.push(String(url));
      return { status: 201 };
    });

    await registration.submitRegistrationRequest({
      profile: {
        display_name: 'Operator Result User',
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
