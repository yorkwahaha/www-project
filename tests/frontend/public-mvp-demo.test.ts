import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

async function loadDemoModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/public-mvp-demo.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

describe('public mvp demo helpers', () => {
  it('parses live API mode only when live=1', async () => {
    const { parseLiveApiMode } = await loadDemoModule();
    expect(parseLiveApiMode('?live=1')).toBe(true);
    expect(parseLiveApiMode('?live=0')).toBe(false);
    expect(parseLiveApiMode('')).toBe(false);
  });

  it('uses the stable demo poll slug for routes', async () => {
    const {
      DEMO_POLL_SLUG,
      DEMO_MOCK_POLL_ID,
      buildDemoResultPath,
      buildDemoVotePath,
      isDemoPollRouteId,
    } = await loadDemoModule();
    expect(DEMO_POLL_SLUG).toBe('demo');
    expect(DEMO_MOCK_POLL_ID).toBe('demo');
    expect(isDemoPollRouteId('demo')).toBe(true);
    expect(isDemoPollRouteId('DEMO')).toBe(true);
    expect(isDemoPollRouteId('11111111-1111-4111-8111-111111111111')).toBe(
      false,
    );
    expect(buildDemoVotePath()).toBe('/vote/demo');
    expect(buildDemoResultPath('locked')).toBe(
      '/results/demo?ui_state=locked',
    );
    expect(buildDemoResultPath()).toBe('/results/demo');
  });

  it('demo collecting payload hides vote numbers and percentages', async () => {
    const { getDemoCollectingResultPayload } = await loadDemoModule();
    const payload = getDemoCollectingResultPayload();
    const serialized = JSON.stringify(payload);
    expect(payload.collecting).toBe(true);
    expect(serialized).not.toMatch(/%|票數|排名|趨勢/);
    for (const option of payload.options) {
      expect(option.display_count).toBeNull();
      expect(option.display_percentage).toBeNull();
    }
  });

  it('submitVoteDemo requires a selected option index', async () => {
    const { submitVoteDemo } = await loadDemoModule();
    expect(() => submitVoteDemo({ optionIndex: null })).toThrow(
      '請先選擇一個選項',
    );
    expect(submitVoteDemo({ optionIndex: 0 })).toEqual({ ok: true, demo: true });
  });

  it('renders result ui_state preview links for a poll id', async () => {
    const { renderResultUiStatePreviewLinks } = await loadDemoModule();
    let documentObject: {
      createElement(tagName: string): ReturnType<typeof createElement>;
    };
    function createElement(tagName: string) {
      return {
        tagName,
        ownerDocument: documentObject,
        className: '',
        textContent: '',
        href: '',
        hidden: false,
        children: [] as ReturnType<typeof createElement>[],
        attributes: new Map<string, string>(),
        setAttribute(name: string, value: string) {
          this.attributes.set(name, value);
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
    const root = createElement('div');
    renderResultUiStatePreviewLinks(root, 'demo');
    function collectLinks(node: ReturnType<typeof createElement>): ReturnType<typeof createElement>[] {
      const links =
        node.tagName.toLowerCase() === 'a'
          ? [node]
          : [];
      return [...links, ...node.children.flatMap((child) => collectLinks(child))];
    }
    const links = collectLinks(root);
    expect(links.length).toBeGreaterThanOrEqual(6);
    expect(links.some((link) => link.href === '/results/demo?ui_state=locked')).toBe(
      true,
    );
  });

  it('does not import storage or analytics APIs', async () => {
    const source = await readFile(
      join(process.cwd(), 'public/frontend/public-mvp-demo.js'),
      'utf8',
    );
    expect(source).not.toMatch(
      /localStorage|sessionStorage|indexedDB|document\.cookie|analytics|console\./,
    );
  });
});
