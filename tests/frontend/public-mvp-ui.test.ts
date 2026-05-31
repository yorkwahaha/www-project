import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

async function loadPublicMvpUiModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/public-mvp-ui.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

describe('public MVP UI helpers', () => {
  it('accepts demo slug on public page routes only', async () => {
    const { isPublicMvpPagePollId, PUBLIC_MVP_DEMO_POLL_SLUG } =
      await loadPublicMvpUiModule();
    expect(PUBLIC_MVP_DEMO_POLL_SLUG).toBe('demo');
    expect(isPublicMvpPagePollId('demo')).toBe(true);
    expect(
      isPublicMvpPagePollId('11111111-1111-4111-8111-111111111111'),
    ).toBe(true);
    expect(isPublicMvpPagePollId('not-a-poll')).toBe(false);
  });

  it('marks error panels as alerts', async () => {
    const { renderPublicErrorPanel } = await loadPublicMvpUiModule();
    let documentObject: {
      createElement(tagName: string): ReturnType<typeof createElement>;
    };
    function createElement(tagName: string) {
      return {
        tagName,
        ownerDocument: documentObject,
        hidden: false,
        textContent: '',
        className: '',
        attributes: new Map<string, string>(),
        setAttribute(name: string, value: string) {
          this.attributes.set(name, value);
        },
        append() {},
        replaceChildren() {},
      };
    }
    documentObject = { createElement };
    const root = createElement('section');

    renderPublicErrorPanel(root, {
      title: '無法載入',
      message: '找不到此問卷。',
      showNav: false,
    });

    expect(root.attributes.get('role')).toBe('alert');
  });

  it('maps poll-not-found API errors without echoing backend English', async () => {
    const { messageForPollLoadFailure } = await loadPublicMvpUiModule();

    expect(
      messageForPollLoadFailure({
        status: 404,
        errorCode: 'POLL_NOT_FOUND',
        message: 'Poll not found',
      }),
    ).toBe('找不到此問卷，可能已刪除、尚未公開，或連結有誤。');
  });

  it('copies via clipboard when available', async () => {
    const { copyTextToClipboard } = await loadPublicMvpUiModule();
    const writeText = vi.fn(async () => undefined);

    const result = await copyTextToClipboard('https://example.test/vote/x', {
      clipboard: { writeText },
    });

    expect(result.ok).toBe(true);
    expect(writeText).toHaveBeenCalledWith('https://example.test/vote/x');
  });

  it('renders absolute share URLs without sensitive query parameters', async () => {
    const { renderPollSharePanel } = await loadPublicMvpUiModule();
    let documentObject: {
      createElement(tagName: string): ReturnType<typeof createElement>;
    };
    function createElement(tagName: string) {
      return {
        tagName,
        ownerDocument: documentObject,
        className: '',
        textContent: '',
        hidden: false,
        children: [] as ReturnType<typeof createElement>[],
        attributes: new Map<string, string>(),
        setAttribute(name: string, value: string) {
          this.attributes.set(name, value);
        },
        addEventListener() {},
        append(child: ReturnType<typeof createElement>) {
          this.children.push(child);
        },
        replaceChildren() {
          this.children = [];
        },
      };
    }
    documentObject = { createElement };
    const root = createElement('section');
    const pollId = '33333333-3333-4333-8333-333333333333';

    renderPollSharePanel(root, pollId, {
      locationObject: { origin: 'https://share.example' },
    });

    const urls = root.children
      .flatMap((child) => child.children ?? [])
      .filter((child) => child.className === 'share-url')
      .map((child) => child.textContent);
    expect(urls).toEqual([
      `https://share.example/vote/${pollId}`,
      `https://share.example/results/${pollId}`,
    ]);
    expect(urls.join(' ')).not.toMatch(
      /option_id|token|shard|user_id|session|device|admin/i,
    );
  });

  it('falls back gracefully when clipboard is unavailable', async () => {
    const { copyTextToClipboard } = await loadPublicMvpUiModule();
    const prompt = vi.fn();

    const result = await copyTextToClipboard('https://example.test/results/x', {
      clipboard: undefined,
      documentObject: {
        createElement: () => ({
          style: {},
          select: () => undefined,
          remove: () => undefined,
        }),
        body: { append: () => undefined },
        execCommand: () => false,
      },
      prompt,
    });

    expect(result.ok).toBe(false);
    expect(prompt).toHaveBeenCalled();
  });

  it('uses seeded demo voter id on localhost only', async () => {
    const {
      LOCAL_DEMO_VOTER_B_USER_ID,
      LOCAL_DEMO_VOTER_USER_ID,
      resolvePublicMvpUserId,
    } = await loadPublicMvpUiModule();

    const originalLocation = globalThis.location;
    Object.defineProperty(globalThis, 'location', {
      configurable: true,
      value: {
        hostname: '127.0.0.1',
        search: '',
      },
    });
    try {
      expect(resolvePublicMvpUserId(() => 'random-id')).toBe(LOCAL_DEMO_VOTER_USER_ID);
      Object.defineProperty(globalThis, 'location', {
        configurable: true,
        value: {
          hostname: '127.0.0.1',
          search: '?demoVoter=b',
        },
      });
      expect(resolvePublicMvpUserId(() => 'random-id')).toBe(LOCAL_DEMO_VOTER_B_USER_ID);
      Object.defineProperty(globalThis, 'location', {
        configurable: true,
        value: { hostname: 'example.com', search: '' },
      });
      expect(resolvePublicMvpUserId(() => 'random-id')).toBe('random-id');
    } finally {
      Object.defineProperty(globalThis, 'location', {
        configurable: true,
        value: originalLocation,
      });
    }
  });
});
