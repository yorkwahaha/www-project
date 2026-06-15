import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_281_DOC =
  'docs/www-project-phase-281-public-mvp-post-authorization-maintenance-next-workstream-plan-v1.md';
const PHASE_282_DOC =
  'docs/www-project-phase-282-public-mvp-post-authorization-product-backlog-seed-plan-v1.md';

describe('Phase 282 public MVP post-authorization product backlog seed plan doc', () => {
  it('documents plan purpose, current status, backlog categories, rules, and seed table', async () => {
    const source = await readFile(join(process.cwd(), PHASE_282_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 282');
    expect(source).toContain('Public MVP Post-Authorization Product Backlog Seed Plan');
    expect(source).toContain('plan only');
    expect(source).toContain('68d2d6c');
    expect(source).toContain(PHASE_281_DOC.replace('docs/', './'));

    for (const statusField of [
      'Current Release Status',
      'Launch approved for manual release preparation',
      'Operator release execution authorized',
      'Actual deployment NOT EXECUTED',
      'No deploy scripts added',
      'No production configuration changed',
    ]) {
      expect(source).toContain(statusField);
    }

    for (const backlog of [
      'Backlog Categories',
      'post-release monitoring notes',
      'product polish candidates',
      'documentation cleanup',
      'manual QA follow-up',
      'future production hardening candidates',
      'later runtime improvement candidates',
    ]) {
      expect(source).toContain(backlog);
    }

    for (const rule of [
      'Candidate Backlog Rules',
      'Backlog items are not implementation approval',
      'Runtime changes require a separate numbered phase',
      'Deployment must be separately executed and recorded',
      'Production hardening candidates require explicit review before implementation',
      'auth/privacy/vote/result/schema-related work must be treated as high-risk',
      'does not perform deployment',
      'does not add deploy scripts',
      'does not modify production configuration',
      'no deployment performed',
      'candidates only',
    ]) {
      expect(source).toContain(rule);
    }

    for (const seedItem of [
      'Seed Backlog Table',
      'BL-282-01',
      'BL-282-02',
      'BL-282-03',
      'BL-282-04',
      'BL-282-05',
      'BL-282-06',
      'BL-282-07',
      'BL-282-08',
      'Item ID',
      'Risk level',
      'Required next action',
    ]) {
      expect(source).toContain(seedItem);
    }

    for (const route of [
      '/',
      '/explore',
      '/registration',
      '/login',
      '/profile',
      '/vote',
      '/results',
      '/my-polls',
    ]) {
      expect(source).toContain(route);
    }

    expect(source).toContain('option_index');
    expect(source).toContain('eligibility-before-option-resolve');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('positive_feedback');
    expect(source).toContain('回饋良好');
    expect(source).toContain('does not call `GET /users/me` after success');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toContain('UserAuthResolver');
    expect(source).toContain('smoke:public:local');
    expect(source).toContain('migrate:check');

    for (const nonGoal of [
      'no runtime change',
      'no API change',
      'no frontend behavior change',
      'no migration',
      'no schema change',
      'localStorage',
      'sessionStorage',
      'analytics / metrics / APM / debug tracking',
      'design-drafts/',
    ]) {
      expect(source).toContain(nonGoal);
    }

    expect(source).toContain('Phase 283 blockers: none identified');
    expect(source).toContain(
      'phase-282-public-mvp-post-authorization-product-backlog-seed-plan-doc.test.ts',
    );
    expect(source).toContain(
      'phase-282-public-mvp-post-authorization-product-backlog-seed-plan.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 282');
    expect(readme).toContain(PHASE_282_DOC);
    expect(readme).toContain('product backlog seed plan');
    expect(readme).toContain('Phase 283 blockers: none identified');
  });

  it('confirms Phase 281 prerequisite plan exists with expected status', async () => {
    const plan = await readFile(join(process.cwd(), PHASE_281_DOC), 'utf8');

    expect(plan).toContain('Phase 281 is plan-only');
    expect(plan).toContain('Actual deployment NOT EXECUTED');
    expect(plan).toContain('Operator release execution authorized');
    expect(plan).toContain('Post-authorization product backlog planning');
  });
});
