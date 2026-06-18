import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_303R_DOC =
  'docs/www-project-phase-303r-public-home-mixed-feed-runtime-privacy-review-checkpoint-v1.md';
const PHASE_303_DOC =
  'docs/www-project-phase-303-public-home-mixed-feed-contract-implementation-v1.md';

describe('Phase 303-R public home mixed feed runtime/privacy review checkpoint doc', () => {
  it('documents review scope, reviewed commit, conclusion, and boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_303R_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 303-R');
    expect(source).toContain('Public Home Mixed Feed Runtime / Privacy Review Checkpoint');
    expect(source).toContain('fc3165a');
    expect(source).toContain('c1b8de5');
    expect(source).toContain(PHASE_303_DOC);

    // Review-only posture + approval + safe-to-build-on.
    expect(source).toContain('No runtime change');
    expect(source).toContain('APPROVED');
    expect(source).toContain('safe to build on');
    expect(source).toContain('Phase 303-R blockers: none identified');
    expect(source).toContain('not release execution');

    // README index references the checkpoint.
    expect(readme).toContain('Phase 303-R');
    expect(readme).toContain(PHASE_303R_DOC);
  });

  it('records the privacy / boundary checks the review confirmed', async () => {
    const source = await readFile(join(process.cwd(), PHASE_303R_DOC), 'utf8');

    for (const token of [
      'GET /home/feed',
      'public/no-login',
      '/polls/feed',
      'isPublicAggregateResultsReadable',
      'total_votes_display',
      'Raw Option Linkage Ban',
      'isHomeCollectingFeedItemSafe',
      'isHomeRevealedFeedItemSafe',
      'isHomeFeedItemSafe',
      'isHomeFeedPayloadSafe',
      'fail closed',
      'exact key',
      'FEED_PARSING_TOLERANCE_FILES',
      'phantom-dirty',
      '14',
    ]) {
      expect(source, `Phase 303-R doc should mention ${token}`).toContain(token);
    }

    // Forbidden serialized fields the review checked for.
    for (const token of [
      'option_id',
      'option_index',
      'vote_count',
      'user_id',
      'session',
      'request_id',
      'device',
      'trace',
    ]) {
      expect(source, `Phase 303-R doc should cover forbidden field ${token}`).toContain(token);
    }
  });

  it('records the validation gates run for the checkpoint', async () => {
    const source = await readFile(join(process.cwd(), PHASE_303R_DOC), 'utf8');
    for (const gate of [
      'git diff --check',
      'npm test',
      'npm run typecheck',
      'npm run build',
      'npm run smoke:public:local',
    ]) {
      expect(source, `Phase 303-R doc should record ${gate}`).toContain(gate);
    }
  });
});
