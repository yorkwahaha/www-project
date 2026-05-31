import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

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
});
