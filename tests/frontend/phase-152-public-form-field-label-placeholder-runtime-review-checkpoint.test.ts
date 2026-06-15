import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const REVIEWED_FORM_SURFACES = [
  'public/frontend/public-mvp-ui.js',
  'public/frontend/login-page.js',
  'public/frontend/registration-page.js',
  'public/frontend/profile-page.js',
  'public/frontend/create-poll-page.js',
  'public/frontend/vote-page.js',
];

const STATIC_FORM_HTML = [
  'public/login.html',
  'public/registration.html',
  'public/profile.html',
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

describe('Phase 152 public form field label / placeholder runtime review checkpoint', () => {
  it('keeps PUBLIC_FORM_* allowlists on fixed frontend safe copy only', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');

    expect(publicUi.PUBLIC_FORM_FIELD_LABELS.length).toBeGreaterThanOrEqual(10);
    expect(publicUi.PUBLIC_FORM_PLACEHOLDERS.length).toBeGreaterThanOrEqual(6);
    expect(publicUi.PUBLIC_FORM_FIELD_HINTS.length).toBeGreaterThanOrEqual(5);
    expect(publicUi.PUBLIC_FORM_BIRTH_YEAR_MONTH_LABEL).toBe('出生年月（僅到月份）');
    expect(publicUi.PUBLIC_FORM_REGION_SELECT_PROMPT).toBe('請選擇');
    expect(publicUi.PUBLIC_FORM_REGION_EMPTY_OPTION).toBe('未填寫');
    expect(publicUi.PUBLIC_FORM_VOTE_OPTIONS_LEGEND).toBe('請選擇一個選項');

    for (const label of publicUi.PUBLIC_FORM_FIELD_LABELS) {
      expect(label).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(label).not.toMatch(FORBIDDEN_OUTCOME_COPY);
    }
    for (const placeholder of publicUi.PUBLIC_FORM_PLACEHOLDERS) {
      expect(placeholder).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(placeholder).not.toMatch(/\d+%|raw_count/i);
      expect(placeholder).not.toMatch(FORBIDDEN_OUTCOME_COPY);
    }
    for (const hint of publicUi.PUBLIC_FORM_FIELD_HINTS) {
      expect(hint).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(hint).not.toMatch(FORBIDDEN_OUTCOME_COPY);
      expect(hint).not.toMatch(/一定能投票|填完即可投票|保證.*投票/i);
    }
  });

  it('maps login, registration, profile, create poll, and vote re-exports into PUBLIC_FORM_* allowlists', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const login = await loadModule('public/frontend/login-page.js');
    const registration = await loadModule('public/frontend/registration-page.js');
    const profile = await loadModule('public/frontend/profile-page.js');
    const createPoll = await loadModule('public/frontend/create-poll-page.js');
    const votePage = await loadModule('public/frontend/vote-page.js');

    expect(login.LOGIN_CREDENTIAL_LABEL).toBe(
      publicUi.PUBLIC_FORM_PRODUCTION_CREDENTIAL_LABEL,
    );
    expect(login.LOGIN_CREDENTIAL_PLACEHOLDER).toBe(
      publicUi.PUBLIC_FORM_LOGIN_CREDENTIAL_PLACEHOLDER,
    );
    expect(login.LOGIN_CREDENTIAL_FIELD_HINT).toBe(
      publicUi.PUBLIC_FORM_LOGIN_CREDENTIAL_FIELD_HINT,
    );

    expect(registration.REGISTRATION_BIRTH_YEAR_MONTH_LABEL).toBe(
      profile.PROFILE_BIRTH_YEAR_MONTH_LABEL,
    );
    expect(registration.REGISTRATION_RESIDENTIAL_REGION_LABEL).toBe(
      profile.PROFILE_RESIDENTIAL_REGION_LABEL,
    );
    expect(createPoll.CREATE_POLL_TITLE_LABEL).toBe(publicUi.PUBLIC_FORM_POLL_TITLE_LABEL);
    expect(votePage.VOTE_OPTIONS_LEGEND).toBe(publicUi.PUBLIC_FORM_VOTE_OPTIONS_LEGEND);

    for (const value of [
      publicUi.PUBLIC_FORM_PRODUCTION_CREDENTIAL_LABEL,
      publicUi.PUBLIC_FORM_DISPLAY_NAME_LABEL,
      publicUi.PUBLIC_FORM_POLL_TITLE_LABEL,
      publicUi.PUBLIC_FORM_VOTE_OPTIONS_LEGEND,
    ]) {
      expect(publicUi.PUBLIC_FORM_FIELD_LABELS).toContain(value);
    }
    for (const value of [
      publicUi.PUBLIC_FORM_LOGIN_CREDENTIAL_PLACEHOLDER,
      publicUi.PUBLIC_FORM_DISPLAY_NAME_PLACEHOLDER,
      publicUi.PUBLIC_FORM_BIRTH_YEAR_MONTH_PLACEHOLDER,
    ]) {
      expect(publicUi.PUBLIC_FORM_PLACEHOLDERS).toContain(value);
    }
    for (const value of [
      publicUi.PUBLIC_FORM_LOGIN_CREDENTIAL_FIELD_HINT,
      publicUi.PUBLIC_FORM_REGISTRATION_BIRTH_YEAR_MONTH_HINT,
      publicUi.PUBLIC_FORM_PROFILE_RESIDENTIAL_REGION_HINT,
    ]) {
      expect(publicUi.PUBLIC_FORM_FIELD_HINTS).toContain(value);
    }
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
    expect(source).toContain('export function mountLoginShellPage(documentObject = document)');
  });

  it('keeps syncRegistrationFormFieldCopy and syncProfileFormFieldCopy on shared birth / region copy', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const registration = await loadModule('public/frontend/registration-page.js');
    const profile = await loadModule('public/frontend/profile-page.js');

    const regionSelect = {
      querySelector: () => ({ textContent: '' }),
      nextElementSibling: { classList: { contains: () => true }, textContent: '' },
    };
    const registrationDocument = {
      querySelector(selector: string) {
        if (selector.startsWith('label[for="registration-')) {
          return { textContent: '' };
        }
        return null;
      },
      getElementById(id: string) {
        if (id === 'registration-residential-region') return regionSelect;
        return {
          placeholder: '',
          nextElementSibling: { classList: { contains: () => true }, textContent: '' },
        };
      },
    };

    registration.syncRegistrationFormFieldCopy(registrationDocument);

    const emptyOption = { textContent: '' };
    const profileDocument = {
      querySelector(selector: string) {
        if (selector.startsWith('label[for="profile-')) {
          return { textContent: '' };
        }
        return null;
      },
      getElementById(id: string) {
        if (id === 'profile-residential-region') {
          return {
            querySelector: () => emptyOption,
            nextElementSibling: { classList: { contains: () => true }, textContent: '' },
          };
        }
        return {
          placeholder: '',
          nextElementSibling: { classList: { contains: () => true }, textContent: '' },
        };
      },
    };

    profile.syncProfileFormFieldCopy(profileDocument);

    expect(emptyOption.textContent).toBe(publicUi.PUBLIC_FORM_REGION_EMPTY_OPTION);
    expect(publicUi.PUBLIC_FORM_REGION_SELECT_PROMPT).toBe('請選擇');
    expect(publicUi.PUBLIC_FORM_REGION_EMPTY_OPTION).toBe('未填寫');
  });

  it('keeps syncCreatePollFormFieldCopy and syncVoteFormFieldCopy on shared constants', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const createPoll = await loadModule('public/frontend/create-poll-page.js');
    const votePage = await loadModule('public/frontend/vote-page.js');

    const titleLabel = { textContent: '' };
    const titleInput = { placeholder: '' };
    const createPollDocument = {
      querySelector(selector: string) {
        if (selector === 'label[for="poll-title"]') return titleLabel;
        return null;
      },
      getElementById(id: string) {
        if (id === 'poll-title') return titleInput;
        return null;
      },
    };

    createPoll.syncCreatePollFormFieldCopy(createPollDocument);
    expect(titleLabel.textContent).toBe(publicUi.PUBLIC_FORM_POLL_TITLE_LABEL);
    expect(titleInput.placeholder).toBe(publicUi.PUBLIC_FORM_POLL_TITLE_PLACEHOLDER);

    const legend = { textContent: '' };
    votePage.syncVoteFormFieldCopy({
      querySelector(selector: string) {
        return selector === '#vote-form fieldset legend' ? legend : null;
      },
    });
    expect(legend.textContent).toBe(publicUi.PUBLIC_FORM_VOTE_OPTIONS_LEGEND);
  });

  it('keeps static login, registration, and profile HTML shells aligned with PUBLIC_FORM_* constants', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const loginHtml = await readFile(join(process.cwd(), 'public/login.html'), 'utf8');
    const registrationHtml = await readFile(
      join(process.cwd(), 'public/registration.html'),
      'utf8',
    );
    const profileHtml = await readFile(join(process.cwd(), 'public/profile.html'), 'utf8');

    expect(loginHtml).toContain('已核准的登入憑證');
    expect(loginHtml).toContain(publicUi.PUBLIC_FORM_LOGIN_CREDENTIAL_PLACEHOLDER);

    expect(registrationHtml).toContain(publicUi.PUBLIC_FORM_DISPLAY_NAME_LABEL);
    expect(registrationHtml).toContain(publicUi.PUBLIC_FORM_DISPLAY_NAME_PLACEHOLDER);
    expect(registrationHtml).toContain(publicUi.PUBLIC_FORM_BIRTH_YEAR_MONTH_LABEL);
    expect(registrationHtml).toContain(publicUi.PUBLIC_FORM_BIRTH_YEAR_MONTH_PLACEHOLDER);
    expect(registrationHtml).toContain(publicUi.PUBLIC_FORM_RESIDENTIAL_REGION_LABEL);
    expect(registrationHtml).toContain(publicUi.PUBLIC_FORM_REGION_SELECT_PROMPT);
    expect(registrationHtml).toContain(publicUi.PUBLIC_FORM_REGISTRATION_CREDENTIAL_PLACEHOLDER);
    expect(registrationHtml).toContain(publicUi.PUBLIC_FORM_REGISTRATION_DISPLAY_NAME_HINT);
    expect(registrationHtml).toContain(publicUi.PUBLIC_FORM_REGISTRATION_BIRTH_YEAR_MONTH_HINT);
    expect(registrationHtml).toContain(publicUi.PUBLIC_FORM_REGISTRATION_RESIDENTIAL_REGION_HINT);
    expect(registrationHtml).toContain(publicUi.PUBLIC_FORM_REGISTRATION_CREDENTIAL_FIELD_HINT);

    expect(profileHtml).toContain(publicUi.PUBLIC_FORM_BIRTH_YEAR_MONTH_LABEL);
    expect(profileHtml).toContain(publicUi.PUBLIC_FORM_BIRTH_YEAR_MONTH_PLACEHOLDER);
    expect(profileHtml).toContain(publicUi.PUBLIC_FORM_RESIDENTIAL_REGION_LABEL);
    expect(profileHtml).toContain(publicUi.PUBLIC_FORM_REGION_EMPTY_OPTION);
    expect(profileHtml).toContain(publicUi.PUBLIC_FORM_PROFILE_BIRTH_YEAR_MONTH_HINT);
    expect(profileHtml).toContain(publicUi.PUBLIC_FORM_PROFILE_RESIDENTIAL_REGION_HINT);

    expect(profileHtml).not.toContain('name="display_name"');
    expect(registrationHtml).toContain('data-login-state-read="disabled"');
  });

  it('keeps profile fields limited to birth_year_month and residential_region only', async () => {
    const profileHtml = await readFile(join(process.cwd(), 'public/profile.html'), 'utf8');
    const profileSource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/profile-page.js'), 'utf8'),
    );

    expect(profileHtml).toContain('name="birth_year_month"');
    expect(profileHtml).toContain('name="residential_region"');
    const profileFormBlock = profileHtml.slice(
      profileHtml.indexOf('<form id="profile-form"'),
      profileHtml.indexOf('</form>') + '</form>'.length,
    );
    const profileFieldNames = [...profileFormBlock.matchAll(/\bname="([^"]+)"/g)].map(
      (match) => match[1],
    );
    expect(profileFieldNames.sort()).toEqual(['birth_year_month', 'residential_region']);
    expect(profileSource).toContain('/users/me/profile');
    expect(profileSource).not.toMatch(/\/users\/me[^/]/);
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
        display_name: 'Form Checkpoint User',
        birth_year_month: '1998-07',
        residential_region: 'TW-TPE',
      },
      credential: 'proof',
      fetchImpl,
    });

    expect(fetchCalls).toEqual(['/registration']);

    const body = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body));
    expect(Object.keys(body).sort()).toEqual([
      'birth_year_month',
      'display_name',
      'residential_region',
    ]);

    const source = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/registration-page.js'), 'utf8'),
    );
    expect(source).not.toMatch(/mountLoginStateRead|\/users\/me|Set-Cookie|document\.cookie/i);
  });

  it('keeps vote-by-index body unchanged and does not pre-resolve option index to option_id', async () => {
    const votePage = await loadModule('public/frontend/vote-page.js');
    const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => ({
      ok: true,
      status: 201,
      json: async () => ({
        vote_token: 'secret-token',
        option_id: 'secret-option',
        shard_id: 7,
        message: 'backend INTERNAL stack trace',
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

  it('keeps Official Vote transaction order unchanged in backend source', async () => {
    const repository = await readFile(
      join(process.cwd(), 'src/polls/repository.ts'),
      'utf8',
    );
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

  it('does not add observability hooks to reviewed form surfaces', async () => {
    for (const relativePath of REVIEWED_FORM_SURFACES) {
      const source = stripJsComments(
        await readFile(join(process.cwd(), relativePath), 'utf8'),
      );
      expect(source, relativePath).not.toMatch(FORBIDDEN_OBSERVABILITY);
    }
  });

  for (const relativePath of [...REVIEWED_FORM_SURFACES, ...STATIC_FORM_HTML]) {
    it(`keeps reviewed form field copy neutral in ${relativePath}`, async () => {
      const source = stripJsComments(
        await readFile(join(process.cwd(), relativePath), 'utf8'),
      );
      if (
        relativePath.endsWith('.js') &&
        relativePath !== 'public/frontend/public-mvp-ui.js'
      ) {
        expect(source, relativePath).not.toMatch(FORBIDDEN_BACKEND_ECHO);
      }
      expect(source, relativePath).not.toMatch(FORBIDDEN_OUTCOME_COPY);
    });
  }
});
