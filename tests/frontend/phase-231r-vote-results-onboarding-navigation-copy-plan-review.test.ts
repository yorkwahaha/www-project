import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_231_DOC =
  'docs/www-project-phase-231-vote-results-onboarding-navigation-copy-plan-v1.md';
const PHASE_231R_DOC =
  'docs/www-project-phase-231r-vote-results-onboarding-navigation-copy-plan-review-v1.md';

const VOTE_RESULTS_ONBOARDING_RUNTIME_MODULES = [
  'public/frontend/vote-page.js',
  'public/frontend/result-page.js',
  'public/frontend/official-vote-pre-vote-hints.js',
  'public/frontend/public-mvp-ui.js',
  'public/frontend/quality-feedback-badge.js',
] as const;

const FORBIDDEN_ELIGIBILITY_OUTCOME =
  /你符合資格|你不符合資格|已投過票|可以投票|一定能投票|can_vote|age_passed|region_passed/i;

const FORBIDDEN_DEBUG_LEAKAGE =
  /request_id|requestId|trace_id|traceId|stack trace|internal code|error_code/i;

const FORBIDDEN_STORAGE = /localStorage|sessionStorage|document\.cookie|Set-Cookie/i;

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 231-R vote results onboarding navigation copy plan review', () => {
  it('documents Phase 231-R review in README', async () => {
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');
    expect(readme).toContain('Phase 231-R');
    expect(readme).toContain(PHASE_231R_DOC);
    expect(readme).toContain(
      'Vote / results onboarding navigation copy plan review',
    );
  });

  it('keeps Phase 231 plan as plan-only without runtime module markers', async () => {
    const plan = await readFile(join(process.cwd(), PHASE_231_DOC), 'utf8');
    const review = await readFile(join(process.cwd(), PHASE_231R_DOC), 'utf8');

    expect(plan).toContain('plan only');
    expect(plan).toContain('/vote/:pollId');
    expect(plan).toContain('/results/:pollId');
    expect(plan).toContain('official-vote-pre-vote-hints.js');
    expect(plan).toContain('Phase 231-R');
    expect(review).toContain('copy-only');
    expect(review).toContain('APPROVED');

    for (const relativePath of VOTE_RESULTS_ONBOARDING_RUNTIME_MODULES) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 231');
      expect(source, relativePath).not.toContain('Phase 231-R');
      expect(source, relativePath).not.toContain('Phase 232');
    }
  });

  it('keeps vote and results copy grouped on participant-flow surfaces', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const hints = await loadModule('public/frontend/official-vote-pre-vote-hints.js');
    const voteHtml = await readFile(join(process.cwd(), 'public/vote.html'), 'utf8');
    const resultsHtml = await readFile(join(process.cwd(), 'public/results.html'), 'utf8');

    expect(publicUi.PUBLIC_VOTE_PAGE_REMINDER_LEAD).toBeTruthy();
    expect(publicUi.PUBLIC_RESULTS_PAGE_DEMO_INTRO_LEAD).toBeTruthy();
    expect(publicUi.PUBLIC_RESULTS_PAGE_LIVE_INTRO_LEAD).toBeTruthy();
    expect(hints.PRE_VOTE_HINT_COPY.anonymous).toBe(
      publicUi.PUBLIC_VOTE_PRE_VOTE_ANONYMOUS_HINT,
    );
    expect(voteHtml).toContain('id="vote-page-reminder-lead"');
    expect(resultsHtml).toContain('id="results-page-demo-intro"');
    expect(voteHtml).toContain('/vote/demo');
    expect(resultsHtml).toContain('公開結果（唯讀）');
  });

  it('keeps pre-vote hints neutral without eligibility guarantee', async () => {
    const hints = await loadModule('public/frontend/official-vote-pre-vote-hints.js');
    const hintsSource = await readFile(
      join(process.cwd(), 'public/frontend/official-vote-pre-vote-hints.js'),
      'utf8',
    );

    expect(hints.PRE_VOTE_HINT_COPY.anonymous).toContain('不代表');
    expect(hints.PRE_VOTE_HINT_COPY.incompleteProfile).toContain('不代表');
    expect(hints.PRE_VOTE_HINT_LINKS.login.href).toBe('/login');
    expect(hints.PRE_VOTE_HINT_LINKS.profile.href).toBe('/profile');
    expect(hintsSource).not.toMatch(FORBIDDEN_ELIGIBILITY_OUTCOME);
    expect(hintsSource).not.toMatch(FORBIDDEN_DEBUG_LEAKAGE);
    expect(hintsSource).not.toMatch(FORBIDDEN_STORAGE);
  });

  it('keeps demo vs live results intro selection unchanged', async () => {
    const resultPage = await loadModule('public/frontend/result-page.js');
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const demoIntro = { textContent: '' };
    const documentObject = {
      getElementById: (id: string) => (id === 'results-page-demo-intro' ? demoIntro : null),
    };

    resultPage.syncResultsPageLeadParagraphs(documentObject, { demoOnly: true });
    expect(demoIntro.textContent).toBe(publicUi.PUBLIC_RESULTS_PAGE_DEMO_INTRO_LEAD);

    resultPage.syncResultsPageLeadParagraphs(documentObject, { demoOnly: false });
    expect(demoIntro.textContent).toBe(publicUi.PUBLIC_RESULTS_PAGE_LIVE_INTRO_LEAD);
  });

  it('keeps vote ↔ results navigation CTAs as href-only labels', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const votePage = await readFile(join(process.cwd(), 'public/frontend/vote-page.js'), 'utf8');
    const resultPage = await readFile(join(process.cwd(), 'public/frontend/result-page.js'), 'utf8');

    expect(publicUi.PUBLIC_CTA_GO_TO_VOTE_PAGE_LABEL).toBe('前往投票頁');
    expect(publicUi.PUBLIC_CTA_VIEW_PUBLIC_RESULTS_LABEL).toBe('查看公開結果頁');
    expect(votePage).toContain('PUBLIC_CTA_VIEW_PUBLIC_RESULTS_LABEL');
    expect(resultPage).toContain('PUBLIC_CTA_GO_TO_VOTE_PAGE_LABEL');
    expect(votePage).not.toMatch(FORBIDDEN_ELIGIBILITY_OUTCOME);
    expect(resultPage).not.toMatch(FORBIDDEN_ELIGIBILITY_OUTCOME);
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
        display_name: 'Plan Review User',
        birth_year_month: '1998-07',
        residential_region: 'TW-TPE',
      },
      credential: 'proof',
      fetchImpl,
    });

    expect(fetchCalls).toEqual(['/registration']);
  });

  it('keeps vote/results modules free of forbidden debug and storage patterns', async () => {
    for (const relativePath of VOTE_RESULTS_ONBOARDING_RUNTIME_MODULES) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toMatch(FORBIDDEN_DEBUG_LEAKAGE);
      expect(source, relativePath).not.toMatch(FORBIDDEN_STORAGE);
    }
  });

  it('keeps vote-by-index and quality_badge presentation boundaries', async () => {
    const votePage = await loadModule('public/frontend/vote-page.js');
    const badge = await loadModule('public/frontend/quality-feedback-badge.js');
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
    expect(badge.QUALITY_FEEDBACK_BADGE_LABEL).toBe('回饋良好');
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: null })).toBe(false);
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
    expect(repository).not.toContain('Phase 231-R');
  });
});
