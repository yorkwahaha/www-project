import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_128_DOC =
  'docs/www-project-phase-128-static-public-pages-copy-privacy-boundary-review-checkpoint-v1.md';

describe('Phase 128 static public pages copy privacy boundary review checkpoint doc', () => {
  it('documents the review checkpoint and preserved boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_128_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 128');
    expect(source).toContain('Static Public Pages Copy / Privacy Boundary Review Checkpoint');
    expect(source).toContain('Phase 67');
    expect(source).toContain('Phase 127');
    expect(source).toContain('No runtime, frontend behavior, API behavior');

    expect(source).toContain('creator visibility of individual vote choices');
    expect(source).toContain('發起者也不例外，無法查看中途統計');
    expect(source).toContain('collecting-period counts or result previews');
    expect(source).toContain('revealed / locked / post-lock aggregate result boundary');

    expect(source).toContain('demographic breakdown, ranking personalization, or analytics linkage');
    expect(source).toContain('不做公開統計分群展示');

    expect(source).toContain('credit score / points / rewards / paid promotion runtime');
    expect(source).toContain('草案');
    expect(source).toContain('尚未開放');

    expect(source).toContain('do not guarantee voting');
    expect(source).toContain('do not display or infer eligibility outcomes');
    expect(source).toContain('不會自動登入');

    expect(source).toContain('POST /login/session` session boundary');
    expect(source).toContain('data-static-examples="true"');
    expect(source).toContain('靜態範例');

    expect(source).toContain('Explore / My Polls / Results / Vote public copy');
    expect(source).toContain('creator_session` as local/demo creator flow only');
    expect(source).toContain('option_id');
    expect(source).toContain('Reference Answer remains disconnected');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain(
      'phase-128-static-public-pages-copy-privacy-boundary-review-checkpoint.test.ts',
    );
    expect(source).toContain('smoke:public:local');
    expect(source).toContain('Docker Desktop remains unavailable');
    expect(source).toContain(
      'I verified that no new logs, metrics, error payloads, APM traces, debug payloads, or analytics records capture option_id or link an option choice with a user, session, device, request, or traceable identifier.',
    );

    expect(readme).toContain('Phase 128');
    expect(readme).toContain(PHASE_128_DOC);
    expect(readme).toContain('Static public pages copy privacy boundary review checkpoint');
  });
});
