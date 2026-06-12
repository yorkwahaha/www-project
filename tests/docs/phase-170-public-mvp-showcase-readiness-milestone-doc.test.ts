import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_170_DOC =
  'docs/www-project-phase-170-public-mvp-showcase-readiness-milestone-v1.md';

describe('Phase 170 public MVP showcase readiness milestone doc', () => {
  it('documents milestone scope, demo posture, and fixed boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_170_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 170');
    expect(source).toContain('Public MVP Showcase Readiness Milestone');
    expect(source).toContain('Phase 169');
    expect(source).toContain('Phase 135');
    expect(source).toContain('Phase 161');
    expect(source).toContain('Phase 163');
    expect(source).toContain('Phase 164');
    expect(source).toContain('Phase 165');
    expect(source).toContain('Phase 166');
    expect(source).toContain('Phase 167');
    expect(source).toContain('Phase 168');

    expect(source).toContain('safe to demo');
    expect(source).toContain('not production-ready');
    expect(source).toContain('does not claim full production readiness');
    expect(source).toContain('creator_session');
    expect(source).toContain('not production public identity');
    expect(source).toContain('freshness-only');
    expect(source).toContain('not hot/ranking/personalized');
    expect(source).toContain('revealed');
    expect(source).toContain('locked');
    expect(source).toContain('post_lock');
    expect(source).toContain('display-safe aggregate');
    expect(source).toContain('does not auto-login');
    expect(source).toContain('POST /login/session');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toContain('no backend/API/DB/schema/auth/vote transaction/eligibility/result visibility changes needed');

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

    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('UserAuthResolver');
    expect(source).toContain('Reference Answer');
    expect(source).toContain('policy-ui-placeholders.js');
    expect(source).toContain('HELP_COPY');
    expect(source).toContain('design-drafts/');
    expect(source).toContain('Vote-by-index body remains `{ option_index }` only');
    expect(source).toContain('Official Vote transaction order unchanged');
    expect(source).toContain('smoke:public:local');
    expect(source).toContain(
      'phase-170-public-mvp-showcase-readiness-milestone.test.ts',
    );

    expect(readme).toContain('Phase 170');
    expect(readme).toContain(PHASE_170_DOC);
    expect(readme).toContain('Public MVP showcase readiness milestone');
  });
});
