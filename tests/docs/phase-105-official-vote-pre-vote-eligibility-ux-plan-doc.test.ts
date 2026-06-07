import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_105_DOC =
  'docs/www-project-phase-105-official-vote-pre-vote-eligibility-ux-plan-v1.md';

describe('Phase 105 official vote pre-vote eligibility UX plan doc', () => {
  it('documents pre-vote eligibility UX plan and preserved boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_105_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 105');
    expect(source).toContain('docs/spec only');
    expect(source).toContain('Official Vote Pre-vote Eligibility UX Plan');
    expect(source).toContain('Phase 104');

    expect(source).toContain('vote-time evaluator');
    expect(source).toContain('Sole authority for Official Vote eligibility');
    expect(source).toContain('must not duplicate, preview, or contradict vote-time decisions');

    expect(source).toContain('Anonymous (not signed in)');
    expect(source).toContain('/login');
    expect(source).toContain('**Must not** call `GET /users/me/profile`');
    expect(source).toContain('**Must not** show birth year/month');

    expect(source).toContain('Signed in, profile incomplete');
    expect(source).toContain('/profile');
    expect(source).toContain('**Must not** say eligible or ineligible');
    expect(source).toContain('**Must not** auto-redirect to `/profile`');
    expect(source).toContain('**Must not** auto-submit Official Vote');
    expect(source).toContain('出生年月與粗粒度居住地區');
    expect(source).toContain('不代表你一定符合或不符合');

    expect(source).toContain('Signed in, profile complete');
    expect(source).toContain('**Must not** guarantee the user can vote');
    expect(source).toContain('**Must not** show age or region pass/fail');

    expect(source).toContain('Eligibility failure');
    expect(source).toContain('**Must not** distinguish age vs region vs trust');
    expect(source).toContain('**Must not** expose age cutoffs');
    expect(source).toContain('**Must not** expose `option_id`');
    expect(source).toContain('token, counter, shard');

    expect(source).toContain('Vote Success UX');
    expect(source).toContain('Generic success only');
    expect(source).toContain('**Must not** show personalized result preview');
    expect(source).toContain('demographic breakdown');

    expect(source).toContain('Relationship to Profile Completion Prompt');
    expect(source).toContain('profile-completion-prompt.js');
    expect(source).toContain('Does not guarantee eligibility');
    expect(source).toContain('vote history');

    expect(source).toContain('Raw Option Linkage Ban (Pre-vote UX)');
    expect(source).toContain(
      'No option choice + user/session/device/request/log/trace/metric/error linkage',
    );
    expect(source).toContain('must **not** introduce any durable or side-channel linkage');
    expect(source).toContain('eligibility failure responses and client error UI must not carry `option_id`');

    expect(source).toContain('GET /users/me` for `display_name` only');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toContain('No option resolve early');
    expect(source).toContain('vote-by-index` eligibility remains before option resolve');

    expect(source).toContain('UserAuthResolver');
    expect(source).toContain('POST /registration');
    expect(source).toContain('POST /login/session');
    expect(source).toContain('DELETE /login/session');
    expect(source).toContain('user_id + poll_id');
    expect(source).toContain('poll_id + option_id + shard_id');
    expect(source).toContain('Reference Answer');
    expect(source).toContain('creator_session');
    expect(source).toContain('X-User-Id');

    expect(readme).toContain('Phase 105');
    expect(readme).toContain(PHASE_105_DOC);
    expect(readme).toContain('Official Vote pre-vote eligibility UX plan');
  });
});
