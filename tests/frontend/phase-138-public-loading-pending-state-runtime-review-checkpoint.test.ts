import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const REVIEWED_PENDING_SURFACES = [
  'public/frontend/public-mvp-ui.js',
  'public/frontend/login-page.js',
  'public/frontend/registration-page.js',
  'public/frontend/profile-page.js',
  'public/frontend/create-poll-page.js',
  'public/frontend/vote-page.js',
  'public/frontend/explore-page.js',
  'public/frontend/result-page.js',
  'public/frontend/my-polls-page.js',
  'public/frontend/poll-lifecycle-controls.js',
  'public/frontend/login-state-ui.js',
  'public/frontend/profile-completion-prompt.js',
];

const FOREIGN_BACKEND_TEXT =
  'backend INTERNAL stack trace option_id vote_token shard_id session_id';

const FORBIDDEN_OUTCOME_COPY =
  /你投過|你尚未投票|你符合資格|你不符合資格|已投過票|選擇了|投給哪個|can_vote|age_passed|region_passed|trust_passed|role_passed/i;

const FORBIDDEN_INTERNAL_COPY =
  /option_id|vote_token|token_sha256|shard_id|session_id|www_session|\buser_id\b|raw_count|poll_option_vote_counters/i;

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

function createSubmitButton(idleLabel: string) {
  return {
    tagName: 'BUTTON',
    disabled: false,
    textContent: idleLabel,
    attributes: new Map<string, string>(),
    setAttribute(name: string, value: string) {
      this.attributes.set(name, value);
    },
  };
}

