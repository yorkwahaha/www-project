import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Phase 62 public MVP status checkpoint doc', () => {
  it('summarizes lifecycle state, scheduler limits, and next-phase risks', async () => {
    const source = await readFile(
      join(
        process.cwd(),
        'docs/www-project-phase-62-public-mvp-status-checkpoint-v1.md',
      ),
      'utf8',
    );

    expect(source).toContain('/polls/new?live=1');
    expect(source).toContain('counter-free');
    expect(source).toContain('revealed');
    expect(source).toContain('post_lock');
    expect(source).toContain('58A');
    expect(source).toContain('尚未');
    expect(source).toContain('cron');
    expect(source).toContain('design-drafts/');
    expect(source).toMatch(/auth.*session/i);
    expect(source).toMatch(/eligibility/i);
    expect(source).toMatch(/scheduler deployment/i);
  });
});
