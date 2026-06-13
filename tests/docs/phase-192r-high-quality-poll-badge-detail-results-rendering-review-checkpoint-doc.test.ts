import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_192R_DOC =
  'docs/www-project-phase-192r-high-quality-poll-badge-detail-results-rendering-review-checkpoint-v1.md';

describe('Phase 192-R high-quality poll badge detail results rendering review checkpoint doc', () => {
  it('documents Phase 192 runtime review, Phase 193 milestone approval, and preserved governance boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_192R_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 192-R');
    expect(source).toContain(
      'High-quality Poll Badge Detail / Results Minimal Frontend Rendering Runtime Review Checkpoint',
    );
    expect(source).toContain('review checkpoint only');
    expect(source).toContain('Phase 192');
    expect(source).toContain('Phase 182');
    expect(source).toContain('Phase 191-R');
    expect(source).toContain('Phase 193');

    expect(source).toContain('## 1. Review Purpose');
    expect(source).toContain('## 2. Review Findings');
    expect(source).toContain('## 3. Phase 193 Decision');
    expect(source).toContain('## 4. Blockers Before Phase 193');

    expect(source).toContain(
      './www-project-phase-192-high-quality-poll-badge-detail-results-minimal-frontend-rendering-runtime-v1.md',
    );
    expect(source).toContain('**CONFIRMED**');
    expect(source).toContain('APPROVED — Phase 193 blockers: none identified.');
    expect(source).toContain('Quality Badge Presentation Milestone Checkpoint');
    expect(source).toContain('Docs/checkpoint only');

    expect(source).toContain('minimal frontend rendering runtime');
    expect(source).toContain('poll detail / results minimal frontend rendering runtime');

    for (const noChange of [
      'No public API change',
      'No backend runtime change',
      'No DB/schema/migration change',
    ]) {
      expect(source).toContain(noChange);
    }

    expect(source).toContain('renderQualityFeedbackBadge()');
    expect(source).toContain('mountQualityFeedbackBadgeNearTitle()');
    expect(source).toContain('#poll-title');
    expect(source).toContain('#page-title');
    expect(source).toContain('/explore');
    expect(source).toContain('Phase 190');

    expect(source).toContain('quality_badge === "positive_feedback"');
    expect(source).toContain('quality_badge === null');
    expect(source).toContain('completely not display badge');
    expect(source).toContain('回饋良好');

    for (const silentCase of ['Missing field', 'Unexpected value']) {
      expect(source).toContain(silentCase);
    }

    expect(source).toContain('No second badge copy');
    expect(source).toContain('No second display gate');

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
      'tag_breakdown',
      'tag_counts',
      'score',
      'rank',
      'creator_score',
    ]) {
      expect(source).toContain(forbiddenDetail);
    }

    for (const behaviorBoundary of [
      'CTA',
      'Vote eligibility',
      'Results visibility',
      'Result interpretation',
      'Sorting',
      'Filtering',
    ]) {
      expect(source).toContain(behaviorBoundary);
    }

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
      'phase-192r-high-quality-poll-badge-detail-results-rendering-review-checkpoint-doc.test.ts',
    );
    expect(source).toContain(
      'phase-192r-high-quality-poll-badge-detail-results-rendering-review-checkpoint.test.ts',
    );
    expect(source).toContain('design-drafts/');

    expect(readme).toContain('Phase 192-R');
    expect(readme).toContain(PHASE_192R_DOC);
    expect(readme).toContain(
      'High-quality poll badge detail / results rendering review checkpoint',
    );
  });
});
