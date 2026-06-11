import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const REVIEWED_LIFECYCLE_FILES = [
  'public/frontend/poll-lifecycle-controls.js',
  'public/frontend/creator-flow-copy.js',
  'public/frontend/create-poll-page.js',
  'public/frontend/my-polls-page.js',
  'public/frontend/result-page.js',
];

const FORBIDDEN_OUTCOME_COPY =
  /你符合資格|你不符合資格|已投過票|可以投票|一定能投票|can_vote|age_passed|region_passed|trust_passed|role_passed/i;

const FORBIDDEN_INTERNAL_COPY =
  /option_id|vote_token|token_sha256|shard_id|session_id|www_session|\buser_id\b|raw_count|poll_option_vote_counters/i;

const FORBIDDEN_EXTRA_PROFILE_FIELDS =
  /gender|性別|exact birthday|精確生日|full date of birth|完整出生日|\baddress\b|GPS|geocode|precise location|精準位置|demographic breakdown/i;

function stripJsComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

async function loadLifecycleModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/poll-lifecycle-controls.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 130 creator lifecycle controls runtime review checkpoint', () => {
  it('posts cancel, close, and unpublish only to creator-owned lifecycle routes', async () => {
    const { postPollLifecycleTransition } = await loadLifecycleModule();
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

    const pollId = '22222222-2222-4222-8222-222222222222';
    await postPollLifecycleTransition(pollId, 'cancel', fetchImpl);
    await postPollLifecycleTransition(pollId, 'close', fetchImpl);
    await postPollLifecycleTransition(pollId, 'unpublish', fetchImpl);

    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      `/creator/polls/${pollId}/cancel`,
      expect.objectContaining({
        method: 'POST',
        credentials: 'same-origin',
      }),
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
    expect(JSON.stringify(fetchImpl.mock.calls)).not.toMatch(/X-User-Id|X-Display-Name/);
    expect(fetchImpl.mock.calls.every(([, init]) => !init?.body)).toBe(true);
  });

  it('limits lifecycle actions to collecting and post_lock states only', async () => {
    const { lifecycleActionsForState } = await loadLifecycleModule();

    expect(lifecycleActionsForState('collecting')).toEqual(['cancel', 'close']);
    expect(lifecycleActionsForState('post_lock')).toEqual(['unpublish']);
    expect(lifecycleActionsForState('revealed')).toEqual([]);
    expect(lifecycleActionsForState('locked')).toEqual([]);
    expect(lifecycleActionsForState('cancelled')).toEqual([]);
    expect(lifecycleActionsForState('unpublished')).toEqual([]);
  });

  it('maps lifecycle API failures to neutral copy without echoing backend payloads', async () => {
    const {
      messageForLifecycleTransitionFailure,
      postPollLifecycleTransition,
    } = await loadLifecycleModule();

    expect(
      messageForLifecycleTransitionFailure({
        errorCode: 'UNKNOWN_CODE',
        message: 'option_id leak and vote_token secret',
      }),
    ).toBe('目前無法更新問卷狀態，請稍後再試。');

    const fetchImpl = vi.fn(async () => ({
      ok: false,
      json: async () => ({
        error: 'INTERNAL',
        message: 'option_id leak and vote_token secret',
      }),
    }));

    await expect(
      postPollLifecycleTransition(
        '22222222-2222-4222-8222-222222222222',
        'close',
        fetchImpl,
      ),
    ).rejects.toThrow('目前無法更新問卷狀態，請稍後再試。');
    await expect(
      postPollLifecycleTransition(
        '22222222-2222-4222-8222-222222222222',
        'close',
        fetchImpl,
      ),
    ).rejects.not.toThrow(/option_id|vote_token|INTERNAL/i);
  });

  it('maps whitelisted lifecycle conflict codes to frontend-owned messages', async () => {
    const { messageForLifecycleTransitionFailure } = await loadLifecycleModule();

    const mappedMessages = [
      messageForLifecycleTransitionFailure({ errorCode: 'LOCKED_PERIOD_CONFLICT' }),
      messageForLifecycleTransitionFailure({ errorCode: 'ALREADY_CANCELLED' }),
      messageForLifecycleTransitionFailure({ errorCode: 'ALREADY_UNPUBLISHED' }),
      messageForLifecycleTransitionFailure({ errorCode: 'POLL_FORBIDDEN' }),
      messageForLifecycleTransitionFailure({ errorCode: 'AUTH_REQUIRED' }),
      messageForLifecycleTransitionFailure({
        errorCode: 'POLL_VALIDATION',
        message: 'Poll cannot be revealed before closes_at',
      }),
      messageForLifecycleTransitionFailure({
        errorCode: 'LIFECYCLE_CONFLICT',
        message: 'Creator delete is not allowed',
      }),
    ];

    for (const message of mappedMessages) {
      expect(message).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(message).not.toMatch(FORBIDDEN_OUTCOME_COPY);
      expect(message).not.toMatch(/INTERNAL|option_id|vote_token/i);
    }
  });

  it('reads only public_lifecycle_state from transition response bodies', async () => {
    const { nextLifecycleStateFromTransition } = await loadLifecycleModule();

    expect(
      nextLifecycleStateFromTransition('cancel', {
        public_lifecycle_state: 'cancelled',
        vote_count: 99,
        option_id: 'secret',
      }),
    ).toBe('cancelled');
    expect(
      nextLifecycleStateFromTransition('close', {
        public_lifecycle_state: 'revealed',
        shard_id: 3,
      }),
    ).toBe('revealed');
    expect(
      nextLifecycleStateFromTransition('unpublish', {
        public_lifecycle_state: 'unpublished',
      }),
    ).toBe('unpublished');
    expect(
      nextLifecycleStateFromTransition('close', { public_lifecycle_state: 'collecting' }),
    ).toBeNull();
  });

  it('keeps creator session bootstrap on localhost demo boundary with neutral failure copy', async () => {
    const { ensureCreatorSessionForLiveMode, LOCAL_DEMO_CREATOR_USER_ID } =
      await loadLifecycleModule();

    const remote401Fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
    });
    await expect(
      ensureCreatorSessionForLiveMode({
        fetchImpl: remote401Fetch,
        locationObject: { hostname: 'example.test' },
      }),
    ).rejects.toThrow('目前無法確認發起者身分，請稍後再試。');

    const localhostFetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 401 })
      .mockResolvedValueOnce({ ok: true });
    await ensureCreatorSessionForLiveMode({
      fetchImpl: localhostFetch,
      locationObject: { hostname: 'localhost' },
    });
    expect(localhostFetch).toHaveBeenNthCalledWith(2, '/creator/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: LOCAL_DEMO_CREATOR_USER_ID }),
      credentials: 'same-origin',
    });
  });

  it('keeps lifecycle runtime away from vote/profile/Reference Answer paths and observability sinks', async () => {
    const source = stripJsComments(
      await readFile(
        join(process.cwd(), 'public/frontend/poll-lifecycle-controls.js'),
        'utf8',
      ),
    );

    expect(source).toContain('postPollLifecycleTransition');
    expect(source).toContain('messageForLifecycleTransitionFailure');
    expect(source).not.toMatch(
      /\/users\/me|users\/me\/profile|vote-by-index|reference-answer|POST \/login\/session|localStorage|sessionStorage|indexedDB|navigator\.sendBeacon|console\.|analytics|apm\.|trace\./i,
    );
    expect(source).not.toMatch(/X-User-Id|X-Display-Name|option_index|option_id/);
  });

  it('mounts lifecycle controls only from creator flow integration surfaces', async () => {
    const createPoll = await readFile(
      join(process.cwd(), 'public/frontend/create-poll-page.js'),
      'utf8',
    );
    const myPolls = await readFile(
      join(process.cwd(), 'public/frontend/my-polls-page.js'),
      'utf8',
    );
    const results = await readFile(
      join(process.cwd(), 'public/frontend/result-page.js'),
      'utf8',
    );

    expect(createPoll).toContain('renderCreatorLifecycleActions');
    expect(createPoll).toContain("flowContext: 'create'");

    expect(myPolls).toContain('renderCreatorLifecycleActions');
    expect(myPolls).toContain('parseLiveApiMode');
    expect(myPolls).toContain('ensureCreatorSessionForLiveMode');
    expect(myPolls).toContain("flowContext: 'manage'");

    expect(results).toContain('mountCreatorLifecyclePanel');
    expect(results).toContain('parseCreatorManageMode');
    expect(results).toContain("flowContext: 'results'");
    expect(results).toContain('refreshResultPageDisplay');
    expect(results).toMatch(/if \(!parseCreatorManageMode\(search\)\)/);
  });

  it('does not expose managed-poll session storage helpers for creator authority', async () => {
    const lifecycleModule = await loadLifecycleModule();
    expect(lifecycleModule).not.toHaveProperty('writeManagedPoll');
    expect(lifecycleModule).not.toHaveProperty('readManagedPoll');
  });

  for (const relativePath of REVIEWED_LIFECYCLE_FILES) {
    it(`keeps reviewed lifecycle copy neutral in ${relativePath}`, async () => {
      const raw = await readFile(join(process.cwd(), relativePath), 'utf8');
      const source = relativePath.endsWith('.js') ? stripJsComments(raw) : raw;

      if (relativePath !== 'public/frontend/poll-lifecycle-controls.js') {
        expect(source, relativePath).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      }
      expect(source, relativePath).not.toMatch(FORBIDDEN_EXTRA_PROFILE_FIELDS);
      expect(source, relativePath).not.toMatch(FORBIDDEN_OUTCOME_COPY);
    });
  }

  it('keeps Phase 130 user-visible lifecycle messages free of forbidden internals', async () => {
    const {
      LIFECYCLE_TRANSITION_COPY,
      messageForLifecycleTransitionFailure,
    } = await loadLifecycleModule();

    const userVisibleMessages = [
      '目前無法更新問卷狀態，請稍後再試。',
      '目前無法確認發起者身分，請稍後再試。',
      '狀態已更新。結果顯示暫時無法重新載入，請重新整理頁面。',
      ...Object.values(LIFECYCLE_TRANSITION_COPY).flatMap((copy) => [
        copy.label,
        copy.confirm,
        copy.success,
      ]),
      messageForLifecycleTransitionFailure({ errorCode: 'LOCKED_PERIOD_CONFLICT' }),
      messageForLifecycleTransitionFailure({ errorCode: 'POLL_FORBIDDEN' }),
      messageForLifecycleTransitionFailure({
        errorCode: 'POLL_VALIDATION',
        message: 'Poll is not collecting responses',
      }),
    ];

    for (const message of userVisibleMessages) {
      expect(message).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(message).not.toMatch(FORBIDDEN_OUTCOME_COPY);
    }
  });
});
