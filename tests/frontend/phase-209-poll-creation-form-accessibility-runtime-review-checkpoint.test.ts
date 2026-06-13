import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PUBLIC_MVP_CSS = 'public/frontend/public-mvp.css';

const PROTECTED_BACKEND_PATHS = [
  'src/polls/repository.ts',
  'src/http/creator-poll-routes.ts',
  'src/http/official-vote-routes.ts',
  'src/auth/user-auth-resolver.ts',
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

describe('Phase 209 poll creation form accessibility runtime review checkpoint', () => {
  it('documents Phase 209 review checkpoint in README', async () => {
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');
    expect(readme).toContain('Phase 209');
    expect(readme).toContain(
      'docs/www-project-phase-209-poll-creation-form-accessibility-runtime-review-checkpoint-v1.md',
    );
  });

  it('keeps create-poll.html change limited to create-poll-page class on main', async () => {
    const createPollHtml = await readFile(join(process.cwd(), 'public/create-poll.html'), 'utf8');
    expect(createPollHtml).toContain(
      '<main id="main-content" class="mvp-page mvp-shell create-poll-page">',
    );
    expect(createPollHtml).toContain('id="create-poll-form"');
    expect(createPollHtml).toContain('id="create-poll-submit"');
    expect(createPollHtml).toContain('name="option"');
    expect(createPollHtml).not.toContain('Phase 208');
    expect(createPollHtml).not.toContain('Phase 209');
  });

  it('keeps Phase 208 CSS scoped to create-poll-page and form selectors', async () => {
    const css = await readFile(join(process.cwd(), PUBLIC_MVP_CSS), 'utf8');
    const phase208Start = css.indexOf('Phase 208');
    const phase208Css = css.slice(phase208Start);

    expect(phase208Css).toContain('.create-poll-page #create-poll-form');
    expect(phase208Css).toContain('.create-poll-page #create-poll-submit');
    expect(phase208Css).toContain('.create-poll-page #form-message');
    expect(phase208Css).toContain('.create-poll-page #success-panel');
    expect(phase208Css).toContain('min-height: var(--mvp-tap-min)');
    expect(phase208Css).toMatch(/@media \(max-width: 640px\)/);
    expect(phase208Css).not.toMatch(/\bfetch\b|addEventListener|localStorage|sessionStorage/);
    expect(phase208Css).not.toMatch(FORBIDDEN_OBSERVABILITY);
    expect(phase208Css).not.toMatch(FORBIDDEN_INTERNAL_COPY);
    expect(phase208Css).not.toMatch(FORBIDDEN_OUTCOME_COPY);
  });

  it('does not mark Phase 208 create-poll runtime module with Phase 208 or Phase 209 changes', async () => {
    const createPollSource = await readFile(
      join(process.cwd(), 'public/frontend/create-poll-page.js'),
      'utf8',
    );
    expect(createPollSource).not.toContain('Phase 208');
    expect(createPollSource).not.toContain('Phase 209');
  });

  it('keeps submitCreatePollDemo off creator APIs with demo poll id after Phase 208', async () => {
    const createPoll = await loadModule('public/frontend/create-poll-page.js');
    const createPollSource = await readFile(
      join(process.cwd(), 'public/frontend/create-poll-page.js'),
      'utf8',
    );

    const created = createPoll.submitCreatePollDemo({
      formValues: {
        title: '示範標題',
        description: '',
        options: ['A', 'B'],
      },
    });

    expect(created.poll_id).toBe('demo');
    expect(created.status).toBe('demo_static');
    expect(createPollSource).toContain('submitCreatePollDemo');
    expect(createPollSource).toMatch(
      /const created = useLiveApi[\s\S]*submitCreatePoll\([\s\S]*: submitCreatePollDemo/,
    );
    expect(createPollSource).toContain('parseLiveApiMode');
    expect(createPollSource).toContain('ensureCreatorSessionForLiveMode');
    expect(createPollSource).not.toMatch(FORBIDDEN_STORAGE);
  });

  it('keeps live POST /creator/polls boundary with poll-definition body after Phase 208', async () => {
    const createPoll = await loadModule('public/frontend/create-poll-page.js');
    const createPollSource = await readFile(
      join(process.cwd(), 'public/frontend/create-poll-page.js'),
      'utf8',
    );
    const fetchCalls: Array<{ url: string; init?: RequestInit }> = [];
    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      fetchCalls.push({ url: String(url), init });
      return {
        ok: true,
        status: 201,
        json: async () => ({
          poll_id: '11111111-1111-4111-8111-111111111111',
          status: 'collecting',
        }),
      };
    });

    await createPoll.submitCreatePoll({
      formValues: {
        title: '正式標題',
        description: '說明',
        options: ['是', '否'],
      },
      fetchImpl,
      now: () => new Date('2026-06-14T12:00:00.000Z'),
    });

    expect(fetchCalls).toHaveLength(1);
    expect(fetchCalls[0]?.url).toBe('/creator/polls');
    expect(fetchCalls[0]?.init?.method).toBe('POST');
    expect(fetchCalls[0]?.init?.credentials).toBe('same-origin');
    const body = JSON.parse(String(fetchCalls[0]?.init?.body));
    expect(body).toMatchObject({
      title: '正式標題',
      description: '說明',
      options: ['是', '否'],
      category: 'general',
      eligible_rule_id: null,
      publish: true,
    });
    expect(body).toHaveProperty('closes_at');
    expect(body).not.toHaveProperty('option_id');
    expect(body).not.toHaveProperty('option_index');
    expect(createPollSource).toContain("fetchImpl('/creator/polls'");
  });

  it('keeps quality_badge presentation unchanged after Phase 208', async () => {
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
    expect(repository).not.toContain('Phase 208');
    expect(repository).not.toContain('Phase 209');
  });

  it('keeps protected backend paths free of Phase 208/209 markers', async () => {
    for (const relativePath of PROTECTED_BACKEND_PATHS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8').catch(() => '');
      if (!source) {
        continue;
      }
      expect(source, relativePath).not.toContain('Phase 208');
      expect(source, relativePath).not.toContain('Phase 209');
    }
  });
});
