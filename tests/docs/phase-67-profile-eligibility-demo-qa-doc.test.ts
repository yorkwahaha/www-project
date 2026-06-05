import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Phase 67 profile eligibility demo QA doc', () => {
  it('documents demo flow, auth limits, linkage ban, and manual QA', async () => {
    const source = await readFile(
      join(
        process.cwd(),
        'docs/www-project-phase-67-profile-eligibility-demo-qa-v1.md',
      ),
      'utf8',
    );

    expect(source).toContain('/profile');
    expect(source).toContain('/polls/new?live=1');
    expect(source).toContain('vote-by-index');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toMatch(/X-User-Id/i);
    expect(source).toMatch(/production user-auth wiring later/i);
    expect(source).toContain('Reference Answer');
    expect(source).toMatch(/不接.*profile eligibility/i);
    expect(source).toMatch(/Raw Option Linkage/i);
    expect(source).toContain('creator_session');
    expect(source).toMatch(/不得.*user auth|不得.*profile 授權/i);
    expect(source).toMatch(/Manual QA/i);
    expect(source).toContain('design-drafts/');
    expect(source).toContain('你目前不符合此問卷的投票資格');
  });
});
