import type { UserRow } from './types.js';

/** Matches `users.trust_level_check` in migrations. */
export const TRUST_LEVELS = ['low', 'official'] as const;

export type TrustLevel = (typeof TRUST_LEVELS)[number];

export function isTrustLevel(value: string): value is TrustLevel {
  return (TRUST_LEVELS as readonly string[]).includes(value);
}

export function isLowTrustUser(user: Pick<UserRow, 'trust_level'>): boolean {
  return user.trust_level === 'low';
}
