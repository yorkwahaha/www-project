import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_176R_DOC =
  'docs/www-project-phase-176r-quality-feedback-schema-plan-review-checkpoint-v1.md';

describe('Phase 176-R quality feedback schema plan review checkpoint doc', () => {
  it('documents review findings, migration decision, and preserved vote boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_176R_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 176-R');
    expect(source).toContain('Quality Feedback Schema Plan Review Checkpoint');
    expect(source).toContain('review checkpoint only');
    expect(source).toContain('Phase 171');
    expect(source).toContain('Phase 172');
    expect(source).toContain('Phase 173');
    expect(source).toContain('Phase 174');
    expect(source).toContain('Phase 175');
    expect(source).toContain('Phase 177');

    expect(source).toContain('## 1. Review Purpose');
    expect(source).toContain('## 2. Review Findings');
    expect(source).toContain('## 3. Phase 177 Migration Decision');
    expect(source).toContain('## 4. Open Questions');
    expect(source).toContain('## 5. Blockers Before Phase 177');

    expect(source).toContain('Poll-level aggregate only');
    expect(source).toContain('**CONFIRMED**');
    expect(source).toContain('per-user feedback event table');
    expect(source).toContain('not needed');
    expect(source).toContain('Forbidden durable linkages');

    expect(source).toContain('poll_quality_feedback_aggregate');
    expect(source).toContain('poll_id');
    expect(source).toContain('feedback_tag');
    expect(source).toContain('aggregate_count');
    expect(source).toContain('updated_at');

    expect(source).toContain('threshold_state');
    expect(source).toContain('bucket_state');
    expect(source).toContain('should **exclude**');

    expect(source).toContain('UNIQUE (poll_id, feedback_tag)');
    expect(source).toContain('non-negative');
    expect(source).toContain('aggregate_count >= 0');

    expect(source).toContain('表達清楚');
    expect(source).toContain('選項公平');
    expect(source).toContain('值得思考');
    expect(source).toContain('期待結果');
    expect(source).toContain('題目不優');

    expect(source).toContain('Official Vote transaction order');
    expect(source).toContain('vote-by-index');
    expect(source).toContain('vote token schema');
    expect(source).toContain('counter schema');
    expect(source).toContain('result visibility');
    expect(source).toContain('eligibility');
    expect(source).toContain('UserAuthResolver');
    expect(source).toContain('Reference Answer');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');

    expect(source).toContain('no analytics');
    expect(source).toContain('no ranking/personalization');
    expect(source).toContain('no creator punishment score');
    expect(source).toContain('no logs/metrics/APM/dashboards');

    expect(source).toContain('**APPROVED**');
    expect(source).toContain('Phase 177 blockers: none identified');
    expect(source).toContain('no migration');
    expect(source).toContain('no schema implementation');
    expect(source).toContain('no runtime');
    expect(source).toContain('no API');
    expect(source).toContain('no UI');

    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('Vote-by-index body remains `{ option_index }` only');

    expect(readme).toContain('Phase 176-R');
    expect(readme).toContain(PHASE_176R_DOC);
    expect(readme).toContain('Quality feedback schema plan review checkpoint');
  });
});
