import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_189R_DOC =
  'docs/www-project-phase-189r-high-quality-poll-badge-frontend-presentation-plan-review-checkpoint-v1.md';

describe('Phase 189-R high-quality poll badge frontend presentation plan review checkpoint doc', () => {
  it('documents Phase 189 review, Phase 190 approval, and preserved governance boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_189R_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 189-R');
    expect(source).toContain(
      'High-quality Poll Badge Frontend Presentation Plan Review Checkpoint',
    );
    expect(source).toContain('review checkpoint only');
    expect(source).toContain('Phase 189');
    expect(source).toContain('Phase 182');
    expect(source).toContain('Phase 188-R');
    expect(source).toContain('Phase 190');

    expect(source).toContain('## 1. Review Purpose');
    expect(source).toContain('## 2. Review Findings');
    expect(source).toContain('## 3. Phase 190 Decision');
    expect(source).toContain('## 4. Blockers Before Phase 190');

    expect(source).toContain(
      './www-project-phase-189-high-quality-poll-badge-frontend-presentation-plan-v1.md',
    );
    expect(source).toContain('plan only');
    expect(source).toContain('**CONFIRMED**');
    expect(source).toContain('APPROVED — Phase 190 blockers: none identified.');
    expect(source).toContain('High-quality Poll Badge Minimal Frontend Rendering Runtime');
    expect(source).toContain('Minimal frontend rendering runtime only');

    for (const noChange of [
      'no runtime change',
      'no API change',
      'no frontend change',
      'no migration',
      'no schema change',
    ]) {
      expect(source).toContain(noChange);
    }

    for (const scopeBan of [
      'No `src/` runtime change',
      'No `migrations/` change',
      'No `public/` frontend runtime change',
      'No public API change',
      'No backend runtime change',
      'No DB/schema/migration change',
      'No frontend badge runtime',
    ]) {
      expect(source).toContain(scopeBan);
    }

    expect(source).toContain('quality_badge === "positive_feedback"');
    expect(source).toContain('quality_badge === null');
    expect(source).toContain('completely not display badge');
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
      'tag_breakdown',
      'tag_counts',
      'score',
      'rank',
      'creator_score',
    ]) {
      expect(source).toContain(forbiddenDetail);
    }

    for (const behaviorBoundary of [
      'Feed ordering',
      'Explore ordering',
      'Filtering',
      'CTA',
      'Vote eligibility',
      'Results visibility',
    ]) {
      expect(source).toContain(behaviorBoundary);
    }

    expect(source).toContain('Consume existing `quality_badge` field only');
    expect(source).toContain('No API/backend/DB/schema/migration change');

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
      'phase-189r-high-quality-poll-badge-frontend-presentation-plan-review-checkpoint-doc.test.ts',
    );
    expect(source).toContain(
      'phase-189r-high-quality-poll-badge-frontend-presentation-plan-review-checkpoint.test.ts',
    );
    expect(source).toContain('design-drafts/');

    expect(readme).toContain('Phase 189-R');
    expect(readme).toContain(PHASE_189R_DOC);
    expect(readme).toContain(
      'High-quality poll badge frontend presentation plan review checkpoint',
    );
  });
});
