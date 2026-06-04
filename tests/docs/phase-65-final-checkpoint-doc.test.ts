import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Phase 65 final creator auth ownership checkpoint doc', () => {
  it('summarizes session, creator APIs, cutover, retirement, and Phase 66', async () => {
    const source = await readFile(
      join(
        process.cwd(),
        'docs/www-project-phase-65-final-creator-auth-ownership-checkpoint-v1.md',
      ),
      'utf8',
    );

    expect(source).toContain('creator_sessions');
    expect(source).toContain('/creator/session');
    expect(source).toContain('fail-closed');
    expect(source).toContain('/creator/polls');
    expect(source).toContain('counter-free');
    expect(source).toContain('/my-polls?live=1');
    expect(source).toContain('LEGACY_CREATOR_WRITE_RETIRED');
    expect(source).toContain('410');
    expect(source).toContain('design-drafts/');
    expect(source).toMatch(/Phase 66/i);
    expect(source).toMatch(/eligibility/i);
  });
});
