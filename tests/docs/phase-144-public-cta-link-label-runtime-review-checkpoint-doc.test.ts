import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_144_DOC =
  'docs/www-project-phase-144-public-cta-link-label-runtime-review-checkpoint-v1.md';

describe('Phase 144 public CTA link label runtime review checkpoint doc', () => {
  it('documents Phase 143 runtime review conclusions and fixed boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_144_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 144');
    expect(source).toContain('Public CTA / Link Label Runtime Review Checkpoint');
    expect(source).toContain('No runtime, frontend behavior, API behavior');
    expect(source).toContain('Phase 143');

    expect(source).toContain('PUBLIC_CTA_LINK_LABELS');
    expect(source).toContain('CTA / link labels are frontend-owned only');
    expect(source).toContain('Auth / nav CTA remains identifier-free');
    expect(source).toContain('Profile CTA does not echo raw payload');
    expect(source).toContain('Vote CTA remains neutral');
    expect(source).toContain('Results CTA remains free of aggregate preview in link text');

    expect(source).toContain('/login');
    expect(source).toContain('/registration');
    expect(source).toContain('/profile');
    expect(source).toContain('/vote/:id');
    expect(source).toContain('/results/:id');
    expect(source).toContain('/explore');
    expect(source).toContain('/my-polls?live=1');
    expect(source).toContain('/polls/new');
    expect(source).toContain('auth-state-copy');
    expect(source).toContain('poll-lifecycle-controls');

    expect(source).toContain('does not auto-login');
    expect(source).toContain('does not Set-Cookie');
    expect(source).toContain('does not read `/users/me`');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toContain('creator_session` remains non-production identity');
    expect(source).toContain('Official Vote transaction order unchanged');
    expect(source).toContain('eligibility-before-option-resolve unchanged');
    expect(source).toContain('Reference Answer remains disconnected');
    expect(source).toContain('Raw Option Linkage Ban preserved');
    expect(source).toContain('X-User-Id` remains explicit non-production compatibility only');
    expect(source).toContain('No new observability or analytics linkage');
    expect(source).toContain('revealed` / `locked` / `post_lock');

    expect(source).toContain(
      'phase-144-public-cta-link-label-runtime-review-checkpoint.test.ts',
    );
    expect(source).toContain('smoke:public:local');
    expect(source).toContain('Docker Desktop remains unavailable');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 144');
    expect(readme).toContain(PHASE_144_DOC);
    expect(readme).toContain('Public CTA / link label runtime review checkpoint');
  });
});
