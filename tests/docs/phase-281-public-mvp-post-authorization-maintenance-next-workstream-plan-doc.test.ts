import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_280_DOC =
  'docs/www-project-phase-280-public-mvp-release-authorization-not-executed-status-final-checkpoint-v1.md';
const PHASE_281_DOC =
  'docs/www-project-phase-281-public-mvp-post-authorization-maintenance-next-workstream-plan-v1.md';

describe('Phase 281 public MVP post-authorization maintenance next workstream plan doc', () => {
  it('documents plan purpose, current status, workstreams, backlog, and separation rules', async () => {
    const source = await readFile(join(process.cwd(), PHASE_281_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 281');
    expect(source).toContain('Public MVP Post-Authorization Maintenance / Next Workstream Plan');
    expect(source).toContain('plan only');
    expect(source).toContain('bfc1dd3');
    expect(source).toContain(PHASE_280_DOC.replace('docs/', './'));

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

    for (const workstream of [
      'Allowed Next Workstreams',
      'Actual operator release execution and record update / separate phase',
      'Runtime bugfix phase',
      'Post-authorization product backlog planning',
      'W-1',
      'W-2',
      'W-3',
    ]) {
      expect(source).toContain(workstream);
    }

    for (const disallowed of [
      'Disallowed Actions',
      'deployment',
      'production configuration changes',
      'deploy script additions',
      'runtime/API/DB/backend/auth/vote/result/creator/profile/privacy changes',
    ]) {
      expect(source).toContain(disallowed);
    }

    for (const backlog of [
      'Backlog Categories',
      'post-release monitoring notes',
      'product polish candidates',
      'documentation cleanup',
      'manual QA follow-up',
      'future production hardening candidates',
    ]) {
      expect(source).toContain(backlog);
    }

    for (const rule of [
      'separate numbered phase',
      'separately executed and recorded',
      'post-release smoke must be recorded',
      'abort / rollback / incident / follow-up must be recorded if triggered',
      'does not perform deployment',
      'does not add deploy scripts',
      'does not modify production configuration',
      'no deployment performed',
    ]) {
      expect(source).toContain(rule);
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

    expect(source).toContain('Phase 282 blockers: none identified');
    expect(source).toContain(
      'phase-281-public-mvp-post-authorization-maintenance-next-workstream-plan-doc.test.ts',
    );
    expect(source).toContain(
      'phase-281-public-mvp-post-authorization-maintenance-next-workstream-plan.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 281');
    expect(readme).toContain(PHASE_281_DOC);
    expect(readme).toContain('post-authorization maintenance');
    expect(readme).toContain('next workstream plan');
    expect(readme).toContain('Phase 282 blockers: none identified');
  });

  it('confirms Phase 280 prerequisite checkpoint exists with expected status', async () => {
    const checkpoint = await readFile(join(process.cwd(), PHASE_280_DOC), 'utf8');

    expect(checkpoint).toContain(
      'APPROVED — release authorization / not-executed status final checkpoint complete',
    );
    expect(checkpoint).toContain('Actual deployment NOT EXECUTED');
    expect(checkpoint).toContain('Operator release execution authorized');
  });
});
