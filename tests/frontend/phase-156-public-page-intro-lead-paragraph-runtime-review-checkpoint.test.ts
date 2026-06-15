import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const REVIEWED_INTRO_SURFACES = [
  'public/frontend/public-mvp-ui.js',
  'public/frontend/public-mvp-home.js',
  'public/frontend/explore-page.js',
  'public/frontend/login-page.js',
  'public/frontend/registration-page.js',
  'public/frontend/profile-page.js',
  'public/frontend/create-poll-page.js',
  'public/frontend/vote-page.js',
  'public/frontend/my-polls-page.js',
  'public/frontend/result-page.js',
  'public/frontend/creator-flow-copy.js',
];

const STATIC_INTRO_HTML = [
  'public/index.html',
  'public/explore.html',
  'public/results.html',
  'public/my-polls.html',
  'public/create-poll.html',
  'public/vote.html',
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

describe('Phase 156 public page intro / lead paragraph runtime review checkpoint', () => {
  it('keeps PUBLIC_* intro / lead allowlists on fixed frontend safe copy only', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');

    expect(publicUi.PUBLIC_PAGE_LEAD_PARAGRAPHS.length).toBeGreaterThanOrEqual(10);
    expect(publicUi.PUBLIC_PAGE_LEADS).toBe(publicUi.PUBLIC_PAGE_LEAD_PARAGRAPHS);
    expect(publicUi.PUBLIC_PAGE_INTRO_TEXTS.length).toBeGreaterThanOrEqual(20);
    expect(publicUi.PUBLIC_HOME_HERO_LEAD).toContain('收集中不公開票數');
    expect(publicUi.PUBLIC_EXPLORE_PAGE_LEAD).toContain('不提供熱門、票數');
    expect(publicUi.PUBLIC_RESULTS_PAGE_DEMO_INTRO_LEAD).toContain('收集中不顯示票數');
    expect(publicUi.PUBLIC_RESULTS_COLLECTING_SUMMARY).toContain('不顯示總票數');

    for (const lead of publicUi.PUBLIC_PAGE_LEAD_PARAGRAPHS) {
      expect(lead).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(lead).not.toMatch(FORBIDDEN_OUTCOME_COPY);
      expect(lead).not.toMatch(/\d+%|raw_count/i);
    }
    for (const intro of publicUi.PUBLIC_PAGE_INTRO_TEXTS) {
      expect(intro).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(intro).not.toMatch(FORBIDDEN_OUTCOME_COPY);
      expect(intro).not.toMatch(/\d+%|raw_count/i);
    }
  });

  it('keeps PUBLIC_EXPLORE_PAGE_LEAD_HINT alias safe and in hint allowlist', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const explore = await loadModule('public/frontend/explore-page.js');

    expect(publicUi.PUBLIC_EXPLORE_PAGE_LEAD_HINT).toBe(publicUi.PUBLIC_EXPLORE_PAGE_LEAD);
    expect(explore.EXPLORE_PAGE_LEAD).toBe(publicUi.PUBLIC_EXPLORE_PAGE_LEAD);
    expect(publicUi.PUBLIC_PAGE_LEAD_PARAGRAPHS).toContain(publicUi.PUBLIC_EXPLORE_PAGE_LEAD);
    expect(publicUi.PUBLIC_HINT_TEXT_MESSAGES).toContain(publicUi.PUBLIC_EXPLORE_PAGE_LEAD_HINT);
  });

  it('keeps dynamic poll title and description outside PUBLIC_PAGE_LEAD_PARAGRAPHS allowlist', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const voteSource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/vote-page.js'), 'utf8'),
    );

    expect(voteSource).toContain('title.textContent = detail.title');
    expect(voteSource).toContain('description.textContent = detail.description');

    for (const dynamicCopy of ['範例問卷標題', 'API poll description', 'backend poll title']) {
      expect(publicUi.PUBLIC_PAGE_LEAD_PARAGRAPHS).not.toContain(dynamicCopy);
      expect(publicUi.PUBLIC_PAGE_INTRO_TEXTS).not.toContain(dynamicCopy);
    }
  });

  it('keeps public-mvp-home.js safe for homepage lead sync only', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const home = await loadModule('public/frontend/public-mvp-home.js');
    const homeSource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/public-mvp-home.js'), 'utf8'),
    );

    expect(homeSource).toContain('syncHomePageLeadParagraphs');
    expect(homeSource).not.toMatch(/\bfetch\b|\/users\/me|\/polls\/|\/vote|mountLoginStateRead/i);
    expect(homeSource).not.toMatch(FORBIDDEN_OBSERVABILITY);

    const heroLead = { textContent: '' };
    home.syncHomePageLeadParagraphs({
      getElementById: (id: string) => (id === 'home-hero-lead' ? heroLead : null),
    });
    expect(heroLead.textContent).toBe(publicUi.PUBLIC_HOME_HERO_LEAD);
  });

  it('keeps results readonly intro and collecting block off counter preview paths', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const resultPage = await loadModule('public/frontend/result-page.js');
    const resultSource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/result-page.js'), 'utf8'),
    );

    expect(resultPage.RESULTS_INTRO_LEAD_HINT).toBe(publicUi.PUBLIC_RESULTS_INTRO_LEAD_HINT);
    expect(resultPage.RESULTS_INTRO_SCOPE_HINT).toBe(publicUi.PUBLIC_RESULTS_INTRO_SCOPE_HINT);
    expect(resultPage.RESULTS_COLLECTING_SUMMARY).toBe(publicUi.PUBLIC_RESULTS_COLLECTING_SUMMARY);
    expect(resultSource).toContain('lead.textContent = RESULTS_INTRO_LEAD_HINT');
    expect(resultSource).toContain('scope.textContent = RESULTS_INTRO_SCOPE_HINT');
    expect(resultSource).toContain('RESULTS_COLLECTING_SUMMARY');
    expect(resultSource).toContain("if (normalized.mode === 'collecting')");
    expect(resultSource).toContain('renderCollectingStatusBlock(root)');
    expect(resultSource).toMatch(
      /if \(normalized\.mode === 'collecting'\)[\s\S]*?return;/,
    );
    expect(resultSource).not.toMatch(/RESULTS_INTRO_LEAD_HINT\s*=\s*result\./);
    expect(resultSource).not.toMatch(/RESULTS_COLLECTING_SUMMARY\s*=\s*result\./);
    expect(publicUi.PUBLIC_PAGE_INTRO_TEXTS).toContain(publicUi.PUBLIC_RESULTS_INTRO_LEAD_HINT);
    expect(publicUi.PUBLIC_PAGE_INTRO_TEXTS).toContain(publicUi.PUBLIC_RESULTS_COLLECTING_SUMMARY);
  });

  it('keeps creator section intro constants in PUBLIC_PAGE_INTRO_TEXTS without counter preview', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const creatorCopy = await loadModule('public/frontend/creator-flow-copy.js');

    expect(creatorCopy.CREATOR_FLOW_COPY.createSuccessLead).toBe(
      publicUi.PUBLIC_CREATOR_CREATE_SUCCESS_LEAD_HINT,
    );
    expect(creatorCopy.CREATOR_FLOW_COPY.resultsCreatorLead).toBe(
      publicUi.PUBLIC_CREATOR_RESULTS_LEAD_HINT,
    );
    expect(creatorCopy.CREATOR_FLOW_COPY.lifecycleLeadCollecting).toBe(
      publicUi.PUBLIC_CREATOR_LIFECYCLE_COLLECTING_LEAD_HINT,
    );
    expect(publicUi.PUBLIC_CREATOR_LIFECYCLE_COLLECTING_LEAD_HINT).toContain('收集中不顯示票數');
    expect(publicUi.PUBLIC_PAGE_INTRO_TEXTS).toContain(publicUi.PUBLIC_CREATOR_RESULTS_LEAD_HINT);
    expect(publicUi.PUBLIC_PAGE_INTRO_TEXTS).toContain(
      publicUi.PUBLIC_CREATOR_LIFECYCLE_COLLECTING_LEAD_HINT,
    );
  });

  it('keeps sync*PageLeadParagraphs on shared constants without backend echo', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const login = await loadModule('public/frontend/login-page.js');
    const registration = await loadModule('public/frontend/registration-page.js');
    const profile = await loadModule('public/frontend/profile-page.js');
    const createPoll = await loadModule('public/frontend/create-poll-page.js');
    const votePage = await loadModule('public/frontend/vote-page.js');
    const myPolls = await loadModule('public/frontend/my-polls-page.js');
    const results = await loadModule('public/frontend/result-page.js');

    const loginPrimary = { textContent: '' };
    const loginSecondary = { textContent: '' };
    login.syncLoginPageLeadParagraphs({
      getElementById: (id: string) => {
        if (id === 'login-lead-primary') return loginPrimary;
        if (id === 'login-lead-secondary') return loginSecondary;
        return null;
      },
    });
    expect(loginPrimary.textContent).toBe(publicUi.PUBLIC_LOGIN_PAGE_LEAD_PRIMARY);
    expect(loginSecondary.textContent).toBe(publicUi.PUBLIC_LOGIN_PAGE_LEAD_SECONDARY);

    const registrationPrimary = { textContent: '' };
    const registrationSecondary = { textContent: '' };
    registration.syncRegistrationPageLeadParagraphs({
      getElementById: (id: string) => {
        if (id === 'registration-lead-primary') return registrationPrimary;
        if (id === 'registration-lead-secondary') return registrationSecondary;
        return null;
      },
    });
    expect(registrationPrimary.textContent).toBe(publicUi.PUBLIC_REGISTRATION_PAGE_LEAD_PRIMARY);
    expect(registrationSecondary.textContent).toBe(
      publicUi.PUBLIC_REGISTRATION_PAGE_LEAD_SECONDARY,
    );

    const profileLead = { textContent: '' };
    profile.syncProfilePageLeadParagraphs({
      getElementById: (id: string) => (id === 'profile-page-lead' ? profileLead : null),
    });
    expect(profileLead.textContent).toBe(publicUi.PUBLIC_PROFILE_PAGE_LEAD);

    const createLead = { textContent: '' };
    createPoll.syncCreatePollPageLeadParagraphs({
      getElementById: (id: string) => (id === 'create-poll-page-lead' ? createLead : null),
    });
    expect(createLead.textContent).toBe(publicUi.PUBLIC_CREATE_POLL_PAGE_LEAD);

    const voteReminder = { textContent: '' };
    votePage.syncVotePageLeadParagraphs({
      getElementById: (id: string) => (id === 'vote-page-reminder-lead' ? voteReminder : null),
    });
    expect(voteReminder.textContent).toBe(publicUi.PUBLIC_VOTE_PAGE_REMINDER_LEAD);

    const myPollsLead = { textContent: '' };
    myPolls.syncMyPollsPageLeadParagraphs({
      getElementById: (id: string) => (id === 'my-polls-page-lead' ? myPollsLead : null),
    });
    expect(myPollsLead.textContent).toBe(publicUi.PUBLIC_MY_POLLS_PAGE_LEAD);

    const resultsIntro = { textContent: '' };
    results.syncResultsPageLeadParagraphs(
      {
        getElementById: (id: string) =>
          id === 'results-page-demo-intro' ? resultsIntro : null,
      },
      { demoOnly: true },
    );
    expect(resultsIntro.textContent).toBe(publicUi.PUBLIC_RESULTS_PAGE_DEMO_INTRO_LEAD);
  });

  it('keeps PUBLIC_* lead constants centralized for runtime sync (Phase 257 copy refinement)', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');

    expect(publicUi.PUBLIC_HOME_HERO_LEAD).toContain('收集中不公開票數');
    expect(publicUi.PUBLIC_EXPLORE_PAGE_LEAD).toContain('最近發布');
    expect(publicUi.PUBLIC_RESULTS_PAGE_DEMO_INTRO_LEAD).toContain('示範頁');
    expect(publicUi.PUBLIC_MY_POLLS_PAGE_LEAD).toContain('收集中看不到票數');
    expect(publicUi.PUBLIC_CREATE_POLL_PAGE_LEAD).toContain('期中票數或百分比');
    expect(publicUi.PUBLIC_VOTE_PAGE_REMINDER_LEAD).toContain('正式投票');
    expect(publicUi.PUBLIC_LOGIN_PAGE_LEAD_PRIMARY).toContain('註冊');
    expect(publicUi.PUBLIC_LOGIN_PAGE_LEAD_SECONDARY).toContain('已核准憑證');
    expect(publicUi.PUBLIC_REGISTRATION_PAGE_LEAD_PRIMARY).toContain('不會自動登入');
    expect(publicUi.PUBLIC_PROFILE_PAGE_LEAD).toContain('出生年月');
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
        display_name: 'Intro Checkpoint User',
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

  it('does not add observability hooks to reviewed intro surfaces', async () => {
    for (const relativePath of REVIEWED_INTRO_SURFACES) {
      const source = stripJsComments(
        await readFile(join(process.cwd(), relativePath), 'utf8'),
      );
      expect(source, relativePath).not.toMatch(FORBIDDEN_OBSERVABILITY);
    }
  });

  for (const relativePath of [...REVIEWED_INTRO_SURFACES, ...STATIC_INTRO_HTML]) {
    it(`keeps reviewed intro / lead copy neutral in ${relativePath}`, async () => {
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
