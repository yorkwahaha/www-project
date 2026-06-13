import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_186_DOC =
  'docs/www-project-phase-186-high-quality-poll-badge-read-model-presentation-plan-v1.md';

describe('Phase 186 high-quality poll badge read-model presentation plan doc', () => {
  it('documents plan-only read-model boundaries and public badge output ceiling', async () => {
    const source = await readFile(join(process.cwd(), PHASE_186_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 186');
    expect(source).toContain(
      'High-quality Poll Badge Read-model / Presentation Plan',
    );
    expect(source).toContain('plan only');
    expect(source).toContain('No runtime');
    expect(source).toContain('API');
    expect(source).toContain('DB');
    expect(source).toContain('frontend');
    expect(source).toContain('migration');
    expect(source).toContain('schema');

    for (const runtimeBan of [
      'Badge runtime',
      'Read model runtime',
      'Public API response field',
      'Frontend badge DOM',
      'Threshold runtime',
      'Bucket runtime',
    ]) {
      expect(source).toContain(runtimeBan);
    }

    for (const forbiddenOutput of [
      'score',
      'rank',
      'percentile',
      'aggregate_count',
      'tag_counts',
      'threshold_state',
      'bucket_state',
      'creator_score',
    ]) {
      expect(source).toContain(forbiddenOutput);
    }

    expect(source).toContain('{ "quality_badge": null }');
    expect(source).toContain('{ "quality_badge": "positive_feedback" }');
    expect(source).toContain('must **not distinguish reasons**');
    expect(source).toContain('unified');
    expect(source).toContain('completely not display badge');

    for (const lowVolumeState of [
      '尚未達標',
      '回饋不足',
      '品質不足',
    ]) {
      expect(source).toContain(lowVolumeState);
    }

    expect(source).toContain('回饋良好');
    expect(source).toContain('優質第幾名');
    expect(source).toContain('高分題目');
    expect(source).toContain('低品質');

    for (const governanceBan of [
      'Ranking',
      'Recommendation ordering',
      'Creator score',
      'Punishment',
      'Abuse decision',
    ]) {
      expect(source).toContain(governanceBan);
    }

    expect(source).toContain('poll-level aggregate signal only');
    expect(source).toContain('per-user feedback event table');
    expect(source).toContain('option choice or voter identity');

    for (const linkage of [
      'option_id',
      'option_index',
      'user_id',
      'session_id',
      'device',
      'request_id',
      'log',
      'trace',
      'metric',
      'error',
      'analytics',
    ]) {
      expect(source).toContain(linkage);
    }

    expect(source).toContain('Creator-facing read model');
    expect(source).toContain('open a separate phase');
    expect(source).toContain('separate review checkpoint');

    for (const protectedBoundary of [
      'Official Vote transaction order',
      'vote-by-index',
      'eligibility-before-option-resolve',
      'Result visibility',
      'Eligibility',
      'Reference Answer',
      'UserAuthResolver',
      'Profile fields',
      'lifecycle',
      'Raw Option Linkage Ban',
      'Feed ordering',
      'Explore ordering',
    ]) {
      expect(source).toContain(protectedBoundary);
    }

    expect(source).toContain('design-drafts/');

    expect(readme).toContain('Phase 186');
    expect(readme).toContain(PHASE_186_DOC);
    expect(readme).toContain(
      'High-quality poll badge read-model / presentation plan',
    );
  });
});
