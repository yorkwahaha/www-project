import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Phase 70D production creator session strategy plan doc', () => {
  it('locks the docs-only creator session production strategy boundary', async () => {
    const source = await readFile(
      join(
        process.cwd(),
        'docs/www-project-phase-70d-production-creator-session-strategy-plan-v1.md',
      ),
      'utf8',
    );
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('docs/spec only');
    expect(source).toContain('No runtime auth verifier change');
    expect(source).toContain('No runtime auth verifier change, route adapter change, API behavior change, migration');
    expect(source).toContain('Phase 70B cut `GET /users/me/profile`');
    expect(source).toContain('Phase 70C-I cut Official Vote');
    expect(source).toContain('Reference Answer is not cut over to `UserAuthResolver`');
    expect(source).toContain('`creator_session` currently authorizes only `/creator/*`');
    expect(source).toContain('production `creator_session` boundary is fail-closed');
    expect(source).toContain('Option A');
    expect(source).toContain('Option B');
    expect(source).toContain('Option C');
    expect(source).toContain('Recommend **Option A');
    expect(source).toContain('Production `/creator/*` route adapters should call `UserAuthResolver`');
    expect(source).toContain('Why `creator_session` must not become public vote identity');
    expect(source).toContain('Allow `creator_session` to authorize public Official Vote');
    expect(source).toContain('Allow `creator_session` to authorize `POST /polls/:id/vote-by-index`');
    expect(source).toContain('Allow `creator_session` to authorize `GET /users/me/profile`');
    expect(source).toContain('Let Reference Answer use profile eligibility');
    expect(source).toContain('Add durable option-level linkage');
    expect(source).toContain('Add profile eligibility plus selected option linkage');
    expect(source).toContain('Add `gender`, exact birthday');
    expect(source).toContain('Change or weaken the Raw Option Linkage Ban');
    expect(source).toContain('Phase 70D-I-A — Creator Route Adapter UserAuth Cutover Plan');
    expect(source).toContain('Composer may implement');
    expect(source).toContain('GPT-5.5 High review is required');
    expect(source).toContain('git diff --check');
    expect(source).toContain('npm run typecheck');
    expect(source).toContain('npm test');
    expect(source).toContain('npm run build');
    expect(readme).toContain('Phase 70D-P');
    expect(readme).toContain(
      'docs/www-project-phase-70d-production-creator-session-strategy-plan-v1.md',
    );
  });
});
