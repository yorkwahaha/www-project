import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_181R_DOC =
  'docs/www-project-phase-181r-post-vote-quality-feedback-ux-runtime-review-checkpoint-v1.md';

describe('Phase 181-R post-vote quality feedback UX runtime review checkpoint doc', () => {
  it('documents review findings, Phase 182 decision, and preserved vote boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_181R_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 181-R');
    expect(source).toContain(
      'Post-vote Quality Feedback UX Runtime Review Checkpoint',
    );
    expect(source).toContain('review checkpoint only');
    expect(source).toContain('Phase 181');
    expect(source).toContain('Phase 182');

    expect(source).toContain('## 1. Review Purpose');
    expect(source).toContain('## 2. Review Findings');
    expect(source).toContain('## 3. Phase 182 Decision');
    expect(source).toContain('## 4. Blockers Before Phase 182');

    expect(source).toContain('POST /polls/:pollId/quality-feedback');
    expect(source).toContain('{ "feedback_tag": "表達清楚" }');
    expect(source).toContain("credentials: 'omit'");
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

    expect(source).toContain('已收到，謝謝你的回饋。');
    expect(source).toContain('目前無法送出回饋，稍後可再試一次。');

    for (const excluded of [
      'Feedback mounts only after vote success',
      'option_id',
      'option_index',
      'user_id',
      'session_id',
      'vote token / counter shard',
      'aggregate_count',
      'threshold_state',
      'bucket_state',
      'No `localStorage`',
      'Page-local soft lock after success',
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
    expect(source).toContain('Phase 182 blockers: none identified');
    expect(source).toContain('no runtime change');
    expect(source).toContain('no API change');
    expect(source).toContain('no frontend change');
    expect(source).toContain('Vote-by-index body remains `{ option_index }` only');

    expect(source).toContain('post-vote-quality-feedback.js');
    expect(source).toContain(
      'phase-181r-post-vote-quality-feedback-ux-runtime-review-checkpoint.test.ts',
    );
    expect(source).toContain('phase-181-post-vote-quality-feedback-ux.test.ts');

    expect(readme).toContain('Phase 181-R');
    expect(readme).toContain(PHASE_181R_DOC);
    expect(readme).toContain(
      'Post-vote quality feedback UX runtime review checkpoint',
    );
  });
});
