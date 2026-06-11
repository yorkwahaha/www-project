import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_127_DOC =
  'docs/www-project-phase-127-homepage-profile-prompt-runtime-review-checkpoint-v1.md';

describe('Phase 127 homepage profile prompt runtime review checkpoint doc', () => {
  it('documents the review checkpoint and preserved boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_127_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 127');
    expect(source).toContain('Homepage Profile Prompt Runtime Review Checkpoint');
    expect(source).toContain('Phase 102');
    expect(source).toContain('Phase 126');
    expect(source).toContain('No runtime, frontend behavior, API behavior');

    expect(source).toContain('Homepage-only mount');
    expect(source).toContain("pathname === '/' || pathname === ''");
    expect(source).toContain('does not call `GET /users/me/profile`');
    expect(source).toContain('do not see profile completeness or eligibility status');

    expect(source).toContain('GET /users/me` for header `display_name`');
    expect(source).toContain('GET /users/me/profile`');
    expect(source).toContain('`user_id` and `display_name`');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');

    expect(source).toContain('Completeness is null-check only');
    expect(source).toContain('does not evaluate `can_vote`');
    expect(source).toContain('does not guarantee voting');
    expect(source).toContain('不代表你一定符合或不符合任何投票資格');

    expect(source).toContain("CTA routes only to `/profile`");
    expect(source).toContain('PROFILE_COMPLETION_PROMPT_CTA_HREF');
    expect(source).toContain('neutral fallback');
    expect(source).toContain('does not echo backend `error`');

    expect(source).toContain('data-login-state-read="disabled"');
    expect(source).toContain('POST /login/session` remains the formal session-establishment boundary');
    expect(source).toContain('creator_session` remains local/demo/test creator flow only');
    expect(source).toContain('option_id');
    expect(source).toContain('option_index');
    expect(source).toContain('Reference Answer remains disconnected');

    expect(source).toContain('no new logs, metrics, analytics');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain(
      'phase-127-homepage-profile-prompt-runtime-review-checkpoint.test.ts',
    );
    expect(source).toContain('smoke:public:local');
    expect(source).toContain('Docker Desktop remains unavailable');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 127');
    expect(readme).toContain(PHASE_127_DOC);
    expect(readme).toContain('Homepage profile prompt runtime review checkpoint');
  });
});
