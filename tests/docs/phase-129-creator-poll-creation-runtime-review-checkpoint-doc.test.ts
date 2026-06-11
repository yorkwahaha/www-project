import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_129_DOC =
  'docs/www-project-phase-129-creator-poll-creation-runtime-review-checkpoint-v1.md';

describe('Phase 129 creator poll creation runtime review checkpoint doc', () => {
  it('documents the review checkpoint and preserved boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_129_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 129');
    expect(source).toContain('Creator Poll Creation Runtime Review Checkpoint');
    expect(source).toContain('Phase 65C-A');
    expect(source).toContain('Phase 128');
    expect(source).toContain('No runtime, frontend behavior, API behavior');

    expect(source).toContain('/polls/new` static showcase and `/polls/new?live=1` live creator flow');
    expect(source).toContain('parseLiveApiMode');
    expect(source).toContain('submitCreatePollDemo');
    expect(source).toContain('公開展示版');
    expect(source).toContain('資料不會儲存');

    expect(source).toContain('ensureCreatorSessionForLiveMode');
    expect(source).toContain('creator_session` is not production identity');
    expect(source).toContain('does not replace formal login/session');
    expect(source).toContain('X-User-Id` remains explicit non-production compatibility only');

    expect(source).toContain('eligible_rule_id: null');
    expect(source).toContain('mvp-form-demo-fields');
    expect(source).toContain('profile, eligibility, demographic, analytics, or tracking fields');

    expect(source).toContain('vote counts, result previews, voter status, eligibility status');
    expect(source).toContain('vote token, counter shard');
    expect(source).toContain('目前無法建立問卷，請稍後再試。');
    expect(source).toContain('目前無法確認發起者身分，請稍後再試。');

    expect(source).toContain('Official Vote transaction order unchanged');
    expect(source).toContain('Vote-by-index eligibility before option resolve unchanged');
    expect(source).toContain('Reference Answer remains disconnected');
    expect(source).toContain('demographic breakdown, ranking personalization, or analytics linkage');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain(
      'phase-129-creator-poll-creation-runtime-review-checkpoint.test.ts',
    );
    expect(source).toContain('smoke:public:local');
    expect(source).toContain('Docker Desktop remains unavailable');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 129');
    expect(readme).toContain(PHASE_129_DOC);
    expect(readme).toContain('Creator poll creation runtime review checkpoint');
  });
});
