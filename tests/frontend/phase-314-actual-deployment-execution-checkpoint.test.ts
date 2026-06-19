import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_314_DOC =
  'docs/www-project-phase-314-actual-deployment-execution-checkpoint-v1.md';
const PHASE_313_DOC =
  'docs/www-project-phase-313-deployment-plan-dry-run-checkpoint-v1.md';

describe('Phase 314 actual deployment execution checkpoint (static guards)', () => {
  it('records blocked deployment without faking cutover', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_314_DOC), 'utf8');
    const phase313 = await readFile(join(process.cwd(), PHASE_313_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(doc).toContain('0cf5f74');
    expect(doc).toContain('BLOCKED / NOT DEPLOYED');
    expect(doc).toContain('not faked');
    expect(doc).toContain('actual deployment NOT EXECUTED');
    expect(phase313).toContain('actual deployment execution');
    expect(readme).toContain(PHASE_314_DOC);
    expect(readme).toContain('Phase 314');
  });

  it('documents missing env names aligned with source modules', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_314_DOC), 'utf8');
    const adminAuth = await readFile(
      join(process.cwd(), 'src/http/admin-auth.ts'),
      'utf8',
    );
    const creatorConfig = await readFile(
      join(process.cwd(), 'src/creator-sessions/config.ts'),
      'utf8',
    );

    expect(adminAuth).toContain('ADMIN_AUTH_CREDENTIALS_JSON');
    expect(creatorConfig).toContain('CREATOR_SESSION_ALLOWED_ORIGINS_JSON');
    expect(doc).toContain('M-1');
    expect(doc).toContain('M-7');
    expect(doc).toContain('No secret values');
  });

  it('keeps no deploy scripts and no runtime drift markers', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_314_DOC), 'utf8');
    const scriptFiles = await readdir(join(process.cwd(), 'scripts'));
    const server = await readFile(join(process.cwd(), 'src/http/server.ts'), 'utf8');

    expect(doc).toContain('no deploy scripts');
    for (const fileName of scriptFiles) {
      expect(fileName).not.toMatch(/^deploy/i);
    }
    expect(server).not.toContain('Phase 314');
    expect(doc).toContain('Raw Option Linkage Ban');
  });
});
