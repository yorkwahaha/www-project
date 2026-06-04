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

  it('posts cancel/close/unpublish to creator-owned poll routes without creator headers', async () => {
    const { postPollLifecycleTransition } = await loadModule();
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
    expect(fetchImpl.mock.calls[0]![1]).not.toHaveProperty('headers');
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      `/creator/polls/${pollId}/close`,
      expect.any(Object),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      3,
      `/creator/polls/${pollId}/unpublish`,
      expect.any(Object),
    );
    expect(JSON.stringify(fetchImpl.mock.calls)).not.toMatch(/X-User-Id|X-Display-Name/);
  });

  it('bootstraps the local demo creator session only after a 401 session check', async () => {
    const { ensureCreatorSessionForLiveMode, LOCAL_DEMO_CREATOR_USER_ID } =
      await loadModule();
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 401 })
      .mockResolvedValueOnce({ ok: true, status: 201 });

    await expect(
      ensureCreatorSessionForLiveMode({
        fetchImpl,
        locationObject: { hostname: '127.0.0.1' },
      }),
    ).resolves.toBe(true);

    expect(fetchImpl).toHaveBeenNthCalledWith(1, '/creator/session', {
      method: 'GET',
      credentials: 'same-origin',
    });
    expect(fetchImpl).toHaveBeenNthCalledWith(2, '/creator/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: LOCAL_DEMO_CREATOR_USER_ID }),
      credentials: 'same-origin',
    });
  });

  it('does not issue local test sessions on non-local hosts', async () => {
    const { ensureCreatorSessionForLiveMode } = await loadModule();
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 401 });

    await expect(
      ensureCreatorSessionForLiveMode({
        fetchImpl,
        locationObject: { hostname: 'www.example.test' },
      }),
    ).rejects.toThrow('目前無法確認發起者身分');

    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('exposes actions only for collecting and post_lock states', async () => {
    const { lifecycleActionsForState } = await loadModule();
    expect(lifecycleActionsForState('collecting')).toEqual(['cancel', 'close']);
    expect(lifecycleActionsForState('post_lock')).toEqual(['unpublish']);
    expect(lifecycleActionsForState('locked')).toEqual([]);
    expect(lifecycleActionsForState('revealed')).toEqual([]);
  });

  it('invokes onTransitionSuccess from lifecycle button after successful POST', async () => {
    vi.stubGlobal('confirm', vi.fn(() => true));
    const { renderCreatorLifecycleActions } = await loadModule();
    const pollId = '22222222-2222-4222-8222-222222222222';
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        public_lifecycle_state: 'cancelled',
        message: '問卷已取消，不會產生公開結果。',
      }),
    });
    const onTransitionSuccess = vi.fn().mockResolvedValue({ refreshed: true });
    const listeners = new Map<object, () => void>();
    let documentObject: {
      createElement(tagName: string): Record<string, unknown>;
    };
    const createElement = (tagName: string) => {
      const element: Record<string, unknown> = {
        tagName,
        ownerDocument: documentObject,
        className: '',
        textContent: '',
        href: '',
        hidden: false,
        disabled: false,
        children: [] as Record<string, unknown>[],
        append(child: Record<string, unknown>) {
          (this.children as Record<string, unknown>[]).push(child);
        },
        replaceChildren() {
          this.children = [];
        },
        setAttribute() {},
        addEventListener(_type: string, handler: () => void) {
          listeners.set(element, handler);
        },
      };
      return element;
    };
    documentObject = { createElement };
    const host = createElement('section') as HTMLElement & {
      children: Record<string, unknown>[];
    };

    renderCreatorLifecycleActions(host, {
      pollId,
      lifecycleState: 'collecting',
      fetchImpl,
      onTransitionSuccess,
    });

    const toolbar = host.children.find(
      (child) =>
        child &&
        typeof child === 'object' &&
        String((child as { className?: string }).className).includes(
          'mvp-creator-lifecycle-toolbar',
        ),
    ) as { children: Record<string, unknown>[] } | undefined;
    const cancelButton = toolbar?.children.find(
      (child) =>
        child &&
        typeof child === 'object' &&
        String((child as { tagName?: string }).tagName).toLowerCase() === 'button' &&
        (child as { textContent?: string }).textContent === '取消問卷',
    );
    expect(cancelButton).toBeTruthy();

    const clickHandler = listeners.get(cancelButton!);
    expect(clickHandler).toBeTypeOf('function');
    clickHandler!();
    await vi.waitFor(() => {
      expect(fetchImpl).toHaveBeenCalled();
      expect(onTransitionSuccess).toHaveBeenCalledTimes(1);
    });
    vi.unstubAllGlobals();
  });

  it('keeps transition success status when refresh returns refreshed false', async () => {
    vi.stubGlobal('confirm', vi.fn(() => true));
    const { renderCreatorLifecycleActions } = await loadModule();
    const pollId = '22222222-2222-4222-8222-222222222222';
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        public_lifecycle_state: 'cancelled',
      }),
    });
    const onTransitionSuccess = vi.fn().mockResolvedValue({ refreshed: false });
    const listeners = new Map<object, () => void>();
    let documentObject: {
      createElement(tagName: string): Record<string, unknown>;
    };
    const createElement = (tagName: string) => {
      const element: Record<string, unknown> = {
        tagName,
        ownerDocument: documentObject,
        className: '',
        textContent: '',
        href: '',
        hidden: false,
        disabled: false,
        children: [] as Record<string, unknown>[],
        append(child: Record<string, unknown>) {
          (this.children as Record<string, unknown>[]).push(child);
        },
        replaceChildren() {
          this.children = [];
        },
        setAttribute() {},
        addEventListener(_type: string, handler: () => void) {
          listeners.set(element, handler);
        },
      };
      return element;
    };
    documentObject = { createElement };
    const host = createElement('section') as HTMLElement & {
      children: Record<string, unknown>[];
      querySelector(selector: string): Record<string, unknown> | null;
    };
    host.querySelector = (selector: string) => {
      if (selector === '.mvp-demo-action-feedback') {
        return (
          (host.children.find((child) =>
            String((child as { className?: string }).className).includes(
              'mvp-demo-action-feedback',
            ),
          ) as Record<string, unknown>) ?? null
        );
      }
      return null;
    };

    renderCreatorLifecycleActions(host, {
      pollId,
      lifecycleState: 'collecting',
      fetchImpl,
      onTransitionSuccess,
    });

    const toolbar = host.children.find(
      (child) =>
        child &&
        typeof child === 'object' &&
        String((child as { className?: string }).className).includes(
          'mvp-creator-lifecycle-toolbar',
        ),
    ) as { children: Record<string, unknown>[] } | undefined;
    const cancelButton = toolbar?.children.find(
      (child) =>
        child &&
        typeof child === 'object' &&
        String((child as { tagName?: string }).tagName).toLowerCase() === 'button' &&
        (child as { textContent?: string }).textContent === '取消問卷',
    );
    expect(cancelButton).toBeTruthy();

    listeners.get(cancelButton!)?.();
    await vi.waitFor(() => {
      const status = host.querySelector('.mvp-demo-action-feedback') as {
        textContent?: string;
      } | null;
      expect(status?.textContent).toContain('狀態已更新');
      expect(status?.textContent).toContain('重新整理頁面');
      expect(status?.textContent).not.toContain('目前無法更新問卷狀態');
    });
    vi.unstubAllGlobals();
  });

  it('does not expose managed-poll session storage helpers for creator authority', async () => {
    const module = await loadModule();
    expect(module).not.toHaveProperty('writeManagedPoll');
    expect(module).not.toHaveProperty('readManagedPoll');
  });
});
