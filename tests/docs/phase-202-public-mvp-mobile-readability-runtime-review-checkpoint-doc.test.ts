import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_202_DOC =
  'docs/www-project-phase-202-public-mvp-mobile-readability-runtime-review-checkpoint-v1.md';

describe('Phase 202 public MVP mobile readability runtime review checkpoint doc', () => {
  it('documents review scope, Phase 201 delivery, conclusion, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_202_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 202');
    expect(source).toContain('Mobile Readability Runtime Review Checkpoint');
    expect(source).toContain('dcb4e81');
    expect(source).toContain('Phase 201');

    for (const surface of ['/explore', '/vote/:pollId', '/results/:pollId']) {
      expect(source).toContain(surface);
    }

    for (const token of [
      'explore-page',
      'vote-page',
      'results-page',
      'results-page-demo-intro',
      'public-mvp.css',
      'explore-page.js',
      'vote-page.js',
      'result-page.js',
      'quality-feedback-badge.js',
      'renderResultDisplay',
      'positive_feedback',
      '回饋良好',
      'localStorage',
      'sessionStorage',
      'APPROVED',
      'No runtime',
      'Raw Option Linkage Ban',
      'option_index',
      'smoke:public:local',
    ]) {
      expect(source).toContain(token);
    }

    expect(source).toContain('public/frontend/result-page.js');
    expect(source).toMatch(/not `results-page\.js`/);
    expect(source).toContain(
      'phase-202-public-mvp-mobile-readability-runtime-review-checkpoint.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 202');
    expect(readme).toContain(PHASE_202_DOC);
    expect(readme).toContain('mobile readability runtime review checkpoint');
  });
});
