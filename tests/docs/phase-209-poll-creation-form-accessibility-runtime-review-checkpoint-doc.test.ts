import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_209_DOC =
  'docs/www-project-phase-209-poll-creation-form-accessibility-runtime-review-checkpoint-v1.md';

describe('Phase 209 poll creation form accessibility runtime review checkpoint doc', () => {
  it('documents review scope, Phase 208 delivery, conclusion, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_209_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 209');
    expect(source).toContain('Poll Creation Form Accessibility Runtime Review Checkpoint');
    expect(source).toContain('d8363b8');
    expect(source).toContain('Phase 208');

    expect(source).toContain('/polls/new');
    expect(source).toContain('create-poll-page');
    expect(source).toContain('public-mvp.css');
    expect(source).toContain('create-poll-page.js');
    expect(source).toContain('submitCreatePollDemo');
    expect(source).toContain('?live=1');
    expect(source).toContain('POST /creator/polls');
    expect(source).toContain('parseLiveApiMode');
    expect(source).toContain('ensureCreatorSessionForLiveMode');
    expect(source).toContain('positive_feedback');
    expect(source).toContain('回饋良好');
    expect(source).toContain('option_index');
    expect(source).toContain('localStorage');
    expect(source).toContain('sessionStorage');
    expect(source).toContain('APPROVED');
    expect(source).toContain('No runtime');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('smoke:public:local');

    expect(source).toContain(
      'phase-209-poll-creation-form-accessibility-runtime-review-checkpoint.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 209');
    expect(readme).toContain(PHASE_209_DOC);
    expect(readme).toContain('Poll creation form accessibility runtime review checkpoint');
  });
});
