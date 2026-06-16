import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_290_DOC =
  'docs/www-project-phase-290-public-mvp-post-copy-polish-checkpoint-v1.md';
const PHASE_291_DOC =
  'docs/www-project-phase-291-public-mvp-backlog-reprioritization-checkpoint-v1.md';
const PHASE_292_DOC =
  'docs/www-project-phase-292-public-mvp-manual-qa-follow-up-execution-record-v1.md';
const PHASE_296_DOC =
  'docs/www-project-phase-296-public-mvp-backlog-planning-checkpoint-v1.md';
const PHASE_298_DOC =
  'docs/www-project-phase-298-public-mvp-share-keyboard-reduced-motion-regression-review-v1.md';
const PHASE_299_DOC =
  'docs/www-project-phase-299-static-html-fallback-vs-runtime-copy-drift-review-v1.md';

describe('Phase 299 static HTML fallback vs runtime copy drift review doc', () => {
  it('documents drift review session, BL-286-02, FU-292-02/M-296-03 closure, and conclusion', async () => {
    const source = await readFile(join(process.cwd(), PHASE_299_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 299');
    expect(source).toContain('Static HTML Fallback vs Runtime Copy Drift Review');
    expect(source).toContain('drift review');
    expect(source).toContain('d236362');
    expect(source).toContain(PHASE_290_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_291_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_292_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_296_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_298_DOC.replace('docs/', './'));
    expect(source).toContain('FU-292-02');
    expect(source).toContain('M-296-03');
    expect(source).toContain('BL-286-02');

    for (const focus of [
      'explore',
      'login',
      'my-polls',
      'faq',
      'registration',
      'profile',
      'pre-vote',
      'hidden aggregate',
      'public-page-copy.js',
      'public-mvp-ui.js',
      'no constant merge',
      'dual copy source',
    ]) {
      expect(source).toContain(focus);
    }

    for (const section of [
      'Review Session Metadata',
      'Pre-Review Automated Gates',
      'Dual Copy Source Architecture',
      'Drift Review Focus Checks',
      'FU-292-02 / M-296-03 Resolution',
      'Overall drift review result',
    ]) {
      expect(source).toContain(section);
    }

    expect(source).toContain('CLOSED — drift audit PASS');
    expect(source).toContain('**Overall drift review result** | **PASS**');
    expect(source).toContain('**FAIL** | 0');
    expect(source).toContain('Constant merge performed | **NO**');
    expect(source).toContain('MAINTAINED — dual source; no ad hoc merge');

    for (const statusField of [
      'not release execution',
      'not deployment',
      'not formal launch',
      'NOT EXECUTED',
      'NOT COMPLETED',
      'no runtime change',
      'no copy change',
      'no constant merge',
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
      'design-drafts/',
    ]) {
      expect(source).toContain(rule);
    }

    expect(source).toContain('Phase 300 blockers: none identified');
    expect(source).toContain(
      'phase-299-static-html-fallback-vs-runtime-copy-drift-review-doc.test.ts',
    );
    expect(source).toContain(
      'phase-299-static-html-fallback-vs-runtime-copy-drift-review.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 299');
    expect(readme).toContain(PHASE_299_DOC);
    expect(readme).toContain('FU-292-02');
    expect(readme).toContain('Phase 300 blockers: none identified');
  });
});
