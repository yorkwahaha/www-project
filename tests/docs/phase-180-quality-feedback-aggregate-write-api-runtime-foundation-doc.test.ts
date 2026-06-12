import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_180_DOC =
  'docs/www-project-phase-180-quality-feedback-aggregate-write-api-runtime-foundation-v1.md';

describe('Phase 180 quality feedback aggregate write API runtime foundation doc', () => {
  it('documents API scope, exclusions, response shape, and preserved boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_180_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 180');
    expect(source).toContain('Quality Feedback Aggregate Write API Runtime Foundation');
    expect(source).toContain('POST /polls/:pollId/quality-feedback');
    expect(source).toContain('{ "feedback_tag": "表達清楚" }');
    expect(source).toContain('{ "ok": true }');
    expect(source).toContain('poll_quality_feedback_aggregate');
    expect(source).toContain('aggregate_count = aggregate_count + 1');

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
      'No migration or schema change',
      'no per-user feedback event table',
      'no duplicate prevention',
      'no option/vote/user/session/request/device/log/trace linkage',
      'vote token reads or writes',
      'counter shard reads or writes',
      'logs/metrics/APM/analytics',
      'dashboard/ranking/personalization/creator punishment',
      'threshold or bucket state',
      'Phase 181 may handle frontend post-vote feedback UX',
    ]) {
      expect(source).toContain(excluded);
    }

    for (const preserved of [
      'Raw Option Linkage Ban',
      'Official Vote transaction order',
      '`vote-by-index` eligibility-before-option-resolve',
      '`vote-by-index` body `{ option_index }`',
      'Vote token schema: `user_id + poll_id`',
      'Counter schema: `poll_id + option_id + shard_id`',
      'Result visibility',
      'Eligibility',
      'Auth',
      'Reference Answer',
      'UserAuthResolver',
      'profile fields',
      '/users/me',
      '/users/me/profile',
      'creator_session production identity boundary',
    ]) {
      expect(source).toContain(preserved);
    }

    expect(readme).toContain('Phase 180');
    expect(readme).toContain(PHASE_180_DOC);
    expect(readme).toContain('Quality feedback aggregate write API runtime foundation');
  });
});
