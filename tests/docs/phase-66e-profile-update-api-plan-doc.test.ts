import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Phase 66E profile update API plan doc', () => {
  it('locks docs-only scope, profile fields, auth, privacy, and participation boundaries', async () => {
    const source = await readFile(
      join(
        process.cwd(),
        'docs/www-project-phase-66e-profile-update-api-plan-v1.md',
      ),
      'utf8',
    );
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toMatch(/plan\/docs\/spec only/i);
    expect(source).toContain('No runtime API');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toMatch(/gender/);
    expect(source).toContain('Exact birthday');
    expect(source).toContain('coarse region code');
    expect(source).toContain('/users/me/profile');
    expect(source).toContain('`creator_session` is not user profile authority');
    expect(source).toContain('Vote tokens: `user_id + poll_id` only.');
    expect(source).toContain('Official vote counters: `poll_id + option_id + shard_id` only.');
    expect(source).toContain('before option resolution, token write, or counter increment');
    expect(source).toContain('avoid revealing whether the submitted `option_index` exists');
    expect(source).toContain('Reference Answer remains outside profile eligibility');
    expect(source).toContain('No new migration is needed');
    expect(readme).toContain('Phase 66E-P (docs)');
    expect(readme).toContain('docs/www-project-phase-66e-profile-update-api-plan-v1.md');
  });
});
