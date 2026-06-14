import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const MY_POLLS_HTML_SHELLS = ['public/my-polls.html'];

const PROTECTED_BACKEND_PATHS = [
  'src/http/creator-session-routes.ts',
  'src/http/creator-poll-routes.ts',
  'src/http/creator-auth.ts',
  'src/polls/lifecycle-transition.ts',
  'src/polls/repository.ts',
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
] as const;

const FORBIDDEN_LEAKAGE_COPY =
  /option_id|vote_token|token_sha256|shard_id|session_id|www_session|\buser_id\b|raw_count|poll_option_vote_counters|creator_token|error\.message|JSON\.stringify\(error/i;

const FORBIDDEN_OUTCOME_COPY =
  /你符合資格|你不符合資格|已投過票|可以投票|一定能投票|can_vote|age_passed|region_passed|trust_passed|role_passed/i;

const FORBIDDEN_OBSERVABILITY =
  /console\.(log|info|warn|error|debug)|analytics|datadog|sentry|apm|trackEvent|gtag\(/i;

const COUNTER_PREVIEW_COPY =
  /結果預覽|mvp-result-preview|vote_count|(?<!不顯示)票數|百分比|熱門|趨勢/i;

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

function stripJsComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 166 public my-polls creator lifecycle UX review checkpoint', () => {
  it('keeps static demo dashboard and live owned-list separated via parseLiveApiMode', async () => {
    const { parseLiveApiMode } = await loadModule('public/frontend/public-mvp-demo.js');
    const source = await readFile(
      join(process.cwd(), 'public/frontend/my-polls-page.js'),
      'utf8',
    );
    const html = await readFile(join(process.cwd(), 'public/my-polls.html'), 'utf8');

    expect(parseLiveApiMode('')).toBe(false);
    expect(parseLiveApiMode('?nav=logged-in-mock')).toBe(false);
    expect(parseLiveApiMode('?live=1')).toBe(true);

    expect(html).toContain('data-mock-dashboard="true"');
    expect(source).toContain('data-live-owned-list');
    expect(source).toContain('aria-hidden');
    expect(source).toMatch(/if \(useLiveApi\) \{[\s\S]*mountLiveCreatorManagePanel/);
    expect(source).toContain('showDemoOnlyFeedback');
    expect(html).not.toContain('data-live-owned-list');
  });

  it('keeps live path on creator_session only via prepareMyPollsLiveSession and GET /creator/polls', async () => {
    const { prepareMyPollsLiveSession, fetchCreatorOwnedPolls } =
      await loadModule('public/frontend/my-polls-page.js');
    const source = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/my-polls-page.js'), 'utf8'),
    );

    const sessionFetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ polls: [safeOwnedPoll] }),
      });
    await prepareMyPollsLiveSession({
      fetchImpl: sessionFetch,
      locationObject: { hostname: 'localhost' },
    });
    expect(sessionFetch).toHaveBeenCalledWith('/creator/session', {
      method: 'GET',
      credentials: 'same-origin',
    });

    const listFetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ polls: [safeOwnedPoll] }),
    }));
    const polls = await fetchCreatorOwnedPolls(listFetch);
    expect(polls).toHaveLength(1);
    expect(listFetch).toHaveBeenCalledWith('/creator/polls', {
      method: 'GET',
      credentials: 'same-origin',
    });

    expect(source).toContain('ensureCreatorSessionForLiveMode');
    expect(source).not.toMatch(/POST\s*\/login\/session|GET\s*\/users\/me/);
    expect(source).not.toMatch(/X-User-Id|X-Display-Name/i);
  });

  it('keeps creator_session as local/demo/test flow and not production public identity', async () => {
    const source = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/my-polls-page.js'), 'utf8'),
    );
    const credentialVerifierTest = await readFile(
      join(process.cwd(), 'tests/auth/production-credential-verifier.test.ts'),
      'utf8',
    );
    const html = await readFile(join(process.cwd(), 'public/my-polls.html'), 'utf8');

    expect(credentialVerifierTest).toContain('creator_session');
    expect(source).not.toContain('creator_session');
    expect(html).toContain('?live=1');
    expect(html).toContain('即時模式');
    expect(html).not.toContain('creator_session');
  });

  it('accepts only display-safe owned poll payloads without counters or internal tokens', async () => {
    const { isCreatorOwnedPollSafe, CREATOR_OWNED_POLL_ALLOWED_KEYS } =
      await loadModule('public/frontend/my-polls-page.js');

    expect(isCreatorOwnedPollSafe(safeOwnedPoll)).toBe(true);
    expect(Object.keys(safeOwnedPoll).sort()).toEqual(
      [...CREATOR_OWNED_POLL_ALLOWED_KEYS].sort(),
    );
    expect(isCreatorOwnedPollSafe({ ...safeOwnedPoll, vote_count: 8 })).toBe(false);
    expect(isCreatorOwnedPollSafe({ ...safeOwnedPoll, option_id: 'secret' })).toBe(false);
    expect(isCreatorOwnedPollSafe({ ...safeOwnedPoll, vote_token: 'secret' })).toBe(false);
    expect(isCreatorOwnedPollSafe({ ...safeOwnedPoll, shard_id: 3 })).toBe(false);
  });

  it('limits lifecycle actions to cancel, close, and unpublish only', async () => {
    const { lifecycleActionsForState, postPollLifecycleTransition } =
      await loadModule('public/frontend/poll-lifecycle-controls.js');
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

    expect(lifecycleActionsForState('collecting')).toEqual(['cancel', 'close']);
    expect(lifecycleActionsForState('post_lock')).toEqual(['unpublish']);
    expect(lifecycleActionsForState('revealed')).toEqual([]);
    expect(lifecycleActionsForState('locked')).toEqual([]);
    expect(lifecycleActionsForState('cancelled')).toEqual([]);
    expect(lifecycleActionsForState('unpublished')).toEqual([]);

    const pollId = safeOwnedPoll.poll_id;
    await postPollLifecycleTransition(pollId, 'cancel', fetchImpl);
    await postPollLifecycleTransition(pollId, 'close', fetchImpl);
    await postPollLifecycleTransition(pollId, 'unpublish', fetchImpl);
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

  it('keeps creator results view on existing visibility route via renderCreatorManageLinks', async () => {
    const { renderCreatorManageLinks } = await loadModule(
      'public/frontend/creator-flow-copy.js',
    );

    function createElement(tagName: string) {
      return {
        tagName: tagName.toUpperCase(),
        ownerDocument: documentObject,
        textContent: '',
        href: '',
        children: [] as ReturnType<typeof createElement>[],
        className: '',
        append(child: ReturnType<typeof createElement>) {
          this.children.push(child);
        },
      };
    }
    let documentObject: { createElement(tagName: string): ReturnType<typeof createElement> };
    documentObject = { createElement };
    const host = createElement('section');

    renderCreatorManageLinks(host as never, {
      pollId: safeOwnedPoll.poll_id,
      locationObject: { origin: 'https://example.test' },
    });

    const serialized = JSON.stringify(host);
    expect(serialized).toContain(`/vote/${safeOwnedPoll.poll_id}`);
    expect(serialized).toContain(`/results/${safeOwnedPoll.poll_id}?creator=1`);
    expect(serialized).toContain('/my-polls?live=1');
    expect(serialized).not.toMatch(FORBIDDEN_LEAKAGE_COPY);
  });

  it('maps empty, load, and session failures to neutral copy without echoing backend payloads', async () => {
    const {
      MY_POLLS_LOAD_FAILURE_MESSAGE,
      MY_POLLS_SIGN_IN_REQUIRED_MESSAGE,
      prepareMyPollsLiveSession,
      fetchCreatorOwnedPolls,
      isMyPollsSignInRequiredError,
    } = await loadModule('public/frontend/my-polls-page.js');
    const { CREATOR_SESSION_FAILURE } = await loadModule(
      'public/frontend/poll-lifecycle-controls.js',
    );

    await expect(
      prepareMyPollsLiveSession({
        fetchImpl: vi.fn().mockResolvedValue({ ok: false, status: 401 }),
        locationObject: { hostname: 'example.test' },
      }),
    ).rejects.toThrow(MY_POLLS_SIGN_IN_REQUIRED_MESSAGE);

    const failingFetch = vi.fn(async () => ({
      ok: false,
      status: 500,
      json: async () => ({
        error: 'INTERNAL',
        message: 'option_id leak and vote_token secret',
        stack: 'Error at secret.ts:42',
      }),
    }));
    await expect(fetchCreatorOwnedPolls(failingFetch)).rejects.toThrow(
      MY_POLLS_LOAD_FAILURE_MESSAGE,
    );
    await expect(fetchCreatorOwnedPolls(failingFetch)).rejects.not.toThrow(
      /option_id|vote_token|INTERNAL|secret\.ts/i,
    );

    const signInError = new Error(MY_POLLS_SIGN_IN_REQUIRED_MESSAGE);
    signInError.name = 'MyPollsSignInRequiredError';
    expect(isMyPollsSignInRequiredError(signInError)).toBe(true);
    expect(isMyPollsSignInRequiredError(new Error('foreign INTERNAL stack'))).toBe(
      false,
    );

    expect(CREATOR_SESSION_FAILURE).toBe('目前無法確認發起者身分，請稍後再試。');
    expect(MY_POLLS_LOAD_FAILURE_MESSAGE).not.toMatch(FORBIDDEN_LEAKAGE_COPY);
  });

  it('keeps policy-ui-placeholders.js and HELP_COPY as independent policy-panel layer', async () => {
    const myPollsSource = await readFile(
      join(process.cwd(), 'public/frontend/my-polls-page.js'),
      'utf8',
    );
    const creatorFlowSource = await readFile(
      join(process.cwd(), 'public/frontend/creator-flow-copy.js'),
      'utf8',
    );
    const policySource = await readFile(
      join(process.cwd(), 'public/frontend/policy-ui-placeholders.js'),
      'utf8',
    );

    expect(myPollsSource).not.toContain('HELP_COPY');
    expect(myPollsSource).not.toContain('policy-ui-placeholders');
    expect(creatorFlowSource).toContain("from './policy-ui-placeholders.js'");
    expect(creatorFlowSource).toContain('POLICY_UI_COPY');
    expect(creatorFlowSource).not.toContain('HELP_COPY');
    expect(policySource).toContain('HELP_COPY');
  });

  it('does not mark protected backend/auth/schema paths with Phase 166 changes', async () => {
    for (const relativePath of PROTECTED_BACKEND_PATHS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8').catch(() => '');
      if (!source) {
        continue;
      }
      expect(source, relativePath).not.toContain('Phase 166');
    }
  });

  it('keeps my-polls runtime modules free of linkage, counter previews, and observability hooks', async () => {
    for (const relativePath of [
      'public/frontend/my-polls-page.js',
      'public/frontend/creator-flow-copy.js',
    ]) {
      const source = stripJsComments(
        await readFile(join(process.cwd(), relativePath), 'utf8'),
      );
      expect(source, relativePath).not.toMatch(FORBIDDEN_LEAKAGE_COPY);
      expect(source, relativePath).not.toMatch(FORBIDDEN_OBSERVABILITY);
      expect(source, relativePath).not.toMatch(FORBIDDEN_OUTCOME_COPY);
      if (relativePath === 'public/frontend/my-polls-page.js') {
        expect(source, relativePath).not.toMatch(COUNTER_PREVIEW_COPY);
      }
    }

    for (const relativePath of MY_POLLS_HTML_SHELLS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 166');
    }
  });

  it('keeps vote-by-index body unchanged and Official Vote transaction order unchanged', async () => {
    const votePage = await loadModule('public/frontend/vote-page.js');
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
});
