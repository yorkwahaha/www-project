import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_316B_DOC =
  'docs/www-project-phase-316b-node-staging-cutover-planning-checkpoint-v1.md';
const PHASE_316A_DOC =
  'docs/www-project-phase-316a-deployment-operator-input-discovery-checkpoint-v1.md';
const PHASE_315_DOC =
  'docs/www-project-phase-315-deployment-execution-retry-checkpoint-v1.md';
const PHASE_313_DOC =
  'docs/www-project-phase-313-deployment-plan-dry-run-checkpoint-v1.md';

describe('Phase 316-B Node staging cutover planning checkpoint doc', () => {
  it('documents plan scope, commit, and BLOCKED staging status', async () => {
    const source = await readFile(join(process.cwd(), PHASE_316B_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 316-B');
    expect(source).toContain('Node Staging Cutover Planning');
    expect(source).toContain('cde552d');
    expect(source).toContain(PHASE_316A_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_315_DOC.replace('docs/', './'));
    expect(source).toContain(PHASE_313_DOC.replace('docs/', './'));

    expect(source).toContain('planning only');
    expect(source).toContain('No deployment');
    expect(source).toContain('No target migration');
    expect(source).toContain('BLOCKED');
    expect(source).toContain('actual deployment NOT EXECUTED');
    expect(source).toContain('No production deployment approval');

    expect(readme).toContain('Phase 316-B');
    expect(readme).toContain(PHASE_316B_DOC);
  });

  it('records Node requirements, cutover sequence, and operator blockers without secret values', async () => {
    const source = await readFile(join(process.cwd(), PHASE_316B_DOC), 'utf8');

    for (const token of [
      'Node.js',
      '>= 20',
      'npm run build',
      'npm start',
      'node dist/index.js',
      'dist/',
      'public/',
      'DATABASE_URL',
      'TLS',
      'reverse proxy',
      'git diff --check',
      'npm test',
      'npm run typecheck',
      'npm run migrate:check',
      'npm run migrate',
      'M-1',
      'M-10',
      'APP_ENV=production',
      'ADMIN_AUTH_CREDENTIALS_JSON',
      'LOGIN_SESSION_ALLOWED_ORIGINS_JSON',
      'CREATOR_SESSION_ALLOWED_ORIGINS_JSON',
      'USER_AUTH_CREDENTIALS_JSON',
      '501 NOT_IMPLEMENTED',
      'devDependencies',
      'npm ci --omit=dev',
      'no deploy scripts',
      'operator-input blockers, not code blockers',
      'Raw Option Linkage Ban',
      'Official Vote transaction order',
      'vote-by-index eligibility-before-option-resolve',
      'suitable only after adapter',
      'does not replace Phase 316-B',
    ]) {
      expect(source, `Phase 316-B doc should mention ${token}`).toContain(token);
    }

    for (const section of [
      'Node-compatible deployment requirements',
      'Staging cutover sequence',
      'Phase 315 operator-input blockers',
      'Production-parity staging environment guidance',
      'Known packaging risk',
      'Post-cutover smoke plan',
      'Privacy and integrity reaffirmation',
      'Cloudflare Workers relationship',
      'Agent self-check',
    ]) {
      expect(source, `Phase 316-B doc should contain section ${section}`).toContain(
        section,
      );
    }

    expect(source).not.toMatch(/postgres:\/\/[^:]+:[^@]+@/);
    expect(source).not.toMatch(/token_sha256["']?\s*:\s*["'][0-9a-f]{64}/i);
  });

  it('affirms plan-only scope and excludes Workers as active deployment route', async () => {
    const source = await readFile(join(process.cwd(), PHASE_316B_DOC), 'utf8');

    expect(source).toContain('No Cloudflare Workers');
    expect(source).toContain('wrangler');
    expect(source).toContain('Temporary Accounts');
    expect(source).toContain('Active deployment track');
    expect(source).toContain('Node staging cutover');
    expect(source).not.toContain('production deployment approved');
    expect(source).not.toContain('APPROVED for production deployment');

    expect(source).toContain(
      'phase-316b-node-staging-cutover-planning-checkpoint-doc.test.ts',
    );
    expect(source).toContain(
      'phase-316b-node-staging-cutover-planning-checkpoint.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );
  });
});
