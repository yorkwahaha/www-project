import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_132_DOC =
  'docs/www-project-phase-132-creator-flow-milestone-review-checkpoint-v1.md';

describe('Phase 132 creator flow milestone review checkpoint doc', () => {
  it('documents the Phase 119-121 and 129-131 milestone and fixed boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_132_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 132');
    expect(source).toContain('Creator Flow Milestone Review Checkpoint');
    expect(source).toContain('No runtime, frontend behavior, API behavior');
    expect(source).toContain('Phase 119');
    expect(source).toContain('Phase 120');
    expect(source).toContain('Phase 121');
    expect(source).toContain('Phase 129');
    expect(source).toContain('Phase 130');
    expect(source).toContain('Phase 131');

    expect(source).toContain('parseLiveApiMode');
    expect(source).toContain('submitCreatePollDemo');
    expect(source).toContain('Static showcase does not call creator APIs');
    expect(source).toContain('ensureCreatorSessionForLiveMode');
    expect(source).toContain('POST /creator/polls');

    expect(source).toContain('isCreatorOwnedPollSafe');
    expect(source).toContain('creator-safe summary only');
    expect(source).toContain('no vote counts, result previews, voter status, eligibility');

    expect(source).toContain('postPollLifecycleTransition');
    expect(source).toContain('/creator/polls/:id/cancel');
    expect(source).toContain('/creator/polls/:id/close');
    expect(source).toContain('/creator/polls/:id/unpublish');
    expect(source).toContain('lifecycleActionsForState');

    expect(source).toContain('parseCreatorManageMode');
    expect(source).toContain('mountCreatorLifecyclePanel');
    expect(source).toContain('GET /polls/:pollId/results');
    expect(source).toContain('GET /creator/polls/:id/results');
    expect(source).toContain('Phase 70 boundary');

    expect(source).toContain('collecting / cancelled / unpublished');
    expect(source).toContain('revealed / locked / post_lock');
    expect(source).toContain('does not self-adjudicate creator ownership');
    expect(source).toContain('localStorage');
    expect(source).toContain('sessionStorage');

    expect(source).toContain('creator_session` boundary unchanged');
    expect(source).toContain('does not replace formal login/session');
    expect(source).toContain('X-User-Id` remains explicit non-production compatibility only');

    expect(source).toContain('profile, eligibility, demographic, analytics, or tracking fields');
    expect(source).toContain('neutral fallback');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('Official Vote transaction order unchanged');
    expect(source).toContain('Vote-by-index eligibility before option resolve unchanged');
    expect(source).toContain('Reference Answer remains disconnected');
    expect(source).toContain('demographic breakdown, ranking personalization, or analytics linkage');

    expect(source).toContain(
      'phase-132-creator-flow-milestone-review-checkpoint.test.ts',
    );
    expect(source).toContain('smoke:public:local');
    expect(source).toContain('Docker Desktop remains unavailable');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 132');
    expect(readme).toContain(PHASE_132_DOC);
    expect(readme).toContain('Creator flow milestone review checkpoint');
  });
});
