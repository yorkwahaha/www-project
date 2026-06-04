import { describe, expect, it } from 'vitest';
import { isProfileEligibleForOfficialVote } from '../../src/polls/profile-eligibility.js';
import type { PollEligibilityRuleRow, UserRow } from '../../src/polls/types.js';

function user(profile: Partial<Pick<UserRow, 'birth_year_month' | 'residential_region'>>): UserRow {
  const now = new Date('2026-01-01T00:00:00.000Z');
  return {
    id: '11111111-1111-4111-8111-111111111111',
    display_name: 'Profile',
    trust_level: 'official',
    status: 'active',
    birth_year_month: profile.birth_year_month ?? null,
    residential_region: profile.residential_region ?? null,
    created_at: now,
    updated_at: now,
  };
}

function rule(input: Partial<PollEligibilityRuleRow>): PollEligibilityRuleRow {
  const now = new Date('2026-01-01T00:00:00.000Z');
  return {
    poll_id: '22222222-2222-4222-8222-222222222222',
    rule_type: 'unrestricted',
    min_birth_year_month: null,
    max_birth_year_month: null,
    allowed_regions: [],
    created_at: now,
    updated_at: now,
    ...input,
  };
}

describe('profile eligibility evaluator', () => {
  it('allows missing rules and unrestricted rules without requiring profile fields', () => {
    const profile = user({});

    expect(isProfileEligibleForOfficialVote(profile, null)).toBe(true);
    expect(isProfileEligibleForOfficialVote(profile, rule({ rule_type: 'unrestricted' }))).toBe(
      true,
    );
  });

  it('evaluates birth year-month ranges at month granularity only', () => {
    const eligible = user({ birth_year_month: new Date('2000-05-01T00:00:00.000Z') });
    const ageRule = rule({
      rule_type: 'age',
      min_birth_year_month: new Date('1990-01-01T00:00:00.000Z'),
      max_birth_year_month: new Date('2002-12-01T00:00:00.000Z'),
    });

    expect(isProfileEligibleForOfficialVote(eligible, ageRule)).toBe(true);
    expect(isProfileEligibleForOfficialVote(user({}), ageRule)).toBe(false);
    expect(
      isProfileEligibleForOfficialVote(
        user({ birth_year_month: new Date('2003-01-01T00:00:00.000Z') }),
        ageRule,
      ),
    ).toBe(false);
  });

  it('requires exact normalized region membership for region rules', () => {
    const regionRule = rule({
      rule_type: 'region',
      allowed_regions: ['TW-TPE', 'TW-KHH'],
    });

    expect(
      isProfileEligibleForOfficialVote(user({ residential_region: 'TW-KHH' }), regionRule),
    ).toBe(true);
    expect(
      isProfileEligibleForOfficialVote(user({ residential_region: 'TW-TNN' }), regionRule),
    ).toBe(false);
    expect(isProfileEligibleForOfficialVote(user({}), regionRule)).toBe(false);
  });

  it('requires both birth month and region for combined rules', () => {
    const combinedRule = rule({
      rule_type: 'age_region',
      min_birth_year_month: new Date('1980-01-01T00:00:00.000Z'),
      max_birth_year_month: new Date('2000-12-01T00:00:00.000Z'),
      allowed_regions: ['TW-KHH'],
    });

    expect(
      isProfileEligibleForOfficialVote(
        user({
          birth_year_month: new Date('1999-07-01T00:00:00.000Z'),
          residential_region: 'TW-KHH',
        }),
        combinedRule,
      ),
    ).toBe(true);
    expect(
      isProfileEligibleForOfficialVote(
        user({
          birth_year_month: new Date('1999-07-01T00:00:00.000Z'),
          residential_region: 'TW-TPE',
        }),
        combinedRule,
      ),
    ).toBe(false);
  });
});
