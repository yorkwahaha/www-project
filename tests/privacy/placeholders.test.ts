import { describe, it } from 'vitest';

/**
 * Privacy test placeholders for Phases 2–5 (spec §22–26).
 * Implemented in later phases; kept so `npm test` documents the suite layout.
 */
describe('privacy placeholders', () => {
  it.todo('Reference Answer: token has no option_id (Phase 2)');
  it.todo('Official Vote: vote token has no option_id (Phase 3)');
  it.todo('Result API: no raw counter rows (Phase 4)');
  it.todo('Ranking: pre-vote feed excludes answer-direction signals (Phase 5)');
});
