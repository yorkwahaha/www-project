import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_316A_DOC =
  'docs/www-project-phase-316a-deployment-operator-input-discovery-checkpoint-v1.md';
const PHASE_315_DOC =
  'docs/www-project-phase-315-deployment-execution-retry-checkpoint-v1.md';
const PHASE_313_DOC =
  'docs/www-project-phase-313-deployment-plan-dry-run-checkpoint-v1.md';

describe('Phase 316-A deployment operator input discovery checkpoint doc', () => {
  it('documents discovery scope, commit, and BLOCKED staging status', async () => {
    const source = await readFile(join(process.cwd(), PHASE_316A_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 316-A');
    expect(source).toContain('Deployment Operator Input Discovery');
    expect(source).toContain('4442241');
    expect(source).toContain(PHASE_315_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_313_DOC.replace('docs/', './'));

    expect(source).toContain('No deployment');
    expect(source).toContain('No target migration');
    expect(source).toContain('BLOCKED');
    expect(source).toContain('READY TO USE');
    expect(source).toContain('actual deployment NOT EXECUTED');

    expect(readme).toContain('Phase 316-A');
    expect(readme).toContain(PHASE_316A_DOC);
  });

  it('records env vars, JSON schemas, and commands without secret values', async () => {
    const source = await readFile(join(process.cwd(), PHASE_316A_DOC), 'utf8');

    for (const token of [
      'DATABASE_URL',
      'APP_ENV',
      'ADMIN_AUTH_CREDENTIALS_JSON',
      'LOGIN_SESSION_ALLOWED_ORIGINS_JSON',
      'CREATOR_SESSION_ALLOWED_ORIGINS_JSON',
      'USER_AUTH_CREDENTIALS_JSON',
      'token_sha256',
      'admin_user_id',
      'correction:read',
      'correction:write',
      'expires_at',
      'revoked_at',
      'npm run build',
      'npm start',
      'npm run migrate:check',
      'npm run migrate',
      'smoke:public:local',
      'no deploy scripts',
      'dist/',
      'public/',
      'JSON schemas',
      'Staging deployment operator checklist',
      'Raw Option Linkage Ban',
      '501 NOT_IMPLEMENTED',
    ]) {
      expect(source, `Phase 316-A doc should mention ${token}`).toContain(token);
    }

    for (const section of [
      'Verified commands',
      'Required environment variables',
      'JSON schemas',
      'Staging deployment operator checklist',
      'Post-cutover smoke plan',
      'Agent self-check',
    ]) {
      expect(source, `Phase 316-A doc should contain section ${section}`).toContain(
        section,
      );
    }

    expect(source).not.toMatch(/postgres:\/\/[^:]+:[^@]+@/);
    expect(source).not.toMatch(/token_sha256["']?\s*:\s*["'][0-9a-f]{64}/i);
  });

  it('records the validation gates and guard test paths', async () => {
    const source = await readFile(join(process.cwd(), PHASE_316A_DOC), 'utf8');
    for (const gate of [
      'git status',
      'git diff --check',
      'npm test',
      'npm run typecheck',
      'npm run build',
      'npm run migrate:check',
    ]) {
      expect(source, `Phase 316-A doc should record ${gate}`).toContain(gate);
    }

    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );
    expect(source).toContain(
      'phase-316a-deployment-operator-input-discovery-checkpoint-doc.test.ts',
    );
    expect(source).toContain(
      'phase-316a-deployment-operator-input-discovery-checkpoint.test.ts',
    );
  });
});
