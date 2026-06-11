import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_143_DOC =
  'docs/www-project-phase-143-public-cta-link-label-consistency-polish-v1.md';

describe('Phase 143 public CTA link label consistency polish doc', () => {
  it('documents polish scope, CTA rules, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_143_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 143');
    expect(source).toContain('Public CTA / Link Label Consistency');
    expect(source).toContain('PUBLIC_CTA_LINK_LABELS');
    expect(source).toContain('/login');
    expect(source).toContain('/registration');
    expect(source).toContain('/profile');
    expect(source).toContain('/vote/:id');
    expect(source).toContain('/results/:id');
    expect(source).toContain('/explore');
    expect(source).toContain('/my-polls?live=1');
    expect(source).toContain('/polls/new');
    expect(source).toContain('auth-state-copy');
    expect(source).toContain('poll-lifecycle-controls');
    expect(source).toContain('Must not echo raw backend payloads');
    expect(source).toContain('No runtime API behavior');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain(
      'phase-143-public-cta-link-label-consistency-polish.test.ts',
    );
    expect(source).toContain('smoke:public:local');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 143');
    expect(readme).toContain(PHASE_143_DOC);
    expect(readme).toContain('Public CTA / link label');
  });
});
