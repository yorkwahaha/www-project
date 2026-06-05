import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const FORBIDDEN_UI_COPY =
  /gender|性別|exact birthday|精確生日|full date of birth|完整出生日|\baddress\b|GPS|geocode|precise location|精準位置/i;

const PUBLIC_UI_FILES = [
  'public/index.html',
  'public/profile.html',
  'public/faq.html',
  'public/my-polls.html',
  'public/frontend/profile-page.js',
  'public/frontend/public-mvp-ui.js',
  'public/frontend/policy-ui-placeholders.js',
];

describe('Phase 68–69 public demo copy guard', () => {
  for (const relativePath of PUBLIC_UI_FILES) {
    it(`keeps forbidden profile fields out of ${relativePath}`, async () => {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toMatch(FORBIDDEN_UI_COPY);
    });
  }

  it('documents creator_session vs X-User-Id and production auth later in README', async () => {
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(readme).toMatch(/Phase 69/i);
    expect(readme).toMatch(/Phase 68/i);
    expect(readme).toContain('creator_session');
    expect(readme).toMatch(/\/creator\/\*/);
    expect(readme).toMatch(/X-User-Id/i);
    expect(readme).toMatch(/production user-auth wiring later/i);
    expect(readme).toContain('§3.10');
    expect(readme).toContain('phase-69-mvp-demo-release-readiness-handoff-v1.md');
    expect(readme).toMatch(/not.*production-ready|不是.*production|no.*production user login/i);
  });

  it('includes integrated manual QA and fixed ineligible copy in manual QA doc', async () => {
    const manualQa = await readFile(
      join(process.cwd(), 'docs/www-project-public-mvp-manual-qa-v1.md'),
      'utf8',
    );

    expect(manualQa).toContain('### 3.10');
    expect(manualQa).toContain('creator_session');
    expect(manualQa).toContain('/profile');
    expect(manualQa).toContain('你目前不符合此問卷的投票資格');
    expect(manualQa).toMatch(/Reference Answer.*不因.*profile/i);
    expect(manualQa).toContain('smoke:public:local');
    expect(manualQa).toContain('phase-69-mvp-demo-release-readiness-handoff-v1.md');
    expect(manualQa).toMatch(/production user-auth wiring later|MVP.*X-User-Id/i);
  });

  it('indexes Phase 69 release readiness as the recommended tester entry', async () => {
    const phase69 = await readFile(
      join(
        process.cwd(),
        'docs/www-project-phase-69-mvp-demo-release-readiness-handoff-v1.md',
      ),
      'utf8',
    );

    expect(phase69).toMatch(/唯一建議入口|recommended tester entry/i);
    expect(phase69).toContain('creator_session');
    expect(phase69).toMatch(/不是.*user auth|只限.*\/creator/i);
    expect(phase69).toMatch(/不接.*profile eligibility/i);
    expect(phase69).toMatch(/production user-auth wiring later/i);
    expect(phase69).toMatch(/scheduler.*npm start|不在.*npm start/i);
  });

  it('explains profile fields in FAQ without collecting gender or precise location', async () => {
    const faq = await readFile(join(process.cwd(), 'public/faq.html'), 'utf8');

    expect(faq).toContain('/profile');
    expect(faq).toMatch(/出生年/);
    expect(faq).toMatch(/粗粒度/);
    expect(faq).toMatch(/僅.*出生年/);
    expect(faq).toMatch(/production user-auth wiring later/i);
    expect(faq).not.toMatch(FORBIDDEN_UI_COPY);
  });
});
