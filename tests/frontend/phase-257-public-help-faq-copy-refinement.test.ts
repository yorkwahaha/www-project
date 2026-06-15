import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_257_DOC =
  'docs/www-project-phase-257-public-help-faq-copy-refinement-v1.md';

const ALLOWED_COPY_FILES = [
  'public/frontend/public-page-copy.js',
  'public/faq.html',
] as const;

const FORBIDDEN_RUNTIME_MODULES = [
  'public/frontend/vote-page.js',
  'public/frontend/result-page.js',
  'public/frontend/registration-page.js',
  'public/frontend/login-page.js',
  'public/frontend/profile-page.js',
  'public/frontend/create-poll-page.js',
  'public/frontend/my-polls-page.js',
] as const;

const PROTECTED_BACKEND_PATHS = [
  'src/http/official-vote-routes.ts',
  'src/http/registration-routes.ts',
  'src/auth/user-auth-resolver.ts',
  'migrations',
] as const;

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 257 public help / FAQ copy refinement', () => {
  it('documents Phase 257 delivery in README and copy module', async () => {
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');
    const copySource = await readFile(
      join(process.cwd(), 'public/frontend/public-page-copy.js'),
      'utf8',
    );

    expect(readme).toContain('Phase 257');
    expect(readme).toContain(PHASE_257_DOC);
    expect(copySource).toContain('Phase 257');
  });

  it('keeps refined copy inside shared allowlists without 優質題目', async () => {
    const ui = await loadModule('public/frontend/public-mvp-ui.js');
    const copySource = await readFile(
      join(process.cwd(), 'public/frontend/public-page-copy.js'),
      'utf8',
    );
    const faqHtml = await readFile(join(process.cwd(), 'public/faq.html'), 'utf8');

    expect(ui.PUBLIC_FAQ_ONBOARDING_MESSAGES.length).toBeGreaterThan(10);
    expect(ui.PUBLIC_AUTH_ACCOUNT_ONBOARDING_MESSAGES.length).toBeGreaterThan(5);
    expect(ui.PUBLIC_VOTE_RESULTS_ONBOARDING_MESSAGES.length).toBeGreaterThan(10);
    expect(ui.PUBLIC_CREATOR_ONBOARDING_MESSAGES.length).toBeGreaterThan(10);

    expect(ui.PUBLIC_LOGIN_FORM_READY_HINT).toContain('已核准的登入憑證');
    expect(ui.PUBLIC_LOGIN_PAGE_LEAD_SECONDARY).not.toContain('X-User-Id');
    expect(ui.PUBLIC_LOGIN_PAGE_LEAD_SECONDARY).not.toContain('creator_session');
    expect(ui.PUBLIC_CREATE_POLL_PAGE_LEAD).toContain('期中票數或百分比');
    expect(ui.PUBLIC_VOTE_POLICY_QUALITY_FEEDBACK_TEXT).not.toContain('優質題目');
    expect(ui.PUBLIC_FAQ_PAGE_HERO_LEAD).toContain('取消與下架');

    expect(copySource).not.toContain('優質題目');
    expect(faqHtml).not.toContain('優質題目');
    expect(faqHtml).toContain('回饋良好');
    expect(faqHtml).toContain(ui.PUBLIC_FAQ_CREATOR_FLOW_LIVE_STEP);
  });

  it('does not mark Phase 257 on forbidden runtime handler modules', async () => {
    for (const relativePath of FORBIDDEN_RUNTIME_MODULES) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 257');
    }
  });

  it('does not mark Phase 257 on protected backend paths', async () => {
    for (const relativePath of PROTECTED_BACKEND_PATHS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8').catch(() => '');
      if (!source) {
        continue;
      }
      expect(source, relativePath).not.toContain('Phase 257');
    }
  });

  it('keeps vote-by-index payload as { option_index } only', async () => {
    const votePage = await loadModule('public/frontend/vote-page.js');
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 201,
      json: async () => ({ vote_token: 'secret', option_id: 'secret', shard_id: 1 }),
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

  it('keeps registration without auto-login or GET /users/me', async () => {
    const registration = await loadModule('public/frontend/registration-page.js');
    const fetchCalls: string[] = [];
    const fetchImpl = vi.fn(async (url: string) => {
      fetchCalls.push(String(url));
      return { status: 201 };
    });

    await registration.submitRegistrationRequest({
      profile: {
        display_name: 'Copy User',
        birth_year_month: '1998-07',
        residential_region: 'TW-TPE',
      },
      credential: 'proof',
      fetchImpl,
    });

    expect(fetchCalls).toEqual(['/registration']);
  });

  it('keeps quality_badge presentation gate unchanged', async () => {
    const badge = await loadModule('public/frontend/quality-feedback-badge.js');

    expect(badge.QUALITY_FEEDBACK_BADGE_LABEL).toBe('回饋良好');
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: 'positive_feedback' })).toBe(
      true,
    );
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: null })).toBe(false);
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: 'unexpected' })).toBe(false);
  });

  it('limits Phase 257 delivery markers to allowlisted copy files', async () => {
    for (const relativePath of ALLOWED_COPY_FILES) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).toContain('Phase 257');
    }

    const voteSource = await readFile(join(process.cwd(), 'public/frontend/vote-page.js'), 'utf8');
    expect(voteSource).not.toContain('Phase 257');
  });
});
