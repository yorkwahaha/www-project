import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_313_DOC =
  'docs/www-project-phase-313-deployment-plan-dry-run-checkpoint-v1.md';
const PHASE_312_DOC =
  'docs/www-project-phase-312-public-mvp-release-readiness-checkpoint-v1.md';
const SMOKE_SCRIPT = 'scripts/smoke-public-local.mjs';
const MIGRATE_SCRIPT = 'scripts/migrate.mjs';

const REQUIRED_ENV_NAMES = [
  'DATABASE_URL',
  'APP_ENV',
  'ADMIN_AUTH_CREDENTIALS_JSON',
  'LOGIN_SESSION_ALLOWED_ORIGINS_JSON',
  'CREATOR_SESSION_ALLOWED_ORIGINS_JSON',
] as const;

describe('Phase 313 deployment plan dry run checkpoint (static guards)', () => {
  it('records deployment plan approval without executing deployment', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_313_DOC), 'utf8');
    const phase312 = await readFile(join(process.cwd(), PHASE_312_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(doc).toContain('59b73cd');
    expect(doc).toContain('Actual deployment NOT EXECUTED');
    expect(doc).toContain('**Deployment blockers identified:** none');
    expect(doc).toContain('actual deployment execution');
    expect(phase312).toContain('APPROVED for release/deployment planning');
    expect(readme).toContain(PHASE_313_DOC);
    expect(readme).toContain('Phase 313');
  });

  it('documents required environment variable names in source modules', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_313_DOC), 'utf8');
    const adminAuth = await readFile(
      join(process.cwd(), 'src/http/admin-auth.ts'),
      'utf8',
    );
    const userAuth = await readFile(
      join(process.cwd(), 'src/auth/production-credential-verifier.ts'),
      'utf8',
    );
    const creatorConfig = await readFile(
      join(process.cwd(), 'src/creator-sessions/config.ts'),
      'utf8',
    );
    const loginSession = await readFile(
      join(process.cwd(), 'src/http/login-session-routes.ts'),
      'utf8',
    );

    for (const name of REQUIRED_ENV_NAMES) {
      expect(doc).toContain(name);
    }
    expect(adminAuth).toContain('ADMIN_AUTH_CREDENTIALS_JSON');
    expect(userAuth).toContain('USER_AUTH_CREDENTIALS_JSON');
    expect(creatorConfig).toContain('CREATOR_SESSION_ALLOWED_ORIGINS_JSON');
    expect(loginSession).toContain('LOGIN_SESSION_ALLOWED_ORIGINS_JSON');
    expect(doc).toContain('Never commit');
  });

  it('keeps migrate and smoke scripts aligned with deployment dry-run plan', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_313_DOC), 'utf8');
    const migrate = await readFile(join(process.cwd(), MIGRATE_SCRIPT), 'utf8');
    const smoke = await readFile(join(process.cwd(), SMOKE_SCRIPT), 'utf8');
    const migrationFiles = await readdir(join(process.cwd(), 'migrations'));

    expect(migrationFiles.filter((f) => f.endsWith('.sql'))).toHaveLength(12);
    expect(migrate).toContain('DATABASE_URL');
    expect(migrate).toContain('schema_migrations');
    expect(smoke).toContain('/home/feed');
    expect(smoke).toContain('/frontend/public-mvp-home.js');
    expect(smoke).toContain('vote-by-index');
    expect(doc).toContain('12 migration');
  });

  it('does not add deploy scripts to scripts directory', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_313_DOC), 'utf8');
    const scriptFiles = await readdir(join(process.cwd(), 'scripts'));

    expect(doc).toContain('no deploy scripts');
    for (const fileName of scriptFiles) {
      expect(fileName, `scripts/${fileName}`).not.toMatch(/^deploy/i);
    }
  });
});
