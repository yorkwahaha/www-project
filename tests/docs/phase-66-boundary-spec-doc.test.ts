import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Phase 66 profile eligibility boundary spec doc', () => {
  it('locks schema, vote ordering, privacy, and auth separation', async () => {
    const source = await readFile(
      join(
        process.cwd(),
        'docs/www-project-phase-66-profile-eligibility-boundary-spec-v1.md',
      ),
      'utf8',
    );

    expect(source).toMatch(/66P-R/i);
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toMatch(/gender/i);
    expect(source).toContain('vote-by-index');
    expect(source).toContain('option_index');
    expect(source).toContain('option_id');
    expect(source).toContain('token 寫入');
    expect(source).toContain('不可區分');
    expect(source).toContain('Reference Answer');
    expect(source).toMatch(/Raw Option Linkage/i);
    expect(source).toContain('counter-free');
    expect(source).toContain('creator_session');
  });
});
