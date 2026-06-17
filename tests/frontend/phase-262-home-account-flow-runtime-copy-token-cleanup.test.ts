import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_262_DOC =
  'docs/www-project-phase-262-home-account-flow-runtime-copy-token-cleanup-v1.md';

const PUBLIC_PAGE_COPY = 'public/frontend/public-page-copy.js';
const PUBLIC_MVP_HOME = 'public/frontend/public-mvp-home.js';

const ENGINEER_TOKEN_MARKERS = ['creator_session', 'X-User-Id'] as const;

const FORBIDDEN_SIDE_EFFECTS =
  /\bfetch\s*\(|addEventListener|removeEventListener|localStorage|sessionStorage|document\.cookie|navigator\.sendBeacon|performance\.mark/i;

const FORBIDDEN_DOM_MUTATION =
  /document\.(getElementById|querySelector|createElement)|\.replaceChildren|\.append\(/;

const FORBIDDEN_ELIGIBILITY_OUTCOME =
  /你符合資格|你不符合資格|已投過票|可以投票|一定能投票|can_vote|age_passed|region_passed/i;

const FORBIDDEN_AUTO_LOGIN =
  /自動登入成功|註冊後已登入|registration.*Set-Cookie|註冊完成.*已登入/i;

function stripJsComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:\\])\/\/.*$/gm, '$1');
}

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 262 home account flow runtime copy token cleanup', () => {
  it('documents Phase 262 delivery in README and phase doc', async () => {
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');
    const doc = await readFile(join(process.cwd(), PHASE_262_DOC), 'utf8');

    expect(readme).toContain('Phase 262');
    expect(readme).toContain(PHASE_262_DOC);
    expect(doc).toContain('Phase 262');
    expect(doc).toContain('syncHomePageAccountFlowNote');
  });

  // Retired by Phase 301: the homepage account-flow note and its
  // syncHomePageAccountFlowNote runtime helper were removed when the home became
  // an ultra-minimal collecting-only swipe shell. This historical token-cleanup
  // checkpoint described the pre-Phase-301 home; current homepage assertions
  // live in tests/frontend/phase-301-home-swipe-card-visual-shell.test.ts.
  it.skip('removes engineer tokens from syncHomePageAccountFlowNote runtime source', async () => {
    const raw = await readFile(join(process.cwd(), PUBLIC_MVP_HOME), 'utf8');
    const source = stripJsComments(raw);

    expect(source).toContain('syncHomePageAccountFlowNote');
    for (const marker of ENGINEER_TOKEN_MARKERS) {
      expect(source, `public-mvp-home.js must not contain ${marker}`).not.toContain(marker);
    }
    expect(source).not.toContain('creatorSessionCode');
    expect(source).not.toContain('userIdCode');
    expect(source).toContain('PUBLIC_HOME_DEMO_CREATOR_SESSION_NOTE');
    expect(source).toContain('PUBLIC_HOME_DEMO_PROFILE_VOTE_NOTE');
  });

  // Retired by Phase 301 (homepage account-flow note removed — see phase-301 test).
  it.skip('builds homepage account flow note from user-facing PUBLIC_* constants', async () => {
    const ui = await loadModule('public/frontend/public-mvp-ui.js');
    const home = await loadModule(PUBLIC_MVP_HOME);
    const appended: unknown[] = [];

    const note = {
      replaceChildren: vi.fn(),
      append: (...nodes: unknown[]) => {
        appended.push(...nodes);
      },
    };

    const documentObject = {
      getElementById(id: string) {
        if (id === 'home-account-flow-note') {
          return note;
        }
        return null;
      },
      createElement: (tag: string) => {
        const element: Record<string, unknown> = { href: '', textContent: '' };
        if (tag === 'a') {
          element.append = vi.fn();
        }
        return element;
      },
      createTextNode: (text: string) => ({ text }),
    };

    home.syncHomePageAccountFlowNote(documentObject);

    const serialized = JSON.stringify(appended);
    for (const marker of ENGINEER_TOKEN_MARKERS) {
      expect(serialized).not.toContain(marker);
    }
    expect(ui.PUBLIC_HOME_ACCOUNT_FLOW_REGISTRATION_NOTE).toContain('不會自動登入');
    expect(serialized).toContain(ui.PUBLIC_HOME_ACCOUNT_FLOW_REGISTRATION_NOTE);
    expect(serialized).toContain(ui.PUBLIC_HOME_DEMO_CREATOR_SESSION_NOTE);
    expect(serialized).toContain(ui.PUBLIC_HOME_DEMO_PROFILE_VOTE_NOTE.replace(/^個人資料/, ''));
  });

  it('keeps registration copy without auto-login implication', async () => {
    const ui = await loadModule('public/frontend/public-mvp-ui.js');
    const registrationSource = await readFile(
      join(process.cwd(), 'public/frontend/registration-page.js'),
      'utf8',
    );

    expect(ui.PUBLIC_HOME_ACCOUNT_FLOW_REGISTRATION_NOTE).toContain('不會自動登入');
    expect(ui.PUBLIC_HOME_ACCOUNT_FLOW_REGISTRATION_NOTE).not.toMatch(FORBIDDEN_AUTO_LOGIN);
    expect(registrationSource).not.toMatch(FORBIDDEN_AUTO_LOGIN);
  });

  it('keeps public-page-copy.js constants-only and side-effect-free', async () => {
    const raw = await readFile(join(process.cwd(), PUBLIC_PAGE_COPY), 'utf8');
    const source = stripJsComments(raw);

    expect(source).toMatch(/^export const PUBLIC_/m);
    expect(source).not.toMatch(FORBIDDEN_SIDE_EFFECTS);
    expect(source).not.toMatch(FORBIDDEN_DOM_MUTATION);
    expect(source).not.toMatch(/\bexport function\b/);
    expect(source).not.toMatch(/\bexport async function\b/);
  });

  // Retired by Phase 301: the swipe-shell home intentionally reuses /polls/feed
  // (fetch) and attaches a whole-card click listener; the no-fetch/no-listener
  // guard described the pre-Phase-301 copy-only home. Network/listener/no-storage
  // behavior is now guarded by the phase-301 home swipe shell test.
  it.skip('keeps public-mvp-home.js free of fetch, storage, listener, or tracking', async () => {
    const homeSource = stripJsComments(
      await readFile(join(process.cwd(), PUBLIC_MVP_HOME), 'utf8'),
    );

    expect(homeSource).not.toMatch(FORBIDDEN_SIDE_EFFECTS);
    expect(homeSource).not.toMatch(FORBIDDEN_ELIGIBILITY_OUTCOME);
    expect(homeSource).not.toMatch(/\bfetch\s*\(/);
  });

  it('keeps vote-by-index payload as { option_index } only', async () => {
    const votePage = await loadModule('public/frontend/vote-page.js');
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 201,
      json: async () => ({
        vote_token: 'secret-token',
        option_id: 'secret-option',
        shard_id: 2,
      }),
    }));

    await votePage.submitVoteByIndex({
      pollId: '11111111-1111-4111-8111-111111111111',
      optionIndex: 2,
      userId: '44444444-4444-4444-8444-444444444444',
      fetchImpl,
    });

    const body = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body));
    expect(body).toEqual({ option_index: 2 });
    expect(body).not.toHaveProperty('option_id');
  });

  it('keeps registration, /users/me, and quality_badge boundaries', async () => {
    const registration = await loadModule('public/frontend/registration-page.js');
    const badge = await loadModule('public/frontend/quality-feedback-badge.js');
    const fetchCalls: string[] = [];
    const fetchImpl = vi.fn(async (url: string) => {
      fetchCalls.push(String(url));
      return { status: 201 };
    });

    await registration.submitRegistrationRequest({
      profile: {
        display_name: 'Phase 262 Copy User',
        birth_year_month: '1992-03',
        residential_region: 'TW-TPE',
      },
      credential: 'proof',
      fetchImpl,
    });

    expect(fetchCalls).toEqual(['/registration']);
    expect(badge.QUALITY_FEEDBACK_BADGE_LABEL).toBe('回饋良好');
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: 'positive_feedback' })).toBe(
      true,
    );
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: null })).toBe(false);
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: 'unexpected' })).toBe(false);
  });

  // Retired by Phase 301 (homepage account-flow note removed — see phase-301 test).
  it.skip('aligns static index.html fallback with engineer-token-free account flow copy', async () => {
    const indexHtml = await readFile(join(process.cwd(), 'public/index.html'), 'utf8');

    for (const marker of ENGINEER_TOKEN_MARKERS) {
      expect(indexHtml).not.toContain(marker);
    }
    expect(indexHtml).toContain('id="home-account-flow-note"');
    expect(indexHtml).toContain('不會自動登入');
    expect(indexHtml).toContain('測試身份示範');
  });
});
