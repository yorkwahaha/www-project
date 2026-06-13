import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_212_DOC =
  'docs/www-project-phase-212-public-mvp-form-accessibility-polish-milestone-checkpoint-v1.md';
const PUBLIC_MVP_CSS = 'public/frontend/public-mvp.css';

const FORM_RUNTIME_MODULES = [
  'public/frontend/login-page.js',
  'public/frontend/registration-page.js',
  'public/frontend/profile-page.js',
  'public/frontend/create-poll-page.js',
  'public/frontend/my-polls-page.js',
] as const;

const FORM_HTML_SHELLS = [
  {
    path: 'public/login.html',
    pageClass: 'login-page',
    runtimePhaseMarkers: ['Phase 204', 'Phase 205', 'Phase 212'],
  },
  {
    path: 'public/registration.html',
    pageClass: 'registration-page',
    runtimePhaseMarkers: ['Phase 204', 'Phase 205', 'Phase 212'],
  },
  {
    path: 'public/profile.html',
    pageClass: 'profile-page',
    runtimePhaseMarkers: ['Phase 206', 'Phase 207', 'Phase 212'],
  },
  {
    path: 'public/create-poll.html',
    pageClass: 'create-poll-page',
    runtimePhaseMarkers: ['Phase 208', 'Phase 209', 'Phase 212'],
  },
  {
    path: 'public/my-polls.html',
    pageClass: 'my-polls-page',
    runtimePhaseMarkers: ['Phase 210', 'Phase 211', 'Phase 212'],
  },
] as const;

const CSS_PHASE_BLOCKS = [
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

describe('Phase 212 public MVP form accessibility polish milestone checkpoint', () => {
  it('confirms Phase 212 is docs/static only with README index reference', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_212_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(doc).toContain('Phase 212');
    expect(doc).toContain('Public MVP Form Accessibility Polish Milestone Checkpoint');
    expect(doc).toContain('Docs/checkpoint only');
    expect(doc).toContain('no runtime change');
    expect(doc).toContain('no API change');
    expect(doc).toContain('no frontend change');
    expect(doc).toContain('no migration');
    expect(doc).toContain('no schema change');
    expect(doc).toContain('no CSS/HTML/JS changes');

    expect(readme).toContain('Phase 212');
    expect(readme).toContain(PHASE_212_DOC);
    expect(readme).toContain('Public MVP form accessibility polish milestone checkpoint');
  });

  it('keeps form HTML shells limited to page-class wrappers without Phase 212 markers', async () => {
    for (const shell of FORM_HTML_SHELLS) {
      const html = await readFile(join(process.cwd(), shell.path), 'utf8');
      expect(html, shell.path).toContain(shell.pageClass);
      for (const marker of shell.runtimePhaseMarkers) {
        expect(html, `${shell.path} must not contain ${marker}`).not.toContain(marker);
      }
    }
  });

  it('keeps Phase 204/206/208/210 CSS scoped to page classes without runtime hooks', async () => {
    const css = await readFile(join(process.cwd(), PUBLIC_MVP_CSS), 'utf8');

    for (const block of CSS_PHASE_BLOCKS) {
      const blockStart = css.indexOf(block.marker);
      expect(blockStart, block.marker).toBeGreaterThan(-1);
      const blockCss = css.slice(blockStart, blockStart + 2500);
      expect(blockCss, block.marker).toContain(block.scope);
      expect(blockCss).toContain('min-height: var(--mvp-tap-min)');
      expect(blockCss).not.toMatch(/\bfetch\b|addEventListener|localStorage|sessionStorage/);
      expect(blockCss).not.toMatch(FORBIDDEN_OBSERVABILITY);
      expect(blockCss).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(blockCss).not.toMatch(FORBIDDEN_OUTCOME_COPY);
    }

    expect(css).not.toContain('Phase 212');
  });

  it('does not mark form runtime modules with Phase 204-211 or Phase 212 changes', async () => {
    for (const relativePath of FORM_RUNTIME_MODULES) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      for (const marker of [
        'Phase 204',
        'Phase 205',
        'Phase 206',
        'Phase 207',
        'Phase 208',
        'Phase 209',
        'Phase 210',
        'Phase 211',
        'Phase 212',
      ]) {
        expect(source, `${relativePath} must not contain ${marker}`).not.toContain(marker);
      }
    }
  });

  it('keeps login and registration auth boundaries after form accessibility polish', async () => {
    const loginSource = await readFile(
      join(process.cwd(), 'public/frontend/login-page.js'),
      'utf8',
    );
    const registrationSource = await readFile(
      join(process.cwd(), 'public/frontend/registration-page.js'),
      'utf8',
    );

    expect(loginSource).toContain("fetchImpl('/login/session'");
    expect(loginSource).toContain('submitProductionLoginForm');
    expect(loginSource).not.toMatch(FORBIDDEN_STORAGE);

    expect(registrationSource).toContain("fetchImpl('/registration'");
    expect(registrationSource).toContain('display_name');
    expect(registrationSource).toContain('birth_year_month');
    expect(registrationSource).toContain('residential_region');
    expect(registrationSource).not.toContain("fetchImpl('/users/me'");
    expect(registrationSource).not.toContain("fetchImpl('/login/session'");
    expect(registrationSource).not.toMatch(FORBIDDEN_STORAGE);
  });

  it('keeps profile two-field boundary after form accessibility polish', async () => {
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

  it('keeps create-poll demo vs live API boundary after form accessibility polish', async () => {
    const createPoll = await loadModule('public/frontend/create-poll-page.js');
    const createPollSource = await readFile(
      join(process.cwd(), 'public/frontend/create-poll-page.js'),
      'utf8',
    );

    expect(createPollSource).toContain('submitCreatePollDemo');
    expect(createPollSource).toContain("fetchImpl('/creator/polls'");
    expect(typeof createPoll.submitCreatePollDemo).toBe('function');
    expect(createPollSource).not.toMatch(FORBIDDEN_STORAGE);
  });

  it('keeps my-polls creator session and owned-poll boundaries after form accessibility polish', async () => {
    const myPolls = await loadModule('public/frontend/my-polls-page.js');
    const fetchImpl = vi.fn(async () => ({ ok: true }));

    await myPolls.prepareMyPollsLiveSession({
      fetchImpl,
      locationObject: { hostname: 'localhost' },
    });

    expect(fetchImpl).toHaveBeenCalledWith('/creator/session', {
      method: 'GET',
      credentials: 'same-origin',
    });
  });

  it('keeps quality_badge presentation-only after form accessibility polish', async () => {
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

  it('keeps vote-by-index body and Official Vote transaction order unchanged', async () => {
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
    expect(body).not.toHaveProperty('option_id');

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

  it('keeps protected backend paths free of Phase 204-212 markers', async () => {
    for (const relativePath of PROTECTED_BACKEND_PATHS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8').catch(() => '');
      if (!source) {
        continue;
      }
      for (const marker of [
        'Phase 204',
        'Phase 206',
        'Phase 208',
        'Phase 210',
        'Phase 212',
      ]) {
        expect(source, relativePath).not.toContain(marker);
      }
    }
  });
});
