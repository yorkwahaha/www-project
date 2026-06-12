import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_182_DOC =
  'docs/www-project-phase-182-quality-feedback-milestone-governance-boundary-v1.md';

describe('Phase 182 quality feedback milestone governance boundary doc', () => {
  it('documents Phase 177-181-R summary, governance boundary, and fixed prohibitions', async () => {
    const source = await readFile(join(process.cwd(), PHASE_182_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 182');
    expect(source).toContain(
      'Quality Feedback Milestone & Governance Boundary',
    );
    expect(source).toContain('Phase 177–181-R Milestone Summary');
    expect(source).toContain('Phase 177');
    expect(source).toContain('Phase 178-R');
    expect(source).toContain('Phase 179');
    expect(source).toContain('Phase 180');
    expect(source).toContain('Phase 180-R');
    expect(source).toContain('Phase 181');
    expect(source).toContain('Phase 181-R');

    expect(source).toContain('poll_quality_feedback_aggregate');
    expect(source).toContain('POST /polls/:pollId/quality-feedback');
    expect(source).toContain('{ "feedback_tag": "表達清楚" }');
    expect(source).toContain('{ "ok": true }');

    for (const tag of [
      '表達清楚',
      '選項公平',
      '值得思考',
      '期待結果',
      '題目不優',
    ]) {
      expect(source).toContain(tag);
    }

    expect(source).toContain('only after vote success');
    expect(source).toContain('does not call');
    expect(source).toContain("credentials: 'omit'");
    expect(source).toContain('page-local soft lock');
    expect(source).toContain('No durable dedup');
    expect(source).toContain('No `localStorage`');
    expect(source).toContain('sessionStorage');
    expect(source).toContain('cookie');
    expect(source).toContain('per-user feedback event table');
    expect(source).toContain('poll-level aggregate signal');

    for (const forbidden of [
      'aggregate_count',
      'threshold_state',
      'bucket_state',
      'ranking',
      'creator score',
      'recommendation ordering',
      'penalty',
      'option_id',
      'option_index',
      'user_id',
      'session_id',
      'request_id',
      'log',
      'trace',
      'metric',
      'error',
      'analytics',
    ]) {
      expect(source).toContain(forbidden);
    }

    for (const nonGoal of [
      'no runtime change',
      'no API change',
      'no frontend change',
      'no migration',
      'no schema change',
    ]) {
      expect(source).toContain(nonGoal);
    }

    expect(source).toContain('優質題目');
    expect(source).toContain('must open a new phase');
    expect(source).toContain('Governance rule');
    expect(source).toContain('Minimum volume');
    expect(source).toContain('Privacy boundary');
    expect(source).toContain('Abuse boundary');
    expect(source).toContain('Display copy');
    expect(source).toContain('Public vs creator-facing boundary');

    expect(source).toContain('Official Vote transaction order');
    expect(source).toContain('vote-by-index');
    expect(source).toContain('eligibility-before-option-resolve');
    expect(source).toContain('Reference Answer');
    expect(source).toContain('UserAuthResolver');
    expect(source).toContain('Raw Option Linkage Ban');

    expect(source).toContain(
      'phase-182-quality-feedback-milestone-governance-boundary-doc.test.ts',
    );
    expect(source).toContain('design-drafts/');

    expect(readme).toContain('Phase 182');
    expect(readme).toContain(PHASE_182_DOC);
    expect(readme).toContain(
      'Quality feedback milestone & governance boundary',
    );
  });
});
