import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Phase 70 production user auth account boundary plan doc', () => {
  it('locks docs-only production auth scope and privacy boundaries', async () => {
    const source = await readFile(
      join(
        process.cwd(),
        'docs/www-project-phase-70-production-user-auth-account-boundary-plan-v1.md',
      ),
      'utf8',
    );
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toMatch(/docs\/spec only/i);
    expect(source).toContain('No runtime auth verifier');
    expect(source).toContain('MVP demo-style `X-User-Id`');
    expect(source).toContain('`creator_session` currently serves creator-owned flows only');
    expect(source).toContain('Official Vote already runs profile eligibility');
    expect(source).toContain('Reference Answer does not use profile eligibility');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('Public reads must stay display-safe');
    expect(source).toContain('/users/me/profile');
    expect(source).toContain('Raw `X-User-Id` must not be accepted as production identity');
    expect(source).toContain('creator_session` must not silently become public vote identity');
    expect(source).toContain('Vote tokens: `user_id + poll_id`');
    expect(source).toContain('Counters: `poll_id + option_id + shard_id`');
    expect(source).toContain('Profile eligibility');
    expect(source).toContain('Option resolve');
    expect(source).toContain('Do not apply profile eligibility to Reference Answer');
    expect(source).toContain('Add `gender`, exact birthday');
    expect(source).toContain('Phase 70A — Production User Auth Resolver Foundation');
    expect(source).toContain('**Recommended owner:** GPT-5.5 High');
    expect(source).toContain('Composer can implement Phase 70B');
    expect(source).toContain('vote-by-index` ineligible indistinguishability tests');
    expect(source).toContain('Raw Option Linkage Ban guard tests');
    expect(source).toContain('npm run migrate:check');
    expect(readme).toContain('Phase 70 (docs)');
    expect(readme).toContain(
      'docs/www-project-phase-70-production-user-auth-account-boundary-plan-v1.md',
    );
  });
});
