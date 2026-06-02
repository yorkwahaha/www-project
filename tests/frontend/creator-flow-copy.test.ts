import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

async function loadModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/creator-flow-copy.js'),
  ).href;
  return import(/* @vite-ignore */ url);
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
      href: '',
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
  return createElement('div');
}

function collectText(element: ReturnType<typeof createRoot>): string {
  return [
    element.textContent,
    ...element.children.flatMap((child) => collectText(child)),
  ]
    .filter(Boolean)
    .join(' ');
}

describe('creator flow copy', () => {
  it('renders collecting action guide without option or counter terms', async () => {
    const { renderCreatorActionGuide, CREATOR_FLOW_COPY } = await loadModule();
    const host = createRoot();

    renderCreatorActionGuide(host, 'collecting');

    const text = collectText(host);
    expect(text).toContain('操作說明');
    expect(text).toContain(CREATOR_FLOW_COPY.actionCancel);
    expect(text).toContain(CREATOR_FLOW_COPY.actionClose);
    expect(text).not.toMatch(/option_id|raw_count|vote_counter/i);
  });

  it('renders manage links for vote, my-polls, and creator results', async () => {
    const { renderCreatorManageLinks } = await loadModule();
    const host = createRoot();
    const pollId = '22222222-2222-4222-8222-222222222222';

    renderCreatorManageLinks(host, {
      pollId,
      locationObject: { origin: 'https://example.test' },
    });

    function findLinks(element: ReturnType<typeof createRoot>) {
      const links: ReturnType<typeof createRoot>[] = [];
      if (String(element.tagName).toLowerCase() === 'a') {
        links.push(element);
      }
      for (const child of element.children) {
        links.push(...findLinks(child));
      }
      return links;
    }
    const links = findLinks(host);
    expect(links.map((link) => link.textContent)).toEqual([
      '投票頁',
      '我的問卷',
      '結果頁（發起者）',
    ]);
    expect(links[0]!.href).toBe(`/vote/${pollId}`);
    expect(links[1]!.href).toBe('/my-polls?live=1');
    expect(links[2]!.href).toBe(`/results/${pollId}?creator=1`);
    expect(collectText(host)).toContain(`https://example.test/vote/${pollId}`);
  });

  it('renders create success next-step guidance', async () => {
    const { renderCreateSuccessFlowGuide, CREATOR_FLOW_COPY } = await loadModule();
    const host = createRoot();

    renderCreateSuccessFlowGuide(host);

    const text = collectText(host);
    expect(text).toContain('下一步');
    expect(text).toContain(CREATOR_FLOW_COPY.createSuccessLead);
    expect(text).toContain('我的問卷');
  });
});
