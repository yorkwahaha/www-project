import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_251_DOC =
  'docs/www-project-phase-251-public-keyboard-focus-runtime-review-checkpoint-v1.md';

const FOCUS_A11Y_MODULE = 'public/frontend/public-keyboard-focus-a11y.js';

const PHASE_250_BASELINE_TESTS = [
  'tests/frontend/phase-250-public-page-keyboard-focus-polish.test.ts',
  'tests/docs/phase-250-public-page-keyboard-focus-polish-doc.test.ts',
  'tests/frontend/public-mvp-a11y.test.ts',
] as const;

const PHASE_250_TOUCHED_MODULES = [
  'public/frontend/public-keyboard-focus-a11y.js',
  'public/frontend/public-mvp-ui.js',
  'public/frontend/public-mvp.css',
] as const;

const PHASE_250_RUNTIME_PAGES = [
  'public/frontend/vote-page.js',
  'public/frontend/result-page.js',
  'public/frontend/login-page.js',
  'public/frontend/registration-page.js',
  'public/frontend/profile-page.js',
  'public/frontend/create-poll-page.js',
  'public/frontend/my-polls-page.js',
] as const;

const PROTECTED_BACKEND_PATHS = [
  'src/http/official-vote-routes.ts',
  'src/http/creator-poll-routes.ts',
  'src/http/creator-session-routes.ts',
  'src/http/poll-routes.ts',
  'src/http/login-session-routes.ts',
  'src/http/registration-routes.ts',
  'src/auth/user-auth-resolver.ts',
  'src/polls/repository.ts',
] as const;

const FORBIDDEN_STORAGE = /localStorage|sessionStorage|indexedDB|document\.cookie/i;

