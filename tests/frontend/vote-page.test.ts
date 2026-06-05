import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

async function loadVotePageModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/vote-page.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

function createWindowObject() {
  const listeners = new Map<string, Array<(event: { persisted?: boolean }) => void>>();
  return {
    addEventListener(
      type: string,
      listener: (event: { persisted?: boolean }) => void,
    ) {
      listeners.set(type, [...(listeners.get(type) ?? []), listener]);
    },
    dispatch(type: string, event: { persisted?: boolean } = {}) {
      for (const listener of listeners.get(type) ?? []) listener(event);
    },
  };
}

function createRoot() {
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
      href: '',
      id: '',
      htmlFor: '',
      type: '',
      name: '',
      value: '',
      attributes: new Map<string, string>(),
      setAttribute(name: string, value: string) {
        this.attributes.set(name, value);
        if (name === 'id') {
          this.id = value;
        }
      },
      removeAttribute() {},
      children: [] as ReturnType<typeof createElement>[],
      listeners: new Map<string, () => void>(),
      addEventListener(type: string, listener: () => void) {
        this.listeners.set(type, listener);
      },
      append(child: ReturnType<typeof createElement>) {
        this.children.push(child);
      },
      replaceChildren() {
        this.children = [];
      },
    };
  }
  documentObject = { createElement };
  return createElement('div');
}

function collectText(element: ReturnType<typeof createRoot>): string[] {
  return [
    element.textContent,
    ...element.children.flatMap((child) => collectText(child)),
  ].filter(Boolean);
}

