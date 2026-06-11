import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_111_DOC =
  'docs/www-project-phase-111-vote-ux-error-handling-runtime-polish-v1.md';

describe('Phase 111 vote UX error handling runtime polish doc', () => {
  it('documents runtime polish and preserved boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_111_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 111');
    expect(source).toContain('Vote UX Error Handling Runtime Polish');
    expect(source).toContain('Phase 110');
    expect(source).toContain('frontend runtime');

    expect(source).toContain('投票已送出，感謝參與。');
    expect(source).toContain('messageForVoteSubmitFailure');
    expect(source).toContain('VOTE_SUBMIT_TRANSPORT_FAILURE');
    expect(source).toContain('official-vote-pre-vote-hints.js');

    expect(source).toContain('isPollAcceptingVotes');
    expect(source).toContain('messageForPollVotingBlocked');
    expect(source).toContain('public_lifecycle_state === \'collecting\'');
    expect(source).toContain('此問卷已結束。');
    expect(source).toContain('此問卷目前無法使用。');

    expect(source).toContain('VOTE_PAGE_LOAD_FAILURE');
    expect(source).toContain('請先選擇一個選項。');
    expect(source).toContain('createVotePageController');
    expect(source).toContain('pagehide');

    expect(source).toContain('No backend/API/schema/auth/vote evaluator changes');
    expect(source).toContain('vote-by-index` eligibility before option resolve unchanged');
    expect(source).toContain('Raw Option Linkage Ban preserved');
    expect(source).toContain('phase-111-vote-ux-error-handling-runtime-polish.test.ts');

    expect(readme).toContain('Phase 111');
    expect(readme).toContain(PHASE_111_DOC);
    expect(readme).toContain('Vote UX error handling runtime polish');
  });
});
