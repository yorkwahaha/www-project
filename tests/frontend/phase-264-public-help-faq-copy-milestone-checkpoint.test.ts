import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_264_DOC =
  'docs/www-project-phase-264-public-help-faq-copy-milestone-checkpoint-v1.md';

const PHASE_DOCS = [
  'docs/www-project-phase-256-public-help-faq-copy-refinement-plan-v1.md',
  'docs/www-project-phase-257-public-help-faq-copy-refinement-v1.md',
  'docs/www-project-phase-258-public-help-faq-copy-runtime-review-checkpoint-v1.md',
  'docs/www-project-phase-259-public-static-html-shell-copy-alignment-plan-v1.md',
  'docs/www-project-phase-260-public-static-html-shell-copy-alignment-v1.md',
  'docs/www-project-phase-261-public-static-html-shell-copy-runtime-review-checkpoint-v1.md',
  'docs/www-project-phase-262-home-account-flow-runtime-copy-token-cleanup-v1.md',
  'docs/www-project-phase-263-home-account-flow-runtime-copy-review-checkpoint-v1.md',
] as const;

const P0_P1_HTML = [
  'public/index.html',
  'public/login.html',
  'public/vote.html',
  'public/results.html',
  'public/create-poll.html',
  'public/my-polls.html',
] as const;

const FAQ_HTML = 'public/faq.html';

const PUBLIC_PAGE_COPY = 'public/frontend/public-page-copy.js';
const PUBLIC_MVP_HOME = 'public/frontend/public-mvp-home.js';
const PUBLIC_MVP_UI = 'public/frontend/public-mvp-ui.js';
const CREATOR_FLOW_COPY = 'public/frontend/creator-flow-copy.js';

const PROTECTED_BACKEND_PATHS = [
  'src/http/official-vote-routes.ts',
  'src/http/creator-poll-routes.ts',
  'src/http/creator-session-routes.ts',
  'src/http/poll-routes.ts',
  'src/http/login-session-routes.ts',
  'src/http/registration-routes.ts',
  'src/http/user-profile-routes.ts',
  'src/auth/user-auth-resolver.ts',
  'src/polls/repository.ts',
] as const;

const PHASE_MARKERS = [
  'Phase 256',
  'Phase 257',
  'Phase 258',
  'Phase 259',
  'Phase 260',
  'Phase 261',
  'Phase 262',
  'Phase 263',
  'Phase 264',
] as const;

const STALE_FALLBACK_MARKERS = [
  '優質題目',
  'X-User-Id',
  'creator_session',
  '多種訊號',
  'production credential proof',
  'production credential verifier',
] as const;

const ENGINEER_TOKEN_MARKERS = ['creator_session', 'X-User-Id'] as const;

const SAMPLE_PUBLIC_COPY_EXPORTS = [
  'PUBLIC_FAQ_PAGE_HERO_LEAD',
  'PUBLIC_HOME_ACCOUNT_FLOW_REGISTRATION_NOTE',
  'PUBLIC_LOGIN_PAGE_LEAD_SECONDARY',
  'PUBLIC_VOTE_POLICY_QUALITY_FEEDBACK_TEXT',
] as const;

