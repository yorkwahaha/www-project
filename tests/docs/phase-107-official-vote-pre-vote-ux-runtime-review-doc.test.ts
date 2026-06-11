import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_107_DOC =
  'docs/www-project-phase-107-official-vote-pre-vote-ux-runtime-review-v1.md';

describe('Phase 107 official vote pre-vote UX runtime review doc', () => {
  it('documents the runtime review, hardening coverage, and preserved boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_107_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 107');
    expect(source).toContain('Official Vote Pre-vote UX Runtime Review');
    expect(source).toContain(
      'No runtime, API, schema, auth, Official Vote backend, vote evaluator, vote transaction order, or `vote-by-index` eligibility-before-option-resolve behavior changed',
    );

    expect(source).toContain('public/frontend/official-vote-pre-vote-hints.js');
    expect(source).toContain('public/frontend/vote-page.js');
    expect(source).toContain('public/frontend/public-mvp-ui.js');
    expect(source).toContain('public/frontend/policy-ui-placeholders.js');
    expect(source).toContain('public/frontend/public-mvp-layout.js');
    expect(source).toContain('public/vote.html');

    expect(source).toContain('Does not call `GET /users/me/profile`');
    expect(source).toContain("credentials: 'same-origin'");
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toMatch(/does not read, display, or infer age eligibility/i);
    expect(source).toMatch(
      /does not guarantee that a later Official Vote can be counted/i,
    );

    expect(source).toContain('does not call `POST /polls/:id/vote`');
    expect(source).toContain('does not call `POST /polls/:id/vote-by-index`');
    expect(source).toContain('does not resolve `option_index` to `option_id`');
    expect(source).toContain('does not record which option a user is preparing to choose');
    expect(source).toContain('Existing `vote-by-index` eligibility before option resolve remains unchanged');

    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('GET /users/me` response shape is unchanged');
    expect(source).toContain('GET /users/me/profile` behavior is unchanged');
    expect(source).toContain('PUT /users/me/profile` behavior is unchanged');
    expect(source).toContain('UserAuthResolver` is unchanged');
    expect(source).toContain('Reference Answer remains disconnected');
    expect(source).toContain('data-login-state-read="disabled"');
    expect(source).toContain('creator_session');
    expect(source).toContain('X-User-Id');
    expect(source).toContain('Vote token schema remains `user_id + poll_id`');
    expect(source).toContain('Counter schema remains `poll_id + option_id + shard_id`');
    expect(source).toContain('smoke:public:local');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 107');
    expect(readme).toContain(PHASE_107_DOC);
    expect(readme).toContain('Official Vote pre-vote UX runtime review');
  });
});
