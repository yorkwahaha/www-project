import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Official Vote route auth source guard', () => {
  it('routes Official Vote and vote-by-index through UserAuthResolver', async () => {
    const pollRoutes = await readFile(
      join(process.cwd(), 'src/http/poll-routes.ts'),
      'utf8',
    );
    const officialVoteRoutes = await readFile(
      join(process.cwd(), 'src/http/official-vote-routes.ts'),
      'utf8',
    );
    const resolverSource = await readFile(
      join(process.cwd(), 'src/auth/user-auth-resolver.ts'),
      'utf8',
    );

    expect(pollRoutes).toContain('UserAuthResolver');
    expect(pollRoutes).toContain('resolvePublicVoteUserAuth');
    expect(pollRoutes).toContain('requirePublicVoteUserAuth');
    expect(pollRoutes).toContain('userAuthResolver.resolveUserAuth');
    expect(officialVoteRoutes).toContain('requirePublicVoteUserAuth');
    expect(officialVoteRoutes).toContain('await requirePublicVoteUserAuth(req)');
    expect(officialVoteRoutes).not.toMatch(/req\.headers\['x-user-id'\]/i);
    expect(officialVoteRoutes).not.toMatch(/headers\['x-user-id'\]/i);

    expect(pollRoutes).toMatch(
      /handlePostOfficialVote\([\s\S]*requirePublicVoteUserAuth[\s\S]*handlePostOfficialVoteByIndex/,
    );
    expect(pollRoutes).toMatch(
      /handlePostOfficialVoteByIndex\([\s\S]*requirePublicVoteUserAuth[\s\S]*async function resolvePublicVoteUserAuth/,
    );

    const referenceAnswerHandler = pollRoutes.slice(
      pollRoutes.indexOf('handlePostReferenceAnswer('),
      pollRoutes.indexOf('handleGetPublicFeed'),
    );
    expect(referenceAnswerHandler).toContain('requireUserId');
    expect(referenceAnswerHandler).not.toContain('requirePublicVoteUserAuth');

    expect(resolverSource).not.toMatch(/option_id|option_index|option_text/i);
  });
});