describe('public voting page', () => {
  it('parses the poll id from the public voting page path', async () => {
    const { getPollIdFromVotePath } = await loadVotePageModule();

    expect(getPollIdFromVotePath('/vote/11111111-1111-4111-8111-111111111111'))
      .toBe('11111111-1111-4111-8111-111111111111');
    expect(getPollIdFromVotePath('/results/11111111-1111-4111-8111-111111111111'))
      .toBeNull();
  });

  it('loads public detail and renders public option indexes with labels', async () => {
    const { loadPollDetail, renderPollOptions } = await loadVotePageModule();
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        title: 'Lunch?',
        description: 'Pick one',
        options: [
          { option_index: 0, label: 'Rice' },
          { option_index: 1, label: 'Noodles' },
        ],
      }),
    }));
    const detail = await loadPollDetail({ pollId: 'public-poll-id', fetchImpl });
    const root = createRoot();
    const onSelect = vi.fn();

    renderPollOptions(root, detail.options, onSelect);

    expect(fetchImpl).toHaveBeenCalledWith('/polls/public-poll-id', {
      method: 'GET',
      credentials: 'omit',
      cache: 'no-store',
    });
    expect(collectText(root)).toEqual(['Rice', 'Noodles']);
    root.children[1]!.children[0]!.listeners.get('change')!();
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it('blocks submission when no option is selected', async () => {
    const { submitVoteByIndex } = await loadVotePageModule();
    const fetchImpl = vi.fn();

    await expect(
      submitVoteByIndex({
        pollId: 'public-poll-id',
        optionIndex: null,
        userId: 'runtime-user-id',
        fetchImpl,
      }),
    ).rejects.toThrow('請先選擇一個選項。');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('submits only the selected public option index to the bridge endpoint', async () => {
    const { submitVoteByIndex } = await loadVotePageModule();
    const fetchImpl = vi.fn(async () => ({ ok: true }));

    await submitVoteByIndex({
      pollId: 'public-poll-id',
      optionIndex: 1,
      userId: 'runtime-user-id',
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledWith('/polls/public-poll-id/vote-by-index', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': 'runtime-user-id',
      },
      body: JSON.stringify({ option_index: 1 }),
      credentials: 'same-origin',
    });
  });

  it('shows safe failures without exposing backend payloads', async () => {
    const { submitVoteByIndex } = await loadVotePageModule();
    const fetchImpl = vi.fn(async () => ({
      ok: false,
      status: 500,
      json: async () => ({ message: 'private database detail' }),
    }));

    await expect(
      submitVoteByIndex({
        pollId: 'public-poll-id',
        optionIndex: 0,
        userId: 'runtime-user-id',
        fetchImpl,
      }),
    ).rejects.toThrow('目前無法送出投票，請稍後再試。');
  });

  it('shows fixed profile eligibility failures without option details', async () => {
    const { submitVoteByIndex } = await loadVotePageModule();
    const fetchImpl = vi.fn(async () => ({
      ok: false,
      status: 403,
      json: async () => ({
        error: 'POLL_FORBIDDEN',
        message: 'private option_index 0 option_id abc option text Rice',
      }),
    }));

    await expect(
      submitVoteByIndex({
        pollId: 'public-poll-id',
        optionIndex: 0,
        userId: 'runtime-user-id',
        fetchImpl,
      }),
    ).rejects.toThrow('你目前不符合此問卷的投票資格。');
  });

  it('maps poll-not-found load failures to a friendly message', async () => {
    const { loadPollDetail } = await loadVotePageModule();
    const fetchImpl = vi.fn(async () => ({
      ok: false,
      status: 404,
      json: async () => ({ error: 'POLL_NOT_FOUND', message: 'Poll not found' }),
    }));

    await expect(loadPollDetail({ pollId: 'public-poll-id', fetchImpl })).rejects.toThrow(
      '找不到此問卷',
    );
  });

  it('maps duplicate vote responses to a result-page hint', async () => {
    const { submitVoteByIndex } = await loadVotePageModule();
    const fetchImpl = vi.fn(async () => ({
      ok: false,
      status: 409,
      json: async () => ({
        error: 'OFFICIAL_VOTE_DUPLICATE',
        message: 'Official Vote already recorded for this poll',
      }),
    }));

    await expect(
      submitVoteByIndex({
        pollId: 'public-poll-id',
        optionIndex: 0,
        userId: 'runtime-user-id',
        fetchImpl,
      }),
    ).rejects.toThrow('您已在此問卷投過票');
  });

  it('renders preview-only success copy when demo mode', async () => {
    const { renderVoteSuccess } = await loadVotePageModule();
    const root = createRoot();

    renderVoteSuccess(root, 'demo', { demoOnly: true });

    const text = collectText(root);
    expect(text[0]).toMatch(/展示未來的使用方式/);
    expect(text.join(' ')).toMatch(/不會儲存/);
    expect(text.join(' ')).toMatch(/票數或百分比/);
    expect(text.join(' ')).toMatch(/投票後可協助回饋題目品質/);
    expect(text.join(' ')).toMatch(/不是單純按讚/);
    expect(text.join(' ')).toMatch(/有點無言／不知道該怎麼說/);
    const resultLink = root.children.find((child) => child.tagName === 'a');
    expect(resultLink?.href).toBe('/results/demo');
  });

  it('renders a safe public result link after success', async () => {
    const { renderVoteSuccess } = await loadVotePageModule();
    const root = createRoot();

    renderVoteSuccess(root, 'public-poll-id');

    expect(root.hidden).toBe(false);
    const text = collectText(root);
    expect(text[0]).toBe('投票已送出，感謝參與。');
    expect(text.join(' ')).toMatch(/收集中結果頁不顯示票數或百分比/);
    expect(text.join(' ')).toMatch(/站內通知/);
    expect(text.join(' ')).toMatch(/投票後可協助回饋題目品質/);
    expect(text).toContain('查看公開結果頁');
    const resultLink = root.children.find((child) => child.tagName === 'a');
    expect(resultLink?.href).toBe('/results/public-poll-id');
  });

  it('clears page-local selection state after submit, pagehide, and BFCache restore', async () => {
    const { createVotePageController } = await loadVotePageModule();
    const windowObject = createWindowObject();
    const resetSelectionUi = vi.fn();
    const controller = createVotePageController({
      pollId: 'public-poll-id',
      userId: 'runtime-user-id',
      fetchImpl: vi.fn(async () => ({ ok: true })),
      windowObject,
      resetSelectionUi,
    });

    controller.selectOption(1);
    await controller.submit();
    expect(controller.hasSensitiveRuntimeState()).toBe(false);

    controller.selectOption(0);
    windowObject.dispatch('pagehide');
    expect(controller.hasSensitiveRuntimeState()).toBe(false);

    controller.selectOption(0);
    windowObject.dispatch('pageshow', { persisted: true });
    expect(controller.hasSensitiveRuntimeState()).toBe(false);
    expect(resetSelectionUi).toHaveBeenCalledTimes(3);
  });

  it('uses no persistent storage, URL selection state, analytics, or debug output', async () => {
    const source = await readFile(
      join(process.cwd(), 'public/frontend/vote-page.js'),
      'utf8',
    );

    expect(source).not.toMatch(
      /localStorage|sessionStorage|indexedDB|document\.cookie|pushState|replaceState|searchParams/,
    );
    expect(source).not.toMatch(/console\.|analytics|WebSocket|EventSource|option_id/);
  });
});
