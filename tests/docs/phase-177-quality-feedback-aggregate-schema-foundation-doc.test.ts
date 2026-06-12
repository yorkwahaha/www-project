import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_177_DOC =
  'docs/www-project-phase-177-quality-feedback-aggregate-schema-foundation-v1.md';

describe('Phase 177 quality feedback aggregate schema foundation doc', () => {
  it('documents schema scope, exclusions, and future runtime boundary', async () => {
    const source = await readFile(join(process.cwd(), PHASE_177_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 177');
    expect(source).toContain('Quality Feedback Aggregate Schema Foundation');
    expect(source).toContain('poll_quality_feedback_aggregate');
    expect(source).toContain('poll-level aggregate schema foundation');
    expect(source).toContain('poll_id');
    expect(source).toContain('feedback_tag');
    expect(source).toContain('aggregate_count');
    expect(source).toContain('updated_at');
    expect(source).toContain('UNIQUE (poll_id, feedback_tag)');
    expect(source).toContain('CHECK (aggregate_count >= 0)');

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
      'per-user feedback event table',
      'threshold_state',
      'bucket_state',
      'vote token FK',
      'counter shard FK',
      'user_id',
      'session_id',
      'creator_session',
      'option_id',
      'option_index',
      'request_id',
      'selected option + feedback_tag linkage',
      'logs / metrics / analytics / APM / dashboard',
      'ranking personalization',
      'creator punishment score',
    ]) {
      expect(source).toContain(excluded);
    }

    expect(source).toContain('does not handle runtime API behavior');
    expect(source).toContain('Phase 178 or later may discuss aggregate write API/runtime');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('Official Vote transaction order');
    expect(source).toContain('vote-by-index');
    expect(source).toContain('Vote token schema remains `user_id + poll_id`');
    expect(source).toContain('Counter schema remains `poll_id + option_id + shard_id`');
    expect(source).toContain('Reference Answer');
    expect(source).toContain('UserAuthResolver');
    expect(source).toContain('creator_session production identity boundary');

    expect(readme).toContain('Phase 177');
    expect(readme).toContain(PHASE_177_DOC);
    expect(readme).toContain('Quality feedback aggregate schema foundation');
  });
});
