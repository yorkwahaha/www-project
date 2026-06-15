import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PUBLIC_HEADING_SURFACES = [
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

describe('Phase 153 public section title / panel heading consistency polish', () => {
  it('exports frontend-owned heading allowlists with safe fixed copy', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');

    expect(publicUi.PUBLIC_SECTION_TITLES.length).toBeGreaterThanOrEqual(10);
    expect(publicUi.PUBLIC_PANEL_HEADINGS.length).toBeGreaterThanOrEqual(8);
    expect(publicUi.PUBLIC_CARD_HEADINGS.length).toBeGreaterThanOrEqual(6);
    expect(publicUi.PUBLIC_FORM_HEADINGS.length).toBeGreaterThanOrEqual(2);
    expect(publicUi.PUBLIC_HOME_PAGE_TITLE).toBe('匿名問卷，公平揭曉');
    expect(publicUi.PUBLIC_EXPLORE_PAGE_TITLE).toBe('探索問卷');
    expect(publicUi.PUBLIC_VOTE_POLICY_PANEL_HEADING).toBe('投票須知');
    expect(publicUi.PUBLIC_RESULTS_PUBLIC_OPTIONS_HEADING).toContain('不含票數');

    for (const title of publicUi.PUBLIC_SECTION_TITLES) {
      expect(title).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(title).not.toMatch(FORBIDDEN_OUTCOME_COPY);
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

  it('maps homepage and explore heading re-exports into PUBLIC_SECTION_TITLES', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const home = await loadModule('public/frontend/public-mvp-home.js');
    const explore = await loadModule('public/frontend/explore-page.js');

    expect(home.HOME_PAGE_TITLE).toBe(publicUi.PUBLIC_HOME_PAGE_TITLE);
    expect(explore.EXPLORE_PAGE_TITLE).toBe(publicUi.PUBLIC_EXPLORE_PAGE_TITLE);
    expect(publicUi.PUBLIC_SECTION_TITLES).toContain(publicUi.PUBLIC_HOME_PAGE_TITLE);
    expect(publicUi.PUBLIC_SECTION_TITLES).toContain(publicUi.PUBLIC_EXPLORE_PAGE_TITLE);
  });

  it('keeps syncHomePageSectionHeadings on shared constants', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const home = await loadModule('public/frontend/public-mvp-home.js');

    const homeHeading = { textContent: '' };
    const sampleSection = { textContent: '' };
    const valueCards = [{ textContent: '' }, { textContent: '' }, { textContent: '' }];
    const documentObject = {
      getElementById(id: string) {
        return id === 'home-heading' ? homeHeading : null;
      },
      querySelector(selector: string) {
        return selector === '.mvp-section-title' ? sampleSection : null;
      },
      querySelectorAll(selector: string) {
        return selector === '.mvp-value-grid .mvp-value-card h3' ? valueCards : [];
      },
    };

    home.syncHomePageSectionHeadings(documentObject);
    expect(homeHeading.textContent).toBe(publicUi.PUBLIC_HOME_PAGE_TITLE);
    expect(sampleSection.textContent).toBe(publicUi.PUBLIC_HOME_SAMPLE_POLLS_SECTION_TITLE);
    expect(valueCards[0].textContent).toBe(publicUi.PUBLIC_HOME_COLLECTING_HIDDEN_CARD_HEADING);
  });

  it('keeps syncLoginPageSectionHeadings and syncVotePageSectionHeadings on shared panel headings', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const login = await loadModule('public/frontend/login-page.js');
    const votePage = await loadModule('public/frontend/vote-page.js');

    const loginHeading = { textContent: '' };
    const authCards = [{ textContent: '' }, { textContent: '' }, { textContent: '' }];
    login.syncLoginPageSectionHeadings({
      getElementById: (id: string) => (id === 'login-heading' ? loginHeading : null),
      querySelector: () => null,
      querySelectorAll: (selector: string) =>
        selector === '.mvp-auth-state-grid .mvp-value-card h2' ? authCards : [],
    });
    expect(loginHeading.textContent).toBe(publicUi.PUBLIC_LOGIN_PAGE_TITLE);
    expect(authCards[0].textContent).toBe(publicUi.PUBLIC_LOGIN_PRODUCTION_CARD_HEADING);

    const policyHeading = { textContent: '' };
    const collectingHeading = { textContent: '' };
    const followHeading = { textContent: '' };
    votePage.syncVotePageSectionHeadings({
      querySelector(selector: string) {
        if (selector.includes('投票須知')) return policyHeading;
        if (selector === '#vote-collecting-notice h2') return collectingHeading;
        if (selector === '#vote-side-panel h2') return followHeading;
        return null;
      },
    });
    expect(policyHeading.textContent).toBe(publicUi.PUBLIC_VOTE_POLICY_PANEL_HEADING);
    expect(collectingHeading.textContent).toBe(publicUi.PUBLIC_VOTE_COLLECTING_PANEL_HEADING);
    expect(followHeading.textContent).toBe(publicUi.PUBLIC_VOTE_FOLLOW_RESULTS_PANEL_HEADING);
    expect(publicUi.PUBLIC_PANEL_HEADINGS).toContain(publicUi.PUBLIC_VOTE_POLICY_PANEL_HEADING);
  });

  it('keeps syncRegistrationPageSectionHeadings and syncProfilePageSectionHeadings on shared form headings', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const registration = await loadModule('public/frontend/registration-page.js');
    const profile = await loadModule('public/frontend/profile-page.js');

    const registrationHeading = { textContent: '' };
    const successHeading = { textContent: '' };
    registration.syncRegistrationPageSectionHeadings({
      getElementById(id: string) {
        if (id === 'registration-heading') return registrationHeading;
        if (id === 'registration-success-heading') return successHeading;
        return null;
      },
    });
    expect(registrationHeading.textContent).toBe(publicUi.PUBLIC_REGISTRATION_PAGE_TITLE);
    expect(successHeading.textContent).toBe(publicUi.PUBLIC_REGISTRATION_SUCCESS_FORM_HEADING);

    const profileHeading = { textContent: '' };
    const unauthHeading = { textContent: '' };
    profile.syncProfilePageSectionHeadings({
      getElementById(id: string) {
        if (id === 'profile-heading') return profileHeading;
        if (id === 'profile-unauth-heading') return unauthHeading;
        return null;
      },
    });
    expect(profileHeading.textContent).toBe(publicUi.PUBLIC_PROFILE_PAGE_TITLE);
    expect(unauthHeading.textContent).toBe(publicUi.PUBLIC_PROFILE_UNAUTH_FORM_HEADING);
    expect(publicUi.PUBLIC_FORM_HEADINGS).toContain(publicUi.PUBLIC_PROFILE_UNAUTH_FORM_HEADING);
  });

  it('maps results option list headings into PUBLIC_PANEL_HEADINGS', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const resultPage = await loadModule('public/frontend/result-page.js');

    expect(resultPage.RESULTS_PUBLIC_OPTIONS_HEADING).toBe(
      publicUi.PUBLIC_RESULTS_PUBLIC_OPTIONS_HEADING,
    );
    expect(resultPage.RESULTS_POLL_OPTIONS_HEADING).toBe(
      publicUi.PUBLIC_RESULTS_POLL_OPTIONS_HEADING,
    );
    expect(publicUi.PUBLIC_PANEL_HEADINGS).toContain(
      publicUi.PUBLIC_RESULTS_PUBLIC_OPTIONS_HEADING,
    );
  });

  it('keeps static HTML shells aligned with PUBLIC_* heading constants', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const indexHtml = await readFile(join(process.cwd(), 'public/index.html'), 'utf8');
    const exploreHtml = await readFile(join(process.cwd(), 'public/explore.html'), 'utf8');
    const loginHtml = await readFile(join(process.cwd(), 'public/login.html'), 'utf8');
    const myPollsHtml = await readFile(join(process.cwd(), 'public/my-polls.html'), 'utf8');
    const voteHtml = await readFile(join(process.cwd(), 'public/vote.html'), 'utf8');

    expect(indexHtml).toContain(publicUi.PUBLIC_HOME_PAGE_TITLE);
    expect(indexHtml).toContain(publicUi.PUBLIC_HOME_SAMPLE_POLLS_SECTION_TITLE);
    expect(exploreHtml).toContain(publicUi.PUBLIC_EXPLORE_PAGE_TITLE);
    expect(loginHtml).toContain(publicUi.PUBLIC_LOGIN_PAGE_TITLE);
    expect(loginHtml).toContain('正式環境');
    expect(myPollsHtml).toContain(publicUi.PUBLIC_MY_POLLS_PAGE_TITLE);
    expect(myPollsHtml).toContain(publicUi.PUBLIC_MY_POLLS_QUOTA_PANEL_HEADING);
    expect(voteHtml).toContain(publicUi.PUBLIC_VOTE_POLICY_PANEL_HEADING);
    expect(voteHtml).toContain(publicUi.PUBLIC_VOTE_FOLLOW_RESULTS_PANEL_HEADING);
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
        display_name: 'Heading Polish User',
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

  it('keeps vote-by-index body unchanged with only option_index', async () => {
    const votePage = await loadModule('public/frontend/vote-page.js');
    const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => ({
      ok: true,
      status: 201,
      json: async () => ({ vote_token: 'secret', option_id: 'secret' }),
    }));

    await votePage.submitVoteByIndex({
      pollId: '11111111-1111-4111-8111-111111111111',
      optionIndex: 1,
      userId: '44444444-4444-4444-8444-444444444444',
      fetchImpl,
    });

    const body = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body));
    expect(body).toEqual({ option_index: 1 });
  });

  it('does not add observability hooks to reviewed heading surfaces', async () => {
    for (const relativePath of PUBLIC_HEADING_SURFACES) {
      const source = stripJsComments(
        await readFile(join(process.cwd(), relativePath), 'utf8'),
      );
      expect(source, relativePath).not.toMatch(FORBIDDEN_OBSERVABILITY);
    }
  });

  for (const relativePath of PUBLIC_HEADING_SURFACES) {
    it(`keeps reviewed heading copy neutral in ${relativePath}`, async () => {
      const source = stripJsComments(
        await readFile(join(process.cwd(), relativePath), 'utf8'),
      );
      if (relativePath !== 'public/frontend/public-mvp-ui.js') {
        expect(source, relativePath).not.toMatch(FORBIDDEN_BACKEND_ECHO);
      }
      expect(source, relativePath).not.toMatch(FORBIDDEN_OUTCOME_COPY);
    });
  }
});
