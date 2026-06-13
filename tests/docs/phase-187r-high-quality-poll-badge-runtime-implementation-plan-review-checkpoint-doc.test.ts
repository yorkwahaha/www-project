import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_187R_DOC =
  'docs/www-project-phase-187r-high-quality-poll-badge-runtime-implementation-plan-review-checkpoint-v1.md';

describe('Phase 187-R high-quality poll badge runtime implementation plan review checkpoint doc', () => {
  it('documents Phase 187 review, Phase 188 approval, and preserved governance boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_187R_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 187-R');
    expect(source).toContain(
      'High-quality Poll Badge Runtime Implementation Plan Review Checkpoint',
    );
    expect(source).toContain('review checkpoint only');
    expect(source).toContain('Phase 187');
    expect(source).toContain('Phase 182');
    expect(source).toContain('Phase 186-R');
    expect(source).toContain('Phase 188');

    expect(source).toContain('## 1. Review Purpose');
    expect(source).toContain('## 2. Review Findings');
    expect(source).toContain('## 3. Phase 188 Decision');
    expect(source).toContain('## 4. Blockers Before Phase 188');

    expect(source).toContain(
      './www-project-phase-187-high-quality-poll-badge-runtime-implementation-plan-v1.md',
    );
    expect(source).toContain('plan only');
    expect(source).toContain('**CONFIRMED**');
    expect(source).toContain('APPROVED — Phase 188 blockers: none identified.');
    expect(source).toContain(
      'High-quality Poll Badge Minimal Public Read Runtime',
    );
    expect(source).toContain('No frontend badge presentation');

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
      'No public API response field',
      'Frontend badge DOM',
      'No threshold runtime',
      'No bucket runtime',
    ]) {
      expect(source).toContain(runtimeBan);
    }

    expect(source).toContain('{ "quality_badge": null }');
    expect(source).toContain('{ "quality_badge": "positive_feedback" }');
    expect(source).toContain('must **not distinguish reasons**');
    expect(source).toContain('not qualified');
    expect(source).toContain('low volume');
    expect(source).toContain('not yet computed');
    expect(source).toContain('conservative gating');
    expect(source).toContain('completely not display badge');

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

    for (const governanceBan of [
      'ranking',
      'recommendation ordering',
      'creator score',
      'punishment',
      'demotion',
      'blocking',
      'abuse decision',
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

    expect(source).toContain('poll_quality_feedback_aggregate');
    expect(source).toContain('Durable badge table');
    expect(source).toContain('separate schema/migration phase');
    expect(source).toContain('Creator-facing explanation/debug');
    expect(source).toContain('open a separate phase');
    expect(source).toContain('Feed ordering');
    expect(source).toContain('Explore ordering');

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
      'phase-187r-high-quality-poll-badge-runtime-implementation-plan-review-checkpoint-doc.test.ts',
    );
    expect(source).toContain(
      'phase-187r-high-quality-poll-badge-runtime-implementation-plan-review-checkpoint.test.ts',
    );
    expect(source).toContain('design-drafts/');

    expect(readme).toContain('Phase 187-R');
    expect(readme).toContain(PHASE_187R_DOC);
    expect(readme).toContain(
      'High-quality poll badge runtime implementation plan review checkpoint',
    );
  });
});
