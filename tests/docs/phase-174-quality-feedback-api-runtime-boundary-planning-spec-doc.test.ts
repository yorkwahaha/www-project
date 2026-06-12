import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_174_DOC =
  'docs/www-project-phase-174-quality-feedback-api-runtime-boundary-planning-spec-v1.md';

describe('Phase 174 quality feedback API runtime boundary planning spec doc', () => {
  it('documents API/runtime boundaries and preserved vote boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_174_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 174');
    expect(source).toContain(
      'Quality Feedback API & Runtime Boundary Planning Spec',
    );
    expect(source).toContain('docs/spec only');
    expect(source).toContain('Phase 171');
    expect(source).toContain('Phase 172');
    expect(source).toContain('Phase 173');
    expect(source).toContain('Not implemented');

    expect(source).toContain('## 1. Purpose');
    expect(source).toContain('## 2. Non-Goals');
    expect(source).toContain('## 4. Post-Vote UX Entry Point');
    expect(source).toContain('## 5. Future API Payload Shape');
    expect(source).toContain('## 6. Backend Validation and Aggregate Updates');
    expect(source).toContain('## 8. Failed / Ineligible Vote Feedback');
    expect(source).toContain('## 12. Future-Open Questions');

    expect(source).toContain('表達清楚');
    expect(source).toContain('選項公平');
    expect(source).toContain('值得思考');
    expect(source).toContain('期待結果');
    expect(source).toContain('題目不優');

    expect(source).toContain('allowed post-vote UX point');
    expect(source).toContain(
      'separation of feedback submission from Official Vote transaction',
    );
    expect(source).toContain('feedback_tags');
    expect(source).toContain('poll_id');

    expect(source).toContain('option_id');
    expect(source).toContain('option_index');
    expect(source).toContain('user_id');
    expect(source).toContain('session_id');
    expect(source).toContain('creator_session');
    expect(source).toContain('vote_token');
    expect(source).toContain('trace id');
    expect(source).toContain('analytics id');

    expect(source).toContain('poll-level aggregate feedback counts');
    expect(source).toContain('vote counters or counter shards');

    expect(source).toContain('Whether user\'s `option_index` exists');
    expect(source).toContain('Whether user is eligible');
    expect(source).toContain('Failed / Ineligible Vote Feedback');

    expect(source).toContain('error.message');
    expect(source).toContain('stack trace');
    expect(source).toContain('internal error code');

    expect(source).toContain(
      'delayed, bucketed, thresholded, aggregate-only',
    );

    expect(source).toContain('no API implementation');
    expect(source).toContain('no UI implementation');
    expect(source).toContain('no analytics');
    expect(source).toContain('no ranking/personalization');
    expect(source).toContain('no creator punishment score');
    expect(source).toContain('no logs/metrics/APM/dashboards');

    expect(source).toContain('Official Vote transaction order');
    expect(source).toContain('vote-by-index');
    expect(source).toContain('vote token schema');
    expect(source).toContain('counter schema');
    expect(source).toContain('eligibility');
    expect(source).toContain('result visibility');
    expect(source).toContain('Reference Answer');
    expect(source).toContain('UserAuthResolver');
    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');

    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain(
      'Poll quality feedback API and runtime boundaries are **not implemented**',
    );

    expect(readme).toContain('Phase 174');
    expect(readme).toContain(PHASE_174_DOC);
    expect(readme).toContain('Quality feedback API');
  });
});
