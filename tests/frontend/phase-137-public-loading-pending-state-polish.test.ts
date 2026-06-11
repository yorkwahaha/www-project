import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PUBLIC_PENDING_SURFACES = [
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

const FORBIDDEN_INTERNAL_COPY =
  /option_id|vote_token|token_sha256|shard_id|session_id|www_session|\buser_id\b|raw_count|poll_option_vote_counters/i;

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

describe('Phase 137 public loading / pending state polish', () => {
  it('exports frontend-owned pending allowlist with generic action and loading copy', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');

    expect(publicUi.PUBLIC_ACTION_PENDING_MESSAGE).toBe('處理中，請稍候。');
    expect(publicUi.PUBLIC_LOADING_PENDING_MESSAGE).toBe('載入中，請稍候。');
    expect(publicUi.PUBLIC_PENDING_USER_MESSAGES).toContain(
      publicUi.PUBLIC_ACTION_PENDING_MESSAGE,
    );
    expect(publicUi.PUBLIC_PENDING_USER_MESSAGES).toContain(
      publicUi.PUBLIC_LOADING_PENDING_MESSAGE,
    );
    for (const message of publicUi.PUBLIC_PENDING_USER_MESSAGES) {
      expect(message).toMatch(/請稍候。$/);
      expect(message).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(message).not.toMatch(FORBIDDEN_OUTCOME_COPY);
    }
  });

  it('disables submit button while busy and restores after reset', async () => {
    const { setBusySubmitButton } = await loadModule('public/frontend/public-mvp-ui.js');
    const button = createSubmitButton('送出投票');

    setBusySubmitButton(button, {
      busy: true,
      idleLabel: '送出投票',
      busyLabel: '送出中，請稍候。',
    });
    expect(button.disabled).toBe(true);
    expect(button.textContent).toBe('送出中，請稍候。');
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

  it('resets login form pending state after API failure', async () => {
    const loginPage = await loadModule('public/frontend/login-page.js');
    const form = {
      querySelector(selector: string) {
        if (selector === '#login-shell-submit') {
          return submitButton;
        }
        if (selector === '[name="credential"]') {
          return credentialInput;
        }
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
        fetchImpl: vi.fn().mockResolvedValue({ status: 401 }),
        refreshLoginState: vi.fn(),
      },
    );

    expect(result.ok).toBe(false);
    expect(submitButton.disabled).toBe(false);
    expect(submitButton.textContent).toBe('登入');
    expect(status.textContent).toBe(loginPage.LOGIN_FORM_FAILURE_MESSAGE);
    expect(status.textContent).not.toMatch(FORBIDDEN_INTERNAL_COPY);
  });

  it('resets registration form pending state after API failure', async () => {
    const registration = await loadModule('public/frontend/registration-page.js');
    const submitButton = createSubmitButton('註冊');
    const makeField = (value: string) => ({
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
    const form = {
      querySelector(selector: string) {
        if (selector === '#registration-submit') return submitButton;
        if (selector === '[name="display_name"]') return makeField('Alice');
        if (selector === '[name="birth_year_month"]') return makeField('1990-01');
        if (selector === '[name="residential_region"]') return makeField('TW-TPE');
        if (selector === '[name="credential"]') return makeField('proof');
        return null;
      },
      ownerDocument: {
        getElementById() {
          return status;
        },
      },
    };
    const status = { textContent: '' };

    const result = await registration.submitRegistrationForm(
      form as unknown as HTMLFormElement,
      {
        fetchImpl: vi.fn().mockResolvedValue({ status: 500 }),
      },
    );

    expect(result.ok).toBe(false);
    expect(submitButton.disabled).toBe(false);
    expect(submitButton.textContent).toBe('註冊');
    expect(status.textContent).toBe(registration.REGISTRATION_FAILURE_MESSAGE);
  });

  it('keeps vote submit pending copy neutral without option or eligibility leakage', async () => {
    const votePage = await loadModule('public/frontend/vote-page.js');

    expect(votePage.VOTE_SUBMIT_PENDING_MESSAGE).toBe('送出中，請稍候。');
    expect(votePage.VOTE_PAGE_LOADING_MESSAGE).toBe('載入問卷中，請稍候。');
    expect(votePage.VOTE_SUBMIT_PENDING_MESSAGE).not.toMatch(
      FORBIDDEN_OUTCOME_COPY,
    );
    expect(votePage.VOTE_SUBMIT_PENDING_MESSAGE).not.toMatch(
      FORBIDDEN_INTERNAL_COPY,
    );
    expect(votePage.VOTE_SUBMIT_PENDING_MESSAGE).not.toMatch(/option|票數|百分比/);
  });

  it('uses allowlisted lifecycle pending copy and restores button on failure', async () => {
    const lifecycle = await loadModule('public/frontend/poll-lifecycle-controls.js');
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');

    expect(lifecycle.LIFECYCLE_ACTION_PENDING_MESSAGE).toBe(
      publicUi.PUBLIC_ACTION_PENDING_MESSAGE,
    );
    expect(lifecycle.LIFECYCLE_ACTION_PENDING_MESSAGE).not.toMatch(
      FORBIDDEN_INTERNAL_COPY,
    );

    const source = stripJsComments(
      await readFile(
        join(process.cwd(), 'public/frontend/poll-lifecycle-controls.js'),
        'utf8',
      ),
    );
    expect(source).toContain('setBusySubmitButton');
    expect(source).toContain('LIFECYCLE_ACTION_PENDING_MESSAGE');
  });

  it('maps surface-specific loading messages to the shared pending pattern', async () => {
    const explore = await loadModule('public/frontend/explore-page.js');
    const resultPage = await loadModule('public/frontend/result-page.js');
    const myPolls = await loadModule('public/frontend/my-polls-page.js');
    const profilePrompt = await loadModule(
      'public/frontend/profile-completion-prompt.js',
    );
    const loginStateUi = await loadModule('public/frontend/login-state-ui.js');
    const createPoll = await loadModule('public/frontend/create-poll-page.js');

    expect(explore.EXPLORE_FEED_LOADING_MESSAGE).toBe(
      '載入探索列表中，請稍候。',
    );
    expect(explore.EXPLORE_LOAD_MORE_PENDING_MESSAGE).toBe(
      '載入更多中，請稍候。',
    );
    expect(resultPage.RESULT_PAGE_LOADING_MESSAGE).toBe('載入結果中，請稍候。');
    expect(myPolls.MY_POLLS_LOADING_MESSAGE).toBe('載入你的問卷中，請稍候。');
    expect(profilePrompt.PROFILE_COMPLETION_PROMPT_LOADING_MESSAGE).toBe(
      '載入個人資料提示中，請稍候。',
    );
    expect(loginStateUi.LOGIN_LOGOUT_PENDING_MESSAGE).toBe('登出中，請稍候。');
    expect(createPoll.CREATE_POLL_SUBMIT_PENDING_MESSAGE).toBe('建立中，請稍候。');
  });

  for (const relativePath of PUBLIC_PENDING_SURFACES) {
    it(`keeps reviewed pending/loading copy neutral in ${relativePath}`, async () => {
      const raw = await readFile(join(process.cwd(), relativePath), 'utf8');
      const source = stripJsComments(raw);

      if (
        relativePath !== 'public/frontend/poll-lifecycle-controls.js' &&
        relativePath !== 'public/frontend/my-polls-page.js'
      ) {
        expect(source, relativePath).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      }
      expect(source, relativePath).not.toMatch(FORBIDDEN_OUTCOME_COPY);
      if (
        relativePath !== 'public/frontend/public-mvp-ui.js' &&
        relativePath !== 'public/frontend/login-page.js'
      ) {
        expect(source, relativePath).not.toMatch(FORBIDDEN_BACKEND_ECHO);
      }
    });
  }
});
