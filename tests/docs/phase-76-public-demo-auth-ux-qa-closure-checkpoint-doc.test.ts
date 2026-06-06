import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_76_DOC =
  'docs/www-project-phase-76-public-demo-auth-ux-qa-closure-checkpoint-v1.md';

describe('Phase 76 public demo auth UX QA closure checkpoint doc', () => {
  it('is docs/checkpoint only and documents Phase 70-75 boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_76_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(source).toContain('Phase 76');
    expect(source).toMatch(/僅.*docs|docs.*only|僅文件/i);
    expect(source).toMatch(/不改.*UserAuthResolver|UserAuthResolver.*不變/i);
    expect(source).toMatch(/無.*runtime|不改.*runtime|不改 frontend/i);

    expect(source).toContain('Phase 70');
    expect(source).toContain('Phase 71');
    expect(source).toContain('Phase 72');
    expect(source).toContain('Phase 73');
    expect(source).toContain('Phase 74');
    expect(source).toContain('Phase 75');

    expect(source).toContain('GET /');
    expect(source).toContain('/login');
    expect(source).toContain('/profile');
    expect(source).toContain('/polls/new?live=1');
    expect(source).toContain('/my-polls?live=1');
    expect(source).toContain('/vote/:pollId');
    expect(source).toContain('/results/:pollId');
    expect(source).toContain('/explore');

    expect(source).toContain('UserAuthResolver');
    expect(source).toContain('Authorization: Bearer');
    expect(source).toContain('USER_AUTH_CREDENTIALS_JSON');
    expect(source).toMatch(/正式登入尚未啟用|login submit.*尚未/i);
    expect(source).toMatch(/disabled UI shell|UI shell/i);
    expect(source).toContain('X-User-Id');
    expect(source).toMatch(/non-production|explicit non-production/i);
    expect(source).toContain('creator_session');
    expect(source).toMatch(/local\/demo|creator flow only/i);
    expect(source).toMatch(/Reference Answer.*未|尚未.*UserAuthResolver/i);
    expect(source).toMatch(/不接.*profile eligibility/i);

    expect(source).toContain('Official Vote');
    expect(source).toMatch(/transaction order.*不變|不變.*transaction order/i);
    expect(source).toMatch(/eligibility.*option resolve|option resolve.*之前/i);
    expect(source).toContain('vote-by-index');
    expect(source).toMatch(/Raw Option Linkage/i);
    expect(source).toContain('user_id + poll_id');
    expect(source).toContain('poll_id + option_id + shard_id');
    expect(source).toMatch(/demographic breakdown/i);
    expect(source).toMatch(/ranking personalization/i);
    expect(source).toMatch(/analytics linkage/i);
    expect(source).toMatch(/精準位置|precise location/i);

    expect(source).toContain('design-drafts/');
    expect(source).toContain('git diff --check');
    expect(source).toContain('npm run typecheck');
    expect(source).toContain('npm test');
    expect(source).toContain('npm run build');
    expect(source).toContain('smoke:public:local');

    expect(readme).toContain('Phase 76');
    expect(readme).toContain(PHASE_76_DOC);
  });
});
