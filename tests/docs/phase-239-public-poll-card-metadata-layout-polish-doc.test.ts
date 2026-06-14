import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_239_DOC =
  'docs/www-project-phase-239-public-poll-card-metadata-layout-polish-v1.md';

describe('Phase 239 public poll card metadata layout polish doc', () => {
  it('documents scope, layout contract, boundaries, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_239_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 239');
    expect(source).toContain('Public Poll Card Metadata Layout Polish');
    expect(source).toContain('61d8314');
    expect(source).toContain('public-poll-card.js');
    expect(source).toContain('explore-page.js');
    expect(source).toContain('my-polls-page.js');
    expect(source).toContain('public/index.html');
    expect(source).toContain('public/my-polls.html');
    expect(source).toContain('public-mvp.css');

    for (const token of [
      'PUBLIC_POLL_CARD_METADATA_LAYOUT_ORDER',
      'mvp-poll-card-status-row',
      'mvp-poll-card-meta',
      'mvp-poll-card-footer',
      'title → status row → meta',
      'quality_badge',
      'positive_feedback',
      '回饋良好',
      'presentation-only',
      'GET /polls/feed',
      'GET /creator/polls',
      'closes_at',
      'published_display',
      'Raw Option Linkage Ban',
      'Official Vote transaction order',
      'vote-by-index',
      'eligibility-before-option-resolve',
      'UserAuthResolver',
      'No API behavior',
      'No migration',
      'migrate:check',
      'smoke:public:local',
      'phase-239-public-poll-card-metadata-layout-polish.test.ts',
    ]) {
      expect(source).toContain(token);
    }

    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 239');
    expect(readme).toContain(PHASE_239_DOC);
    expect(readme).toContain('Public poll card metadata layout polish');
  });
});
