import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PUBLIC_SUCCESS_SURFACES = [
  'public/frontend/public-mvp-ui.js',
  'public/frontend/login-page.js',
  'public/frontend/registration-page.js',
  'public/frontend/profile-page.js',
  'public/frontend/create-poll-page.js',
  'public/frontend/vote-page.js',
  'public/frontend/poll-lifecycle-controls.js',
  'public/frontend/login-state-ui.js',
  'public/frontend/creator-flow-copy.js',
];

const FORBIDDEN_INTERNAL_COPY =
  /option_id|vote_token|token_sha256|shard_id|session_id|www_session|\buser_id\b|raw_count|poll_option_vote_counters|creator_token|creator_session/i;

const FORBIDDEN_OUTCOME_COPY =
  /你符合資格|你不符合資格|已投過票|可以投票|一定能投票|can_vote|age_passed|region_passed/i;

const FORBIDDEN_BACKEND_ECHO =
  /error\.message|body\.message|apiError\.message|response\.text\(\)|JSON\.stringify\(error/i;

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

describe('Phase 139 public success / completion state polish', () => {
  it('exports frontend-owned success allowlist with safe fixed copy', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');

    expect(publicUi.PUBLIC_SUCCESS_USER_MESSAGES.length).toBeGreaterThan(10);
    expect(publicUi.PUBLIC_LOGIN_SUCCESS_MESSAGE).toContain('登入成功');
    expect(publicUi.PUBLIC_REGISTRATION_SUCCESS_MESSAGE).toContain('請前往登入');
    expect(publicUi.PUBLIC_VOTE_SUCCESS_STATUS_MESSAGE).toBe('投票已送出。');

    for (const message of publicUi.PUBLIC_SUCCESS_USER_MESSAGES) {
      expect(typeof message).toBe('string');
      expect(message.length).toBeGreaterThan(0);
      expect(message).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(message).not.toMatch(FORBIDDEN_OUTCOME_COPY);
    }
  });

  it('maps surface success constants to the shared allowlist', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const login = await loadModule('public/frontend/login-page.js');
    const registration = await loadModule('public/frontend/registration-page.js');
    const profile = await loadModule('public/frontend/profile-page.js');
    const createPoll = await loadModule('public/frontend/create-poll-page.js');
    const votePage = await loadModule('public/frontend/vote-page.js');
    const lifecycle = await loadModule('public/frontend/poll-lifecycle-controls.js');

    expect(publicUi.PUBLIC_SUCCESS_USER_MESSAGES).toContain(
      login.LOGIN_FORM_SUCCESS_MESSAGE,
    );
    expect(publicUi.PUBLIC_SUCCESS_USER_MESSAGES).toContain(
      registration.REGISTRATION_SUCCESS_MESSAGE,
    );
    expect(publicUi.PUBLIC_SUCCESS_USER_MESSAGES).toContain(
      profile.PROFILE_SAVED_MESSAGE,
    );
    expect(publicUi.PUBLIC_SUCCESS_USER_MESSAGES).toContain(
      createPoll.CREATE_POLL_SUCCESS_MESSAGE,
    );
    expect(publicUi.PUBLIC_SUCCESS_USER_MESSAGES).toContain(
      votePage.VOTE_SUCCESS_STATUS_MESSAGE,
    );
    expect(publicUi.PUBLIC_SUCCESS_USER_MESSAGES).toContain(
      lifecycle.LIFECYCLE_TRANSITION_COPY.cancel.success,
    );
    expect(publicUi.PUBLIC_SUCCESS_USER_MESSAGES).toContain(
      lifecycle.LIFECYCLE_TRANSITION_COPY.close.success,
    );
    expect(publicUi.PUBLIC_SUCCESS_USER_MESSAGES).toContain(
      lifecycle.LIFECYCLE_TRANSITION_COPY.unpublish.success,
    );
    expect(publicUi.PUBLIC_SUCCESS_USER_MESSAGES).toContain(
      lifecycle.LIFECYCLE_RESULT_REFRESH_DEFERRED_STATUS,
    );
  });

  it('shows fixed login success without user_id or session id', async () => {
    const loginPage = await loadModule('public/frontend/login-page.js');
    const form = {
      querySelector(selector: string) {
        if (selector === '#login-shell-submit') return submitButton;
        if (selector === '[name="credential"]') return credentialInput;
        return null;
      },
      ownerDocument: {
        getElementById() {
          return status;
        },
      },
    };
    const submitButton = createSubmitButton('登入');
    const credentialInput = {
      tagName: 'INPUT',
      value: 'proof',
      disabled: false,
      attributes: new Map<string, string>(),
      setAttribute(name: string, value: string) {
        this.attributes.set(name, value);
      },
      removeAttribute(name: string) {
        this.attributes.delete(name);
      },
    };
    const status = { textContent: '' };

    const result = await loginPage.submitProductionLoginForm(
      form as unknown as HTMLFormElement,
      {
        fetchImpl: vi.fn().mockResolvedValue({ status: 201 }),
        refreshLoginState: vi.fn().mockResolvedValue({
          status: 'authenticated',
          display_name: 'Alice',
        }),
      },
    );

    expect(result.ok).toBe(true);
    expect(status.textContent).toBe(loginPage.LOGIN_FORM_SUCCESS_MESSAGE);
    expect(status.textContent).not.toMatch(FORBIDDEN_INTERNAL_COPY);
    expect(status.textContent).not.toContain('Alice');
  });

  it('keeps registration success off auto-login, Set-Cookie, and GET /users/me', async () => {
    const registration = await loadModule('public/frontend/registration-page.js');
    const submitButton = createSubmitButton('註冊');
    const makeField = (value: string, tagName = 'INPUT') => ({
      tagName,
      value,
      disabled: false,
      attributes: new Map<string, string>(),
      setAttribute(name: string, val: string) {
        this.attributes.set(name, val);
      },
      removeAttribute(name: string) {
        this.attributes.delete(name);
      },
    });
    const successPanel = { hidden: true };
    const form = {
      querySelector(selector: string) {
        if (selector === '#registration-submit') return submitButton;
        if (selector === '[name="display_name"]') return makeField('Alice');
        if (selector === '[name="birth_year_month"]') return makeField('1990-01');
        if (selector === '[name="residential_region"]') {
          return makeField('TW-TPE', 'SELECT');
        }
        if (selector === '[name="credential"]') return makeField('proof');
        return null;
      },
      ownerDocument: {
        getElementById(id: string) {
          if (id === 'registration-form-message') return status;
          if (id === 'registration-success') return successPanel;
          return null;
        },
      },
    };
    const status = { textContent: '' };
    const fetchCalls: string[] = [];
    const fetchImpl = vi.fn(async (url: string) => {
      fetchCalls.push(String(url));
      return { status: 201 };
    });

    const result = await registration.submitRegistrationForm(
      form as unknown as HTMLFormElement,
      { fetchImpl },
    );

    expect(result.ok).toBe(true);
    expect(fetchCalls).toEqual(['/registration']);
    expect(status.textContent).toBe(registration.REGISTRATION_SUCCESS_MESSAGE);
    expect(status.textContent).not.toMatch(FORBIDDEN_INTERNAL_COPY);
    expect(successPanel.hidden).toBe(false);
  });

  it('shows fixed profile save success without raw profile payload', async () => {
    const profile = await loadModule('public/frontend/profile-page.js');
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');

    expect(profile.PROFILE_SAVED_MESSAGE).toBe(
      publicUi.PUBLIC_PROFILE_SAVE_SUCCESS_MESSAGE,
    );
    expect(profile.PROFILE_SAVED_MESSAGE).not.toMatch(FORBIDDEN_INTERNAL_COPY);

    const source = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/profile-page.js'), 'utf8'),
    );
    const saveSuccessIndex = source.indexOf('announce(message, PROFILE_SAVED_MESSAGE)');
    expect(saveSuccessIndex).toBeGreaterThan(-1);
    expect(source.slice(saveSuccessIndex, saveSuccessIndex + 120)).not.toMatch(
      /JSON\.stringify|body\.|response\.json|user_id/i,
    );
  });

  it('keeps create poll success on fixed copy without creator token or internal id', async () => {
    const createPoll = await loadModule('public/frontend/create-poll-page.js');

    expect(createPoll.CREATE_POLL_SUCCESS_MESSAGE).toBe('問卷已建立。');
    expect(createPoll.CREATE_POLL_SUCCESS_MESSAGE).not.toMatch(
      FORBIDDEN_INTERNAL_COPY,
    );
    expect(createPoll.CREATE_POLL_DEMO_SUCCESS_MESSAGE).not.toMatch(
      FORBIDDEN_INTERNAL_COPY,
    );
  });

  it('keeps vote success neutral without option, eligibility, result, token, or shard', async () => {
    const votePage = await loadModule('public/frontend/vote-page.js');

    expect(votePage.VOTE_SUCCESS_MESSAGE).toBe('投票已送出，感謝參與。');
    expect(votePage.VOTE_SUCCESS_STATUS_MESSAGE).toBe('投票已送出。');
    for (const message of [
      votePage.VOTE_SUCCESS_MESSAGE,
      votePage.VOTE_SUCCESS_STATUS_MESSAGE,
      votePage.VOTE_DEMO_SUCCESS_STATUS_MESSAGE,
    ]) {
      expect(message).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(message).not.toMatch(FORBIDDEN_OUTCOME_COPY);
      expect(message).not.toMatch(/option|eligibility|shard|token/i);
    }

    const source = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/vote-page.js'), 'utf8'),
    );
    const successBlock = source.slice(
      source.indexOf('voteCompleted = true'),
      source.indexOf('renderVoteSuccess'),
    );
    expect(successBlock).not.toMatch(/response\.json|body\.|apiError/);
  });

  it('keeps lifecycle success on fixed copy without creator token or internal id', async () => {
    const lifecycle = await loadModule('public/frontend/poll-lifecycle-controls.js');

    for (const action of ['cancel', 'close', 'unpublish'] as const) {
      const success = lifecycle.LIFECYCLE_TRANSITION_COPY[action].success;
      expect(success).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(success).not.toMatch(/creator_token|creator_session|poll_id/i);
    }
    expect(lifecycle.LIFECYCLE_RESULT_REFRESH_DEFERRED_STATUS).not.toMatch(
      FORBIDDEN_INTERNAL_COPY,
    );
  });

  it('resets logout header state without showing session id or token', async () => {
    const loginStateUi = await loadModule('public/frontend/login-state-ui.js');
    const mount = {
      hidden: false,
      className: 'mvp-login-state mvp-login-state--signed-in',
      id: 'mvp-login-state',
      attributes: new Map<string, string>(),
      children: [] as unknown[],
      querySelector(selector: string) {
        if (selector === '.mvp-login-state-logout') return logoutBtn;
        if (selector === '.mvp-login-state-error') return null;
        return null;
      },
      replaceChildren() {
        this.children = [];
        this.className = 'mvp-login-state';
      },
      setAttribute(name: string, value: string) {
        this.attributes.set(name, value);
      },
      removeAttribute(name: string) {
        this.attributes.delete(name);
      },
      append() {},
      ownerDocument: {
        createElement() {
          return {
            className: '',
            textContent: '',
            setAttribute() {},
            append() {},
          };
        },
      },
    };
    const logoutBtn = createSubmitButton('登出');
    const actions = { querySelector: vi.fn() };

    const result = await loginStateUi.handleLoginStateLogout(
      mount as unknown as HTMLElement,
      actions as unknown as HTMLElement,
      {
        fetchImpl: vi.fn().mockResolvedValue({ ok: true, status: 204 }),
      },
    );

    expect(result.ok).toBe(true);
    expect(mount.className).toBe('mvp-login-state');
    const errorEl = mount.querySelector('.mvp-login-state-error');
    expect(errorEl).toBeNull();
    expect(JSON.stringify(mount)).not.toMatch(FORBIDDEN_INTERNAL_COPY);
  });

  for (const relativePath of PUBLIC_SUCCESS_SURFACES) {
    it(`keeps reviewed success/completion copy neutral in ${relativePath}`, async () => {
      const raw = await readFile(join(process.cwd(), relativePath), 'utf8');
      const source = stripJsComments(raw);

      if (
        relativePath !== 'public/frontend/poll-lifecycle-controls.js' &&
        relativePath !== 'public/frontend/login-state-ui.js' &&
        relativePath !== 'public/frontend/public-mvp-ui.js' &&
        relativePath !== 'public/frontend/login-page.js'
      ) {
        expect(source, relativePath).not.toMatch(FORBIDDEN_BACKEND_ECHO);
      }
      if (
        relativePath !== 'public/frontend/poll-lifecycle-controls.js' &&
        relativePath !== 'public/frontend/creator-flow-copy.js'
      ) {
        expect(source, relativePath).not.toMatch(FORBIDDEN_OUTCOME_COPY);
      }
    });
  }
});
