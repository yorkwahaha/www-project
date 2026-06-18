import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_261_DOC =
  'docs/www-project-phase-261-public-static-html-shell-copy-runtime-review-checkpoint-v1.md';
const PHASE_260_DOC =
  'docs/www-project-phase-260-public-static-html-shell-copy-alignment-v1.md';

const PHASE_260_BASELINE_TESTS = [
  'tests/frontend/phase-260-public-static-html-shell-copy-alignment.test.ts',
  'tests/docs/phase-260-public-static-html-shell-copy-alignment-doc.test.ts',
] as const;

const PHASE_260_TOUCHED_HTML = [
  'public/index.html',
  'public/login.html',
  'public/vote.html',
  'public/results.html',
  'public/create-poll.html',
  'public/my-polls.html',
] as const;

const PHASE_260_VERIFY_ONLY_HTML = [
  'public/registration.html',
  'public/profile.html',
  'public/explore.html',
  'public/trust-levels.html',
] as const;

const FAQ_HTML = 'public/faq.html';

const PUBLIC_FRONTEND_RUNTIME_MODULES = [
  'public/frontend/public-page-copy.js',
  'public/frontend/public-mvp-ui.js',
  'public/frontend/public-mvp-home.js',
  'public/frontend/vote-page.js',
  'public/frontend/result-page.js',
  'public/frontend/login-page.js',
  'public/frontend/registration-page.js',
  'public/frontend/profile-page.js',
  'public/frontend/create-poll-page.js',
  'public/frontend/my-polls-page.js',
  'public/frontend/explore-page.js',
  'public/frontend/quality-feedback-badge.js',
] as const;

const PROTECTED_BACKEND_PATHS = [
  'src/polls/repository.ts',
  'src/http/official-vote-routes.ts',
  'src/http/registration-routes.ts',
  'src/auth/user-auth-resolver.ts',
  'migrations',
] as const;

const STALE_FALLBACK_MARKERS = [
  '優質題目',
  'X-User-Id',
  'creator_session',
  '多種訊號',
  'production credential proof',
  'production credential verifier',
] as const;

const SCRIPT_COUNTS: Record<(typeof PHASE_260_TOUCHED_HTML)[number], number> = {
  'public/index.html': 2,
  'public/login.html': 2,
  'public/vote.html': 2,
  'public/results.html': 2,
  'public/create-poll.html': 2,
  'public/my-polls.html': 2,
};

const SYNC_MOUNT_CONTRACTS: Record<string, string[]> = {
  // Phase 301: the homepage is now an ultra-minimal collecting-only swipe shell;
  // its former synced mount points and static sample cards were removed. These
  // are its current primary contracts.
  'public/index.html': [
    'id="home-swipe-stage"',
    'id="home-swipe-status"',
    'data-home-swipe-feed="mixed"',
    'id="home-create-cta"',
  ],
  'public/login.html': [
    'id="login-page-banner"',
    'id="login-lead-primary"',
    'id="login-lead-secondary"',
    'id="login-shell-form"',
    'id="login-credential"',
    'name="credential"',
  ],
  'public/vote.html': [
    'id="vote-page-reminder-lead"',
    'id="vote-policy-hint-list"',
    'id="vote-form"',
    'id="vote-submit"',
  ],
  'public/results.html': [
    'id="results-page-demo-intro"',
    'id="result-display"',
  ],
  'public/create-poll.html': [
    'id="create-poll-page-lead"',
    'id="create-poll-page-banner"',
    'id="create-poll-form"',
    'id="create-poll-submit"',
  ],
  'public/my-polls.html': [
    'id="my-polls-page-banner"',
    'id="my-polls-page-lead"',
    'data-mock-dashboard="true"',
  ],
};

const RUNTIME_SYNC_EXPORTS = [
  // Phase 301: public-mvp-home.js no longer exports a runtime onboarding-copy
  // sync helper; the swipe shell renders cards from /polls/feed instead.
  ['public/frontend/login-page.js', 'syncLoginPageOnboardingCopy'],
  ['public/frontend/vote-page.js', 'syncVotePageOnboardingCopy'],
  ['public/frontend/result-page.js', 'syncResultsPageOnboardingCopy'],
  ['public/frontend/create-poll-page.js', 'syncCreatePollPageOnboardingCopy'],
  ['public/frontend/my-polls-page.js', 'syncMyPollsPageOnboardingCopy'],
] as const;

