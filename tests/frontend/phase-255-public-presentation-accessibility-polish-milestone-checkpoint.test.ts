import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_255_DOC =
  'docs/www-project-phase-255-public-presentation-accessibility-polish-milestone-checkpoint-v1.md';

const PHASE_DOCS = [
  'docs/www-project-phase-239-public-poll-card-metadata-layout-polish-v1.md',
  'docs/www-project-phase-240-public-poll-unavailable-state-presentation-polish-v1.md',
  'docs/www-project-phase-241-public-poll-detail-information-hierarchy-polish-v1.md',
  'docs/www-project-phase-242-public-results-detail-information-hierarchy-polish-v1.md',
  'docs/www-project-phase-243-creator-my-polls-action-hierarchy-polish-v1.md',
  'docs/www-project-phase-244-create-poll-form-information-hierarchy-polish-v1.md',
  'docs/www-project-phase-245-public-presentation-hierarchy-milestone-checkpoint-v1.md',
  'docs/www-project-phase-246-public-share-link-presentation-polish-v1.md',
  'docs/www-project-phase-247-public-share-link-runtime-review-checkpoint-v1.md',
  'docs/www-project-phase-248-public-copy-feedback-accessibility-polish-v1.md',
  'docs/www-project-phase-249-public-share-link-accessibility-runtime-review-checkpoint-v1.md',
  'docs/www-project-phase-250-public-page-keyboard-focus-polish-v1.md',
  'docs/www-project-phase-251-public-keyboard-focus-runtime-review-checkpoint-v1.md',
  'docs/www-project-phase-252-public-page-reduced-motion-safety-polish-plan-v1.md',
  'docs/www-project-phase-253-public-page-reduced-motion-css-only-polish-v1.md',
  'docs/www-project-phase-254-public-reduced-motion-runtime-review-checkpoint-v1.md',
] as const;

