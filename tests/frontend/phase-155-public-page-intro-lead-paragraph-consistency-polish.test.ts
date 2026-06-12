import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PUBLIC_INTRO_SURFACES = [
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

describe('Phase 155 public page intro / lead paragraph consistency polish', () => {
  it('exports frontend-owned intro / lead allowlists with safe fixed copy', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');

    expect(publicUi.PUBLIC_PAGE_LEAD_PARAGRAPHS.length).toBeGreaterThanOrEqual(10);
    expect(publicUi.PUBLIC_PAGE_LEADS).toBe(publicUi.PUBLIC_PAGE_LEAD_PARAGRAPHS);
    expect(publicUi.PUBLIC_PAGE_INTRO_TEXTS.length).toBeGreaterThanOrEqual(20);
    expect(publicUi.PUBLIC_HOME_HERO_LEAD).toContain('收集中不公開票數');
    expect(publicUi.PUBLIC_EXPLORE_PAGE_LEAD).toContain('不提供熱門、票數');
    expect(publicUi.PUBLIC_RESULTS_PAGE_DEMO_INTRO_LEAD).toContain('收集中不顯示票數');

    for (const lead of publicUi.PUBLIC_PAGE_LEAD_PARAGRAPHS) {
      expect(lead).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(lead).not.toMatch(FORBIDDEN_OUTCOME_COPY);
      expect(lead).not.toMatch(/\d+%|raw_count/i);
    }
    for (const intro of publicUi.PUBLIC_PAGE_INTRO_TEXTS) {
      expect(intro).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(intro).not.toMatch(FORBIDDEN_OUTCOME_COPY);
    }
  });

  it('aliases explore lead hint to shared explore page lead', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const explore = await loadModule('public/frontend/explore-page.js');

    expect(publicUi.PUBLIC_EXPLORE_PAGE_LEAD_HINT).toBe(publicUi.PUBLIC_EXPLORE_PAGE_LEAD);
    expect(explore.EXPLORE_PAGE_LEAD).toBe(publicUi.PUBLIC_EXPLORE_PAGE_LEAD);
    expect(publicUi.PUBLIC_PAGE_LEAD_PARAGRAPHS).toContain(publicUi.PUBLIC_EXPLORE_PAGE_LEAD);
    expect(publicUi.PUBLIC_HINT_TEXT_MESSAGES).toContain(publicUi.PUBLIC_EXPLORE_PAGE_LEAD_HINT);
  });

  it('keeps syncHomePageLeadParagraphs and syncExplorePageLeadParagraphs on shared constants', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const home = await loadModule('public/frontend/public-mvp-home.js');
    const explore = await loadModule('public/frontend/explore-page.js');

    const heroLead = { textContent: '' };
    home.syncHomePageLeadParagraphs({
      getElementById: (id: string) => (id === 'home-hero-lead' ? heroLead : null),
    });
    expect(heroLead.textContent).toBe(publicUi.PUBLIC_HOME_HERO_LEAD);

    const exploreLead = { textContent: '' };
    explore.syncExplorePageLeadParagraphs({
      getElementById: (id: string) => (id === 'explore-page-lead' ? exploreLead : null),
    });
    expect(exploreLead.textContent).toBe(publicUi.PUBLIC_EXPLORE_PAGE_LEAD);
  });

  it('keeps syncLoginPageLeadParagraphs and syncRegistrationPageLeadParagraphs on shared constants', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const login = await loadModule('public/frontend/login-page.js');
    const registration = await loadModule('public/frontend/registration-page.js');

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
  });

  it('keeps syncProfilePageLeadParagraphs and syncCreatePollPageLeadParagraphs on shared constants', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const profile = await loadModule('public/frontend/profile-page.js');
    const createPoll = await loadModule('public/frontend/create-poll-page.js');

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
  });

  it('keeps syncVotePageLeadParagraphs, syncMyPollsPageLeadParagraphs, and syncResultsPageLeadParagraphs on shared constants', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const votePage = await loadModule('public/frontend/vote-page.js');
    const myPolls = await loadModule('public/frontend/my-polls-page.js');
    const results = await loadModule('public/frontend/result-page.js');

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
    results.syncResultsPageLeadParagraphs({
      getElementById: (id: string) =>
        id === 'results-page-demo-intro' ? resultsIntro : null,
    });
    expect(resultsIntro.textContent).toBe(publicUi.PUBLIC_RESULTS_PAGE_DEMO_INTRO_LEAD);
  });

  it('keeps static HTML shells aligned with PUBLIC_* lead constants', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');

    const indexHtml = await readFile(join(process.cwd(), 'public/index.html'), 'utf8');
    const exploreHtml = await readFile(join(process.cwd(), 'public/explore.html'), 'utf8');
    const loginHtml = await readFile(join(process.cwd(), 'public/login.html'), 'utf8');
    const profileHtml = await readFile(join(process.cwd(), 'public/profile.html'), 'utf8');
    const voteHtml = await readFile(join(process.cwd(), 'public/vote.html'), 'utf8');

    expect(indexHtml).toContain(publicUi.PUBLIC_HOME_HERO_LEAD);
    expect(exploreHtml).toContain(publicUi.PUBLIC_EXPLORE_PAGE_LEAD);
    expect(loginHtml).toContain(publicUi.PUBLIC_LOGIN_PAGE_LEAD_PRIMARY);
    expect(profileHtml).toContain(publicUi.PUBLIC_PROFILE_PAGE_LEAD);
    expect(voteHtml).toContain(publicUi.PUBLIC_VOTE_PAGE_REMINDER_LEAD);
  });

  it('keeps vote poll description API-driven and outside page lead allowlists', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const voteSource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/vote-page.js'), 'utf8'),
    );

    expect(voteSource).toContain('description.textContent = detail.description');
    expect(publicUi.PUBLIC_PAGE_LEAD_PARAGRAPHS).not.toContain('API poll description');
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
        display_name: 'Intro Polish User',
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

  it('does not add observability hooks to reviewed intro surfaces', async () => {
    for (const relativePath of PUBLIC_INTRO_SURFACES) {
      const source = stripJsComments(
        await readFile(join(process.cwd(), relativePath), 'utf8'),
      );
      expect(source, relativePath).not.toMatch(FORBIDDEN_OBSERVABILITY);
    }
  });

  for (const relativePath of PUBLIC_INTRO_SURFACES) {
    it(`keeps reviewed intro / lead copy neutral in ${relativePath}`, async () => {
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
