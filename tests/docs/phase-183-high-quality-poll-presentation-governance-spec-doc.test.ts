import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_183_DOC =
  'docs/www-project-phase-183-high-quality-poll-presentation-governance-spec-v1.md';

describe('Phase 183 high-quality poll presentation governance spec doc', () => {
  it('documents spec-only high-quality poll presentation governance boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_183_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 183');
    expect(source).toContain(
      'High-quality Poll Presentation Governance Spec',
    );
    expect(source).toContain('governance spec only');
    expect(source).toContain('No runtime');
    expect(source).toContain('API');
    expect(source).toContain('DB');
    expect(source).toContain('frontend');
    expect(source).toContain('migration');
    expect(source).toContain('schema');
    expect(source).toContain('High-quality poll badge runtime');

    for (const banned of [
      'Ranking',
      'Recommendation ordering',
      'Hotness',
      'Trend',
      'Personalization',
      'Threshold runtime',
      'Bucket runtime',
      'Creator score',
      'Punishment',
      'Abuse decision',
    ]) {
      expect(source).toContain(banned);
    }

    for (const exposed of [
      'aggregate_count',
      'Tag count',
      'Tag breakdown',
      'Raw feedback total',
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
    expect(source).toContain('must open a separate phase');

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

    expect(source).toContain('low-resolution presentation');
    expect(source).toContain('non-ranking');
    expect(source).toContain('non-scoring');
    expect(source).toContain('non-precise');
    expect(source).toContain('public-facing copy');
    expect(source).toContain('creator-facing copy');
    expect(source).toContain('design-drafts/');

    expect(readme).toContain('Phase 183');
    expect(readme).toContain(PHASE_183_DOC);
    expect(readme).toContain(
      'High-quality poll presentation governance spec',
    );
  });
});
