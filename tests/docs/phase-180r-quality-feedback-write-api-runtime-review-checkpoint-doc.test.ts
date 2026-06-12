import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_180R_DOC =
  'docs/www-project-phase-180r-quality-feedback-write-api-runtime-review-checkpoint-v1.md';

describe('Phase 180-R quality feedback write API runtime review checkpoint doc', () => {
  it('documents review findings, Phase 181 decision, and preserved vote boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_180R_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 180-R');
    expect(source).toContain(
      'Quality Feedback Aggregate Write API Runtime Review Checkpoint',
    );
    expect(source).toContain('review checkpoint only');
    expect(source).toContain('Phase 180');
    expect(source).toContain('Phase 181');

    expect(source).toContain('## 1. Review Purpose');
    expect(source).toContain('## 2. Review Findings');
    expect(source).toContain('## 3. Phase 181 Decision');
    expect(source).toContain('## 4. Blockers Before Phase 181');

    expect(source).toContain('POST /polls/:pollId/quality-feedback');
    expect(source).toContain('{ "feedback_tag": "表達清楚" }');
    expect(source).toContain('{ "ok": true }');
    expect(source).toContain('**CONFIRMED**');

    for (const tag of [
      '表達清楚',
      '選項公平',
      '值得思考',
      '期待結果',
      '題目不優',
    ]) {
      expect(source).toContain(tag);
    }

    expect(source).toContain('poll_quality_feedback_aggregate');
    expect(source).toContain('ON CONFLICT (poll_id, feedback_tag)');
    expect(source).toContain('aggregate_count = 1');
    expect(source).toContain('aggregate_count + 1');
    expect(source).toContain('updated_at = NOW()');
    expect(source).toContain('no migration');

    for (const excluded of [
      'Per-user feedback event table',
      'user_id',
      'session_id',
      'creator_session',
      'vote_token',
      'option_id',
      'option_index',
      'request_id',
      'threshold_state',
      'bucket_state',
      'Dashboard / ranking / personalization / creator punishment',
    ]) {
      expect(source).toContain(excluded);
    }

    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('Official Vote transaction order');
    expect(source).toContain('vote-by-index');
    expect(source).toContain('Vote token schema');
    expect(source).toContain('Counter schema');
    expect(source).toContain('Reference Answer');
    expect(source).toContain('UserAuthResolver');
    expect(source).toContain('/users/me');
    expect(source).toContain('/users/me/profile');
    expect(source).toContain('`creator_session` production identity boundary');

    expect(source).toContain('**APPROVED**');
    expect(source).toContain('Phase 181 blockers: none identified');
    expect(source).toContain('no runtime change');
    expect(source).toContain('no API change');
    expect(source).toContain('no frontend change');
    expect(source).toContain('Vote-by-index body remains `{ option_index }` only');

    expect(source).toContain(
      'phase-180r-quality-feedback-write-api-runtime-review-checkpoint.test.ts',
    );
    expect(source).toContain('quality-feedback-routes.test.ts');

    expect(readme).toContain('Phase 180-R');
    expect(readme).toContain(PHASE_180R_DOC);
    expect(readme).toContain(
      'Quality feedback write API runtime review checkpoint',
    );
  });
});
