import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Profile API auth source guard', () => {
  it('routes profile auth through UserAuthResolver instead of direct X-User-Id reads', async () => {
    const source = await readFile(
      join(process.cwd(), 'src/http/user-profile-routes.ts'),
      'utf8',
    );

    expect(source).toContain('UserAuthResolver');
    expect(source).toContain('requireAuthenticatedUserId');
    expect(source).toContain('userAuthResolver.resolveUserAuth');
    expect(source).not.toMatch(/req\.headers\['x-user-id'\]/i);
    expect(source).not.toMatch(/headers\['x-user-id'\]/i);
  });
});
