import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_249_DOC =
  'docs/www-project-phase-249-public-share-link-accessibility-runtime-review-checkpoint-v1.md';

const SHARE_LAYOUT_MODULE = 'public/frontend/public-share-link-layout.js';

const PHASE_248_BASELINE_TESTS = [
  'tests/frontend/phase-248-public-copy-feedback-accessibility-polish.test.ts',
  'tests/docs/phase-248-public-copy-feedback-accessibility-polish-doc.test.ts',
  'tests/frontend/public-mvp-a11y.test.ts',
] as const;

const PROTECTED_BACKEND_PATHS = [
  'src/http/official-vote-routes.ts',
  'src/http/creator-poll-routes.ts',
  'src/http/creator-session-routes.ts',
  'src/http/poll-routes.ts',
  'src/auth/user-auth-resolver.ts',
] as const;

const FORBIDDEN_STORAGE = /localStorage|sessionStorage|indexedDB|document\.cookie/i;

const FORBIDDEN_TRACKING =
  /share_token|short_link|qr_code|utm_|analytics|datadog|sentry|apm|trackEvent|gtag\(/i;

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

describe('Phase 249 public share link accessibility runtime review checkpoint', () => {
  it('documents Phase 249 review checkpoint in README with APPROVED conclusion', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_249_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(doc).toContain('Phase 249');
    expect(doc).toContain('Public Share Link Accessibility Runtime Review Checkpoint');
    expect(doc).toContain('cd43f82');
    expect(doc).toContain('Phase 248');
    expect(doc).toContain('review checkpoint');
    expect(doc).toContain('No runtime change');
    expect(doc).toContain('APPROVED');
    expect(doc).toContain('no runtime/API/DB/backend/auth/vote/result/creator/profile/privacy drift');

    expect(readme).toContain('Phase 249');
    expect(readme).toContain(PHASE_249_DOC);
    expect(readme).toContain('Public share link accessibility runtime review checkpoint');
  });

  it('keeps Phase 248 baseline guard tests present', async () => {
    for (const relativePath of PHASE_248_BASELINE_TESTS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source.length).toBeGreaterThan(0);
    }
  });

  it('reviews applyShareLinkCopyFeedback polite success and assertive failure states', async () => {
    const layout = await loadModule(SHARE_LAYOUT_MODULE);
    const feedback = {
      textContent: '',
      attributes: new Map<string, string>(),
      setAttribute(name: string, value: string) {
        this.attributes.set(name, value);
      },
    };

    layout.applyShareLinkCopyFeedback(feedback, { ok: true, method: 'clipboard' });
    expect(feedback.textContent).toBe(layout.PUBLIC_SHARE_LINK_COPIED_MESSAGE);
    expect(feedback.attributes.get('data-copy-state')).toBe('success');
    expect(feedback.attributes.get('aria-live')).toBe('polite');

    layout.applyShareLinkCopyFeedback(feedback, { ok: false, method: 'prompt' });
    expect(feedback.textContent).toBe(layout.PUBLIC_SHARE_LINK_PROMPT_MESSAGE);
    expect(feedback.attributes.get('data-copy-state')).toBe('prompt');
    expect(feedback.attributes.get('aria-live')).toBe('assertive');

    layout.applyShareLinkCopyFeedback(feedback, { ok: false, method: 'none' });
    expect(feedback.textContent).toBe(layout.PUBLIC_SHARE_LINK_MANUAL_COPY_MESSAGE);
    expect(feedback.attributes.get('data-copy-state')).toBe('failure');
    expect(feedback.attributes.get('aria-live')).toBe('assertive');
  });

  it('reviews copy feedback a11y order and status region semantics', async () => {
    const layout = await loadModule(SHARE_LAYOUT_MODULE);

    expect(layout.PUBLIC_SHARE_LINK_COPY_FEEDBACK_A11Y_ORDER).toEqual([
      'copy-button',
      'aria-live-feedback',
      'fallback-plain-url',
    ]);

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
  });

  it('reviews failed-copy focus fallback without storage or tracking', async () => {
    const layout = await loadModule(SHARE_LAYOUT_MODULE);
    const layoutSource = stripJsComments(
      await readFile(join(process.cwd(), SHARE_LAYOUT_MODULE), 'utf8'),
    );

    expect(layoutSource).toContain('code.focus()');
    expect(layoutSource).not.toMatch(FORBIDDEN_STORAGE);
    expect(layoutSource).not.toMatch(FORBIDDEN_TRACKING);
    expect(layoutSource).not.toMatch(FORBIDDEN_BACKEND_ECHO);

    const focus = vi.fn();
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
          focus,
          append(child: ReturnType<typeof documentObject.createElement>) {
            this.children.push(child);
          },
          setAttribute(name: string, value: string) {
            this.attributes.set(name, value);
            if (name === 'id') {
              this.id = value;
            }
          },
          addEventListener(_name: string, listener: () => void) {
            if (tagName === 'button') {
              element.click = listener;
            }
          },
          click: async () => {},
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
    const button = row.children.find((child) => child.className.includes('copy-link-button'));
    await button?.click();

    expect(focus).toHaveBeenCalledTimes(1);
  });

  it('reviews public-mvp-ui copy message re-exports only', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const layout = await loadModule(SHARE_LAYOUT_MODULE);
    const mvpUiSource = await readFile(
      join(process.cwd(), 'public/frontend/public-mvp-ui.js'),
      'utf8',
    );

    expect(publicUi.PUBLIC_SHARE_LINK_COPIED_MESSAGE).toBe(layout.PUBLIC_SHARE_LINK_COPIED_MESSAGE);
    expect(publicUi.PUBLIC_MY_POLLS_VOTE_LINK_COPIED_MESSAGE).toBe(
      layout.PUBLIC_SHARE_LINK_COPIED_MESSAGE,
    );
    expect(publicUi.PUBLIC_MY_POLLS_VOTE_LINK_COPY_FAILED_MESSAGE).toBe(
      layout.PUBLIC_SHARE_LINK_MANUAL_COPY_MESSAGE,
    );
    expect(mvpUiSource).toContain("from './public-share-link-layout.js'");
    expect(mvpUiSource).not.toContain('Phase 249');
  });

  it('reviews public-mvp-demo aria-atomic adjustment as presentation/a11y only', async () => {
    const demoSource = await readFile(join(process.cwd(), 'public/frontend/public-mvp-demo.js'), 'utf8');
    expect(demoSource).toContain("setAttribute('aria-atomic', 'true')");
    const phase248DemoSnippet = demoSource.slice(
      demoSource.indexOf('showDemoOnlyFeedback'),
      demoSource.indexOf('export const RESULT_UI_STATE_PREVIEW_LINKS'),
    );

    expect(phase248DemoSnippet).toContain("setAttribute('role', 'status')");
    expect(phase248DemoSnippet).not.toMatch(/\bfetch\s*\(/);
    expect(phase248DemoSnippet).not.toMatch(FORBIDDEN_STORAGE);
    expect(phase248DemoSnippet).not.toMatch(FORBIDDEN_TRACKING);
  });

  it('reviews Phase 248 CSS as visual/a11y only', async () => {
    const css = await readFile(join(process.cwd(), 'public/frontend/public-mvp.css'), 'utf8');
    const phase248 = css.slice(css.indexOf('Phase 248'), css.indexOf('Phase 210'));

    expect(phase248).toContain("[data-copy-state='success']");
    expect(phase248).toContain("[data-copy-state='failure']");
    expect(phase248).toContain('.mvp-public-share-link-row .share-url:focus');
    expect(phase248).toContain('.copy-link-button:focus-visible');
    expect(phase248).not.toMatch(/\bfetch\b|addEventListener|localStorage|sessionStorage/);
  });

  it('keeps vote-by-index payload boundary after Phase 248', async () => {
    const voteSource = await readFile(join(process.cwd(), 'public/frontend/vote-page.js'), 'utf8');

    expect(voteSource).toContain('vote-by-index');
    expect(voteSource).toContain('option_index: optionIndex');
    expect(voteSource).toContain('syncVotePageShareLinks');
    expect(voteSource).not.toContain('Phase 248');
    expect(voteSource).not.toContain('Phase 249');
  });

  it('does not mark Phase 249 changes on protected backend paths', async () => {
    for (const relativePath of PROTECTED_BACKEND_PATHS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 249');
    }
  });
});
