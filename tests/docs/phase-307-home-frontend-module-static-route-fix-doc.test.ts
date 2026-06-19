import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_307_DOC =
  'docs/www-project-phase-307-home-frontend-module-static-route-fix-v1.md';
const PHASE_306_DOC =
  'docs/www-project-phase-306-homepage-real-device-visual-review-checkpoint-v1.md';

describe('Phase 307 home frontend module static route fix doc', () => {
  it('documents FU-306-01, B-306-01 closure, and route-only scope', async () => {
    const source = await readFile(join(process.cwd(), PHASE_307_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 307');
    expect(source).toContain('Home Frontend Module Static Route Fix');
    expect(source).toContain('FU-306-01');
    expect(source).toContain('B-306-01');
    expect(source).toContain('09b5535');
    expect(source).toContain(PHASE_306_DOC.replace('docs/', './'));

    expect(source).toContain('/frontend/public-mvp-home.js');
    expect(source).toContain('/frontend/home-feed.js');
    expect(source).toContain('src/http/server.ts');
    expect(source).toContain('FU-306-01 CLOSED');
    expect(source).toContain('No homepage card rendering logic');

    expect(readme).toContain('Phase 307');
    expect(readme).toContain(PHASE_307_DOC);
  });

  it('records boundaries and validation gates', async () => {
    const source = await readFile(join(process.cwd(), PHASE_307_DOC), 'utf8');

    for (const token of [
      'Raw Option Linkage Ban',
      '/home/feed',
      'collecting',
      'revealed',
      'sendPublicFile',
      'git diff --check',
      'npm test',
      'npm run typecheck',
      'npm run build',
      'npm run smoke:public:local',
      'demo:public:local',
    ]) {
      expect(source, `Phase 307 doc should mention ${token}`).toContain(token);
    }

    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );
    expect(source).toContain(
      'phase-307-home-frontend-module-static-route-fix-doc.test.ts',
    );
    expect(source).toContain(
      'phase-307-home-frontend-module-static-route-fix.test.ts',
    );
  });
});
