import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_158_DOC =
  'docs/www-project-phase-158-public-microcopy-inline-note-runtime-review-checkpoint-v1.md';

describe('Phase 158 public microcopy inline note runtime review checkpoint doc', () => {
  it('documents Phase 157 runtime review conclusions and fixed boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_158_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 158');
    expect(source).toContain('Public Microcopy / Inline Note Runtime Review Checkpoint');
    expect(source).toContain('No runtime, frontend behavior, API behavior');
    expect(source).toContain('Phase 157');

    expect(source).toContain('PUBLIC_INLINE_NOTES');
    expect(source).toContain('PUBLIC_MICROCOPY_MESSAGES');
    expect(source).toContain('PUBLIC_SUPPORTING_NOTES');
    expect(source).toContain('Microcopy / inline / supporting copy is frontend-owned only');
    expect(source).toContain('Homepage sync helpers are boundary-safe');
    expect(source).toContain('My-polls demo inline notes and share feedback are safe');
    expect(source).toContain('Creator flow microcopy aria labels are safe');
    expect(source).toContain('Lifecycle confirm copy and panel labels avoid internal disclosure');
    expect(source).toContain('Results public notice label is fixed copy');
    expect(source).toContain('`policy-ui-placeholders.js` / `HELP_COPY` remain a separate layer');

    expect(source).toContain('syncHomePageSupportingNotes');
    expect(source).toContain('syncHomePageMicrocopy');
    expect(source).toContain('syncExplorePageMicrocopy');
    expect(source).toContain('PUBLIC_RESULTS_PUBLIC_NOTICE_LABEL');
    expect(source).toContain('creator-flow-copy.js');
    expect(source).toContain('poll-lifecycle-controls.js');
    expect(source).toContain('my-polls-page.js');
    expect(source).toContain('/');
    expect(source).toContain('/explore');
    expect(source).toContain('/results/:id');
    expect(source).toContain('/my-polls');

    expect(source).toContain('does not auto-login');
    expect(source).toContain('does not Set-Cookie');
    expect(source).toContain('does not read `/users/me`');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toContain('No new profile fields added');
    expect(source).toContain('creator_session` remains non-production identity');
    expect(source).toContain('Official Vote transaction order unchanged');
    expect(source).toContain('eligibility-before-option-resolve unchanged');
    expect(source).toContain('Vote-by-index body remains `{ option_index }` only');
    expect(source).toContain('Reference Answer remains disconnected');
    expect(source).toContain('Raw Option Linkage Ban preserved');
    expect(source).toContain('X-User-Id` remains explicit non-production compatibility only');
    expect(source).toContain('No new observability or analytics linkage');

    expect(source).toContain(
      'phase-158-public-microcopy-inline-note-runtime-review-checkpoint.test.ts',
    );
    expect(source).toContain('smoke:public:local');
    expect(source).toContain('Docker Desktop remains unavailable');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 158');
    expect(readme).toContain(PHASE_158_DOC);
    expect(readme).toContain(
      'Public microcopy / inline note runtime review checkpoint',
    );
  });
});
