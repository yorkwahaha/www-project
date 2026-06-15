import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_263_DOC =
  'docs/www-project-phase-263-home-account-flow-runtime-copy-review-checkpoint-v1.md';
const PHASE_262_DOC =
  'docs/www-project-phase-262-home-account-flow-runtime-copy-token-cleanup-v1.md';

const PHASE_262_BASELINE_TESTS = [
  'tests/frontend/phase-262-home-account-flow-runtime-copy-token-cleanup.test.ts',
  'tests/docs/phase-262-home-account-flow-runtime-copy-token-cleanup-doc.test.ts',
] as const;

const PUBLIC_MVP_HOME = 'public/frontend/public-mvp-home.js';
const PUBLIC_PAGE_COPY = 'public/frontend/public-page-copy.js';
const INDEX_HTML = 'public/index.html';

const PHASE_262_UNTOUCHED_FRONTEND = [
  PUBLIC_PAGE_COPY,
  'public/frontend/login-page.js',
  'public/frontend/registration-page.js',
  'public/frontend/profile-page.js',
  'public/frontend/vote-page.js',
  'public/frontend/result-page.js',
  'public/frontend/create-poll-page.js',
  'public/frontend/my-polls-page.js',
] as const;

const PROTECTED_BACKEND_PATHS = [
  'src/polls/repository.ts',
  'src/http/official-vote-routes.ts',
  'src/http/registration-routes.ts',
  'src/http/login-session-routes.ts',
  'src/http/creator-session-routes.ts',
  'src/auth/user-auth-resolver.ts',
  'migrations',
] as const;

const ENGINEER_TOKEN_MARKERS = ['creator_session', 'X-User-Id'] as const;

