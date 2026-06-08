import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const PHASE_106_FRONTEND_COPY_FILES = [
  'public/vote.html',
  'public/frontend/official-vote-pre-vote-hints.js',
  'public/frontend/public-mvp-ui.js',
  'public/frontend/policy-ui-placeholders.js',
];

const FORBIDDEN_OUTCOME_COPY =
  /你符合資格|你不符合資格|符合資格者|不符合資格|符合此問卷|不符合此問卷|年齡門檻|地區條件/i;

const FORBIDDEN_INTERNAL_FIELDS =
  /option_id|vote_token|token_sha256|shard_id|session_id|www_session|\bcookie\b|\buser_id\b/i;

describe('Phase 106 official vote pre-vote eligibility copy guard', () => {
  for (const relativePath of PHASE_106_FRONTEND_COPY_FILES) {
    it(`keeps Phase 106 vote copy neutral in ${relativePath}`, async () => {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');

      expect(source, relativePath).not.toMatch(FORBIDDEN_OUTCOME_COPY);
      expect(source, relativePath).not.toMatch(FORBIDDEN_INTERNAL_FIELDS);
    });
  }

  it('keeps vote submit failure and success copy generic', async () => {
    const uiSource = await readFile(
      join(process.cwd(), 'public/frontend/public-mvp-ui.js'),
      'utf8',
    );
    const voteSource = await readFile(
      join(process.cwd(), 'public/frontend/vote-page.js'),
      'utf8',
    );

    expect(uiSource).toContain('GENERIC_VOTE_SUBMIT_FAILURE');
    expect(uiSource).toContain('目前無法完成這次投票');
    expect(uiSource).not.toMatch(/PROFILE_INELIGIBLE[\s\S]*不符合|POLL_FORBIDDEN[\s\S]*不符合/);

    expect(voteSource).toContain('投票已送出，感謝參與。');
    expect(voteSource).not.toMatch(/option_id|vote_token|token_sha256|counter|shard_id/);
  });

  it('keeps Raw Option Linkage Ban intact for the pre-vote hint runtime', async () => {
    const source = await readFile(
      join(process.cwd(), 'public/frontend/official-vote-pre-vote-hints.js'),
      'utf8',
    );

    expect(source).not.toMatch(
      /option_id|option_index|option choice|selected option|device|request id|trace|metric|error payload|analytics|localStorage|sessionStorage|indexedDB/i,
    );
    expect(source).toContain('/users/me/profile');
    expect(source).toContain("credentials: 'same-origin'");
  });
});
