import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_285_DOC =
  'docs/www-project-phase-285-public-explore-feed-empty-state-copy-polish-v1.md';

describe('Phase 285 public explore feed empty state copy polish doc', () => {
  it('documents purpose, copy changes, scope, and boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_285_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 285');
    expect(source).toContain('Public Explore Feed Empty State Copy Polish');
    expect(source).toContain('b0cd39c');
    expect(source).toContain('BL-282-07');
    expect(source).toContain('presentation-only');

    expect(source).toContain('PUBLIC_EXPLORE_EMPTY_MESSAGE');
    expect(source).toContain('PUBLIC_EXPLORE_EMPTY_SUMMARY');
    expect(source).toContain('目前沒有可瀏覽的公開問卷。');
    expect(source).toContain('請稍後再回來看看，或建立一則新問卷。');
    expect(source).toContain('PUBLIC_EXPLORE_EMPTY_CTA_LABEL');
    expect(source).toContain('建立問卷');
    expect(source).toContain('/polls/new?live=1');

    for (const unchanged of [
      '載入探索列表中，請稍候。',
      '目前無法載入探索列表，請稍後再試。',
      '目前無法載入更多問卷，請稍後再試。',
      'GET /polls/feed',
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

    expect(source).toContain(
      'phase-285-public-explore-feed-empty-state-copy-polish.test.ts',
    );
    expect(source).toContain(
      'phase-285-public-explore-feed-empty-state-copy-polish-doc.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 285');
    expect(readme).toContain(PHASE_285_DOC);
    expect(readme).toContain('BL-282-07');
    expect(readme).toContain('Phase 286 blockers: none identified');
  });
});
