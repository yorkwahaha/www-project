import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_213_DOC =
  'docs/www-project-phase-213-public-mvp-mobile-form-accessibility-final-review-checkpoint-v1.md';
const PUBLIC_MVP_CSS = 'public/frontend/public-mvp.css';

const PARTICIPATION_RUNTIME_MODULES = [
  'public/frontend/explore-page.js',
  'public/frontend/vote-page.js',
  'public/frontend/result-page.js',
  'public/frontend/quality-feedback-badge.js',
] as const;

const FORM_RUNTIME_MODULES = [
  'public/frontend/login-page.js',
  'public/frontend/registration-page.js',
  'public/frontend/profile-page.js',
  'public/frontend/create-poll-page.js',
  'public/frontend/my-polls-page.js',
] as const;

const HTML_SHELLS = [
  {
    path: 'public/explore.html',
    pageClass: 'explore-page',
    phaseMarkers: ['Phase 201', 'Phase 202', 'Phase 213'],
  },
  {
    path: 'public/vote.html',
    pageClass: 'vote-page',
    phaseMarkers: ['Phase 201', 'Phase 202', 'Phase 213'],
  },
  {
    path: 'public/results.html',
    pageClass: 'results-page',
    phaseMarkers: ['Phase 201', 'Phase 202', 'Phase 213'],
  },
  {
    path: 'public/login.html',
    pageClass: 'login-page',
    phaseMarkers: ['Phase 204', 'Phase 205', 'Phase 213'],
  },
  {
    path: 'public/registration.html',
    pageClass: 'registration-page',
    phaseMarkers: ['Phase 204', 'Phase 205', 'Phase 213'],
  },
  {
    path: 'public/profile.html',
    pageClass: 'profile-page',
    phaseMarkers: ['Phase 206', 'Phase 207', 'Phase 213'],
  },
  {
    path: 'public/create-poll.html',
    pageClass: 'create-poll-page',
    phaseMarkers: ['Phase 208', 'Phase 209', 'Phase 213'],
  },
  {
    path: 'public/my-polls.html',
    pageClass: 'my-polls-page',
    phaseMarkers: ['Phase 210', 'Phase 211', 'Phase 213'],
  },
] as const;

const CSS_PHASE_BLOCKS = [
  { marker: 'Phase 201', scope: '.explore-page' },
  { marker: 'Phase 201', scope: '.vote-page' },
  { marker: 'Phase 201', scope: '.results-page' },
  { marker: 'Phase 204', scope: '.login-page' },
  { marker: 'Phase 204', scope: '.registration-page' },
  { marker: 'Phase 206', scope: '.profile-page' },
  { marker: 'Phase 208', scope: '.create-poll-page' },
  { marker: 'Phase 210', scope: '.my-polls-page' },
] as const;

const PROTECTED_BACKEND_PATHS = [
  'src/http/registration-routes.ts',
  'src/http/login-session-routes.ts',
  'src/http/user-profile-routes.ts',
  'src/http/user-me-routes.ts',
  'src/http/creator-session-routes.ts',
  'src/http/creator-poll-routes.ts',
  'src/http/official-vote-routes.ts',
  'src/auth/user-auth-resolver.ts',
  'src/polls/repository.ts',
  'migrations',
];

const FORBIDDEN_INTERNAL_COPY =
  /option_id|vote_token|token_sha256|shard_id|session_id|www_session|\buser_id\b|raw_count|poll_option_vote_counters|creator_token/i;

const FORBIDDEN_OUTCOME_COPY =
  /你符合資格|你不符合資格|已投過票|可以投票|一定能投票|can_vote|age_passed|region_passed/i;

const FORBIDDEN_STORAGE = /localStorage|sessionStorage|document\.cookie|Set-Cookie/i;

