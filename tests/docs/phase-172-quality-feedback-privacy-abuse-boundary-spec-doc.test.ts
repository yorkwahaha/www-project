import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_172_DOC =
  'docs/www-project-phase-172-quality-feedback-privacy-abuse-boundary-spec-v1.md';

describe('Phase 172 quality feedback privacy abuse boundary spec doc', () => {
  it('documents privacy/abuse boundaries and preserved vote boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_172_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 172');
    expect(source).toContain('Quality Feedback Privacy & Abuse Boundary Spec');
    expect(source).toContain('docs/spec only');
    expect(source).toContain('Phase 171');
    expect(source).toContain('Not implemented');

    expect(source).toContain('## 1. Purpose');
    expect(source).toContain('## 2. Non-Goals');
    expect(source).toContain('## 3. Privacy Boundary for Future Feedback Collection');
    expect(source).toContain('## 4. Creator-Facing Feedback Boundary');
    expect(source).toContain('## 5. Soft Negative Tag');
    expect(source).toContain('## 6.');
    expect(source).toContain('## 7. Abuse Prevention Without Identity-Choice Linkage');
    expect(source).toContain('## 9. Future-Open Questions');

    expect(source).toContain('表達清楚');
    expect(source).toContain('選項公平');
    expect(source).toContain('值得思考');
    expect(source).toContain('期待結果');
    expect(source).toContain('題目不優');

    expect(source).toContain('selected option ↔ user');
    expect(source).toContain('selected option ↔ feedback tag');
    expect(source).toContain('feedback tag ↔ user');
    expect(source).toContain('feedback tag ↔ session/device/request');
    expect(source).toContain('feedback tag ↔ log/trace/metric/error payload');
    expect(source).toContain('poll-level quality signal');
    expect(source).toContain('Poll-level only, not option-level');

    expect(source).toContain('Delayed');
    expect(source).toContain('Bucketed');
    expect(source).toContain('Thresholded');
    expect(source).toContain('Aggregate-only');

    expect(source).toContain('soft negative quality signal');
    expect(source).toContain('a public shame label');
    expect(source).toContain('automatic punishment trigger');

    expect(source).toContain('優質題目');
    expect(source).toContain('aggregate thresholds only');
    expect(source).toContain('identity-linked reputation');

    expect(source).toContain('Rate limits');
    expect(source).toContain('Coarse eligibility');
    expect(source).toContain('Delayed aggregation');
    expect(source).toContain('Minimum thresholds');
    expect(source).toContain('Anomaly review');

    expect(source).toContain(
      'ranking personalization, analytics tracking, creator score runtime, punishment score',
    );
    expect(source).toContain('APM traces');
    expect(source).toContain('dashboards');

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
      'Poll quality feedback privacy and abuse boundaries are **not implemented**',
    );

    expect(readme).toContain('Phase 172');
    expect(readme).toContain(PHASE_172_DOC);
    expect(readme).toContain('Quality feedback privacy');
  });
});
