import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_248_DOC =
  'docs/www-project-phase-248-public-copy-feedback-accessibility-polish-v1.md';

const TOUCHED_MODULES = [
  'public/frontend/public-share-link-layout.js',
  'public/frontend/public-mvp-demo.js',
  'public/frontend/public-mvp.css',
] as const;

const FORBIDDEN_STORAGE =
  /localStorage|sessionStorage|indexedDB|document\.cookie|analytics|gtag\(/i;

const FORBIDDEN_TRACKING =
  /share_token|short_link|qr_code|utm_|tracking|datadog|sentry|apm/i;

const FORBIDDEN_BACKEND_ECHO =
  /error\.message|body\.message|apiError\.message|response\.text\(\)|JSON\.stringify\(error/i;

function stripJsComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

function childOrder(row: { children: Array<{ className: string; tagName?: string }> }) {
  return row.children.map((child) => {
    if (child.className.includes('share-url-label')) return 'link-label';
    if (child.className.includes('copy-link-button')) return 'copy-button';
    if (child.className.includes('mvp-public-share-link-feedback')) return 'inline-feedback';
    if (child.className.split(/\s+/).includes('share-url')) return 'fallback-url';
    return child.className;
  });
}

describe('Phase 248 public copy feedback accessibility polish', () => {
  it('documents Phase 248 in README and phase doc', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_248_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(doc).toContain('Phase 248');
    expect(readme).toContain('Phase 248');
    expect(readme).toContain(PHASE_248_DOC);
  });

  it('exports copy feedback a11y order and fixed frontend messages', async () => {
    const layout = await loadModule('public/frontend/public-share-link-layout.js');

    expect(layout.PUBLIC_SHARE_LINK_COPY_FEEDBACK_A11Y_ORDER).toEqual([
      'copy-button',
      'aria-live-feedback',
      'fallback-plain-url',
    ]);
    expect(layout.PUBLIC_SHARE_LINK_COPIED_MESSAGE).toBe('已複製連結。');
    expect(layout.PUBLIC_SHARE_LINK_MANUAL_COPY_MESSAGE).toContain('下方完整網址');
    expect(layout.PUBLIC_SHARE_LINK_FALLBACK_URL_ARIA_LABEL).toContain('完整網址');
  });

  it('creates aria-live feedback with atomic status semantics', async () => {
    const layout = await loadModule('public/frontend/public-share-link-layout.js');
    const feedback = layout.createPublicShareLinkFeedback(
      {
        createElement() {
          return {
            className: '',
            id: '',
            attributes: new Map<string, string>(),
            setAttribute(name: string, value: string) {
              this.attributes.set(name, value);
              if (name === 'id') {
                this.id = value;
              }
            },
          };
        },
      },
      { id: 'mvp-share-link-row-0-feedback' },
    );

    expect(feedback.attributes.get('role')).toBe('status');
    expect(feedback.attributes.get('aria-live')).toBe('polite');
    expect(feedback.attributes.get('aria-atomic')).toBe('true');
    expect(feedback.id).toBe('mvp-share-link-row-0-feedback');
  });

  it('applies polite success and assertive failure copy feedback states', async () => {
    const layout = await loadModule('public/frontend/public-share-link-layout.js');
    const feedback = {
      textContent: '',
      attributes: new Map<string, string>(),
      setAttribute(name: string, value: string) {
        this.attributes.set(name, value);
      },
    };

    layout.applyShareLinkCopyFeedback(feedback, { ok: true, method: 'clipboard' });
    expect(feedback.textContent).toBe('已複製連結。');
    expect(feedback.attributes.get('data-copy-state')).toBe('success');
    expect(feedback.attributes.get('aria-live')).toBe('polite');

    layout.applyShareLinkCopyFeedback(feedback, { ok: false, method: 'none' });
    expect(feedback.textContent).toContain('下方完整網址');
    expect(feedback.attributes.get('data-copy-state')).toBe('failure');
    expect(feedback.attributes.get('aria-live')).toBe('assertive');
  });

  it('wires copy button describedby and keyboard-focusable fallback URL', async () => {
    const layout = await loadModule('public/frontend/public-share-link-layout.js');
    const documentObject = {
      createElement(tagName: string) {
        const element = {
          tagName,
          className: '',
          textContent: '',
          id: '',
          _tabIndex: -1,
          get tabIndex() {
            return this._tabIndex;
          },
          set tabIndex(value: number) {
            this._tabIndex = value;
          },
          attributes: new Map<string, string>(),
          children: [] as Array<ReturnType<typeof documentObject.createElement>>,
          focus: vi.fn(),
          append(child: ReturnType<typeof documentObject.createElement>) {
            this.children.push(child);
          },
          setAttribute(name: string, value: string) {
            this.attributes.set(name, value);
            if (name === 'id') {
              this.id = value;
            }
          },
          addEventListener() {},
        };
        return element;
      },
    };
    const host = documentObject.createElement('div');

    layout.renderPublicShareLinkRow(documentObject, host, {
      label: '投票連結（分享給參與者）',
      url: 'https://example.test/vote/demo',
      copyButtonLabel: '複製投票連結',
      copyButtonAriaLabel: '複製投票頁完整網址到剪貼簿',
    });

    const row = host.children[0]!;
    expect(childOrder(row)).toEqual([
      'link-label',
      'copy-button',
      'inline-feedback',
      'fallback-url',
    ]);

    const button = row.children.find((child) => child.className.includes('copy-link-button'));
    const feedback = row.children.find((child) =>
      child.className.includes('mvp-public-share-link-feedback'),
    );
    const urlCode = row.children.find((child) =>
      child.className.split(/\s+/).includes('share-url'),
    );

    expect(button?.attributes.get('aria-describedby')).toContain(feedback?.id);
    expect(button?.attributes.get('aria-describedby')).toContain(urlCode?.id);
    expect(urlCode?.tabIndex).toBe(0);
    expect(urlCode?.attributes.get('aria-label')).toContain('完整網址');
  });

  it('re-exports unified share feedback constants from public-mvp-ui', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const layout = await loadModule('public/frontend/public-share-link-layout.js');

    expect(publicUi.PUBLIC_SHARE_LINK_COPIED_MESSAGE).toBe(layout.PUBLIC_SHARE_LINK_COPIED_MESSAGE);
    expect(publicUi.PUBLIC_MY_POLLS_VOTE_LINK_COPIED_MESSAGE).toBe(
      layout.PUBLIC_SHARE_LINK_COPIED_MESSAGE,
    );
    expect(publicUi.PUBLIC_MY_POLLS_VOTE_LINK_COPY_FAILED_MESSAGE).toBe(
      layout.PUBLIC_SHARE_LINK_MANUAL_COPY_MESSAGE,
    );
  });

  it('styles copy feedback states and focus outlines in CSS', async () => {
    const css = await readFile(join(process.cwd(), 'public/frontend/public-mvp.css'), 'utf8');
    const phase248 = css.slice(css.indexOf('Phase 248'), css.indexOf('Phase 250'));
    const phase250 = css.slice(css.indexOf('Phase 250'));

    expect(phase248).toContain(".mvp-public-share-link-feedback[data-copy-state='success']");
    expect(phase248).toContain(".mvp-public-share-link-feedback[data-copy-state='failure']");
    expect(phase250).toContain('.mvp-public-share-link-row .share-url:focus-visible');
    expect(phase250).toContain('.mvp-public-share-link-row .copy-link-button:focus-visible');
  });

  it('keeps touched modules free of storage, tracking, and backend echo', async () => {
    for (const relativePath of TOUCHED_MODULES) {
      if (!relativePath.endsWith('.js')) {
        continue;
      }
      const source = stripJsComments(
        await readFile(join(process.cwd(), relativePath), 'utf8'),
      );
      expect(source, relativePath).not.toMatch(FORBIDDEN_STORAGE);
      expect(source, relativePath).not.toMatch(FORBIDDEN_TRACKING);
      expect(source, relativePath).not.toMatch(FORBIDDEN_BACKEND_ECHO);
    }
  });
});
