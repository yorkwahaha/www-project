import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_246_DOC =
  'docs/www-project-phase-246-public-share-link-presentation-polish-v1.md';

const TOUCHED_MODULES = [
  'public/frontend/public-share-link-layout.js',
  'public/frontend/public-mvp-ui.js',
  'public/frontend/vote-page.js',
  'public/frontend/result-page.js',
  'public/frontend/my-polls-page.js',
  'public/frontend/public-mvp.css',
  'public/vote.html',
  'public/results.html',
  'src/http/server.ts',
] as const;

const FORBIDDEN_STORAGE =
  /localStorage|sessionStorage|indexedDB|document\.cookie|analytics|gtag\(/i;

const FORBIDDEN_TRACKING =
  /share_token|short_link|qr_code|utm_|tracking|datadog|sentry|apm/i;

function stripJsComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

function createDocumentStub() {
  function createElement(tagName: string) {
    const element = {
      tagName,
      id: '',
      className: '',
      classList: {
        values: new Set<string>(),
        add(...tokens: string[]) {
          for (const token of tokens) {
            this.values.add(token);
            element.className = [...this.values].join(' ');
          }
        },
      },
      textContent: '',
      hidden: false,
      children: [] as ReturnType<typeof createElement>[],
      attributes: new Map<string, string>(),
      setAttribute(name: string, value: string) {
        this.attributes.set(name, value);
        if (name === 'id') {
          this.id = value;
        }
      },
      addEventListener() {},
      append(child: ReturnType<typeof createElement>) {
        this.children.push(child);
      },
      replaceChildren() {
        this.children = [];
      },
    };
    return element;
  }

  const elements = new Map<string, ReturnType<typeof createElement>>();
  const documentObject = {
    createElement,
    getElementById(id: string) {
      return elements.get(id) ?? null;
    },
  };

  const voteShareHost = createElement('section');
  voteShareHost.id = 'vote-detail-share-links';
  elements.set('vote-detail-share-links', voteShareHost);

  const resultsShareHost = createElement('section');
  resultsShareHost.id = 'results-detail-share-links';
  elements.set('results-detail-share-links', resultsShareHost);

  return { documentObject, voteShareHost, resultsShareHost };
}

function childOrder(row: { children: Array<{ className: string }> }) {
  return row.children.map((child) => {
    if (child.className.includes('share-url-label')) return 'link-label';
    if (child.className.includes('copy-link-button')) return 'copy-button';
    if (child.className.includes('mvp-public-share-link-feedback')) return 'inline-feedback';
    if (child.className.includes('share-url')) return 'fallback-url';
    return child.className;
  });
}

describe('Phase 246 public share link presentation polish', () => {
  it('documents Phase 246 in README and phase doc', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_246_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(doc).toContain('Phase 246');
    expect(readme).toContain('Phase 246');
    expect(readme).toContain(PHASE_246_DOC);
  });

  it('exports shared share link layout helpers and row order', async () => {
    const layout = await loadModule('public/frontend/public-share-link-layout.js');

    expect(layout.PUBLIC_SHARE_LINK_ROW_LAYOUT_ORDER).toEqual([
      'link-label',
      'copy-button',
      'inline-feedback',
      'fallback-url',
    ]);
    expect(layout.PUBLIC_SHARE_LINK_SECTION_LAYOUT_ORDER).toEqual([
      'section-title',
      'share-rows',
    ]);
  });

  it('renders share rows in label → copy → feedback → url order', async () => {
    const layout = await loadModule('public/frontend/public-share-link-layout.js');
    const documentObject = {
      createElement(tagName: string) {
        return {
          tagName,
          className: '',
          textContent: '',
          children: [] as Array<ReturnType<typeof documentObject.createElement>>,
          append(child: ReturnType<typeof documentObject.createElement>) {
            this.children.push(child);
          },
          setAttribute() {},
          addEventListener() {},
        };
      },
    };
    const host = documentObject.createElement('div');

    layout.renderPublicShareLinkRow(documentObject, host, {
      label: '投票連結（分享給參與者）',
      url: 'https://example.test/vote/demo',
      copyButtonLabel: '複製投票連結',
      copyButtonAriaLabel: '複製投票頁完整網址到剪貼簿',
    });

    expect(host.children).toHaveLength(1);
    expect(childOrder(host.children[0]!)).toEqual([
      'link-label',
      'copy-button',
      'inline-feedback',
      'fallback-url',
    ]);
    expect(host.children[0]!.children[3]!.textContent).toBe('https://example.test/vote/demo');
  });

  it('keeps vote and results html share hosts present', async () => {
    const voteHtml = await readFile(join(process.cwd(), 'public/vote.html'), 'utf8');
    const resultsHtml = await readFile(join(process.cwd(), 'public/results.html'), 'utf8');

    expect(voteHtml).toContain('id="vote-detail-share-links"');
    expect(resultsHtml).toContain('id="results-detail-share-links"');
  });

  it('wires vote and results pages to share link sync helpers', async () => {
    const voteSource = await readFile(join(process.cwd(), 'public/frontend/vote-page.js'), 'utf8');
    const resultSource = await readFile(
      join(process.cwd(), 'public/frontend/result-page.js'),
      'utf8',
    );

    expect(voteSource).toContain("from './public-share-link-layout.js'");
    expect(voteSource).toContain('syncVotePageShareLinks');
    expect(resultSource).toContain('syncResultsPageShareLinks');
  });

  it('mounts vote and results share sections from existing poll URLs only', async () => {
    const layout = await loadModule('public/frontend/public-share-link-layout.js');
    const { documentObject, voteShareHost, resultsShareHost } = createDocumentStub();
    const pollId = '22222222-2222-4222-8222-222222222222';

    layout.syncVotePageShareLinks(documentObject, {
      pollId,
      locationObject: { origin: 'https://example.test' },
    });
    layout.syncResultsPageShareLinks(documentObject, {
      pollId,
      locationObject: { origin: 'https://example.test' },
    });

    expect(voteShareHost.hidden).toBe(false);
    expect(resultsShareHost.hidden).toBe(false);

    const voteUrls = JSON.stringify(voteShareHost.children);
    const resultUrls = JSON.stringify(resultsShareHost.children);
    expect(voteUrls).toContain(`https://example.test/vote/${pollId}`);
    expect(resultUrls).toContain(`https://example.test/vote/${pollId}`);
    expect(resultUrls).toContain(`https://example.test/results/${pollId}`);
    expect(voteUrls).not.toMatch(/utm_|share_token|option_id|user_id/i);
  });

  it('wires my-polls live owned poll to structured share links', async () => {
    const myPollsSource = await readFile(
      join(process.cwd(), 'public/frontend/my-polls-page.js'),
      'utf8',
    );

    expect(myPollsSource).toContain('mountCreatorOwnedPollShareLinks');
    expect(myPollsSource).toContain('mvp-creator-owned-poll-share-links');
    expect(myPollsSource).not.toContain('actionSlots.secondary.append(shareVote)');
  });

  it('keeps clipboard helper without storage or tracking', async () => {
    const layoutSource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/public-share-link-layout.js'), 'utf8'),
    );

    expect(layoutSource).toContain('copyTextToClipboard');
    expect(layoutSource).toContain('navigator?.clipboard');
    expect(layoutSource).toContain('execCommand');
    expect(layoutSource).not.toMatch(FORBIDDEN_STORAGE);
    expect(layoutSource).not.toMatch(FORBIDDEN_TRACKING);
  });

  it('copies via clipboard when available from layout helper', async () => {
    const layout = await loadModule('public/frontend/public-share-link-layout.js');
    const writeText = vi.fn(async () => undefined);

    const result = await layout.copyTextToClipboard('https://example.test/vote/demo', {
      clipboard: { writeText },
    });

    expect(result.ok).toBe(true);
    expect(writeText).toHaveBeenCalledWith('https://example.test/vote/demo');
  });

  it('serves share link layout module from public static route', async () => {
    const serverSource = await readFile(join(process.cwd(), 'src/http/server.ts'), 'utf8');

    expect(serverSource).toContain("path === '/frontend/public-share-link-layout.js'");
    expect(serverSource).toContain("'frontend/public-share-link-layout.js'");
  });

  it('keeps touched runtime modules free of forbidden storage and tracking', async () => {
    for (const relativePath of TOUCHED_MODULES) {
      if (!relativePath.endsWith('.js')) {
        continue;
      }
      const source = stripJsComments(
        await readFile(join(process.cwd(), relativePath), 'utf8'),
      );
      expect(source, relativePath).not.toMatch(FORBIDDEN_STORAGE);
      expect(source, relativePath).not.toMatch(FORBIDDEN_TRACKING);
    }
  });
});
