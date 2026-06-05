import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Phase 66F profile UX onboarding plan doc', () => {
  it('locks docs-only UX scope and privacy boundaries', async () => {
    const source = await readFile(
      join(
        process.cwd(),
        'docs/www-project-phase-66f-profile-ux-onboarding-plan-v1.md',
      ),
      'utf8',
    );
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toMatch(/docs\/spec\/test guard only/i);
    expect(source).toContain('No runtime route');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(source).toContain('`gender` or any gender-equivalent field');
    expect(source).toContain('Exact birthday');
    expect(source).toContain('address, GPS, geocode');
    expect(source).toContain('limited to collecting coarse user-provided profile data for Official Vote eligibility checks');
    expect(source).toContain('not a demographic reporting feature');
    expect(source).toContain('not a ranking feature');
    expect(source).toContain('not personalization');
    expect(source).toContain('must not reveal whether a submitted `option_index` exists');
    expect(source).toContain('must not reveal an internal `option_id`');
    expect(source).toContain('must not repeat option text');
    expect(source).toContain('You are not eligible to vote in this poll.');
    expect(source).toContain('Reference Answer remains outside profile eligibility');
    expect(source).toContain('`creator_session` must not affect public vote');
    expect(source).toContain('Official Vote eligibility stays inside the vote transaction');
    expect(source).toContain('Official Vote eligibility runs before option resolution, vote token write, and counter increment');
    expect(source).toContain('Vote tokens remain `user_id + poll_id`');
    expect(source).toContain('Counters remain `poll_id + option_id + shard_id`');
    expect(source).toContain('No profile snapshot, vote-time eligibility snapshot, historical backfill, vote replay, or recalculation is introduced');
    expect(source).toContain('There is no runtime rollback');
    expect(readme).toContain('Phase 66F-P (docs)');
    expect(readme).toContain('docs/www-project-phase-66f-profile-ux-onboarding-plan-v1.md');
  });
});
