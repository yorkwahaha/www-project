import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_215_DOC =
  'docs/www-project-phase-215-explore-vote-results-state-copy-runtime-v1.md';
const PHASE_216_DOC =
  'docs/www-project-phase-216-explore-vote-results-state-copy-runtime-review-checkpoint-v1.md';

const PHASE_215_TOUCHED_MODULES = [
  'public/frontend/public-mvp-ui.js',
  'public/frontend/official-vote-pre-vote-hints.js',
  'public/frontend/result-page.js',
  'public/frontend/explore-page.js',
  'public/frontend/vote-page.js',
] as const;

const FORBIDDEN_ELIGIBILITY_OUTCOME =
  /你符合資格|你不符合資格|已投過票|可以投票|一定能投票|can_vote|age_passed|region_passed/i;

const FORBIDDEN_DEBUG_LEAKAGE =
  /request_id|requestId|trace_id|traceId|stack trace|internal code|error_code/i;

const FORBIDDEN_STORAGE = /localStorage|sessionStorage|document\.cookie|Set-Cookie/i;

const FORBIDDEN_BACKEND_ECHO =
  /error\.message|body\.message|apiError\.message|response\.text\(\)|JSON\.stringify\(error/i;

function stripJsComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 216 explore vote results state copy runtime review checkpoint', () => {
  it('documents Phase 216 review checkpoint in README', async () => {
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');
    expect(readme).toContain('Phase 216');
    expect(readme).toContain(PHASE_216_DOC);
    expect(readme).toContain('state copy runtime review checkpoint');
  });

  it('keeps Phase 215 delivery documented and runtime modules free of phase markers', async () => {
    const delivery = await readFile(join(process.cwd(), PHASE_215_DOC), 'utf8');
    const review = await readFile(join(process.cwd(), PHASE_216_DOC), 'utf8');

    expect(delivery).toContain('copy-only');
    expect(review).toContain('APPROVED');
    expect(review).toContain(
      'APPROVED — Phase 215 Explore / Vote / Results state copy runtime patch is copy-only; no runtime/API/DB/backend/auth/vote/result/privacy drift identified.',
    );

    for (const relativePath of PHASE_215_TOUCHED_MODULES) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 215');
      expect(source, relativePath).not.toContain('Phase 216');
    }
  });

  it('keeps resolvePublicErrorUserMessage from echoing foreign backend errors', async () => {
    const ui = await loadModule('public/frontend/public-mvp-ui.js');
    const uiSource = await readFile(join(process.cwd(), 'public/frontend/public-mvp-ui.js'), 'utf8');

    expect(uiSource).toContain('resolvePublicErrorUserMessage');
    expect(uiSource).toContain('Never surfaces foreign error.message');
    expect(
      ui.resolvePublicErrorUserMessage(
        new Error('backend secret failure'),
        '目前無法載入結果，請稍後再試。',
        ['目前無法載入結果，請稍後再試。'],
      ),
    ).toBe('目前無法載入結果，請稍後再試。');
  });

  it('keeps explore load-more failure copy user-facing without backend leakage', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const explore = await loadModule('public/frontend/explore-page.js');

    expect(publicUi.PUBLIC_EXPLORE_LOAD_MORE_UNAVAILABLE_MESSAGE).toBe(
      '目前無法載入更多問卷，請稍後再試。',
    );
    expect(explore.EXPLORE_LOAD_MORE_FAILURE_MESSAGE).toBe(
      publicUi.PUBLIC_EXPLORE_LOAD_MORE_UNAVAILABLE_MESSAGE,
    );
    expect(publicUi.PUBLIC_LOAD_FAILURE_USER_MESSAGES).toContain(
      publicUi.PUBLIC_EXPLORE_LOAD_MORE_UNAVAILABLE_MESSAGE,
    );
    expect(publicUi.PUBLIC_EXPLORE_LOAD_MORE_UNAVAILABLE_MESSAGE).not.toMatch(
      FORBIDDEN_DEBUG_LEAKAGE,
    );
  });

  it('keeps vote pre-vote hints neutral without eligibility outcome disclosure', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const hints = await loadModule('public/frontend/official-vote-pre-vote-hints.js');
    const hintsSource = await readFile(
      join(process.cwd(), 'public/frontend/official-vote-pre-vote-hints.js'),
      'utf8',
    );

    expect(hints.PRE_VOTE_HINT_COPY.anonymous).toBe(
      publicUi.PUBLIC_VOTE_PRE_VOTE_ANONYMOUS_HINT,
    );
    expect(hints.PRE_VOTE_HINT_COPY.incompleteProfile).toBe(
      publicUi.PUBLIC_PROFILE_COMPLETION_PROMPT_HINT,
    );
    expect(hints.PRE_VOTE_HINT_COPY.profileLoadFailed).toBe(
      publicUi.PUBLIC_VOTE_PRE_VOTE_PROFILE_LOAD_FAILED_HINT,
    );
    expect(hints.PRE_VOTE_HINT_LINKS.login.href).toBe('/login');
    expect(hints.PRE_VOTE_HINT_LINKS.profile.href).toBe('/profile');
    expect(hintsSource).not.toMatch(FORBIDDEN_ELIGIBILITY_OUTCOME);
    expect(hintsSource).not.toMatch(FORBIDDEN_DEBUG_LEAKAGE);

    for (const hint of Object.values(hints.PRE_VOTE_HINT_COPY)) {
      expect(hint).not.toMatch(FORBIDDEN_ELIGIBILITY_OUTCOME);
    }
  });

  it('keeps results demo/live intro separated without changing visibility gates', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const results = await loadModule('public/frontend/result-page.js');
    const resultSource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/result-page.js'), 'utf8'),
    );

    expect(publicUi.PUBLIC_RESULTS_PAGE_DEMO_INTRO_LEAD).toContain('展示用，不儲存');
    expect(publicUi.PUBLIC_RESULTS_PAGE_LIVE_INTRO_LEAD).not.toContain('展示用，不儲存');

    const demoIntro = { textContent: '' };
    results.syncResultsPageLeadParagraphs(
      {
        getElementById: (id: string) =>
          id === 'results-page-demo-intro' ? demoIntro : null,
      },
      { demoOnly: true },
    );
    expect(demoIntro.textContent).toBe(publicUi.PUBLIC_RESULTS_PAGE_DEMO_INTRO_LEAD);

    const liveIntro = { textContent: '' };
    results.syncResultsPageLeadParagraphs(
      {
        getElementById: (id: string) =>
          id === 'results-page-demo-intro' ? liveIntro : null,
      },
      { demoOnly: false },
    );
    expect(liveIntro.textContent).toBe(publicUi.PUBLIC_RESULTS_PAGE_LIVE_INTRO_LEAD);

    expect(resultSource).toContain('renderResultDisplay');
    expect(resultSource).toContain('resolveResultRenderMode');
    expect(resultSource).toContain('syncResultsPageLeadParagraphs(documentObject, { demoOnly })');
    expect(results.RESULTS_COLLECTING_SUMMARY).toContain('不顯示');
    expect(results.RESULTS_COLLECTING_SUMMARY).not.toMatch(/raw_count|\d+%|第\s*\d+\s*名/i);
  });

  it('keeps quality_badge presentation and vote-by-index boundaries', async () => {
    const badge = await loadModule('public/frontend/quality-feedback-badge.js');
    const votePage = await loadModule('public/frontend/vote-page.js');
    const badgeSource = await readFile(
      join(process.cwd(), 'public/frontend/quality-feedback-badge.js'),
      'utf8',
    );
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
    expect(badgeSource).not.toMatch(/tooltip|title\s*=|aria-describedby|debug|score|rank/i);
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: 'positive_feedback' })).toBe(
      true,
    );
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: null })).toBe(false);
  });

  it('keeps Phase 215 touched modules free of storage, backend echo, and forbidden copy', async () => {
    for (const relativePath of PHASE_215_TOUCHED_MODULES) {
      const source = stripJsComments(
        await readFile(join(process.cwd(), relativePath), 'utf8'),
      );
      if (relativePath !== 'public/frontend/public-mvp-ui.js') {
        expect(source, relativePath).not.toMatch(FORBIDDEN_BACKEND_ECHO);
      }
      expect(source, relativePath).not.toMatch(FORBIDDEN_STORAGE);
      expect(source, relativePath).not.toMatch(FORBIDDEN_ELIGIBILITY_OUTCOME);
    }
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
    expect(repository).not.toContain('Phase 215');
    expect(repository).not.toContain('Phase 216');
  });
});
