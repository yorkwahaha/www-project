import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_288_DOC =
  'docs/www-project-phase-288-my-polls-empty-state-copy-polish-v1.md';

describe('Phase 288 my polls empty state copy polish doc', () => {
  it('documents purpose, copy changes, scope, and boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_288_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 288');
    expect(source).toContain('My Polls Empty State Copy Polish');
    expect(source).toContain('21455e9');
    expect(source).toContain('presentation-only');

    expect(source).toContain('PUBLIC_MY_POLLS_EMPTY_MESSAGE');
    expect(source).toContain('PUBLIC_MY_POLLS_EMPTY_SUMMARY');
    expect(source).toContain('PUBLIC_MY_POLLS_EMPTY_HEADLINE');
    expect(source).toContain('目前還沒有你建立的問卷。');
    expect(source).toContain('可前往建立一則新問卷，完成後回到此頁管理。');
    expect(source).toContain('PUBLIC_CTA_GO_TO_CREATE_POLL_LIVE_LABEL');
    expect(source).toContain('/polls/new?live=1');

    for (const unchanged of [
      '載入你的問卷中，請稍候。',
      '目前無法載入你建立的問卷，請稍後再試。',
      'GET /creator/polls',
      'POST /creator/session',
    ]) {
      expect(source).toContain(unchanged);
    }

    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('option_index');
    expect(source).toContain('eligibility-before-option-resolve');
    expect(source).toContain('positive_feedback');
    expect(source).toContain('回饋良好');
    expect(source).toContain('localStorage');
    expect(source).toContain('sessionStorage');
    expect(source).toContain('analytics');
    expect(source).toContain('no API');
    expect(source).toContain('migration');

    expect(source).toContain('phase-288-my-polls-empty-state-copy-polish.test.ts');
    expect(source).toContain('phase-288-my-polls-empty-state-copy-polish-doc.test.ts');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 288');
    expect(readme).toContain(PHASE_288_DOC);
    expect(readme).toContain('Phase 289 blockers: none identified');
  });
});
