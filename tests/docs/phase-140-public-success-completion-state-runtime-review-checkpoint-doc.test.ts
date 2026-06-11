import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_140_DOC =
  'docs/www-project-phase-140-public-success-completion-state-runtime-review-checkpoint-v1.md';

describe('Phase 140 public success completion state runtime review checkpoint doc', () => {
  it('documents Phase 139 runtime review conclusions and fixed boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_140_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 140');
    expect(source).toContain('Public Success / Completion State Runtime Review Checkpoint');
    expect(source).toContain('No runtime, frontend behavior, API behavior');
    expect(source).toContain('Phase 139');

    expect(source).toContain('PUBLIC_SUCCESS_USER_MESSAGES');
    expect(source).toContain('Success / completion copy is frontend-owned only');
    expect(source).toContain('Login success remains identifier-free');
    expect(source).toContain('Registration success remains off session establishment');
    expect(source).toContain('Profile save success does not echo raw payload');

    expect(source).toContain('/vote/:id');
    expect(source).toContain('/registration');
    expect(source).toContain('/login');
    expect(source).toContain('/profile');
    expect(source).toContain('/polls/new');
    expect(source).toContain('/my-polls?live=1');
    expect(source).toContain('Creator lifecycle success');
    expect(source).toContain('VOTE_SUCCESS_STATUS_MESSAGE');

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
      'phase-140-public-success-completion-state-runtime-review-checkpoint.test.ts',
    );
    expect(source).toContain('smoke:public:local');
    expect(source).toContain('Docker Desktop remains unavailable');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 140');
    expect(readme).toContain(PHASE_140_DOC);
    expect(readme).toContain('Public success / completion state runtime review checkpoint');
  });
});
