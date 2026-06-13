import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_189_DOC =
  'docs/www-project-phase-189-high-quality-poll-badge-frontend-presentation-plan-v1.md';

describe('Phase 189 high-quality poll badge frontend presentation plan doc', () => {
  it('documents plan-only frontend presentation boundaries and quality_badge display rules', async () => {
    const source = await readFile(join(process.cwd(), PHASE_189_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 189');
    expect(source).toContain('High-quality Poll Badge Frontend Presentation Plan');
    expect(source).toContain('plan only');
    expect(source).toContain('No runtime');
    expect(source).toContain('API');
    expect(source).toContain('DB');
    expect(source).toContain('frontend');
    expect(source).toContain('migration');
    expect(source).toContain('schema');

    for (const runtimeBan of [
      'Frontend badge runtime',
      'Frontend badge DOM',
      'Public API change',
      'Backend runtime change',
      'DB/schema/migration change',
    ]) {
      expect(source).toContain(runtimeBan);
    }

    expect(source).toContain('quality_badge === "positive_feedback"');
    expect(source).toContain('quality_badge === null');
    expect(source).toContain('completely not display badge');

    expect(source).toContain('{ "quality_badge": null }');
    expect(source).toContain('{ "quality_badge": "positive_feedback" }');

    expect(source).toContain('回饋良好');
    expect(source).toContain('low-resolution positive chip');

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
      'threshold',
      'bucket',
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

    expect(source).toContain('/explore');
    expect(source).toContain('/polls/:id');
    expect(source).toContain('/results/:id');
    expect(source).toContain('Demo poll');

    expect(source).toContain('Phase 189-R');
    expect(source).toContain('review checkpoint');
    expect(source).toContain('Frontend badge rendering runtime must not begin');

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

    expect(source).toContain('poll-level aggregate signal only');
    expect(source).toContain('design-drafts/');

    expect(readme).toContain('Phase 189');
    expect(readme).toContain(PHASE_189_DOC);
    expect(readme).toContain('High-quality poll badge frontend presentation plan');
  });
});
