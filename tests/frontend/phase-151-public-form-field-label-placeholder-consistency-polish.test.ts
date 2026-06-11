import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PUBLIC_FORM_SURFACES = [
  'public/frontend/public-mvp-ui.js',
  'public/frontend/login-page.js',
  'public/frontend/registration-page.js',
  'public/frontend/profile-page.js',
  'public/frontend/create-poll-page.js',
  'public/frontend/vote-page.js',
];

const FORBIDDEN_INTERNAL_COPY =
  /option_id|vote_token|token_sha256|shard_id|session_id|www_session|\buser_id\b|raw_count|poll_option_vote_counters|creator_token/i;

const FORBIDDEN_OUTCOME_COPY =
  /你符合資格|你不符合資格|已投過票|可以投票|一定能投票|can_vote|age_passed|region_passed/i;

const FORBIDDEN_BACKEND_ECHO =
  /error\.message|body\.message|apiError\.message|response\.text\(\)|JSON\.stringify\(error/i;

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

describe('Phase 151 public form field label / placeholder consistency polish', () => {
  it('exports frontend-owned form field allowlists with safe fixed copy', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');

    expect(publicUi.PUBLIC_FORM_FIELD_LABELS.length).toBeGreaterThanOrEqual(10);
    expect(publicUi.PUBLIC_FORM_PLACEHOLDERS.length).toBeGreaterThanOrEqual(6);
    expect(publicUi.PUBLIC_FORM_FIELD_HINTS.length).toBeGreaterThanOrEqual(5);
    expect(publicUi.PUBLIC_FORM_BIRTH_YEAR_MONTH_LABEL).toBe('出生年月（僅到月份）');
    expect(publicUi.PUBLIC_FORM_REGION_SELECT_PROMPT).toBe('請選擇');
    expect(publicUi.PUBLIC_FORM_REGION_EMPTY_OPTION).toBe('未填寫');

    for (const label of publicUi.PUBLIC_FORM_FIELD_LABELS) {
      expect(label).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(label).not.toMatch(FORBIDDEN_OUTCOME_COPY);
    }
    for (const placeholder of publicUi.PUBLIC_FORM_PLACEHOLDERS) {
      expect(placeholder).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(placeholder).not.toMatch(/\d+%|raw_count/i);
    }
    for (const hint of publicUi.PUBLIC_FORM_FIELD_HINTS) {
      expect(hint).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(hint).not.toMatch(FORBIDDEN_OUTCOME_COPY);
    }
  });

  it('maps login form field copy into PUBLIC_FORM_* allowlists', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const login = await loadModule('public/frontend/login-page.js');

    expect(login.LOGIN_CREDENTIAL_LABEL).toBe(
      publicUi.PUBLIC_FORM_PRODUCTION_CREDENTIAL_LABEL,
    );
    expect(login.LOGIN_CREDENTIAL_PLACEHOLDER).toBe(
      publicUi.PUBLIC_FORM_LOGIN_CREDENTIAL_PLACEHOLDER,
    );
    expect(login.LOGIN_CREDENTIAL_FIELD_HINT).toBe(
      publicUi.PUBLIC_FORM_LOGIN_CREDENTIAL_FIELD_HINT,
    );
    expect(publicUi.PUBLIC_FORM_FIELD_LABELS).toContain(
      publicUi.PUBLIC_FORM_PRODUCTION_CREDENTIAL_LABEL,
    );
    expect(publicUi.PUBLIC_FORM_PLACEHOLDERS).toContain(
      publicUi.PUBLIC_FORM_LOGIN_CREDENTIAL_PLACEHOLDER,
    );
    expect(publicUi.PUBLIC_FORM_FIELD_HINTS).toContain(
      publicUi.PUBLIC_FORM_LOGIN_CREDENTIAL_FIELD_HINT,
    );
  });

  it('keeps syncLoginFormFieldCopy on shared constants', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const login = await loadModule('public/frontend/login-page.js');

    const credentialLabel = { textContent: '' };
    const credentialInput = { placeholder: '' };
    const credentialHint = { textContent: '' };
    const documentObject = {
      querySelector(selector: string) {
        return selector === 'label[for="login-credential"]' ? credentialLabel : null;
      },
      getElementById(id: string) {
        if (id === 'login-credential') return credentialInput;
        if (id === 'login-shell-hint') return credentialHint;
        return null;
      },
    };

    login.syncLoginFormFieldCopy(documentObject);

    expect(credentialLabel.textContent).toBe(
      publicUi.PUBLIC_FORM_PRODUCTION_CREDENTIAL_LABEL,
    );
    expect(credentialInput.placeholder).toBe(publicUi.PUBLIC_FORM_LOGIN_CREDENTIAL_PLACEHOLDER);
    expect(credentialHint.textContent).toBe(publicUi.PUBLIC_FORM_LOGIN_CREDENTIAL_FIELD_HINT);

    const source = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/login-page.js'), 'utf8'),
    );
    expect(source).toContain('syncLoginFormFieldCopy(documentObject)');
  });

  it('maps registration and profile shared birth / region labels consistently', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const registration = await loadModule('public/frontend/registration-page.js');
    const profile = await loadModule('public/frontend/profile-page.js');

    expect(registration.REGISTRATION_BIRTH_YEAR_MONTH_LABEL).toBe(
      profile.PROFILE_BIRTH_YEAR_MONTH_LABEL,
    );
    expect(registration.REGISTRATION_RESIDENTIAL_REGION_LABEL).toBe(
      profile.PROFILE_RESIDENTIAL_REGION_LABEL,
    );
    expect(registration.REGISTRATION_BIRTH_YEAR_MONTH_PLACEHOLDER).toBe(
      profile.PROFILE_BIRTH_YEAR_MONTH_PLACEHOLDER,
    );
    expect(registration.REGISTRATION_BIRTH_YEAR_MONTH_PLACEHOLDER).toBe(
      publicUi.PUBLIC_FORM_BIRTH_YEAR_MONTH_PLACEHOLDER,
    );
  });

  it('keeps syncRegistrationFormFieldCopy on shared constants', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const registration = await loadModule('public/frontend/registration-page.js');

    const displayNameInput = {
      placeholder: '',
      nextElementSibling: { classList: { contains: () => true }, textContent: '' },
    };
    const regionSelect = {
      querySelector: () => ({ textContent: '' }),
      nextElementSibling: { classList: { contains: () => true }, textContent: '' },
    };
    const documentObject = {
      querySelector(selector: string) {
        if (selector === 'label[for="registration-display-name"]') {
          return { textContent: '' };
        }
        if (selector === 'label[for="registration-birth-year-month"]') {
          return { textContent: '' };
        }
        if (selector === 'label[for="registration-residential-region"]') {
          return { textContent: '' };
        }
        if (selector === 'label[for="registration-credential"]') {
          return { textContent: '' };
        }
        return null;
      },
      getElementById(id: string) {
        if (id === 'registration-display-name') return displayNameInput;
        if (id === 'registration-birth-year-month') {
          return {
            placeholder: '',
            nextElementSibling: { classList: { contains: () => true }, textContent: '' },
          };
        }
        if (id === 'registration-residential-region') return regionSelect;
        if (id === 'registration-credential') {
          return {
            placeholder: '',
            nextElementSibling: { classList: { contains: () => true }, textContent: '' },
          };
        }
        return null;
      },
    };

    registration.syncRegistrationFormFieldCopy(documentObject);
    expect(displayNameInput.placeholder).toBe(publicUi.PUBLIC_FORM_DISPLAY_NAME_PLACEHOLDER);
  });

  it('maps create poll and vote form labels into PUBLIC_FORM_FIELD_LABELS', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const createPoll = await loadModule('public/frontend/create-poll-page.js');
    const votePage = await loadModule('public/frontend/vote-page.js');

    expect(createPoll.CREATE_POLL_TITLE_LABEL).toBe(publicUi.PUBLIC_FORM_POLL_TITLE_LABEL);
    expect(createPoll.CREATE_POLL_OPTIONS_LEGEND).toBe(publicUi.PUBLIC_FORM_POLL_OPTIONS_LEGEND);
    expect(votePage.VOTE_OPTIONS_LEGEND).toBe(publicUi.PUBLIC_FORM_VOTE_OPTIONS_LEGEND);
    expect(publicUi.PUBLIC_FORM_FIELD_LABELS).toContain(publicUi.PUBLIC_FORM_POLL_TITLE_LABEL);
    expect(publicUi.PUBLIC_FORM_PLACEHOLDERS).toContain(publicUi.PUBLIC_FORM_POLL_TITLE_PLACEHOLDER);
  });

  it('keeps registration boundary off auto-login, Set-Cookie, and GET /users/me', async () => {
    const registration = await loadModule('public/frontend/registration-page.js');
    const fetchCalls: string[] = [];
    const fetchImpl = vi.fn(async (url: string) => {
      fetchCalls.push(String(url));
      return { status: 201 };
    });

    await registration.submitRegistrationRequest({
      profile: {
        display_name: 'Form Polish User',
        birth_year_month: '1998-07',
        residential_region: 'TW-TPE',
      },
      credential: 'proof',
      fetchImpl,
    });

    expect(fetchCalls).toEqual(['/registration']);

    const source = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/registration-page.js'), 'utf8'),
    );
    expect(source).not.toMatch(/mountLoginStateRead|\/users\/me|Set-Cookie|document\.cookie/i);
  });

  it('keeps vote-by-index body unchanged with only option_index', async () => {
    const votePage = await loadModule('public/frontend/vote-page.js');
    const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => ({
      ok: true,
      status: 201,
      json: async () => ({ vote_token: 'secret', option_id: 'secret' }),
    }));

    await votePage.submitVoteByIndex({
      pollId: '11111111-1111-4111-8111-111111111111',
      optionIndex: 1,
      userId: '44444444-4444-4444-8444-444444444444',
      fetchImpl,
    });

    const body = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body));
    expect(body).toEqual({ option_index: 1 });
  });

  it('does not add observability hooks to reviewed form surfaces', async () => {
    for (const relativePath of PUBLIC_FORM_SURFACES) {
      const source = stripJsComments(
        await readFile(join(process.cwd(), relativePath), 'utf8'),
      );
      expect(source, relativePath).not.toMatch(FORBIDDEN_OBSERVABILITY);
    }
  });

  for (const relativePath of PUBLIC_FORM_SURFACES) {
    it(`keeps reviewed form field copy neutral in ${relativePath}`, async () => {
      const source = stripJsComments(
        await readFile(join(process.cwd(), relativePath), 'utf8'),
      );
      if (relativePath !== 'public/frontend/public-mvp-ui.js') {
        expect(source, relativePath).not.toMatch(FORBIDDEN_BACKEND_ECHO);
      }
      expect(source, relativePath).not.toMatch(FORBIDDEN_OUTCOME_COPY);
    });
  }
});
