import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_103_DOC =
  'docs/www-project-phase-103-profile-completion-prompt-runtime-review-v1.md';

describe('Phase 103 profile completion prompt runtime review doc', () => {
  it('documents the prompt runtime review, hardening, and preserved boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_103_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 103');
    expect(source).toContain('Profile Completion Prompt Runtime Review');
    expect(source).toContain('No runtime, API, or schema behavior changed');
    expect(source).toContain('profile-completion-prompt.js');
    expect(source).toContain('public-mvp-layout.js');
    expect(source).toContain('GET /users/me/profile');
    expect(source).toContain("credentials: 'same-origin'");
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toContain('data-login-state-read="disabled"');
    expect(source).toContain('/registration');
    expect(source).toContain("pathname === '/'");

    expect(source).toContain('GET /users/me` shape remains');
    expect(source).toContain('`user_id` and `display_name`');
    expect(source).toContain('display_name` only');

    expect(source).toContain('does not say the user is eligible or ineligible');
    expect(source).toContain('auto-redirect');
    expect(source).toContain('auto-vote');
    expect(source).toContain('recalculate or backfill');

    expect(source).toContain('POST /registration');
    expect(source).toContain('POST /login/session');
    expect(source).toContain('DELETE /login/session');
    expect(source).toContain('Reference Answer');

    expect(source).toContain('Official Vote transaction order');
    expect(source).toContain('vote-by-index');
    expect(source).toContain('user_id + poll_id');
    expect(source).toContain('poll_id + option_id + shard_id');
    expect(source).toContain('creator_session');
    expect(source).toContain('Raw Option Linkage Ban remains preserved');
    expect(source).toContain('smoke:public:local');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture `option_id`',
    );

    expect(readme).toContain('Phase 103');
    expect(readme).toContain(PHASE_103_DOC);
    expect(readme).toContain('Profile completion prompt runtime review');
  });
});
