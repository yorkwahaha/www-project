import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_245_DOC =
  'docs/www-project-phase-245-public-presentation-hierarchy-milestone-checkpoint-v1.md';

const LAYOUT_HELPER_MODULES = [
  'public/frontend/public-poll-card.js',
  'public/frontend/public-unavailable-state.js',
  'public/frontend/public-vote-detail-layout.js',
  'public/frontend/public-results-detail-layout.js',
  'public/frontend/public-creator-owned-poll-layout.js',
  'public/frontend/public-create-poll-form-layout.js',
  'public/frontend/quality-feedback-badge.js',
] as const;

const PRESENTATION_RUNTIME_MODULES = [
  'public/frontend/explore-page.js',
  'public/frontend/vote-page.js',
  'public/frontend/result-page.js',
  'public/frontend/my-polls-page.js',
  'public/frontend/create-poll-page.js',
  'public/frontend/poll-lifecycle-controls.js',
] as const;

const FORBIDDEN_BACKEND_ECHO =
  /error\.message|body\.message|apiError\.message|response\.text\(\)|JSON\.stringify\(error/i;

const FORBIDDEN_STORAGE = /localStorage|sessionStorage|indexedDB|document\.cookie/i;

const FORBIDDEN_AGGREGATE =
  /raw_count|poll_option_vote_counters|hidden aggregate|option breakdown/i;

const FORBIDDEN_QUALITY_MISUSE =
  /ranking|recommendation|personalization|creator score|governance score/i;

function stripJsComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

async function loadModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

function indexOfRegion(html: string, marker: string) {
  const index = html.indexOf(marker);
  expect(index).toBeGreaterThanOrEqual(0);
  return index;
}

describe('Phase 245 public presentation hierarchy milestone checkpoint', () => {
  it('confirms Phase 245 is docs/static only with README index reference', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_245_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(doc).toContain('Phase 245');
    expect(doc).toContain('Public Presentation Hierarchy Milestone Checkpoint');
    expect(doc).toContain('milestone checkpoint');
    expect(doc).toContain('no runtime change');
    expect(doc).toContain('no API change');
    expect(doc).toContain('no frontend behavior change');
    expect(doc).toContain('no migration');
    expect(doc).toContain('no schema change');
    expect(doc).toContain('no CSS/HTML/JS presentation changes');
    expect(doc).toContain(
      'APPROVED — Public presentation hierarchy milestone complete (Phase 239–244); no runtime/API/DB/backend/auth/vote/result/creator/profile/privacy drift identified.',
    );

    expect(readme).toContain('Phase 245');
    expect(readme).toContain(PHASE_245_DOC);
    expect(readme).toContain('Public presentation hierarchy milestone checkpoint');
  });

  it('exports all six presentation layout order constants', async () => {
    const pollCard = await loadModule('public/frontend/public-poll-card.js');
    const unavailable = await loadModule('public/frontend/public-unavailable-state.js');
    const voteDetail = await loadModule('public/frontend/public-vote-detail-layout.js');
    const resultsDetail = await loadModule('public/frontend/public-results-detail-layout.js');
    const creatorOwned = await loadModule('public/frontend/public-creator-owned-poll-layout.js');
    const createPollForm = await loadModule('public/frontend/public-create-poll-form-layout.js');

    expect(pollCard.PUBLIC_POLL_CARD_METADATA_LAYOUT_ORDER).toEqual([
      'title',
      'status-row',
      'meta',
      'hint-or-body',
      'footer-cta',
    ]);
    expect(unavailable.PUBLIC_UNAVAILABLE_STATE_LAYOUT_ORDER).toEqual([
      'title',
      'message',
      'summary',
      'cta',
    ]);
    expect(voteDetail.PUBLIC_VOTE_DETAIL_LAYOUT_ORDER).toEqual([
      'title',
      'status-meta',
      'pre-vote-hints',
      'options',
      'action-area',
      'unavailable-panel',
    ]);
    expect(resultsDetail.PUBLIC_RESULTS_DETAIL_LAYOUT_ORDER).toEqual([
      'title',
      'status-meta',
      'visibility-hints',
      'result-content',
      'unavailable-panel',
      'navigation-cta',
    ]);
    expect(creatorOwned.PUBLIC_CREATOR_OWNED_POLL_ACTION_LAYOUT_ORDER).toEqual([
      'title-status-meta',
      'lifecycle-hint',
      'primary-actions',
      'secondary-actions',
      'destructive-actions',
      'nav-links',
      'inline-feedback',
    ]);
    expect(createPollForm.PUBLIC_CREATE_POLL_FORM_LAYOUT_ORDER).toEqual([
      'page-title',
      'creator-guidance',
      'form-sections',
      'option-inputs',
      'schedule-lifecycle-hints',
      'preview-help',
      'submit-area',
      'inline-feedback',
    ]);
  });

  it('keeps layout helper modules presentation-only without fetch or storage', async () => {
    for (const relativePath of LAYOUT_HELPER_MODULES) {
      const source = stripJsComments(
        await readFile(join(process.cwd(), relativePath), 'utf8'),
      );
      expect(source, relativePath).not.toMatch(/\bfetch\b/);
      expect(source, relativePath).not.toMatch(FORBIDDEN_STORAGE);
      expect(source, relativePath).not.toMatch(FORBIDDEN_BACKEND_ECHO);
      expect(source, relativePath).not.toMatch(FORBIDDEN_AGGREGATE);
    }
  });

  it('keeps vote.html and results.html regions in hierarchy order', async () => {
    const voteHtml = await readFile(join(process.cwd(), 'public/vote.html'), 'utf8');
    const resultsHtml = await readFile(join(process.cwd(), 'public/results.html'), 'utf8');

    expect(voteHtml).toContain('id="poll-title"');
    expect(voteHtml).toContain('id="vote-detail-status-meta"');
    expect(voteHtml).toContain('id="vote-detail-pre-vote-hints"');
    expect(voteHtml).toContain('id="vote-detail-action-area"');
    expect(voteHtml).toContain('id="error-panel"');

    const voteTitle = indexOfRegion(voteHtml, 'id="poll-title"');
    const voteStatus = indexOfRegion(voteHtml, 'id="vote-detail-status-meta"');
    const votePreVote = indexOfRegion(voteHtml, 'id="vote-detail-pre-vote-hints"');
    const voteAction = indexOfRegion(voteHtml, 'id="vote-detail-action-area"');
    const voteUnavailable = indexOfRegion(voteHtml, 'id="error-panel"');
    expect(voteTitle).toBeLessThan(voteStatus);
    expect(voteStatus).toBeLessThan(votePreVote);
    expect(votePreVote).toBeLessThan(voteAction);
    expect(voteAction).toBeLessThan(voteUnavailable);

    expect(resultsHtml).toContain('id="results-detail-status-meta"');
    expect(resultsHtml).toContain('id="results-detail-visibility-hints"');
    expect(resultsHtml).toContain('id="results-detail-content"');
    expect(resultsHtml).toContain('id="error-panel"');
    expect(resultsHtml).toContain('id="bottom-nav"');

    const resultsTitle = indexOfRegion(resultsHtml, 'id="page-title"');
    const resultsStatus = indexOfRegion(resultsHtml, 'id="results-detail-status-meta"');
    const resultsVisibility = indexOfRegion(resultsHtml, 'id="results-detail-visibility-hints"');
    const resultsContent = indexOfRegion(resultsHtml, 'id="results-detail-content"');
    const resultsUnavailable = indexOfRegion(resultsHtml, 'id="error-panel"');
    const resultsNav = indexOfRegion(resultsHtml, 'id="bottom-nav"');
    expect(resultsTitle).toBeLessThan(resultsStatus);
    expect(resultsStatus).toBeLessThan(resultsVisibility);
    expect(resultsVisibility).toBeLessThan(resultsContent);
    expect(resultsContent).toBeLessThan(resultsUnavailable);
    expect(resultsUnavailable).toBeLessThan(resultsNav);
  });

  it('keeps create-poll.html regions in hierarchy order', async () => {
    const html = await readFile(join(process.cwd(), 'public/create-poll.html'), 'utf8');

    const titleIndex = indexOfRegion(html, 'id="create-poll-page-title"');
    const guidanceIndex = indexOfRegion(html, 'id="create-poll-creator-guidance"');
    const formSectionsIndex = indexOfRegion(html, 'id="create-poll-form-sections"');
    const optionsIndex = indexOfRegion(html, 'id="create-poll-option-inputs"');
    const scheduleIndex = indexOfRegion(html, 'id="create-poll-schedule-lifecycle-hints"');
    const previewIndex = indexOfRegion(html, 'id="create-poll-preview-help"');
    const submitIndex = indexOfRegion(html, 'id="create-poll-submit-area"');
    const feedbackIndex = indexOfRegion(html, 'id="form-message"');

    expect(titleIndex).toBeLessThan(guidanceIndex);
    expect(guidanceIndex).toBeLessThan(formSectionsIndex);
    expect(formSectionsIndex).toBeLessThan(optionsIndex);
    expect(optionsIndex).toBeLessThan(scheduleIndex);
    expect(scheduleIndex).toBeLessThan(previewIndex);
    expect(previewIndex).toBeLessThan(submitIndex);
    expect(submitIndex).toBeLessThan(feedbackIndex);
  });

  it('wires runtime pages to shared presentation helpers', async () => {
    const exploreSource = await readFile(
      join(process.cwd(), 'public/frontend/explore-page.js'),
      'utf8',
    );
    const voteSource = await readFile(join(process.cwd(), 'public/frontend/vote-page.js'), 'utf8');
    const resultSource = await readFile(
      join(process.cwd(), 'public/frontend/result-page.js'),
      'utf8',
    );
    const myPollsSource = await readFile(
      join(process.cwd(), 'public/frontend/my-polls-page.js'),
      'utf8',
    );
    const createPollSource = await readFile(
      join(process.cwd(), 'public/frontend/create-poll-page.js'),
      'utf8',
    );

    expect(exploreSource).toContain("from './public-poll-card.js'");
    expect(exploreSource).toContain("from './public-unavailable-state.js'");
    expect(voteSource).toContain("from './public-vote-detail-layout.js'");
    expect(voteSource).toContain('syncVoteDetailStatusMeta');
    expect(resultSource).toContain("from './public-results-detail-layout.js'");
    expect(resultSource).toContain('syncResultsDetailStatusMeta');
    expect(myPollsSource).toContain("from './public-creator-owned-poll-layout.js'");
    expect(myPollsSource).toContain("from './public-poll-card.js'");
    expect(myPollsSource).toContain("from './public-unavailable-state.js'");
    expect(createPollSource).toContain("from './public-create-poll-form-layout.js'");
  });

  it('keeps quality_badge presentation gate and non-ranking use', async () => {
    const badge = await loadModule('public/frontend/quality-feedback-badge.js');
    const badgeSource = await readFile(
      join(process.cwd(), 'public/frontend/quality-feedback-badge.js'),
      'utf8',
    );
    const pollCardSource = await readFile(
      join(process.cwd(), 'public/frontend/public-poll-card.js'),
      'utf8',
    );

    expect(badge.QUALITY_FEEDBACK_BADGE_LABEL).toBe('回饋良好');
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: 'positive_feedback' })).toBe(
      true,
    );
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: null })).toBe(false);
    expect(badge.shouldRenderQualityFeedbackBadge({ quality_badge: 'unexpected' })).toBe(false);
    expect(badgeSource).not.toMatch(FORBIDDEN_QUALITY_MISUSE);
    expect(pollCardSource).toContain('renderQualityFeedbackBadge');
    expect(pollCardSource).not.toMatch(FORBIDDEN_QUALITY_MISUSE);
  });

  it('keeps vote-by-index payload as option_index only', async () => {
    const votePage = await loadModule('public/frontend/vote-page.js');
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
      optionIndex: 2,
      userId: '44444444-4444-4444-8444-444444444444',
      fetchImpl,
    });

    const body = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body));
    expect(body).toEqual({ option_index: 2 });
    expect(JSON.stringify(body)).not.toMatch(/option_id|shard|vote_token|user_id/i);
  });

  it('keeps create poll submit payload unchanged', async () => {
    const { submitCreatePoll } = await loadModule('public/frontend/create-poll-page.js');
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        poll_id: '22222222-2222-4222-8222-222222222222',
        status: 'active',
        created_at: '2026-05-31T12:00:00.000Z',
      }),
    }));

    await submitCreatePoll({
      formValues: {
        title: '  示範問卷 ',
        description: '  說明 ',
        options: ['  甲  ', ' 乙 ', '', '   '],
      },
      fetchImpl,
      now: () => new Date('2026-05-31T12:00:00.000Z'),
    });

    expect(fetchImpl).toHaveBeenCalledWith('/creator/polls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '示範問卷',
        description: '說明',
        options: ['甲', '乙'],
        category: 'general',
        eligible_rule_id: null,
        closes_at: '2026-06-07T12:00:00.000Z',
        publish: true,
      }),
      credentials: 'same-origin',
    });
  });

  it('keeps creator lifecycle confirm and POST flow intact', async () => {
    const lifecycleSource = await readFile(
      join(process.cwd(), 'public/frontend/poll-lifecycle-controls.js'),
      'utf8',
    );

    expect(lifecycleSource).toContain('confirmLifecycleTransition');
    expect(lifecycleSource).toContain('postPollLifecycleTransition');
    expect(lifecycleSource).toContain('actionLayoutHosts');
    expect(lifecycleSource).toContain('/creator/polls/${encodeURIComponent(pollId)}');
  });

  it('keeps registration success without GET /users/me or Set-Cookie', async () => {
    const registration = await loadModule('public/frontend/registration-page.js');
    const registrationSource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/registration-page.js'), 'utf8'),
    );
    const fetchCalls: string[] = [];
    const fetchImpl = vi.fn(async (url: string) => {
      fetchCalls.push(String(url));
      return { status: 201 };
    });

    expect(registrationSource).toContain("fetchImpl('/registration'");
    expect(registrationSource).not.toMatch(/\/users\/me|Set-Cookie|login\/session/i);

    await registration.submitRegistrationRequest({
      profile: {
        display_name: 'Milestone User',
        birth_year_month: '1998-07',
        residential_region: 'TW-TPE',
      },
      credential: 'proof',
      fetchImpl,
    });
    expect(fetchCalls).toEqual(['/registration']);
  });

  it('keeps results collecting mode from exposing aggregate percentages', async () => {
    const resultPage = await loadModule('public/frontend/result-page.js');
    const resultSource = await readFile(
      join(process.cwd(), 'public/frontend/result-page.js'),
      'utf8',
    );

    expect(
      resultPage.resolveResultRenderMode({
        public_lifecycle_state: 'collecting',
        options: [
          { display_label: '甲', display_percentage: '42%', option_index: 0 },
        ],
      }),
    ).toBe('collecting');

    expect(resultSource).toContain('renderOptionLabelsList');
    expect(resultSource).toContain("normalized.mode === 'collecting'");
    expect(resultSource).toContain('result-percentage');
    expect(resultSource).toMatch(/renderOptionLabelsList[\s\S]*result-option-label-only/);
  });

  it('keeps presentation runtime modules free of storage and forbidden patterns', async () => {
    for (const relativePath of PRESENTATION_RUNTIME_MODULES) {
      const source = stripJsComments(
        await readFile(join(process.cwd(), relativePath), 'utf8'),
      );
      expect(source, relativePath).not.toMatch(FORBIDDEN_STORAGE);
      expect(source, relativePath).not.toMatch(FORBIDDEN_AGGREGATE);
    }
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
    expect(repository).not.toContain('Phase 245');
  });
});
