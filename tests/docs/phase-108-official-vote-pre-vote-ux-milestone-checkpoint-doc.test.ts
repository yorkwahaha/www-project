import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_108_DOC =
  'docs/www-project-phase-108-official-vote-pre-vote-ux-milestone-checkpoint-v1.md';

describe('Phase 108 official vote pre-vote UX milestone checkpoint doc', () => {
  it('documents the Phase 105-107 milestone and fixed boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_108_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 108');
    expect(source).toContain('Official Vote Pre-vote UX Milestone Checkpoint');
    expect(source).toContain('No runtime, frontend JS, API');
    expect(source).toContain('Phase 105');
    expect(source).toContain('Phase 106');
    expect(source).toContain('Phase 107');
    expect(source).toContain('vote UX or Official Vote hardening');

    expect(source).toContain('docs/spec only');
    expect(source).toContain('neutral hints only');
    expect(source).toContain('vote-time evaluator');
    expect(source).toContain('/login');
    expect(source).toContain('without `GET /users/me/profile`');
    expect(source).toContain('/profile');
    expect(source).toContain('without pass/fail');
    expect(source).toContain('without vote guarantee');
    expect(source).toContain('Raw Option Linkage Ban');

    expect(source).toContain('official-vote-pre-vote-hints.js');
    expect(source).toContain('vote-page.js');
    expect(source).toContain("credentials: 'same-origin'");
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toContain('no auto-redirect');
    expect(source).toContain('no auto-vote');
    expect(source).toContain('no `option_id` resolution');
    expect(source).toContain('no option choice recording');
    expect(source).toContain('unified neutral vote-failure copy');

    expect(source).toContain('no runtime/API/schema/auth/vote backend behavior change');
    expect(source).toContain('not an eligibility checker');
    expect(source).toContain('no option choice linkage');
    expect(source).toContain('Reference Answer');
    expect(source).toContain('UserAuthResolver');
    expect(source).toContain('Docker Desktop Linux engine pipe was unavailable');
    expect(source).toContain('environment blocker');

    expect(source).toContain('Pre-vote UX is **not** an eligibility checker');
    expect(source).toContain('does **not** show eligible/ineligible outcomes');
    expect(source).toContain('does **not** expose age thresholds');
    expect(source).toContain('does **not** expose `option_id`');
    expect(source).toContain('do **not** call `GET /users/me/profile`');
    expect(source).toContain('do not resolve `option_index` → `option_id`');
    expect(source).toContain('Official Vote transaction order is unchanged');
    expect(source).toContain('`vote-by-index` eligibility remains before option resolve');
    expect(source).toContain('Vote token schema: `user_id + poll_id`');
    expect(source).toContain('Counter schema: `poll_id + option_id + shard_id`');
    expect(source).toContain(
      'No new option choice + user/session/device/request/log/trace/metric/error payload linkage',
    );
    expect(source).toContain('data-login-state-read="disabled"');
    expect(source).toContain('returns only `user_id` and `display_name`');
    expect(source).toContain('creator_session` remains local/demo/test creator flow only');
    expect(source).toContain('X-User-Id` compatibility');
    expect(source).toContain('No demographic breakdown');
    expect(source).toContain('smoke:public:local');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture `option_id`',
    );

    expect(readme).toContain('Phase 108');
    expect(readme).toContain(PHASE_108_DOC);
    expect(readme).toContain('Official Vote pre-vote UX milestone checkpoint');
  });
});
