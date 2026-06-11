import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_148_DOC =
  'docs/www-project-phase-148-public-empty-no-data-state-runtime-review-checkpoint-v1.md';

describe('Phase 148 public empty no data state runtime review checkpoint doc', () => {
  it('documents Phase 147 runtime review conclusions and fixed boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_148_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 148');
    expect(source).toContain('Public Empty / No Data State Runtime Review Checkpoint');
    expect(source).toContain('No runtime, frontend behavior, API behavior');
    expect(source).toContain('Phase 147');

    expect(source).toContain('PUBLIC_EMPTY_STATE_MESSAGES');
    expect(source).toContain('PUBLIC_EMPTY_STATE_LABELS');
    expect(source).toContain('syncExploreEmptyStatePanel');
    expect(source).toContain('Empty / no-data copy is frontend-owned only');
    expect(source).toContain('Explore empty state remains counter-free and payload-free');
    expect(source).toContain(
      'Results empty aggregate remains gated to display-safe aggregate mode',
    );
    expect(source).toContain('Empty messages separated from unavailable allowlist');

    expect(source).toContain('explore-page.js');
    expect(source).toContain('result-page.js');
    expect(source).toContain('my-polls-page.js');
    expect(source).toContain('creator-flow-copy.js');
    expect(source).toContain('poll-lifecycle-controls.js');
    expect(source).toContain('/explore');
    expect(source).toContain('/results/:id');
    expect(source).toContain('/my-polls?live=1');

    expect(source).toContain('does not auto-login');
    expect(source).toContain('does not Set-Cookie');
    expect(source).toContain('does not read `/users/me`');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toContain('creator_session` remains non-production identity');
    expect(source).toContain('Official Vote transaction order unchanged');
    expect(source).toContain('eligibility-before-option-resolve unchanged');
    expect(source).toContain('Reference Answer remains disconnected');
    expect(source).toContain('Raw Option Linkage Ban preserved');
    expect(source).toContain('X-User-Id` remains explicit non-production compatibility only');
    expect(source).toContain('No new observability or analytics linkage');
    expect(source).toContain('revealed` / `locked` / `post_lock');

    expect(source).toContain(
      'phase-148-public-empty-no-data-state-runtime-review-checkpoint.test.ts',
    );
    expect(source).toContain('smoke:public:local');
    expect(source).toContain('Docker Desktop remains unavailable');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 148');
    expect(readme).toContain(PHASE_148_DOC);
    expect(readme).toContain(
      'Public empty / no data state runtime review checkpoint',
    );
  });
});
