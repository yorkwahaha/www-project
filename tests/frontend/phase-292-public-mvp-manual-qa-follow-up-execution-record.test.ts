import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_268_DOC =
  'docs/www-project-phase-268-public-mvp-manual-qa-runbook-execution-plan-v1.md';
const PHASE_270_DOC =
  'docs/www-project-phase-270-public-mvp-manual-qa-execution-record-v1.md';
const PHASE_290_DOC =
  'docs/www-project-phase-290-public-mvp-post-copy-polish-checkpoint-v1.md';
const PHASE_291_DOC =
  'docs/www-project-phase-291-public-mvp-backlog-reprioritization-checkpoint-v1.md';
const PHASE_292_DOC =
  'docs/www-project-phase-292-public-mvp-manual-qa-follow-up-execution-record-v1.md';

const PUBLIC_HTML_SHELLS = [
  'public/index.html',
  'public/explore.html',
  'public/faq.html',
  'public/login.html',
  'public/registration.html',
  'public/profile.html',
  'public/create-poll.html',
  'public/my-polls.html',
  'public/vote.html',
  'public/results.html',
] as const;

const PROTECTED_BACKEND_PATHS = [
  'src/polls/repository.ts',
  'src/http/official-vote-routes.ts',
  'src/http/registration-routes.ts',
  'src/http/login-session-routes.ts',
  'src/http/user-profile-routes.ts',
  'src/auth/user-auth-resolver.ts',
] as const;

const PHASE_285_EMPTY_MESSAGE = '目前沒有可瀏覽的公開問卷。';
const PHASE_287_ACCOUNT_FLOW =
  '註冊只建立帳號與個人資料欄位，不會自動登入，也不會建立瀏覽器工作階段。請用相同憑證登入後，頁首才會顯示帳號名稱。';
const PHASE_288_EMPTY_MESSAGE = '目前還沒有你建立的問卷。';
const PHASE_289_BANNER_SNIPPET = '本產品尚未正式對外上線';
const PHASE_289_VOTE_NEUTRAL = '不代表一定可以完成投票';

const FORBIDDEN_ELIGIBILITY =
  /你符合資格|你不符合資格|已投過票|一定能投票/i;

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 292 public MVP manual QA follow-up execution record', () => {
  it('confirms Phase 292 follow-up record exists with README index and prior QA context', async () => {
    const runbook = await readFile(join(process.cwd(), PHASE_268_DOC), 'utf8');
    const priorRecord = await readFile(join(process.cwd(), PHASE_270_DOC), 'utf8');
    const checkpoint290 = await readFile(join(process.cwd(), PHASE_290_DOC), 'utf8');
    const checkpoint291 = await readFile(join(process.cwd(), PHASE_291_DOC), 'utf8');
    const record = await readFile(join(process.cwd(), PHASE_292_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(runbook).toContain('Manual QA Runbook');
    expect(priorRecord).toContain('Overall session result');
    expect(checkpoint290).toContain('Phases 285–289 may be archived');
    expect(checkpoint291).toContain('BL-282-04');
    expect(record).toContain('Phase 292');
    expect(record).toContain('follow-up execution record');
    expect(record).toContain('not release execution');
    expect(record).toContain('not deployment');
    expect(record).toContain('ccfea78');
    expect(readme).toContain('Phase 292');
    expect(readme).toContain(PHASE_292_DOC);
  });

  it('keeps Phase 292 as docs-only without runtime or HTML delivery markers', async () => {
    for (const relativePath of PUBLIC_HTML_SHELLS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 292');
      expect(source, relativePath).not.toContain('Phase 293');
    }

    for (const relativePath of PROTECTED_BACKEND_PATHS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toContain('Phase 292');
    }

    const migrationDir = join(process.cwd(), 'migrations');
    const migrationFiles = await readdir(migrationDir);
    for (const fileName of migrationFiles) {
      const source = await readFile(join(migrationDir, fileName), 'utf8');
      expect(source, `migrations/${fileName}`).not.toContain('Phase 292');
    }
  });

  it('verifies post-copy-polish focus copy on primary public shells', async () => {
    const publicUi = await loadModule('public/frontend/public-mvp-ui.js');
    const exploreHtml = await readFile(join(process.cwd(), 'public/explore.html'), 'utf8');
    const loginHtml = await readFile(join(process.cwd(), 'public/login.html'), 'utf8');
    const faqHtml = await readFile(join(process.cwd(), 'public/faq.html'), 'utf8');
    const profileHtml = await readFile(join(process.cwd(), 'public/profile.html'), 'utf8');
    const resultsHtml = await readFile(join(process.cwd(), 'public/results.html'), 'utf8');
    const voteHtml = await readFile(join(process.cwd(), 'public/vote.html'), 'utf8');

    expect(publicUi.PUBLIC_EXPLORE_EMPTY_MESSAGE).toBe(PHASE_285_EMPTY_MESSAGE);
    expect(exploreHtml).toContain(PHASE_285_EMPTY_MESSAGE);
    expect(loginHtml).toContain(PHASE_287_ACCOUNT_FLOW);
    expect(publicUi.PUBLIC_MY_POLLS_EMPTY_MESSAGE).toBe(PHASE_288_EMPTY_MESSAGE);
    expect(faqHtml).toContain(PHASE_289_BANNER_SNIPPET);
    expect(faqHtml).toContain(PHASE_289_VOTE_NEUTRAL);
    expect(profileHtml).toContain('不表示可保證');
    expect(resultsHtml).toContain('收集中不顯示票數');
    expect(voteHtml).toContain(PHASE_289_VOTE_NEUTRAL);
    expect(voteHtml).not.toMatch(FORBIDDEN_ELIGIBILITY);
  });

  it('records overall PASS with optional non-blocking follow-up in Phase 292 doc', async () => {
    const record = await readFile(join(process.cwd(), PHASE_292_DOC), 'utf8');

    expect(record).toContain('**Overall session result:** **PASS**');
    expect(record).toContain('**FAIL items:** none');
    expect(record).toContain('**BLOCKED items:** none');
    expect(record).toContain('NEEDS FOLLOW-UP');
    expect(record).toContain('FU-292-01');
    expect(record).toContain('smoke:public:local');
    expect(record).toContain('NOT EXECUTED');
    expect(record).not.toContain('launch completed');
    expect(record).not.toContain('deployment executed');
  });

  it('keeps registration, vote, and quality_badge boundaries during QA follow-up record', async () => {
    const registration = await loadModule('public/frontend/registration-page.js');
    const votePage = await loadModule('public/frontend/vote-page.js');
    const badge = await loadModule('public/frontend/quality-feedback-badge.js');
    const resultPage = await loadModule('public/frontend/result-page.js');
    const fetchCalls: string[] = [];
    const registrationFetch = vi.fn(async (url: string) => {
      fetchCalls.push(String(url));
      return { status: 201 };
    });

    await registration.submitRegistrationRequest({
      profile: {
        display_name: 'QA Follow-up User',
        birth_year_month: '1990-01',
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
    expect(JSON.parse(String(voteFetch.mock.calls[0]?.[1]?.body))).toEqual({ option_index: 0 });

    expect(badge.QUALITY_FEEDBACK_BADGE_LABEL).toBe('回饋良好');
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: null })).toBe(false);

    const collecting = resultPage.normalizeDisplaySafeResult({
      public_lifecycle_state: 'collecting',
      options: [{ display_label: 'A' }],
      total_votes_display: '總計 100 票',
    });
    expect(collecting?.mode).toBe('collecting');
  });
});
