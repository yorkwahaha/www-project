import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_291_DOC =
  'docs/www-project-phase-291-public-mvp-backlog-reprioritization-checkpoint-v1.md';

describe('Phase 291 public MVP backlog reprioritization checkpoint doc', () => {
  it('documents purpose, status confirmation, reprioritized backlog, and boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_291_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 291');
    expect(source).toContain('Public MVP Backlog Reprioritization Checkpoint');
    expect(source).toContain('45bb501');
    expect(source).toContain('review checkpoint');
    expect(source).toContain('planning only');

    for (const priorPhase of [
      'Phase 281',
      'Phase 282',
      'Phase 290',
      'Phase 285',
      'Phase 289',
    ]) {
      expect(source).toContain(priorPhase);
    }

    for (const token of [
      'Phases 285–289 archived',
      'Launch approved for manual release preparation',
      'Operator release execution authorized',
      'NOT EXECUTED',
      'No deploy scripts added',
      'No production configuration changed',
      'BL-282-01',
      'BL-282-02',
      'BL-282-03',
      'BL-282-04',
      'BL-282-05',
      'BL-282-06',
      'BL-282-07',
      'BL-282-08',
      'BL-286-02',
      'Low-risk',
      'Medium-risk',
      'High-risk',
      'Composer',
      'Gemini',
      'GPT-5.5',
      'Not Recommended Now',
      'Production deployment execution',
      'deploy script',
      'Auth / session / schema / privacy / governance',
      'public-page-copy.js',
      'public-mvp-ui.js',
      'Suggested Phase 292–295',
      '292',
      '293',
      '294',
      '295',
      'candidates only',
      'separate numbered phase',
      'separately executed and recorded',
      'Raw Option Linkage Ban',
      'Official Vote transaction order',
      'UserAuthResolver',
      'option_index',
      'eligibility-before-option-resolve',
      'positive_feedback',
      '回饋良好',
      'localStorage',
      'sessionStorage',
      'analytics',
      'no runtime',
      'APPROVED',
      'Phase 292 blockers: none identified',
      'phase-291-public-mvp-backlog-reprioritization-checkpoint.test.ts',
      'phase-291-public-mvp-backlog-reprioritization-checkpoint-doc.test.ts',
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    ]) {
      expect(source).toContain(token);
    }

    expect(readme).toContain('Phase 291');
    expect(readme).toContain(PHASE_291_DOC);
    expect(readme).toContain('backlog reprioritization checkpoint');
    expect(readme).toContain('Phase 292 blockers: none identified');
  });
});
