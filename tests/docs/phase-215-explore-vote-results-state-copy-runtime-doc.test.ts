import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_215_DOC =
  'docs/www-project-phase-215-explore-vote-results-state-copy-runtime-v1.md';

describe('Phase 215 explore vote results state copy runtime doc', () => {
  it('documents copy-only runtime scope, changes, boundaries, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_215_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 215');
    expect(source).toContain('Explore / Vote / Results State Copy');
    expect(source).toContain('37a7bb3');
    expect(source).toContain('Phase 214-R');
    expect(source).toContain('PUBLIC_EXPLORE_LOAD_MORE_UNAVAILABLE_MESSAGE');
    expect(source).toContain('PUBLIC_VOTE_PRE_VOTE_PROFILE_LOAD_FAILED_HINT');
    expect(source).toContain('PUBLIC_RESULTS_PAGE_LIVE_INTRO_LEAD');
    expect(source).toContain('syncResultsPageLeadParagraphs');
    expect(source).toContain('official-vote-pre-vote-hints.js');
    expect(source).toContain('result-page.js');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('quality_badge');
    expect(source).toContain('positive_feedback');
    expect(source).toContain('回饋良好');
    expect(source).toContain('migrate:check');
    expect(source).toContain(
      'phase-215-explore-vote-results-state-copy-runtime.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 215');
    expect(readme).toContain(PHASE_215_DOC);
  });
});
