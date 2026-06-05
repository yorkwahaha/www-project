import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Phase 68 public demo polish manual QA closure doc', () => {
  it('documents demo order, auth split, smoke limits, and profile scope', async () => {
    const source = await readFile(
      join(
        process.cwd(),
        'docs/www-project-phase-68-public-demo-polish-manual-qa-closure-v1.md',
      ),
      'utf8',
    );

    expect(source).toContain('/polls/new?live=1');
    expect(source).toContain('/profile');
    expect(source).toContain('creator_session');
    expect(source).toMatch(/X-User-Id/i);
    expect(source).toMatch(/production user-auth wiring later/i);
    expect(source).toMatch(/不是.*user auth|不是.*一般使用者登入|僅.*\/creator/i);
    expect(source).toContain('smoke:public:local');
    expect(source).toMatch(/不接.*profile eligibility/i);
    expect(source).toMatch(/Raw Option Linkage/i);
    expect(source).toContain('manual-qa-v1.md');
    expect(source).toContain('design-drafts/');
  });
});
