import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_247_DOC =
  'docs/www-project-phase-247-public-share-link-runtime-review-checkpoint-v1.md';

describe('Phase 247 public share link runtime review checkpoint doc', () => {
  it('documents review scope, Phase 246 delivery, conclusion, and validation', async () => {
    const source = await readFile(join(process.cwd(), PHASE_247_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 247');
    expect(source).toContain('Public Share Link Runtime Review Checkpoint');
    expect(source).toContain('7138b6a');
    expect(source).toContain('Phase 246');

    expect(source).toContain('public-share-link-layout.js');
    expect(source).toContain('copyTextToClipboard');
    expect(source).toContain('PUBLIC_SHARE_LINK_ROW_LAYOUT_ORDER');
    expect(source).toContain('syncVotePageShareLinks');
    expect(source).toContain('syncResultsPageShareLinks');
    expect(source).toContain('mountCreatorOwnedPollShareLinks');
    expect(source).toContain('renderPollSharePanel');
    expect(source).toContain('vote-detail-share-links');
    expect(source).toContain('results-detail-share-links');
    expect(source).toContain('/vote/:pollId');
    expect(source).toContain('/results/:pollId');
    expect(source).toContain('/my-polls?live=1');

    expect(source).toContain('localStorage');
    expect(source).toContain('sessionStorage');
    expect(source).toContain('share token');
    expect(source).toContain('short link');
    expect(source).toContain('option_index');
    expect(source).toContain('server.ts');
    expect(source).toContain('smoke-public-local.mjs');
    expect(source).toContain('APPROVED');
    expect(source).toContain('No runtime change');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('smoke:public:local');

    expect(source).toContain(
      'phase-247-public-share-link-runtime-review-checkpoint.test.ts',
    );
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 247');
    expect(readme).toContain(PHASE_247_DOC);
    expect(readme).toContain('Public share link runtime review checkpoint');
  });
});
