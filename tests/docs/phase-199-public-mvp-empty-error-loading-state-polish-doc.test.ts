import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_199_DOC =
  'docs/www-project-phase-199-public-mvp-empty-error-loading-state-polish-v1.md';

describe('Phase 199 public MVP empty / error / loading state polish doc', () => {
  it('documents polish scope, surfaces, rules, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_199_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 199');
    expect(source).toContain('Empty / Error / Loading State Polish');
    expect(source).toContain('Phase 198');

    for (const surface of [
      '/explore',
      '/vote/:pollId',
      '/results/:pollId',
      '/my-polls',
      '/profile',
    ]) {
      expect(source).toContain(surface);
    }

    expect(source).toContain('PUBLIC_PENDING_USER_MESSAGES');
    expect(source).toContain('PUBLIC_LOAD_FAILURE_USER_MESSAGES');
    expect(source).toContain('renderPublicInlineErrorNote');
    expect(source).toContain('mvp-error-panel');
    expect(source).toContain('回饋良好');
    expect(source).toContain('quality_badge');
    expect(source).toContain('No API behavior');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('smoke:public:local');
    expect(source).toContain(
      'phase-199-public-mvp-empty-error-loading-state-polish.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 199');
    expect(readme).toContain(PHASE_199_DOC);
    expect(readme).toContain('empty / error / loading state polish');
  });
});
