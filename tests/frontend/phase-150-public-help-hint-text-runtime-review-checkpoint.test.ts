import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const REVIEWED_HINT_SURFACES = [
  'public/frontend/public-mvp-ui.js',
  'public/frontend/login-page.js',
  'public/frontend/registration-page.js',
  'public/frontend/profile-completion-prompt.js',
  'public/frontend/official-vote-pre-vote-hints.js',
  'public/frontend/explore-page.js',
  'public/frontend/result-page.js',
  'public/frontend/creator-flow-copy.js',
  'public/frontend/create-poll-page.js',
  'public/frontend/vote-page.js',
  'public/frontend/public-mvp-demo.js',
];

const FOREIGN_BACKEND_TEXT =
  'backend INTERNAL stack trace option_id vote_token shard_id session_id';

const FORBIDDEN_OUTCOME_COPY =
  /你符合資格|你不符合資格|已投過票|可以投票|一定能投票|can_vote|age_passed|region_passed/i;

const FORBIDDEN_INTERNAL_COPY =
  /option_id|vote_token|token_sha256|shard_id|session_id|www_session|\buser_id\b|raw_count|poll_option_vote_counters|creator_token/i;

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

describe('Phase 150 public help / hint text runtime review checkpoint', () => {
  it('keeps PUBLIC_HINT_TEXT_MESSAGES and PUBLIC_*_HINT on fixed frontend safe copy only', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');

    expect(publicUi.PUBLIC_HINT_TEXT_MESSAGES.length).toBeGreaterThanOrEqual(20);
    expect(publicUi.PUBLIC_LOGIN_FORM_READY_HINT).toContain('production credential proof');
    expect(publicUi.PUBLIC_REGISTRATION_READY_HINT).toContain('註冊完成後仍須前往登入');
    expect(publicUi.PUBLIC_PROFILE_COMPLETION_PROMPT_HINT).toContain('不代表你一定符合或不符合');
    expect(publicUi.PUBLIC_RESULTS_INTRO_SCOPE_HINT).toContain('非即時原始票數');

    for (const message of publicUi.PUBLIC_HINT_TEXT_MESSAGES) {
      expect(typeof message).toBe('string');
      expect(message.length).toBeGreaterThan(0);
      expect(message).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(message).not.toMatch(FORBIDDEN_OUTCOME_COPY);
      expect(message).not.toMatch(/\d+%|第\s*\d+\s*名|raw_count/i);
      expect(message).not.toContain(FOREIGN_BACKEND_TEXT);
    }
  });

  it('maps login, registration, and profile prompt hints into PUBLIC_HINT_TEXT_MESSAGES', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const login = await loadModule('public/frontend/login-page.js');
    const registration = await loadModule('public/frontend/registration-page.js');
    const profilePrompt = await loadModule('public/frontend/profile-completion-prompt.js');

    expect(login.LOGIN_FORM_READY_MESSAGE).toBe(publicUi.PUBLIC_LOGIN_FORM_READY_HINT);
    expect(login.LOGIN_SHELL_DEMO_HINT_MESSAGE).toBe(publicUi.PUBLIC_LOGIN_SHELL_DEMO_HINT);
    expect(registration.REGISTRATION_READY_MESSAGE).toBe(
      publicUi.PUBLIC_REGISTRATION_READY_HINT,
    );
    expect(profilePrompt.PROFILE_COMPLETION_PROMPT_MESSAGE).toBe(
      publicUi.PUBLIC_PROFILE_COMPLETION_PROMPT_HINT,
    );

    for (const message of [
      publicUi.PUBLIC_LOGIN_FORM_READY_HINT,
      publicUi.PUBLIC_LOGIN_SHELL_DEMO_HINT,
      publicUi.PUBLIC_REGISTRATION_READY_HINT,
      publicUi.PUBLIC_PROFILE_COMPLETION_PROMPT_HINT,
    ]) {
      expect(publicUi.PUBLIC_HINT_TEXT_MESSAGES).toContain(message);
    }
  });

  it('keeps pre-vote hints neutral without eligibility outcome disclosure', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const preVote = await loadModule('public/frontend/official-vote-pre-vote-hints.js');

    expect(preVote.PRE_VOTE_HINT_COPY.anonymous).toBe(
      publicUi.PUBLIC_VOTE_PRE_VOTE_ANONYMOUS_HINT,
    );
    expect(preVote.PRE_VOTE_HINT_COPY.incompleteProfile).toBe(
      publicUi.PUBLIC_VOTE_PRE_VOTE_INCOMPLETE_PROFILE_HINT,
    );
    expect(preVote.PRE_VOTE_HINT_COPY.completeProfile).toBe(
      publicUi.PUBLIC_VOTE_PRE_VOTE_NEUTRAL_SUBMIT_HINT,
    );
    expect(preVote.PRE_VOTE_HINT_COPY.profileLoadFailed).toBe(
      publicUi.PUBLIC_VOTE_PRE_VOTE_PROFILE_LOAD_FAILED_HINT,
    );

    for (const hint of Object.values(preVote.PRE_VOTE_HINT_COPY)) {
      expect(hint).not.toMatch(FORBIDDEN_OUTCOME_COPY);
      expect(hint).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(hint).not.toMatch(/option|shard|token|user_id|session_id/i);
    }

    const source = stripJsComments(
      await readFile(
        join(process.cwd(), 'public/frontend/official-vote-pre-vote-hints.js'),
        'utf8',
      ),
    );
    expect(source).toContain('copyByState[state]');
    expect(source).toContain('message.textContent = copyByState[state]');
    expect(source).not.toMatch(/can_vote|age_passed|region_passed/);
  });

  it('maps explore, results intro, and creator flow hints into PUBLIC_HINT_TEXT_MESSAGES', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const explore = await loadModule('public/frontend/explore-page.js');
    const resultPage = await loadModule('public/frontend/result-page.js');
    const creatorFlow = await loadModule('public/frontend/creator-flow-copy.js');

    expect(explore.EXPLORE_FEED_LIST_SUMMARY).toBe(
      publicUi.PUBLIC_EXPLORE_FEED_LIST_SUMMARY_HINT,
    );
    expect(resultPage.RESULTS_INTRO_LEAD_HINT).toBe(
      publicUi.PUBLIC_RESULTS_INTRO_LEAD_HINT,
    );
    expect(resultPage.RESULTS_INTRO_SCOPE_HINT).toBe(
      publicUi.PUBLIC_RESULTS_INTRO_SCOPE_HINT,
    );
    expect(creatorFlow.CREATOR_FLOW_COPY.myPollsLead).toBe(
      publicUi.PUBLIC_CREATOR_MY_POLLS_LEAD_HINT,
    );
    expect(creatorFlow.CREATOR_FLOW_COPY.actionClose).toBe(
      publicUi.PUBLIC_CREATOR_ACTION_CLOSE_HINT,
    );

    for (const message of [
      publicUi.PUBLIC_EXPLORE_FEED_LIST_SUMMARY_HINT,
      publicUi.PUBLIC_RESULTS_INTRO_VOTE_HINT,
      publicUi.PUBLIC_CREATOR_LIFECYCLE_COLLECTING_LEAD_HINT,
    ]) {
      expect(publicUi.PUBLIC_HINT_TEXT_MESSAGES).toContain(message);
    }
  });

  it('keeps results intro hints on fixed copy without collecting-stage counter preview', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const resultPage = await loadModule('public/frontend/result-page.js');

    expect(resultPage.RESULTS_INTRO_LEAD_HINT).not.toMatch(/raw_count|\d+%/i);
    expect(resultPage.RESULTS_INTRO_SCOPE_HINT).toContain('非即時原始票數');
    expect(resultPage.RESULTS_INTRO_SCOPE_HINT).not.toMatch(/raw_count|\d+%/i);
    expect(resultPage.RESULTS_INTRO_VOTE_HINT).not.toMatch(/raw_count|\d+%/i);

    const root = {
      replaceChildren: vi.fn(),
      hidden: false,
      append: vi.fn(),
      ownerDocument: {
        createElement: (tag: string) => ({
          className: '',
          textContent: '',
          href: '',
          tagName: tag,
        }),
      },
    };
    resultPage.renderResultsReadOnlyIntro(root, '11111111-1111-4111-8111-111111111111');

    const appendedTexts = root.append.mock.calls.map(
      (call) => call[0]?.textContent ?? '',
    );
    expect(appendedTexts).toContain(publicUi.PUBLIC_RESULTS_INTRO_LEAD_HINT);
    expect(appendedTexts).toContain(publicUi.PUBLIC_RESULTS_INTRO_SCOPE_HINT);
    expect(appendedTexts).toContain(publicUi.PUBLIC_RESULTS_INTRO_VOTE_HINT);
    expect(appendedTexts.join(' ')).not.toMatch(/\d+%|raw_count/i);

    const source = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/result-page.js'), 'utf8'),
    );
    const introStart = source.indexOf('export function renderResultsReadOnlyIntro(');
    const introEnd = source.indexOf('function renderOptionLabelsList(');
    const introBody = source.slice(introStart, introEnd);
    expect(introBody).toContain('RESULTS_INTRO_LEAD_HINT');
    expect(introBody).not.toMatch(/result\.|normalized\.|total_votes|percentage/i);

    const renderStart = source.indexOf('export function renderResultDisplay(');
    const renderEnd = source.indexOf('export function', renderStart + 1);
    const renderBody =
      renderEnd > renderStart ? source.slice(renderStart, renderEnd) : source.slice(renderStart);
    expect(renderBody).toContain("normalized.mode === 'collecting'");
    expect(renderBody).toContain('renderCollectingStatusBlock');
    expect(renderBody.indexOf('total_votes_display')).toBeGreaterThan(
      renderBody.indexOf("normalized.mode === 'collecting'"),
    );
  });

  it('keeps creator flow and lifecycle hints without token, session, or internal id', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const creatorFlow = await loadModule('public/frontend/creator-flow-copy.js');

    expect(creatorFlow.CREATOR_FLOW_COPY.createSuccessLead).toBe(
      publicUi.PUBLIC_CREATOR_CREATE_SUCCESS_LEAD_HINT,
    );
    expect(creatorFlow.CREATOR_FLOW_COPY.lifecycleLeadCollecting).toBe(
      publicUi.PUBLIC_CREATOR_LIFECYCLE_COLLECTING_LEAD_HINT,
    );
    expect(creatorFlow.CREATOR_FLOW_COPY.lifecycleLeadPostLock).toBe(
      publicUi.PUBLIC_CREATOR_LIFECYCLE_POST_LOCK_LEAD_HINT,
    );
    expect(publicUi.PUBLIC_CREATOR_VOTE_URL_HINT_PREFIX).toBe('投票頁完整網址：');
    expect(publicUi.PUBLIC_CREATOR_VOTE_URL_HINT_PREFIX).not.toMatch(
      FORBIDDEN_INTERNAL_COPY,
    );

    const source = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/creator-flow-copy.js'), 'utf8'),
    );
    expect(source).toContain('PUBLIC_CREATOR_MY_POLLS_LEAD_HINT');
    expect(source).not.toMatch(/creator_token|session_id|user_id/i);
  });

  it('keeps policy-ui-placeholders.js HELP_COPY separate from PUBLIC_HINT_TEXT_MESSAGES', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const layout = await loadModule('public/frontend/public-mvp-layout.js');
    const policySource = stripJsComments(
      await readFile(
        join(process.cwd(), 'public/frontend/policy-ui-placeholders.js'),
        'utf8',
      ),
    );

    expect(policySource).toContain('HELP_COPY');
    expect(layout.HELP_COPY.collectingHidden).toContain('收集中不顯示票數');
    expect(publicUi.PUBLIC_HINT_TEXT_MESSAGES).not.toContain(layout.HELP_COPY.collectingHidden);
    expect(publicUi.PUBLIC_HINT_TEXT_MESSAGES).not.toContain(layout.HELP_COPY.lockPeriod);
    expect(publicUi.PUBLIC_HINT_TEXT_MESSAGES).not.toContain(layout.HELP_COPY.eligibility);
    expect(policySource).toContain("from './public-mvp-layout.js'");
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
        message: FOREIGN_BACKEND_TEXT,
      }),
    }));

    const response = await votePage.submitVoteByIndex({
      pollId: '11111111-1111-4111-8111-111111111111',
      optionIndex: 2,
      userId: '44444444-4444-4444-8444-444444444444',
      fetchImpl,
    });

    expect(response.ok).toBe(true);
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

  it('keeps registration boundary off auto-login, Set-Cookie, and GET /users/me', async () => {
    const registration = await loadModule('public/frontend/registration-page.js');
    const fetchCalls: string[] = [];
    const fetchImpl = vi.fn(async (url: string) => {
      fetchCalls.push(String(url));
      return { status: 201 };
    });

    await registration.submitRegistrationRequest({
      profile: {
        display_name: 'Hint Checkpoint User',
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

  it('does not add observability hooks to reviewed hint surfaces', async () => {
    for (const relativePath of REVIEWED_HINT_SURFACES) {
      const source = stripJsComments(
        await readFile(join(process.cwd(), relativePath), 'utf8'),
      );
      expect(source, relativePath).not.toMatch(FORBIDDEN_OBSERVABILITY);
    }
  });

  for (const relativePath of REVIEWED_HINT_SURFACES) {
    it(`keeps reviewed help / hint runtime neutral in ${relativePath}`, async () => {
      const raw = await readFile(join(process.cwd(), relativePath), 'utf8');
      const source = stripJsComments(raw);

      if (
        relativePath !== 'public/frontend/public-mvp-ui.js' &&
        relativePath !== 'public/frontend/official-vote-pre-vote-hints.js'
      ) {
        expect(source, relativePath).not.toMatch(FORBIDDEN_BACKEND_ECHO);
      }
      if (relativePath !== 'public/frontend/creator-flow-copy.js') {
        expect(source, relativePath).not.toMatch(FORBIDDEN_OUTCOME_COPY);
      }
    });
  }
});
