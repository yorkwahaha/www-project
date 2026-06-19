import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_314_DOC =
  'docs/www-project-phase-314-actual-deployment-execution-checkpoint-v1.md';
const PHASE_313_DOC =
  'docs/www-project-phase-313-deployment-plan-dry-run-checkpoint-v1.md';
const PHASE_280_DOC =
  'docs/www-project-phase-280-public-mvp-release-authorization-not-executed-status-final-checkpoint-v1.md';

describe('Phase 314 actual deployment execution checkpoint doc', () => {
  it('documents blocked execution scope, commit, and NOT DEPLOYED conclusion', async () => {
    const source = await readFile(join(process.cwd(), PHASE_314_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 314');
    expect(source).toContain('Actual Deployment Execution Checkpoint');
    expect(source).toContain('0cf5f74');
    expect(source).toContain(PHASE_313_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_280_DOC.replace('docs/', './'));

    expect(source).toContain('BLOCKED');
    expect(source).toContain('NOT DEPLOYED');
    expect(source).toContain('not faked');
    expect(source).toContain('actual deployment NOT EXECUTED');
    expect(source).toContain('Phase 314 deployment blockers');

    expect(readme).toContain('Phase 314');
    expect(readme).toContain(PHASE_314_DOC);
  });

  it('records missing credentials and blocked deployment steps without secret values', async () => {
    const source = await readFile(join(process.cwd(), PHASE_314_DOC), 'utf8');

    for (const token of [
      'DATABASE_URL',
      'APP_ENV',
      'ADMIN_AUTH_CREDENTIALS_JSON',
      'LOGIN_SESSION_ALLOWED_ORIGINS_JSON',
      'CREATOR_SESSION_ALLOWED_ORIGINS_JSON',
      'Missing',
      'Not identified',
      'no deploy scripts',
      'Post-cutover smoke',
      'SKIPPED',
      'rollback',
      'Forward-fix preferred',
      'Raw Option Linkage Ban',
      'OBS-311-01',
      'smoke:public:local',
      'www_test',
      'migrate:check',
      'npm run build',
      'Human operator sign-off',
    ]) {
      expect(source, `Phase 314 doc should mention ${token}`).toContain(token);
    }

    for (const section of [
      'Execution session metadata',
      'Pre-execution checks completed',
      'Missing credentials',
      'Deployment steps not executed',
      'Rollback readiness',
      'Agent self-check',
    ]) {
      expect(source, `Phase 314 doc should contain section ${section}`).toContain(
        section,
      );
    }

    expect(source).not.toMatch(/postgres:\/\/[^:]+:[^@]+@/);
    expect(source).not.toMatch(/token_sha256["']?\s*:\s*["'][0-9a-f]{64}/i);
  });

  it('records the validation gates run for the checkpoint', async () => {
    const source = await readFile(join(process.cwd(), PHASE_314_DOC), 'utf8');
    for (const gate of [
      'git diff --check',
      'npm test',
      'npm run typecheck',
      'npm run build',
      'npm run migrate:check',
      'npm run smoke:public:local',
    ]) {
      expect(source, `Phase 314 doc should record ${gate}`).toContain(gate);
    }

    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );
    expect(source).toContain(
      'phase-314-actual-deployment-execution-checkpoint-doc.test.ts',
    );
    expect(source).toContain(
      'phase-314-actual-deployment-execution-checkpoint.test.ts',
    );
  });
});
