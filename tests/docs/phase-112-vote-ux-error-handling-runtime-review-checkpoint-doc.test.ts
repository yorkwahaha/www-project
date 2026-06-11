import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_112_DOC =
  'docs/www-project-phase-112-vote-ux-error-handling-runtime-review-checkpoint-v1.md';

describe('Phase 112 vote UX error handling runtime review checkpoint doc', () => {
  it('documents the review checkpoint and preserved boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_112_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 112');
    expect(source).toContain('Vote UX Error Handling Runtime Review Checkpoint');
    expect(source).toContain('Phase 111');
    expect(source).toContain('No runtime, frontend behavior, API behavior');

    expect(source).toContain('投票已送出，感謝參與。');
    expect(source).toContain('messageForVoteSubmitFailure');
    expect(source).toContain('GENERIC_VOTE_SUBMIT_FAILURE');
    expect(source).toContain('VOTE_SUBMIT_TRANSPORT_FAILURE');
    expect(source).toContain('VOTE_PAGE_LOAD_FAILURE');

    expect(source).toContain('isPollAcceptingVotes');
    expect(source).toContain('messageForPollVotingBlocked');
    expect(source).toContain('applyVotePageVotingAvailability');
    expect(source).toContain('public_lifecycle_state === \'collecting\'');

    expect(source).toContain('MISSING_SELECTION_MESSAGE');
    expect(source).toContain('請先選擇一個選項。');
    expect(source).toContain('createVotePageController');
    expect(source).toContain('pagehide');
    expect(source).toContain('event.persisted === true');

    expect(source).toContain('official-vote-pre-vote-hints.js');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toContain('not act as eligibility checkers');
    expect(source).toContain('Reference Answer remains disconnected');

    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('page-local runtime memory only');
    expect(source).toContain('does not echo backend option identity');
    expect(source).toContain('option_id');
    expect(source).toContain('vote token');
    expect(source).toContain('raw denial reason');

    expect(source).toContain('Official Vote transaction order unchanged');
    expect(source).toContain('`vote-by-index` eligibility before option resolve unchanged');
    expect(source).toContain('No client `option_index` → `option_id` resolution');
    expect(source).toContain('Vote token schema remains `user_id + poll_id`');
    expect(source).toContain('Counter schema remains `poll_id + option_id + shard_id`');

    expect(source).toContain(
      'phase-112-vote-ux-error-handling-runtime-review-checkpoint.test.ts',
    );
    expect(source).toContain('smoke:public:local');
    expect(source).toContain('Docker Desktop remains unavailable');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 112');
    expect(readme).toContain(PHASE_112_DOC);
    expect(readme).toContain('Vote UX error handling runtime review checkpoint');
  });
});
