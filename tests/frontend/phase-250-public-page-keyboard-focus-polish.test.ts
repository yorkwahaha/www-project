import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_250_DOC =
  'docs/www-project-phase-250-public-page-keyboard-focus-polish-v1.md';

const PUBLIC_MVP_CSS = 'public/frontend/public-mvp.css';

const TOUCHED_MODULES = [
  'public/frontend/public-keyboard-focus-a11y.js',
  'public/frontend/public-mvp-ui.js',
  'public/frontend/public-mvp.css',
] as const;

const PROTECTED_BACKEND_PATHS = [
  'src/polls/repository.ts',
  'src/http/official-vote-routes.ts',
  'src/http/vote-by-index.ts',
  'src/auth/user-auth-resolver.ts',
  'migrations',
];

const FORBIDDEN_STORAGE =
  /localStorage|sessionStorage|indexedDB|document\.cookie|analytics|gtag\(/i;

const FORBIDDEN_FOCUS_BEHAVIOR =
  /roving|tabindex\s*=\s*["']-1["']|focusTrap|focus-trap|addEventListener\(\s*['"]keydown['"]/i;

function stripJsComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

function phaseBlock(css: string, marker: string) {
  return css.slice(css.indexOf(marker));
}

describe('Phase 250 public page keyboard focus polish', () => {
  it('documents Phase 250 in README and phase doc', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_250_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(doc).toContain('Phase 250');
    expect(readme).toContain('Phase 250');
    expect(readme).toContain(PHASE_250_DOC);
  });

  it('exports keyboard focus interactive order and selector map', async () => {
    const focusA11y = await loadModule('public/frontend/public-keyboard-focus-a11y.js');

    expect(focusA11y.PUBLIC_KEYBOARD_FOCUS_INTERACTIVE_ORDER).toEqual([
      'skip-link',
      'primary-cta',
      'secondary-cta',
      'form-submit',
      'share-copy-button',
      'share-fallback-url',
      'destructive-action',
      'feedback-error-link',
    ]);
    expect(focusA11y.PUBLIC_KEYBOARD_FOCUS_SELECTOR_MAP['primary-cta']).toContain(
      '.mvp-btn-primary:focus-visible',
    );
    expect(focusA11y.PUBLIC_KEYBOARD_FOCUS_SELECTOR_MAP['destructive-action']).toContain(
      '.my-polls-page .mvp-creator-owned-poll-destructive-toolbar .mvp-btn:focus-visible',
    );
    expect(focusA11y.PUBLIC_KEYBOARD_FOCUS_SELECTOR_MAP['share-fallback-url']).toContain(
      '.mvp-public-share-link-row .share-url:focus-visible',
    );
  });

  it('re-exports keyboard focus constants from public-mvp-ui', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const focusA11y = await loadModule('public/frontend/public-keyboard-focus-a11y.js');

    expect(publicUi.PUBLIC_KEYBOARD_FOCUS_INTERACTIVE_ORDER).toEqual(
      focusA11y.PUBLIC_KEYBOARD_FOCUS_INTERACTIVE_ORDER,
    );
    expect(publicUi.PUBLIC_KEYBOARD_FOCUS_SELECTOR_MAP).toEqual(
      focusA11y.PUBLIC_KEYBOARD_FOCUS_SELECTOR_MAP,
    );
  });

  it('styles primary, secondary, destructive, share, and feedback focus in CSS', async () => {
    const css = await readFile(join(process.cwd(), PUBLIC_MVP_CSS), 'utf8');
    const phase250 = phaseBlock(css, 'Phase 250');

    expect(phase250).toContain('--mvp-focus-shadow');
    expect(phase250).toContain('--mvp-focus-on-accent-shadow');
    expect(phase250).toContain('--mvp-focus-danger-shadow');
    expect(phase250).toContain('.mvp-btn-primary:focus-visible');
    expect(phase250).toContain('.mvp-btn-secondary:focus-visible');
    expect(phase250).toContain(
      '.my-polls-page .mvp-creator-owned-poll-destructive-toolbar .mvp-btn:focus-visible',
    );
    expect(phase250).toContain('.copy-link-button:focus-visible');
    expect(phase250).toContain('.mvp-public-share-link-row .share-url:focus-visible');
    expect(phase250).toContain('#vote-submit:focus-visible');
    expect(phase250).toContain('#create-poll-submit:focus-visible');
    expect(phase250).toContain('.mvp-error-panel a:focus-visible');
    expect(phase250).toContain('.mvp-error-panel:focus-within');
    expect(phase250).toContain('.vote-page #form-message:focus-within:not(:empty)');
  });

  it('keeps Phase 161 global focus-visible baseline intact', async () => {
    const css = await readFile(join(process.cwd(), PUBLIC_MVP_CSS), 'utf8');

    expect(css).toContain(':focus:not(:focus-visible)');
    expect(css).toContain('a:focus-visible');
    expect(css).toContain('button:focus-visible');
    expect(css).toContain('--mvp-focus-width');
    expect(css).toContain('--mvp-focus-offset');
  });

  it('does not mark protected backend paths with Phase 250 changes', async () => {
    for (const relativePath of PROTECTED_BACKEND_PATHS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8').catch(() => '');
      if (!source) {
        continue;
      }
      expect(source, relativePath).not.toContain('Phase 250');
    }
  });

  it('keeps touched modules free of storage, focus traps, and shortcut handlers', async () => {
    for (const relativePath of TOUCHED_MODULES) {
      const raw = await readFile(join(process.cwd(), relativePath), 'utf8');
      const source = relativePath.endsWith('.js') ? stripJsComments(raw) : raw;
      expect(source, relativePath).not.toMatch(FORBIDDEN_STORAGE);
      if (relativePath.endsWith('.js')) {
        expect(source, relativePath).not.toMatch(FORBIDDEN_FOCUS_BEHAVIOR);
      }
    }
  });

  it('keeps vote-by-index body unchanged', async () => {
    const votePage = await loadModule('public/frontend/vote-page.js');
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 201,
      json: async () => ({
        vote_token: 'secret-token',
        option_id: 'secret-option',
        shard_id: 7,
      }),
    }));

    await votePage.submitVoteByIndex({
      pollId: '11111111-1111-4111-8111-111111111111',
      optionIndex: 1,
      userId: '44444444-4444-4444-8444-444444444444',
      fetchImpl,
    });

    const body = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body));
    expect(body).toEqual({ option_index: 1 });
    expect(body).not.toHaveProperty('option_id');
  });
});
