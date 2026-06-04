import type { PollEligibilityRuleRow, UserRow } from './types.js';

export function isProfileEligibleForOfficialVote(
  user: UserRow,
  rule: PollEligibilityRuleRow | null,
): boolean {
  if (!rule || rule.rule_type === 'unrestricted') {
    return true;
  }

  if (rule.rule_type === 'age' || rule.rule_type === 'age_region') {
    if (!user.birth_year_month || !birthMonthInRange(user.birth_year_month, rule)) {
      return false;
    }
  }

  if (rule.rule_type === 'region' || rule.rule_type === 'age_region') {
    if (!user.residential_region || !rule.allowed_regions.includes(user.residential_region)) {
      return false;
    }
  }

  return true;
}

function birthMonthInRange(
  birthYearMonth: Date,
  rule: Pick<PollEligibilityRuleRow, 'min_birth_year_month' | 'max_birth_year_month'>,
): boolean {
  const birthMonth = monthKey(birthYearMonth);
  return (
    (rule.min_birth_year_month === null || birthMonth >= monthKey(rule.min_birth_year_month)) &&
    (rule.max_birth_year_month === null || birthMonth <= monthKey(rule.max_birth_year_month))
  );
}

function monthKey(value: Date): number {
  return value.getUTCFullYear() * 12 + value.getUTCMonth();
}
