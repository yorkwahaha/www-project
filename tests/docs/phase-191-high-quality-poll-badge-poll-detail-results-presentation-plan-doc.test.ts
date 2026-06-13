import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_191_DOC =
  'docs/www-project-phase-191-high-quality-poll-badge-poll-detail-results-presentation-plan-v1.md';

describe('Phase 191 high-quality poll badge poll detail results presentation plan doc', () => {
  it('documents plan-only poll detail and results presentation boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_191_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 191');
    expect(source).toContain(
      'High-quality Poll Badge Poll Detail / Results Presentation Plan',
    );
    expect(source).toContain('plan only');
    expect(source).toContain('No runtime');
    expect(source).toContain('API');
    expect(source).toContain('DB');
    expect(source).toContain('frontend');
    expect(source).toContain('migration');
    expect(source).toContain('schema');

    for (const runtimeBan of [
      'Poll detail badge runtime',
      'Results badge runtime',
      'public/frontend/',
      'Public API change',
      'Backend runtime change',
      'DB/schema/migration change',
    ]) {
      expect(source).toContain(runtimeBan);
    }

    expect(source).toContain('quality_badge === "positive_feedback"');
    expect(source).toContain('quality_badge === null');
    expect(source).toContain('completely not display badge');

    expect(source).toContain('renderQualityFeedbackBadge()');
    expect(source).toContain('quality-feedback-badge.js');
    expect(source).toContain('回饋良好');

    for (const bannedAbsence of [
      '尚未達標',
      '回饋不足',
      '品質不足',
      '未取得徽章',
    ]) {
      expect(source).toContain(bannedAbsence);
    }

    for (const bannedMisleading of [
      '優質題目',
      '高分題目',
      '熱門',
      '排名',
      '品質分數',
      '低品質',
    ]) {
      expect(source).toContain(bannedMisleading);
    }

    for (const forbiddenDetail of [
      'tooltip',
      'detail panel',
      'debug reason',
      'explanation',
      'aggregate_count',
      'tag breakdown',
      'tag_counts',
      'tag_breakdown',
      'threshold_state',
      'bucket_state',
      'score',
      'rank',
      'percentile',
      'creator_score',
    ]) {
      expect(source).toContain(forbiddenDetail);
    }

    for (const behaviorBoundary of [
      'CTA',
      'Vote eligibility',
      'Results visibility',
      'Sorting',
      'Filtering',
    ]) {
      expect(source).toContain(behaviorBoundary);
    }

    expect(source).toContain('Poll detail placement');
    expect(source).toContain('Results placement');
    expect(source).toContain('Demo poll');
    expect(source).toContain('Phase 191-R');
    expect(source).toContain('review checkpoint');
    expect(source).toContain(
      'Frontend badge rendering on poll detail / results must not begin until Phase 191-R review checkpoint approval',
    );

    expect(source).toContain('localStorage');
    expect(source).toContain('sessionStorage');
    expect(source).toContain('cookie');

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
      'phase-191-high-quality-poll-badge-poll-detail-results-presentation-plan-doc.test.ts',
    );
    expect(source).toContain('design-drafts/');

    expect(readme).toContain('Phase 191');
    expect(readme).toContain(PHASE_191_DOC);
    expect(readme).toContain(
      'High-quality poll badge poll detail / results presentation plan',
    );
  });
});
