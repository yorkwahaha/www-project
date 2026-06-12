import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_169_DOC =
  'docs/www-project-phase-169-public-mvp-full-flow-smoke-checkpoint-v1.md';

describe('Phase 169 public MVP full-flow smoke checkpoint doc', () => {
  it('documents checkpoint scope and preserved boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_169_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 169');
    expect(source).toContain('Public MVP Full-Flow Smoke Checkpoint');
    expect(source).toContain('Phase 168');
    expect(source).toContain('Phase 95');
    expect(source).toContain('Phase 133');
    expect(source).toContain('Phase 134');
    expect(source).toContain('Phase 164');
    expect(source).toContain('Phase 165');
    expect(source).toContain('Phase 166');
    expect(source).toContain('Phase 167');

    expect(source).toContain('/');
    expect(source).toContain('/registration');
    expect(source).toContain('/login');
    expect(source).toContain('/profile');
    expect(source).toContain('/explore');
    expect(source).toContain('/polls/new');
    expect(source).toContain('/polls/new?live=1');
    expect(source).toContain('/my-polls');
    expect(source).toContain('/my-polls?live=1');
    expect(source).toContain('/vote/:id');
    expect(source).toContain('/results/:id');
    expect(source).toContain('/faq');
    expect(source).toContain('/trust-levels');

    expect(source).toContain('Registration → login → profile → vote onboarding');
    expect(source).toContain('does not create session');
    expect(source).toContain('POST /login/session');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toContain('GET /polls/feed');
    expect(source).toContain('freshness-only');
    expect(source).toContain('parseLiveApiMode');
    expect(source).toContain('creator_session');
    expect(source).toContain('resolveResultRenderMode');
    expect(source).toContain('revealed');
    expect(source).toContain('locked');
    expect(source).toContain('post_lock');
    expect(source).toContain('must not echo backend payload');
    expect(source).toContain('policy-ui-placeholders.js');
    expect(source).toContain('HELP_COPY');
    expect(source).toContain('design-drafts/');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('UserAuthResolver');
    expect(source).toContain('Reference Answer');
    expect(source).toContain('Vote-by-index body remains `{ option_index }` only');
    expect(source).toContain('Official Vote transaction order unchanged');
    expect(source).toContain('smoke:public:local');
    expect(source).toContain('scripts/smoke-public-local.mjs');
    expect(source).toContain(
      'phase-169-public-mvp-full-flow-smoke-checkpoint.test.ts',
    );
    expect(source).toContain(
      'phase-134-auth-profile-flow-milestone-review-checkpoint.test.ts',
    );
    expect(source).toContain(
      'phase-133-public-participation-results-flow-milestone-review-checkpoint.test.ts',
    );

    expect(readme).toContain('Phase 169');
    expect(readme).toContain(PHASE_169_DOC);
    expect(readme).toContain('Public MVP full-flow smoke checkpoint');
  });
});
