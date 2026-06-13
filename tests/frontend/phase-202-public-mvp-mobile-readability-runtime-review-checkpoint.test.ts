import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PUBLIC_MVP_CSS = 'public/frontend/public-mvp.css';

const PHASE_201_RUNTIME_MODULES = [
  'public/frontend/explore-page.js',
  'public/frontend/vote-page.js',
  'public/frontend/result-page.js',
  'public/frontend/quality-feedback-badge.js',
] as const;

const FORBIDDEN_INTERNAL_COPY =
  /option_id|vote_token|token_sha256|shard_id|session_id|www_session|\buser_id\b|raw_count|poll_option_vote_counters|creator_token/i;

const FORBIDDEN_OUTCOME_COPY =
  /你符合資格|你不符合資格|已投過票|可以投票|一定能投票|can_vote|age_passed|region_passed/i;

const FORBIDDEN_STORAGE =
  /localStorage|sessionStorage|document\.cookie|Set-Cookie/i;

const FORBIDDEN_OBSERVABILITY =
  /console\.(log|info|warn|error|debug)|analytics|datadog|sentry|apm|trackEvent|gtag\(/i;

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 202 public MVP mobile readability runtime review checkpoint', () => {
  it('documents Phase 202 review checkpoint in README', async () => {
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');
    expect(readme).toContain('Phase 202');
    expect(readme).toContain(
      'docs/www-project-phase-202-public-mvp-mobile-readability-runtime-review-checkpoint-v1.md',
    );
  });

  it('keeps vote.html change limited to vote-page class on main', async () => {
    const voteHtml = await readFile(join(process.cwd(), 'public/vote.html'), 'utf8');
    expect(voteHtml).toContain(
      '<main id="main-content" class="mvp-page mvp-shell vote-page">',
    );
    expect(voteHtml).not.toContain('Phase 201');
    expect(voteHtml).not.toContain('Phase 202');
  });

  it('keeps results.html change limited to results-page class and demo intro class', async () => {
    const resultsHtml = await readFile(join(process.cwd(), 'public/results.html'), 'utf8');
    expect(resultsHtml).toContain(
      '<main id="main-content" class="mvp-page mvp-shell results-page">',
    );
    expect(resultsHtml).toContain(
      '<p class="mvp-meta results-page-demo-intro" id="results-page-demo-intro">',
    );
    expect(resultsHtml).not.toMatch(/results-page-demo-intro[\s\S]*style="/);
    expect(resultsHtml).not.toContain('Phase 201');
    expect(resultsHtml).not.toContain('Phase 202');
  });

  it('keeps explore.html on pre-existing explore-page class without Phase 201 markup churn', async () => {
    const exploreHtml = await readFile(join(process.cwd(), 'public/explore.html'), 'utf8');
    expect(exploreHtml).toContain('class="mvp-page explore-page explore-feed"');
    expect(exploreHtml).not.toContain('Phase 201');
    expect(exploreHtml).not.toContain('Phase 202');
  });

  it('keeps Phase 201 CSS scoped to participation page classes and layout selectors', async () => {
    const css = await readFile(join(process.cwd(), PUBLIC_MVP_CSS), 'utf8');
    const phase201Start = css.indexOf('Phase 201');
    const phase201Css = css.slice(phase201Start);

    expect(phase201Css).toContain('.explore-page #explore-status');
    expect(phase201Css).toContain('.explore-page #explore-load-more');
    expect(phase201Css).toContain('.vote-page #poll-title');
    expect(phase201Css).toContain('.results-page .results-page-demo-intro');
    expect(phase201Css).toMatch(/@media \(max-width: 640px\)/);
    expect(phase201Css).not.toMatch(/\bfetch\b|addEventListener|localStorage|sessionStorage/);
    expect(phase201Css).not.toMatch(FORBIDDEN_OBSERVABILITY);
    expect(phase201Css).not.toMatch(FORBIDDEN_INTERNAL_COPY);
    expect(phase201Css).not.toMatch(FORBIDDEN_OUTCOME_COPY);
  });

  it('does not mark Phase 201 participation runtime modules with Phase 201 or Phase 202 changes', async () => {
    for (const relativePath of PHASE_201_RUNTIME_MODULES) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 201');
      expect(source, relativePath).not.toContain('Phase 202');
    }
  });

  it('keeps result-page.js visibility runtime and result-page.js filename convention', async () => {
    const resultSource = await readFile(
      join(process.cwd(), 'public/frontend/result-page.js'),
      'utf8',
    );

    expect(resultSource).toContain('bootstrapResultPage');
    expect(resultSource).toContain('renderResultDisplay');
    expect(resultSource).toContain('loadResultDisplay');
    expect(resultSource).toMatch(/fetchImpl\(`\/polls\/\$\{encodeURIComponent\(pollId\)\}\/results`/);
    await expect(
      readFile(join(process.cwd(), 'public/frontend/results-page.js'), 'utf8'),
    ).rejects.toThrow();
  });

  it('keeps quality_badge presentation unchanged after Phase 201', async () => {
    const badge = await loadModule('public/frontend/quality-feedback-badge.js');
    const badgeSource = await readFile(
      join(process.cwd(), 'public/frontend/quality-feedback-badge.js'),
      'utf8',
    );

    expect(badge.QUALITY_FEEDBACK_BADGE_LABEL).toBe('回饋良好');
    expect(badgeSource).not.toMatch(
      /tooltip|title\s*=|aria-describedby|debug|score|rank|ranking|recommend|personaliz|trust|governance/i,
    );
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
  });

  it('keeps vote-by-index body unchanged and eligibility-before-option-resolve boundary', async () => {
    const votePage = await loadModule('public/frontend/vote-page.js');
    const voteSource = await readFile(
      join(process.cwd(), 'public/frontend/vote-page.js'),
      'utf8',
    );
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
    expect(voteSource).toContain('submitVoteByIndex');
    expect(voteSource).not.toMatch(FORBIDDEN_STORAGE);
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
    expect(repository).not.toContain('Phase 201');
    expect(repository).not.toContain('Phase 202');
  });

  it('keeps explore feed runtime free of client storage and forbidden copy', async () => {
    const exploreSource = await readFile(
      join(process.cwd(), 'public/frontend/explore-page.js'),
      'utf8',
    );

    expect(exploreSource).toContain('fetchExploreFeedPage');
    expect(exploreSource).toContain('EXPLORE_FEED_PATH');
    expect(exploreSource).toContain('await fetchImpl(');
    expect(exploreSource).not.toMatch(FORBIDDEN_STORAGE);
    expect(exploreSource).not.toMatch(FORBIDDEN_INTERNAL_COPY);
    expect(exploreSource).not.toMatch(FORBIDDEN_OUTCOME_COPY);
  });
});
