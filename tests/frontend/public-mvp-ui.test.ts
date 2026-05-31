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
});
