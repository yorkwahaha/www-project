import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PUBLIC_MVP_CSS = 'public/frontend/public-mvp.css';

const PROTECTED_BACKEND_PATHS = [
  'src/http/creator-session-routes.ts',
  'src/http/creator-poll-routes.ts',
  'src/polls/lifecycle-transition.ts',
  'src/polls/repository.ts',
  'src/http/official-vote-routes.ts',
  'src/auth/user-auth-resolver.ts',
  'migrations',
];

const CREATOR_OWNED_POLL_ALLOWED_KEYS = [
  'poll_id',
  'title',
  'category',
  'public_lifecycle_state',
  'closes_at',
  'revealed_at',
  'public_lock_ends_at',
  'cancelled_at',
  'unpublished_at',
];

const FORBIDDEN_INTERNAL_COPY =
  /option_id|vote_token|token_sha256|shard_id|session_id|www_session|\buser_id\b|raw_count|poll_option_vote_counters|creator_token/i;

const FORBIDDEN_OUTCOME_COPY =
  /你符合資格|你不符合資格|已投過票|可以投票|一定能投票|can_vote|age_passed|region_passed/i;

const FORBIDDEN_STORAGE = /localStorage|sessionStorage|document\.cookie|Set-Cookie/i;

const FORBIDDEN_OBSERVABILITY =
  /console\.(log|info|warn|error|debug)|analytics|datadog|sentry|apm|trackEvent|gtag\(/i;

const safeOwnedPoll = {
  poll_id: '22222222-2222-4222-8222-222222222222',
  title: '午餐偏好',
  category: 'general',
  public_lifecycle_state: 'collecting',
  closes_at: '2026-06-07T12:00:00.000Z',
  revealed_at: null,
  public_lock_ends_at: null,
  cancelled_at: null,
  unpublished_at: null,
};

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 211 my-polls live action area runtime review checkpoint', () => {
  it('documents Phase 211 review checkpoint in README', async () => {
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');
    expect(readme).toContain('Phase 211');
    expect(readme).toContain(
      'docs/www-project-phase-211-my-polls-live-action-area-runtime-review-checkpoint-v1.md',
    );
  });

  it('keeps my-polls.html change limited to my-polls-page class on main', async () => {
    const myPollsHtml = await readFile(join(process.cwd(), 'public/my-polls.html'), 'utf8');
    expect(myPollsHtml).toContain(
      '<main id="main-content" class="mvp-page my-polls-page">',
    );
    expect(myPollsHtml).toContain('data-mock-dashboard="true"');
    expect(myPollsHtml).toContain('class="mvp-dash-table"');
    expect(myPollsHtml).not.toContain('Phase 210');
    expect(myPollsHtml).not.toContain('Phase 211');
  });

  it('keeps Phase 210 CSS scoped to my-polls-page and action selectors', async () => {
    const css = await readFile(join(process.cwd(), PUBLIC_MVP_CSS), 'utf8');
    const phase210Start = css.indexOf('Phase 210');
    const phase210Css = css.slice(phase210Start);

    expect(phase210Css).toContain('.my-polls-page #creator-live-manage');
    expect(phase210Css).toContain('.my-polls-page .mvp-creator-live-poll');
    expect(phase210Css).toContain('.my-polls-page .mvp-creator-lifecycle-toolbar');
    expect(phase210Css).toContain('.my-polls-page .mvp-dash-table td:last-child .mvp-btn');
    expect(phase210Css).toContain('min-height: var(--mvp-tap-min)');
    expect(phase210Css).toMatch(/@media \(max-width: 640px\)/);
    expect(phase210Css).not.toMatch(/\bfetch\b|addEventListener|localStorage|sessionStorage/);
    expect(phase210Css).not.toMatch(FORBIDDEN_OBSERVABILITY);
    expect(phase210Css).not.toMatch(FORBIDDEN_INTERNAL_COPY);
    expect(phase210Css).not.toMatch(FORBIDDEN_OUTCOME_COPY);
  });

  it('does not mark Phase 210 my-polls runtime module with Phase 210 or Phase 211 changes', async () => {
    const myPollsSource = await readFile(
      join(process.cwd(), 'public/frontend/my-polls-page.js'),
      'utf8',
    );
    expect(myPollsSource).not.toContain('Phase 210');
    expect(myPollsSource).not.toContain('Phase 211');
  });

  it('keeps prepareMyPollsLiveSession on GET /creator/session after Phase 210', async () => {
    const myPolls = await loadModule('public/frontend/my-polls-page.js');
    const myPollsSource = await readFile(
      join(process.cwd(), 'public/frontend/my-polls-page.js'),
      'utf8',
    );
    const fetchImpl = vi.fn(async () => ({ ok: true }));

    await myPolls.prepareMyPollsLiveSession({
      fetchImpl,
      locationObject: { hostname: 'localhost' },
    });

    expect(fetchImpl).toHaveBeenCalledWith('/creator/session', {
      method: 'GET',
      credentials: 'same-origin',
    });
    expect(myPollsSource).toContain('ensureCreatorSessionForLiveMode');
    expect(myPollsSource).toMatch(/if \(useLiveApi\) \{[\s\S]*mountLiveCreatorManagePanel/);
    expect(myPollsSource).not.toMatch(FORBIDDEN_STORAGE);
  });

  it('keeps fetchCreatorOwnedPolls on GET /creator/polls with CREATOR_OWNED_POLL_ALLOWED_KEYS', async () => {
    const myPolls = await loadModule('public/frontend/my-polls-page.js');
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({ polls: [safeOwnedPoll] }),
    }));

    const polls = await myPolls.fetchCreatorOwnedPolls(fetchImpl);
    expect(fetchImpl).toHaveBeenCalledWith('/creator/polls', {
      method: 'GET',
      credentials: 'same-origin',
    });
    expect(polls).toHaveLength(1);
    expect(Object.keys(polls[0]).sort()).toEqual([...CREATOR_OWNED_POLL_ALLOWED_KEYS].sort());
    expect(myPolls.isCreatorOwnedPollSafe({ ...safeOwnedPoll, vote_count: 3 })).toBe(false);
    expect(myPolls.isCreatorOwnedPollSafe({ ...safeOwnedPoll, option_id: 'secret' })).toBe(false);
  });

  it('keeps lifecycle APIs limited to cancel, close, and unpublish after Phase 210', async () => {
    const lifecycle = await loadModule('public/frontend/poll-lifecycle-controls.js');
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ public_lifecycle_state: 'cancelled' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ public_lifecycle_state: 'revealed' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ public_lifecycle_state: 'unpublished' }),
      });

    expect(lifecycle.lifecycleActionsForState('collecting')).toEqual(['cancel', 'close']);
    expect(lifecycle.lifecycleActionsForState('post_lock')).toEqual(['unpublish']);
    expect(lifecycle.lifecycleActionsForState('revealed')).toEqual([]);
    expect(lifecycle.lifecycleActionsForState('locked')).toEqual([]);

    const pollId = safeOwnedPoll.poll_id;
    await lifecycle.postPollLifecycleTransition(pollId, 'cancel', fetchImpl);
    await lifecycle.postPollLifecycleTransition(pollId, 'close', fetchImpl);
    await lifecycle.postPollLifecycleTransition(pollId, 'unpublish', fetchImpl);

    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      `/creator/polls/${pollId}/cancel`,
      expect.objectContaining({ method: 'POST', credentials: 'same-origin' }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      `/creator/polls/${pollId}/close`,
      expect.objectContaining({ method: 'POST' }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      3,
      `/creator/polls/${pollId}/unpublish`,
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('keeps quality_badge presentation unchanged after Phase 210', async () => {
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
    expect(repository).not.toContain('Phase 210');
    expect(repository).not.toContain('Phase 211');
  });

  it('keeps protected backend paths free of Phase 210/211 markers', async () => {
    for (const relativePath of PROTECTED_BACKEND_PATHS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8').catch(() => '');
      if (!source) {
        continue;
      }
      expect(source, relativePath).not.toContain('Phase 210');
      expect(source, relativePath).not.toContain('Phase 211');
    }
  });
});
