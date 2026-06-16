import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_250_DOC =
  'docs/www-project-phase-250-public-page-keyboard-focus-polish-v1.md';
const PHASE_268_DOC =
  'docs/www-project-phase-268-public-mvp-manual-qa-runbook-execution-plan-v1.md';
const PHASE_292_DOC =
  'docs/www-project-phase-292-public-mvp-manual-qa-follow-up-execution-record-v1.md';
const PHASE_296_DOC =
  'docs/www-project-phase-296-public-mvp-backlog-planning-checkpoint-v1.md';
const PHASE_297_DOC =
  'docs/www-project-phase-297-public-mvp-mobile-375px-spot-check-record-v1.md';
const PHASE_298_DOC =
  'docs/www-project-phase-298-public-mvp-share-keyboard-reduced-motion-regression-review-v1.md';

describe('Phase 298 public MVP share keyboard reduced-motion regression review doc', () => {
  it('documents regression review session, routes, M-296-02 closure, and conclusion', async () => {
    const source = await readFile(join(process.cwd(), PHASE_298_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 298');
    expect(source).toContain('Share / Keyboard / Reduced-Motion Regression Review');
    expect(source).toContain('regression review');
    expect(source).toContain('ae66765');
    expect(source).toContain(PHASE_250_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_268_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_292_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_296_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_297_DOC.replace('docs/', './'));
    expect(source).toContain('M-296-02');

    for (const route of [
      '/',
      '/explore',
      '/faq',
      '/login',
      '/registration',
      '/profile',
      '/polls/new',
      '/my-polls',
      '/vote/demo',
      '/results/demo',
    ]) {
      expect(source).toContain(route);
    }

    for (const section of [
      'Review Session Metadata',
      'Pre-Review Automated Gates',
      'Share-Link Regression Results',
      'Keyboard Focus Regression Results',
      'Reduced-Motion Regression Results',
      'M-296-02 Resolution',
      'Overall regression review result',
    ]) {
      expect(source).toContain(section);
    }

    for (const focus of [
      'share',
      'keyboard',
      'reduced-motion',
      'prefers-reduced-motion',
      'focus-visible',
      'quality_badge',
      'hidden aggregate',
      'clipboard',
    ]) {
      expect(source).toContain(focus);
    }

    expect(source).toContain('CLOSED — regression review PASS');
    expect(source).toContain('**Overall regression review result** | **PASS**');
    expect(source).toContain('**FAIL** | 0');
    expect(source).toContain('Share regression | **PASS**');
    expect(source).toContain('Keyboard regression | **PASS**');
    expect(source).toContain('Reduced-motion regression | **PASS**');

    for (const statusField of [
      'not release execution',
      'not deployment',
      'not formal launch',
      'NOT EXECUTED',
      'NOT COMPLETED',
      'no runtime change',
      'no CSS / layout change',
      'no copy change',
    ]) {
      expect(source).toContain(statusField);
    }

    for (const rule of [
      'eligibility-before-option-resolve',
      'option_index',
      'Raw Option Linkage Ban',
      'hidden aggregate',
      'UserAuthResolver',
      'positive_feedback',
      '回饋良好',
      'smoke:public:local',
      'demo:public:local',
      'design-drafts/',
      'no new fallback',
    ]) {
      expect(source).toContain(rule);
    }

    expect(source).toContain('Phase 299 blockers: none identified');
    expect(source).toContain(
      'phase-298-public-mvp-share-keyboard-reduced-motion-regression-review-doc.test.ts',
    );
    expect(source).toContain(
      'phase-298-public-mvp-share-keyboard-reduced-motion-regression-review.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 298');
    expect(readme).toContain(PHASE_298_DOC);
    expect(readme).toContain('M-296-02');
    expect(readme).toContain('Phase 299 blockers: none identified');
  });
});
