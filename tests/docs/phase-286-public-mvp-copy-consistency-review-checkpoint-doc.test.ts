import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_286_DOC =
  'docs/www-project-phase-286-public-mvp-copy-consistency-review-checkpoint-v1.md';

describe('Phase 286 public MVP copy consistency review checkpoint doc', () => {
  it('documents purpose, review findings, scope, and boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_286_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 286');
    expect(source).toContain('Public MVP Copy Consistency Review Checkpoint');
    expect(source).toContain('c28a7cf');
    expect(source).toContain('BL-282-02');
    expect(source).toContain('review checkpoint');

    for (const surface of [
      '/',
      '/explore',
      '/login',
      '/registration',
      '/profile',
      '/vote/:id',
      '/results/:id',
      '/my-polls',
      '/faq',
    ]) {
      expect(source).toContain(surface);
    }

    for (const token of [
      'public-page-copy.js',
      'public-mvp-ui.js',
      'official-vote-pre-vote-hints.js',
      'quality-feedback-badge.js',
      'result-page.js',
      'explore-page.js',
      'registration-page.js',
      '不會自動登入',
      '瀏覽器工作階段',
      '不表示可保證',
      '不代表你一定符合或不符合',
      'PUBLIC_EXPLORE_EMPTY_MESSAGE',
      '目前沒有可瀏覽的公開問卷。',
      '請稍後再回來看看，或建立一則新問卷。',
      'positive_feedback',
      '回饋良好',
      'hidden aggregate',
      'collecting',
      'POST /registration',
      'option_index',
      'eligibility-before-option-resolve',
      'Raw Option Linkage Ban',
      'Official Vote transaction order',
      'UserAuthResolver',
      'localStorage',
      'sessionStorage',
      'analytics',
      'no runtime',
      'APPROVED',
      'Phase 287 blockers: none identified',
      'phase-286-public-mvp-copy-consistency-review-checkpoint.test.ts',
      'phase-286-public-mvp-copy-consistency-review-checkpoint-doc.test.ts',
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    ]) {
      expect(source).toContain(token);
    }

    expect(readme).toContain('Phase 286');
    expect(readme).toContain(PHASE_286_DOC);
    expect(readme).toContain('BL-282-02');
    expect(readme).toContain('Phase 287 blockers: none identified');
  });
});
