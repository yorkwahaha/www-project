import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_310_DOC =
  'docs/www-project-phase-310-site-chrome-frontend-module-static-route-fix-v1.md';
const PHASE_309_DOC =
  'docs/www-project-phase-309-results-reveal-animation-v1.md';

describe('Phase 310 site chrome frontend module static route fix doc', () => {
  it('documents FU-307-01, route-only scope, and results unblock context', async () => {
    const source = await readFile(join(process.cwd(), PHASE_310_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 310');
    expect(source).toContain('Site Chrome Frontend Module Static Route Fix');
    expect(source).toContain('FU-307-01');
    expect(source).toContain('328becf');
    expect(source).toContain(PHASE_309_DOC.replace('docs/', './'));

    expect(source).toContain('/frontend/auth-state-copy.js');
    expect(source).toContain('/frontend/login-state-ui.js');
    expect(source).toContain('/frontend/login-state-read.js');
    expect(source).toContain('/frontend/login-state-logout.js');
    expect(source).toContain('src/http/server.ts');
    expect(source).toContain('FU-307-01 CLOSED');
    expect(source).toContain('No changes to `public-mvp-layout.js`');

    expect(readme).toContain('Phase 310');
    expect(readme).toContain(PHASE_310_DOC);
  });

  it('records boundaries and validation gates', async () => {
    const source = await readFile(join(process.cwd(), PHASE_310_DOC), 'utf8');

    for (const token of [
      'Raw Option Linkage Ban',
      'collecting',
      'aggregate',
      'sendPublicFile',
      'public-results-detail-layout.js',
      'poll-lifecycle-controls.js',
      'git diff --check',
      'npm test',
      'npm run typecheck',
      'npm run build',
      'npm run smoke:public:local',
      'demo:public:local',
      '/results/demo?ui_state=revealed',
    ]) {
      expect(source, `Phase 310 doc should mention ${token}`).toContain(token);
    }

    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );
    expect(source).toContain(
      'phase-310-site-chrome-frontend-module-static-route-fix-doc.test.ts',
    );
    expect(source).toContain(
      'phase-310-site-chrome-frontend-module-static-route-fix.test.ts',
    );
  });
});
