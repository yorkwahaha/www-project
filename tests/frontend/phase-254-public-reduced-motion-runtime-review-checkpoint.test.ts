import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_254_DOC =
  'docs/www-project-phase-254-public-reduced-motion-runtime-review-checkpoint-v1.md';

const PUBLIC_MVP_CSS = 'public/frontend/public-mvp.css';

const PHASE_253_BASELINE_TESTS = [
  'tests/frontend/phase-253-public-page-reduced-motion-css-only-polish.test.ts',
  'tests/docs/phase-253-public-page-reduced-motion-css-only-polish-doc.test.ts',
] as const;

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

const FORBIDDEN_TRACKING = /analytics|datadog|sentry|apm|trackEvent|gtag\(/i;

const FORBIDDEN_MOTION_RUNTIME =
  /requestAnimationFrame|scrollIntoView\s*\(\s*\{[^}]*behavior\s*:\s*['"]smooth|prefers-reduced-motion/i;

const FORBIDDEN_KEYBOARD_BEHAVIOR =
  /focusTrap|focus-trap|addEventListener\(\s*['"]keydown['"]|roving/i;

function stripJsComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

function cssBeforePhase253(css: string) {
  const marker = css.indexOf('Phase 253');
  return marker === -1 ? css : css.slice(0, marker);
}

function phase253Block(css: string) {
  return css.slice(css.indexOf('Phase 253'));
}

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 254 public reduced motion runtime review checkpoint', () => {
  it('documents Phase 254 review checkpoint in README with APPROVED conclusion', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_254_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(doc).toContain('Phase 254');
    expect(doc).toContain('Public Reduced Motion Runtime Review Checkpoint');
    expect(doc).toContain('751a0c7');
    expect(doc).toContain('Phase 253');
    expect(doc).toContain('review checkpoint');
    expect(doc).toContain('No runtime change');
    expect(doc).toContain('APPROVED');
    expect(doc).toContain('no runtime/API/DB/backend/auth/vote/result/creator/profile/privacy drift');

    expect(readme).toContain('Phase 254');
    expect(readme).toContain(PHASE_254_DOC);
    expect(readme).toContain('Public reduced motion runtime review checkpoint');
  });

  it('keeps Phase 253 baseline guard tests present', async () => {
    for (const relativePath of PHASE_253_BASELINE_TESTS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source.length).toBeGreaterThan(0);
    }
  });

  it('reviews Phase 253 reduced motion CSS block as presentation-only', async () => {
    const css = await readFile(join(process.cwd(), PUBLIC_MVP_CSS), 'utf8');
    const phase253 = phase253Block(css);
    const baseCss = cssBeforePhase253(css);

    expect(phase253).toContain('@media (prefers-reduced-motion: reduce)');
    expect(phase253).toContain('transition: none');
    expect(phase253).toContain('animation: none');
    expect(phase253).toContain('scroll-behavior: auto');
    expect(phase253).toContain('.mvp-help-tip');
    expect(phase253).toContain('.mvp-faq-question::before');
    expect(phase253).not.toContain('scroll-behavior: smooth');
    expect(phase253).not.toMatch(/\bdisplay\s*:/);
    expect(phase253).not.toMatch(/\bvisibility\s*:/);

    expect(baseCss).not.toContain('@keyframes');
    expect(baseCss).not.toMatch(/\banimation\s*:/);
    expect(baseCss).not.toContain('scroll-behavior');
  });

  it('reviews public frontend JS runtime free of Phase 253/254 motion helpers', async () => {
    for (const relativePath of PUBLIC_FRONTEND_RUNTIME_MODULES) {
      const raw = await readFile(join(process.cwd(), relativePath), 'utf8');
      const source = stripJsComments(raw);
      expect(source, relativePath).not.toContain('Phase 253');
      expect(source, relativePath).not.toContain('Phase 254');
      expect(source, relativePath).not.toMatch(FORBIDDEN_STORAGE);
      expect(source, relativePath).not.toMatch(FORBIDDEN_TRACKING);
      expect(source, relativePath).not.toMatch(FORBIDDEN_MOTION_RUNTIME);
      expect(source, relativePath).not.toMatch(FORBIDDEN_KEYBOARD_BEHAVIOR);
    }
  });

  it('keeps registration boundary off auto-login, Set-Cookie, and GET /users/me on submit', async () => {
    const registration = await loadModule('public/frontend/registration-page.js');
    const registrationSource = await readFile(
      join(process.cwd(), 'public/frontend/registration-page.js'),
      'utf8',
    );
    const fetchCalls: string[] = [];
    const fetchImpl = vi.fn(async (url: string) => {
      fetchCalls.push(String(url));
      return { status: 201 };
    });

    await registration.submitRegistrationRequest({
      profile: {
        display_name: 'Reduced Motion Review User',
        birth_year_month: '1998-07',
        residential_region: 'TW-TPE',
      },
      credential: 'proof',
      fetchImpl,
    });

    expect(fetchCalls).toEqual(['/registration']);
    expect(registrationSource).not.toContain('Phase 253');
    expect(registrationSource).not.toContain('Phase 254');
  });

  it('keeps vote-by-index payload boundary after Phase 253', async () => {
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
    expect(voteSource).not.toContain('Phase 253');
    expect(voteSource).not.toContain('Phase 254');
  });

  it('keeps quality_badge presentation gate and non-ranking use', async () => {
    const badge = await loadModule('public/frontend/quality-feedback-badge.js');
    const badgeSource = await readFile(
      join(process.cwd(), 'public/frontend/quality-feedback-badge.js'),
      'utf8',
    );

    expect(badge.QUALITY_FEEDBACK_BADGE_LABEL).toBe('回饋良好');
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: 'positive_feedback' })).toBe(
      true,
    );
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: null })).toBe(false);
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: 'unexpected' })).toBe(false);
    expect(badgeSource).not.toContain('Phase 253');
    expect(badgeSource).not.toContain('Phase 254');
  });

  it('does not mark Phase 254 changes on protected backend paths', async () => {
    for (const relativePath of PROTECTED_BACKEND_PATHS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 254');
      expect(source, relativePath).not.toContain('Phase 253');
    }
  });
});
