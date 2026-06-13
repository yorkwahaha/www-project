import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_192_DOC =
  'docs/www-project-phase-192-high-quality-poll-badge-detail-results-minimal-frontend-rendering-runtime-v1.md';

describe('Phase 192 high-quality poll badge detail results minimal frontend rendering runtime doc', () => {
  it('documents minimal frontend rendering runtime boundaries and quality_badge consumption', async () => {
    const source = await readFile(join(process.cwd(), PHASE_192_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 192');
    expect(source).toContain(
      'High-quality Poll Badge Poll Detail / Results Minimal Frontend Rendering Runtime',
    );
    expect(source).toContain('minimal frontend rendering runtime');
    expect(source).toContain('quality_badge');
    expect(source).toContain('renderQualityFeedbackBadge()');
    expect(source).toContain('mountQualityFeedbackBadgeNearTitle()');
    expect(source).toContain('回饋良好');

    expect(source).toContain('quality_badge === "positive_feedback"');
    expect(source).toContain('Completely not display badge');

    for (const noChange of [
      'No API/backend/DB/schema/migration change',
      'Public API',
      'backend runtime',
      'schema',
      'migration',
    ]) {
      expect(source).toContain(noChange);
    }

    expect(source).toContain('title/status');
    expect(source).toContain('#poll-title');
    expect(source).toContain('#page-title');

    for (const forbiddenDetail of [
      'Tooltip',
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

    expect(source).toContain('Raw Option Linkage Ban');

    expect(source).toContain(
      'phase-192-high-quality-poll-badge-detail-results-minimal-frontend-rendering-runtime.test.ts',
    );
    expect(source).toContain('design-drafts/');

    expect(readme).toContain('Phase 192');
    expect(readme).toContain(PHASE_192_DOC);
    expect(readme).toContain(
      'High-quality poll badge poll detail / results minimal frontend rendering runtime',
    );
  });
});
