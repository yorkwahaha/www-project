import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Phase 78 production session foundation source guard', () => {
  it('does not wire user session repository into auth resolver, verifier, app, or HTTP routes', async () => {
    for (const file of [
      'src/auth/user-auth-resolver.ts',
      'src/auth/production-credential-verifier.ts',
      'src/app.ts',
      'src/http/server.ts',
      'src/http/user-profile-routes.ts',
      'src/http/poll-routes.ts',
      'src/http/official-vote-routes.ts',
      'src/http/creator-poll-routes.ts',
      'src/http/creator-session-routes.ts',
      'src/http/reference-answer-routes.ts',
    ]) {
      const source = await readFile(join(process.cwd(), file), 'utf8');
      expect(source).not.toMatch(/user-sessions|user_sessions|UserSession/i);
    }
  });
});
