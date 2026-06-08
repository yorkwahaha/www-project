import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

const FORBIDDEN_COPY =
  /gender|性別|exact birthday|精確生日|full date of birth|完整出生日|address|地址|GPS|geocode|precise location|精準位置/i;

const PUBLIC_COPY_FILES = [
  'public/profile.html',
  'public/faq.html',
  'public/frontend/profile-page.js',
  'public/frontend/public-mvp-ui.js',
  'public/frontend/policy-ui-placeholders.js',
];

async function loadPolicyUiModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/policy-ui-placeholders.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 67 public profile eligibility UX copy guard', () => {
  it('keeps forbidden demographic/location fields out of public profile/vote copy files', async () => {
    for (const relativePath of PUBLIC_COPY_FILES) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toMatch(FORBIDDEN_COPY);
    }
  });

  it('maps vote denials to fixed neutral frontend copy without option hints', async () => {
    const { messageForVoteSubmitFailure } = await import(
      pathToFileURL(join(process.cwd(), 'public/frontend/public-mvp-ui.js')).href
    );
    const { POLICY_UI_COPY } = await loadPolicyUiModule();

    const fixed = POLICY_UI_COPY.eligibilityIneligible;
    expect(fixed).toBe(
      '目前無法完成這次投票。請確認已登入並完成必要的個人資料後再試；若問題持續，請稍後再試。',
    );
    expect(fixed).not.toMatch(/option_index|option_id|選項/);
    expect(fixed).not.toMatch(/符合資格|不符合資格/);

    expect(
      messageForVoteSubmitFailure({
        status: 403,
        errorCode: 'POLL_FORBIDDEN',
        message: 'Official Vote requires an eligible official-trust user.',
      }),
    ).toBe(POLICY_UI_COPY.eligibilityIneligible);

    expect(
      messageForVoteSubmitFailure({
        status: 403,
        errorCode: 'PROFILE_INELIGIBLE',
        message: 'any backend detail',
      }),
    ).toBe(POLICY_UI_COPY.eligibilityIneligible);
  });

  it('describes live vote guidance with profile link, not "not yet open"', async () => {
    const source = await readFile(
      join(process.cwd(), 'public/frontend/policy-ui-placeholders.js'),
      'utf8',
    );

    expect(source).toContain('正式投票提醒');
    expect(source).toContain("profileLink.href = '/profile'");
    expect(source).toContain('profileHelpFields');
    expect(source).not.toContain('真實資格判斷尚未開放');
    expect(source).not.toMatch(/符合資格|不符合資格/);
    expect(source).not.toMatch(FORBIDDEN_COPY);
  });

  it('keeps ineligible mock vote message aligned with fixed policy copy', async () => {
    const { applyVotePageUiMockState, POLICY_UI_COPY } = await loadPolicyUiModule();
    const message = { textContent: '' };

    applyVotePageUiMockState({
      mockState: 'ineligible',
      form: null,
      policyPanels: null,
      message,
      title: null,
    });

    expect(message.textContent).toBe(POLICY_UI_COPY.eligibilityIneligible);
    expect(message.textContent).not.toMatch(/option_index|option_id/);
  });
});