const FORBIDDEN_SIDE_EFFECTS =
  /\bfetch\s*\(|addEventListener|removeEventListener|localStorage|sessionStorage|document\.cookie|navigator\.sendBeacon|performance\.mark/i;

const FORBIDDEN_DOM_MUTATION =
  /document\.(getElementById|querySelector|createElement)|\.replaceChildren|\.append\(/;

const FORBIDDEN_ELIGIBILITY_OUTCOME =
  /你符合資格|你不符合資格|已投過票|可以投票|一定能投票|can_vote|age_passed|region_passed/i;

const FORBIDDEN_QUALITY_MISUSE =
  /ranking|recommendation|personalization|creator score|governance score/i;

function stripJsComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:\\])\/\/.*$/gm, '$1');
}

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 264 public help FAQ copy milestone checkpoint', () => {
  it('confirms Phase 256-263 primary docs exist', async () => {
    for (const relativePath of PHASE_DOCS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source.length, relativePath).toBeGreaterThan(0);
    }
  });

  it('confirms Phase 264 is docs-only with README index and APPROVED conclusion', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_264_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(doc).toContain('Phase 264');
    expect(doc).toContain('Public Help / FAQ Copy Milestone Checkpoint');
    expect(doc).toContain('milestone checkpoint');
    expect(doc).toContain('no runtime change');
    expect(doc).toContain('no API change');
    expect(doc).toContain('no frontend behavior change');
    expect(doc).toContain('no migration');
    expect(doc).toContain('no schema change');
    expect(doc).toContain('no CSS/HTML/JS presentation changes');
    expect(doc).toContain(
      'APPROVED — Public help / FAQ / static HTML shell / runtime copy cleanup milestone complete (Phase 256–263); no runtime/API/DB/backend/auth/vote/result/creator/profile/privacy drift identified.',
    );
    expect(doc).toContain('Phase 265 blockers: none identified');

    expect(readme).toContain('Phase 264');
    expect(readme).toContain(PHASE_264_DOC);
    expect(readme).toContain('Public help / FAQ copy milestone checkpoint');
  });

  it('keeps protected backend paths and migrations free of Phase 256-264 markers', async () => {
    for (const relativePath of PROTECTED_BACKEND_PATHS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      for (const marker of PHASE_MARKERS) {
        expect(source, `${relativePath} must not contain ${marker}`).not.toContain(marker);
      }
    }

    const migrationDir = join(process.cwd(), 'migrations');
    const migrationFiles = await readdir(migrationDir);
    for (const fileName of migrationFiles) {
      const source = await readFile(join(migrationDir, fileName), 'utf8');
      for (const marker of PHASE_MARKERS) {
        expect(source, `migrations/${fileName} must not contain ${marker}`).not.toContain(
          marker,
        );
      }
    }
  });

  it('keeps public-page-copy.js constants-only and side-effect-free', async () => {
    const raw = await readFile(join(process.cwd(), PUBLIC_PAGE_COPY), 'utf8');
    const source = stripJsComments(raw);
    const copyModule = await loadModule(PUBLIC_PAGE_COPY);

    expect(source).toMatch(/^export const PUBLIC_/m);
    expect(source).not.toMatch(FORBIDDEN_SIDE_EFFECTS);
    expect(source).not.toMatch(FORBIDDEN_DOM_MUTATION);
    expect(source).not.toMatch(/\bexport function\b/);
    expect(source).not.toMatch(/\bexport async function\b/);

    for (const exportName of SAMPLE_PUBLIC_COPY_EXPORTS) {
      expect(typeof copyModule[exportName]).toBe('string');
      expect(copyModule[exportName].length).toBeGreaterThan(0);
    }

    expect(copyModule.PUBLIC_HOME_ACCOUNT_FLOW_REGISTRATION_NOTE).toContain('不會自動登入');
    expect(copyModule.PUBLIC_VOTE_POLICY_QUALITY_FEEDBACK_TEXT).not.toContain('優質題目');
  });

  it('keeps public-mvp-ui.js re-export and PAGE_COPY allowlist boundaries', async () => {
    const uiSource = await readFile(join(process.cwd(), PUBLIC_MVP_UI), 'utf8');
    const ui = await loadModule(PUBLIC_MVP_UI);

    expect(uiSource).toContain("export * from './public-page-copy.js'");
    expect(uiSource).toContain("import * as PAGE_COPY from './public-page-copy.js'");
    expect(uiSource).toContain('PAGE_COPY.PUBLIC_FAQ_PAGE_HERO_LEAD');
    expect(uiSource).toContain('PAGE_COPY.PUBLIC_HOME_ACCOUNT_FLOW_REGISTRATION_NOTE');

    for (const exportName of SAMPLE_PUBLIC_COPY_EXPORTS) {
      expect(ui[exportName]).toBeDefined();
      expect(typeof ui[exportName]).toBe('string');
    }

    expect(ui.PUBLIC_FAQ_ONBOARDING_MESSAGES.length).toBeGreaterThan(10);
    expect(ui.PUBLIC_FAQ_ONBOARDING_MESSAGES).toContain(ui.PUBLIC_FAQ_PAGE_HERO_LEAD);
    expect(ui.PUBLIC_VOTE_POLICY_QUALITY_FEEDBACK_TEXT).not.toContain('優質題目');
  });

  it('keeps creator-flow-copy.js on copy constants without creator API drift', async () => {
    const raw = await readFile(join(process.cwd(), CREATOR_FLOW_COPY), 'utf8');
    const source = stripJsComments(raw);
    const creator = await loadModule(CREATOR_FLOW_COPY);

    expect(raw).toContain("from './public-page-copy.js'");
    expect(source).not.toMatch(/\bfetch\b/);
    expect(source).not.toMatch(FORBIDDEN_SIDE_EFFECTS);

    expect(creator.CREATOR_FLOW_COPY).toMatchObject({
      createSuccessLead: expect.any(String),
      createSuccessManage: expect.any(String),
      myPollsLead: expect.any(String),
      resultsCreatorLead: expect.any(String),
      lifecycleLeadCollecting: expect.any(String),
      lifecycleLeadPostLock: expect.any(String),
      actionCancel: expect.any(String),
      actionClose: expect.any(String),
      actionUnpublish: expect.any(String),
    });

    expect(typeof creator.renderCreatorActionGuide).toBe('function');
    expect(typeof creator.renderCreatorManageLinks).toBe('function');
    expect(typeof creator.renderCreateSuccessFlowGuide).toBe('function');
  });

  it('keeps homepage runtime copy free of engineer tokens', async () => {
    const homeSource = stripJsComments(await readFile(join(process.cwd(), PUBLIC_MVP_HOME), 'utf8'));

    // Phase 301: the homepage account-flow note and syncHomePageAccountFlowNote
    // were removed (home is now a collecting-only swipe feed that reuses
    // /polls/feed, so FORBIDDEN_SIDE_EFFECTS no longer applies). The
    // engineer-token / eligibility-outcome privacy guards below still hold.
    for (const marker of ENGINEER_TOKEN_MARKERS) {
      expect(homeSource, `public-mvp-home.js must not contain ${marker}`).not.toContain(marker);
    }
    expect(homeSource).not.toMatch(FORBIDDEN_ELIGIBILITY_OUTCOME);
    expect(homeSource).not.toContain('creatorSessionCode');
    expect(homeSource).not.toContain('userIdCode');
  });

  it('keeps P0/P1 static fallback free of stale engineer or misleading copy', async () => {
    for (const relativePath of P0_P1_HTML) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      for (const marker of STALE_FALLBACK_MARKERS) {
        expect(source, `${relativePath} stale marker ${marker}`).not.toContain(marker);
      }
      expect(source, relativePath).not.toContain('Phase 264');
    }

    // Phase 301: the homepage account-flow note was removed; its account copy
    // moved to the login/registration pages. The home stays free of stale
    // engineer/misleading copy (checked via the P0/P1 loop above).
    const indexHtml = await readFile(join(process.cwd(), 'public/index.html'), 'utf8');
    expect(indexHtml).toContain('data-home-swipe-feed="collecting-only"');
    expect(indexHtml).not.toContain('id="home-account-flow-note"');
  });

  it('keeps faq.html aligned in Phase 257 and untouched by Phase 260', async () => {
    const faqHtml = await readFile(join(process.cwd(), FAQ_HTML), 'utf8');

    expect(faqHtml).not.toContain('Phase 260');
    expect(faqHtml).not.toContain('Phase 264');
    expect(faqHtml).not.toContain('優質題目');
    expect(faqHtml).toContain('回饋良好');
    for (const marker of ENGINEER_TOKEN_MARKERS) {
      expect(faqHtml).not.toContain(marker);
    }
  });

  it('keeps vote-by-index payload as { option_index } only', async () => {
    const votePage = await loadModule('public/frontend/vote-page.js');
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 201,
      json: async () => ({
        vote_token: 'secret-token',
        option_id: 'secret-option',
        shard_id: 6,
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
        display_name: 'Copy Milestone User',
        birth_year_month: '1994-05',
        residential_region: 'TW-TPE',
      },
      credential: 'proof',
      fetchImpl,
    });
    expect(fetchCalls).toEqual(['/registration']);
  });

  it('keeps quality_badge presentation gate and non-ranking boundary', async () => {
    const badge = await loadModule('public/frontend/quality-feedback-badge.js');
    const badgeSource = await readFile(
      join(process.cwd(), 'public/frontend/quality-feedback-badge.js'),
      'utf8',
    );

    expect(badge.QUALITY_FEEDBACK_BADGE_LABEL).toBe('回饋良好');
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: 'positive_feedback' })).toBe(
      true,
    );
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: null })).toBe(false);
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: 'unexpected' })).toBe(false);
    expect(badgeSource).not.toMatch(FORBIDDEN_QUALITY_MISUSE);
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
    expect(repository).not.toContain('Phase 264');
  });
});