const FORBIDDEN_HTML_TRACKING =
  /onclick=|onload=|localStorage|sessionStorage|gtag\(|analytics|trackEvent|dataLayer/i;

function countScriptTags(source: string): number {
  return (source.match(/<script\b/g) ?? []).length;
}

function stripJsComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 261 public static HTML shell copy runtime review checkpoint', () => {
  it('documents Phase 261 review checkpoint in README with APPROVED conclusion', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_261_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(doc).toContain('Phase 261');
    expect(doc).toContain('Public Static HTML Shell Copy Runtime Review Checkpoint');
    expect(doc).toContain('7a99bc3');
    expect(doc).toContain('Phase 260');
    expect(doc).toContain('review checkpoint');
    expect(doc).toContain('No runtime change');
    expect(doc).toContain('APPROVED');
    expect(doc).toContain('no runtime/API/DB/backend/auth/vote/result/creator/profile/privacy drift');
    expect(doc).toContain('Phase 262 blockers: none identified');
    expect(doc).toContain('Phase 262 candidate');
    expect(doc).toContain('syncHomePageAccountFlowNote');

    expect(readme).toContain('Phase 261');
    expect(readme).toContain(PHASE_261_DOC);
    expect(readme).toContain('Public static HTML shell copy runtime review checkpoint');
  });

  it('keeps Phase 260 baseline guard tests present', async () => {
    for (const relativePath of PHASE_260_BASELINE_TESTS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source.length).toBeGreaterThan(0);
    }
  });

  it('reviews Phase 260 touched HTML shells as static fallback copy-only', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_260_DOC), 'utf8');

    for (const relativePath of PHASE_260_TOUCHED_HTML) {
      expect(doc).toContain(relativePath.replace('public/', ''));
    }

    for (const relativePath of PHASE_260_TOUCHED_HTML) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      for (const marker of STALE_FALLBACK_MARKERS) {
        expect(source, `${relativePath} stale marker ${marker}`).not.toContain(marker);
      }
      expect(countScriptTags(source), relativePath).toBe(SCRIPT_COUNTS[relativePath]);
      expect(source, relativePath).not.toMatch(FORBIDDEN_HTML_TRACKING);

      for (const contract of SYNC_MOUNT_CONTRACTS[relativePath] ?? []) {
        expect(source, `${relativePath} missing ${contract}`).toContain(contract);
      }
    }
  });

  it('keeps faq.html and verify-only shells out of Phase 260 alignment scope', async () => {
    const faqHtml = await readFile(join(process.cwd(), FAQ_HTML), 'utf8');

    expect(faqHtml).not.toContain('Phase 260');
    expect(faqHtml).not.toContain('Phase 261');
    expect(faqHtml).not.toContain('優質題目');
    expect(faqHtml).toContain('回饋良好');

    for (const relativePath of PHASE_260_VERIFY_ONLY_HTML) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 260');
      expect(source, relativePath).not.toContain('Phase 261');
    }
  });

  it('reviews runtime sync helpers still overwrite mount points from public-page-copy.js', async () => {
    const ui = await loadModule('public/frontend/public-mvp-ui.js');

    for (const [modulePath, exportName] of RUNTIME_SYNC_EXPORTS) {
      const mod = await loadModule(modulePath);
      expect(typeof mod[exportName], `${modulePath}.${exportName}`).toBe('function');
    }

    expect(ui.PUBLIC_HOME_HERO_LEAD).toContain('截止後');
    expect(ui.PUBLIC_LOGIN_PAGE_LEAD_SECONDARY).not.toContain('X-User-Id');
    expect(ui.PUBLIC_VOTE_POLICY_QUALITY_FEEDBACK_TEXT).not.toContain('優質題目');
  });

  // Retired by Phase 301: the homepage account-flow note and its
  // syncHomePageAccountFlowNote helper were removed when the home became an
  // ultra-minimal collecting-only swipe shell. This historical review checkpoint
  // described the pre-Phase-301 home; current homepage assertions live in
  // tests/frontend/phase-301-home-swipe-card-visual-shell.test.ts.
  it.skip('documents homepage account note runtime engineer tokens as Phase 262 candidate only', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_261_DOC), 'utf8');
    const homeSource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/public-mvp-home.js'), 'utf8'),
    );
    const indexHtml = await readFile(join(process.cwd(), 'public/index.html'), 'utf8');

    expect(doc).toContain('syncHomePageAccountFlowNote');
    expect(doc).toContain('Phase 262 candidate');
    expect(homeSource).toContain('syncHomePageAccountFlowNote');
    expect(homeSource).not.toContain("creatorSessionCode.textContent = 'creator_session'");
    expect(homeSource).not.toContain("userIdCode.textContent = 'X-User-Id'");
    expect(homeSource).not.toContain('creator_session');
    expect(homeSource).not.toContain('X-User-Id');
    expect(indexHtml).not.toContain('creator_session');
    expect(indexHtml).not.toContain('X-User-Id');
  });

  it('keeps public frontend JS and CSS free of Phase 260/261 runtime drift markers', async () => {
    const css = await readFile(join(process.cwd(), 'public/frontend/public-mvp.css'), 'utf8');
    expect(css).not.toContain('Phase 260');
    expect(css).not.toContain('Phase 261');

    for (const relativePath of PUBLIC_FRONTEND_RUNTIME_MODULES) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 260');
      expect(source, relativePath).not.toContain('Phase 261');
    }
  });

  it('keeps registration boundary without auto-login or GET /users/me', async () => {
    const registration = await loadModule('public/frontend/registration-page.js');
    const fetchCalls: string[] = [];
    const fetchImpl = vi.fn(async (url: string) => {
      fetchCalls.push(String(url));
      return { status: 201 };
    });

    await registration.submitRegistrationRequest({
      profile: {
        display_name: 'Shell Copy Review User',
        birth_year_month: '1998-07',
        residential_region: 'TW-TPE',
      },
      credential: 'proof',
      fetchImpl,
    });

    expect(fetchCalls).toEqual(['/registration']);
  });

  it('keeps vote-by-index payload as { option_index } only', async () => {
    const votePage = await loadModule('public/frontend/vote-page.js');
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 201,
      json: async () => ({
        vote_token: 'secret-token',
        option_id: 'secret-option',
        shard_id: 4,
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
  });

  it('keeps quality_badge presentation gate and non-ranking boundary', async () => {
    const badge = await loadModule('public/frontend/quality-feedback-badge.js');

    expect(badge.QUALITY_FEEDBACK_BADGE_LABEL).toBe('回饋良好');
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: 'positive_feedback' })).toBe(
      true,
    );
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: null })).toBe(false);
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: 'unexpected' })).toBe(false);
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
    expect(repository).not.toContain('Phase 261');
  });

  it('does not mark Phase 261 on protected backend paths', async () => {
    for (const relativePath of PROTECTED_BACKEND_PATHS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8').catch(() => '');
      if (!source) {
        continue;
      }
      expect(source, relativePath).not.toContain('Phase 261');
    }
  });
});
