import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_316B_DOC =
  'docs/www-project-phase-316b-node-staging-cutover-planning-checkpoint-v1.md';

describe('Phase 316-B Node staging cutover planning checkpoint (static guards)', () => {
  it('aligns documented commands and env names with source modules', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_316B_DOC), 'utf8');
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
    const dbClient = await readFile(join(process.cwd(), 'src/db/client.ts'), 'utf8');

    expect(doc).toContain('BLOCKED');
    expect(doc).toContain('cde552d');
    expect(doc).toContain('operator-input blockers, not code blockers');
    expect(adminAuth).toContain('ADMIN_AUTH_CREDENTIALS_JSON');
    expect(userAuth).toContain('USER_AUTH_CREDENTIALS_JSON');
    expect(loginSession).toContain('LOGIN_SESSION_ALLOWED_ORIGINS_JSON');
    expect(creatorConfig).toContain('CREATOR_SESSION_ALLOWED_ORIGINS_JSON');
    expect(dbClient).toContain('DATABASE_URL');
    expect(packageJson).toContain('"start": "node dist/index.js"');
    expect(packageJson).toContain('"engines"');
    expect(packageJson).toContain('>=20');
    expect(packageJson).toContain('"pg"');
    expect(doc).toContain('devDependencies');
  });

  it('keeps plan-only posture and no deploy scripts', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_316B_DOC), 'utf8');
    const app = await readFile(join(process.cwd(), 'src/app.ts'), 'utf8');
    const scriptFiles = await readdir(join(process.cwd(), 'scripts'));

    expect(doc).toContain('planning only');
    expect(doc).toContain('No runtime behavior is changed');
    expect(doc).toContain('suitable only after adapter');
    expect(doc).toContain('does not replace Phase 316-B');
    expect(app).toContain('createProductionCredentialVerifierFromEnv');
    for (const fileName of scriptFiles) {
      expect(fileName).not.toMatch(/^deploy/i);
    }
  });

  it('documents migration count and privacy boundaries consistent with repo', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_316B_DOC), 'utf8');
    const migrationFiles = await readdir(join(process.cwd(), 'migrations'));
    const sqlFiles = migrationFiles.filter((name) => name.endsWith('.sql'));
    const pollRepo = await readFile(
      join(process.cwd(), 'src/polls/repository.ts'),
      'utf8',
    );

    expect(sqlFiles.length).toBe(12);
    expect(doc).toContain('12');
    expect(doc).toContain('Raw Option Linkage Ban');
    expect(doc).toContain('result visibility');
    expect(doc).toContain('Official Vote transaction order');
    expect(doc).toContain('vote-by-index eligibility-before-option-resolve');
    expect(doc).toContain('Registration no auto-login');
    expect(doc).toContain('/users/me');
    expect(pollRepo).toContain('castOfficialVote');
    expect(pollRepo).toContain("await client.query('BEGIN')");
  });
});
