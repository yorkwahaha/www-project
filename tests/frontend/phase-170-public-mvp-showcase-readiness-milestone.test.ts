import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

const PHASE_170_DOC =
  'docs/www-project-phase-170-public-mvp-showcase-readiness-milestone-v1.md';

const PUBLIC_MVP_ROUTES = [
  '/',
  '/registration',
  '/login',
  '/profile',
  '/explore',
  '/polls/new',
  '/polls/new?live=1',
  '/my-polls',
  '/my-polls?live=1',
  '/vote/:id',
  '/results/:id',
  '/faq',
  '/trust-levels',
];

const PROTECTED_BACKEND_PATHS = [
  'src/polls/repository.ts',
  'src/polls/feed-config.ts',
  'src/http/registration-routes.ts',
  'src/http/login-session-routes.ts',
  'src/http/official-vote-routes.ts',
  'src/http/creator-session-routes.ts',
  'src/http/result-routes.ts',
  'src/auth/user-auth-resolver.ts',
  'migrations',
];

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 170 public MVP showcase readiness milestone', () => {
  it('documents all main public MVP routes as safe to demo within fixed boundaries', async () => {
    const source = await readFile(join(process.cwd(), PHASE_170_DOC), 'utf8');

    for (const route of PUBLIC_MVP_ROUTES) {
      expect(source, route).toContain(route);
    }
    expect(source).toContain('Public MVP Pages Safe to Demo');
    expect(source).toContain('does not claim full production readiness');
  });

  it('documents demo/local/test creator flow separation from production identity', async () => {
    const source = await readFile(join(process.cwd(), PHASE_170_DOC), 'utf8');
    const myPollsHtml = await readFile(join(process.cwd(), 'public/my-polls.html'), 'utf8');
    const indexHtml = await readFile(join(process.cwd(), 'public/index.html'), 'utf8');
    const { parseLiveApiMode } = await loadModule('public/frontend/public-mvp-demo.js');

    expect(source).toContain('creator_session');
    expect(source).toContain('not production public identity');
    expect(source).toContain('parseLiveApiMode');
    expect(parseLiveApiMode('?live=1')).toBe(true);
    expect(parseLiveApiMode('')).toBe(false);
    expect(myPollsHtml).toContain('?live=1');
    expect(myPollsHtml).not.toContain('creator_session');
    // Phase 301: the homepage demo/account note (with its 測試身份示範 copy) was
    // removed when the home became an ultra-minimal collecting-only swipe shell;
    // that demo/creator separation copy now lives on my-polls / create-poll.
    expect(indexHtml).not.toContain('creator_session');
  });

  it('documents explore freshness-only posture and runtime feed guard still holds', async () => {
    const source = await readFile(join(process.cwd(), PHASE_170_DOC), 'utf8');
    const exploreHtml = await readFile(join(process.cwd(), 'public/explore.html'), 'utf8');
    const { buildExploreFeedRequestUrl, isExploreFeedItemSafe } = await loadModule(
      'public/frontend/explore-page.js',
    );

    expect(source).toContain('freshness-only');
    expect(source).toContain('not hot/ranking/personalized');
    expect(exploreHtml).toContain('data-explore-feed="freshness-only"');
    expect(
      buildExploreFeedRequestUrl({ origin: 'http://127.0.0.1:3000' }).toString(),
    ).not.toMatch(/rank|hot|trend|personal/i);
    expect(
      isExploreFeedItemSafe({
        poll_id: '11111111-1111-4111-8111-111111111111',
        title: '示範',
        category: 'general',
        status: 'active',
        published_display: '最近發布',
        result_page_url: '/results/11111111-1111-4111-8111-111111111111',
        quality_badge: null,
        vote_count: 9,
      }),
    ).toBe(false);
  });

  it('documents results aggregate-only posture and lifecycle render guard still holds', async () => {
    const source = await readFile(join(process.cwd(), PHASE_170_DOC), 'utf8');
    const { resolveResultRenderMode } = await loadModule('public/frontend/result-page.js');

    expect(source).toContain('display-safe aggregate');
    expect(source).toContain('revealed');
    expect(source).toContain('locked');
    expect(source).toContain('post_lock');

    for (const lifecycle of ['collecting', 'cancelled', 'unpublished'] as const) {
      expect(
        resolveResultRenderMode({ public_lifecycle_state: lifecycle, options: [] }),
      ).not.toBe('aggregate');
    }
    for (const lifecycle of ['revealed', 'locked', 'post_lock'] as const) {
      expect(
        resolveResultRenderMode({
          public_lifecycle_state: lifecycle,
          options: [{ display_label: '選項 A', display_percentage: '約 10%' }],
        }),
      ).toBe('aggregate');
    }
  });

  it('documents registration and login session boundaries still hold', async () => {
    const source = await readFile(join(process.cwd(), PHASE_170_DOC), 'utf8');
    const registrationHtml = await readFile(
      join(process.cwd(), 'public/registration.html'),
      'utf8',
    );
    const registrationSource = await readFile(
      join(process.cwd(), 'public/frontend/registration-page.js'),
      'utf8',
    );
    const loginSource = await readFile(join(process.cwd(), 'public/frontend/login-page.js'), 'utf8');

    expect(source).toContain('does not auto-login');
    expect(source).toContain('POST /login/session');
    expect(registrationHtml).toContain('data-login-state-read="disabled"');
    expect(registrationSource).not.toMatch(/\/users\/me|POST \/login\/session/i);
    expect(loginSource).toContain('/login/session');
  });

  it('documents profile field limits and runtime normalization still holds', async () => {
    const source = await readFile(join(process.cwd(), PHASE_170_DOC), 'utf8');
    const { normalizeProfileFormInput } = await loadModule('public/frontend/profile-page.js');

    expect(source).toContain('birth_year_month');
    expect(source).toContain('residential_region');
    expect(
      Object.keys(
        normalizeProfileFormInput({
          birthYearMonth: '1998-07',
          residentialRegion: 'TW-TPE',
        }),
      ).sort(),
    ).toEqual(['birth_year_month', 'residential_region'].sort());
  });

  it('documents no backend change posture for showcase milestone', async () => {
    const source = await readFile(join(process.cwd(), PHASE_170_DOC), 'utf8');

    expect(source).toContain(
      'no backend/API/DB/schema/auth/vote transaction/eligibility/result visibility changes needed',
    );

    for (const relativePath of PROTECTED_BACKEND_PATHS) {
      const fileSource = await readFile(join(process.cwd(), relativePath), 'utf8').catch(() => '');
      if (!fileSource) {
        continue;
      }
      expect(fileSource, relativePath).not.toContain('Phase 170');
    }
  });

  it('references consolidated Phase 135-169 checkpoint coverage in milestone doc', async () => {
    const source = await readFile(join(process.cwd(), PHASE_170_DOC), 'utf8');

    for (const phaseRef of [
      'Phase 135',
      'Phase 161',
      'Phase 163',
      'Phase 164',
      'Phase 165',
      'Phase 166',
      'Phase 167',
      'Phase 168',
      'Phase 169',
    ]) {
      expect(source, phaseRef).toContain(phaseRef);
    }
    expect(source).toContain('phase-169-public-mvp-full-flow-smoke-checkpoint.test.ts');
  });
});
