import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_185R_DOC =
  'docs/www-project-phase-185r-high-quality-poll-badge-eligibility-plan-review-checkpoint-v1.md';

describe('Phase 185-R high-quality poll badge eligibility plan review checkpoint doc', () => {
  it('documents Phase 184 review, Phase 186 approval, and preserved governance boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_185R_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 185-R');
    expect(source).toContain(
      'High-quality Poll Badge Eligibility Plan Review Checkpoint',
    );
    expect(source).toContain('review checkpoint only');
    expect(source).toContain('Phase 184');
    expect(source).toContain('Phase 182');
    expect(source).toContain('Phase 183');
    expect(source).toContain('Phase 186');

    expect(source).toContain('## 1. Review Purpose');
    expect(source).toContain('## 2. Review Findings');
    expect(source).toContain('## 3. Phase 186 Decision');
    expect(source).toContain('## 4. Blockers Before Phase 186');

    expect(source).toContain(
      './www-project-phase-184-high-quality-poll-badge-eligibility-plan-v1.md',
    );
    expect(source).toContain('plan only');
    expect(source).toContain('**CONFIRMED**');
    expect(source).toContain('APPROVED — Phase 186 blockers: none identified.');
    expect(source).toContain(
      'High-quality Poll Badge Read-model / Presentation Plan',
    );
    expect(source).toContain('Plan-only');
    expect(source).toContain('No badge runtime implementation');

    for (const noChange of [
      'no runtime change',
      'no API change',
      'no frontend change',
      'no migration',
      'no schema change',
    ]) {
      expect(source).toContain(noChange);
    }

    for (const runtimeBan of [
      'No badge runtime',
      'No threshold runtime',
      'No bucket runtime',
    ]) {
      expect(source).toContain(runtimeBan);
    }

    for (const governanceBan of [
      'ranking',
      'recommendation ordering',
      'hotness',
      'trend',
      'personalization',
      'creator score',
      'punishment',
      'demotion',
      'blocking',
      'abuse decision',
    ]) {
      expect(source).toContain(governanceBan);
    }

    for (const exposureBan of [
      'aggregate_count',
      'Tag count',
      'Tag breakdown',
      'Raw feedback total',
    ]) {
      expect(source).toContain(exposureBan);
    }

    for (const lowVolumeState of [
      '尚未達標',
      '回饋不足',
      '品質不足',
    ]) {
      expect(source).toContain(lowVolumeState);
    }

    expect(source).toContain('public UI should completely not display badge');
    expect(source).toContain('poll-level aggregate signal only');
    expect(source).toContain('per-user feedback event table');

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
      'phase-185r-high-quality-poll-badge-eligibility-plan-review-checkpoint-doc.test.ts',
    );
    expect(source).toContain(
      'phase-185r-high-quality-poll-badge-eligibility-plan-review-checkpoint.test.ts',
    );
    expect(source).toContain('design-drafts/');

    expect(readme).toContain('Phase 185-R');
    expect(readme).toContain(PHASE_185R_DOC);
    expect(readme).toContain(
      'High-quality poll badge eligibility plan review checkpoint',
    );
  });
});
