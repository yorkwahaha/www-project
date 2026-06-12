import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_175_DOC =
  'docs/www-project-phase-175-quality-feedback-schema-foundation-plan-v1.md';

describe('Phase 175 quality feedback schema foundation plan doc', () => {
  it('documents schema foundation constraints and preserved vote boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_175_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 175');
    expect(source).toContain('Quality Feedback Schema Foundation Plan');
    expect(source).toContain('docs/spec only');
    expect(source).toContain('Phase 171');
    expect(source).toContain('Phase 172');
    expect(source).toContain('Phase 173');
    expect(source).toContain('Phase 174');
    expect(source).toContain('Not implemented');

    expect(source).toContain('## 1. Purpose');
    expect(source).toContain('## 2. Non-Goals');
    expect(source).toContain('## 3. Planned Aggregate Table');
    expect(source).toContain('## 5. Forbidden Schema Elements');
    expect(source).toContain('## 8. Open Schema Design Questions');

    expect(source).toContain('表達清楚');
    expect(source).toContain('選項公平');
    expect(source).toContain('值得思考');
    expect(source).toContain('期待結果');
    expect(source).toContain('題目不優');

    expect(source).toContain('poll-level aggregate');
    expect(source).toContain('poll_id');
    expect(source).toContain('feedback_tag');
    expect(source).toContain('aggregate_count');
    expect(source).toContain('updated_at');
    expect(source).toContain('threshold_state');
    expect(source).toContain('bucket_state');

    expect(source).toContain('poll_id + feedback_tag');
    expect(source).toContain('non-negative');
    expect(source).toContain('public poll identity');
    expect(source).toContain('must not imply option-level linkage');

    expect(source).toContain('user_id');
    expect(source).toContain('session_id');
    expect(source).toContain('creator_session');
    expect(source).toContain('vote_token');
    expect(source).toContain('option_id');
    expect(source).toContain('option_index');
    expect(source).toContain('ranking id');

    expect(source).toContain('Per-user feedback event rows');
    expect(source).toContain('Selected option + feedback tag');
    expect(source).toContain('vote counter shard');

    expect(source).toContain('no migration');
    expect(source).toContain('no schema implementation');
    expect(source).toContain('no runtime');
    expect(source).toContain('no API');
    expect(source).toContain('no UI');
    expect(source).toContain('no analytics');
    expect(source).toContain('no ranking/personalization');
    expect(source).toContain('no creator punishment score');

    expect(source).toContain('`updated_at` required or optional?');
    expect(source).toContain('threshold_state');
    expect(source).toContain('bucket_state');
    expect(source).toContain('Pre-create vs insert-on-first-feedback');
    expect(source).toContain('優質題目');
    expect(source).toContain('Privacy-safe queue before aggregate update');

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

    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain(
      'Feedback schema foundation is **not implemented**',
    );

    expect(readme).toContain('Phase 175');
    expect(readme).toContain(PHASE_175_DOC);
    expect(readme).toContain('Quality feedback schema foundation plan');
  });
});
