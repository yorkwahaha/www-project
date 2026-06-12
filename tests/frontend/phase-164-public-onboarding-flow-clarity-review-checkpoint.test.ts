import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const ONBOARDING_RUNTIME_MODULES = [
  'public/frontend/registration-page.js',
  'public/frontend/login-page.js',
  'public/frontend/login-state-read.js',
  'public/frontend/login-state-ui.js',
  'public/frontend/profile-page.js',
  'public/frontend/profile-completion-prompt.js',
  'public/frontend/official-vote-pre-vote-hints.js',
  'public/frontend/public-mvp-layout.js',
  'public/frontend/vote-page.js',
];

const ONBOARDING_HTML_SHELLS = [
  'public/registration.html',
  'public/login.html',
  'public/profile.html',
  'public/index.html',
  'public/vote.html',
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
  /你符合資格|你不符合資格|已投過票|可以投票|一定能投票|can_vote|age_passed|region_passed|trust_passed|role_passed/i;

const FORBIDDEN_OBSERVABILITY =
  /console\.(log|info|warn|error|debug)|analytics|datadog|sentry|apm|trackEvent|gtag\(/i;

function stripJsComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

function createPreVoteHintDocument() {
  const elements = new Map<string, HTMLElement>();
  let documentObject: Document;

  function createElement(tagName: string) {
    const element = {
      tagName: tagName.toUpperCase(),
      id: '',
      className: '',
      textContent: '',
      hidden: false,
      href: '',
      attributes: new Map<string, string>(),
      children: [] as unknown[],
      ownerDocument: null as unknown,
      setAttribute(name: string, value: string) {
        this.attributes.set(name, value);
      },
      replaceChildren() {
        this.children = [];
        this.textContent = '';
      },
      append(...nodes: unknown[]) {
        this.children.push(...nodes);
      },
    };
    element.ownerDocument = documentObject;
    return element;
  }

  documentObject = {
    createElement,
    getElementById(id: string) {
      return elements.get(id) ?? null;
    },
    defaultView: { fetch: undefined },
  } as unknown as Document;

  const main = createElement('main') as unknown as HTMLElement;
  main.id = 'main-content';
  const mount = createElement('aside') as unknown as HTMLElement;
  mount.id = 'official-vote-pre-vote-hint';
  elements.set('main-content', main);
  elements.set('official-vote-pre-vote-hint', mount);

  return { documentObject, mount };
}

function collectText(node: unknown): string {
  const record = node as { textContent?: string; children?: unknown[] };
  return [
    record.textContent ?? '',
    ...(record.children ?? []).map((child) => collectText(child)),
  ]
    .filter(Boolean)
    .join(' ');
}

function collectLinks(node: unknown): string[] {
  const record = node as { href?: string; children?: unknown[] };
  return [
    record.href ?? '',
    ...(record.children ?? []).flatMap((child) => collectLinks(child)),
  ].filter(Boolean);
}

describe('Phase 164 public onboarding flow clarity review checkpoint', () => {
  it('keeps registration separated from login with POST /registration only and login-directed success', async () => {
    const registrationHtml = await readFile(
      join(process.cwd(), 'public/registration.html'),
      'utf8',
    );
    const registrationSource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/registration-page.js'), 'utf8'),
    );
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const { shouldReadLoginState } = await loadModule('public/frontend/public-mvp-layout.js');
    const { submitRegistrationRequest } = await loadModule(
      'public/frontend/registration-page.js',
    );

    const fetchCalls: string[] = [];
    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      fetchCalls.push(String(url));
      expect(init?.method).toBe('POST');
      return { status: 201 };
    });
    await submitRegistrationRequest({
      profile: {
        display_name: 'Onboarding User',
        birth_year_month: '1998-07',
        residential_region: 'TW-TPE',
      },
      credential: 'proof',
      fetchImpl,
    });

    expect(fetchCalls).toEqual(['/registration']);
    expect(registrationSource).not.toMatch(/\/users\/me|\/login\/session|Set-Cookie/i);
    expect(registrationHtml).toContain('data-login-state-read="disabled"');
    expect(registrationHtml).toContain('href="/login"');
    expect(publicUi.PUBLIC_REGISTRATION_SUCCESS_MESSAGE).toContain('登入');
    expect(publicUi.PUBLIC_REGISTRATION_SUCCESS_MESSAGE).toContain('不會自動登入');
    expect(shouldReadLoginState({ dataset: { loginStateRead: 'disabled' } })).toBe(
      false,
    );
  });

  it('keeps login as the formal session boundary via POST /login/session then GET /users/me', async () => {
    const loginSource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/login-page.js'), 'utf8'),
    );
    const { submitProductionLoginCredential } = await loadModule(
      'public/frontend/login-page.js',
    );
    const { readLoginState, parseAuthenticatedMeBody } = await loadModule(
      'public/frontend/login-state-read.js',
    );

    const loginFetch = vi.fn(async (url: string, init?: RequestInit) => {
      expect(url).toBe('/login/session');
      expect(init?.method).toBe('POST');
      return { status: 201 };
    });
    await expect(
      submitProductionLoginCredential({
        credential: 'login-proof',
        fetchImpl: loginFetch,
      }),
    ).resolves.toEqual({ ok: true });

    const meFetch = vi.fn(async (url: string, init?: RequestInit) => {
      expect(url).toBe('/users/me');
      expect(init?.method).toBe('GET');
      return {
        ok: true,
        status: 200,
        json: async () => ({
          user_id: 'secret-id',
          display_name: 'Onboarding User',
        }),
      };
    });
    const state = await readLoginState({ fetchImpl: meFetch });
    expect(state).toEqual({
      status: 'authenticated',
      display_name: 'Onboarding User',
    });
    expect(parseAuthenticatedMeBody({ display_name: 'Onboarding User' })).toEqual({
      display_name: 'Onboarding User',
    });
    expect(loginSource).toContain('/login/session');
    expect(loginSource).not.toMatch(/POST\s*\(\s*['"]\/registration['"]/);
  });

  it('keeps profile edit/save on /profile only via PUT /users/me/profile field allowlist', async () => {
    const profileSource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/profile-page.js'), 'utf8'),
    );
    const profileHtml = await readFile(join(process.cwd(), 'public/profile.html'), 'utf8');
    const { saveUserProfile, mountProfilePage } = await loadModule(
      'public/frontend/profile-page.js',
    );

    const saveFetch = vi.fn(async (url: string, init?: RequestInit) => {
      expect(url).toBe('/users/me/profile');
      expect(init?.method).toBe('PUT');
      const body = JSON.parse(String(init?.body));
      expect(Object.keys(body).sort()).toEqual(['birth_year_month', 'residential_region']);
      return { ok: true, json: async () => body };
    });
    await saveUserProfile({
      profile: { birth_year_month: '1998-07', residential_region: 'TW-TPE' },
      fetchImpl: saveFetch,
    });

    const fetchCalls: string[] = [];
    const unauthResult = await mountProfilePage(
      {
        getElementById: (id: string) => {
          if (id === 'profile-form') {
            return {
              tagName: 'FORM',
              hidden: false,
              disabled: false,
              elements: {
                birth_year_month: { value: '', disabled: false },
                residential_region: { value: '', disabled: false },
                namedItem() {
                  return null;
                },
              },
              addEventListener() {},
              querySelector: () => null,
              ownerDocument: null,
            };
          }
          if (id === 'profile-form-message') return { textContent: '' };
          if (id === 'profile-unauthenticated') return { hidden: true };
          if (id === 'profile-signed-in-panel') return { hidden: false };
          return null;
        },
      } as unknown as Document,
      {
        readLoginStateImpl: vi.fn(async () => ({ status: 'anonymous' })),
        fetchImpl: vi.fn(async (url) => {
          fetchCalls.push(String(url));
          return { ok: true, json: async () => ({}) };
        }),
      },
    );
    expect(unauthResult).toEqual({ status: 'unauthenticated' });
    expect(fetchCalls).toHaveLength(0);
    expect(profileSource).toMatch(/method:\s*'PUT'/);
    expect(profileHtml).toContain('name="birth_year_month"');
    expect(profileHtml).toContain('name="residential_region"');

    for (const relativePath of [
      'public/frontend/vote-page.js',
      'public/frontend/explore-page.js',
      'public/frontend/login-page.js',
    ]) {
      const source = stripJsComments(await readFile(join(process.cwd(), relativePath), 'utf8'));
      expect(source, relativePath).not.toMatch(/method:\s*'PUT'[\s\S]*\/users\/me\/profile/);
    }
  });

  it('keeps homepage profile prompt behind login-state read and /users/me/profile completeness only', async () => {
    const layoutSource = await readFile(
      join(process.cwd(), 'public/frontend/public-mvp-layout.js'),
      'utf8',
    );
    const promptSource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/profile-completion-prompt.js'), 'utf8'),
    );
    const prompt = await loadModule('public/frontend/profile-completion-prompt.js');
    const { shouldReadLoginState } = await loadModule('public/frontend/public-mvp-layout.js');

    expect(layoutSource).toMatch(/shouldReadLoginState\(header\)/);
    expect(layoutSource).toMatch(/pathname === '\/' \|\| pathname === ''/);
    expect(layoutSource).toMatch(
      /mountLoginStateRead[\s\S]*mountProfileCompletionPrompt/,
    );
    expect(promptSource).toContain('/users/me/profile');
    expect(promptSource).not.toMatch(/method:\s*'PUT'/);
    expect(shouldReadLoginState({ dataset: { loginStateRead: 'disabled' } })).toBe(
      false,
    );

    const anonymousResult = await prompt.mountProfileCompletionPrompt(
      { getElementById: () => null } as unknown as Document,
      { loginState: { status: 'anonymous' }, fetchImpl: vi.fn() },
    );
    expect(anonymousResult).toEqual({ status: 'anonymous' });

    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      expect(url).toBe('/users/me/profile');
      expect(init?.method).toBe('GET');
      return {
        ok: true,
        json: async () => ({
          birth_year_month: null,
          residential_region: 'TW-TPE',
          can_vote: true,
          age_passed: true,
        }),
      };
    });
    const incompleteResult = await prompt.mountProfileCompletionPrompt(
      { getElementById: () => ({ querySelector: () => null, prepend: vi.fn() }) } as unknown as Document,
      {
        loginState: { status: 'authenticated', display_name: 'Prompt User' },
        fetchImpl,
      },
    );
    expect(incompleteResult).toEqual({ status: 'incomplete' });
    expect(
      Object.keys(
        prompt.parseProfileForPrompt({
          birth_year_month: null,
          residential_region: 'TW-TPE',
          can_vote: true,
        }),
      ).sort(),
    ).toEqual(['birth_year_month', 'residential_region']);
  });

  it('keeps vote pre-vote UX guiding anonymous users to login and incomplete users to profile', async () => {
    const { mountOfficialVotePreVoteHint, renderOfficialVotePreVoteHint } =
      await loadModule('public/frontend/official-vote-pre-vote-hints.js');
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const voteSource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/vote-page.js'), 'utf8'),
    );

    const { documentObject, mount } = createPreVoteHintDocument();
    const anonymousFetch = vi.fn();
    const anonymousResult = await mountOfficialVotePreVoteHint(documentObject, {
      readLoginStateImpl: vi.fn(async () => ({ status: 'anonymous' })),
      fetchImpl: anonymousFetch,
    });
    expect(anonymousResult).toEqual({ status: 'anonymous' });
    expect(anonymousFetch).not.toHaveBeenCalled();
    expect(collectLinks(mount)).toContain('/login');
    expect(collectText(mount)).toContain(publicUi.PUBLIC_VOTE_PRE_VOTE_ANONYMOUS_HINT);

    const incompleteMount = createPreVoteHintDocument();
    const incompleteResult = await mountOfficialVotePreVoteHint(
      incompleteMount.documentObject,
      {
        loginState: { status: 'authenticated', display_name: 'Voter' },
        fetchImpl: vi.fn(async () => ({
          ok: true,
          json: async () => ({
            birth_year_month: null,
            residential_region: 'TW-TPE',
          }),
        })),
      },
    );
    expect(incompleteResult).toEqual({ status: 'profile-incomplete' });
    expect(collectLinks(incompleteMount.mount)).toContain('/profile');
    expect(collectText(incompleteMount.mount)).toContain(
      publicUi.PUBLIC_VOTE_PRE_VOTE_INCOMPLETE_PROFILE_HINT,
    );

    const completeMount = createPreVoteHintDocument();
    const completeResult = await mountOfficialVotePreVoteHint(
      completeMount.documentObject,
      {
        loginState: { status: 'authenticated', display_name: 'Voter' },
        fetchImpl: vi.fn(async () => ({
          ok: true,
          json: async () => ({
            birth_year_month: '1998-07',
            residential_region: 'TW-TPE',
            can_vote: false,
            age_passed: false,
          }),
        })),
      },
    );
    expect(completeResult).toEqual({ status: 'profile-complete' });
    expect(collectLinks(completeMount.mount)).toHaveLength(0);
    expect(collectText(completeMount.mount)).toBe(
      publicUi.PUBLIC_VOTE_PRE_VOTE_NEUTRAL_SUBMIT_HINT,
    );
    expect(collectText(completeMount.mount)).not.toMatch(FORBIDDEN_OUTCOME_COPY);

    renderOfficialVotePreVoteHint(completeMount.documentObject, 'profile-complete');
    expect(voteSource).toContain('mountOfficialVotePreVoteHint');
    expect(voteSource).not.toContain('/users/me/profile');
  });

  it('keeps header and onboarding shell CTAs consistent across public pages', async () => {
    const { AUTH_STATE_COPY, createAuthStateChip } = await loadModule(
      'public/frontend/public-mvp-layout.js',
    );
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const registrationHtml = await readFile(
      join(process.cwd(), 'public/registration.html'),
      'utf8',
    );
    const profileHtml = await readFile(join(process.cwd(), 'public/profile.html'), 'utf8');
    const loginHtml = await readFile(join(process.cwd(), 'public/login.html'), 'utf8');
    const indexHtml = await readFile(join(process.cwd(), 'public/index.html'), 'utf8');

    const guestChip = createAuthStateChip(
      {
        createElement: (tag: string) => ({
          tagName: tag.toUpperCase(),
          href: '',
          textContent: '',
          title: '',
          setAttribute() {},
        }),
      } as unknown as Document,
      'guest',
    ) as { href: string; textContent: string };
    expect(guestChip.href).toBe('/login');
    expect(guestChip.textContent).toBe(AUTH_STATE_COPY.guestChipLabel);

    expect(registrationHtml).toContain(publicUi.PUBLIC_CTA_GO_TO_LOGIN_FROM_REGISTRATION_LABEL);
    expect(registrationHtml).toContain('href="/login"');
    expect(profileHtml).toContain('href="/login"');
    expect(profileHtml).toContain('href="/registration"');
    expect(loginHtml).toContain('href="/registration"');
    expect(indexHtml).toContain('href="/registration"');
    expect(indexHtml).toContain('href="/login"');
  });

  it('does not mark protected backend/auth/schema paths with Phase 164 changes', async () => {
    for (const relativePath of PROTECTED_BACKEND_PATHS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8').catch(() => '');
      if (!source) {
        continue;
      }
      expect(source, relativePath).not.toContain('Phase 164');
    }
  });

  it('keeps onboarding runtime modules free of linkage, eligibility outcomes, and observability hooks', async () => {
    for (const relativePath of ONBOARDING_RUNTIME_MODULES) {
      const source = stripJsComments(
        await readFile(join(process.cwd(), relativePath), 'utf8'),
      );
      expect(source, relativePath).not.toMatch(FORBIDDEN_LEAKAGE_COPY);
      expect(source, relativePath).not.toMatch(FORBIDDEN_OBSERVABILITY);
      expect(source, relativePath).not.toMatch(FORBIDDEN_OUTCOME_COPY);
    }

    for (const relativePath of ONBOARDING_HTML_SHELLS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toMatch(FORBIDDEN_OUTCOME_COPY);
      expect(source, relativePath).not.toContain('Phase 164');
    }
  });

  it('keeps vote-by-index body unchanged and Official Vote transaction order unchanged', async () => {
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
