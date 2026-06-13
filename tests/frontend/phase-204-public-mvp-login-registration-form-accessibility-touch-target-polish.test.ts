import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PUBLIC_MVP_CSS = 'public/frontend/public-mvp.css';

const PHASE_204_HTML_SURFACES = [
  { path: 'public/login.html', pageClass: 'login-page', formClass: 'mvp-production-login-form' },
  {
    path: 'public/registration.html',
    pageClass: 'registration-page',
    formClass: 'mvp-production-registration-form',
  },
] as const;

const PHASE_204_RUNTIME_MODULES = [
  'public/frontend/login-page.js',
  'public/frontend/registration-page.js',
] as const;

const PROTECTED_BACKEND_PATHS = [
  'src/polls/repository.ts',
  'src/http/registration-routes.ts',
  'src/http/login-session-routes.ts',
  'src/http/official-vote-routes.ts',
  'src/auth/user-auth-resolver.ts',
  'migrations',
];

const FORBIDDEN_STORAGE = /localStorage|sessionStorage|document\.cookie|Set-Cookie/i;

const FORBIDDEN_LEAKAGE_COPY =
  /option_id|vote_token|token_sha256|shard_id|session_id|www_session|\buser_id\b|raw_count|poll_option_vote_counters|creator_token|error\.message|JSON\.stringify\(error/i;

const FORBIDDEN_OBSERVABILITY =
  /console\.(log|info|warn|error|debug)|analytics|datadog|sentry|apm|trackEvent|gtag\(/i;

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 204 public MVP login / registration form accessibility / touch target polish', () => {
  it('documents Phase 204 accessibility rules in public-mvp.css', async () => {
    const css = await readFile(join(process.cwd(), PUBLIC_MVP_CSS), 'utf8');

    expect(css).toContain('Phase 204');
    expect(css).toContain('.login-page .mvp-login-form-card');
    expect(css).toContain('.registration-page .mvp-registration-form-card');
    expect(css).toContain('.login-page #login-shell-message.mvp-login-shell-status');
    expect(css).toContain('.registration-page #registration-form-message.mvp-registration-status');
    expect(css).toContain('min-height: var(--mvp-tap-min)');
    expect(css).toMatch(
      /@media \(max-width: 640px\)[\s\S]*\.login-page \.mvp-info-hero \.mvp-lead/,
    );
    expect(css).toMatch(
      /@media \(max-width: 640px\)[\s\S]*\.registration-page \.mvp-production-registration-form select option/,
    );
  });

  it('keeps login and registration HTML shells on page-class wrappers without runtime module churn', async () => {
    for (const { path: relativePath, pageClass, formClass } of PHASE_204_HTML_SURFACES) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).toContain(`class="mvp-page`);
      expect(source, relativePath).toContain(pageClass);
      expect(source, relativePath).toContain(formClass);
      expect(source, relativePath).toContain('/frontend/public-mvp.css');
      expect(source, relativePath).not.toContain('Phase 204');
    }

    const registrationHtml = await readFile(join(process.cwd(), 'public/registration.html'), 'utf8');
    expect(registrationHtml).toContain('data-login-state-read="disabled"');
  });

  it('does not mark Phase 204 login/registration runtime modules or protected backend paths', async () => {
    for (const relativePath of PHASE_204_RUNTIME_MODULES) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 204');
    }

    for (const relativePath of PROTECTED_BACKEND_PATHS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8').catch(() => '');
      if (!source) {
        continue;
      }
      expect(source, relativePath).not.toContain('Phase 204');
    }
  });

  it('does not introduce linkage or observability leakage in Phase 204 CSS', async () => {
    const css = await readFile(join(process.cwd(), PUBLIC_MVP_CSS), 'utf8');
    const phase204Start = css.indexOf('Phase 204');
    const phase204Css = css.slice(phase204Start);

    expect(phase204Css).not.toMatch(FORBIDDEN_LEAKAGE_COPY);
    expect(phase204Css).not.toMatch(FORBIDDEN_OBSERVABILITY);
  });

  it('keeps login session API boundary unchanged', async () => {
    const loginSource = await readFile(
      join(process.cwd(), 'public/frontend/login-page.js'),
      'utf8',
    );

    expect(loginSource).toContain("fetchImpl('/login/session'");
    expect(loginSource).toContain('refreshLoginState');
    expect(loginSource).toContain('mountLoginStateRead');
    expect(loginSource).not.toMatch(/fetchImpl\(['"`]\/users\/me['"`]/);
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
        display_name: 'Phase 204 User',
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

  it('keeps vote-by-index body unchanged as regression guard', async () => {
    const votePage = await loadModule('public/frontend/vote-page.js');
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
