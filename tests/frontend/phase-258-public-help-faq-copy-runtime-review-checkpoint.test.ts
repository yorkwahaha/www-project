import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_258_DOC =
  'docs/www-project-phase-258-public-help-faq-copy-runtime-review-checkpoint-v1.md';

const PUBLIC_PAGE_COPY = 'public/frontend/public-page-copy.js';
const PUBLIC_MVP_UI = 'public/frontend/public-mvp-ui.js';
const CREATOR_FLOW_COPY = 'public/frontend/creator-flow-copy.js';
const FAQ_HTML = 'public/faq.html';

const PHASE_257_BASELINE_TESTS = [
  'tests/frontend/phase-257-public-help-faq-copy-refinement.test.ts',
  'tests/docs/phase-257-public-help-faq-copy-refinement-doc.test.ts',
] as const;

const PHASE_257_TOUCHED_MODULES = [
  PUBLIC_PAGE_COPY,
  PUBLIC_MVP_UI,
  CREATOR_FLOW_COPY,
  FAQ_HTML,
] as const;

const FORBIDDEN_RUNTIME_MODULES = [
  'public/frontend/vote-page.js',
  'public/frontend/result-page.js',
  'public/frontend/registration-page.js',
  'public/frontend/login-page.js',
  'public/frontend/profile-page.js',
  'public/frontend/create-poll-page.js',
  'public/frontend/my-polls-page.js',
] as const;

const PROTECTED_BACKEND_PATHS = [
  'src/http/official-vote-routes.ts',
  'src/http/registration-routes.ts',
  'src/auth/user-auth-resolver.ts',
  'src/polls/repository.ts',
  'migrations',
] as const;

const FAQ_SCRIPT_SRCS = [
  '/frontend/public-mvp-layout.js',
  '/frontend/faq-page.js',
] as const;

const SAMPLE_PUBLIC_COPY_EXPORTS = [
  'PUBLIC_FAQ_PAGE_HERO_LEAD',
  'PUBLIC_LOGIN_FORM_READY_HINT',
  'PUBLIC_VOTE_POLICY_QUALITY_FEEDBACK_TEXT',
  'PUBLIC_CREATOR_ACTION_CLOSE_HINT',
  'PUBLIC_HOME_VALUE_QUALITY_FEEDBACK_BODY',
] as const;

