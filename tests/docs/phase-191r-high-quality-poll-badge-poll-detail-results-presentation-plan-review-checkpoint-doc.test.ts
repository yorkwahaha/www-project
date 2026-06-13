import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_191R_DOC =
  'docs/www-project-phase-191r-high-quality-poll-badge-poll-detail-results-presentation-plan-review-checkpoint-v1.md';

describe('Phase 191-R high-quality poll badge poll detail results presentation plan review checkpoint doc', () => {
  it('documents Phase 191 plan review, Phase 192 minimal runtime approval, and preserved governance boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_191R_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 191-R');
    expect(source).toContain(
      'High-quality Poll Badge Poll Detail / Results Presentation Plan Review Checkpoint',
    );
    expect(source).toContain('review checkpoint only');
    expect(source).toContain('Phase 191');
    expect(source).toContain('Phase 182');
    expect(source).toContain('Phase 190-R');
    expect(source).toContain('Phase 192');

    expect(source).toContain('## 1. Review Purpose');
    expect(source).toContain('## 2. Review Findings');
    expect(source).toContain('## 3. Phase 192 Decision');
    expect(source).toContain('## 4. Blockers Before Phase 192');

    expect(source).toContain(
      './www-project-phase-191-high-quality-poll-badge-poll-detail-results-presentation-plan-v1.md',
    );
    expect(source).toContain('**CONFIRMED**');
    expect(source).toContain('APPROVED — Phase 192 blockers: none identified.');
    expect(source).toContain(
      'High-quality Poll Badge Poll Detail / Results Minimal Frontend Rendering Runtime',
    );

    expect(source).toContain('plan only');
    expect(source).toContain('Plan-only');
    expect(source).toContain('No poll detail badge runtime');
    expect(source).toContain('No results badge runtime');
    expect(source).toContain('public/frontend/');

    for (const noChange of [
      'No public API change',
      'No backend runtime change',
      'No DB/schema/migration change',
    ]) {
      expect(source).toContain(noChange);
    }

    expect(source).toContain('quality_badge === "positive_feedback"');
    expect(source).toContain('quality_badge === null');
    expect(source).toContain('completely not display badge');
    expect(source).toContain('回饋良好');
    expect(source).toContain('renderQualityFeedbackBadge()');

    for (const silentCase of ['Missing field', 'Unexpected value']) {
      expect(source).toContain(silentCase);
    }

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
      'result interpretation',
    ]) {
      expect(source).toContain(behaviorBoundary);
    }

    expect(source).toContain('title / status');
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
      'phase-191r-high-quality-poll-badge-poll-detail-results-presentation-plan-review-checkpoint-doc.test.ts',
    );
    expect(source).toContain(
      'phase-191r-high-quality-poll-badge-poll-detail-results-presentation-plan-review-checkpoint.test.ts',
    );
    expect(source).toContain('design-drafts/');

    expect(readme).toContain('Phase 191-R');
    expect(readme).toContain(PHASE_191R_DOC);
    expect(readme).toContain(
      'High-quality poll badge poll detail / results presentation plan review checkpoint',
    );
  });
});
