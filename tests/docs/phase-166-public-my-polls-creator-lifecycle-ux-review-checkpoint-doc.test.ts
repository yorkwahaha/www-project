import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_166_DOC =
  'docs/www-project-phase-166-public-my-polls-creator-lifecycle-ux-review-checkpoint-v1.md';

describe('Phase 166 public my-polls creator lifecycle UX review checkpoint doc', () => {
  it('documents checkpoint scope and preserved boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_166_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 166');
    expect(source).toContain('Public My Polls / Creator Lifecycle UX Review');
    expect(source).toContain('Phase 165');
    expect(source).toContain('Phase 121');
    expect(source).toContain('Phase 130');
    expect(source).toContain('/my-polls');
    expect(source).toContain('/my-polls?live=1');
    expect(source).toContain('parseLiveApiMode');
    expect(source).toContain('data-mock-dashboard');
    expect(source).toContain('data-live-owned-list');
    expect(source).toContain('prepareMyPollsLiveSession');
    expect(source).toContain('GET /creator/polls');
    expect(source).toContain('`creator_session` must not become production public identity');
    expect(source).toContain('CREATOR_OWNED_POLL_ALLOWED_KEYS');
    expect(source).toContain('vote counts, result previews, voter state');
    expect(source).toContain('lifecycleActionsForState');
    expect(source).toContain('cancel');
    expect(source).toContain('close');
    expect(source).toContain('unpublish');
    expect(source).toContain('?creator=1');
    expect(source).toContain('MY_POLLS_LOAD_FAILURE_MESSAGE');
    expect(source).toContain('MY_POLLS_SIGN_IN_REQUIRED_MESSAGE');
    expect(source).toContain('must not echo backend payload');
    expect(source).toContain('policy-ui-placeholders.js');
    expect(source).toContain('HELP_COPY');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('Vote-by-index body remains `{ option_index }` only');
    expect(source).toContain('Official Vote transaction order unchanged');
    expect(source).toContain('smoke:public:local');
    expect(source).toContain(
      'phase-166-public-my-polls-creator-lifecycle-ux-review-checkpoint.test.ts',
    );
    expect(source).toContain(
      'phase-121-my-polls-runtime-review-checkpoint.test.ts',
    );
    expect(source).toContain(
      'phase-130-creator-lifecycle-controls-runtime-review-checkpoint.test.ts',
    );

    expect(readme).toContain('Phase 166');
    expect(readme).toContain(PHASE_166_DOC);
    expect(readme).toContain('Public my-polls creator lifecycle UX review checkpoint');
  });
});
