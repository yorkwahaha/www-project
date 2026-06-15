import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_287_DOC =
  'docs/www-project-phase-287-login-account-flow-card-copy-polish-v1.md';

const NEW_ACCOUNT_FLOW_CARD_BODY =
  '註冊只建立帳號與個人資料欄位，不會自動登入，也不會建立瀏覽器工作階段。請用相同憑證登入後，頁首才會顯示帳號名稱。';

const OLD_ACCOUNT_FLOW_CARD_BODY =
  '註冊只建立帳號與個人資料欄位，不會自動登入。完成後請使用相同憑證到登入頁登入；登入才會在頁首顯示帳號名稱。';

const FORBIDDEN_STORAGE = /localStorage|sessionStorage|document\.cookie|Set-Cookie/i;

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 287 login account flow card copy polish', () => {
  it('defines shared account-flow card copy constant', async () => {
    const pageCopy = await loadModule('public/frontend/public-page-copy.js');
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const loginPage = await loadModule('public/frontend/login-page.js');

    expect(pageCopy.PUBLIC_LOGIN_ACCOUNT_FLOW_CARD_BODY).toBe(NEW_ACCOUNT_FLOW_CARD_BODY);
    expect(publicUi.PUBLIC_LOGIN_ACCOUNT_FLOW_CARD_BODY).toBe(NEW_ACCOUNT_FLOW_CARD_BODY);
    expect(loginPage.LOGIN_ACCOUNT_FLOW_CARD_BODY).toBe(NEW_ACCOUNT_FLOW_CARD_BODY);
    expect(publicUi.PUBLIC_AUTH_ACCOUNT_ONBOARDING_MESSAGES).toContain(
      NEW_ACCOUNT_FLOW_CARD_BODY,
    );
  });

  it('aligns login.html static fallback with runtime copy', async () => {
    const loginHtml = await readFile(join(process.cwd(), 'public/login.html'), 'utf8');

    expect(loginHtml).toContain('id="login-account-flow-card-body"');
    expect(loginHtml).toContain(NEW_ACCOUNT_FLOW_CARD_BODY);
    expect(loginHtml).toContain('帳號流程');
    expect(loginHtml).not.toContain(OLD_ACCOUNT_FLOW_CARD_BODY);
    expect(loginHtml).toContain('也不會建立瀏覽器工作階段');
  });

  it('syncs account-flow card body at runtime without changing other login copy', async () => {
    const loginPage = await loadModule('public/frontend/login-page.js');
    const accountFlowBody = { textContent: 'placeholder' };
    const primaryLead = { textContent: 'primary' };
    const secondaryLead = { textContent: 'secondary' };

    const documentObject = {
      getElementById(id: string) {
        if (id === 'login-account-flow-card-body') {
          return accountFlowBody;
        }
        if (id === 'login-lead-primary') {
          return primaryLead;
        }
        if (id === 'login-lead-secondary') {
          return secondaryLead;
        }
        return null;
      },
    };

    loginPage.syncLoginAccountFlowCardCopy(documentObject);
    expect(accountFlowBody.textContent).toBe(NEW_ACCOUNT_FLOW_CARD_BODY);
    expect(primaryLead.textContent).toBe('primary');
    expect(secondaryLead.textContent).toBe('secondary');
  });

  it('keeps login-page.js free of auth runtime drift', async () => {
    const loginSource = await readFile(
      join(process.cwd(), 'public/frontend/login-page.js'),
      'utf8',
    );

    expect(loginSource).toContain("fetchImpl('/login/session'");
    expect(loginSource).not.toContain("fetchImpl('/registration'");
    expect(loginSource).not.toContain("fetchImpl('/users/me'");
    expect(loginSource).not.toMatch(FORBIDDEN_STORAGE);
    expect(loginSource).not.toContain('Phase 287');
  });

  it('keeps registration and vote boundaries unchanged during copy polish', async () => {
    const registration = await loadModule('public/frontend/registration-page.js');
    const votePage = await loadModule('public/frontend/vote-page.js');
    const badge = await loadModule('public/frontend/quality-feedback-badge.js');
    const fetchCalls: string[] = [];
    const registrationFetch = vi.fn(async (url: string) => {
      fetchCalls.push(String(url));
      return { status: 201 };
    });

    await registration.submitRegistrationRequest({
      profile: {
        display_name: 'Login Card Copy User',
        birth_year_month: '1994-04',
        residential_region: 'TW-TPE',
      },
      credential: 'proof',
      fetchImpl: registrationFetch,
    });
    expect(fetchCalls).toEqual(['/registration']);

    const voteFetch = vi.fn(async () => ({ ok: true, status: 201, json: async () => ({}) }));
    await votePage.submitVoteByIndex({
      pollId: '11111111-1111-4111-8111-111111111111',
      optionIndex: 0,
      userId: '44444444-4444-4444-8444-444444444444',
      fetchImpl: voteFetch,
    });
    const voteBody = JSON.parse(String(voteFetch.mock.calls[0]?.[1]?.body));
    expect(voteBody).toEqual({ option_index: 0 });
    expect(badge.QUALITY_FEEDBACK_BADGE_LABEL).toBe('回饋良好');
  });

  it('documents Phase 287 implementation record exists', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_287_DOC), 'utf8');
    expect(doc).toContain('BL-286-01');
    expect(doc).toContain('PUBLIC_LOGIN_ACCOUNT_FLOW_CARD_BODY');
  });
});