const FORBIDDEN_SIDE_EFFECTS =
  /\bfetch\s*\(|addEventListener|removeEventListener|localStorage|sessionStorage|document\.cookie|navigator\.sendBeacon|performance\.mark/i;

const FORBIDDEN_ELIGIBILITY_OUTCOME =
  /你符合資格|你不符合資格|已投過票|可以投票|一定能投票|can_vote|age_passed|region_passed/i;

function stripJsComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:\\])\/\/.*$/gm, '$1');
}

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 263 home account flow runtime copy review checkpoint', () => {
  it('documents Phase 263 review checkpoint in README with APPROVED conclusion', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_263_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(doc).toContain('Phase 263');
    expect(doc).toContain('Home Account Flow Runtime Copy Review Checkpoint');
    expect(doc).toContain('b4c0a5e');
    expect(doc).toContain('Phase 262');
    expect(doc).toContain('review checkpoint');
    expect(doc).toContain('No runtime change');
    expect(doc).toContain('APPROVED');
    expect(doc).toContain('no runtime/API/DB/backend/auth/vote/result/creator/profile/privacy drift');
    expect(doc).toContain('Phase 264 blockers: none identified');
    expect(doc).toContain('syncHomePageAccountFlowNote');

    expect(readme).toContain('Phase 263');
    expect(readme).toContain(PHASE_263_DOC);
    expect(readme).toContain('Home account flow runtime copy review checkpoint');
  });

  it('keeps Phase 262 baseline guard tests present', async () => {
    for (const relativePath of PHASE_262_BASELINE_TESTS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source.length).toBeGreaterThan(0);
    }
  });

  it('reviews public-mvp-home.js without engineer tokens in account flow runtime copy', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_262_DOC), 'utf8');
    const homeSource = stripJsComments(await readFile(join(process.cwd(), PUBLIC_MVP_HOME), 'utf8'));

    expect(doc).toContain('syncHomePageAccountFlowNote');
    expect(homeSource).toContain('syncHomePageAccountFlowNote');
    for (const marker of ENGINEER_TOKEN_MARKERS) {
      expect(homeSource, `public-mvp-home.js must not contain ${marker}`).not.toContain(marker);
    }
    expect(homeSource).not.toContain('creatorSessionCode');
    expect(homeSource).not.toContain('userIdCode');
    expect(homeSource).toContain('PUBLIC_HOME_DEMO_CREATOR_SESSION_NOTE');
    expect(homeSource).toContain('PUBLIC_HOME_DEMO_PROFILE_VOTE_NOTE');
  });

  it('reviews syncHomePageAccountFlowNote preserves navigation targets and mount contract', async () => {
    const home = await loadModule(PUBLIC_MVP_HOME);
    const ui = await loadModule('public/frontend/public-mvp-ui.js');
    const links: Array<{ href: string; textContent: string }> = [];

    const appended: unknown[] = [];
    const note = {
      replaceChildren: vi.fn(),
      append: (...nodes: unknown[]) => {
        appended.push(...nodes);
        for (const node of nodes) {
          if (
            node &&
            typeof node === 'object' &&
            'href' in node &&
            typeof (node as { href: string }).href === 'string'
          ) {
            links.push({
              href: (node as { href: string }).href,
              textContent: String((node as { textContent: string }).textContent ?? ''),
            });
          }
        }
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

    expect(links).toEqual([
      { href: '/registration', textContent: ui.PUBLIC_CTA_REGISTER_LABEL },
      { href: '/login', textContent: ui.PUBLIC_CTA_SIGN_IN_LABEL },
      { href: ui.PUBLIC_HOME_DEMO_CREATE_POLL_HREF, textContent: ui.PUBLIC_HOME_DEMO_CREATE_POLL_LINK_LABEL },
      { href: ui.PUBLIC_HOME_PROFILE_HREF, textContent: '個人資料' },
    ]);

    const serialized = JSON.stringify(appended);
    expect(serialized).not.toMatch(FORBIDDEN_ELIGIBILITY_OUTCOME);
    expect(ui.PUBLIC_HOME_ACCOUNT_FLOW_REGISTRATION_NOTE).toContain('不會自動登入');
  });

  it('reviews public-mvp-home.js as copy assembly without fetch, storage, listener, or tracking', async () => {
    const homeSource = stripJsComments(await readFile(join(process.cwd(), PUBLIC_MVP_HOME), 'utf8'));

    expect(homeSource).not.toMatch(FORBIDDEN_SIDE_EFFECTS);
    expect(homeSource).not.toMatch(FORBIDDEN_ELIGIBILITY_OUTCOME);
    expect(homeSource).not.toContain('Phase 263');
  });

  it('keeps login, registration, and creator session modules untouched by Phase 262', async () => {
    for (const relativePath of [
      'public/frontend/login-page.js',
      'public/frontend/registration-page.js',
      'public/frontend/profile-page.js',
    ]) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 262');
      expect(source, relativePath).not.toContain('Phase 263');
    }
  });

  it('keeps public/index.html and public-page-copy.js untouched by Phase 262', async () => {
    const indexHtml = await readFile(join(process.cwd(), INDEX_HTML), 'utf8');
    const pageCopy = await readFile(join(process.cwd(), PUBLIC_PAGE_COPY), 'utf8');

    expect(indexHtml).not.toContain('Phase 262');
    expect(indexHtml).not.toContain('Phase 263');
    expect(pageCopy).not.toContain('Phase 262');
    expect(pageCopy).not.toContain('Phase 263');

    for (const marker of ENGINEER_TOKEN_MARKERS) {
      expect(indexHtml).not.toContain(marker);
    }

    expect(indexHtml).toContain('id="home-account-flow-note"');
    expect(indexHtml).toContain('不會自動登入');
    expect(indexHtml).toContain('測試身份示範');

    const pageCopyStripped = stripJsComments(pageCopy);
    expect(pageCopyStripped).not.toMatch(FORBIDDEN_SIDE_EFFECTS);
    expect(pageCopyStripped).not.toMatch(/\bexport function\b/);
  });

  it('keeps Phase 262-untouched frontend modules free of Phase 263 drift markers', async () => {
    const css = await readFile(join(process.cwd(), 'public/frontend/public-mvp.css'), 'utf8');
    expect(css).not.toContain('Phase 262');
    expect(css).not.toContain('Phase 263');

    for (const relativePath of PHASE_262_UNTOUCHED_FRONTEND) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 263');
    }
  });

  it('keeps registration boundary without auto-login or GET /users/me', async () => {
    const registration = await loadModule('public/frontend/registration-page.js');
    const fetchCalls: string[] = [];
    const fetchImpl = vi.fn(async (url: string) => {
      fetchCalls.push(String(url));
      return { status: 201 };
    });

    await registration.submitRegistrationRequest({
      profile: {
        display_name: 'Account Flow Review User',
        birth_year_month: '1995-11',
        residential_region: 'TW-TPE',
      },
      credential: 'proof',
      fetchImpl,
    });

    expect(fetchCalls).toEqual(['/registration']);
  });

  it('keeps vote-by-index payload as { option_index } only', async () => {
    const votePage = await loadModule('public/frontend/vote-page.js');
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 201,
      json: async () => ({
        vote_token: 'secret-token',
        option_id: 'secret-option',
        shard_id: 5,
      }),
    }));

    await votePage.submitVoteByIndex({
      pollId: '11111111-1111-4111-8111-111111111111',
      optionIndex: 0,
      userId: '44444444-4444-4444-8444-444444444444',
      fetchImpl,
    });

    const body = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body));
    expect(body).toEqual({ option_index: 0 });
    expect(body).not.toHaveProperty('option_id');
  });

  it('keeps quality_badge presentation gate and non-ranking boundary', async () => {
    const badge = await loadModule('public/frontend/quality-feedback-badge.js');

    expect(badge.QUALITY_FEEDBACK_BADGE_LABEL).toBe('回饋良好');
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: 'positive_feedback' })).toBe(
      true,
    );
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: null })).toBe(false);
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: 'unexpected' })).toBe(false);
  });

  it('keeps Official Vote transaction order unchanged in backend source', async () => {
    const repository = await readFile(join(process.cwd(), 'src/polls/repository.ts'), 'utf8');
    const transactionStart = repository.indexOf('async function castOfficialVote(');
    const transactionEnd = repository.indexOf('async function resolveOfficialVoteOptionIdWithClient');
    const transactionBody = repository.slice(transactionStart, transactionEnd);
    const eligibilityCheck = transactionBody.indexOf('isProfileEligibleForOfficialVote');
    const optionResolution = transactionBody.indexOf('resolveOfficialVoteOptionIdWithClient');
    const tokenWrite = transactionBody.indexOf('insertVoteToken');
    const counterIncrement = transactionBody.indexOf('incrementVoteCounter');

    expect(eligibilityCheck).toBeGreaterThan(-1);
    expect(optionResolution).toBeGreaterThan(eligibilityCheck);
    expect(tokenWrite).toBeGreaterThan(optionResolution);
    expect(counterIncrement).toBeGreaterThan(tokenWrite);
    expect(repository).not.toContain('Phase 263');
  });

  it('does not mark Phase 263 on protected backend paths', async () => {
    for (const relativePath of PROTECTED_BACKEND_PATHS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8').catch(() => '');
      if (!source) {
        continue;
      }
      expect(source, relativePath).not.toContain('Phase 263');
    }
  });
});