const FORBIDDEN_TRACKING =
  /analytics|datadog|sentry|apm|trackEvent|gtag\(|share_token|utm_/i;

const FORBIDDEN_FOCUS_BEHAVIOR =
  /focusTrap|focus-trap|addEventListener\(\s*['"]keydown['"]|\.focus\s*\(/i;

const FORBIDDEN_QUALITY_MISUSE =
  /ranking|recommend|personaliz|trust_score|governance_score|quality_badge.*sort|sort.*quality_badge/i;

function stripJsComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 251 public keyboard focus runtime review checkpoint', () => {
  it('documents Phase 251 review checkpoint in README with APPROVED conclusion', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_251_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(doc).toContain('Phase 251');
    expect(doc).toContain('Public Keyboard Focus Runtime Review Checkpoint');
    expect(doc).toContain('e998baf');
    expect(doc).toContain('Phase 250');
    expect(doc).toContain('review checkpoint');
    expect(doc).toContain('No runtime change');
    expect(doc).toContain('APPROVED');
    expect(doc).toContain('no runtime/API/DB/backend/auth/vote/result/creator/profile/privacy drift');

    expect(readme).toContain('Phase 251');
    expect(readme).toContain(PHASE_251_DOC);
    expect(readme).toContain('Public keyboard focus runtime review checkpoint');
  });

  it('keeps Phase 250 baseline guard tests present', async () => {
    for (const relativePath of PHASE_250_BASELINE_TESTS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source.length).toBeGreaterThan(0);
    }
  });

  it('reviews public-keyboard-focus-a11y.js as constants-only presentation helper', async () => {
    const focusA11y = await loadModule(FOCUS_A11Y_MODULE);
    const source = stripJsComments(await readFile(join(process.cwd(), FOCUS_A11Y_MODULE), 'utf8'));

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
    expect(Object.keys(focusA11y.PUBLIC_KEYBOARD_FOCUS_SELECTOR_MAP).sort()).toEqual([
      'destructive-action',
      'feedback-error-link',
      'form-submit',
      'primary-cta',
      'secondary-cta',
      'share-copy-button',
      'share-fallback-url',
    ]);
    expect(focusA11y.PUBLIC_KEYBOARD_FOCUS_FEEDBACK_REGION_CLASS).toBe('mvp-keyboard-focus-feedback');
    expect(focusA11y.PUBLIC_KEYBOARD_FOCUS_ERROR_PANEL_CLASS).toBe('mvp-keyboard-focus-error-panel');

    expect(source).not.toMatch(/\bfunction\b|\bfetch\s*\(|\baddEventListener\b/);
    expect(source).not.toMatch(FORBIDDEN_STORAGE);
    expect(source).not.toMatch(FORBIDDEN_TRACKING);
    expect(source).not.toMatch(FORBIDDEN_FOCUS_BEHAVIOR);
  });

  it('reviews public-mvp-ui keyboard focus re-exports only', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const focusA11y = await loadModule(FOCUS_A11Y_MODULE);
    const mvpUiSource = await readFile(
      join(process.cwd(), 'public/frontend/public-mvp-ui.js'),
      'utf8',
    );

    expect(publicUi.PUBLIC_KEYBOARD_FOCUS_INTERACTIVE_ORDER).toEqual(
      focusA11y.PUBLIC_KEYBOARD_FOCUS_INTERACTIVE_ORDER,
    );
    expect(publicUi.PUBLIC_KEYBOARD_FOCUS_SELECTOR_MAP).toEqual(
      focusA11y.PUBLIC_KEYBOARD_FOCUS_SELECTOR_MAP,
    );
    expect(mvpUiSource).toContain("from './public-keyboard-focus-a11y.js'");
    expect(mvpUiSource).not.toContain('Phase 251');
  });

  it('reviews Phase 250 CSS as focus-visible and focus-within styling only', async () => {
    const css = await readFile(join(process.cwd(), 'public/frontend/public-mvp.css'), 'utf8');
    const phase250 = css.slice(css.indexOf('Phase 250'));

    expect(phase250).toContain('--mvp-focus-shadow');
    expect(phase250).toContain('--mvp-focus-on-accent-shadow');
    expect(phase250).toContain('--mvp-focus-danger-shadow');
    expect(phase250).toContain(':focus-visible');
    expect(phase250).toContain(':focus-within');
    expect(phase250).toContain('.mvp-btn-primary:focus-visible');
    expect(phase250).toContain('.mvp-error-panel:focus-within');
    expect(phase250).not.toMatch(/\bfetch\b|addEventListener|localStorage|sessionStorage/);
  });

  it('keeps Phase 250 touched modules free of storage, tracking, and forbidden focus behavior', async () => {
    for (const relativePath of PHASE_250_TOUCHED_MODULES) {
      const raw = await readFile(join(process.cwd(), relativePath), 'utf8');
      const source = relativePath.endsWith('.js') ? stripJsComments(raw) : raw;

      expect(source, relativePath).not.toMatch(FORBIDDEN_STORAGE);
      expect(source, relativePath).not.toMatch(FORBIDDEN_TRACKING);
      if (relativePath.endsWith('.js')) {
        expect(source, relativePath).not.toMatch(FORBIDDEN_FOCUS_BEHAVIOR);
      }
    }
  });

  it('does not mark Phase 250 changes on public page runtime handlers', async () => {
    for (const relativePath of PHASE_250_RUNTIME_PAGES) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 250');
      expect(source, relativePath).not.toContain('public-keyboard-focus-a11y');
      expect(source, relativePath).not.toContain('PUBLIC_KEYBOARD_FOCUS_');
    }
  });

  it('keeps vote-by-index payload boundary after Phase 250', async () => {
    const votePage = await loadModule('public/frontend/vote-page.js');
    const voteSource = await readFile(join(process.cwd(), 'public/frontend/vote-page.js'), 'utf8');
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
    expect(voteSource).toContain('vote-by-index');
    expect(voteSource).not.toContain('Phase 250');
    expect(voteSource).not.toContain('Phase 251');
  });

  it('keeps quality_badge presentation gate and non-ranking use', async () => {
    const badge = await loadModule('public/frontend/quality-feedback-badge.js');
    const badgeSource = await readFile(
      join(process.cwd(), 'public/frontend/quality-feedback-badge.js'),
      'utf8',
    );
    const pollCardSource = await readFile(
      join(process.cwd(), 'public/frontend/public-poll-card.js'),
      'utf8',
    );

    expect(badge.QUALITY_FEEDBACK_BADGE_LABEL).toBe('回饋良好');
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: 'positive_feedback' })).toBe(
      true,
    );
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: null })).toBe(false);
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: 'unexpected' })).toBe(false);
    expect(badgeSource).not.toMatch(FORBIDDEN_QUALITY_MISUSE);
    expect(pollCardSource).toContain('renderQualityFeedbackBadge');
    expect(pollCardSource).not.toMatch(FORBIDDEN_QUALITY_MISUSE);
  });

  it('does not mark Phase 251 changes on protected backend paths', async () => {
    for (const relativePath of PROTECTED_BACKEND_PATHS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 251');
      expect(source, relativePath).not.toContain('Phase 250');
    }
  });
});
