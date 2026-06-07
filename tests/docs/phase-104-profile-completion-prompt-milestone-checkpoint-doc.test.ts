import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_104_DOC =
  'docs/www-project-phase-104-profile-completion-prompt-milestone-checkpoint-v1.md';

describe('Phase 104 profile completion prompt milestone checkpoint doc', () => {
  it('documents the Phase 101-103 milestone and fixed boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_104_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 104');
    expect(source).toContain('Profile Completion Prompt Milestone Checkpoint');
    expect(source).toContain('No runtime, frontend JS, API');
    expect(source).toContain('Phase 101');
    expect(source).toContain('Phase 102');
    expect(source).toContain('Phase 103');
    expect(source).toContain('Official Vote pre-vote eligibility UX');

    expect(source).toContain('Phase 101');
    expect(source).toContain('docs/spec only');
    expect(source).toContain('does not guarantee eligibility');
    expect(source).toContain('does not reveal eligibility determination details');
    expect(source).toContain('/registration');

    expect(source).toContain('profile-completion-prompt.js');
    expect(source).toContain('shouldReadLoginState(header)');
    expect(source).toContain('GET /users/me/profile');
    expect(source).toContain("credentials: 'same-origin'");
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toContain('does not extend `GET /users/me` shape');

    expect(source).toContain('Phase 103');
    expect(source).toContain('no runtime/API/schema/auth/vote gap found');
    expect(source).toContain('smoke:public:local');
    expect(source).toContain('no auto-redirect');
    expect(source).toContain('no auto-vote');
    expect(source).toContain('no eligibility recalculation/backfill');

    expect(source).toContain('`GET /users/me` returns only `user_id` and `display_name`');
    expect(source).toContain('displays only `display_name`');
    expect(source).toContain('profile setup/edit UI and profile completion prompt read only');
    expect(source).toContain('does not show eligibility yes/no outcomes');
    expect(source).toContain('does not block general browsing');
    expect(source).toContain('does not auto-redirect');
    expect(source).toContain('does not auto-vote');
    expect(source).toContain('does not recalculate existing vote eligibility');
    expect(source).toContain('does not backfill historical eligibility');
    expect(source).toContain('data-login-state-read="disabled"');
    expect(source).toContain('evaluated only at vote time');
    expect(source).toContain('Reference Answer remains disconnected from `UserAuthResolver`');
    expect(source).toContain('creator_session` remains local/demo/test creator flow only');
    expect(source).toContain('X-User-Id` compatibility');
    expect(source).toContain('Vote token schema: `user_id + poll_id`');
    expect(source).toContain('Counter schema: `poll_id + option_id + shard_id`');
    expect(source).toContain('vote-by-index` eligibility remains before option resolve');
    expect(source).toContain('Raw Option Linkage Ban remains preserved');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture `option_id`',
    );

    expect(readme).toContain('Phase 104');
    expect(readme).toContain(PHASE_104_DOC);
    expect(readme).toContain('Profile completion prompt milestone checkpoint');
  });
});
