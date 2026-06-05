import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Phase 70C Official Vote UserAuth cutover plan doc', () => {
  it('locks the docs-only vote auth cutover boundary', async () => {
    const source = await readFile(
      join(
        process.cwd(),
        'docs/www-project-phase-70c-official-vote-user-auth-cutover-plan-v1.md',
      ),
      'utf8',
    );
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('docs/spec only');
    expect(source).toContain('No runtime auth verifier change');
    expect(source).toContain('No Phase 70C-P runtime behavior exists');
    expect(source).toContain('Phase 70B cut `GET /users/me/profile`');
    expect(source).toContain('Official Vote routes still receive identity');
    expect(source).toContain('Reference Answer still uses its existing MVP participation identity path');
    expect(source).toContain('creator_session` remains scoped to creator-owned routes');
    expect(source).toContain('Production must not accept raw `X-User-Id` as vote identity');
    expect(source).toContain('explicitly configured `local_demo` or `test` resolver');
    expect(source).toContain('Apply profile eligibility inside the vote transaction');
    expect(source).toContain('Resolve option identity only after profile eligibility passes');
    expect(source).toContain('For `vote-by-index`, profile eligibility must remain before public `option_index` resolution');
    expect(source).toContain('A profile-ineligible request with a valid `option_index`');
    expect(source).toContain('must return the same status and body');
    expect(source).toContain('Reference Answer does not use profile eligibility');
    expect(source).toContain('separate approved phase');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('AuthenticatedUserContext` fields containing `option_id`');
    expect(source).toContain('Vote token: `user_id + poll_id + voted_at_minute + expires_at`');
    expect(source).toContain('Sharded counter: `poll_id + option_id + shard_id + vote_count`');
    expect(source).toContain('Do not change `PollService` or repository transaction order');
    expect(source).toContain('Run all Phase 70C-I validation and stop for High review before push');
    expect(readme).toContain('Phase 70C-P');
    expect(readme).toContain(
      'docs/www-project-phase-70c-official-vote-user-auth-cutover-plan-v1.md',
    );
  });
});
