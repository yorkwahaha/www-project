import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const CREATOR_FLOW_SURFACES = [
  'public/frontend/create-poll-page.js',
  'public/frontend/my-polls-page.js',
  'public/frontend/poll-lifecycle-controls.js',
  'public/frontend/result-page.js',
  'public/frontend/creator-flow-copy.js',
];

const FORBIDDEN_OUTCOME_COPY =
  /你投過|你尚未投票|你符合資格|你不符合資格|已投過票|選擇了|投給哪個|can_vote|age_passed|region_passed|trust_passed|role_passed/i;

const FORBIDDEN_INTERNAL_COPY =
  /option_id|vote_token|token_sha256|shard_id|session_id|www_session|\buser_id\b|raw_count|poll_option_vote_counters/i;

const FORBIDDEN_EXTRA_PROFILE_FIELDS =
  /gender|性別|exact birthday|精確生日|full date of birth|完整出生日|\baddress\b|GPS|geocode|precise location|精準位置|demographic breakdown/i;

const CREATE_POLL_ALLOWED_BODY_KEYS = [
  'title',
  'description',
  'options',
  'category',
  'eligible_rule_id',
  'closes_at',
  'publish',
] as const;

function stripJsComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 132 creator flow milestone review checkpoint', () => {
  it('keeps /polls/new static showcase separate from live creator flow', async () => {
    const { parseLiveApiMode } = await loadModule('public/frontend/public-mvp-demo.js');
    const { submitCreatePollDemo } = await loadModule('public/frontend/create-poll-page.js');
    const fetchImpl = vi.fn();

    expect(parseLiveApiMode('')).toBe(false);
    expect(parseLiveApiMode('?live=1')).toBe(true);

    const created = submitCreatePollDemo({
      formValues: {
        title: '示範問卷',
        description: '說明',
        options: ['甲', '乙'],
      },
    });
    expect(created.poll_id).toBe('demo');
    expect(created.status).toBe('demo_static');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('keeps live create on creator_session boundary with poll-definition-only payload', async () => {
    const { submitCreatePoll } = await loadModule('public/frontend/create-poll-page.js');
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        poll_id: '22222222-2222-4222-8222-222222222222',
        public_lifecycle_state: 'collecting',
      }),
    }));

    await submitCreatePoll({
      formValues: {
        title: '午餐偏好',
        description: '說明',
        options: ['甲', '乙'],
      },
      fetchImpl,
      now: () => new Date('2026-05-31T12:00:00.000Z'),
    });

    expect(fetchImpl).toHaveBeenCalledWith('/creator/polls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: expect.any(String),
    });
    const body = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body));
    expect(Object.keys(body).sort()).toEqual([...CREATE_POLL_ALLOWED_BODY_KEYS].sort());
    expect(JSON.stringify(fetchImpl.mock.calls)).not.toMatch(/X-User-Id|X-Display-Name/);
  });

  it('keeps /my-polls on creator-safe summary with neutral failure copy', async () => {
    const {
      isCreatorOwnedPollSafe,
      CREATOR_OWNED_POLL_ALLOWED_KEYS,
      MY_POLLS_LOAD_FAILURE_MESSAGE,
      fetchCreatorOwnedPolls,
    } = await loadModule('public/frontend/my-polls-page.js');

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

    expect(isCreatorOwnedPollSafe(safeOwnedPoll)).toBe(true);
    expect(Object.keys(safeOwnedPoll).sort()).toEqual(
      [...CREATOR_OWNED_POLL_ALLOWED_KEYS].sort(),
    );
    expect(isCreatorOwnedPollSafe({ ...safeOwnedPoll, vote_count: 8 })).toBe(false);

    const failingFetch = vi.fn(async () => ({
      ok: false,
      status: 500,
      json: async () => ({
        error: 'INTERNAL',
        message: 'option_id leak and vote_token secret',
      }),
    }));
    await expect(fetchCreatorOwnedPolls(failingFetch)).rejects.toThrow(
      MY_POLLS_LOAD_FAILURE_MESSAGE,
    );
    await expect(fetchCreatorOwnedPolls(failingFetch)).rejects.not.toThrow(
      /option_id|vote_token/i,
    );
  });

  it('keeps lifecycle controls on creator routes and creator mounts only', async () => {
    const { lifecycleActionsForState, postPollLifecycleTransition } = await loadModule(
      'public/frontend/poll-lifecycle-controls.js',
    );
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
    expect(lifecycleActionsForState('collecting')).toEqual(['cancel', 'close']);
    expect(lifecycleActionsForState('post_lock')).toEqual(['unpublish']);

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
    expect(myPolls).toContain('renderCreatorLifecycleActions');
    expect(results).toContain('mountCreatorLifecyclePanel');
    expect(results).toMatch(/if \(!parseCreatorManageMode\(search\)\)/);
  });

  it('keeps /results/:id?creator=1 on public results API with creator panel gating only', async () => {
    const { parseCreatorManageMode } = await loadModule(
      'public/frontend/poll-lifecycle-controls.js',
    );
    const { loadResultDisplay } = await loadModule('public/frontend/result-page.js');
    const pollId = '22222222-2222-4222-8222-222222222222';
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        poll_id: pollId,
        public_lifecycle_state: 'revealed',
        display_mode: 'rounded_with_bucketed_votes',
        total_votes_display: '100–499',
        options: [{ display_label: '選項甲', display_percentage: '約 43%' }],
      }),
    }));

    expect(parseCreatorManageMode('?creator=1')).toBe(true);
    expect(parseCreatorManageMode('')).toBe(false);

    await loadResultDisplay({ pollId, fetchImpl });
    expect(fetchImpl).toHaveBeenCalledWith(`/polls/${pollId}/results`, {
      method: 'GET',
      credentials: 'omit',
      cache: 'no-store',
    });
    expect(JSON.stringify(fetchImpl.mock.calls)).not.toMatch(
      /\/creator\/polls|X-User-Id|X-Display-Name/i,
    );

    const resultPageSource = await readFile(
      join(process.cwd(), 'public/frontend/result-page.js'),
      'utf8',
    );
    expect(resultPageSource).not.toMatch(/\/creator\/polls\/[^`'"]+\/results/);
  });

  it('keeps creator flow away from ownership storage and vote/profile/Reference Answer paths', async () => {
    for (const relativePath of CREATOR_FLOW_SURFACES) {
      const source = stripJsComments(
        await readFile(join(process.cwd(), relativePath), 'utf8'),
      );

      expect(source, relativePath).not.toMatch(
        /localStorage|sessionStorage|indexedDB|writeManagedPoll|readManagedPoll/i,
      );
      if (relativePath !== 'public/frontend/poll-lifecycle-controls.js') {
        expect(source, relativePath).not.toMatch(/X-User-Id|X-Display-Name/i);
      }
      expect(source, relativePath).not.toMatch(
        /vote-by-index|reference-answer|navigator\.sendBeacon|console\.|analytics|apm\.|trace\./i,
      );
    }

    const lifecycleModule = await loadModule('public/frontend/poll-lifecycle-controls.js');
    expect(lifecycleModule).not.toHaveProperty('writeManagedPoll');
    expect(lifecycleModule).not.toHaveProperty('readManagedPoll');
  });

  for (const relativePath of CREATOR_FLOW_SURFACES) {
    it(`keeps reviewed creator-flow copy neutral in ${relativePath}`, async () => {
      const raw = await readFile(join(process.cwd(), relativePath), 'utf8');
      const source = relativePath.endsWith('.js') ? stripJsComments(raw) : raw;

      expect(source, relativePath).not.toMatch(FORBIDDEN_OUTCOME_COPY);
      expect(source, relativePath).not.toMatch(FORBIDDEN_EXTRA_PROFILE_FIELDS);
      if (
        relativePath !== 'public/frontend/result-page.js' &&
        relativePath !== 'public/frontend/poll-lifecycle-controls.js'
      ) {
        expect(source, relativePath).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      }
    });
  }

  it('keeps milestone user-visible creator messages free of forbidden internals', async () => {
    const myPolls = await loadModule('public/frontend/my-polls-page.js');
    const lifecycle = await loadModule('public/frontend/poll-lifecycle-controls.js');
    const resultPage = await loadModule('public/frontend/result-page.js');

    const userVisibleMessages = [
      '目前無法建立問卷，請稍後再試。',
      '目前無法確認發起者身分，請稍後再試。',
      myPolls.MY_POLLS_SIGN_IN_REQUIRED_MESSAGE,
      myPolls.MY_POLLS_LOAD_FAILURE_MESSAGE,
      myPolls.MY_POLLS_EMPTY_MESSAGE,
      lifecycle.messageForLifecycleTransitionFailure({ errorCode: 'UNKNOWN_CODE' }),
      resultPage.RESULTS_LOAD_FAILURE_MESSAGE,
      resultPage.RESULT_DISPLAY_REFRESH_FAILURE_MESSAGE,
    ];

    for (const message of userVisibleMessages) {
      expect(message).not.toMatch(FORBIDDEN_INTERNAL_COPY);
      expect(message).not.toMatch(FORBIDDEN_OUTCOME_COPY);
    }
  });
});
