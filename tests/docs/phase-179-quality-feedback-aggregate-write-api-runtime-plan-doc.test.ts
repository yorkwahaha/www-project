import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_179_DOC =
  'docs/www-project-phase-179-quality-feedback-aggregate-write-api-runtime-plan-v1.md';

describe('Phase 179 quality feedback aggregate write API runtime plan doc', () => {
  it('documents body limits, forbidden linkages, response limits, and preserved boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_179_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 179');
    expect(source).toContain('Quality Feedback Aggregate Write API Runtime Plan');
    expect(source).toContain('docs/spec and guard tests only');
    expect(source).toContain('Not implemented');
    expect(source).toContain('POST /polls/:pollId/quality-feedback');
    expect(source).toContain('{ "feedback_tag": "表達清楚" }');
    expect(source).toContain('body must be limited to exactly one field');

    for (const tag of [
      '表達清楚',
      '選項公平',
      '值得思考',
      '期待結果',
      '題目不優',
    ]) {
      expect(source).toContain(tag);
    }

    for (const forbidden of [
      'option_id',
      'option_index',
      'user_id',
      'session_id',
      'creator_session',
      'vote_token',
      'request_id',
      'device / IP / UA',
      'trace / metric / error / analytics id',
      'selected option',
      'threshold_state',
      'bucket_state',
      'No query parameter, header, log payload, metric label, trace attribute, error payload, or analytics record',
    ]) {
      expect(source).toContain(forbidden);
    }

    expect(source).toContain('increment only `(poll_id, feedback_tag)`');
    expect(source).toContain('not create a per-user feedback event table');
    expect(source).toContain('not do user/session/device/request dedup');
    expect(source).toContain('not read or write option selection');
    expect(source).toContain('not read vote token data');
    expect(source).toContain('not read counter shard data');
    expect(source).toContain('feedback API itself must not know which option was selected');

    expect(source).toContain('MVP planning recommends no per-user duplicate prevention');
    expect(source).toContain('Accepting repeated feedback is a lower-risk MVP tradeoff');
    expect(source).toContain('must not secretly add user/session/device/request linkage');

    expect(source).toContain('{ "ok": true }');
    for (const forbiddenResponse of [
      'aggregate_count',
      'threshold_state',
      'bucket_state',
      'ranking signal',
      'creator score',
      'creator punishment score',
    ]) {
      expect(source).toContain(forbiddenResponse);
    }

    expect(source).toContain('no migration');
    expect(source).toContain('no runtime route');
    expect(source).toContain('no repository/service');
    expect(source).toContain('no frontend');
    expect(source).toContain('no logs/metrics/APM/analytics');
    expect(source).toContain('no event table');
    expect(source).toContain('no threshold/bucket state');

    expect(source).toContain('Official Vote transaction order');
    expect(source).toContain('`vote-by-index` body `{ option_index }`');
    expect(source).toContain('eligibility-before-option-resolve');
    expect(source).toContain('vote token schema `user_id + poll_id`');
    expect(source).toContain('counter schema `poll_id + option_id + shard_id`');
    expect(source).toContain('result visibility');
    expect(source).toContain('auth');
    expect(source).toContain('profile fields');
    expect(source).toContain('Reference Answer');
    expect(source).toContain('UserAuthResolver');

    expect(readme).toContain('Phase 179');
    expect(readme).toContain(PHASE_179_DOC);
    expect(readme).toContain('Quality feedback aggregate write API runtime plan');
  });
});
