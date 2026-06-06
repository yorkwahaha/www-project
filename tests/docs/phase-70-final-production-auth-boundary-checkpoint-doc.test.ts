import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Phase 70 final production auth boundary checkpoint doc', () => {
  it('summarizes 70A-70D cutover, identity boundaries, invariants, and remaining work', async () => {
    const source = await readFile(
      join(
        process.cwd(),
        'docs/www-project-phase-70-final-production-auth-boundary-checkpoint-v1.md',
      ),
      'utf8',
    );
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toMatch(/檢查點/);
    expect(source).toContain('33b6abf');
    expect(source).toMatch(/Phase 70/);
    expect(source).toContain('UserAuthResolver');
    expect(source).toContain('src/auth/user-auth-resolver.ts');
    expect(source).toContain('/users/me/profile');
    expect(source).toContain('POST /polls/:id/vote');
    expect(source).toContain('vote-by-index');
    expect(source).toContain('/creator/polls');
    expect(source).toContain('creator_session');
    expect(source).toContain('Reference Answer');
    expect(source).toContain('fail-closed');
    expect(source).toContain('CREATOR_SESSION_ISSUER_UNAVAILABLE');
    expect(source).toContain('ownership');
    expect(source).toMatch(/Raw `X-User-Id`/);
    expect(source).toContain('user_id + poll_id');
    expect(source).toContain('poll_id + option_id + shard_id');
    expect(source).toContain('option resolve');
    expect(source).toContain('profile eligibility');
    expect(source).toMatch(/Raw Option Linkage/i);
    expect(source).toContain('counter-free');
    expect(source).toContain('production credential verifier');
    expect(source).toContain('Frontend production login UX');
    expect(source).toContain('design-drafts/');
    expect(source).toContain('git diff --check');
    expect(source).toContain('npm run typecheck');
    expect(source).toContain('npm test');
    expect(source).toContain('npm run build');
    expect(source).toContain('tests/http/creator-route-auth-source-guard.test.ts');
    expect(source).toContain('tests/http/official-vote-route-auth-source-guard.test.ts');
    expect(source).toContain('tests/http/profile-api-auth-source-guard.test.ts');

    expect(readme).toMatch(/Phase 70.*final/i);
    expect(readme).toContain(
      'docs/www-project-phase-70-final-production-auth-boundary-checkpoint-v1.md',
    );
    expect(readme).toContain('UserAuthResolver');
    expect(readme).toContain('creator_session');
    expect(readme).toContain('Reference Answer');
  });
});
