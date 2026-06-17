import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_260_DOC =
  'docs/www-project-phase-260-public-static-html-shell-copy-alignment-v1.md';

const PHASE_260_ALLOWED_HTML = [
  'public/index.html',
  'public/login.html',
  'public/vote.html',
  'public/results.html',
  'public/create-poll.html',
  'public/my-polls.html',
] as const;

const PHASE_260_VERIFY_ONLY_HTML = [
  'public/registration.html',
  'public/profile.html',
  'public/explore.html',
  'public/trust-levels.html',
] as const;

const PUBLIC_FRONTEND_RUNTIME_MODULES = [
  'public/frontend/public-page-copy.js',
  'public/frontend/public-mvp-ui.js',
  'public/frontend/public-mvp-home.js',
  'public/frontend/faq-page.js',
  'public/frontend/vote-page.js',
  'public/frontend/result-page.js',
  'public/frontend/login-page.js',
  'public/frontend/registration-page.js',
  'public/frontend/profile-page.js',
  'public/frontend/create-poll-page.js',
  'public/frontend/my-polls-page.js',
  'public/frontend/explore-page.js',
  'public/frontend/creator-flow-copy.js',
  'public/frontend/quality-feedback-badge.js',
] as const;

const PROTECTED_BACKEND_PATHS = [
  'src/polls/repository.ts',
  'src/http/official-vote-routes.ts',
  'src/http/registration-routes.ts',
  'src/auth/user-auth-resolver.ts',
  'migrations',
] as const;

const STALE_FALLBACK_MARKERS = [
  '優質題目',
  'X-User-Id',
  'creator_session',
  '多種訊號',
  'production credential proof',
  'production credential verifier',
] as const;

const SCRIPT_COUNTS: Record<(typeof PHASE_260_ALLOWED_HTML)[number], number> = {
  'public/index.html': 2,
  'public/login.html': 2,
  'public/vote.html': 2,
  'public/results.html': 2,
  'public/create-poll.html': 2,
  'public/my-polls.html': 2,
};

const SYNC_MOUNT_CONTRACTS: Record<string, string[]> = {
  // Phase 301: the homepage is now an ultra-minimal collecting-only swipe shell;
  // its former synced mount points (hero lead, account-flow note, sample-poll
  // notes, value grid) were removed. These are its current primary contracts.
  'public/index.html': [
    'id="home-swipe-status"',
    'id="home-swipe-stage"',
    'data-home-swipe-feed="collecting-only"',
    'id="home-create-cta"',
  ],
  'public/login.html': [
    'id="login-page-banner"',
    'id="login-lead-primary"',
    'id="login-lead-secondary"',
    'id="login-form-ready-hint"',
    'id="login-credential"',
    'id="login-shell-hint"',
    'id="login-shell-form"',
  ],
  'public/vote.html': [
    'id="vote-page-reminder-lead"',
    'id="vote-policy-hint-list"',
    'id="vote-collecting-notice-body"',
    'id="vote-form"',
    'id="vote-submit"',
  ],
  'public/results.html': [
    'id="results-page-demo-intro"',
    'id="results-intro"',
    'id="result-display"',
  ],
  'public/create-poll.html': [
    'id="create-poll-page-lead"',
    'id="create-poll-page-banner"',
    'id="create-poll-live-mode-hint"',
    'id="create-poll-form"',
    'id="create-poll-creator-guidance"',
  ],
  'public/my-polls.html': [
    'id="my-polls-page-banner"',
    'id="my-polls-page-lead"',
    'id="my-polls-quota-panel-body"',
    'id="my-polls-creator-side-note"',
  ],
};

function countScriptTags(source: string): number {
  return (source.match(/<script\b/g) ?? []).length;
}

