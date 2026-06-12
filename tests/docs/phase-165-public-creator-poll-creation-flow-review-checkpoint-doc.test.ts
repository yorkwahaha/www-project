import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_165_DOC =
  'docs/www-project-phase-165-public-creator-poll-creation-flow-review-checkpoint-v1.md';

describe('Phase 165 public creator poll creation flow review checkpoint doc', () => {
  it('documents checkpoint scope and preserved boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_165_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 165');
    expect(source).toContain('Public Creator Poll Creation Flow Review');
    expect(source).toContain('Phase 164');
    expect(source).toContain('Phase 129');
    expect(source).toContain('/polls/new');
    expect(source).toContain('/polls/new?live=1');
    expect(source).toContain('parseLiveApiMode');
    expect(source).toContain('submitCreatePollDemo');
    expect(source).toContain('ensureCreatorSessionForLiveMode');
    expect(source).toContain('`creator_session` must not become production public identity');
    expect(source).toContain('UserAuthResolver');
    expect(source).toContain('POST /login/session');
    expect(source).toContain('GET /users/me');
    expect(source).toContain('profile/demographic fields');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('policy-ui-placeholders.js');
    expect(source).toContain('HELP_COPY');
    expect(source).toContain('lifecycleActionsForState');
    expect(source).toContain('目前無法建立問卷，請稍後再試。');
    expect(source).toContain('目前無法確認發起者身分，請稍後再試。');
    expect(source).toContain('Vote-by-index body remains `{ option_index }` only');
    expect(source).toContain('Official Vote transaction order unchanged');
    expect(source).toContain('smoke:public:local');
    expect(source).toContain(
      'phase-165-public-creator-poll-creation-flow-review-checkpoint.test.ts',
    );
    expect(source).toContain(
      'phase-129-creator-poll-creation-runtime-review-checkpoint.test.ts',
    );

    expect(readme).toContain('Phase 165');
    expect(readme).toContain(PHASE_165_DOC);
    expect(readme).toContain('Public creator poll creation flow review checkpoint');
  });
});