const FORBIDDEN_SIDE_EFFECTS =
  /\bfetch\b|XMLHttpRequest|addEventListener|localStorage|sessionStorage|document\.cookie|indexedDB|gtag\(|analytics|datadog|sentry|trackEvent/i;

const FORBIDDEN_DOM_MUTATION =
  /document\.(createElement|getElementById|querySelector)|\.textContent\s*=|\.innerHTML\s*=/;

const FORBIDDEN_FAQ_TRACKING =
  /onclick=|onload=|localStorage|sessionStorage|gtag\(|analytics|trackEvent|dataLayer/i;

function stripJsComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 258 public help / FAQ copy runtime review checkpoint', () => {
  it('documents Phase 258 review checkpoint in README with APPROVED conclusion', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_258_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(doc).toContain('Phase 258');
    expect(doc).toContain('Public Help / FAQ Copy Runtime Review Checkpoint');
    expect(doc).toContain('8828d74');
    expect(doc).toContain('Phase 257');
    expect(doc).toContain('review checkpoint');
    expect(doc).toContain('No runtime change');
    expect(doc).toContain('APPROVED');
    expect(doc).toContain('no runtime/API/DB/backend/auth/vote/result/creator/profile/privacy drift');
    expect(doc).toContain('Phase 259 blockers: none identified');

    expect(readme).toContain('Phase 258');
    expect(readme).toContain(PHASE_258_DOC);
    expect(readme).toContain('Public help / FAQ copy runtime review checkpoint');
  });

  it('keeps Phase 257 baseline guard tests present', async () => {
    for (const relativePath of PHASE_257_BASELINE_TESTS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source.length).toBeGreaterThan(0);
    }
  });

  it('reviews public-page-copy.js as constants-only and side-effect-free', async () => {
    const raw = await readFile(join(process.cwd(), PUBLIC_PAGE_COPY), 'utf8');
    const source = stripJsComments(raw);

    expect(raw).toContain('Phase 257');
    expect(source).toMatch(/^export const PUBLIC_/m);
    expect(source).not.toMatch(FORBIDDEN_SIDE_EFFECTS);
    expect(source).not.toMatch(FORBIDDEN_DOM_MUTATION);
    expect(source).not.toMatch(/\bexport function\b/);
    expect(source).not.toMatch(/\bexport async function\b/);

    const copyModule = await loadModule(PUBLIC_PAGE_COPY);
    for (const exportName of SAMPLE_PUBLIC_COPY_EXPORTS) {
      expect(typeof copyModule[exportName]).toBe('string');
      expect(copyModule[exportName].length).toBeGreaterThan(0);
    }
  });

  it('reviews public-mvp-ui.js re-export and allowlist boundaries unchanged', async () => {
    const uiSource = await readFile(join(process.cwd(), PUBLIC_MVP_UI), 'utf8');
    const ui = await loadModule(PUBLIC_MVP_UI);

    expect(uiSource).toContain("export * from './public-page-copy.js'");
    expect(uiSource).toContain("import * as PAGE_COPY from './public-page-copy.js'");
    expect(uiSource).toContain('PAGE_COPY.PUBLIC_FAQ_PAGE_HERO_LEAD');
    expect(uiSource).toContain('PAGE_COPY.PUBLIC_LOGIN_FORM_READY_HINT');

    for (const exportName of SAMPLE_PUBLIC_COPY_EXPORTS) {
      expect(ui[exportName]).toBeDefined();
      expect(typeof ui[exportName]).toBe('string');
    }

    expect(ui.PUBLIC_FAQ_ONBOARDING_MESSAGES.length).toBeGreaterThan(10);
    expect(ui.PUBLIC_AUTH_ACCOUNT_ONBOARDING_MESSAGES.length).toBeGreaterThan(5);
    expect(ui.PUBLIC_VOTE_RESULTS_ONBOARDING_MESSAGES.length).toBeGreaterThan(10);
    expect(ui.PUBLIC_CREATOR_ONBOARDING_MESSAGES.length).toBeGreaterThan(10);
    expect(ui.PUBLIC_HINT_TEXT_MESSAGES).toEqual(
      expect.arrayContaining(ui.PUBLIC_FAQ_ONBOARDING_MESSAGES),
    );

    expect(ui.PUBLIC_FAQ_ONBOARDING_MESSAGES).toContain(ui.PUBLIC_FAQ_PAGE_HERO_LEAD);
    expect(ui.PUBLIC_FAQ_ONBOARDING_MESSAGES).toContain(ui.PUBLIC_FAQ_ACCOUNT_FLOW_INTRO);
    expect(ui.PUBLIC_VOTE_POLICY_QUALITY_FEEDBACK_TEXT).not.toContain('優質題目');
  });

  it('reviews creator-flow-copy.js import adjustment without creator runtime drift', async () => {
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
    expect(creator.CREATOR_FLOW_COPY.actionClose).toContain('結束收集並公開結果');
  });

  it('locks faq.html to existing scripts without handler or tracking additions', async () => {
    const faqHtml = await readFile(join(process.cwd(), FAQ_HTML), 'utf8');
    const ui = await loadModule(PUBLIC_MVP_UI);

    const scriptMatches = [...faqHtml.matchAll(/<script\b[^>]*>/gi)];
    expect(scriptMatches).toHaveLength(2);

    for (const src of FAQ_SCRIPT_SRCS) {
      expect(faqHtml).toContain(src);
    }

    expect(faqHtml).not.toMatch(FORBIDDEN_FAQ_TRACKING);
    expect(faqHtml).not.toContain('優質題目');
    expect(faqHtml).toContain('回饋良好');
    expect(faqHtml).toContain(ui.PUBLIC_FAQ_PAGE_HERO_LEAD);
    expect(faqHtml).toContain(ui.PUBLIC_FAQ_CREATOR_FLOW_LIVE_STEP);
    expect(faqHtml).toContain(ui.PUBLIC_FAQ_PARTICIPANT_COLLECTING_STEP);
  });

  it('keeps Phase 257 delivery modules free of Phase 258 markers', async () => {
    for (const relativePath of PHASE_257_TOUCHED_MODULES) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 258');
    }
  });

  it('does not mark Phase 258 on forbidden runtime handler modules', async () => {
    for (const relativePath of FORBIDDEN_RUNTIME_MODULES) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 258');
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
        display_name: 'FAQ Copy Review User',
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
        shard_id: 7,
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
    expect(repository).not.toContain('Phase 258');
  });

  it('does not mark Phase 258 on protected backend paths', async () => {
    for (const relativePath of PROTECTED_BACKEND_PATHS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8').catch(() => '');
      if (!source) {
        continue;
      }
      expect(source, relativePath).not.toContain('Phase 258');
    }
  });
});