const LAYOUT_HELPER_MODULES = [
  'public/frontend/public-poll-card.js',
  'public/frontend/public-unavailable-state.js',
  'public/frontend/public-vote-detail-layout.js',
  'public/frontend/public-results-detail-layout.js',
  'public/frontend/public-creator-owned-poll-layout.js',
  'public/frontend/public-create-poll-form-layout.js',
  'public/frontend/public-share-link-layout.js',
  'public/frontend/public-keyboard-focus-a11y.js',
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

const PROTECTED_BACKEND_PATHS = [
  'src/http/official-vote-routes.ts',
  'src/http/creator-poll-routes.ts',
  'src/http/creator-session-routes.ts',
  'src/http/poll-routes.ts',
  'src/http/login-session-routes.ts',
  'src/http/registration-routes.ts',
  'src/http/user-profile-routes.ts',
  'src/auth/user-auth-resolver.ts',
  'src/polls/repository.ts',
] as const;

const PHASE_MARKERS = [
  'Phase 239',
  'Phase 240',
  'Phase 241',
  'Phase 242',
  'Phase 243',
  'Phase 244',
  'Phase 245',
  'Phase 246',
  'Phase 247',
  'Phase 248',
  'Phase 249',
  'Phase 250',
  'Phase 251',
  'Phase 252',
  'Phase 253',
  'Phase 254',
  'Phase 255',
] as const;

const FORBIDDEN_BACKEND_ECHO =
  /error\.message|body\.message|apiError\.message|response\.text\(\)|JSON\.stringify\(error/i;

const FORBIDDEN_STORAGE = /localStorage|sessionStorage|indexedDB|document\.cookie/i;

const FORBIDDEN_TRACKING = /analytics|datadog|sentry|apm|trackEvent|gtag\(/i;

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

describe('Phase 255 public presentation accessibility polish milestone checkpoint', () => {
  it('confirms Phase 239-254 primary docs exist', async () => {
    for (const relativePath of PHASE_DOCS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source.length, relativePath).toBeGreaterThan(0);
    }
  });

  it('confirms Phase 255 is docs/static only with README index reference', async () => {
    const doc = await readFile(join(process.cwd(), PHASE_255_DOC), 'utf8');
    const readme = await readFile(join(process.cwd(), 'README.md'), 'utf8');

    expect(doc).toContain('Phase 255');
    expect(doc).toContain('Public Presentation & Accessibility Polish Milestone Checkpoint');
    expect(doc).toContain('milestone checkpoint');
    expect(doc).toContain('no runtime change');
    expect(doc).toContain('no API change');
    expect(doc).toContain('no frontend behavior change');
    expect(doc).toContain('no migration');
    expect(doc).toContain('no schema change');
    expect(doc).toContain('no CSS/HTML/JS presentation changes');
    expect(doc).toContain(
      'APPROVED — Public presentation & accessibility polish milestone complete (Phase 239–254); no runtime/API/DB/backend/auth/vote/result/creator/profile/privacy drift identified.',
    );
    expect(doc).toContain('Phase 256 blockers: none identified');

    expect(readme).toContain('Phase 255');
    expect(readme).toContain(PHASE_255_DOC);
    expect(readme).toContain(
      'Public presentation & accessibility polish milestone checkpoint',
    );
  });

  it('keeps protected backend paths and migrations free of Phase 239-255 markers', async () => {
    for (const relativePath of PROTECTED_BACKEND_PATHS) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      for (const marker of PHASE_MARKERS) {
        expect(source, `${relativePath} must not contain ${marker}`).not.toContain(marker);
      }
    }

    const migrationDir = join(process.cwd(), 'migrations');
    const migrationFiles = await readdir(migrationDir);
    for (const fileName of migrationFiles) {
      const source = await readFile(join(migrationDir, fileName), 'utf8');
      for (const marker of PHASE_MARKERS) {
        expect(source, `migrations/${fileName} must not contain ${marker}`).not.toContain(
          marker,
        );
      }
    }
  });

  it('exports presentation layout and a11y order constants', async () => {
    const pollCard = await loadModule('public/frontend/public-poll-card.js');
    const unavailable = await loadModule('public/frontend/public-unavailable-state.js');
    const voteDetail = await loadModule('public/frontend/public-vote-detail-layout.js');
    const resultsDetail = await loadModule('public/frontend/public-results-detail-layout.js');
    const creatorOwned = await loadModule('public/frontend/public-creator-owned-poll-layout.js');
    const createPollForm = await loadModule('public/frontend/public-create-poll-form-layout.js');
    const shareLink = await loadModule('public/frontend/public-share-link-layout.js');
    const keyboardFocus = await loadModule('public/frontend/public-keyboard-focus-a11y.js');

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
    expect(shareLink.PUBLIC_SHARE_LINK_ROW_LAYOUT_ORDER).toEqual([
      'link-label',
      'copy-button',
      'inline-feedback',
      'fallback-url',
    ]);
    expect(shareLink.PUBLIC_SHARE_LINK_COPY_FEEDBACK_A11Y_ORDER).toEqual([
      'copy-button',
      'aria-live-feedback',
      'fallback-plain-url',
    ]);
    expect(keyboardFocus.PUBLIC_KEYBOARD_FOCUS_INTERACTIVE_ORDER).toBeDefined();
    expect(keyboardFocus.PUBLIC_KEYBOARD_FOCUS_SELECTOR_MAP).toBeDefined();
  });

  it('keeps layout helper modules presentation-only without fetch or storage', async () => {
    for (const relativePath of LAYOUT_HELPER_MODULES) {
      const source = stripJsComments(
        await readFile(join(process.cwd(), relativePath), 'utf8'),
      );
      expect(source, relativePath).not.toMatch(FORBIDDEN_STORAGE);
      expect(source, relativePath).not.toMatch(FORBIDDEN_BACKEND_ECHO);
      expect(source, relativePath).not.toMatch(FORBIDDEN_AGGREGATE);
      expect(source, relativePath).not.toMatch(FORBIDDEN_TRACKING);
    }

    const keyboardFocusSource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/public-keyboard-focus-a11y.js'), 'utf8'),
    );
    expect(keyboardFocusSource).not.toMatch(/addEventListener|focusTrap|focus-trap|\.focus\(/i);
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

  it('keeps create poll submit payload and creator lifecycle flow intact', async () => {
    const { submitCreatePoll } = await loadModule('public/frontend/create-poll-page.js');
    const lifecycleSource = await readFile(
      join(process.cwd(), 'public/frontend/poll-lifecycle-controls.js'),
      'utf8',
    );
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

    expect(lifecycleSource).toContain('confirmLifecycleTransition');
    expect(lifecycleSource).toContain('postPollLifecycleTransition');
    expect(lifecycleSource).toContain('/creator/polls/${encodeURIComponent(pollId)}');
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
        options: [{ display_label: '甲', display_percentage: '42%', option_index: 0 }],
      }),
    ).toBe('collecting');

    expect(resultSource).toContain('renderOptionLabelsList');
    expect(resultSource).toContain("normalized.mode === 'collecting'");
    expect(resultSource).toContain('result-percentage');
  });

  it('keeps share-link layout free of storage and tracking', async () => {
    const shareSource = stripJsComments(
      await readFile(join(process.cwd(), 'public/frontend/public-share-link-layout.js'), 'utf8'),
    );
    expect(shareSource).not.toMatch(FORBIDDEN_STORAGE);
    expect(shareSource).not.toMatch(FORBIDDEN_TRACKING);
    expect(shareSource).toContain('applyShareLinkCopyFeedback');
    expect(shareSource).toContain('aria-live');
  });

  it('keeps presentation runtime modules free of storage and forbidden patterns', async () => {
    for (const relativePath of PRESENTATION_RUNTIME_MODULES) {
      const source = stripJsComments(
        await readFile(join(process.cwd(), relativePath), 'utf8'),
      );
      expect(source, relativePath).not.toMatch(FORBIDDEN_STORAGE);
      expect(source, relativePath).not.toMatch(FORBIDDEN_AGGREGATE);
      expect(source, relativePath).not.toMatch(FORBIDDEN_TRACKING);
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
    expect(repository).not.toContain('Phase 255');
  });
});
