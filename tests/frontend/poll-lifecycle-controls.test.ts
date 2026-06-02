import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

async function loadModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/poll-lifecycle-controls.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

describe('poll lifecycle controls', () => {
  it('maps lifecycle API errors to Traditional Chinese messages', async () => {
    const { messageForLifecycleTransitionFailure } = await loadModule();
    expect(
      messageForLifecycleTransitionFailure({
        errorCode: 'LIFECYCLE_CONFLICT',
      }),
    ).toContain('無法執行');
    expect(
      messageForLifecycleTransitionFailure({
        errorCode: 'LOCKED_PERIOD_CONFLICT',
      }),
    ).toContain('鎖定期尚未結束');
    expect(
      messageForLifecycleTransitionFailure({
        errorCode: 'POLL_VALIDATION',
        message: 'Poll cannot be revealed before closes_at',
      }),
    ).toContain('尚未到預定截止時間');
  });

  it('posts cancel/close/unpublish to existing poll routes', async () => {
    const { postPollLifecycleTransition, LOCAL_DEMO_CREATOR_USER_ID } =
      await loadModule();
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          public_lifecycle_state: 'cancelled',
          message: '問卷已取消，不會產生公開結果。',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          public_lifecycle_state: 'revealed',
          revealed_at: '2026-06-01T00:00:00.000Z',
          public_lock_ends_at: '2026-06-06T00:00:00.000Z',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          public_lifecycle_state: 'unpublished',
          user_message: '此問卷已結束公開鎖定期，並由發起者下架。',
        }),
      });

    const pollId = '22222222-2222-4222-8222-222222222222';
    await postPollLifecycleTransition(
      pollId,
      'cancel',
      LOCAL_DEMO_CREATOR_USER_ID,
      fetchImpl,
    );
    await postPollLifecycleTransition(
      pollId,
      'close',
      LOCAL_DEMO_CREATOR_USER_ID,
      fetchImpl,
    );
    await postPollLifecycleTransition(
      pollId,
      'unpublish',
      LOCAL_DEMO_CREATOR_USER_ID,
      fetchImpl,
    );

    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      `/polls/${pollId}/cancel`,
      expect.objectContaining({
        method: 'POST',
        headers: { 'X-User-Id': LOCAL_DEMO_CREATOR_USER_ID },
      }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      `/polls/${pollId}/close`,
      expect.any(Object),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      3,
      `/polls/${pollId}/unpublish`,
      expect.any(Object),
    );
  });

  it('exposes actions only for collecting and post_lock states', async () => {
    const { lifecycleActionsForState } = await loadModule();
    expect(lifecycleActionsForState('collecting')).toEqual(['cancel', 'close']);
    expect(lifecycleActionsForState('post_lock')).toEqual(['unpublish']);
    expect(lifecycleActionsForState('locked')).toEqual([]);
    expect(lifecycleActionsForState('revealed')).toEqual([]);
  });

  it('stores only poll id and lifecycle state in session storage', async () => {
    const { writeManagedPoll, readManagedPoll } = await loadModule();
    const storage = new Map<string, string>();
    const session = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
    };
    writeManagedPoll(session, {
      pollId: '22222222-2222-4222-8222-222222222222',
      public_lifecycle_state: 'collecting',
      title: '午餐',
    });
    expect(readManagedPoll(session)).toEqual({
      pollId: '22222222-2222-4222-8222-222222222222',
      public_lifecycle_state: 'collecting',
      title: '午餐',
    });
    const raw = storage.get('www_creator_managed_poll');
    expect(raw).not.toContain('option');
  });
});
