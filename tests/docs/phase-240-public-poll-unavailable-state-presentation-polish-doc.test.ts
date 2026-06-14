import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_240_DOC =
  'docs/www-project-phase-240-public-poll-unavailable-state-presentation-polish-v1.md';

describe('Phase 240 public poll unavailable state presentation polish doc', () => {
  it('documents scope, layout contract, boundaries, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_240_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 240');
    expect(source).toContain('Public Poll Unavailable State Presentation Polish');
    expect(source).toContain('3860ad7');
    expect(source).toContain('public-unavailable-state.js');

    for (const token of [
      'PUBLIC_UNAVAILABLE_STATE_LAYOUT_ORDER',
      'renderPublicEmptyStatePanel',
      'renderPublicLoadFailurePanel',
      'renderPublicUnavailableStatusBlock',
      'renderPublicInlineErrorNote',
      'resolvePublicErrorUserMessage',
      'mvp-public-empty-state',
      'mvp-public-load-failure',
      'explore-page.js',
      'my-polls-page.js',
      'result-page.js',
      'vote-page.js',
      'collecting',
      'cancelled',
      'unpublished',
      'foreign `error.message`',
      'Raw Option Linkage Ban',
      'Official Vote transaction order',
      'vote-by-index',
      'eligibility-before-option-resolve',
      'result visibility',
      'lifecycle state machine',
      'quality_badge',
      'presentation-only',
      'migrate:check',
      'smoke:public:local',
      'phase-240-public-poll-unavailable-state-presentation-polish.test.ts',
    ]) {
      expect(source).toContain(token);
    }

    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 240');
    expect(readme).toContain(PHASE_240_DOC);
    expect(readme).toContain('Public poll unavailable state presentation polish');
  });
});
