import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Phase 75 auth state navigation UX checkpoint doc', () => {
  it('summarizes navigation polish delivery, boundaries, and non-goals', async () => {
    const source = await readFile(
      join(
        process.cwd(),
        'docs/www-project-phase-75-auth-state-navigation-ux-checkpoint-v1.md',
      ),
      'utf8',
    );
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 75');
    expect(source).toContain('auth-state-copy.js');
    expect(source).toContain('renderAuthStateBanner');
    expect(source).toContain('正式登入尚未啟用');
    expect(source).toContain('fail-closed');
    expect(source).toContain('UserAuthResolver');
    expect(source).toContain('creator_session');
    expect(source).toContain('X-User-Id');
    expect(source).toContain('Reference Answer');
    expect(source).toContain('Official Vote');
    expect(source).toContain('vote-by-index');
    expect(source).toMatch(/Raw Option Linkage/i);
    expect(source).toContain('vote token');
    expect(source).toContain('user_id + poll_id');
    expect(source).toContain('poll_id + option_id + shard_id');
    expect(source).toContain('design-drafts/');
    expect(source).toContain('git diff --check');
    expect(source).toContain('npm run typecheck');
    expect(source).toContain('npm test');
    expect(source).toContain('npm run build');
    expect(source).toContain('smoke:public:local');

    expect(readme).toContain('Phase 75');
    expect(readme).toContain(
      'docs/www-project-phase-75-auth-state-navigation-ux-checkpoint-v1.md',
    );
    expect(readme).toContain('/login');
  });
});
