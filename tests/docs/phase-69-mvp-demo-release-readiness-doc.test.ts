import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Phase 69 MVP demo release readiness handoff doc', () => {
  it('documents demo scope, startup, test order, limits, boundaries, and checklist', async () => {
    const source = await readFile(
      join(
        process.cwd(),
        'docs/www-project-phase-69-mvp-demo-release-readiness-handoff-v1.md',
      ),
      'utf8',
    );

    expect(source).toContain('npm run demo:public:local');
    expect(source).toContain('/polls/new?live=1');
    expect(source).toContain('/profile');
    expect(source).toContain('creator_session');
    expect(source).toMatch(/X-User-Id/i);
    expect(source).toMatch(/production user-auth wiring later/i);
    expect(source).toMatch(/不是.*user auth|不是.*一般使用者登入|只限.*\/creator/i);
    expect(source).toMatch(/scheduler.*不在.*npm start|不在.*npm start/i);
    expect(source).toContain('smoke:public:local');
    expect(source).toMatch(/不接.*profile eligibility/i);
    expect(source).toMatch(/Raw Option Linkage/i);
    expect(source).toContain('manual-qa-v1.md');
    expect(source).toContain('design-drafts/');
    expect(source).toMatch(/release readiness checklist/i);
  });
});
