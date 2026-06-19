import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_313_DOC =
  'docs/www-project-phase-313-deployment-plan-dry-run-checkpoint-v1.md';
const PHASE_312_DOC =
  'docs/www-project-phase-312-public-mvp-release-readiness-checkpoint-v1.md';
const PHASE_274_DOC =
  'docs/www-project-phase-274-public-mvp-manual-release-handoff-operator-checklist-plan-v1.md';
const PHASE_280_DOC =
  'docs/www-project-phase-280-public-mvp-release-authorization-not-executed-status-final-checkpoint-v1.md';

describe('Phase 313 deployment plan dry run checkpoint doc', () => {
  it('documents checkpoint scope, reviewed commit, conclusion, and boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_313_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 313');
    expect(source).toContain('Deployment Plan and Dry Run Checkpoint');
    expect(source).toContain('59b73cd');
    expect(source).toContain(PHASE_312_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_274_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_280_DOC.replace('docs/', './'));

    expect(source).toContain('No runtime change');
    expect(source).toContain('Actual deployment NOT EXECUTED');
    expect(source).toContain('Phase 313 blockers: none identified');
    expect(source).toContain('This phase does not deploy');
    expect(source).toContain('not release execution');

    expect(readme).toContain('Phase 313');
    expect(readme).toContain(PHASE_313_DOC);
  });

  it('records deployment plan focus areas and dry-run expectations', async () => {
    const source = await readFile(join(process.cwd(), PHASE_313_DOC), 'utf8');

    for (const token of [
      'deployment readiness checklist',
      'DATABASE_URL',
      'ADMIN_AUTH_CREDENTIALS_JSON',
      'USER_AUTH_CREDENTIALS_JSON',
      'LOGIN_SESSION_ALLOWED_ORIGINS_JSON',
      'CREATOR_SESSION_ALLOWED_ORIGINS_JSON',
      'Never commit',
      'rollback',
      'migrate:check',
      'npm run migrate',
      'smoke:public:local',
      '/home/feed',
      'Homepage loads and hydrates',
      'Collecting states counter-free',
      'display-safe',
      'Raw Option Linkage Ban',
      'OBS-311-01',
      'EADDRINUSE',
      'actual deployment execution',
      'Official Vote transaction order',
      'eligibility-before-option-resolve',
      'Registration no auto-login',
      'Set-Cookie',
      '/users/me',
      'birth_year_month',
      'residential_region',
      'Post-deployment monitoring expectations',
      '12 migration',
    ]) {
      expect(source, `Phase 313 doc should mention ${token}`).toContain(token);
    }

    for (const section of [
      'Checkpoint session metadata',
      'Local dry-run automated gates',
      'Public MVP deployment readiness checklist',
      'Database migration expectations',
      'Deployment smoke test plan',
      'Post-deployment monitoring expectations',
      'Next-phase recommendation',
      'Agent self-check',
    ]) {
      expect(source, `Phase 313 doc should contain section ${section}`).toContain(
        section,
      );
    }
  });

  it('records the validation gates and guard test paths', async () => {
    const source = await readFile(join(process.cwd(), PHASE_313_DOC), 'utf8');
    for (const gate of [
      'git diff --check',
      'npm test',
      'npm run typecheck',
      'npm run build',
      'npm run migrate:check',
      'npm run smoke:public:local',
    ]) {
      expect(source, `Phase 313 doc should record ${gate}`).toContain(gate);
    }

    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );
    expect(source).toContain(
      'phase-313-deployment-plan-dry-run-checkpoint-doc.test.ts',
    );
    expect(source).toContain(
      'phase-313-deployment-plan-dry-run-checkpoint.test.ts',
    );
    expect(source).not.toMatch(/postgres:\/\/[^:]+:[^@]+@/);
  });
});
