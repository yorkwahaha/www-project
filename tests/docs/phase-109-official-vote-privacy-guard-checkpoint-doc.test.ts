import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_109_DOC =
  'docs/www-project-phase-109-official-vote-privacy-guard-checkpoint-v1.md';

describe('Phase 109 official vote privacy guard checkpoint doc', () => {
  it('documents the privacy guard checkpoint and preserved boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_109_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 109');
    expect(source).toContain('Official Vote Privacy Guard Checkpoint');
    expect(source).toContain('No runtime, frontend behavior, API behavior');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain(
      'No new option choice + user/session/device/request/log/trace/metric/error payload linkage',
    );
    expect(source).toContain('selected option state remains page-local runtime memory only');
    expect(source).toContain('do not read, store, or log which option a user is preparing to choose');
    expect(source).toContain('Eligibility failures remain option-identity-free');

    expect(source).toContain('Official Vote transaction order is unchanged');
    expect(source).toContain('`vote-by-index` eligibility before option resolve is unchanged');
    expect(source).toContain('does not resolve `option_index` to `option_id`');
    expect(source).toContain('Vote token schema remains `user_id + poll_id`');
    expect(source).toContain('Counter schema remains `poll_id + option_id + shard_id`');

    expect(source).toContain('`GET /users/me` response shape remains `user_id` and `display_name`');
    expect(source).toContain('`GET /users/me/profile` and `PUT /users/me/profile` behavior is unchanged');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toContain('do not infer or display age eligibility pass/fail');
    expect(source).toContain('Official Vote eligibility remains vote-time evaluator authority only');
    expect(source).toContain('Reference Answer remains disconnected');

    expect(source).toContain('Registration does not auto-login');
    expect(source).toContain('Registration does not issue `Set-Cookie`');
    expect(source).toContain('data-login-state-read="disabled"');
    expect(source).toContain('`POST /login/session` remains the formal login-session creation boundary');
    expect(source).toContain('creator_session` remains local/demo/test creator-flow-only identity');
    expect(source).toContain('X-User-Id` remains explicit non-production compatibility only');

    expect(source).toContain('Vote failure copy remains one neutral frontend message');
    expect(source).toContain('Vote success copy remains generic');
    expect(source).toContain('No demographic breakdown');
    expect(source).toContain('smoke:public:local');
    expect(source).toContain('Docker Desktop remains unavailable');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 109');
    expect(readme).toContain(PHASE_109_DOC);
    expect(readme).toContain('Official Vote privacy guard checkpoint');
  });
});
