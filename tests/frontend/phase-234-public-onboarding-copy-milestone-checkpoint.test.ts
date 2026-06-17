import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_234_DOC =
  'docs/www-project-phase-234-public-onboarding-copy-milestone-checkpoint-v1.md';

const ONBOARDING_COPY_MODULES = [
  'public/frontend/public-mvp-ui.js',
  'public/frontend/auth-state-copy.js',
  'public/frontend/public-mvp-home.js',
  'public/frontend/registration-page.js',
  'public/frontend/login-page.js',
  'public/frontend/profile-page.js',
  'public/frontend/create-poll-page.js',
  'public/frontend/my-polls-page.js',
  'public/frontend/vote-page.js',
  'public/frontend/result-page.js',
] as const;

const FORBIDDEN_ELIGIBILITY_OUTCOME =
  /你符合資格|你不符合資格|已投過票|可以投票|一定能投票|can_vote|age_passed|region_passed/i;

const FORBIDDEN_DEBUG_LEAKAGE =
  /request_id|requestId|trace_id|traceId|stack trace|internal code|error_code/i;

const FORBIDDEN_ENGINEER_COPY = /fail closed|AUTH_REQUIRED/i;

const FORBIDDEN_STORAGE = /localStorage|sessionStorage|document\.cookie|Set-Cookie/i;

function stripJsComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 234 public onboarding copy milestone checkpoint', () => {
  it('confirms Phase 234 is docs/static only with README index reference', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_234_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(doc).toContain('Phase 234');
    expect(doc).toContain('Public Onboarding Copy Milestone Checkpoint');
    expect(doc).toContain('milestone checkpoint');
    expect(doc).toContain('no runtime change');
    expect(doc).toContain('no API change');
    expect(doc).toContain('no frontend change');
    expect(doc).toContain('no migration');
    expect(doc).toContain('no schema change');
    expect(doc).toContain('no CSS/HTML/JS copy changes');
    expect(doc).toContain('FAQ onboarding / help copy');
    expect(doc).toContain(
      'APPROVED — Public onboarding copy milestone complete (Phase 222–233); no runtime/API/DB/backend/auth/vote/result/creator/profile/privacy drift identified.',
    );

    expect(readme).toContain('Phase 234');
    expect(readme).toContain(PHASE_234_DOC);
    expect(readme).toContain('Public onboarding copy milestone checkpoint');
  });

  it('keeps all four shared onboarding allowlists in public-mvp-ui.js', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const uiSource = await readFile(join(process.cwd(), 'public/frontend/public-mvp-ui.js'), 'utf8');

    expect(uiSource).toContain('PUBLIC_AUTH_STATE_ONBOARDING_MESSAGES');
    expect(uiSource).toContain('PUBLIC_AUTH_ACCOUNT_ONBOARDING_MESSAGES');
    expect(uiSource).toContain('PUBLIC_CREATOR_ONBOARDING_MESSAGES');
    expect(uiSource).toContain('PUBLIC_VOTE_RESULTS_ONBOARDING_MESSAGES');

    for (const allowlist of [
      publicUi.PUBLIC_AUTH_STATE_ONBOARDING_MESSAGES,
      publicUi.PUBLIC_AUTH_ACCOUNT_ONBOARDING_MESSAGES,
      publicUi.PUBLIC_CREATOR_ONBOARDING_MESSAGES,
      publicUi.PUBLIC_VOTE_RESULTS_ONBOARDING_MESSAGES,
    ]) {
      expect(allowlist.length).toBeGreaterThan(0);
      expect(publicUi.PUBLIC_HINT_TEXT_MESSAGES).toEqual(expect.arrayContaining(allowlist));
      for (const message of allowlist) {
        expect(message).not.toMatch(FORBIDDEN_DEBUG_LEAKAGE);
      }
    }

    expect(publicUi.PUBLIC_AUTH_BANNER_GUEST_BODY).toContain('不會自動登入');
    expect(publicUi.PUBLIC_VOTE_POLICY_LOGIN_TEXT).toContain('不代表一定可以完成投票');
    expect(publicUi.PUBLIC_LOGIN_PAGE_BANNER_BODY).not.toMatch(FORBIDDEN_ENGINEER_COPY);
  });

  it('keeps account onboarding static HTML aligned with shared constants', async () => {
    const ui = await loadModule('public/frontend/public-mvp-ui.js');
    const registrationHtml = await readFile(join(process.cwd(), 'public/registration.html'), 'utf8');
    const loginHtml = await readFile(join(process.cwd(), 'public/login.html'), 'utf8');
    const profileHtml = await readFile(join(process.cwd(), 'public/profile.html'), 'utf8');
    const indexHtml = await readFile(join(process.cwd(), 'public/index.html'), 'utf8');

    expect(registrationHtml).toContain('data-login-state-read="disabled"');
    expect(registrationHtml).toContain(ui.PUBLIC_REGISTRATION_PAGE_BANNER_BODY);
    expect(loginHtml).toContain(ui.PUBLIC_LOGIN_PAGE_BANNER_BODY);
    expect(ui.PUBLIC_LOGIN_PAGE_BANNER_BODY).not.toMatch(FORBIDDEN_ENGINEER_COPY);
    expect(profileHtml).toContain(ui.PUBLIC_PROFILE_PAGE_LEAD);
    // Phase 301: the homepage account-flow note was removed; the home keeps the
    // register/login access links while the long-form copy lives on those pages.
    expect(indexHtml).toContain('href="/registration"');
    expect(indexHtml).toContain('href="/login"');
    expect(ui.PUBLIC_PROFILE_PAGE_LEAD).toContain('不表示可保證符合或不符合');
  });

  it('keeps creator onboarding static HTML aligned without engineer-facing banner copy', async () => {
    const ui = await loadModule('public/frontend/public-mvp-ui.js');
    const createPollHtml = await readFile(join(process.cwd(), 'public/create-poll.html'), 'utf8');
    const myPollsHtml = await readFile(join(process.cwd(), 'public/my-polls.html'), 'utf8');

    expect(createPollHtml).toContain('id="create-poll-page-banner"');
    expect(createPollHtml).toContain('create-poll-my-polls-nav-hint');
    expect(ui.PUBLIC_CREATE_POLL_PAGE_BANNER_BODY).toContain('展示模式');
    expect(myPollsHtml).toContain('id="my-polls-page-banner"');
    expect(myPollsHtml).toContain('my-polls-create-poll-nav-hint');
    expect(ui.PUBLIC_MY_POLLS_PAGE_BANNER_BODY).toContain('?live=1');
    expect(myPollsHtml).not.toContain('creator_session');
    expect(myPollsHtml).not.toContain('X-User-Id');
  });

  it('keeps participant onboarding static HTML aligned with shared constants', async () => {
    const ui = await loadModule('public/frontend/public-mvp-ui.js');
    const voteHtml = await readFile(join(process.cwd(), 'public/vote.html'), 'utf8');
    const resultsHtml = await readFile(join(process.cwd(), 'public/results.html'), 'utf8');

    expect(voteHtml).toContain('id="vote-policy-hint-list"');
    expect(voteHtml).toContain('id="vote-view-results-nav-hint"');
    expect(ui.PUBLIC_VOTE_PAGE_REMINDER_LEAD).toContain('正式投票');
    expect(resultsHtml).toContain('id="results-vote-nav-hint"');
    expect(ui.PUBLIC_RESULTS_PAGE_DEMO_INTRO_LEAD).toContain('示範頁');
  });

  it('keeps registration success without GET /users/me or Set-Cookie', async () => {
    const registration = await loadModule('public/frontend/registration-page.js');
    const registrationSource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/registration-page.js'), 'utf8'),
    );
    const fetchCalls: string[] = [];
    const fetchImpl = vi.fn(async (url: string) => {
      fetchCalls.push(String(url));
      return { status: 201 };
    });

    expect(registrationSource).toContain("fetchImpl('/registration'");
    expect(registrationSource).not.toMatch(/\/users\/me|Set-Cookie|login\/session/i);

    await registration.submitRegistrationRequest({
      profile: {
        display_name: 'Milestone User',
        birth_year_month: '1998-07',
        residential_region: 'TW-TPE',
      },
      credential: 'proof',
      fetchImpl,
    });
    expect(fetchCalls).toEqual(['/registration']);
  });

  it('keeps creator onboarding sync copy-only without changing parseLiveApiMode', async () => {
    const createPoll = await loadModule('public/frontend/create-poll-page.js');
    const createPollSource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/create-poll-page.js'), 'utf8'),
    );
    const documentObject = {
      getElementById: () => ({ textContent: '', replaceChildren: vi.fn(), append: vi.fn() }),
      querySelector: () => null,
      createElement: () => ({ href: '', textContent: '', append: vi.fn() }),
      createTextNode: (value: string) => ({ textContent: value }),
    };

    createPoll.syncCreatePollPageOnboardingCopy(documentObject);
    expect(createPollSource).toContain('parseLiveApiMode');
    expect(createPollSource).toContain("fetchImpl('/creator/polls'");
    expect(createPollSource).not.toMatch(FORBIDDEN_STORAGE);
  });

  it('keeps vote/results onboarding nav hints href-only', async () => {
    const ui = await loadModule('public/frontend/public-mvp-ui.js');
    const votePage = await loadModule('public/frontend/vote-page.js');
    const resultPage = await loadModule('public/frontend/result-page.js');
    const pollId = '11111111-1111-4111-8111-111111111111';
    const createdLinks: Array<{ href: string; textContent: string }> = [];
    const makeDocument = (navId: string) => ({
      getElementById(id: string) {
        if (id === navId) {
          return { replaceChildren: vi.fn(), append: vi.fn(), hidden: true };
        }
        if (id === 'vote-page-reminder-lead' || id === 'results-page-demo-intro') {
          return { textContent: '' };
        }
        if (id === 'vote-policy-hint-list') {
          return { replaceChildren: vi.fn(), append: vi.fn() };
        }
        if (id === 'vote-follow-results-body' || id === 'vote-follow-results-mock-note') {
          return { textContent: '' };
        }
        if (id === 'vote-collecting-notice-body') {
          return { textContent: '' };
        }
        if (id === 'page-title') {
          return {
            textContent: '',
            getAttribute: () => null,
            removeAttribute: vi.fn(),
          };
        }
        return null;
      },
      querySelector: () => null,
      createElement: (tagName: string) => {
        const element = { tagName, href: '', textContent: '', append: vi.fn() };
        if (tagName === 'a') {
          createdLinks.push(element);
        }
        return element;
      },
      createTextNode: (value: string) => ({ nodeType: 3, textContent: value }),
    });

    votePage.syncVotePageOnboardingCopy(makeDocument('vote-view-results-nav-hint'), { pollId });
    resultPage.syncResultsPageOnboardingCopy(makeDocument('results-vote-nav-hint'), {
      demoOnly: false,
      pollId,
      windowObject: { location: { pathname: `/results/${pollId}` } },
    });

    expect(createdLinks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          href: `/results/${pollId}`,
          textContent: ui.PUBLIC_CTA_VIEW_PUBLIC_RESULTS_LABEL,
        }),
        expect.objectContaining({
          href: `/vote/${pollId}`,
          textContent: ui.PUBLIC_CTA_GO_TO_VOTE_PAGE_LABEL,
        }),
      ]),
    );
  });

  it('keeps quality_badge presentation and vote-by-index boundaries', async () => {
    const badge = await loadModule('public/frontend/quality-feedback-badge.js');
    const votePage = await loadModule('public/frontend/vote-page.js');
    const fetchImpl = vi.fn(async () => ({
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
    expect(badge.QUALITY_FEEDBACK_BADGE_LABEL).toBe('回饋良好');
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: null })).toBe(false);
  });

  it('keeps onboarding copy modules free of storage and forbidden patterns', async () => {
    for (const relativePath of ONBOARDING_COPY_MODULES) {
      const source = stripJsComments(
        await readFile(join(process.cwd(), relativePath), 'utf8'),
      );
      expect(source, relativePath).not.toMatch(FORBIDDEN_STORAGE);
      if (
        relativePath !== 'public/frontend/public-mvp-ui.js' &&
        relativePath !== 'public/frontend/create-poll-page.js' &&
        relativePath !== 'public/frontend/my-polls-page.js'
      ) {
        expect(source, relativePath).not.toMatch(FORBIDDEN_ELIGIBILITY_OUTCOME);
      }
    }
  });

  it('keeps Official Vote transaction order unchanged in backend source', async () => {
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
    expect(repository).not.toContain('Phase 234');
  });
});
