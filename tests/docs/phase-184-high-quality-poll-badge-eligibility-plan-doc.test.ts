import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_184_DOC =
  'docs/www-project-phase-184-high-quality-poll-badge-eligibility-plan-v1.md';

describe('Phase 184 high-quality poll badge eligibility plan doc', () => {
  it('documents plan-only badge eligibility boundaries and low-volume display bans', async () => {
    const source = await readFile(join(process.cwd(), PHASE_184_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 184');
    expect(source).toContain('High-quality Poll Badge Eligibility Plan');
    expect(source).toContain('plan only');
    expect(source).toContain('No runtime');
    expect(source).toContain('API');
    expect(source).toContain('DB');
    expect(source).toContain('frontend');
    expect(source).toContain('migration');
    expect(source).toContain('schema');

    for (const runtimeBan of [
      'Badge runtime',
      'Threshold runtime',
      'Bucket runtime',
      'Query',
    ]) {
      expect(source).toContain(runtimeBan);
    }

    for (const governanceBan of [
      'Ranking',
      'Recommendation ordering',
      'Hotness',
      'Trend',
      'Personalization',
      'Creator score',
      'Punishment',
      'Abuse decision',
    ]) {
      expect(source).toContain(governanceBan);
    }

    for (const exposed of [
      'aggregate_count',
      'Tag breakdown',
      'Raw feedback total',
      'Score',
      'Rank',
      'Percentile',
    ]) {
      expect(source).toContain(exposed);
    }

    for (const linkage of [
      'option_id',
      'option_index',
      'Selected option linkage',
      'user_id',
      'session_id',
      'device',
      'request_id',
      'Log linkage',
      'Trace linkage',
      'Metric linkage',
      'Error payload linkage',
      'Analytics linkage',
    ]) {
      expect(source).toContain(linkage);
    }

    expect(source).toContain('poll-level aggregate signal only');
    expect(source).toContain('per-user feedback event table');
    expect(source).toContain('option choice or voter identity');
    expect(source).toContain('low-resolution boolean-like presentation');
    expect(source).toContain('minimum volume');
    expect(source).toContain('does not write minimum volume as a runtime constant');

    for (const positiveTag of [
      '表達清楚',
      '選項公平',
      '值得思考',
      '期待結果',
    ]) {
      expect(source).toContain(positiveTag);
    }

    expect(source).toContain('題目不優');
    expect(source).toContain('must not directly produce public shame');
    expect(source).toContain('must not directly produce creator score');
    expect(source).toContain('Creator-level score aggregation');

    for (const lowVolumeState of [
      '尚未達標',
      '回饋不足',
      '品質不足',
      'Not enough feedback.',
      'Below threshold.',
      'Quality insufficient.',
    ]) {
      expect(source).toContain(lowVolumeState);
    }

    expect(source).toContain('Low-volume polls must not display any status');
    expect(source).toContain('public UI should completely not display badge');
    expect(source).toContain('absence of a badge must be silent');
    expect(source).toContain('Future implementation must open a separate phase');

    for (const protectedBoundary of [
      'Official Vote transaction order',
      'vote-by-index',
      'eligibility-before-option-resolve',
      'Result visibility',
      'Eligibility',
      'Auth',
      'Reference Answer',
      'UserAuthResolver',
      'Profile fields',
      'lifecycle',
      'Raw Option Linkage Ban',
    ]) {
      expect(source).toContain(protectedBoundary);
    }

    for (const prerequisite of [
      'Minimum volume rule',
      'Privacy rule',
      'Abuse boundary',
      'Copy rule',
      'Display location rule',
      'Rollback/removal rule',
    ]) {
      expect(source).toContain(prerequisite);
    }

    expect(source).toContain('design-drafts/');

    expect(readme).toContain('Phase 184');
    expect(readme).toContain(PHASE_184_DOC);
    expect(readme).toContain(
      'High-quality poll badge eligibility plan',
    );
  });
});
