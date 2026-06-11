import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const REVIEWED_VOTE_UX_FILES = [
  'public/frontend/vote-page.js',
  'public/frontend/public-mvp-ui.js',
  'public/frontend/official-vote-pre-vote-hints.js',
  'public/vote.html',
];

const FORBIDDEN_FIXTURE_COPY =
  /option_id|vote_token|token_sha256|shard_id|counter schema|raw denial|age_passed|region_passed|trust_passed|role_passed|profile eligibility detail/i;

const FORBIDDEN_OUTCOME_COPY =
  /你符合資格|你不符合資格|年齡門檻|地區條件|trust rule|role rule|重複投票|已投過票/i;

async function loadVotePageModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/vote-page.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

async function loadPublicMvpUiModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/public-mvp-ui.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

async function loadPreVoteHintsModule() {
  const url = pathToFileURL(
    join(process.cwd(), 'public/frontend/official-vote-pre-vote-hints.js'),
  ).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 112 vote UX error handling runtime review checkpoint', () => {
  it('keeps success copy generic without option or vote internals', async () => {
    const { VOTE_SUCCESS_MESSAGE, VOTE_SUCCESS_STATUS_MESSAGE } =
      await loadVotePageModule();
    const voteSource = await readFile(
      join(process.cwd(), 'public/frontend/vote-page.js'),
      'utf8',
    );

    expect(VOTE_SUCCESS_MESSAGE).toBe('投票已送出，感謝參與。');
    expect(VOTE_SUCCESS_STATUS_MESSAGE).toBe('投票已送出。');
    expect(VOTE_SUCCESS_MESSAGE).not.toMatch(/option|token|shard|counter/i);
    expect(VOTE_SUCCESS_STATUS_MESSAGE).not.toMatch(/option|token|shard|counter/i);
    expect(voteSource).toContain('VOTE_SUCCESS_MESSAGE');
    expect(voteSource).not.toMatch(/option_id|vote_token|token_sha256|shard_id/);
  });

  it('maps all API submit denials to one neutral bucket without echoing server payloads', async () => {
    const { submitVoteByIndex } = await loadVotePageModule();
    const { messageForVoteSubmitFailure, GENERIC_VOTE_SUBMIT_FAILURE } =
      await loadPublicMvpUiModule();

    expect(messageForVoteSubmitFailure()).toBe(GENERIC_VOTE_SUBMIT_FAILURE);

    const scenarios = [
      {
        status: 403,
        body: {
          error: 'POLL_FORBIDDEN',
          message: 'private option_index 0 option_id abc',
        },
      },
      {
        status: 409,
        body: { error: 'OFFICIAL_VOTE_DUPLICATE', message: 'already voted' },
      },
      {
        status: 400,
        body: { error: 'PROFILE_INELIGIBLE', message: 'age under 12 region TW-KHH' },
      },
      {
        status: 400,
        body: { error: 'TRUST_INELIGIBLE', message: 'trust level too low' },
      },
      {
        status: 400,
        body: { error: 'INVALID_OPTION', message: 'option_index out of range' },
      },
    ];

    for (const scenario of scenarios) {
      const fetchImpl = vi.fn(async () => ({
        ok: false,
        status: scenario.status,
        json: async () => scenario.body,
      }));

      await expect(
        submitVoteByIndex({
          pollId: '11111111-1111-4111-8111-111111111111',
          optionIndex: 0,
          userId: 'runtime-user-id',
          fetchImpl,
        }),
      ).rejects.toThrow(GENERIC_VOTE_SUBMIT_FAILURE);

      await expect(
        submitVoteByIndex({
          pollId: '11111111-1111-4111-8111-111111111111',
          optionIndex: 0,
          userId: 'runtime-user-id',
          fetchImpl,
        }),
      ).rejects.not.toThrow(/option_id|already voted|age under|trust level|out of range/i);
    }
  });

  it('uses transport-neutral copy for network submit failures', async () => {
    const { submitVoteByIndex } = await loadVotePageModule();
    const { VOTE_SUBMIT_TRANSPORT_FAILURE } = await loadPublicMvpUiModule();
    const fetchImpl = vi.fn(async () => {
      throw new Error('network down');
    });

    await expect(
      submitVoteByIndex({
        pollId: '11111111-1111-4111-8111-111111111111',
        optionIndex: 0,
        userId: 'runtime-user-id',
        fetchImpl,
      }),
    ).rejects.toThrow(VOTE_SUBMIT_TRANSPORT_FAILURE);
  });

  it('blocks voting when poll lifecycle is not collecting with neutral copy only', async () => {
    const publicUi = await loadPublicMvpUiModule();
    const votePage = await loadVotePageModule();

    expect(publicUi.isPollAcceptingVotes({ public_lifecycle_state: 'collecting' }))
      .toBe(true);
    expect(
      publicUi.messageForPollVotingBlocked({ public_lifecycle_state: 'revealed' }),
    ).toBe('此問卷已結束。');
    expect(
      publicUi.messageForPollVotingBlocked({ public_lifecycle_state: 'cancelled' }),
    ).toBe('此問卷目前無法使用。');
    expect(
      publicUi.messageForPollVotingBlocked({ status: 'closed' }),
    ).toBe('此問卷已截止，無法再投票。');

    const submitButton = {
      disabled: false,
      attributes: new Map<string, string>(),
      setAttribute(name: string, value: string) {
        this.attributes.set(name, value);
      },
    };
    const message = { textContent: '' };
    const collectingNotice = { hidden: false };

    const result = votePage.applyVotePageVotingAvailability({
      detail: { public_lifecycle_state: 'locked' },
      submitButton,
      message,
      collectingNotice,
    });

    expect(result.votingAllowed).toBe(false);
    expect(result.blockedMessage).toBe('此問卷已結束。');
    expect(submitButton.disabled).toBe(true);
    expect(message.textContent).toBe('此問卷已結束。');
    expect(collectingNotice.hidden).toBe(true);
  });

  it('keeps missing-selection validation client-side only', async () => {
    const { submitVoteByIndex, MISSING_SELECTION_MESSAGE } = await loadVotePageModule();
    const fetchImpl = vi.fn();

    await expect(
      submitVoteByIndex({
        pollId: '11111111-1111-4111-8111-111111111111',
        optionIndex: null,
        userId: 'runtime-user-id',
        fetchImpl,
      }),
    ).rejects.toThrow(MISSING_SELECTION_MESSAGE);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('clears page-local selected option after submit, pagehide, and BFCache restore', async () => {
    const votePage = await loadVotePageModule();
    const voteSource = await readFile(
      join(process.cwd(), 'public/frontend/vote-page.js'),
      'utf8',
    );

    expect(voteSource).toContain('let selectedOptionIndex = null');
    expect(voteSource).toContain('clearRuntimeMemory');
    expect(voteSource).toContain("windowObject.addEventListener('pagehide', clearRuntimeMemory)");
    expect(voteSource).toContain('event.persisted === true');

    const listeners = new Map<string, Array<(...args: unknown[]) => void>>();
    const windowObject = {
      addEventListener: (name: string, handler: (...args: unknown[]) => void) => {
        const bucket = listeners.get(name) ?? [];
        bucket.push(handler);
        listeners.set(name, bucket);
      },
    };
    let resetCount = 0;
    const controller = votePage.createVotePageController({
      pollId: '11111111-1111-4111-8111-111111111111',
      userId: 'runtime-user-id',
      windowObject,
      fetchImpl: vi.fn(async () => ({ ok: true })),
      resetSelectionUi: () => {
        resetCount += 1;
      },
    });

    controller.selectOption(1);
    expect(controller.hasSensitiveRuntimeState()).toBe(true);

    await controller.submit();
    expect(controller.hasSensitiveRuntimeState()).toBe(false);
    expect(resetCount).toBeGreaterThanOrEqual(1);

    controller.selectOption(2);
    for (const handler of listeners.get('pagehide') ?? []) {
      handler();
    }
    expect(controller.hasSensitiveRuntimeState()).toBe(false);

    controller.selectOption(0);
    for (const handler of listeners.get('pageshow') ?? []) {
      handler({ persisted: true });
    }
    expect(controller.hasSensitiveRuntimeState()).toBe(false);
  });

  it('keeps pre-vote hints as login/profile completion guidance only', async () => {
    const preVote = await loadPreVoteHintsModule();
    const preVoteSource = await readFile(
      join(process.cwd(), 'public/frontend/official-vote-pre-vote-hints.js'),
      'utf8',
    );

    const body = {
      birth_year_month: '1998-07',
      residential_region: 'TW-TPE',
      age_passed: false,
      region_passed: false,
      trust_passed: false,
      role_passed: false,
      can_vote: false,
      option_id: 'server-only-option-id',
    };

    expect(Object.keys(preVote.parsePreVoteProfile(body)).sort()).toEqual([
      'birth_year_month',
      'residential_region',
    ]);
    expect(preVoteSource).toContain('/users/me/profile');
    expect(preVoteSource).toContain("credentials: 'same-origin'");
    expect(preVoteSource).not.toMatch(
      /vote-by-index|\/polls\/[^'"]*\/vote|option_id|option_index|age_passed|region_passed|trust_passed|role_passed|can_vote|eligible|ineligible/i,
    );
  });

  for (const relativePath of REVIEWED_VOTE_UX_FILES) {
    it(`keeps Phase 112 reviewed vote UX copy neutral in ${relativePath}`, async () => {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');

      expect(source, relativePath).not.toMatch(FORBIDDEN_OUTCOME_COPY);
      expect(source, relativePath).not.toMatch(FORBIDDEN_FIXTURE_COPY);
    });
  }

  it('keeps Phase 112 user-visible expected messages free of forbidden internals', async () => {
    const { GENERIC_VOTE_SUBMIT_FAILURE, VOTE_SUBMIT_TRANSPORT_FAILURE } =
      await loadPublicMvpUiModule();
    const { MISSING_SELECTION_MESSAGE } = await loadVotePageModule();

    const userVisibleMessages = [
      GENERIC_VOTE_SUBMIT_FAILURE,
      VOTE_SUBMIT_TRANSPORT_FAILURE,
      MISSING_SELECTION_MESSAGE,
      '投票已送出，感謝參與。',
      '投票已送出。',
      '請先選擇一個選項。',
      '此問卷已結束。',
      '此問卷目前無法使用。',
      '此問卷已截止，無法再投票。',
    ];

    for (const message of userVisibleMessages) {
      expect(message).not.toMatch(FORBIDDEN_FIXTURE_COPY);
      expect(message).not.toMatch(FORBIDDEN_OUTCOME_COPY);
    }
  });
});
