import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Phase 66 final profile eligibility checkpoint doc', () => {
  it('summarizes 66A-66F, schema, vote ordering, API, UX, and limits', async () => {
    const source = await readFile(
      join(
        process.cwd(),
        'docs/www-project-phase-66-final-profile-eligibility-checkpoint-v1.md',
      ),
      'utf8',
    );

    expect(source).toMatch(/66A/i);
    expect(source).toMatch(/66F/i);
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toMatch(/gender/i);
    expect(source).toContain('vote-by-index');
    expect(source).toContain('option resolve');
    expect(source).toContain('token');
    expect(source).toContain('counter');
    expect(source).toContain('isProfileEligibleForOfficialVote');
    expect(source).toContain('Reference Answer');
    expect(source).toContain('/users/me/profile');
    expect(source).toContain('/profile');
    expect(source).toContain('creator_session');
    expect(source).toMatch(/Raw Option Linkage/i);
    expect(source).toMatch(/Manual QA/i);
    expect(source).toContain('X-User-Id');
    expect(source).toMatch(/production user-auth wiring later/i);
    expect(source).toContain('design-drafts/');
  });
});
