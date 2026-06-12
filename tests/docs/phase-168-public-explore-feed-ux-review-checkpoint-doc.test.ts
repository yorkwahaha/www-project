import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_168_DOC =
  'docs/www-project-phase-168-public-explore-feed-ux-review-checkpoint-v1.md';

describe('Phase 168 public explore feed UX review checkpoint doc', () => {
  it('documents checkpoint scope and preserved boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_168_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 168');
    expect(source).toContain('Public Explore Feed UX Review');
    expect(source).toContain('Phase 167');
    expect(source).toContain('Phase 118');
    expect(source).toContain('Phase 116');
    expect(source).toContain('/explore');
    expect(source).toContain('GET /polls/feed');
    expect(source).toContain('display-safe');
    expect(source).toContain('EXPLORE_FEED_ALLOWED_ITEM_KEYS');
    expect(source).toContain('isExploreFeedItemSafe');
    expect(source).toContain('isExploreFeedPayloadSafe');
    expect(source).toContain('freshness-only');
    expect(source).toContain('data-explore-feed="freshness-only"');
    expect(source).toContain('data-static-examples="true"');
    expect(source).toContain('vote counts');
    expect(source).toContain('result previews');
    expect(source).toContain('voter state');
    expect(source).toContain('eligibility state');
    expect(source).toContain('personalized recommendations');
    expect(source).toContain('must not echo backend payload');
    expect(source).toContain('EXPLORE_LOAD_FAILURE_MESSAGE');
    expect(source).toContain('EXPLORE_LOAD_MORE_FAILURE_MESSAGE');
    expect(source).toContain('EXPLORE_FEED_LOADING_MESSAGE');
    expect(source).toContain('Reference Answer');
    expect(source).toContain('UserAuthResolver');
    expect(source).toContain('policy-ui-placeholders.js');
    expect(source).toContain('HELP_COPY');
    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('Vote-by-index body remains `{ option_index }` only');
    expect(source).toContain('Official Vote transaction order unchanged');
    expect(source).toContain('smoke:public:local');
    expect(source).toContain(
      'phase-168-public-explore-feed-ux-review-checkpoint.test.ts',
    );
    expect(source).toContain(
      'phase-118-explore-page-runtime-review-checkpoint.test.ts',
    );
    expect(source).toContain('explore-page.test.ts');

    expect(readme).toContain('Phase 168');
    expect(readme).toContain(PHASE_168_DOC);
    expect(readme).toContain('Public explore feed UX review checkpoint');
  });
});
