import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

async function loadCreatePollPageModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/create-poll-page.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

function createDomRoot() {
  let documentObject: {
    createElement(tagName: string): ReturnType<typeof createElement>;
  };
  function createElement(tagName: string) {
    return {
      tagName,
      ownerDocument: documentObject,
      textContent: '',
      href: '',
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
  return createElement('div');
}

describe('public poll creation page', () => {
  it('submits a normalized published poll to the existing POST /polls API', async () => {
    const { submitCreatePoll } = await loadCreatePollPageModule();
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        poll_id: '22222222-2222-4222-8222-222222222222',
        status: 'active',
        created_at: '2026-05-31T12:00:00.000Z',
      }),
    }));

    await submitCreatePoll({
      formValues: {
        title: '  午餐想吃什麼？ ',
        description: '  今天的選擇 ',
        options: ['  飯  ', ' 麵 ', '', '   '],
      },
      fetchImpl,
      uuidFactory: () => '11111111-1111-4111-8111-111111111111',
      now: () => new Date('2026-05-31T12:00:00.000Z'),
    });

    expect(fetchImpl).toHaveBeenCalledWith('/polls', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': '11111111-1111-4111-8111-111111111111',
      },
      body: JSON.stringify({
        title: '午餐想吃什麼？',
        description: '今天的選擇',
        options: ['飯', '麵'],
        category: 'general',
        eligible_rule_id: null,
        closes_at: '2026-06-07T12:00:00.000Z',
        publish: true,
      }),
      credentials: 'same-origin',
    });
  });

  it('demo submit returns a static poll id without calling fetch', async () => {
    const { submitCreatePollDemo } = await loadCreatePollPageModule();
    const fetchImpl = vi.fn();

    const created = submitCreatePollDemo({
      formValues: {
        title: '示範問卷',
        description: '',
        options: ['甲', '乙'],
      },
    });

    expect(created.poll_id).toBe('demo');
    expect(created.status).toBe('demo_static');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('requires a title', async () => {
    const { normalizeCreatePollForm } = await loadCreatePollPageModule();

    expect(() =>
      normalizeCreatePollForm({ title: ' ', options: ['One', 'Two'] }),
    ).toThrow('請填寫問卷標題。');
  });

  it('renders demo next-step links after static create success', async () => {
    const { renderCreatePollDemoSuccess } = await loadCreatePollPageModule();
    const root = createDomRoot();

    renderCreatePollDemoSuccess(root);

    const links = root.children.filter((child) => child.tagName === 'a');
    expect(links.map((link) => link.textContent)).toEqual([
      '前往投票頁預覽',
      '前往我的問卷',
      '查看收集中結果頁（預覽）',
    ]);
    expect(links[0]!.href).toBe('/vote/demo');
    expect(links[1]!.href).toBe('/my-polls?nav=logged-in-mock');
    expect(links[2]!.href).toBe('/results/demo?ui_state=collecting');
  });

  it('renders vote and result links after successful creation', async () => {
    const { renderCreatePollSuccess } = await loadCreatePollPageModule();
    const root = createDomRoot();

    renderCreatePollSuccess(
      root,
      { poll_id: '22222222-2222-4222-8222-222222222222' },
      { locationObject: { origin: 'https://example.test' } },
    );

    const links = root.children.filter((child) => child.tagName === 'a');
    expect(links).toHaveLength(2);
    expect(links[0]!.href).toBe(
      '/vote/22222222-2222-4222-8222-222222222222',
    );
    expect(links[1]!.href).toBe(
      '/results/22222222-2222-4222-8222-222222222222',
    );
    expect(links[0]!.textContent).toBe('開啟投票頁');
    expect(links[1]!.textContent).toBe('開啟公開結果頁');
    const codes = root.children.flatMap((child) =>
      child.children?.filter((nested) => nested.className === 'share-url') ?? [],
    );
    expect(codes).toHaveLength(2);
    expect(codes[0]!.textContent).toBe(
      'https://example.test/vote/22222222-2222-4222-8222-222222222222',
    );
    expect(codes[1]!.textContent).toBe(
      'https://example.test/results/22222222-2222-4222-8222-222222222222',
    );
    const serialized = JSON.stringify(
      codes.map((code) => code.textContent).join(' '),
    );
    expect(serialized).not.toMatch(
      /option_id|shard|vote_token|user_id|session|device/i,
    );
    const buttons = root.children.filter((child) => child.tagName === 'button');
    expect(buttons.map((button) => button.textContent)).toEqual([
      '複製投票連結',
      '複製結果連結',
    ]);
  });

  it('requires at least two non-empty options', async () => {
    const { normalizeCreatePollForm } = await loadCreatePollPageModule();

    expect(() =>
      normalizeCreatePollForm({ title: 'Question', options: ['One', '  '] }),
    ).toThrow('請至少填寫兩個選項。');
  });

  it('returns a safe failure message without exposing backend payloads', async () => {
    const { submitCreatePoll } = await loadCreatePollPageModule();
    const fetchImpl = vi.fn(async () => ({
      ok: false,
      json: async () => ({
        error: 'PRIVATE_BACKEND_DETAIL',
        message: 'private database detail',
      }),
    }));

    await expect(
      submitCreatePoll({
        formValues: { title: 'Question', options: ['One', 'Two'] },
        fetchImpl,
        uuidFactory: () => '11111111-1111-4111-8111-111111111111',
      }),
    ).rejects.toThrow('目前無法建立問卷，請稍後再試。');
  });

  it('contains no storage, analytics, ranking, vote, feed, or result loading behavior', async () => {
    const source = await readFile(
      join(process.cwd(), 'public/frontend/create-poll-page.js'),
      'utf8',
    );

    expect(source).not.toMatch(
      /localStorage|sessionStorage|indexedDB|document\.cookie|analytics|console\./,
    );
    expect(source).not.toMatch(
      /reference-answer|vote-by-index|loadPollDetail|\/polls\/feed|\/polls\/.*\/results|ranking|spread_score|option_id/,
    );
  });

  it('create poll page copy marks default submit as preview without persisting', async () => {
    const html = await readFile(join(process.cwd(), 'public/create-poll.html'), 'utf8');
    expect(html).toMatch(/預覽，不儲存/);
    expect(html).toMatch(/預覽模式/);
    expect(html).toMatch(/Lv\.1 註冊用戶/);
    expect(html).toMatch(/\?live=1/);
    expect(html).toMatch(/不透露/);
  });
});
