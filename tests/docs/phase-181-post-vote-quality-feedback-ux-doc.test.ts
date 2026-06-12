import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_181_DOC =
  'docs/www-project-phase-181-post-vote-quality-feedback-ux-v1.md';

describe('Phase 181 post-vote quality feedback UX doc', () => {
  it('documents post-vote UX scope, privacy boundaries, and preserved vote boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_181_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 181');
    expect(source).toContain('Post-vote Quality Feedback Frontend UX');
    expect(source).toContain('POST /polls/:pollId/quality-feedback');
    expect(source).toContain('{ "feedback_tag": "表達清楚" }');
    expect(source).toContain('這題給你的感覺是？');
    expect(source).toContain(
      '回饋只用來累計題目品質，不會記錄你選了哪個選項。',
    );
    expect(source).toContain('已收到，謝謝你的回饋。');
    expect(source).toContain('目前無法送出回饋，稍後可再試一次。');

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
      'only after a successful vote',
      'does not know which option the user selected',
      'add durable dedup',
      'No `localStorage`, `sessionStorage`, or cookie',
      'No analytics, log, trace, or metric linkage',
      'Phase 182',
    ]) {
      expect(source).toContain(excluded);
    }

    for (const preserved of [
      'Raw Option Linkage Ban',
      'Official Vote transaction order',
      '`vote-by-index` eligibility-before-option-resolve',
      '`vote-by-index` body `{ option_index }`',
      'Result visibility',
      'Eligibility',
      'Auth',
      'Reference Answer',
      'UserAuthResolver',
      'profile fields',
      '/users/me',
      '/users/me/profile',
      'production identity boundary',
    ]) {
      expect(source).toContain(preserved);
    }

    expect(source).toContain('post-vote-quality-feedback.js');
    expect(source).toContain(
      'phase-181-post-vote-quality-feedback-ux.test.ts',
    );

    expect(readme).toContain('Phase 181');
    expect(readme).toContain(PHASE_181_DOC);
    expect(readme).toContain('Post-vote quality feedback UX');
  });
});
