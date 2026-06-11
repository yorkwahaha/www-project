import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const REVIEWED_SUCCESS_SURFACES = [
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

const FOREIGN_BACKEND_TEXT =
  'backend INTERNAL stack trace option_id vote_token shard_id session_id';

const FORBIDDEN_OUTCOME_COPY =
  /你投過|你尚未投票|你符合資格|你不符合資格|已投過票|選擇了|投給哪個|can_vote|age_passed|region_passed|trust_passed|role_passed/i;

const FORBIDDEN_INTERNAL_COPY =
  /option_id|vote_token|token_sha256|shard_id|session_id|www_session|\buser_id\b|raw_count|poll_option_vote_counters|creator_token/i;

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

describe('Phase 140 public success / completion state runtime review checkpoint', () => {
  it('keeps PUBLIC_SUCCESS_USER_MESSAGES on fixed frontend safe copy only', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');

    expect(publicUi.PUBLIC_SUCCESS_USER_MESSAGES.length).toBeGreaterThan(10);
    expect(publicUi.PUBLIC_VOTE_SUCCESS_STATUS_MESSAGE).toBe('投票已送出。');

    for (const message of publicUi.PUBLIC_SUCCESS_USER_MESSAGES) {
      expect(typeof message).toBe('string');
      expect(message.length).toBeGreaterThan(0);
      expect(message).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(message).not.toMatch(FORBIDDEN_OUTCOME_COPY);
      expect(message).not.toContain(FOREIGN_BACKEND_TEXT);
    }
  });

  it('maps reviewed surface success constants into PUBLIC_SUCCESS_USER_MESSAGES', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const login = await loadModule('public/frontend/login-page.js');
    const registration = await loadModule('public/frontend/registration-page.js');
    const profile = await loadModule('public/frontend/profile-page.js');
    const createPoll = await loadModule('public/frontend/create-poll-page.js');
    const votePage = await loadModule('public/frontend/vote-page.js');
    const lifecycle = await loadModule('public/frontend/poll-lifecycle-controls.js');

    const mappedMessages = [
      login.LOGIN_FORM_SUCCESS_MESSAGE,
      registration.REGISTRATION_SUCCESS_MESSAGE,
      profile.PROFILE_SAVED_MESSAGE,
      createPoll.CREATE_POLL_SUCCESS_MESSAGE,
      votePage.VOTE_SUCCESS_STATUS_MESSAGE,
      lifecycle.LIFECYCLE_TRANSITION_COPY.cancel.success,
      lifecycle.LIFECYCLE_TRANSITION_COPY.close.success,
      lifecycle.LIFECYCLE_TRANSITION_COPY.unpublish.success,
      lifecycle.LIFECYCLE_RESULT_REFRESH_DEFERRED_STATUS,
      publicUi.PUBLIC_SHARE_LINK_COPIED_MESSAGE,
    ];

    for (const message of mappedMessages) {
      expect(publicUi.PUBLIC_SUCCESS_USER_MESSAGES).toContain(message);
      expect(message).not.toContain(FOREIGN_BACKEND_TEXT);
    }
  });

  it('shows fixed login success without user_id, session id, or token', async () => {
    const loginPage = await loadModule('public/frontend/login-page.js');
    const status = { textContent: '' };
    const submitButton = createSubmitButton('登入');
    const form = {
      querySelector(selector: string) {
        if (selector === '#login-shell-submit') return submitButton;
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
        getElementById() {
          return status;
        },
      },
    };

    const result = await loginPage.submitProductionLoginForm(
      form as unknown as HTMLFormElement,
      {
        fetchImpl: vi.fn().mockResolvedValue({ status: 201 }),
        refreshLoginState: vi.fn().mockResolvedValue({
          status: 'authenticated',
          display_name: 'Checkpoint User',
          user_id: 'secret-user-id',
        }),
      },
    );

    expect(result.ok).toBe(true);
    expect(status.textContent).toBe(loginPage.LOGIN_FORM_SUCCESS_MESSAGE);
    expect(status.textContent).not.toMatch(FORBIDDEN_INTERNAL_COPY);
    expect(status.textContent).not.toContain('Checkpoint User');
    expect(status.textContent).not.toContain('secret-user-id');
  });

  it('keeps registration success off auto-login, Set-Cookie, and GET /users/me', async () => {
    const registration = await loadModule('public/frontend/registration-page.js');
    const fetchCalls: string[] = [];
    const fetchImpl = vi.fn(async (url: string) => {
      fetchCalls.push(String(url));
      return { status: 201 };
    });

    await registration.submitRegistrationRequest({
      profile: {
        display_name: 'Checkpoint User',
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
    expect(source).toContain('REGISTRATION_SUCCESS_MESSAGE');
    expect(source).not.toMatch(/mountLoginStateRead|\/users\/me|Set-Cookie|document\.cookie/i);
  });

  it('keeps profile save success on fixed copy without raw profile field echo', async () => {
    const profile = await loadModule('public/frontend/profile-page.js');
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const source = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/profile-page.js'), 'utf8'),
    );

    expect(profile.PROFILE_SAVED_MESSAGE).toBe(
      publicUi.PUBLIC_PROFILE_SAVE_SUCCESS_MESSAGE,
    );
    expect(profile.PROFILE_SAVED_MESSAGE).not.toContain('birth_year_month');
    expect(profile.PROFILE_SAVED_MESSAGE).not.toContain('residential_region');
    expect(profile.PROFILE_SAVED_MESSAGE).not.toMatch(FORBIDDEN_INTERNAL_COPY);

    const saveSuccessIndex = source.indexOf('announce(message, PROFILE_SAVED_MESSAGE)');
    expect(saveSuccessIndex).toBeGreaterThan(-1);
    expect(source.slice(saveSuccessIndex, saveSuccessIndex + 160)).not.toMatch(
      /JSON\.stringify|body\.|response\.json|birth_year_month|residential_region|user_id/i,
    );
  });

  it('keeps create poll success on fixed copy without creator token or backend payload echo', async () => {
    const createPoll = await loadModule('public/frontend/create-poll-page.js');
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const source = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/create-poll-page.js'), 'utf8'),
    );

    expect(createPoll.CREATE_POLL_SUCCESS_MESSAGE).toBe(
      publicUi.PUBLIC_CREATE_POLL_SUCCESS_MESSAGE,
    );
    expect(createPoll.CREATE_POLL_SUCCESS_MESSAGE).not.toMatch(FORBIDDEN_INTERNAL_COPY);

    const successAnnounceIndex = source.indexOf('CREATE_POLL_SUCCESS_MESSAGE');
    expect(successAnnounceIndex).toBeGreaterThan(-1);
    expect(source.slice(successAnnounceIndex, successAnnounceIndex + 220)).not.toMatch(
      /created\.|response\.json|creator_token|poll_id.*textContent/i,
    );
    expect(source).toContain('renderPollSharePanel');
  });

  it('keeps /vote/:id submit success neutral and vote-by-index body unchanged', async () => {
    const votePage = await loadModule('public/frontend/vote-page.js');
    const source = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/vote-page.js'), 'utf8'),
    );

    expect(votePage.VOTE_SUCCESS_STATUS_MESSAGE).toBe('投票已送出。');
    expect(votePage.VOTE_SUCCESS_MESSAGE).toBe('投票已送出，感謝參與。');
    for (const message of [
      votePage.VOTE_SUCCESS_MESSAGE,
      votePage.VOTE_SUCCESS_STATUS_MESSAGE,
      votePage.VOTE_DEMO_SUCCESS_STATUS_MESSAGE,
    ]) {
      expect(message).not.toMatch(/option|eligibility|shard|token|票數|百分比/i);
      expect(message).not.toMatch(FORBIDDEN_OUTCOME_COPY);
    }

    const successBlock = source.slice(
      source.indexOf('voteCompleted = true'),
      source.indexOf('renderVoteSuccess'),
    );
    expect(successBlock).not.toMatch(/response\.json|body\.|apiError/);

    expect(source).toContain('vote-by-index');
    expect(source).toContain('option_index: optionIndex');
    expect(source).not.toMatch(/option_id\s*:/);

    const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => ({
      ok: true,
      status: 201,
      json: async () => ({
        vote_token: 'secret-token',
        option_id: 'secret-option',
        shard_id: 7,
        message: FOREIGN_BACKEND_TEXT,
      }),
    }));

    const response = await votePage.submitVoteByIndex({
      pollId: '11111111-1111-4111-8111-111111111111',
      optionIndex: 0,
      userId: '44444444-4444-4444-8444-444444444444',
      fetchImpl,
    });

    expect(response.ok).toBe(true);
    const body = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body));
    expect(body).toEqual({ option_index: 0 });
    expect(body).not.toHaveProperty('option_id');
  });

  it('keeps lifecycle success on shared constants without creator token or internal id', async () => {
    const lifecycle = await loadModule('public/frontend/poll-lifecycle-controls.js');
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const source = stripJsComments(
      await readFile(
        join(process.cwd(), 'public/frontend/poll-lifecycle-controls.js'),
        'utf8',
      ),
    );

    expect(lifecycle.LIFECYCLE_TRANSITION_COPY.cancel.success).toBe(
      publicUi.PUBLIC_LIFECYCLE_CANCEL_SUCCESS_MESSAGE,
    );
    expect(lifecycle.LIFECYCLE_TRANSITION_COPY.close.success).toBe(
      publicUi.PUBLIC_LIFECYCLE_CLOSE_SUCCESS_MESSAGE,
    );
    expect(lifecycle.LIFECYCLE_TRANSITION_COPY.unpublish.success).toBe(
      publicUi.PUBLIC_LIFECYCLE_UNPUBLISH_SUCCESS_MESSAGE,
    );

    for (const action of ['cancel', 'close', 'unpublish'] as const) {
      const success = lifecycle.LIFECYCLE_TRANSITION_COPY[action].success;
      expect(success).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(success).not.toMatch(/creator_session|poll_id/i);
    }

    expect(source).toContain('copy.success');
    expect(source).not.toMatch(/textContent\s*=\s*body\./);
  });

  it('resets logout header state without session id or token success message', async () => {
    const loginStateUi = await loadModule('public/frontend/login-state-ui.js');
    const source = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/login-state-ui.js'), 'utf8'),
    );
    const mount = {
      hidden: false,
      className: 'mvp-login-state mvp-login-state--signed-in',
      id: 'mvp-login-state',
      attributes: new Map<string, string>(),
      querySelector(selector: string) {
        if (selector === '.mvp-login-state-logout') return logoutBtn;
        if (selector === '.mvp-login-state-error') return null;
        return null;
      },
      replaceChildren() {
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

    const result = await loginStateUi.handleLoginStateLogout(
      mount as unknown as HTMLElement,
      { querySelector: vi.fn() } as unknown as HTMLElement,
      {
        fetchImpl: vi.fn().mockResolvedValue({ ok: true, status: 204 }),
      },
    );

    expect(result.ok).toBe(true);
    expect(mount.className).toBe('mvp-login-state');
    expect(source).not.toMatch(/logout.*success|session.*success|token.*success/i);
    expect(source).not.toMatch(/textContent\s*=\s*.*session_id|textContent\s*=\s*.*token/i);
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

  it('does not add observability hooks to reviewed success surfaces', async () => {
    for (const relativePath of REVIEWED_SUCCESS_SURFACES) {
      const source = stripJsComments(
        await readFile(join(process.cwd(), relativePath), 'utf8'),
      );
      expect(source, relativePath).not.toMatch(FORBIDDEN_OBSERVABILITY);
    }
  });

  for (const relativePath of REVIEWED_SUCCESS_SURFACES) {
    it(`keeps reviewed success runtime neutral in ${relativePath}`, async () => {
      const raw = await readFile(join(process.cwd(), relativePath), 'utf8');
      const source = stripJsComments(raw);

      if (
        relativePath !== 'public/frontend/poll-lifecycle-controls.js' &&
        relativePath !== 'public/frontend/login-state-ui.js' &&
        relativePath !== 'public/frontend/public-mvp-ui.js'
      ) {
        expect(source, relativePath).not.toMatch(FORBIDDEN_INTERNAL_COPY);
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
