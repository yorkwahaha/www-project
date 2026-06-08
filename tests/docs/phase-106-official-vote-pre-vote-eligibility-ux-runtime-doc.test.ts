import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_106_DOC =
  'docs/www-project-phase-106-official-vote-pre-vote-eligibility-ux-runtime-v1.md';

describe('Phase 106 official vote pre-vote eligibility UX runtime doc', () => {
  it('documents runtime behavior and preserved vote/auth boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_106_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 106');
    expect(source).toContain('Official Vote Pre-vote Eligibility UX Runtime');
    expect(source).toContain('official-vote-pre-vote-hints.js');
    expect(source).toContain('vote-page.js');

    expect(source).toContain('Anonymous visitor');
    expect(source).toContain('/login');
    expect(source).toContain('Does not call `GET /users/me/profile`');
    expect(source).toContain('Signed-in visitor with incomplete profile');
    expect(source).toContain("credentials: 'same-origin'");
    expect(source).toContain('birth_year_month === null');
    expect(source).toContain('residential_region === null');
    expect(source).toContain('/profile');
    expect(source).toContain('Signed-in visitor with complete profile');
    expect(source).toContain('does not guarantee a vote can be counted');

    expect(source).toContain('Vote Submit Copy');
    expect(source).toContain('目前無法完成這次投票');
    expect(source).toContain('Vote success remains generic');
    expect(source).toContain('投票已送出，感謝參與');

    expect(source).toContain('Raw Option Linkage Ban');
    expect(source).toContain('does not call vote APIs');
    expect(source).toContain('does not resolve `option_index` to `option_id`');
    expect(source).toContain('does not read or store the selected option');

    expect(source).toContain('DB schema');
    expect(source).toContain('migrations');
    expect(source).toContain('UserAuthResolver');
    expect(source).toContain('Official Vote transaction order');
    expect(source).toContain('vote-by-index` eligibility before option resolve');
    expect(source).toContain('Reference Answer');
    expect(source).toContain('vote token schema');
    expect(source).toContain('counter schema');
    expect(source).toContain('demographic breakdowns');

    expect(source).toContain('`/registration` remains unchanged');
    expect(source).toContain('data-login-state-read="disabled"');

    expect(readme).toContain('Phase 106');
    expect(readme).toContain(PHASE_106_DOC);
    expect(readme).toContain('Official Vote pre-vote eligibility UX runtime');
  });
});
