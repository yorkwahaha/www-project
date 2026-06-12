import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const ALIGNED_HTML_SHELLS = [
  'public/login.html',
  'public/registration.html',
  'public/profile.html',
  'public/my-polls.html',
  'public/create-poll.html',
  'public/vote.html',
  'public/faq.html',
  'public/trust-levels.html',
  'public/results.html',
  'public/index.html',
];

const REVIEWED_SYNC_MODULES = [
  'public/frontend/login-page.js',
  'public/frontend/registration-page.js',
  'public/frontend/profile-page.js',
  'public/frontend/my-polls-page.js',
  'public/frontend/vote-page.js',
  'public/frontend/result-page.js',
  'public/frontend/public-mvp-home.js',
  'public/frontend/create-poll-page.js',
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

describe('Phase 160 public static HTML shell copy alignment runtime review checkpoint', () => {
  it('keeps login shell form ready hint aligned with PUBLIC_LOGIN_FORM_READY_HINT', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const login = await loadModule('public/frontend/login-page.js');
    const loginHtml = await readFile(join(process.cwd(), 'public/login.html'), 'utf8');

    expect(loginHtml).toContain('id="login-form-ready-hint"');
    expect(loginHtml).toContain(publicUi.PUBLIC_LOGIN_FORM_READY_HINT);

    const formReadyHint = { textContent: '' };
    login.syncLoginFormFieldCopy({
      getElementById: (id: string) => (id === 'login-form-ready-hint' ? formReadyHint : null),
      querySelector: () => null,
    });
    expect(formReadyHint.textContent).toBe(publicUi.PUBLIC_LOGIN_FORM_READY_HINT);
  });

  it('keeps registration success shell aligned with PUBLIC_REGISTRATION_SUCCESS_MESSAGE', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const registration = await loadModule('public/frontend/registration-page.js');
    const registrationHtml = await readFile(
      join(process.cwd(), 'public/registration.html'),
      'utf8',
    );

    expect(registrationHtml).toContain('id="registration-success-message"');
    expect(registrationHtml).toContain(publicUi.PUBLIC_REGISTRATION_SUCCESS_MESSAGE);

    const successMessage = { textContent: '' };
    registration.syncRegistrationSuccessCopy({
      getElementById: (id: string) =>
        id === 'registration-success-message' ? successMessage : null,
    });
    expect(successMessage.textContent).toBe(publicUi.PUBLIC_REGISTRATION_SUCCESS_MESSAGE);
  });

  it('keeps profile unauthenticated shell aligned with PUBLIC_PROFILE_VIEW_SIGN_IN_REQUIRED_MESSAGE', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const profile = await loadModule('public/frontend/profile-page.js');
    const profileHtml = await readFile(join(process.cwd(), 'public/profile.html'), 'utf8');

    expect(profileHtml).toContain('id="profile-unauth-message"');
    expect(profileHtml).toContain(publicUi.PUBLIC_PROFILE_VIEW_SIGN_IN_REQUIRED_MESSAGE);
    expect(profileHtml).toContain('href="/login"');
    expect(profileHtml).toContain('href="/registration"');

    const unauthMessage = { textContent: '' };
    profile.syncProfilePageLeadParagraphs({
      getElementById: (id: string) => {
        if (id === 'profile-unauth-message') return unauthMessage;
        return null;
      },
    });
    expect(unauthMessage.textContent).toBe(publicUi.PUBLIC_PROFILE_VIEW_SIGN_IN_REQUIRED_MESSAGE);
  });

  it('keeps my-polls demo locked row and creator side note on shared constants', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const myPolls = await loadModule('public/frontend/my-polls-page.js');
    const myPollsHtml = await readFile(join(process.cwd(), 'public/my-polls.html'), 'utf8');

    expect(myPollsHtml).toContain(publicUi.PUBLIC_MY_POLLS_LOCKED_ROW_INLINE_NOTE);
    expect(myPollsHtml).toContain('id="my-polls-creator-side-note"');
    expect(myPollsHtml).toContain(publicUi.PUBLIC_HOME_VALUE_COLLECTING_HIDDEN_BODY);

    const sidePanelNote = { textContent: '' };
    myPolls.syncMyPollsPageSectionHeadings({
      querySelector: () => null,
      getElementById: (id: string) =>
        id === 'my-polls-creator-side-note' ? sidePanelNote : null,
    });
    expect(sidePanelNote.textContent).toBe(publicUi.PUBLIC_HOME_VALUE_COLLECTING_HIDDEN_BODY);
  });

  it('keeps create-poll policy list wording aligned without syncing embedded links', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const createPollHtml = await readFile(join(process.cwd(), 'public/create-poll.html'), 'utf8');
    const createPollSource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/create-poll-page.js'), 'utf8'),
    );

    expect(createPollHtml).toContain('收集中看不到期中結果');
    expect(createPollHtml).toContain('href="/trust-levels"');
    expect(createPollHtml).toContain('href="/faq"');
    expect(publicUi.PUBLIC_CREATE_POLL_PAGE_LEAD).toContain('收集中看不到期中結果');
    expect(createPollHtml).not.toContain('期中票數');
    expect(createPollSource).not.toMatch(/mvp-form-hint-list|policy-panel-compact.*textContent/s);
  });

  it('keeps vote collecting notice aligned and preserves policy list embedded links', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const votePage = await loadModule('public/frontend/vote-page.js');
    const voteHtml = await readFile(join(process.cwd(), 'public/vote.html'), 'utf8');
    const voteSource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/vote-page.js'), 'utf8'),
    );

    expect(voteHtml).toContain('id="vote-collecting-notice-body"');
    expect(voteHtml).toContain(publicUi.PUBLIC_HOME_VALUE_COLLECTING_HIDDEN_BODY);
    expect(voteHtml).toContain('href="/faq"');
    expect(voteHtml).toContain('href="/trust-levels"');
    expect(voteHtml).not.toContain('發起者亦同');

    const collectingBody = { textContent: '' };
    votePage.syncVotePageSectionHeadings({
      querySelector: () => null,
      getElementById: (id: string) =>
        id === 'vote-collecting-notice-body' ? collectingBody : null,
    });
    expect(collectingBody.textContent).toBe(publicUi.PUBLIC_HOME_VALUE_COLLECTING_HIDDEN_BODY);
    expect(voteSource).not.toMatch(/mvp-form-hint-list/);
  });

  it('uses PUBLIC_RESULTS_DEMO_READONLY_TITLE safely for /results/demo brand and h1', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const results = await loadModule('public/frontend/result-page.js');
    const resultSource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/result-page.js'), 'utf8'),
    );

    expect(resultSource).toContain('resolveResultsReadonlyTitle');
    expect(resultSource).toContain('PUBLIC_RESULTS_DEMO_READONLY_TITLE');
    expect(resultSource).toContain('syncResultsPageBrand');

    const pageTitle = { textContent: '', getAttribute: () => null };
    const brand = { textContent: '' };
    results.syncResultsPageSectionHeadings(
      {
        getElementById: (id: string) => (id === 'page-title' ? pageTitle : null),
        querySelector: (selector: string) =>
          selector === '#main-content > p.mvp-brand' ? brand : null,
      },
      { location: { pathname: '/results/demo' } },
    );
    expect(pageTitle.textContent).toBe(publicUi.PUBLIC_RESULTS_DEMO_READONLY_TITLE);
    expect(brand.textContent).toBe(publicUi.PUBLIC_RESULTS_DEMO_READONLY_TITLE);

    const publicPageTitle = { textContent: '', getAttribute: () => null };
    const publicBrand = { textContent: '' };
    results.syncResultsPageSectionHeadings(
      {
        getElementById: (id: string) => (id === 'page-title' ? publicPageTitle : null),
        querySelector: (selector: string) =>
          selector === '#main-content > p.mvp-brand' ? publicBrand : null,
      },
      {
        location: {
          pathname: '/results/11111111-1111-4111-8111-111111111111',
        },
      },
    );
    expect(publicPageTitle.textContent).toBe(publicUi.PUBLIC_RESULTS_PUBLIC_READONLY_TITLE);
    expect(publicBrand.textContent).toBe(publicUi.PUBLIC_RESULTS_PUBLIC_READONLY_TITLE);
  });

  it('keeps faq and trust-levels summary copy aligned with homepage PUBLIC_* headings', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const faqHtml = await readFile(join(process.cwd(), 'public/faq.html'), 'utf8');
    const trustHtml = await readFile(join(process.cwd(), 'public/trust-levels.html'), 'utf8');

    expect(faqHtml).toContain(publicUi.PUBLIC_HOME_COLLECTING_HIDDEN_CARD_HEADING);
    expect(faqHtml).not.toContain('<h3>收集中不顯示結果</h3>');
    expect(trustHtml).toContain('發起者也看不到期中統計');
    expect(trustHtml).not.toContain('發起者亦同');
  });

  it('documents homepage sample section and footer embedded links as intentionally not textContent-synced', async () => {
    const homeSource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/public-mvp-home.js'), 'utf8'),
    );
    const indexHtml = await readFile(join(process.cwd(), 'public/index.html'), 'utf8');

    expect(indexHtml).toContain('data-static-examples="true"');
    expect(indexHtml).toContain('href="/explore"');
    expect(indexHtml).toContain('href="/results/demo"');
    expect(indexHtml).toContain('mvp-preview-links');
    expect(homeSource).not.toMatch(/mvp-preview-links|\.note\b/);
    expect(homeSource).not.toMatch(/querySelectorAll\([^)]*\.mvp-meta/);
    expect(homeSource).toContain('syncHomePageSectionHeadings');
    expect(homeSource).toContain('.mvp-section-title');
  });

  it('keeps policy-ui-placeholders.js and HELP_COPY separate from public copy allowlists', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const layout = await loadModule('public/frontend/public-mvp-layout.js');
    const publicUiSource = await readFile(
      join(process.cwd(), 'public/frontend/public-mvp-ui.js'),
      'utf8',
    );
    const policySource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/policy-ui-placeholders.js'), 'utf8'),
    );

    expect(layout.HELP_COPY.collectingHidden).toContain('收集中不顯示票數');
    expect(policySource).toContain('HELP_COPY');
    expect(publicUiSource).not.toContain('HELP_COPY');
    expect(publicUi.PUBLIC_PAGE_LEAD_PARAGRAPHS).not.toContain(layout.HELP_COPY.collectingHidden);
    expect(publicUi.PUBLIC_PAGE_LEAD_PARAGRAPHS).not.toContain(layout.HELP_COPY.lockPeriod);
    expect(publicUi.PUBLIC_SUPPORTING_NOTES).not.toContain(layout.HELP_COPY.eligibility);
  });

  it('keeps reviewed sync modules on shared constants without fetch or backend echo', async () => {
    for (const relativePath of REVIEWED_SYNC_MODULES) {
      const source = stripJsComments(await readFile(join(process.cwd(), relativePath), 'utf8'));
      if (relativePath.endsWith('public-mvp-home.js')) {
        expect(source, relativePath).not.toMatch(/\bfetch\b|\/users\/me|\/polls\/|\/vote/i);
      }
      expect(source, relativePath).not.toMatch(FORBIDDEN_BACKEND_ECHO);
      expect(source, relativePath).not.toMatch(FORBIDDEN_OBSERVABILITY);
    }
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
        display_name: 'Shell Checkpoint User',
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

  for (const relativePath of ALIGNED_HTML_SHELLS) {
    it(`keeps aligned static shell copy neutral in ${relativePath}`, async () => {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(source, relativePath).not.toMatch(FORBIDDEN_OUTCOME_COPY);
    });
  }
});
