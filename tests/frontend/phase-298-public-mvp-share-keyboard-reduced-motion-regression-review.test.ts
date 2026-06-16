import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

const PHASE_296_DOC =
  'docs/www-project-phase-296-public-mvp-backlog-planning-checkpoint-v1.md';
const PHASE_297_DOC =
  'docs/www-project-phase-297-public-mvp-mobile-375px-spot-check-record-v1.md';
const PHASE_298_DOC =
  'docs/www-project-phase-298-public-mvp-share-keyboard-reduced-motion-regression-review-v1.md';

const PUBLIC_HTML_SHELLS = [
  'public/index.html',
  'public/explore.html',
  'public/faq.html',
  'public/login.html',
  'public/registration.html',
  'public/profile.html',
  'public/create-poll.html',
  'public/my-polls.html',
  'public/vote.html',
  'public/results.html',
] as const;

const SHARE_KEYBOARD_MODULES = [
  'public/frontend/public-share-link-layout.js',
  'public/frontend/public-keyboard-focus-a11y.js',
  'public/frontend/quality-feedback-badge.js',
] as const;

const PROTECTED_BACKEND_PATHS = [
  'src/polls/repository.ts',
  'src/http/official-vote-routes.ts',
  'src/auth/user-auth-resolver.ts',
] as const;

const FORBIDDEN_STORAGE = /localStorage|sessionStorage|indexedDB|document\.cookie/i;
const FORBIDDEN_TRACKING =
  /analytics|datadog|sentry|apm|trackEvent|gtag\(|share_token|utm_/i;

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 298 public MVP share keyboard reduced-motion regression review', () => {
  it('confirms Phase 298 record exists with M-296-02 closure and README index', async () => {
    const checkpoint296 = await readFile(join(process.cwd(), PHASE_296_DOC), 'utf8');
    const record297 = await readFile(join(process.cwd(), PHASE_297_DOC), 'utf8');
    const review298 = await readFile(join(process.cwd(), PHASE_298_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(checkpoint296).toContain('M-296-02');
    expect(record297).toContain('Phase 297');
    expect(review298).toContain('Phase 298');
    expect(review298).toContain('ae66765');
    expect(review298).toContain('CLOSED — regression review PASS');
    expect(review298).toContain('Overall regression review result');
    expect(readme).toContain('Phase 298');
    expect(readme).toContain(PHASE_298_DOC);
  });

  it('keeps Phase 298 as review-only without runtime or HTML delivery markers', async () => {
    for (const relativePath of PUBLIC_HTML_SHELLS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 298');
      expect(source, relativePath).not.toContain('Phase 299');
    }

    for (const relativePath of PROTECTED_BACKEND_PATHS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 298');
    }

    const migrationDir = join(process.cwd(), 'migrations');
    const migrationFiles = await readdir(migrationDir);
    for (const fileName of migrationFiles) {
      const source = await readFile(join(migrationDir, fileName), 'utf8');
      expect(source, `migrations/${fileName}`).not.toContain('Phase 298');
    }
  });

  it('preserves share-link boundaries without storage or tracking', async () => {
    const shareSource = await readFile(
      join(process.cwd(), 'public/frontend/public-share-link-layout.js'),
      'utf8',
    );

    expect(shareSource).toContain('buildPublicVotePath');
    expect(shareSource).toContain('buildPublicResultPath');
    expect(shareSource).toContain('PUBLIC_SHARE_LINK_COPIED_MESSAGE');
    expect(shareSource).not.toMatch(FORBIDDEN_STORAGE);
    expect(shareSource).not.toMatch(FORBIDDEN_TRACKING);
    expect(shareSource).not.toContain('option_id');
    expect(shareSource).not.toContain('option_index');
  });

  it('preserves keyboard focus helper as constants-only documentation', async () => {
    const focus = await loadModule('public/frontend/public-keyboard-focus-a11y.js');

    expect(focus.PUBLIC_KEYBOARD_FOCUS_INTERACTIVE_ORDER).toContain('skip-link');
    expect(focus.PUBLIC_KEYBOARD_FOCUS_INTERACTIVE_ORDER).toContain('share-copy-button');
    expect(
      focus.PUBLIC_KEYBOARD_FOCUS_SELECTOR_MAP['primary-cta'].some((selector: string) =>
        selector.includes(':focus-visible'),
      ),
    ).toBe(true);
    expect(Object.isFrozen(focus.PUBLIC_KEYBOARD_FOCUS_SELECTOR_MAP)).toBe(true);

    const css = await readFile(join(process.cwd(), 'public/frontend/public-mvp.css'), 'utf8');
    expect(css).toContain(':focus:not(:focus-visible)');
    expect(css).toContain(':focus-visible');
    expect(css).toContain('Phase 250 — public page keyboard focus polish');
  });

  it('preserves reduced-motion CSS guards', async () => {
    const css = await readFile(join(process.cwd(), 'public/frontend/public-mvp.css'), 'utf8');

    const reducedMotionBlocks = css.match(/@media \(prefers-reduced-motion: reduce\)/g);
    expect(reducedMotionBlocks?.length).toBeGreaterThanOrEqual(2);
    expect(css).toContain('Phase 253 — public page reduced motion CSS-only polish');
    expect(css).toContain('scroll-behavior: auto');
    expect(css).not.toContain('scroll-behavior: smooth');
  });

  it('keeps skip-link and main-content landmarks on primary HTML shells', async () => {
    for (const relativePath of PUBLIC_HTML_SHELLS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).toContain('skip-link');
      expect(source, relativePath).toContain('id="main-content"');
    }
  });

  it('keeps quality_badge presentation-only boundary unchanged', async () => {
    const badge = await loadModule('public/frontend/quality-feedback-badge.js');

    expect(badge.QUALITY_FEEDBACK_BADGE_LABEL).toBe('回饋良好');
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: 'positive_feedback' })).toBe(
      true,
    );
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: null })).toBe(false);
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: 'unexpected' })).toBe(false);
    expect(badge.shouldRenderQualityFeedbackBadge({})).toBe(false);
  });

  it('records PASS regression results and no runtime fixes in Phase 298 doc', async () => {
    const review298 = await readFile(join(process.cwd(), PHASE_298_DOC), 'utf8');

    expect(review298).toContain('no CSS / layout change');
    expect(review298).toContain('no copy change');
    expect(review298).toContain('Share regression | **PASS**');
    expect(review298).toContain('Keyboard regression | **PASS**');
    expect(review298).toContain('Reduced-motion regression | **PASS**');
    expect(review298).toContain('NOT EXECUTED');
    expect(review298).toContain('NOT COMPLETED');
    expect(review298).not.toContain('runtime fix applied');
    expect(review298).not.toContain('CSS changed');
  });

  it('indexes regression review in README without claiming deployment', async () => {
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(readme).toContain('share');
    expect(readme).toContain('keyboard');
    expect(readme).toContain('reduced-motion');
    expect(readme).toContain('M-296-02');
    expect(readme).toContain('NOT EXECUTED');
    expect(readme).toContain('NOT COMPLETED');
    expect(readme).not.toContain('launch completed');
    expect(readme).not.toContain('deployment executed');
  });

  it('confirms share/keyboard modules have no Phase 298 markers', async () => {
    for (const relativePath of SHARE_KEYBOARD_MODULES) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 298');
    }
  });
});