describe('Phase 138 public loading / pending state runtime review checkpoint', () => {
  it('keeps PUBLIC_PENDING_USER_MESSAGES on fixed frontend safe copy only', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');

    for (const message of publicUi.PUBLIC_PENDING_USER_MESSAGES) {
      expect(message).toMatch(/請稍候。$/);
      expect(message).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(message).not.toMatch(FORBIDDEN_OUTCOME_COPY);
      expect(message).not.toContain(FOREIGN_BACKEND_TEXT);
    }

    expect(publicUi.PUBLIC_ACTION_PENDING_MESSAGE).toBe('處理中，請稍候。');
    expect(publicUi.PUBLIC_LOADING_PENDING_MESSAGE).toBe('載入中，請稍候。');
  });

  it('disables action buttons while pending and restores after reset', async () => {
    const { setBusySubmitButton } = await loadModule('public/frontend/public-mvp-ui.js');
    const button = createSubmitButton('送出投票');

    setBusySubmitButton(button, {
      busy: true,
      idleLabel: '送出投票',
      busyLabel: '送出中，請稍候。',
    });
    expect(button.disabled).toBe(true);
    expect(button.attributes.get('aria-busy')).toBe('true');

    setBusySubmitButton(button, {
      busy: false,
      idleLabel: '送出投票',
      busyLabel: '送出中，請稍候。',
    });
    expect(button.disabled).toBe(false);
    expect(button.textContent).toBe('送出投票');
    expect(button.attributes.get('aria-busy')).toBe('false');
  });

  it('restores login and registration busy state after API failure', async () => {
    const loginPage = await loadModule('public/frontend/login-page.js');
    const registration = await loadModule('public/frontend/registration-page.js');

    const loginSubmit = createSubmitButton('登入');
    const loginStatus = { textContent: '' };
    const loginForm = {
      querySelector(selector: string) {
        if (selector === '#login-shell-submit') return loginSubmit;
        if (selector === '[name="credential"]') {
          return {
            tagName: 'INPUT',
            value: 'proof',
            disabled: false,
            attributes: new Map<string, string>(),
            setAttribute(name: string, value: string) {
              this.attributes.set(name, value);
            },
            removeAttribute() {},
          };
        }
        return null;
      },
      ownerDocument: {
        getElementById(id: string) {
          return id === 'login-shell-message' ? loginStatus : null;
        },
      },
    };

    await loginPage.submitProductionLoginForm(loginForm as unknown as HTMLFormElement, {
      fetchImpl: vi.fn().mockResolvedValue({ status: 401 }),
      refreshLoginState: vi.fn(),
    });
    expect(loginSubmit.disabled).toBe(false);
    expect(loginStatus.textContent).toBe(loginPage.LOGIN_FORM_FAILURE_MESSAGE);

    const regSubmit = createSubmitButton('註冊');
    const regStatus = { textContent: '' };
    const makeField = (value: string) => ({
      tagName: 'INPUT',
      value,
      disabled: false,
      attributes: new Map<string, string>(),
      setAttribute() {},
      removeAttribute() {},
    });
    const regForm = {
      querySelector(selector: string) {
        if (selector === '#registration-submit') return regSubmit;
        if (selector === '[name="display_name"]') return makeField('Alice');
        if (selector === '[name="birth_year_month"]') return makeField('1990-01');
        if (selector === '[name="residential_region"]') {
          return { ...makeField('TW-TPE'), tagName: 'SELECT' };
        }
        if (selector === '[name="credential"]') return makeField('proof');
        return null;
      },
      ownerDocument: {
        getElementById(id: string) {
          return id === 'registration-form-message' ? regStatus : null;
        },
      },
    };

    await registration.submitRegistrationForm(regForm as unknown as HTMLFormElement, {
      fetchImpl: vi.fn().mockResolvedValue({ status: 500 }),
    });
    expect(regSubmit.disabled).toBe(false);
    expect(regStatus.textContent).toBe(registration.REGISTRATION_FAILURE_MESSAGE);
  });

  it('keeps profile save pending reset in finally after failure', async () => {
    const source = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/profile-page.js'), 'utf8'),
    );
    expect(source).toContain('PROFILE_SAVING_MESSAGE');
    expect(source).toContain('setProfileFormBusy(form, false)');
    expect(source).toMatch(/finally\s*\{[^}]*setProfileFormBusy\(form,\s*false\)/s);
  });

  it('keeps /vote/:id submit pending neutral and vote-by-index body unchanged', async () => {
    const votePage = await loadModule('public/frontend/vote-page.js');
    const source = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/vote-page.js'), 'utf8'),
    );

    expect(votePage.VOTE_SUBMIT_PENDING_MESSAGE).toBe('送出中，請稍候。');
    expect(votePage.VOTE_PAGE_LOADING_MESSAGE).toBe('載入問卷中，請稍候。');
    expect(votePage.VOTE_SUBMIT_PENDING_MESSAGE).not.toMatch(/option|票數|百分比|token|shard/i);

    expect(source).toContain('vote-by-index');
    expect(source).toContain('option_index: optionIndex');
    expect(source).not.toMatch(/option_id\s*:/);

    const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => ({
      ok: false,
      status: 403,
      json: async () => ({
        error: 'POLL_FORBIDDEN',
        message: FOREIGN_BACKEND_TEXT,
      }),
    }));

    await expect(
      votePage.submitVoteByIndex({
        pollId: '11111111-1111-4111-8111-111111111111',
        optionIndex: 0,
        userId: '44444444-4444-4444-8444-444444444444',
        fetchImpl,
      }),
    ).rejects.toThrow('目前無法完成這次投票。');

    const body = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body));
    expect(body).toEqual({ option_index: 0 });
    expect(body).not.toHaveProperty('option_id');
  });

  it('keeps lifecycle pending on generic action copy with setBusySubmitButton', async () => {
    const lifecycle = await loadModule('public/frontend/poll-lifecycle-controls.js');
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const source = stripJsComments(
      await readFile(
        join(process.cwd(), 'public/frontend/poll-lifecycle-controls.js'),
        'utf8',
      ),
    );

    expect(lifecycle.LIFECYCLE_ACTION_PENDING_MESSAGE).toBe(
      publicUi.PUBLIC_ACTION_PENDING_MESSAGE,
    );
    expect(lifecycle.LIFECYCLE_ACTION_PENDING_MESSAGE).not.toMatch(
      FORBIDDEN_INTERNAL_COPY,
    );
    expect(source).toContain('setBusySubmitButton');
    expect(source).toContain('busy: false');
  });

  it('keeps auth, create, and logout pending copy frontend-owned', async () => {
    const login = await loadModule('public/frontend/login-page.js');
    const profile = await loadModule('public/frontend/profile-page.js');
    const createPoll = await loadModule('public/frontend/create-poll-page.js');
    const loginStateUi = await loadModule('public/frontend/login-state-ui.js');

    const pendingMessages = [
      login.LOGIN_FORM_LOADING_MESSAGE,
      login.LOGIN_SUBMIT_BUSY_LABEL,
      profile.PROFILE_LOADING_MESSAGE,
      profile.PROFILE_SAVING_MESSAGE,
      createPoll.CREATE_POLL_SUBMIT_PENDING_MESSAGE,
      loginStateUi.LOGIN_LOGOUT_PENDING_MESSAGE,
    ];

    for (const message of pendingMessages) {
      expect(message).toMatch(/請稍候。$/);
      expect(message).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(message).not.toContain(FOREIGN_BACKEND_TEXT);
    }
  });

  it('keeps explore, results, and my-polls loading copy counter-free during load', async () => {
    const explore = await loadModule('public/frontend/explore-page.js');
    const resultPage = await loadModule('public/frontend/result-page.js');
    const myPolls = await loadModule('public/frontend/my-polls-page.js');

    const loadingMessages = [
      explore.EXPLORE_FEED_LOADING_MESSAGE,
      explore.EXPLORE_LOAD_MORE_PENDING_MESSAGE,
      resultPage.RESULT_PAGE_LOADING_MESSAGE,
      myPolls.MY_POLLS_LOADING_MESSAGE,
    ];

    for (const message of loadingMessages) {
      expect(message).toMatch(/請稍候。$/);
      expect(message).not.toMatch(/票數|百分比|排名|趨勢|raw_count/i);
      expect(message).not.toMatch(FORBIDDEN_OUTCOME_COPY);
    }

    expect(explore.EXPLORE_FEED_ALLOWED_ITEM_KEYS).not.toContain('vote_count');
    expect(explore.EXPLORE_FEED_ALLOWED_ITEM_KEYS).not.toContain('percentage');
  });

  it('keeps registration off auto-login, Set-Cookie, and GET /users/me during pending flow', async () => {
    const { submitRegistrationRequest } = await loadModule(
      'public/frontend/registration-page.js',
    );
    const fetchCalls: string[] = [];
    const fetchImpl = vi.fn(async (url: string) => {
      fetchCalls.push(String(url));
      return { status: 201 };
    });

    await submitRegistrationRequest({
      profile: {
        display_name: 'Checkpoint User',
        birth_year_month: '1998-07',
        residential_region: 'TW-TPE',
      },
      credential: 'proof',
      fetchImpl,
    });

    expect(fetchCalls).toEqual(['/registration']);
  });

  it('keeps create-poll submit busy reset in finally on failure path', async () => {
    const source = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/create-poll-page.js'), 'utf8'),
    );
    expect(source).toContain('CREATE_POLL_SUBMIT_PENDING_MESSAGE');
    expect(source).toMatch(/finally\s*\{[^}]*setBusySubmitButton/s);
  });

  it('does not add observability hooks to reviewed pending surfaces', async () => {
    for (const relativePath of REVIEWED_PENDING_SURFACES) {
      const source = stripJsComments(
        await readFile(join(process.cwd(), relativePath), 'utf8'),
      );
      expect(source, relativePath).not.toMatch(FORBIDDEN_OBSERVABILITY);
    }
  });

  for (const relativePath of REVIEWED_PENDING_SURFACES) {
    it(`keeps reviewed pending runtime neutral in ${relativePath}`, async () => {
      const raw = await readFile(join(process.cwd(), relativePath), 'utf8');
      const source = stripJsComments(raw);

      if (
        relativePath !== 'public/frontend/poll-lifecycle-controls.js' &&
        relativePath !== 'public/frontend/my-polls-page.js'
      ) {
        expect(source, relativePath).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      }
      expect(source, relativePath).not.toMatch(FORBIDDEN_OUTCOME_COPY);
    });
  }
});
