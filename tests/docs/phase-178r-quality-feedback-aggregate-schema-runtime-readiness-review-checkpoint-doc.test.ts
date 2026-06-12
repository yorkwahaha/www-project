import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_178R_DOC =
  'docs/www-project-phase-178r-quality-feedback-aggregate-schema-runtime-readiness-review-checkpoint-v1.md';

describe('Phase 178-R quality feedback aggregate schema runtime readiness review checkpoint doc', () => {
  it('documents review findings, Phase 179 decision, and preserved vote boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_178R_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 178-R');
    expect(source).toContain(
      'Quality Feedback Aggregate Schema Runtime Readiness Review Checkpoint',
    );
    expect(source).toContain('review checkpoint only');
    expect(source).toContain('Phase 177');
    expect(source).toContain('Phase 179');

    expect(source).toContain('## 1. Review Purpose');
    expect(source).toContain('## 2. Review Findings');
    expect(source).toContain('## 3. Phase 179 Decision');
    expect(source).toContain('## 4. Blockers Before Phase 179');

    expect(source).toContain('poll_quality_feedback_aggregate');
    expect(source).toContain('Poll-level aggregate only');
    expect(source).toContain('**CONFIRMED**');
    expect(source).toContain('REFERENCES polls (id)');
    expect(source).toContain('UNIQUE (poll_id, feedback_tag)');
    expect(source).toContain('aggregate_count >= 0');
    expect(source).toContain('updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()');

    for (const tag of [
      '表達清楚',
      '選項公平',
      '值得思考',
      '期待結果',
      '題目不優',
    ]) {
      expect(source).toContain(tag);
    }

    for (const excluded of [
      'Per-user feedback event table',
      'threshold_state',
      'bucket_state',
      'Vote token FK',
      'Counter shard FK',
      'option_id',
      'option_index',
      'user_id',
      'session_id',
      'creator_session',
      'request_id',
      'Selected option + feedback_tag linkage',
      'Logs / metrics / APM / dashboard / ranking / creator punishment score schema',
      'ranking personalization',
      'creator punishment score',
    ]) {
      expect(source).toContain(excluded);
    }

    expect(source).toContain('**APPROVED**');
    expect(source).toContain('Phase 179 blockers: none identified');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('Official Vote transaction order');
    expect(source).toContain('vote-by-index');
    expect(source).toContain('Vote token schema');
    expect(source).toContain('Counter schema');
    expect(source).toContain('Reference Answer');
    expect(source).toContain('UserAuthResolver');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');

    expect(source).toContain('no migration');
    expect(source).toContain('no schema change');
    expect(source).toContain('no runtime');
    expect(source).toContain('no API implementation');
    expect(source).toContain('no UI implementation');
    expect(source).toContain('Vote-by-index body remains `{ option_index }` only');

    expect(source).toContain(
      'phase-178r-quality-feedback-aggregate-schema-runtime-readiness-review-checkpoint.test.ts',
    );
    expect(source).toContain('quality-feedback-aggregate-schema-guard.test.ts');

    expect(readme).toContain('Phase 178-R');
    expect(readme).toContain(PHASE_178R_DOC);
    expect(readme).toContain(
      'Quality feedback aggregate schema runtime readiness review checkpoint',
    );
  });
});
