import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_203_DOC =
  'docs/www-project-phase-203-public-mvp-form-accessibility-touch-target-polish-plan-v1.md';

const FORM_RUNTIME_MODULES = [
  'public/frontend/login-page.js',
  'public/frontend/registration-page.js',
  'public/frontend/profile-page.js',
  'public/frontend/create-poll-page.js',
  'public/frontend/my-polls-page.js',
] as const;

const FORBIDDEN_STORAGE =
  /localStorage|sessionStorage|document\.cookie|Set-Cookie/i;

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 203-R public MVP form accessibility / touch target polish plan review checkpoint', () => {
  it('documents Phase 203-R review checkpoint in README', async () => {
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');
    expect(readme).toContain('Phase 203-R');
    expect(readme).toContain(
      'docs/www-project-phase-203r-public-mvp-form-accessibility-touch-target-polish-plan-review-checkpoint-v1.md',
    );
  });

  it('keeps Phase 203 plan as plan-only without runtime module markers', async () => {
    const plan = await readFile(join(process.cwd(), PHASE_203_DOC), 'utf8');
    expect(plan).toContain('plan only');
    expect(plan).toContain('public/frontend/public-mvp.css');
    expect(plan).toContain('Phase 203-R');

    for (const relativePath of FORM_RUNTIME_MODULES) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 203');
      expect(source, relativePath).not.toContain('Phase 203-R');
      expect(source, relativePath).not.toContain('Phase 204');
    }
  });

  it('authorizes future CSS-first polish on form shells per Phase 203 allowed files', async () => {
    const plan = await readFile(join(process.cwd(), PHASE_203_DOC), 'utf8');

    for (const shell of [
      'public/login.html',
      'public/registration.html',
      'public/profile.html',
      'public/create-poll.html',
      'public/my-polls.html',
    ]) {
      const html = await readFile(join(process.cwd(), shell), 'utf8');
      expect(html).toContain('/frontend/public-mvp.css');
      expect(plan).toContain(shell);
    }

    for (const formShell of [
      'public/login.html',
      'public/registration.html',
      'public/profile.html',
      'public/create-poll.html',
    ]) {
      const html = await readFile(join(process.cwd(), formShell), 'utf8');
      expect(html).toContain('mvp-form');
    }

    const myPollsHtml = await readFile(join(process.cwd(), 'public/my-polls.html'), 'utf8');
    expect(myPollsHtml).toContain('mvp-dash-table');

    const css = await readFile(join(process.cwd(), 'public/frontend/public-mvp.css'), 'utf8');
    expect(css).toContain('--mvp-tap-min');
    expect(css).toContain('.mvp-form');
    expect(plan).toContain('--mvp-tap-min');
  });

  it('keeps login session API boundary unchanged in current runtime', async () => {
    const loginSource = await readFile(
      join(process.cwd(), 'public/frontend/login-page.js'),
      'utf8',
    );

    expect(loginSource).toContain("fetchImpl('/login/session'");
    expect(loginSource).toContain('refreshLoginState');
    expect(loginSource).toContain('mountLoginStateRead');
    expect(loginSource).toContain('GET /users/me');
    expect(loginSource).not.toMatch(FORBIDDEN_STORAGE);
  });

  it('keeps registration payload and no-auto-login boundary unchanged', async () => {
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
        display_name: 'Plan Review User',
        birth_year_month: '1998-07',
        residential_region: 'TW-TPE',
      },
      credential: 'proof',
      fetchImpl,
    });

    expect(fetchCalls).toEqual(['/registration']);
    expect(registrationSource).toContain("'display_name'");
    expect(registrationSource).toContain("'birth_year_month'");
    expect(registrationSource).toContain("'residential_region'");
    expect(registrationSource).not.toMatch(/fetchImpl\(['"`]\/users\/me['"`]/);
    expect(registrationSource).not.toMatch(FORBIDDEN_STORAGE);
  });

  it('keeps profile field ceiling and /users/me/profile paths unchanged', async () => {
    const profileSource = await readFile(
      join(process.cwd(), 'public/frontend/profile-page.js'),
      'utf8',
    );

    expect(profileSource).toContain("fetchImpl('/users/me/profile'");
    expect(profileSource).toContain('birth_year_month');
    expect(profileSource).toContain('residential_region');
    expect(profileSource).not.toMatch(/fetchImpl\(['"`]\/users\/me['"`]/);
    expect(profileSource).not.toContain('email');
    expect(profileSource).not.toContain('phone');
  });

  it('keeps create-poll demo vs live creator boundary unchanged', async () => {
    const createPoll = await loadModule('public/frontend/create-poll-page.js');
    const createPollSource = await readFile(
      join(process.cwd(), 'public/frontend/create-poll-page.js'),
      'utf8',
    );

    expect(createPoll.submitCreatePollDemo).toBeTypeOf('function');
    expect(createPollSource).toContain("fetchImpl('/creator/polls'");
    expect(createPollSource).toContain('submitCreatePollDemo');
    expect(createPollSource).toContain('useLiveApi');
    expect(createPollSource).toContain('ensureCreatorSessionForLiveMode');
  });

  it('keeps my-polls live creator session and owned-list APIs unchanged', async () => {
    const myPollsSource = await readFile(
      join(process.cwd(), 'public/frontend/my-polls-page.js'),
      'utf8',
    );

    expect(myPollsSource).toContain('prepareMyPollsLiveSession');
    expect(myPollsSource).toContain('fetchCreatorOwnedPolls');
    expect(myPollsSource).toContain("fetchImpl('/creator/polls'");
    expect(myPollsSource).toContain('renderCreatorLifecycleActions');
    expect(myPollsSource).toContain('./poll-lifecycle-controls.js');
    expect(myPollsSource).not.toMatch(FORBIDDEN_STORAGE);
  });

  it('keeps quality_badge presentation-only and vote-by-index body unchanged', async () => {
    const badge = await loadModule('public/frontend/quality-feedback-badge.js');
    const votePage = await loadModule('public/frontend/vote-page.js');
    const badgeSource = await readFile(
      join(process.cwd(), 'public/frontend/quality-feedback-badge.js'),
      'utf8',
    );

    expect(badge.QUALITY_FEEDBACK_BADGE_LABEL).toBe('回饋良好');
    expect(badgeSource).not.toMatch(/tooltip|ranking|recommend|personaliz|trust|governance|debug/i);

    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 201,
      json: async () => ({}),
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
});
