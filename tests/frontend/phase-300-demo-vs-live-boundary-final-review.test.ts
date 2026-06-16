import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

const PHASE_299_DOC =
  'docs/www-project-phase-299-static-html-fallback-vs-runtime-copy-drift-review-v1.md';
const PHASE_300_DOC =
  'docs/www-project-phase-300-demo-vs-live-boundary-final-review-v1.md';

const PUBLIC_HTML_SHELLS = [
  'public/index.html',
  'public/explore.html',
  'public/faq.html',
  'public/login.html',
  'public/registration.html',
  'public/profile.html',
  'public/create-poll.html',
  'public/my-polls.html',
  'public/vote.html',
  'public/results.html',
] as const;

const BOUNDARY_RUNTIME_MODULES = [
  'public/frontend/public-mvp-demo.js',
  'public/frontend/create-poll-page.js',
  'public/frontend/my-polls-page.js',
  'public/frontend/vote-page.js',
  'public/frontend/result-page.js',
  'public/frontend/registration-page.js',
  'public/frontend/poll-lifecycle-controls.js',
] as const;

const PROTECTED_BACKEND_PATHS = [
  'src/polls/repository.ts',
  'src/http/official-vote-routes.ts',
  'src/auth/user-auth-resolver.ts',
] as const;

const FORBIDDEN_STORAGE = /localStorage|sessionStorage|indexedDB|document\.cookie/i;
const FORBIDDEN_TRACKING =
  /analytics|datadog|sentry|apm|trackEvent|gtag\(|debug\.track/i;

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 300 demo vs live boundary final review', () => {
  it('confirms Phase 300 record exists with PASS conclusion and README index', async () => {
    const review299 = await readFile(join(process.cwd(), PHASE_299_DOC), 'utf8');
    const review300 = await readFile(join(process.cwd(), PHASE_300_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(review299).toContain('Phase 300 blockers: none identified');
    expect(review300).toContain('Phase 300');
    expect(review300).toContain('71b5267');
    expect(review300).toContain('Overall boundary review result');
    expect(review300).toContain('demo vs live boundaries remain clean');
    expect(readme).toContain('Phase 300');
    expect(readme).toContain(PHASE_300_DOC);
  });

  it('keeps Phase 300 as review-only without runtime or HTML delivery markers', async () => {
    for (const relativePath of PUBLIC_HTML_SHELLS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 300');
      expect(source, relativePath).not.toContain('Phase 301');
    }

    for (const relativePath of BOUNDARY_RUNTIME_MODULES) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 300');
    }

    for (const relativePath of PROTECTED_BACKEND_PATHS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 300');
    }

    const migrationDir = join(process.cwd(), 'migrations');
    const migrationFiles = await readdir(migrationDir);
    for (const fileName of migrationFiles) {
      const source = await readFile(join(migrationDir, fileName), 'utf8');
      expect(source, `migrations/${fileName}`).not.toContain('Phase 300');
    }
  });

  it('keeps poll creation demo separated from ?live=1 creator flow', async () => {
    const { parseLiveApiMode } = await loadModule('public/frontend/public-mvp-demo.js');
    const { submitCreatePollDemo } = await loadModule('public/frontend/create-poll-page.js');
    const createSource = await readFile(
      join(process.cwd(), 'public/frontend/create-poll-page.js'),
      'utf8',
    );
    const createHtml = await readFile(join(process.cwd(), 'public/create-poll.html'), 'utf8');

    expect(parseLiveApiMode('')).toBe(false);
    expect(parseLiveApiMode('?live=1')).toBe(true);
    expect(
      submitCreatePollDemo({
        formValues: { title: '示範', description: '說明', options: ['甲', '乙'] },
      }).status,
    ).toBe('demo_static');
    expect(createSource).toContain('parseLiveApiMode(search)');
    expect(createSource).toContain('submitCreatePollDemo');
    expect(createSource).toContain("fetchImpl('/creator/polls'");
    expect(createSource).toContain('ensureCreatorSessionForLiveMode');
    expect(createHtml).toContain('?live=1');
    expect(createHtml).toContain('展示模式');
  });

  it('keeps my-polls demo shell separated from ?live=1 creator-owned APIs', async () => {
    const { parseLiveApiMode } = await loadModule('public/frontend/public-mvp-demo.js');
    const myPollsSource = await readFile(
      join(process.cwd(), 'public/frontend/my-polls-page.js'),
      'utf8',
    );
    const myPollsHtml = await readFile(join(process.cwd(), 'public/my-polls.html'), 'utf8');

    expect(parseLiveApiMode('?live=1')).toBe(true);
    expect(myPollsSource).toContain('data-mock-dashboard');
    expect(myPollsSource).toContain('data-live-owned-list');
    expect(myPollsSource).toContain('/creator/polls');
    expect(myPollsSource).toContain('ensureCreatorSessionForLiveMode');
    expect(myPollsSource).not.toMatch(/\/users\/me/i);
    expect(myPollsHtml).toContain('?live=1');
    expect(myPollsHtml).not.toContain('creator_session');
  });

  it('keeps vote demo from submitting official votes or triggering eligibility', async () => {
    const { isDemoPollRouteId, submitVoteDemo } = await loadModule(
      'public/frontend/public-mvp-demo.js',
    );
    const voteSource = await readFile(join(process.cwd(), 'public/frontend/vote-page.js'), 'utf8');

    expect(isDemoPollRouteId('demo')).toBe(true);
    expect(isDemoPollRouteId('live-poll-id')).toBe(false);
    expect(submitVoteDemo({ optionIndex: 0 })).toEqual({ ok: true, demo: true });
    expect(voteSource).toContain('if (demoOnly)');
    expect(voteSource).toContain('submitVoteDemo');
    expect(voteSource).toContain('await controller.submit()');
    expect(voteSource).not.toMatch(/fetchImpl\(['"]\/official/i);
  });

  it('keeps results demo and hidden aggregate states counter-free', async () => {
    const { resolveResultRenderMode } = await loadModule('public/frontend/result-page.js');
    const resultSource = await readFile(
      join(process.cwd(), 'public/frontend/result-page.js'),
      'utf8',
    );
    const resultsHtml = await readFile(join(process.cwd(), 'public/results.html'), 'utf8');

    for (const lifecycle of ['collecting', 'cancelled', 'unpublished'] as const) {
      expect(
        resolveResultRenderMode({ public_lifecycle_state: lifecycle, options: [] }),
      ).not.toBe('aggregate');
    }

    for (const lifecycle of ['revealed', 'locked', 'post_lock'] as const) {
      expect(
        resolveResultRenderMode({
          public_lifecycle_state: lifecycle,
          options: [{ display_label: '選項 A', display_percentage: '約 10%' }],
        }),
      ).toBe('aggregate');
    }

    expect(resultSource).toContain('isDemoPollRouteId');
    expect(resultSource).toContain('demoOnly');
    expect(resultSource).toContain('renderResultDisplay');
    expect(resultsHtml).toContain('不顯示票數、百分比');
  });

  it('keeps creator_session scoped to creator flows and registration/profile boundaries', async () => {
    const lifecycleSource = await readFile(
      join(process.cwd(), 'public/frontend/poll-lifecycle-controls.js'),
      'utf8',
    );
    const authCopySource = await readFile(
      join(process.cwd(), 'public/frontend/auth-state-copy.js'),
      'utf8',
    );
    const registration = await loadModule('public/frontend/registration-page.js');
    const registrationSource = await readFile(
      join(process.cwd(), 'public/frontend/registration-page.js'),
      'utf8',
    );
    const profileHtml = await readFile(join(process.cwd(), 'public/profile.html'), 'utf8');
    const fetchCalls: string[] = [];

    expect(lifecycleSource).toContain("fetchImpl('/creator/session'");
    expect(lifecycleSource).toContain('ensureCreatorSessionForLiveMode');
    expect(authCopySource).toContain('僅 /creator/*');
    expect(authCopySource).toContain('creator_session');

    await registration.submitRegistrationRequest({
      profile: {
        display_name: 'Boundary Review User',
        birth_year_month: '1994-04',
        residential_region: 'TW-TPE',
      },
      credential: 'proof',
      fetchImpl: async (url: string) => {
        fetchCalls.push(String(url));
        return { status: 201 };
      },
    });

    expect(fetchCalls).toEqual(['/registration']);
    expect(registrationSource).not.toContain("fetchImpl('/users/me'");
    expect(registrationSource).not.toMatch(FORBIDDEN_STORAGE);
    expect(profileHtml).toContain('不表示可保證符合或不符合');
  });

  it('keeps public frontend free of forbidden storage and tracking', async () => {
    const frontendDir = join(process.cwd(), 'public/frontend');
    const entries = await readdir(frontendDir);
    const jsFiles = entries.filter((name) => name.endsWith('.js'));

    for (const fileName of jsFiles) {
      const source = await readFile(join(frontendDir, fileName), 'utf8');
      expect(source, `public/frontend/${fileName}`).not.toMatch(FORBIDDEN_STORAGE);
      expect(source, `public/frontend/${fileName}`).not.toMatch(FORBIDDEN_TRACKING);
    }
  });

  it('records PASS boundary review without deployment claim in Phase 300 doc and README', async () => {
    const review300 = await readFile(join(process.cwd(), PHASE_300_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(review300).toContain('no runtime change');
    expect(review300).toContain('no API change');
    expect(review300).toContain('NOT EXECUTED');
    expect(review300).toContain('NOT COMPLETED');
    expect(review300).not.toContain('deployment executed');
    expect(review300).not.toContain('formal launch completed');
    expect(readme).toContain('NOT EXECUTED');
    expect(readme).toContain('NOT COMPLETED');
    expect(readme).not.toContain('launch completed');
    expect(readme).not.toContain('deployment executed');
  });
});
