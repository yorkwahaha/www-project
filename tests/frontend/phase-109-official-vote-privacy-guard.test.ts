import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

const REVIEWED_UI_COPY_FILES = [
  'public/vote.html',
  'public/profile.html',
  'public/registration.html',
  'public/frontend/official-vote-pre-vote-hints.js',
  'public/frontend/profile-completion-prompt.js',
  'public/frontend/profile-page.js',
  'public/frontend/public-mvp-ui.js',
  'public/frontend/policy-ui-placeholders.js',
];

const FRONTEND_RUNTIME_FILES = [
  'public/frontend/official-vote-pre-vote-hints.js',
  'public/frontend/vote-page.js',
  'public/frontend/profile-completion-prompt.js',
  'public/frontend/profile-page.js',
  'public/frontend/public-mvp-layout.js',
  'public/frontend/public-mvp-ui.js',
  'public/frontend/policy-ui-placeholders.js',
];

async function importFrontendModule(relativePath: string) {
  const url = pathToFileURL(join(process.cwd(), relativePath)).href;
  return import(/* @vite-ignore */ url);
}

describe('Phase 109 official vote privacy guard', () => {
  it('keeps pre-vote and profile prompt parsing limited to nullable profile fields', async () => {
    const preVote = await importFrontendModule(
      'public/frontend/official-vote-pre-vote-hints.js',
    );
    const profilePrompt = await importFrontendModule(
      'public/frontend/profile-completion-prompt.js',
    );
    const profilePage = await importFrontendModule(
      'public/frontend/profile-page.js',
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
    expect(Object.keys(profilePrompt.parseProfileForPrompt(body)).sort()).toEqual([
      'birth_year_month',
      'residential_region',
    ]);
    expect(
      preVote.isPreVoteProfileIncomplete({
        birth_year_month: '1998-07',
        residential_region: 'TW-TPE',
      }),
    ).toBe(false);
    expect(
      profilePrompt.isProfileIncomplete({
        birth_year_month: '1998-07',
        residential_region: null,
      }),
    ).toBe(true);

    const profile = profilePage.normalizeProfileFormInput({
      birthYearMonth: '1998-07',
      residentialRegion: 'TW-TPE',
    });
    expect(Object.keys(profile).sort()).toEqual([
      'birth_year_month',
      'residential_region',
    ]);
  });

  it('keeps vote-page option selection page-local and away from durable linkage surfaces', async () => {
    const voteSource = await readFile(
      join(process.cwd(), 'public/frontend/vote-page.js'),
      'utf8',
    );

    expect(voteSource).toContain('let selectedOptionIndex = null');
    expect(voteSource).toContain('clearRuntimeMemory');
    expect(voteSource).toContain("windowObject.addEventListener('pagehide', clearRuntimeMemory)");
    expect(voteSource).toContain("event.persisted === true");
    expect(voteSource).toContain('/vote-by-index');
    expect(voteSource).toContain('JSON.stringify({ option_index: optionIndex })');
    expect(voteSource).not.toMatch(
      /option_id|option_text|selected_option_index|localStorage|sessionStorage|indexedDB|document\.cookie|pushState|replaceState|navigator\.sendBeacon|console\.|analytics|metric|trace|error payload/i,
    );
  });

  it('keeps pre-vote UX and profile prompt out of vote APIs and option identity', async () => {
    const preVoteSource = await readFile(
      join(process.cwd(), 'public/frontend/official-vote-pre-vote-hints.js'),
      'utf8',
    );
    const promptSource = await readFile(
      join(process.cwd(), 'public/frontend/profile-completion-prompt.js'),
      'utf8',
    );
    const combined = `${preVoteSource}\n${promptSource}`;

    expect(combined).toContain('/users/me/profile');
    expect(combined).toContain("credentials: 'same-origin'");
    expect(combined).not.toMatch(
      /vote-by-index|\/polls\/[^'"]*\/vote|option_id|option_index|selectedOption|selected option|age_passed|region_passed|trust_passed|role_passed|can_vote|eligible|ineligible|window\.location|location\.assign|location\.replace/i,
    );
  });

  it('keeps registration outside login-state reads, profile prompts, pre-vote hints, vote, and Reference Answer', async () => {
    const registrationHtml = await readFile(
      join(process.cwd(), 'public/registration.html'),
      'utf8',
    );
    const registrationSource = await readFile(
      join(process.cwd(), 'public/frontend/registration-page.js'),
      'utf8',
    );

    expect(registrationHtml).toContain('data-login-state-read="disabled"');
    expect(registrationHtml).not.toMatch(
      /profile-completion-prompt|official-vote-pre-vote|users\/me|login\/session|reference-answer|vote-by-index/i,
    );
    expect(registrationSource).toContain("fetchImpl('/registration'");
    expect(registrationSource).toContain('Authorization: `Bearer ${credential}`');
    expect(registrationSource).toContain('body: JSON.stringify(profile)');
    expect(registrationSource).not.toMatch(
      /\/users\/me|\/login\/session|Set-Cookie|document\.cookie|profile-completion-prompt|official-vote-pre-vote|reference-answer|vote-by-index|option_id|option_text|selected_option_index|shard_id|token_sha256|www_session/i,
    );
  });

  it('keeps reviewed copy neutral and free of internal vote/session identifiers', async () => {
    const forbiddenOutcomeCopy =
      /你符合資格|你不符合資格|符合此問卷|不符合此問卷|年齡門檻|地區條件|trust rule|role rule|信任等級門檻|角色條件/i;
    const forbiddenInternalCopy =
      /option_id|vote_token|token_sha256|shard_id|session_id|www_session|\buser_id\b|selected_option_index|counter schema|vote token schema/i;

    for (const relativePath of REVIEWED_UI_COPY_FILES) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toMatch(forbiddenOutcomeCopy);
      expect(source, relativePath).not.toMatch(forbiddenInternalCopy);
    }
  });

  it('keeps shared frontend runtime free of observability and persistent option-linkage sinks', async () => {
    for (const relativePath of FRONTEND_RUNTIME_FILES) {
      const source = await readFile(join(process.cwd(), relativePath), 'utf8');
      expect(source, relativePath).not.toMatch(
        /navigator\.sendBeacon|console\.|analytics|apm\.|trace\.|debugPayload|errorPayload|localStorage|sessionStorage|indexedDB/i,
      );
    }
  });

  it('keeps login-state UI on GET /users/me display name only', async () => {
    const loginStateSource = await readFile(
      join(process.cwd(), 'public/frontend/login-state-read.js'),
      'utf8',
    );
    const loginStateUiSource = await readFile(
      join(process.cwd(), 'public/frontend/login-state-ui.js'),
      'utf8',
    );
    const layoutSource = await readFile(
      join(process.cwd(), 'public/frontend/public-mvp-layout.js'),
      'utf8',
    );

    expect(loginStateSource).toContain('/users/me');
    expect(loginStateSource).toContain('display_name');
    expect(loginStateSource).not.toMatch(
      /birth_year_month|residential_region|users\/me\/profile|option_id|option_index|poll_id|eligibility|can_vote/i,
    );
    expect(loginStateUiSource).toContain('display_name');
    expect(loginStateUiSource).not.toMatch(
      /birth_year_month|residential_region|users\/me\/profile|option_id|option_index|poll_id|eligibility|can_vote/i,
    );
    expect(layoutSource).toContain('mountLoginStateRead');
    expect(layoutSource).not.toMatch(/users\/me\/profile|birth_year_month|residential_region/);
  });
});
