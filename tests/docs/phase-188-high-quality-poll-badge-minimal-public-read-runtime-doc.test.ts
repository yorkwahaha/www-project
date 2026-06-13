import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_188_DOC =
  'docs/www-project-phase-188-high-quality-poll-badge-minimal-public-read-runtime-v1.md';

describe('Phase 188 high-quality poll badge minimal public read runtime doc', () => {
  it('documents minimal public read runtime boundaries and quality_badge ceiling', async () => {
    const source = await readFile(join(process.cwd(), PHASE_188_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 188');
    expect(source).toContain(
      'High-quality Poll Badge Minimal Public Read Runtime',
    );
    expect(source).toContain('minimal public read runtime');
    expect(source).toContain('No schema/migration');
    expect(source).toContain('No frontend badge presentation');

    for (const runtimeBan of [
      'Durable badge table',
      'Frontend badge DOM',
      'Creator-facing explanation/debug fields',
    ]) {
      expect(source).toContain(runtimeBan);
    }

    expect(source).toContain('{ "quality_badge": null }');
    expect(source).toContain('{ "quality_badge": "positive_feedback" }');
    expect(source).toContain('must **not distinguish reasons**');
    expect(source).toContain('poll_quality_feedback_aggregate');
    expect(source).toContain('deriveQualityBadge');

    for (const forbiddenOutput of [
      'aggregate_count',
      'tag_counts',
      'tag_breakdown',
      'score',
      'rank',
      'percentile',
      'threshold_state',
      'bucket_state',
      'creator_score',
    ]) {
      expect(source).toContain(forbiddenOutput);
    }

    for (const governanceBan of [
      'Ranking',
      'Recommendation ordering',
      'Punishment',
      'Abuse decision',
    ]) {
      expect(source).toContain(governanceBan);
    }

    expect(source).toContain('poll-level aggregate signal only');
    expect(source).toContain('Per-user feedback event table');
    expect(source).toContain('option choice or voter identity');

    for (const protectedBoundary of [
      'Raw Option Linkage Ban',
      'Official Vote transaction order',
      'vote-by-index',
      'eligibility-before-option-resolve',
      'Result visibility',
      'Reference Answer',
      'UserAuthResolver',
      'Feed ordering',
      'explore ordering',
      'lifecycle',
    ]) {
      expect(source).toContain(protectedBoundary);
    }

    expect(source).toContain(
      'phase-188-high-quality-poll-badge-minimal-public-read-runtime-doc.test.ts',
    );
    expect(source).toContain(
      'phase-188-high-quality-poll-badge-minimal-public-read-runtime.test.ts',
    );
    expect(source).toContain('design-drafts/');

    expect(readme).toContain('Phase 188');
    expect(readme).toContain(PHASE_188_DOC);
    expect(readme).toContain(
      'High-quality poll badge minimal public read runtime',
    );
  });
});