const FORBIDDEN_OBSERVABILITY =
  /console\.(log|info|warn|error|debug)|analytics|datadog|sentry|apm|trackEvent|gtag\(/i;

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 213 public MVP mobile and form accessibility final review checkpoint', () => {
  it('confirms Phase 213 is docs/static only with README index reference', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_213_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(doc).toContain('Phase 213');
    expect(doc).toContain('Public MVP Mobile and Form Accessibility Polish Final Review Checkpoint');
    expect(doc).toContain('Docs/final checkpoint only');
    expect(doc).toContain('no runtime change');
    expect(doc).toContain('no API change');
    expect(doc).toContain('no frontend change');
    expect(doc).toContain('no migration');
    expect(doc).toContain('no schema change');
    expect(doc).toContain('no CSS/HTML/JS changes');

    expect(readme).toContain('Phase 213');
    expect(readme).toContain(PHASE_213_DOC);
    expect(readme).toContain('Public MVP mobile and form accessibility polish final review checkpoint');
  });

  it('keeps public MVP HTML shells limited to page-class wrappers without Phase 213 markers', async () => {
    for (const shell of HTML_SHELLS) {
      const html = await readFile(join(process.cwd(), shell.path), 'utf8');
      expect(html, shell.path).toContain(shell.pageClass);
      for (const marker of shell.phaseMarkers) {
        expect(html, `${shell.path} must not contain ${marker}`).not.toContain(marker);
      }
    }
  });

  it('keeps Phase 201/204/206/208/210 CSS scoped to page classes without runtime hooks', async () => {
    const css = await readFile(join(process.cwd(), PUBLIC_MVP_CSS), 'utf8');

    for (const block of CSS_PHASE_BLOCKS) {
      const blockStart = css.indexOf(block.marker);
      expect(blockStart, block.marker).toBeGreaterThan(-1);
      const blockCss = css.slice(blockStart, blockStart + 2500);
      expect(blockCss, block.marker).toContain(block.scope);
      expect(blockCss).toMatch(/@media \(max-width: 640px\)|min-height: var\(--mvp-tap-min\)|font-size|line-height/);
      expect(blockCss).not.toMatch(/\bfetch\b|addEventListener|localStorage|sessionStorage/);
      expect(blockCss).not.toMatch(FORBIDDEN_OBSERVABILITY);
      expect(blockCss).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(blockCss).not.toMatch(FORBIDDEN_OUTCOME_COPY);
    }

    expect(css).not.toContain('Phase 213');
  });

  it('does not mark participation or form runtime modules with Phase 201-212 or Phase 213 changes', async () => {
    for (const relativePath of [...PARTICIPATION_RUNTIME_MODULES, ...FORM_RUNTIME_MODULES]) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      for (const marker of [
        'Phase 201',
        'Phase 202',
        'Phase 204',
        'Phase 206',
        'Phase 208',
        'Phase 210',
        'Phase 212',
        'Phase 213',
      ]) {
        expect(source, `${relativePath} must not contain ${marker}`).not.toContain(marker);
      }
    }
  });

  it('keeps login and registration auth boundaries after mobile and form polish', async () => {
    const loginSource = await readFile(
      join(process.cwd(), 'public/frontend/login-page.js'),
      'utf8',
    );
    const registrationSource = await readFile(
      join(process.cwd(), 'public/frontend/registration-page.js'),
      'utf8',
    );

    expect(loginSource).toContain("fetchImpl('/login/session'");
    expect(loginSource).not.toMatch(FORBIDDEN_STORAGE);

    expect(registrationSource).toContain("fetchImpl('/registration'");
    expect(registrationSource).toContain('display_name');
    expect(registrationSource).toContain('birth_year_month');
    expect(registrationSource).toContain('residential_region');
    expect(registrationSource).not.toContain("fetchImpl('/users/me'");
    expect(registrationSource).not.toContain("fetchImpl('/login/session'");
    expect(registrationSource).not.toMatch(FORBIDDEN_STORAGE);
  });

  it('keeps profile two-field boundary after mobile and form polish', async () => {
    const profileSource = await readFile(
      join(process.cwd(), 'public/frontend/profile-page.js'),
      'utf8',
    );

    expect(profileSource).toContain("'birth_year_month'");
    expect(profileSource).toContain("'residential_region'");
    expect(profileSource).toContain("fetchImpl('/users/me/profile'");
    expect(profileSource).toContain("method: 'PUT'");
    expect(profileSource).not.toMatch(FORBIDDEN_STORAGE);
  });

  it('keeps participation and creator form API boundaries unchanged', async () => {
    const votePage = await loadModule('public/frontend/vote-page.js');
    const createPollSource = await readFile(
      join(process.cwd(), 'public/frontend/create-poll-page.js'),
      'utf8',
    );
    const myPolls = await loadModule('public/frontend/my-polls-page.js');
    const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => ({
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
    expect(body).not.toHaveProperty('option_id');

    expect(createPollSource).toContain('submitCreatePollDemo');
    expect(createPollSource).toContain("fetchImpl('/creator/polls'");

    const sessionFetch = vi.fn(async () => ({ ok: true }));
    await myPolls.prepareMyPollsLiveSession({
      fetchImpl: sessionFetch,
      locationObject: { hostname: 'localhost' },
    });
    expect(sessionFetch).toHaveBeenCalledWith('/creator/session', {
      method: 'GET',
      credentials: 'same-origin',
    });
  });

  it('keeps quality_badge presentation-only after mobile and form polish', async () => {
    const badge = await loadModule('public/frontend/quality-feedback-badge.js');
    const badgeSource = await readFile(
      join(process.cwd(), 'public/frontend/quality-feedback-badge.js'),
      'utf8',
    );

    expect(badge.QUALITY_FEEDBACK_BADGE_LABEL).toBe('回饋良好');
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: 'positive_feedback' })).toBe(
      true,
    );
    for (const poll of [
      { quality_badge: null },
      {},
      { quality_badge: 'low_quality' },
      { quality_badge: 'unknown' },
    ]) {
      expect(badge.shouldRenderQualityFeedbackBadge(poll)).toBe(false);
    }
    expect(badgeSource).not.toMatch(
      /tooltip|title\s*=|aria-describedby|debug|score|rank|ranking|recommend|personaliz|trust|governance/i,
    );
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

    for (const marker of ['Phase 201', 'Phase 212', 'Phase 213']) {
      expect(repository).not.toContain(marker);
    }
  });

  it('keeps protected backend paths free of Phase 201-213 markers', async () => {
    for (const relativePath of PROTECTED_BACKEND_PATHS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8').catch(() => '');
      if (!source) {
        continue;
      }
      for (const marker of [
        'Phase 201',
        'Phase 204',
        'Phase 206',
        'Phase 208',
        'Phase 210',
        'Phase 212',
        'Phase 213',
      ]) {
        expect(source, relativePath).not.toContain(marker);
      }
    }
  });
});
