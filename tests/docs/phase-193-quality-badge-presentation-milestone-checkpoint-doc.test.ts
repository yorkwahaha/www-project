import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_193_DOC =
  'docs/www-project-phase-193-quality-badge-presentation-milestone-checkpoint-v1.md';

describe('Phase 193 quality badge presentation milestone checkpoint doc', () => {
  it('documents Phase 177-192-R summary, fixed contract, and governance boundary', async () => {
    const source = await readFile(join(process.cwd(), PHASE_193_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 193');
    expect(source).toContain('Quality Badge Presentation Milestone Checkpoint');
    expect(source).toContain('Phase 177–192-R Milestone Summary');
    expect(source).toContain('Docs/checkpoint only');

    for (const phase of [
      'Phase 177',
      'Phase 178-R',
      'Phase 180',
      'Phase 180-R',
      'Phase 181',
      'Phase 181-R',
      'Phase 182',
      'Phase 188',
      'Phase 188-R',
      'Phase 190',
      'Phase 190-R',
      'Phase 192',
      'Phase 192-R',
    ]) {
      expect(source).toContain(phase);
    }

    expect(source).toContain('poll_quality_feedback_aggregate');
    expect(source).toContain('only durable source');
    expect(source).toContain('Durable badge table');
    expect(source).toContain('**No**');

    for (const forbiddenState of [
      'threshold_state',
      'bucket_state',
      'score',
      'rank',
      'counts',
      'tag breakdown',
    ]) {
      expect(source).toContain(forbiddenState);
    }

    expect(source).toContain('quality_badge: null | "positive_feedback"');
    expect(source).toContain('GET /polls/:id');
    expect(source).toContain('GET /polls/:id/results');
    expect(source).toContain('GET /polls/feed');
    expect(source).toContain('deriveQualityBadge()');

    expect(source).toContain('quality_badge === "positive_feedback"');
    expect(source).toContain('quality_badge === null');
    expect(source).toContain('Missing field');
    expect(source).toContain('Unexpected value');
    expect(source).toContain('completely not display badge');
    expect(source).toContain('回饋良好');

    expect(source).toContain('/explore');
    expect(source).toContain('/vote/:pollId');
    expect(source).toContain('/results/:pollId');
    expect(source).toContain('#poll-title');
    expect(source).toContain('#page-title');

    expect(source).toContain('renderQualityFeedbackBadge()');
    expect(source).toContain('mountQualityFeedbackBadgeNearTitle()');
    expect(source).toContain('shouldRenderQualityFeedbackBadge()');

    for (const forbiddenDetail of [
      'tooltip',
      'detail panel',
      'debug reason',
      'explanation',
      'aggregate_count',
      'tag breakdown',
      'tag counts',
      'creator_score',
    ]) {
      expect(source).toContain(forbiddenDetail);
    }

    for (const behaviorBoundary of [
      'ordering',
      'filtering',
      'CTA',
      'vote eligibility',
      'results visibility',
      'result interpretation',
    ]) {
      expect(source).toContain(behaviorBoundary);
    }

    expect(source).toContain('localStorage');
    expect(source).toContain('sessionStorage');
    expect(source).toContain('cookie');

    for (const nonGoal of [
      'no runtime change',
      'no API change',
      'no frontend change',
      'no migration',
      'no schema change',
    ]) {
      expect(source).toContain(nonGoal);
    }

    for (const protectedBoundary of [
      'Raw Option Linkage Ban',
      'Official Vote transaction order',
      'vote-by-index',
      'eligibility-before-option-resolve',
      'Reference Answer',
      'UserAuthResolver',
      'Result visibility',
      'Eligibility',
      'Profile fields',
      'lifecycle',
    ]) {
      expect(source).toContain(protectedBoundary);
    }

    expect(source).toContain(
      'No new option choice + user/session/device/request/log/trace/metric/error payload linkage',
    );

    expect(source).toContain(
      'phase-193-quality-badge-presentation-milestone-checkpoint-doc.test.ts',
    );
    expect(source).toContain(
      'phase-193-quality-badge-presentation-milestone-checkpoint.test.ts',
    );
    expect(source).toContain('design-drafts/');
    expect(source).toContain('smoke:public:local');

    expect(readme).toContain('Phase 193');
    expect(readme).toContain(PHASE_193_DOC);
    expect(readme).toContain('Quality badge presentation milestone checkpoint');
  });
});
