import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_289_DOC =
  'docs/www-project-phase-289-public-faq-copy-alignment-polish-v1.md';

describe('Phase 289 public FAQ copy alignment polish doc', () => {
  it('documents purpose, copy changes, scope, and boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_289_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 289');
    expect(source).toContain('Public FAQ Copy Alignment Polish');
    expect(source).toContain('2138f60');
    expect(source).toContain('presentation-only');

    expect(source).toContain('PUBLIC_FAQ_PAGE_BANNER_BODY');
    expect(source).toContain('PUBLIC_FAQ_PARTICIPANT_VOTE_STEP');
    expect(source).toContain('尚未正式對外上線');
    expect(source).toContain('不代表一定可以完成投票');
    expect(source).toContain('faq-page-banner');
    expect(source).toContain('syncFaqPageOnboardingCopy');

    for (const token of [
      '不會自動登入',
      '瀏覽器工作階段',
      '不表示可保證',
      '不顯示票數',
      '回饋良好',
      'NOT EXECUTED',
      'no deploy scripts',
      'production configuration',
      'Raw Option Linkage Ban',
      'option_index',
      'eligibility-before-option-resolve',
      'positive_feedback',
      'localStorage',
      'sessionStorage',
      'analytics',
      'no API',
      'migration',
      'phase-289-public-faq-copy-alignment-polish.test.ts',
      'phase-289-public-faq-copy-alignment-polish-doc.test.ts',
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    ]) {
      expect(source).toContain(token);
    }

    expect(readme).toContain('Phase 289');
    expect(readme).toContain(PHASE_289_DOC);
    expect(readme).toContain('Phase 290 blockers: none identified');
  });
});
