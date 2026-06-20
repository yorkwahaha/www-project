import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_316A_DOC =
  'docs/www-project-phase-316a-deployment-operator-input-discovery-checkpoint-v1.md';

describe('Phase 316-A deployment operator input discovery checkpoint (static guards)', () => {
  it('aligns documented env names with source modules', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_316A_DOC), 'utf8');
    const packageJson = await readFile(join(process.cwd(), 'package.json'), 'utf8');
    const adminAuth = await readFile(
      join(process.cwd(), 'src/http/admin-auth.ts'),
      'utf8',
    );
    const userAuth = await readFile(
      join(process.cwd(), 'src/auth/production-credential-verifier.ts'),
      'utf8',
    );
    const loginSession = await readFile(
      join(process.cwd(), 'src/http/login-session-routes.ts'),
      'utf8',
    );
    const creatorConfig = await readFile(
      join(process.cwd(), 'src/creator-sessions/config.ts'),
      'utf8',
    );

    expect(doc).toContain('BLOCKED');
    expect(doc).toContain('4442241');
    expect(adminAuth).toContain('ADMIN_AUTH_CREDENTIALS_JSON');
    expect(userAuth).toContain('USER_AUTH_CREDENTIALS_JSON');
    expect(loginSession).toContain('LOGIN_SESSION_ALLOWED_ORIGINS_JSON');
    expect(creatorConfig).toContain('CREATOR_SESSION_ALLOWED_ORIGINS_JSON');
    expect(packageJson).toContain('"start": "node dist/index.js"');
    expect(packageJson).toContain('"migrate:check"');
    expect(doc).toContain('OI-1');
    expect(doc).toContain('OI-15');
  });

  it('keeps no deploy scripts and documents app wiring for auth routes', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_316A_DOC), 'utf8');
    const app = await readFile(join(process.cwd(), 'src/app.ts'), 'utf8');
    const scriptFiles = await readdir(join(process.cwd(), 'scripts'));

    expect(doc).toContain('no deploy scripts');
    expect(app).toContain('createProductionCredentialVerifierFromEnv');
    expect(app).toContain('loginSession: trustedCredentialVerifier');
    for (const fileName of scriptFiles) {
      expect(fileName).not.toMatch(/^deploy/i);
    }
  });

  it('documents migration count consistent with migrations directory', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_316A_DOC), 'utf8');
    const migrationFiles = await readdir(join(process.cwd(), 'migrations'));
    const sqlFiles = migrationFiles.filter((name) => name.endsWith('.sql'));

    expect(sqlFiles.length).toBe(12);
    expect(doc).toContain('12');
  });
});
