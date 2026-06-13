import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_200_DOC =
  'docs/www-project-phase-200-public-mvp-state-copy-runtime-review-checkpoint-v1.md';

describe('Phase 200 public MVP state copy runtime review checkpoint doc', () => {
  it('documents review scope, Phase 199 delivery, conclusion, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_200_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 200');
    expect(source).toContain('Public MVP State Copy Runtime Review Checkpoint');
    expect(source).toContain('fece1b6');
    expect(source).toContain('Phase 199');

    for (const surface of [
      '/explore',
      '/vote/:pollId',
      '/results/:pollId',
      '/my-polls',
      '/profile',
    ]) {
      expect(source).toContain(surface);
    }

    for (const token of [
      'PUBLIC_PENDING_USER_MESSAGES',
      'PUBLIC_LOAD_FAILURE_USER_MESSAGES',
      'PUBLIC_PROFILE_PAGE_LOADING_MESSAGE',
      'PUBLIC_VOTE_PAGE_LOAD_ERROR_TITLE',
      'PUBLIC_RESULTS_PAGE_LOAD_ERROR_TITLE',
      'renderPublicInlineErrorNote',
      'result-page.js',
      'mvp-error-panel',
      'quality-feedback-badge.js',
      'positive_feedback',
      '回饋良好',
      'localStorage',
      'sessionStorage',
      'APPROVED',
      'No runtime',
      'Raw Option Linkage Ban',
      'smoke:public:local',
    ]) {
      expect(source).toContain(token);
    }

    expect(source).toContain('public/frontend/result-page.js');
    expect(source).toMatch(/not `results-page\.js`/);
    expect(source).toContain(
      'phase-200-public-mvp-state-copy-runtime-review-checkpoint.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 200');
    expect(readme).toContain(PHASE_200_DOC);
    expect(readme).toContain('Public MVP state copy runtime review checkpoint');
  });
});
