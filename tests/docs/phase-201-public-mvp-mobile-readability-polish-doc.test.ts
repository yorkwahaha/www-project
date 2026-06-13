import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_201_DOC =
  'docs/www-project-phase-201-public-mvp-mobile-readability-polish-v1.md';

describe('Phase 201 public MVP mobile readability polish doc', () => {
  it('documents polish scope, surfaces, rules, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_201_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 201');
    expect(source).toContain('Mobile Readability Polish');
    expect(source).toContain('Phase 200');

    for (const surface of ['/explore', '/vote/:pollId', '/results/:pollId']) {
      expect(source).toContain(surface);
    }

    expect(source).toContain('explore-page');
    expect(source).toContain('vote-page');
    expect(source).toContain('results-page');
    expect(source).toContain('public-mvp.css');
    expect(source).toContain('回饋良好');
    expect(source).toContain('quality_badge');
    expect(source).toContain('No API behavior');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('smoke:public:local');
    expect(source).toContain(
      'phase-201-public-mvp-mobile-readability-polish.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 201');
    expect(readme).toContain(PHASE_201_DOC);
    expect(readme).toContain('mobile readability');
  });
});
