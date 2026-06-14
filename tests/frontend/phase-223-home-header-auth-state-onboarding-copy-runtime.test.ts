import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_223_MODULES = [
  'public/frontend/public-mvp-ui.js',
  'public/frontend/auth-state-copy.js',
  'public/frontend/public-mvp-home.js',
  'public/frontend/profile-completion-prompt.js',
  'public/frontend/public-mvp-layout.js',
  'public/frontend/registration-page.js',
] as const;

const FORBIDDEN_ELIGIBILITY_OUTCOME =
  /你符合資格|你不符合資格|已投過票|可以投票|一定能投票|can_vote|age_passed|region_passed/i;

const FORBIDDEN_DEBUG_LEAKAGE =
  /request_id|requestId|option_id|trace_id|traceId|stack trace|internal code|error_code/i;

const FORBIDDEN_STORAGE = /localStorage|sessionStorage|document\.cookie|Set-Cookie/i;

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 223 home header auth state onboarding copy runtime', () => {
  it('documents Phase 223 in README', async () => {
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');
    expect(readme).toContain('Phase 223');
    expect(readme).toContain(
      'docs/www-project-phase-223-home-header-auth-state-onboarding-copy-runtime-v1.md',
    );
  });

  it('centralizes auth-state onboarding copy in public-mvp-ui allowlist', async () => {
    const ui = await loadModule('public/frontend/public-mvp-ui.js');
    const auth = await loadModule('public/frontend/auth-state-copy.js');

    expect(ui.PUBLIC_AUTH_STATE_ONBOARDING_MESSAGES).toContain(
      ui.PUBLIC_AUTH_GUEST_CHIP_TITLE,
    );
    expect(ui.PUBLIC_AUTH_STATE_ONBOARDING_MESSAGES).toContain(
      ui.PUBLIC_AUTH_BANNER_GUEST_BODY,
    );
    expect(ui.PUBLIC_AUTH_BANNER_GUEST_BODY).toContain('不會自動登入');
    expect(ui.PUBLIC_AUTH_BANNER_GUEST_BODY).toContain('會拒絕存取');
    expect(ui.PUBLIC_AUTH_BANNER_GUEST_BODY).not.toMatch(/fail closed/i);
    expect(auth.AUTH_STATE_COPY.guestChipTitle).toBe(ui.PUBLIC_AUTH_GUEST_CHIP_TITLE);
    expect(auth.AUTH_STATE_COPY.bannerGuestBody).toBe(ui.PUBLIC_AUTH_BANNER_GUEST_BODY);
  });

  it('wires homepage onboarding notes from frontend-owned constants', async () => {
    const ui = await loadModule('public/frontend/public-mvp-ui.js');
    const home = await loadModule('public/frontend/public-mvp-home.js');
    const documentObject = {
      getElementById(id: string) {
        if (id === 'home-sample-polls-section-note') {
          return { replaceChildren: vi.fn(), append: vi.fn() };
        }
        if (id === 'home-static-examples-footer-note') {
          return { replaceChildren: vi.fn(), append: vi.fn() };
        }
        if (id === 'home-account-flow-note') {
          return { replaceChildren: vi.fn(), append: vi.fn() };
        }
        if (id === 'home-hero-lead') {
          return { textContent: '' };
        }
        return null;
      },
      querySelector: () => null,
      querySelectorAll: () => [],
      createElement: (tag: string) => {
        const element: Record<string, unknown> = {
          href: '',
          textContent: '',
        };
        if (tag === 'a') {
          element.append = vi.fn();
        }
        if (tag === 'code') {
          element.textContent = '';
        }
        return element;
      },
      createTextNode: (text: string) => ({ text }),
    };

    home.syncHomePageOnboardingCopy(documentObject);
    expect(ui.PUBLIC_HOME_ACCOUNT_FLOW_REGISTRATION_NOTE).toContain('不會自動登入');
    expect(ui.PUBLIC_HOME_SAMPLE_POLLS_SECTION_NOTE).toContain('靜態範例');
    expect(ui.PUBLIC_HOME_STATIC_EXAMPLES_FOOTER_NOTE).toContain('常見問題');
  });

  it('keeps profile-completion prompt aligned with allowed profile concepts', async () => {
    const ui = await loadModule('public/frontend/public-mvp-ui.js');
    const prompt = await loadModule('public/frontend/profile-completion-prompt.js');

    expect(prompt.PROFILE_COMPLETION_PROMPT_MESSAGE).toBe(
      ui.PUBLIC_PROFILE_COMPLETION_PROMPT_HINT,
    );
    expect(ui.PUBLIC_PROFILE_COMPLETION_PROMPT_HINT).toContain('出生年月');
    expect(ui.PUBLIC_PROFILE_COMPLETION_PROMPT_HINT).toContain('居住地區');
    expect(ui.PUBLIC_PROFILE_COMPLETION_PROMPT_HINT).toContain('不代表你一定符合或不符合');
    expect(ui.PUBLIC_VOTE_PRE_VOTE_INCOMPLETE_PROFILE_HINT).toBe(
      ui.PUBLIC_PROFILE_COMPLETION_PROMPT_HINT,
    );
    expect(ui.PUBLIC_PROFILE_COMPLETION_PROMPT_HINT).not.toMatch(
      FORBIDDEN_ELIGIBILITY_OUTCOME,
    );
  });

  it('keeps registration flow unchanged without auto-login or GET /users/me', async () => {
    const registration = await loadModule('public/frontend/registration-page.js');
    const fetchCalls: string[] = [];
    const fetchImpl = vi.fn(async (url: string) => {
      fetchCalls.push(String(url));
      return { status: 201 };
    });

    await registration.submitRegistrationRequest({
      profile: {
        display_name: 'Copy Runtime User',
        birth_year_month: '1998-07',
        residential_region: 'TW-TPE',
      },
      credential: 'proof',
      fetchImpl,
    });

    expect(fetchCalls).toEqual(['/registration']);
  });

  it('keeps phase 223 modules free of forbidden debug and storage patterns', async () => {
    for (const relativePath of PHASE_223_MODULES) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toMatch(FORBIDDEN_DEBUG_LEAKAGE);
      expect(source, relativePath).not.toMatch(FORBIDDEN_STORAGE);
      expect(source, relativePath).not.toMatch(FORBIDDEN_ELIGIBILITY_OUTCOME);
    }
  });

  it('keeps quality_badge presentation-only and vote-by-index body unchanged', async () => {
    const votePage = await loadModule('public/frontend/vote-page.js');
    const badge = await loadModule('public/frontend/quality-feedback-badge.js');
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 201,
      json: async () => ({
        vote_token: 'secret-token',
        option_id: 'secret-option',
        shard_id: 7,
      }),
    }));

    await votePage.submitVoteByIndex({
      pollId: '11111111-1111-4111-8111-111111111111',
      optionIndex: 1,
      userId: '44444444-4444-4444-8444-444444444444',
      fetchImpl,
    });

    const body = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body));
    expect(body).toEqual({ option_index: 1 });
    expect(badge.QUALITY_FEEDBACK_BADGE_LABEL).toBe('回饋良好');
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: null })).toBe(false);
  });
});
