import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_146_DOC =
  'docs/www-project-phase-146-public-status-badge-state-label-runtime-review-checkpoint-v1.md';

describe('Phase 146 public status badge state label runtime review checkpoint doc', () => {
  it('documents Phase 145 runtime review conclusions and fixed boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_146_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 146');
    expect(source).toContain('Public Status Badge / State Label Runtime Review Checkpoint');
    expect(source).toContain('No runtime, frontend behavior, API behavior');
    expect(source).toContain('Phase 145');

    expect(source).toContain('PUBLIC_STATUS_LABELS');
    expect(source).toContain('PUBLIC_POLL_LIFECYCLE_STATUS_LABELS');
    expect(source).toContain('formatPublicPollLifecycleStatusLabel');
    expect(source).toContain('Status badge / state labels are frontend-owned only');
    expect(source).toContain('Auth / login state chip remains identifier-free');
    expect(source).toContain('Profile prompt status does not echo raw payload');
    expect(source).toContain('Vote status / success aria remains neutral');
    expect(source).toContain(
      'Results status labels remain counter-free until display-safe aggregate',
    );

    expect(source).toContain('auth-state-copy');
    expect(source).toContain('login-state-ui');
    expect(source).toContain('/vote/:id');
    expect(source).toContain('/results/:id');
    expect(source).toContain('/explore');
    expect(source).toContain('/my-polls?live=1');
    expect(source).toContain('/polls/new');
    expect(source).toContain('profile-completion-prompt');
    expect(source).toContain('poll-lifecycle-controls');

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
      'phase-146-public-status-badge-state-label-runtime-review-checkpoint.test.ts',
    );
    expect(source).toContain('smoke:public:local');
    expect(source).toContain('Docker Desktop remains unavailable');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 146');
    expect(readme).toContain(PHASE_146_DOC);
    expect(readme).toContain(
      'Public status badge / state label runtime review checkpoint',
    );
  });
});
