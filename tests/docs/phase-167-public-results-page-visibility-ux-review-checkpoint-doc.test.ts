import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_167_DOC =
  'docs/www-project-phase-167-public-results-page-visibility-ux-review-checkpoint-v1.md';

describe('Phase 167 public results page visibility UX review checkpoint doc', () => {
  it('documents checkpoint scope and preserved boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_167_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 167');
    expect(source).toContain('Public Results Page Visibility UX Review');
    expect(source).toContain('Phase 166');
    expect(source).toContain('Phase 115');
    expect(source).toContain('Phase 131');
    expect(source).toContain('/results/:id');
    expect(source).toContain('?creator=1');
    expect(source).toContain('resolveResultRenderMode');
    expect(source).toContain('collecting');
    expect(source).toContain('cancelled');
    expect(source).toContain('unpublished');
    expect(source).toContain('revealed');
    expect(source).toContain('locked');
    expect(source).toContain('post_lock');
    expect(source).toContain('display-safe aggregate');
    expect(source).toContain('GET /polls/:pollId/results');
    expect(source).toContain('must not bypass public result visibility rules');
    expect(source).toContain('must not echo backend payload');
    expect(source).toContain('RESULTS_LOAD_FAILURE_MESSAGE');
    expect(source).toContain('RESULT_DISPLAY_REFRESH_FAILURE_MESSAGE');
    expect(source).toContain('Reference Answer');
    expect(source).toContain('UserAuthResolver');
    expect(source).toContain('policy-ui-placeholders.js');
    expect(source).toContain('HELP_COPY');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('Vote-by-index body remains `{ option_index }` only');
    expect(source).toContain('Official Vote transaction order unchanged');
    expect(source).toContain('smoke:public:local');
    expect(source).toContain(
      'phase-167-public-results-page-visibility-ux-review-checkpoint.test.ts',
    );
    expect(source).toContain(
      'phase-115-results-page-runtime-review-checkpoint.test.ts',
    );
    expect(source).toContain(
      'phase-131-creator-results-panel-runtime-review-checkpoint.test.ts',
    );

    expect(readme).toContain('Phase 167');
    expect(readme).toContain(PHASE_167_DOC);
    expect(readme).toContain('Public results page visibility UX review checkpoint');
  });
});
