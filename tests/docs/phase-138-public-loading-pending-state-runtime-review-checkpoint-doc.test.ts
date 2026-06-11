import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_138_DOC =
  'docs/www-project-phase-138-public-loading-pending-state-runtime-review-checkpoint-v1.md';

describe('Phase 138 public loading pending state runtime review checkpoint doc', () => {
  it('documents Phase 137 runtime review conclusions and fixed boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_138_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 138');
    expect(source).toContain('Public Loading / Pending State Runtime Review Checkpoint');
    expect(source).toContain('No runtime, frontend behavior, API behavior');
    expect(source).toContain('Phase 137');

    expect(source).toContain('PUBLIC_PENDING_USER_MESSAGES');
    expect(source).toContain('setBusySubmitButton');
    expect(source).toContain('Pending / loading copy is frontend-owned only');
    expect(source).toContain('Action buttons disable while pending and reset afterward');
    expect(source).toContain('Error paths restore busy / pending state');

    expect(source).toContain('/explore');
    expect(source).toContain('/vote/:id');
    expect(source).toContain('/results/:id');
    expect(source).toContain('/my-polls?live=1');
    expect(source).toContain('/registration');
    expect(source).toContain('/login');
    expect(source).toContain('/profile');
    expect(source).toContain('creator lifecycle controls');
    expect(source).toContain('LIFECYCLE_ACTION_PENDING_MESSAGE');

    expect(source).toContain('does not auto-login');
    expect(source).toContain('does not Set-Cookie');
    expect(source).toContain('does not read `/users/me`');
    expect(source).toContain('birth_year_month` + `residential_region` only');
    expect(source).toContain('creator_session` remains non-production identity');
    expect(source).toContain('Official Vote transaction order unchanged');
    expect(source).toContain('eligibility-before-option-resolve unchanged');
    expect(source).toContain('Reference Answer remains disconnected');
    expect(source).toContain('Raw Option Linkage Ban preserved');
    expect(source).toContain('X-User-Id` remains explicit non-production compatibility only');
    expect(source).toContain('No new observability or analytics linkage');

    expect(source).toContain(
      'phase-138-public-loading-pending-state-runtime-review-checkpoint.test.ts',
    );
    expect(source).toContain('smoke:public:local');
    expect(source).toContain('Docker Desktop remains unavailable');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 138');
    expect(readme).toContain(PHASE_138_DOC);
    expect(readme).toContain('Public loading / pending state runtime review checkpoint');
  });
});
