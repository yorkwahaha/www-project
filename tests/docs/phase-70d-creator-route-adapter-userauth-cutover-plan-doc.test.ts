import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Phase 70D creator route adapter UserAuth cutover plan doc', () => {
  it('locks the docs-only creator route adapter cutover plan boundary', async () => {
    const source = await readFile(
      join(
        process.cwd(),
        'docs/www-project-phase-70d-creator-route-adapter-userauth-cutover-plan-v1.md',
      ),
      'utf8',
    );
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('docs/spec only');
    expect(source).toContain('No runtime auth verifier change');
    expect(source).toContain('No runtime auth verifier change, route adapter change, API behavior change, migration');
    expect(source).toContain('Phase 70B cut production `GET /users/me/profile`');
    expect(source).toContain('Phase 70C-I cut production Official Vote');
    expect(source).toContain('Phase 70D-P recommends Option A');
    expect(source).toContain('Reference Answer is not connected to `UserAuthResolver`');
    expect(source).toContain('There is currently no `/creator/polls/:id/results` route');
    expect(source).toContain('Production `/creator/*` route adapters must resolve creator identity through `UserAuthResolver`');
    expect(source).toContain('Local/demo compatibility must be documented and tested as non-production identity');
    expect(source).toContain('POST /creator/session');
    expect(source).toContain('GET /creator/session');
    expect(source).toContain('DELETE /creator/session');
    expect(source).toContain('POST /creator/polls');
    expect(source).toContain('GET /creator/polls');
    expect(source).toContain('DELETE /creator/polls/:id');
    expect(source).toContain('POST /creator/polls/:id/cancel');
    expect(source).toContain('POST /creator/polls/:id/close');
    expect(source).toContain('POST /creator/polls/:id/unpublish');
    expect(source).toContain('GET /creator/polls/:id/results');
    expect(source).toContain('Creator identity must not expose voter identity');
    expect(source).toContain('Let `creator_session` become public Official Vote identity');
    expect(source).toContain('Let `creator_session` authorize `GET /users/me/profile`');
    expect(source).toContain('Let `creator_session` authorize Reference Answer');
    expect(source).toContain('Connect Reference Answer to profile eligibility');
    expect(source).toContain('Add durable/log/metric/APM trace/cache/debug payload/analytics/error payload linkage');
    expect(source).toContain('Add `gender`, exact birthday');
    expect(source).toContain('Change or weaken the Raw Option Linkage Ban');
    expect(source).toContain('Phase 70D-I-B — Creator Route Adapter UserAuth Cutover');
    expect(source).toContain('Composer may implement Phase 70D-I-B only if');
    expect(source).toContain('Composer does not push');
    expect(source).toContain('GPT-5.5 High performs focused review before push');
    expect(source).toContain('rollback the route adapter wiring');
    expect(source).toContain('git diff --check');
    expect(source).toContain('npm run typecheck');
    expect(source).toContain('npm test');
    expect(source).toContain('npm run build');
    expect(readme).toContain('Phase 70D-I-A');
    expect(readme).toContain(
      'docs/www-project-phase-70d-creator-route-adapter-userauth-cutover-plan-v1.md',
    );
  });
});
