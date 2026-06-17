import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_253_DOC =
  'docs/www-project-phase-253-public-page-reduced-motion-css-only-polish-v1.md';

const PUBLIC_MVP_CSS = 'public/frontend/public-mvp.css';

const PUBLIC_FRONTEND_RUNTIME_MODULES = [
  'public/frontend/vote-page.js',
  'public/frontend/result-page.js',
  'public/frontend/login-page.js',
  'public/frontend/registration-page.js',
  'public/frontend/profile-page.js',
  'public/frontend/create-poll-page.js',
  'public/frontend/my-polls-page.js',
  'public/frontend/explore-page.js',
  'public/frontend/public-mvp-ui.js',
  'public/frontend/public-keyboard-focus-a11y.js',
  'public/frontend/public-share-link-layout.js',
] as const;

const PROTECTED_BACKEND_PATHS = [
  'src/polls/repository.ts',
  'src/http/official-vote-routes.ts',
  'src/auth/user-auth-resolver.ts',
  'migrations',
] as const;

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

function cssBeforePhase253(css: string) {
  const marker = css.indexOf('Phase 253');
  return marker === -1 ? css : css.slice(0, marker);
}

function phase253Block(css: string) {
  return css.slice(css.indexOf('Phase 253'));
}

describe('Phase 253 public page reduced motion CSS-only polish', () => {
  it('documents Phase 253 in README and phase doc', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_253_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(doc).toContain('Phase 253');
    expect(readme).toContain('Phase 253');
    expect(readme).toContain(PHASE_253_DOC);
  });

  it('delivers Phase 253 reduced motion media query with transition disabled', async () => {
    const css = await readFile(join(process.cwd(), PUBLIC_MVP_CSS), 'utf8');
    const phase253 = phase253Block(css);

    expect(phase253).toContain('@media (prefers-reduced-motion: reduce)');
    expect(phase253).toContain('.mvp-faq-question::before');
    expect(phase253).toContain('.mvp-help-tip');
    expect(phase253).toContain('transition: none');
    expect(phase253).toContain('animation: none');
    expect(phase253).toContain('scroll-behavior: auto');
  });

  it('does not add new base-level keyframes, animation, or scroll-behavior motion', async () => {
    const css = await readFile(join(process.cwd(), PUBLIC_MVP_CSS), 'utf8');
    const baseCss = cssBeforePhase253(css);
    // Phase 301 added the home swipe shell, whose only motion is a calm
    // loading-skeleton shimmer (@keyframes home-swipe-shimmer) that is disabled
    // under prefers-reduced-motion. Exclude that home-only block from the
    // base-level motion-inventory baseline.
    const phase301Start = baseCss.indexOf('Phase 301 — home swipe card visual shell');
    const baseBeforePhase301 =
      phase301Start === -1 ? baseCss : baseCss.slice(0, phase301Start);

    expect(baseBeforePhase301).not.toContain('@keyframes');
    expect(baseBeforePhase301).not.toMatch(/\banimation\s*:/);
    expect(baseBeforePhase301).not.toContain('scroll-behavior');

    // The Phase 301 skeleton shimmer must stay reduced-motion-guarded.
    expect(baseCss).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*home-swipe-skeleton[\s\S]*animation:\s*none/,
    );
  });

  it('keeps existing motion sources and Phase 161 reduced-motion baseline', async () => {
    const css = await readFile(join(process.cwd(), PUBLIC_MVP_CSS), 'utf8');

    expect(css).toContain('transition: opacity 0.12s ease');
    expect(css).toContain('transition: transform 0.15s ease');
    expect(css).toContain('Phase 161');
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*\.mvp-help-tip[\s\S]*transition: none/);
  });

  it('does not modify public frontend JS runtime modules', async () => {
    for (const relativePath of PUBLIC_FRONTEND_RUNTIME_MODULES) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 253');
    }
  });

  it('keeps vote-by-index payload boundary unchanged', async () => {
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

  it('keeps quality_badge presentation gate unchanged', async () => {
    const badge = await loadModule('public/frontend/quality-feedback-badge.js');

    expect(badge.QUALITY_FEEDBACK_BADGE_LABEL).toBe('回饋良好');
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: 'positive_feedback' })).toBe(
      true,
    );
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: null })).toBe(false);
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: 'unexpected' })).toBe(false);
  });

  it('does not mark Phase 253 changes on protected backend paths', async () => {
    for (const relativePath of PROTECTED_BACKEND_PATHS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8').catch(() => '');
      if (!source) {
        continue;
      }
      expect(source, relativePath).not.toContain('Phase 253');
    }
  });
});
