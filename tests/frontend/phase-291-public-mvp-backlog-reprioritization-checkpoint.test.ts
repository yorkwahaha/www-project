import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_291_DOC =
  'docs/www-project-phase-291-public-mvp-backlog-reprioritization-checkpoint-v1.md';
const PHASE_290_DOC =
  'docs/www-project-phase-290-public-mvp-post-copy-polish-checkpoint-v1.md';
const PHASE_282_DOC =
  'docs/www-project-phase-282-public-mvp-post-authorization-product-backlog-seed-plan-v1.md';

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

const POST_AUTH_RUNTIME_MODULES = [
  'public/frontend/public-page-copy.js',
  'public/frontend/public-mvp-ui.js',
  'public/frontend/vote-page.js',
  'public/frontend/registration-page.js',
] as const;

const FORBIDDEN_STORAGE = /localStorage|sessionStorage|document\.cookie|Set-Cookie/i;

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 291 public MVP backlog reprioritization checkpoint', () => {
  it('documents Phase 291 checkpoint in README with release status', async () => {
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');
    expect(readme).toContain('Phase 291');
    expect(readme).toContain(PHASE_291_DOC);
    expect(readme).toContain('backlog reprioritization checkpoint');
    expect(readme).toContain('actual deployment **NOT EXECUTED**');
    expect(readme).toContain('Phases 285–289 archived');
  });

  it('confirms Phase 290 archived copy polish arc and Phase 282 seed backlog baseline', async () => {
    const phase290 = await readFile(join(process.cwd(), PHASE_290_DOC), 'utf8');
    const phase282 = await readFile(join(process.cwd(), PHASE_282_DOC), 'utf8');
    const phase291 = await readFile(join(process.cwd(), PHASE_291_DOC), 'utf8');

    expect(phase290).toContain('Phases 285–289 may be archived');
    expect(phase290).toContain('APPROVED');
    expect(phase282).toContain('BL-282-01');
    expect(phase282).toContain('BL-282-04');
    expect(phase282).toContain('BL-282-05');
    expect(phase282).toContain('BL-282-06');
    expect(phase291).toContain('45bb501');
    expect(phase291).toContain('Archived');
  });

  it('keeps protected backend and post-auth runtime modules free of Phase 291 markers', async () => {
    for (const relativePath of PROTECTED_BACKEND_PATHS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 291');
      expect(source, relativePath).not.toContain('Phase 292');
    }
    for (const relativePath of POST_AUTH_RUNTIME_MODULES) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 291');
    }
  });

  it('documents reprioritized backlog tiers and not-recommended-now categories', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_291_DOC), 'utf8');

    expect(doc).toContain('Low-risk');
    expect(doc).toContain('Medium-risk');
    expect(doc).toContain('High-risk');
    expect(doc).toContain('Composer');
    expect(doc).toContain('GPT-5.5');
    expect(doc).toContain('Not Recommended Now');
    expect(doc).toContain('Production deployment execution');
    expect(doc).toContain('deploy script');
    expect(doc).toContain('Auth / session / schema / privacy / governance');
    expect(doc).toContain('public-page-copy.js');
    expect(doc).toContain('public-mvp-ui.js');
    expect(doc).toContain('do not merge constants ad hoc');
    expect(doc).toContain('BL-286-02');
    expect(doc).toContain('BL-282-04');
    expect(doc).toContain('BL-282-05');
    expect(doc).toContain('BL-282-06');
  });

  it('records Phase 292-295 candidate directions without approving implementation', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_291_DOC), 'utf8');

    for (const phase of ['292', '293', '294', '295']) {
      expect(doc).toContain(`**${phase}**`);
    }
    expect(doc).toContain('Manual QA follow-up');
    expect(doc).toContain('Post-release monitoring notes');
    expect(doc).toContain('Documentation archive');
    expect(doc).toContain('Vote-page error UX evaluation');
    expect(doc).toContain('plan only');
    expect(doc).toContain('candidates only');
  });

  it('confirms release/deployment status remains NOT EXECUTED', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_291_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');
    const packageJson = await readFile(join(process.cwd(), 'package.json'), 'utf8');

    expect(doc).toContain('Launch approved for manual release preparation');
    expect(doc).toContain('Operator release execution authorized');
    expect(doc).toContain('NOT EXECUTED');
    expect(doc).toContain('No deploy scripts added');
    expect(doc).toContain('No production configuration changed');
    expect(readme).toContain('operator release execution **authorized**');
    expect(packageJson).not.toMatch(/"deploy/i);
  });

  it('keeps registration and vote boundaries unchanged during checkpoint', async () => {
    const registration = await loadModule('public/frontend/registration-page.js');
    const votePage = await loadModule('public/frontend/vote-page.js');
    const badge = await loadModule('public/frontend/quality-feedback-badge.js');
    const registrationSource = await readFile(
      join(process.cwd(), 'public/frontend/registration-page.js'),
      'utf8',
    );
    const fetchCalls: string[] = [];
    const registrationFetch = vi.fn(async (url: string) => {
      fetchCalls.push(String(url));
      return { status: 201 };
    });

    await registration.submitRegistrationRequest({
      profile: {
        display_name: 'Backlog Checkpoint User',
        birth_year_month: '1994-04',
        residential_region: 'TW-TPE',
      },
      credential: 'proof',
      fetchImpl: registrationFetch,
    });
    expect(fetchCalls).toEqual(['/registration']);
    expect(registrationSource).not.toContain("fetchImpl('/users/me'");
    expect(registrationSource).not.toMatch(FORBIDDEN_STORAGE);

    const voteFetch = vi.fn(async () => ({ ok: true, status: 201, json: async () => ({}) }));
    await votePage.submitVoteByIndex({
      pollId: '11111111-1111-4111-8111-111111111111',
      optionIndex: 0,
      userId: '44444444-4444-4444-8444-444444444444',
      fetchImpl: voteFetch,
    });
    const voteBody = JSON.parse(String(voteFetch.mock.calls[0]?.[1]?.body));
    expect(voteBody).toEqual({ option_index: 0 });
    expect(badge.QUALITY_FEEDBACK_BADGE_LABEL).toBe('回饋良好');
  });

  it('documents Phase 291 implementation record exists', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_291_DOC), 'utf8');
    expect(doc).toContain('review checkpoint');
    expect(doc).toContain('planning only');
    expect(doc).toContain('no runtime');
    expect(doc).toContain('APPROVED');
    expect(doc).toContain('Phase 292 blockers: none identified');
  });
});
