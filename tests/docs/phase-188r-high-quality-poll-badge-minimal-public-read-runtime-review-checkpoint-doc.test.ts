import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_188R_DOC =
  'docs/www-project-phase-188r-high-quality-poll-badge-minimal-public-read-runtime-review-checkpoint-v1.md';

describe('Phase 188-R high-quality poll badge minimal public read runtime review checkpoint doc', () => {
  it('documents Phase 188 review, Phase 189 approval, and preserved governance boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_188R_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 188-R');
    expect(source).toContain(
      'High-quality Poll Badge Minimal Public Read Runtime Review Checkpoint',
    );
    expect(source).toContain('review checkpoint only');
    expect(source).toContain('Phase 188');
    expect(source).toContain('Phase 182');
    expect(source).toContain('Phase 187-R');
    expect(source).toContain('Phase 189');

    expect(source).toContain('## 1. Review Purpose');
    expect(source).toContain('## 2. Review Findings');
    expect(source).toContain('## 3. Phase 189 Decision');
    expect(source).toContain('## 4. Blockers Before Phase 189');

    expect(source).toContain(
      './www-project-phase-188-high-quality-poll-badge-minimal-public-read-runtime-v1.md',
    );
    expect(source).toContain('minimal public read runtime');
    expect(source).toContain('**CONFIRMED**');
    expect(source).toContain('APPROVED — Phase 189 blockers: none identified.');
    expect(source).toContain('High-quality Poll Badge Frontend Presentation Plan');
    expect(source).toContain('Plan-only');
    expect(source).toContain('No frontend badge rendering runtime implementation');

    for (const noChange of [
      'no runtime change',
      'no API change',
      'no frontend change',
      'no migration',
      'no schema change',
    ]) {
      expect(source).toContain(noChange);
    }

    expect(source).toContain('GET /polls/:id');
    expect(source).toContain('GET /polls/:id/results');
    expect(source).toContain('GET /polls/feed');
    expect(source).toContain('deriveQualityBadge');

    expect(source).toContain('{ "quality_badge": null }');
    expect(source).toContain('{ "quality_badge": "positive_feedback" }');
    expect(source).toContain('null | "positive_feedback"');

    for (const forbiddenOutput of [
      'aggregate_count',
      'tag_counts',
      'tag_breakdown',
      'raw_feedback_total',
      'score',
      'rank',
      'percentile',
      'threshold_state',
      'bucket_state',
      'creator_score',
    ]) {
      expect(source).toContain(forbiddenOutput);
    }

    expect(source).toContain('poll_quality_feedback_aggregate');
    expect(source).toContain('Durable badge table');
    expect(source).toContain('No schema/migration added in Phase 188');

    for (const frontendBan of [
      'No badge DOM',
      'No badge rendering',
      'quality_badge` parsing tolerance only',
      'localStorage',
      'sessionStorage',
      'cookie',
    ]) {
      expect(source).toContain(frontendBan);
    }

    for (const orderingBoundary of [
      'Feed ordering',
      'Explore ordering',
      'Results visibility',
      'lifecycle',
      'Vote transaction',
      'vote-by-index',
      'Reference Answer',
      'UserAuthResolver',
      'Profile fields',
    ]) {
      expect(source).toContain(orderingBoundary);
    }

    expect(source).toContain('poll-level aggregate signal only');
    expect(source).toContain('per-user feedback event table');
    expect(source).toContain('option choice or voter identity');

    for (const linkage of [
      'option_id',
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
      'eligibility-before-option-resolve',
    ]) {
      expect(source).toContain(protectedBoundary);
    }

    expect(source).toContain(
      'phase-188r-high-quality-poll-badge-minimal-public-read-runtime-review-checkpoint-doc.test.ts',
    );
    expect(source).toContain(
      'phase-188r-high-quality-poll-badge-minimal-public-read-runtime-review-checkpoint.test.ts',
    );
    expect(source).toContain('design-drafts/');

    expect(readme).toContain('Phase 188-R');
    expect(readme).toContain(PHASE_188R_DOC);
    expect(readme).toContain(
      'High-quality poll badge minimal public read runtime review checkpoint',
    );
  });
});
