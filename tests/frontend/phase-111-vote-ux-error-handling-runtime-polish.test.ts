import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';

const PHASE_111_FRONTEND_FILES = [
  'public/frontend/vote-page.js',
  'public/frontend/public-mvp-ui.js',
  'public/frontend/official-vote-pre-vote-hints.js',
];

const FORBIDDEN_FIXTURE_COPY =
  /option_id|vote_token|token_sha256|shard_id|counter schema|raw denial|age_passed|region_passed|trust_passed|role_passed|profile eligibility detail/i;

const FORBIDDEN_OUTCOME_COPY =
  /你符合資格|你不符合資格|年齡門檻|地區條件|trust rule|role rule/i;

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

describe('Phase 111 vote UX error handling runtime polish', () => {
  it('maps submit API denials to one neutral bucket', async () => {
    const { submitVoteByIndex } = await loadVotePageModule();
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
      ).rejects.toThrow('目前無法完成這次投票。');
    }
  });

  it('uses transport-neutral copy for network submit failures', async () => {
    const { submitVoteByIndex } = await loadVotePageModule();
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
    ).rejects.toThrow('目前無法送出投票，請稍後再試。');
  });

  it('blocks voting when poll lifecycle is not collecting', async () => {
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

  it('keeps success copy generic without option or vote internals', async () => {
    const { VOTE_SUCCESS_MESSAGE, VOTE_SUCCESS_STATUS_MESSAGE } =
      await loadVotePageModule();
    const voteSource = await readFile(
      join(process.cwd(), 'public/frontend/vote-page.js'),
      'utf8',
    );

    expect(VOTE_SUCCESS_MESSAGE).toBe('投票已送出，感謝參與。');
    expect(VOTE_SUCCESS_STATUS_MESSAGE).toBe('投票已送出。');
    expect(voteSource).toContain('VOTE_SUCCESS_MESSAGE');
    expect(voteSource).not.toMatch(/option_id|vote_token|token_sha256|shard_id/);
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

  for (const relativePath of PHASE_111_FRONTEND_FILES) {
    it(`keeps Phase 111 vote UX copy neutral in ${relativePath}`, async () => {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');

      expect(source, relativePath).not.toMatch(FORBIDDEN_OUTCOME_COPY);
      expect(source, relativePath).not.toMatch(FORBIDDEN_FIXTURE_COPY);
    });
  }
});
