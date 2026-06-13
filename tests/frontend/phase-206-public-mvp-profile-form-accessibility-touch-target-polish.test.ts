import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PUBLIC_MVP_CSS = 'public/frontend/public-mvp.css';

const PROTECTED_BACKEND_PATHS = [
  'src/polls/repository.ts',
  'src/http/user-profile-routes.ts',
  'src/http/user-me-routes.ts',
  'src/http/official-vote-routes.ts',
  'src/auth/user-auth-resolver.ts',
  'migrations',
];

const FORBIDDEN_STORAGE = /localStorage|sessionStorage|document\.cookie|Set-Cookie/i;

const FORBIDDEN_LEAKAGE_COPY =
  /option_id|vote_token|token_sha256|shard_id|session_id|www_session|\buser_id\b|raw_count|poll_option_vote_counters|creator_token|error\.message|JSON\.stringify\(error/i;

const FORBIDDEN_OBSERVABILITY =
  /console\.(log|info|warn|error|debug)|analytics|datadog|sentry|apm|trackEvent|gtag\(/i;

const FORBIDDEN_PROFILE_FIELDS =
  /gender|性別|email|phone|address|街道|門牌|GPS|geocode|precise location|精準位置/i;

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 206 public MVP profile form accessibility / touch target polish', () => {
  it('documents Phase 206 accessibility rules in public-mvp.css', async () => {
    const css = await readFile(join(process.cwd(), PUBLIC_MVP_CSS), 'utf8');

    expect(css).toContain('Phase 206');
    expect(css).toContain('.profile-page .mvp-profile-unauthenticated');
    expect(css).toContain('.profile-page #profile-signed-in-panel');
    expect(css).toContain('.profile-page #profile-form-message.mvp-profile-status');
    expect(css).toContain('min-height: var(--mvp-tap-min)');
    expect(css).toMatch(
      /@media \(max-width: 640px\)[\s\S]*\.profile-page \.mvp-info-hero \.mvp-lead/,
    );
    expect(css).toMatch(
      /@media \(max-width: 640px\)[\s\S]*\.profile-page #profile-form select option/,
    );
  });

  it('keeps profile HTML shell on profile-page class wrapper without runtime module churn', async () => {
    const profileHtml = await readFile(join(process.cwd(), 'public/profile.html'), 'utf8');

    expect(profileHtml).toContain(
      '<main id="main-content" class="mvp-page mvp-shell profile-page mvp-profile-shell" aria-labelledby="profile-heading">',
    );
    expect(profileHtml).toContain('id="profile-form"');
    expect(profileHtml).toContain('id="profile-unauthenticated"');
    expect(profileHtml).toContain('name="birth_year_month"');
    expect(profileHtml).toContain('name="residential_region"');
    expect(profileHtml).not.toContain('Phase 206');
    expect(profileHtml).not.toMatch(
      /name="gender"|name="email"|name="phone"|id="profile-gender"|id="profile-address"/i,
    );
  });

  it('does not mark Phase 206 profile runtime module or protected backend paths', async () => {
    const profileSource = await readFile(
      join(process.cwd(), 'public/frontend/profile-page.js'),
      'utf8',
    );
    expect(profileSource).not.toContain('Phase 206');

    for (const relativePath of PROTECTED_BACKEND_PATHS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8').catch(() => '');
      if (!source) {
        continue;
      }
      expect(source, relativePath).not.toContain('Phase 206');
    }
  });

  it('does not introduce linkage or observability leakage in Phase 206 CSS', async () => {
    const css = await readFile(join(process.cwd(), PUBLIC_MVP_CSS), 'utf8');
    const phase206Start = css.indexOf('Phase 206');
    const phase206Css = css.slice(phase206Start);

    expect(phase206Css).not.toMatch(FORBIDDEN_LEAKAGE_COPY);
    expect(phase206Css).not.toMatch(FORBIDDEN_OBSERVABILITY);
    expect(phase206Css).not.toMatch(FORBIDDEN_PROFILE_FIELDS);
  });

  it('keeps GET /users/me/profile load boundary unchanged', async () => {
    const profile = await loadModule('public/frontend/profile-page.js');
    const fetchCalls: string[] = [];
    const fetchImpl = vi.fn(async (url: string) => {
      fetchCalls.push(String(url));
      return {
        ok: true,
        status: 200,
        json: async () => ({
          birth_year_month: '1990-05',
          residential_region: 'TW-TPE',
        }),
      };
    });

    const loaded = await profile.loadUserProfile({ fetchImpl });
    expect(fetchCalls).toEqual(['/users/me/profile']);
    expect(loaded).toEqual({
      birth_year_month: '1990-05',
      residential_region: 'TW-TPE',
    });
  });

  it('keeps PUT /users/me/profile save boundary with two fields and null semantics', async () => {
    const profile = await loadModule('public/frontend/profile-page.js');
    const profileSource = await readFile(
      join(process.cwd(), 'public/frontend/profile-page.js'),
      'utf8',
    );
    const fetchCalls: Array<{ url: string; init?: RequestInit }> = [];
    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      fetchCalls.push({ url: String(url), init });
      return {
        ok: true,
        status: 200,
        json: async () => ({
          birth_year_month: null,
          residential_region: null,
        }),
      };
    });

    const normalized = profile.normalizeProfileFormInput({
      birthYearMonth: '',
      residentialRegion: '',
    });
    expect(normalized).toEqual({
      birth_year_month: null,
      residential_region: null,
    });

    await profile.saveUserProfile({ profile: normalized, fetchImpl });
    expect(fetchCalls).toHaveLength(1);
    expect(fetchCalls[0]?.url).toBe('/users/me/profile');
    expect(fetchCalls[0]?.init?.method).toBe('PUT');
    const body = JSON.parse(String(fetchCalls[0]?.init?.body));
    expect(body).toEqual({
      birth_year_month: null,
      residential_region: null,
    });
    expect(body).not.toHaveProperty('display_name');
    expect(body).not.toHaveProperty('gender');
    expect(profileSource).not.toMatch(/fetchImpl\(['"`]\/users\/me['"`]/);
    expect(profileSource).not.toMatch(FORBIDDEN_STORAGE);
    expect(profileSource).not.toMatch(FORBIDDEN_PROFILE_FIELDS);
  });

  it('keeps vote-by-index body unchanged as regression guard', async () => {
    const votePage = await loadModule('public/frontend/vote-page.js');
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 201,
      json: async () => ({}),
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
});