function extractElementTextById(source: string, id: string): string {
  const pattern = new RegExp(`id="${id}"[^>]*>([\\s\\S]*?)</`, 'i');
  const match = source.match(pattern);
  if (!match?.[1]) {
    return '';
  }
  return match[1]
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 260 public static HTML shell copy alignment', () => {
  it('documents Phase 260 delivery in README and phase doc', async () => {
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');
    const doc = await readFile(join(process.cwd(), PHASE_260_DOC), 'utf8');

    expect(readme).toContain('Phase 260');
    expect(readme).toContain(PHASE_260_DOC);
    expect(doc).toContain('Phase 260');
    expect(doc).toContain('minimal static HTML shell fallback copy alignment');
  });

  it('removes stale fallback markers from P0 HTML shells', async () => {
    for (const relativePath of PHASE_260_ALLOWED_HTML) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      for (const marker of STALE_FALLBACK_MARKERS) {
        expect(source, `${relativePath} must not contain ${marker}`).not.toContain(marker);
      }
    }
  });

  it('aligns synced mount fallback text with PUBLIC_* constants', async () => {
    const ui = await loadModule('public/frontend/public-mvp-ui.js');
    const indexHtml = await readFile(join(process.cwd(), 'public/index.html'), 'utf8');
    const loginHtml = await readFile(join(process.cwd(), 'public/login.html'), 'utf8');
    const voteHtml = await readFile(join(process.cwd(), 'public/vote.html'), 'utf8');
    const resultsHtml = await readFile(join(process.cwd(), 'public/results.html'), 'utf8');
    const createPollHtml = await readFile(join(process.cwd(), 'public/create-poll.html'), 'utf8');
    const myPollsHtml = await readFile(join(process.cwd(), 'public/my-polls.html'), 'utf8');

    // Phase 301: the homepage swipe shell no longer renders a synced hero lead
    // or value-card body; the remaining shells below keep their PUBLIC_* sync.
    expect(indexHtml).toContain('data-home-swipe-feed="collecting-only"');
    expect(extractElementTextById(loginHtml, 'login-lead-secondary')).toBe(
      ui.PUBLIC_LOGIN_PAGE_LEAD_SECONDARY,
    );
    expect(extractElementTextById(loginHtml, 'login-form-ready-hint')).toBe(
      ui.PUBLIC_LOGIN_FORM_READY_HINT,
    );
    expect(extractElementTextById(voteHtml, 'vote-page-reminder-lead')).toBe(
      ui.PUBLIC_VOTE_PAGE_REMINDER_LEAD,
    );
    expect(extractElementTextById(resultsHtml, 'results-page-demo-intro')).toBe(
      ui.PUBLIC_RESULTS_PAGE_DEMO_INTRO_LEAD,
    );
    expect(extractElementTextById(createPollHtml, 'create-poll-page-lead')).toBe(
      ui.PUBLIC_CREATE_POLL_PAGE_LEAD,
    );
    expect(extractElementTextById(createPollHtml, 'create-poll-page-banner')).toBe(
      ui.PUBLIC_CREATE_POLL_PAGE_BANNER_BODY,
    );
    expect(extractElementTextById(createPollHtml, 'create-poll-live-mode-hint')).toBe(
      ui.PUBLIC_CREATE_POLL_LIVE_MODE_HINT,
    );
    expect(extractElementTextById(myPollsHtml, 'my-polls-page-lead')).toBe(
      ui.PUBLIC_MY_POLLS_PAGE_LEAD,
    );
    expect(extractElementTextById(myPollsHtml, 'my-polls-page-banner')).toBe(
      ui.PUBLIC_MY_POLLS_PAGE_BANNER_BODY,
    );

    expect(voteHtml).toContain(ui.PUBLIC_VOTE_POLICY_QUALITY_FEEDBACK_TEXT);
    // Phase 301: the homepage value grid was removed, so its quality-feedback
    // body is no longer rendered on the home (the constant remains exported and
    // is asserted in phase-286 / on the FAQ page).
  });

  it('keeps faq.html out of Phase 260 scope', async () => {
    const faqHtml = await readFile(join(process.cwd(), 'public/faq.html'), 'utf8');

    expect(faqHtml).not.toContain('Phase 260');
    expect(faqHtml).not.toContain('優質題目');
    expect(faqHtml).toContain('回饋良好');
  });

  it('does not mark Phase 260 on JS, CSS, or backend runtime modules', async () => {
    const css = await readFile(join(process.cwd(), 'public/frontend/public-mvp.css'), 'utf8');
    expect(css).not.toContain('Phase 260');

    for (const relativePath of PUBLIC_FRONTEND_RUNTIME_MODULES) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 260');
    }

    for (const relativePath of PROTECTED_BACKEND_PATHS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8').catch(() => '');
      if (!source) {
        continue;
      }
      expect(source, relativePath).not.toContain('Phase 260');
    }
  });

  it('preserves script counts and primary id/class/data-* contracts', async () => {
    for (const relativePath of PHASE_260_ALLOWED_HTML) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(countScriptTags(source), relativePath).toBe(SCRIPT_COUNTS[relativePath]);
      expect(source, relativePath).not.toMatch(/\bonclick\s*=/i);
      expect(source, relativePath).not.toContain('localStorage');
      expect(source, relativePath).not.toContain('sessionStorage');

      for (const contract of SYNC_MOUNT_CONTRACTS[relativePath] ?? []) {
        expect(source, `${relativePath} missing ${contract}`).toContain(contract);
      }
    }

    for (const relativePath of PHASE_260_VERIFY_ONLY_HTML) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 260');
    }
  });

  it('keeps vote-by-index payload as { option_index } only', async () => {
    const votePage = await loadModule('public/frontend/vote-page.js');
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 201,
      json: async () => ({
        vote_token: 'secret-token',
        option_id: 'secret-option',
        shard_id: 3,
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
        display_name: 'Shell Copy User',
        birth_year_month: '1990-01',
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
});
