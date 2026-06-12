import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const REVIEWED_HEADING_SURFACES = [
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
];

const STATIC_HEADING_HTML = [
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

describe('Phase 154 public section title / panel heading runtime review checkpoint', () => {
  it('keeps PUBLIC_* heading allowlists on fixed frontend safe copy only', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');

    expect(publicUi.PUBLIC_SECTION_TITLES.length).toBeGreaterThanOrEqual(10);
    expect(publicUi.PUBLIC_PANEL_HEADINGS.length).toBeGreaterThanOrEqual(8);
    expect(publicUi.PUBLIC_CARD_HEADINGS.length).toBeGreaterThanOrEqual(6);
    expect(publicUi.PUBLIC_FORM_HEADINGS.length).toBeGreaterThanOrEqual(2);
    expect(publicUi.PUBLIC_RESULTS_PUBLIC_OPTIONS_HEADING).toContain('不含票數');
    expect(publicUi.PUBLIC_RESULTS_POLL_OPTIONS_HEADING).toContain('不含票數');

    for (const title of publicUi.PUBLIC_SECTION_TITLES) {
      expect(title).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(title).not.toMatch(FORBIDDEN_OUTCOME_COPY);
      expect(title).not.toMatch(/\d+%|raw_count/i);
    }
    for (const heading of [
      ...publicUi.PUBLIC_PANEL_HEADINGS,
      ...publicUi.PUBLIC_CARD_HEADINGS,
      ...publicUi.PUBLIC_FORM_HEADINGS,
    ]) {
      expect(heading).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(heading).not.toMatch(FORBIDDEN_OUTCOME_COPY);
      expect(heading).not.toMatch(/\d+%|raw_count/i);
    }
  });

  it('keeps dynamic poll titles outside PUBLIC_SECTION_TITLES allowlist', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const voteSource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/vote-page.js'), 'utf8'),
    );
    const resultSource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/result-page.js'), 'utf8'),
    );

    expect(voteSource).toContain("title.textContent = detail.title");
    expect(resultSource).not.toMatch(/pageTitle\.textContent\s*=\s*result\.title/);
    expect(resultSource).not.toMatch(/pageTitle\.textContent\s*=\s*detail\.title/);

    for (const dynamicTitle of ['範例問卷標題', 'API Poll Title', 'backend poll title']) {
      expect(publicUi.PUBLIC_SECTION_TITLES).not.toContain(dynamicTitle);
    }
  });

  it('keeps public-mvp-home.js safe for index.html module load', async () => {
    const home = await loadModule('public/frontend/public-mvp-home.js');
    const homeSource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/public-mvp-home.js'), 'utf8'),
    );
    const indexHtml = await readFile(join(process.cwd(), 'public/index.html'), 'utf8');

    expect(indexHtml).toContain('<script type="module" src="/frontend/public-mvp-home.js"></script>');
    expect(homeSource).toContain('syncHomePageSectionHeadings');
    expect(homeSource).not.toMatch(/\bfetch\b|\/users\/me|\/polls\/|\/vote|mountLoginStateRead/i);
    expect(homeSource).not.toMatch(FORBIDDEN_OBSERVABILITY);

    const homeHeading = { textContent: '' };
    home.syncHomePageSectionHeadings({
      getElementById: (id: string) => (id === 'home-heading' ? homeHeading : null),
      querySelector: () => null,
      querySelectorAll: () => [],
    });
    expect(homeHeading.textContent).toBe(home.HOME_PAGE_TITLE);
  });

  it('keeps results option list headings fixed without option-level linkage', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const resultPage = await loadModule('public/frontend/result-page.js');
    const resultSource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/result-page.js'), 'utf8'),
    );

    expect(resultPage.RESULTS_PUBLIC_OPTIONS_HEADING).toBe(
      publicUi.PUBLIC_RESULTS_PUBLIC_OPTIONS_HEADING,
    );
    expect(resultPage.RESULTS_POLL_OPTIONS_HEADING).toBe(
      publicUi.PUBLIC_RESULTS_POLL_OPTIONS_HEADING,
    );
    expect(resultSource).toContain('headingText: PUBLIC_RESULTS_PUBLIC_OPTIONS_HEADING');
    expect(resultSource).toContain('headingText: PUBLIC_RESULTS_POLL_OPTIONS_HEADING');
    expect(resultSource).toContain("appendText(root, 'h2', headingText, 'result-options-heading')");
    expect(resultSource).toContain('function renderOptionLabelsList(root, options, { headingText })');
    expect(resultSource).not.toMatch(/headingText\s*=\s*option\./);
    expect(resultSource).not.toMatch(/headingText\s*=\s*result\./);
    expect(publicUi.PUBLIC_PANEL_HEADINGS).toContain(
      publicUi.PUBLIC_RESULTS_PUBLIC_OPTIONS_HEADING,
    );
    expect(publicUi.PUBLIC_PANEL_HEADINGS).toContain(
      publicUi.PUBLIC_RESULTS_POLL_OPTIONS_HEADING,
    );
  });

  it('keeps sync*PageSectionHeadings on shared constants without backend echo', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const explore = await loadModule('public/frontend/explore-page.js');
    const createPoll = await loadModule('public/frontend/create-poll-page.js');
    const myPolls = await loadModule('public/frontend/my-polls-page.js');
    const results = await loadModule('public/frontend/result-page.js');

    const exploreHeading = { textContent: '' };
    explore.syncExplorePageSectionHeadings({
      getElementById: (id: string) => (id === 'explore-heading' ? exploreHeading : null),
    });
    expect(exploreHeading.textContent).toBe(publicUi.PUBLIC_EXPLORE_PAGE_TITLE);

    const createHeading = { textContent: '' };
    const policyHeading = { textContent: '' };
    createPoll.syncCreatePollPageSectionHeadings({
      querySelector(selector: string) {
        if (selector === '#main-content > h1') return createHeading;
        if (selector.includes('發起須知')) return policyHeading;
        return null;
      },
    });
    expect(createHeading.textContent).toBe(publicUi.PUBLIC_CREATE_POLL_PAGE_TITLE);
    expect(policyHeading.textContent).toBe(publicUi.PUBLIC_CREATE_POLL_POLICY_PANEL_HEADING);

    const myPollsHeading = { textContent: '' };
    myPolls.syncMyPollsPageSectionHeadings({
      querySelector(selector: string) {
        if (selector === '#main-content > h1') return myPollsHeading;
        return null;
      },
    });
    expect(myPollsHeading.textContent).toBe(publicUi.PUBLIC_MY_POLLS_PAGE_TITLE);

    const pageTitle = { textContent: '', getAttribute: () => null };
    results.syncResultsPageSectionHeadings({
      getElementById: (id: string) => (id === 'page-title' ? pageTitle : null),
      querySelector: () => null,
    });
    expect(pageTitle.textContent).toBe(publicUi.PUBLIC_RESULTS_PUBLIC_READONLY_TITLE);
  });

  it('keeps static HTML shells aligned with PUBLIC_* heading constants', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');

    const indexHtml = await readFile(join(process.cwd(), 'public/index.html'), 'utf8');
    const exploreHtml = await readFile(join(process.cwd(), 'public/explore.html'), 'utf8');
    const resultsHtml = await readFile(join(process.cwd(), 'public/results.html'), 'utf8');
    const profileHtml = await readFile(join(process.cwd(), 'public/profile.html'), 'utf8');

    expect(indexHtml).toContain(publicUi.PUBLIC_HOME_PAGE_TITLE);
    expect(exploreHtml).toContain(publicUi.PUBLIC_EXPLORE_PAGE_TITLE);
    expect(resultsHtml).toContain(publicUi.PUBLIC_RESULTS_PUBLIC_READONLY_TITLE);
    expect(profileHtml).toContain(publicUi.PUBLIC_PROFILE_PAGE_TITLE);
    expect(profileHtml).toContain(publicUi.PUBLIC_PROFILE_UNAUTH_FORM_HEADING);
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
        display_name: 'Heading Checkpoint User',
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

  it('does not add observability hooks to reviewed heading surfaces', async () => {
    for (const relativePath of REVIEWED_HEADING_SURFACES) {
      const source = stripJsComments(
        await readFile(join(process.cwd(), relativePath), 'utf8'),
      );
      expect(source, relativePath).not.toMatch(FORBIDDEN_OBSERVABILITY);
    }
  });

  for (const relativePath of [...REVIEWED_HEADING_SURFACES, ...STATIC_HEADING_HTML]) {
    it(`keeps reviewed heading copy neutral in ${relativePath}`, async () => {
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
