import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_290_DOC =
  'docs/www-project-phase-290-public-mvp-post-copy-polish-checkpoint-v1.md';
const PHASE_296_DOC =
  'docs/www-project-phase-296-public-mvp-backlog-planning-checkpoint-v1.md';
const PHASE_299_DOC =
  'docs/www-project-phase-299-static-html-fallback-vs-runtime-copy-drift-review-v1.md';
const PHASE_300_DOC =
  'docs/www-project-phase-300-demo-vs-live-boundary-final-review-v1.md';

describe('Phase 300 demo vs live boundary final review doc', () => {
  it('documents boundary review session, focus areas, and PASS conclusion', async () => {
    const source = await readFile(join(process.cwd(), PHASE_300_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 300');
    expect(source).toContain('Demo vs Live Boundary Final Review');
    expect(source).toContain('boundary review');
    expect(source).toContain('71b5267');
    expect(source).toContain(PHASE_290_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_296_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_299_DOC.replace('docs/', './'));

    for (const focus of [
      '/polls/new',
      '?live=1',
      '/my-polls',
      '/vote/demo',
      '/results/demo',
      'submitCreatePollDemo',
      'submitVoteDemo',
      'creator_session',
      'hidden aggregate',
      'registration',
      'profile',
      'localStorage',
      'sessionStorage',
      'analytics',
      'metrics',
      'APM',
      'parseLiveApiMode',
      'isDemoPollRouteId',
      'demoOnly',
      'UserAuthResolver',
      'Raw Option Linkage Ban',
      'eligibility-before-option-resolve',
      'option_index',
      'quality_badge',
      'positive_feedback',
      '回饋良好',
      'smoke:public:local',
      'design-drafts/',
    ]) {
      expect(source).toContain(focus);
    }

    for (const section of [
      'Review Session Metadata',
      'Pre-Review Automated Gates',
      'Demo vs Live Boundary Architecture',
      'Boundary Focus Checks',
      'Session Summary',
      'Overall boundary review result',
    ]) {
      expect(source).toContain(section);
    }

    expect(source).toContain('**Overall boundary review result** | **PASS**');
    expect(source).toContain('**FAIL** | 0');
    expect(source).toContain('Runtime behavior changed | **NO**');
    expect(source).toContain('demo vs live boundaries remain clean');

    for (const statusField of [
      'not release execution',
      'not deployment',
      'not formal launch',
      'NOT EXECUTED',
      'NOT COMPLETED',
      'no runtime change',
      'no API change',
      'no DB / migration change',
      'no deploy script',
    ]) {
      expect(source).toContain(statusField);
    }

    expect(source).toContain('Phase 301 blockers: none identified');
    expect(source).toContain(
      'phase-300-demo-vs-live-boundary-final-review-doc.test.ts',
    );
    expect(source).toContain(
      'phase-300-demo-vs-live-boundary-final-review.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 300');
    expect(readme).toContain(PHASE_300_DOC);
    expect(readme).toContain('demo vs live boundary');
    expect(readme).toContain('Phase 301 blockers: none identified');
  });
});
