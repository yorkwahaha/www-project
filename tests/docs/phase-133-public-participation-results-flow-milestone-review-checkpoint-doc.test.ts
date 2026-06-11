import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_133_DOC =
  'docs/www-project-phase-133-public-participation-results-flow-milestone-review-checkpoint-v1.md';

describe('Phase 133 public participation results flow milestone review checkpoint doc', () => {
  it('documents the Phase 113-118, 122, and 128 milestone and fixed boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_133_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 133');
    expect(source).toContain('Public Participation / Results Flow Milestone Review Checkpoint');
    expect(source).toContain('No runtime, frontend behavior, API behavior');
    expect(source).toContain('Phase 113');
    expect(source).toContain('Phase 114');
    expect(source).toContain('Phase 115');
    expect(source).toContain('Phase 116');
    expect(source).toContain('Phase 117');
    expect(source).toContain('Phase 118');
    expect(source).toContain('Phase 122');
    expect(source).toContain('Phase 128');

    expect(source).toContain('GET /polls/feed');
    expect(source).toContain('isExploreFeedItemSafe');
    expect(source).toContain('status === \'active\'');
    expect(source).toContain('no vote counts, result previews, voter status, eligibility');

    expect(source).toContain('mountOfficialVotePreVoteHint');
    expect(source).toContain('does not call `GET /users/me/profile`');
    expect(source).toContain('parsePreVoteProfile');
    expect(source).toContain('此提示不代表一定可以完成投票');
    expect(source).toContain('submitVoteByIndex');
    expect(source).toContain('option_index');

    expect(source).toContain('vote-by-index` eligibility before option resolve');
    expect(source).toContain('Official Vote transaction order unchanged');

    expect(source).toContain('collecting / cancelled / unpublished');
    expect(source).toContain('revealed / locked / post_lock');
    expect(source).toContain('parseCreatorManageMode');
    expect(source).toContain('does not use creator mode');

    expect(source).toContain('individual vote choices');
    expect(source).toContain('collecting-period counts');
    expect(source).toContain('does not guarantee visitors can vote');
    expect(source).toContain('neutral fallback');

    expect(source).toContain('`GET /users/me` returns only `user_id` and `display_name`');
    expect(source).toContain('`GET /users/me/profile` contains only `birth_year_month` and `residential_region`');
    expect(source).toContain('creator_session` boundary unchanged');
    expect(source).toContain('X-User-Id` remains explicit non-production compatibility only');
    expect(source).toContain('Reference Answer remains disconnected');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('demographic breakdown, ranking personalization, or analytics linkage');

    expect(source).toContain(
      'phase-133-public-participation-results-flow-milestone-review-checkpoint.test.ts',
    );
    expect(source).toContain('smoke:public:local');
    expect(source).toContain('Docker Desktop remains unavailable');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 133');
    expect(readme).toContain(PHASE_133_DOC);
    expect(readme).toContain('Public participation / results flow milestone review checkpoint');
  });
});
