import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_142_DOC =
  'docs/www-project-phase-142-public-disabled-unavailable-action-runtime-review-checkpoint-v1.md';

describe('Phase 142 public disabled unavailable action runtime review checkpoint doc', () => {
  it('documents Phase 141 runtime review conclusions and fixed boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_142_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 142');
    expect(source).toContain('Public Disabled / Unavailable Action Runtime Review Checkpoint');
    expect(source).toContain('No runtime, frontend behavior, API behavior');
    expect(source).toContain('Phase 141');

    expect(source).toContain('PUBLIC_UNAVAILABLE_USER_MESSAGES');
    expect(source).toContain('Disabled / unavailable copy is frontend-owned only');
    expect(source).toContain('Vote blocked / route unavailable remains neutral');
    expect(source).toContain('Results unavailable shells remain counter-free until display-safe aggregate');
    expect(source).toContain('Lifecycle unavailable remains identifier-free');
    expect(source).toContain('Profile unavailable does not echo raw payload');

    expect(source).toContain('/vote/:id');
    expect(source).toContain('/results/:id');
    expect(source).toContain('/explore');
    expect(source).toContain('/my-polls?live=1');
    expect(source).toContain('/profile');
    expect(source).toContain('/polls/new');
    expect(source).toContain('messageForPollVotingBlocked');

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
      'phase-142-public-disabled-unavailable-action-runtime-review-checkpoint.test.ts',
    );
    expect(source).toContain('smoke:public:local');
    expect(source).toContain('Docker Desktop remains unavailable');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 142');
    expect(readme).toContain(PHASE_142_DOC);
    expect(readme).toContain('Public disabled / unavailable action runtime review checkpoint');
  });
});
