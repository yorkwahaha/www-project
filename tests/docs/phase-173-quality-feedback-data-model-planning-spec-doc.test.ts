import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_173_DOC =
  'docs/www-project-phase-173-quality-feedback-data-model-planning-spec-v1.md';

describe('Phase 173 quality feedback data model planning spec doc', () => {
  it('documents aggregate data model direction and preserved vote boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_173_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 173');
    expect(source).toContain('Quality Feedback Data Model Planning Spec');
    expect(source).toContain('docs/spec only');
    expect(source).toContain('Phase 171');
    expect(source).toContain('Phase 172');
    expect(source).toContain('Not implemented');

    expect(source).toContain('## 1. Purpose');
    expect(source).toContain('## 2. Non-Goals');
    expect(source).toContain('## 4. Allowed Future Durable Shape');
    expect(source).toContain('## 5. Forbidden Identifiers and Joins');
    expect(source).toContain('## 6. Open Design Choices');

    expect(source).toContain('表達清楚');
    expect(source).toContain('選項公平');
    expect(source).toContain('值得思考');
    expect(source).toContain('期待結果');
    expect(source).toContain('題目不優');

    expect(source).toContain('poll-level aggregate only');
    expect(source).toContain('poll_id');
    expect(source).toContain('feedback_tag');
    expect(source).toContain('aggregate_count');
    expect(source).toContain('updated_at');

    expect(source).toContain('no schema/migration');
    expect(source).toContain('no runtime');
    expect(source).toContain('no API');
    expect(source).toContain('no UI');
    expect(source).toContain('no analytics');
    expect(source).toContain('no ranking/personalization');
    expect(source).toContain('no creator punishment score');

    expect(source).toContain('Per-user feedback event rows');
    expect(source).toContain('user_id');
    expect(source).toContain('session_id');
    expect(source).toContain('creator_session');
    expect(source).toContain('vote_token');
    expect(source).toContain('option_id');
    expect(source).toContain('option_index');
    expect(source).toContain('request_id');
    expect(source).toContain('trace id');
    expect(source).toContain('analytics id');

    expect(source).toContain('vote counter shard');
    expect(source).toContain('Selected option + feedback tag');

    expect(source).toContain('Synchronous aggregate update');
    expect(source).toContain('privacy-safe queue');
    expect(source).toContain('Short-lived non-durable anti-duplicate guard');
    expect(source).toContain('Minimum threshold before creator-facing display');
    expect(source).toContain('優質題目');
    expect(source).toContain('ineligible or failed vote attempts');

    expect(source).toContain('Official Vote transaction order');
    expect(source).toContain('vote-by-index');
    expect(source).toContain('vote token schema');
    expect(source).toContain('counter schema');
    expect(source).toContain('result visibility');
    expect(source).toContain('Reference Answer');
    expect(source).toContain('UserAuthResolver');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');

    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain(
      'Poll quality feedback data model is **not implemented**',
    );

    expect(readme).toContain('Phase 173');
    expect(readme).toContain(PHASE_173_DOC);
    expect(readme).toContain('Quality feedback data model planning spec');
  });
});
