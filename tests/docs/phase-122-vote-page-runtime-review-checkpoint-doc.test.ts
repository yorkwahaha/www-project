import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_122_DOC =
  'docs/www-project-phase-122-vote-page-runtime-review-checkpoint-v1.md';

describe('Phase 122 vote page runtime review checkpoint doc', () => {
  it('documents the review checkpoint and preserved boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_122_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 122');
    expect(source).toContain('Vote Page Runtime Review Checkpoint');
    expect(source).toContain('Phase 112');
    expect(source).toContain('Phase 109');
    expect(source).toContain('No runtime, frontend behavior, API behavior');

    expect(source).toContain('does not call `GET /users/me/profile`');
    expect(source).toContain('parsePreVoteProfile');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toContain('此提示不代表一定可以完成投票');
    expect(source).toContain('does not judge or display eligibility outcomes');
    expect(source).toContain('does not say the visitor is eligible or ineligible');

    expect(source).toContain('option_index');
    expect(source).toContain('does not resolve or send `option_id`');
    expect(source).toContain('`vote-by-index` eligibility before option resolve unchanged');
    expect(source).toContain('messageForVoteSubmitFailure');

    expect(source).toContain('VOTE_PAGE_LOAD_FAILURE');
    expect(source).toContain('目前無法載入問卷，請稍後再試');
    expect(source).toContain('VOTE_SUBMIT_TRANSPORT_FAILURE');
    expect(source).toContain('applyVotePageVotingAvailability');
    expect(source).toContain('createVotePageController');
    expect(source).toContain('pagehide');
    expect(source).toContain('event.persisted === true');

    expect(source).toContain('`user_id` and `display_name`');
    expect(source).toContain('creator_session` remains local/demo/test creator flow only');
    expect(source).toContain('Reference Answer remains disconnected');
    expect(source).toContain('no new logs, metrics, analytics');

    expect(source).toContain('vote counts, result previews');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('Official Vote transaction order unchanged');
    expect(source).toContain(
      'phase-122-vote-page-runtime-review-checkpoint.test.ts',
    );
    expect(source).toContain('smoke:public:local');
    expect(source).toContain('Docker Desktop remains unavailable');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 122');
    expect(readme).toContain(PHASE_122_DOC);
    expect(readme).toContain('Vote page runtime review checkpoint');
  });
});
