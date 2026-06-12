import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_171_DOC =
  'docs/www-project-phase-171-poll-quality-feedback-mechanism-product-spec-v1.md';

describe('Phase 171 poll quality feedback mechanism product spec doc', () => {
  it('documents post-vote feedback spec, tag rationale, and preserved boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_171_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 171');
    expect(source).toContain('Poll Quality Feedback Mechanism Product Spec');
    expect(source).toContain('docs/spec only');
    expect(source).toContain('Phase 170');
    expect(source).toContain('Not implemented');

    expect(source).toContain('## 1. Purpose');
    expect(source).toContain('## 2. Non-Goals');
    expect(source).toContain('## 3. Proposed MVP Feedback Tags');
    expect(source).toContain('## 4. Tag Rationale and Interpretation');
    expect(source).toContain('## 5. When Feedback May Appear');
    expect(source).toContain('## 6. Privacy Guard and Raw Option Linkage Ban');
    expect(source).toContain('## 8. Future-Open Questions');

    expect(source).toContain('表達清楚');
    expect(source).toContain('選項公平');
    expect(source).toContain('值得思考');
    expect(source).toContain('期待結果');
    expect(source).toContain('題目不優');

    expect(source).toContain('無刻意引導');
    expect(source).toContain('中立客觀');
    expect(source).toContain(
      '「選項公平」replaces overlapping ideas like「無刻意引導」and「中立客觀」',
    );
    expect(source).toContain(
      '「表達清楚」means question and options are understandable',
    );
    expect(source).toContain('不太想答');
    expect(source).toContain('soft negative signal, not a public shame label');
    expect(source).toContain('Optional and lightweight by design');

    expect(source).toContain('allowed post-vote UX point');
    expect(source).toContain(
      'joins a user\'s **selected option** with their **feedback tags**',
    );
    expect(source).toContain(
      'option choice + user/session/device/request/log/trace/metric/error payload linkage',
    );
    expect(source).toContain(
      'introduce logs, metrics, analytics, tracking, APM traces, ranking personalization, or creator scoring runtime',
    );

    expect(source).toContain('vote token schema');
    expect(source).toContain('counter schema');
    expect(source).toContain('Official Vote transaction order');
    expect(source).toContain('vote-by-index');
    expect(source).toContain('eligibility');
    expect(source).toContain('result visibility');
    expect(source).toContain('Reference Answer');

    expect(source).toContain('Anonymous aggregate only');
    expect(source).toContain('優質題目');
    expect(source).toContain('不太想答');
    expect(source).toContain('block quality qualification');
    expect(source).toContain('Abuse without identity-choice linkage');
    expect(source).toContain('delayed, bucketed');

    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('Poll quality feedback is **not implemented**');

    expect(readme).toContain('Phase 171');
    expect(readme).toContain(PHASE_171_DOC);
    expect(readme).toContain('Poll quality feedback mechanism product spec');
  });
});
