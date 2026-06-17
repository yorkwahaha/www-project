import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_252_DOC =
  'docs/www-project-phase-252-public-page-reduced-motion-safety-polish-plan-v1.md';

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

describe('Phase 252 public page reduced motion / motion safety polish plan', () => {
  it('documents Phase 252 plan-only scope in README', async () => {
    const plan = await readFile(join(process.cwd(), PHASE_252_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(plan).toContain('plan only');
    expect(plan).toContain('Phase 253');
    expect(readme).toContain('Phase 252');
    expect(readme).toContain(PHASE_252_DOC);
  });

  it('keeps Phase 252 as plan-only without runtime module or CSS delivery markers', async () => {
    const css = await readFile(join(process.cwd(), PUBLIC_MVP_CSS), 'utf8');

    expect(css).not.toContain('Phase 252');

    for (const relativePath of PUBLIC_FRONTEND_RUNTIME_MODULES) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 252');
      expect(source, relativePath).not.toContain('Phase 253');
    }
  });

  it('locks current public CSS motion inventory aligned with plan baseline', async () => {
    const css = await readFile(join(process.cwd(), PUBLIC_MVP_CSS), 'utf8');
    const plan = await readFile(join(process.cwd(), PHASE_252_DOC), 'utf8');
    const cssBaseline = cssBeforePhase253(css);

    // Phase 301 added the home swipe shell, whose only motion is a calm
    // loading-skeleton shimmer (@keyframes home-swipe-shimmer) disabled under
    // prefers-reduced-motion. Exclude that home-only block from the base-level
    // motion-inventory baseline this plan locks.
    const phase301Start = cssBaseline.indexOf('Phase 301 — home swipe card visual shell');
    const baselineBeforePhase301 =
      phase301Start === -1 ? cssBaseline : cssBaseline.slice(0, phase301Start);

    expect(cssBaseline).toContain('transition: opacity 0.12s ease');
    expect(cssBaseline).toContain('transition: transform 0.15s ease');
    expect(cssBaseline).toContain('@media (prefers-reduced-motion: reduce)');
    expect(cssBaseline).toContain('transition: none');
    expect(baselineBeforePhase301).not.toContain('@keyframes');
    expect(baselineBeforePhase301).not.toContain('scroll-behavior');
    expect(baselineBeforePhase301).not.toMatch(/\banimation\s*:/);

    expect(plan).toContain('.mvp-help-tip');
    expect(plan).toContain('.mvp-faq-question::before');
    expect(plan).toContain('Phase 161');
  });

  it('authorizes future CSS-only reduced motion polish via prefers-reduced-motion in plan', async () => {
    const plan = await readFile(join(process.cwd(), PHASE_252_DOC), 'utf8');

    expect(plan).toContain('@media (prefers-reduced-motion: reduce)');
    expect(plan).toContain('lower or remove non-essential motion');
    expect(plan).toContain('must **not** change');
    expect(plan).toContain('layout structure');
    expect(plan).toContain('public/frontend/public-mvp.css');
    expect(plan).toContain('does **not** approve Phase 253 implementation');
  });

  it('keeps vote-by-index payload boundary unchanged during plan phase', async () => {
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

  it('keeps quality_badge presentation gate documented and unchanged', async () => {
    const badge = await loadModule('public/frontend/quality-feedback-badge.js');
    const plan = await readFile(join(process.cwd(), PHASE_252_DOC), 'utf8');

    expect(badge.QUALITY_FEEDBACK_BADGE_LABEL).toBe('回饋良好');
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: 'positive_feedback' })).toBe(
      true,
    );
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: null })).toBe(false);
    expect(plan).toContain('positive_feedback');
    expect(plan).toContain('ranking');
    expect(plan).toContain('recommendation');
  });

  it('does not mark Phase 252 changes on protected backend paths', async () => {
    for (const relativePath of PROTECTED_BACKEND_PATHS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8').catch(() => '');
      if (!source) {
        continue;
      }
      expect(source, relativePath).not.toContain('Phase 252');
      expect(source, relativePath).not.toContain('Phase 253');
    }
  });
});
