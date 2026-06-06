import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('production session protected-route source guard', () => {
  it('does not wire user session storage directly into protected route adapters or domain services', async () => {
    for (const file of [
      'src/auth/production-credential-verifier.ts',
      'src/http/user-profile-routes.ts',
      'src/http/poll-routes.ts',
      'src/http/official-vote-routes.ts',
      'src/http/creator-poll-routes.ts',
      'src/http/creator-session-routes.ts',
      'src/http/reference-answer-routes.ts',
      'src/polls/service.ts',
      'src/polls/repository.ts',
    ]) {
      const source = await readFile(join(process.cwd(), file), 'utf8');
      expect(source).not.toMatch(/user-sessions|user_sessions|UserSession/i);
    }
  });
});
