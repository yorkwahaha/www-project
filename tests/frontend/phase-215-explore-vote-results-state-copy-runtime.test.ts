import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_215_MODULES = [
  'public/frontend/public-mvp-ui.js',
  'public/frontend/explore-page.js',
  'public/frontend/vote-page.js',
  'public/frontend/result-page.js',
  'public/frontend/official-vote-pre-vote-hints.js',
] as const;

const FORBIDDEN_ELIGIBILITY_OUTCOME =
  /你符合資格|你不符合資格|已投過票|可以投票|一定能投票|can_vote|age_passed|region_passed/i;

const FORBIDDEN_DEBUG_LEAKAGE =
  /request_id|requestId|option_id|trace_id|traceId|stack trace|internal code|error_code/i;

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

describe('Phase 215 explore vote results state copy runtime', () => {
  it('documents Phase 215 in README', async () => {
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');
    expect(readme).toContain('Phase 215');
    expect(readme).toContain(
      'docs/www-project-phase-215-explore-vote-results-state-copy-runtime-v1.md',
    );
  });

  it('aligns explore load-more failure copy with the load-failure pattern', async () => {
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
    expect(publicUi.PUBLIC_EXPLORE_LOAD_FAILURE_MESSAGE).toMatch(/目前無法載入.*請稍後再試。$/);
  });

  it('keeps explore loading and empty copy frontend-owned and stable', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const explore = await loadModule('public/frontend/explore-page.js');

    expect(explore.EXPLORE_FEED_LOADING_MESSAGE).toBe('載入探索列表中，請稍候。');
    expect(explore.EXPLORE_FEED_EMPTY_MESSAGE).toBe(publicUi.PUBLIC_EXPLORE_EMPTY_MESSAGE);
    expect(publicUi.PUBLIC_PENDING_USER_MESSAGES).toContain(
      publicUi.PUBLIC_EXPLORE_FEED_LOADING_MESSAGE,
    );
  });

  it('keeps vote pre-vote hints neutral without eligibility disclosure', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const hints = await loadModule('public/frontend/official-vote-pre-vote-hints.js');

    expect(hints.PRE_VOTE_HINT_COPY.anonymous).toBe(
      publicUi.PUBLIC_VOTE_PRE_VOTE_ANONYMOUS_HINT,
    );
    expect(hints.PRE_VOTE_HINT_COPY.incompleteProfile).toBe(
      publicUi.PUBLIC_VOTE_PRE_VOTE_INCOMPLETE_PROFILE_HINT,
    );
    expect(hints.PRE_VOTE_HINT_COPY.incompleteProfile).toBe(
      publicUi.PUBLIC_PROFILE_COMPLETION_PROMPT_HINT,
    );
    expect(hints.PRE_VOTE_HINT_COPY.completeProfile).toBe(
      publicUi.PUBLIC_VOTE_PRE_VOTE_NEUTRAL_SUBMIT_HINT,
    );
    expect(hints.PRE_VOTE_HINT_COPY.profileLoadFailed).toBe(
      publicUi.PUBLIC_VOTE_PRE_VOTE_PROFILE_LOAD_FAILED_HINT,
    );
    expect(hints.PRE_VOTE_HINT_COPY.profileLoadFailed).not.toBe(
      publicUi.PUBLIC_VOTE_PRE_VOTE_NEUTRAL_SUBMIT_HINT,
    );

    for (const hint of Object.values(hints.PRE_VOTE_HINT_COPY)) {
      expect(hint).not.toMatch(FORBIDDEN_ELIGIBILITY_OUTCOME);
      expect(hint).not.toMatch(FORBIDDEN_DEBUG_LEAKAGE);
    }
  });

  it('keeps vote loading and load-error copy frontend-owned', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const vote = await loadModule('public/frontend/vote-page.js');
    const voteSource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/vote-page.js'), 'utf8'),
    );

    expect(vote.VOTE_PAGE_LOADING_MESSAGE).toBe('載入問卷中，請稍候。');
    expect(publicUi.PUBLIC_VOTE_PAGE_LOAD_ERROR_TITLE).toBe('無法載入問卷');
    expect(voteSource).toContain('resolvePublicErrorUserMessage');
    expect(voteSource).toContain('PUBLIC_VOTE_PAGE_LOAD_ERROR_TITLE');
    expect(voteSource).not.toMatch(
      /showRouteError[\s\S]{0,200}error\.message/,
    );
  });

  it('splits results demo and live intro copy without weakening visibility', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const results = await loadModule('public/frontend/result-page.js');

    expect(publicUi.PUBLIC_RESULTS_PAGE_DEMO_INTRO_LEAD).toContain('展示用，不儲存');
    expect(publicUi.PUBLIC_RESULTS_PAGE_LIVE_INTRO_LEAD).not.toContain('展示用，不儲存');
    expect(publicUi.PUBLIC_RESULTS_PAGE_LIVE_INTRO_LEAD).toContain('區間化摘要');
    expect(results.RESULTS_PAGE_LIVE_INTRO_LEAD).toBe(
      publicUi.PUBLIC_RESULTS_PAGE_LIVE_INTRO_LEAD,
    );

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
  });

  it('keeps results loading and failure copy without counter leakage', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const results = await loadModule('public/frontend/result-page.js');

    expect(results.RESULT_PAGE_LOADING_MESSAGE).toBe('載入結果中，請稍候。');
    expect(results.RESULTS_LOAD_FAILURE_MESSAGE).toBe(
      '目前無法載入結果，請稍後再試。',
    );
    expect(results.RESULTS_COLLECTING_SUMMARY).toContain('不顯示');
    expect(results.RESULTS_COLLECTING_SUMMARY).not.toMatch(/raw_count|\d+%|第\s*\d+\s*名/i);

    expect(
      publicUi.resolvePublicErrorUserMessage(
        new Error('backend secret failure'),
        results.RESULTS_LOAD_FAILURE_MESSAGE,
        results.RESULT_PAGE_LOAD_USER_MESSAGES,
      ),
    ).toBe(results.RESULTS_LOAD_FAILURE_MESSAGE);
  });

  it('keeps quality_badge presentation and vote-by-index boundaries', async () => {
    const badge = await loadModule('public/frontend/quality-feedback-badge.js');
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
    expect(badge.QUALITY_FEEDBACK_BADGE_LABEL).toBe('回饋良好');
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: null })).toBe(false);
  });

  it('keeps participation modules free of backend echo and forbidden copy', async () => {
    for (const relativePath of PHASE_215_MODULES) {
      const source = stripJsComments(
        await readFile(join(process.cwd(), relativePath), 'utf8'),
      );
      if (relativePath !== 'public/frontend/public-mvp-ui.js') {
        expect(source, relativePath).not.toMatch(FORBIDDEN_BACKEND_ECHO);
      }
      expect(source, relativePath).not.toMatch(FORBIDDEN_ELIGIBILITY_OUTCOME);
      expect(source, relativePath).not.toMatch(FORBIDDEN_DEBUG_LEAKAGE);
    }
  });
});
