import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

async function loadMyPollsModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/my-polls-page.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

function createDocument() {
  const nodes = new Map<string, ReturnType<typeof createElement>>();
  let documentObject: {
    createElement(tagName: string): ReturnType<typeof createElement>;
    querySelector(selector: string): ReturnType<typeof createElement> | null;
    getElementById(id: string): ReturnType<typeof createElement> | null;
  };

  function createElement(tagName: string) {
    const element = {
      tagName,
      ownerDocument: documentObject,
      className: '',
      textContent: '',
      href: '',
      hidden: false,
      children: [] as ReturnType<typeof createElement>[],
      attributes: new Map<string, string>(),
      listeners: new Map<string, () => void>(),
      setAttribute(name: string, value: string) {
        this.attributes.set(name, value);
      },
      addEventListener(type: string, listener: () => void) {
        this.listeners.set(type, listener);
      },
      append(...children: ReturnType<typeof createElement>[]) {
        this.children.push(...children);
      },
      prepend(...children: ReturnType<typeof createElement>[]) {
        this.children.unshift(...children);
      },
      insertBefore(
        child: ReturnType<typeof createElement>,
        before: ReturnType<typeof createElement>,
      ) {
        const index = this.children.indexOf(before);
        if (index < 0) {
          this.children.push(child);
        } else {
          this.children.splice(index, 0, child);
        }
      },
      replaceChildren() {
        this.children = [];
      },
      querySelector(selector: string) {
        if (selector === 'td:last-child') {
          return this.children.find((child) => child.tagName === 'TD') ?? null;
        }
        return null;
      },
    };
    return element;
  }

  function createRow() {
    const tr = createElement('tr');
    const td = createElement('td');
    tr.append(td);
    tr.querySelector = (selector: string) =>
      selector === 'td:last-child' ? td : null;
    return tr;
  }

  const tbody = createElement('tbody');
  const rows = [];
  for (let index = 0; index < 5; index += 1) {
    const row = createRow();
    rows.push(row);
    tbody.append(row);
  }
  tbody.querySelectorAll = (selector: string) =>
    selector === 'tr' ? rows : [];
  const table = createElement('table');
  table.className = 'mvp-dash-table';
  table.append(tbody);
  table.querySelectorAll = (selector: string) =>
    selector === 'tr' ? rows : [];

  documentObject = {
    createElement,
    querySelector(selector: string) {
      if (selector === '.mvp-dash-table tbody') {
        return tbody;
      }
      return null;
    },
    getElementById() {
      return null;
    },
  };

  return { documentObject, tbody };
}

function collectText(element: {
  textContent?: string;
  children?: { textContent?: string; children?: unknown[] }[];
}): string {
  return [
    element.textContent,
    ...(element.children ?? []).map((child) => collectText(child)),
  ]
    .filter(Boolean)
    .join(' ');
}

describe('my polls demo page wiring', () => {
  it('wires row actions to demo vote and result states', async () => {
    const { wireMyPollsDemoPage } = await loadMyPollsModule();
    const { documentObject, tbody } = createDocument();

    wireMyPollsDemoPage(documentObject);

    const rows = tbody.children;
    const collectingVote = rows[0]!.children[0]!.children.find(
      (node) =>
        node.tagName.toLowerCase() === 'a' && node.textContent === '前往投票頁',
    );
    expect(collectingVote?.href).toBe('/vote/demo');

    const lockedResults = rows[1]!.children[0]!.children.find(
      (node) =>
        node.tagName.toLowerCase() === 'a' && node.href.includes('ui_state=locked'),
    );
    expect(lockedResults?.href).toBe('/results/demo?ui_state=locked');

    const postLockResults = rows[2]!.children[0]!.children.find((node) =>
      node.href.includes('ui_state=post_lock'),
    );
    expect(postLockResults?.href).toBe('/results/demo?ui_state=post_lock');

    const cancelled = rows[3]!.children[0]!.children.find((node) =>
      node.href.includes('ui_state=cancelled'),
    );
    expect(cancelled?.href).toBe('/results/demo?ui_state=cancelled');

    const unpublishedTexts = rows[4]!.children[0]!.children.map(
      (node) => node.textContent,
    );
    expect(unpublishedTexts).toContain(
      '此問卷已結束公開鎖定期，並由發起者下架。',
    );
  });

  it('loads live creator polls from /creator/polls without sessionStorage ownership authority', async () => {
    const { wireMyPollsDemoPage } = await loadMyPollsModule();
    const { documentObject } = createDocument();
    const main = documentObject.createElement('main') as ReturnType<
      typeof documentObject.createElement
    > & { id: string };
    main.id = 'main-content';
    const fetchImpl = vi.fn(async (path: string) => {
      if (path === '/creator/session') {
        return { ok: true, status: 200 };
      }
      if (path === '/creator/polls') {
        return {
          ok: true,
          json: async () => ({
            polls: [
              {
                poll_id: '22222222-2222-4222-8222-222222222222',
                title: '午餐',
                category: 'general',
                public_lifecycle_state: 'collecting',
                closes_at: '2026-06-07T12:00:00.000Z',
                revealed_at: null,
                public_lock_ends_at: null,
                cancelled_at: null,
                unpublished_at: null,
              },
            ],
          }),
        };
      }
      throw new Error(`unexpected fetch ${path}`);
    });
    documentObject.getElementById = (id: string) =>
      id === 'main-content' ? main : null;
    (documentObject as typeof documentObject & { defaultView: unknown }).defaultView = {
      location: {
        search: '?live=1',
        hostname: '127.0.0.1',
        origin: 'http://127.0.0.1:3000',
      },
      fetch: fetchImpl,
      sessionStorage: {
        getItem: () => {
          throw new Error('sessionStorage must not authorize owned polls');
        },
        setItem: () => {
          throw new Error('sessionStorage must not authorize owned polls');
        },
      },
    };

    wireMyPollsDemoPage(documentObject);

    await vi.waitFor(() => {
      const text = collectText(main);
      expect(text).toContain('即時問卷：午餐');
      expect(text).toContain('收集中');
    });
    expect(fetchImpl).toHaveBeenNthCalledWith(1, '/creator/session', {
      method: 'GET',
      credentials: 'same-origin',
    });
    expect(fetchImpl).toHaveBeenNthCalledWith(2, '/creator/polls', {
      method: 'GET',
      credentials: 'same-origin',
    });
    expect(JSON.stringify(fetchImpl.mock.calls)).not.toMatch(/X-User-Id|X-Display-Name/);
  });
});
