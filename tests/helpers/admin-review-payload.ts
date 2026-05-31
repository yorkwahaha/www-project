import { expect } from 'vitest';

export const ADMIN_REVIEW_DENIED_KEYS = [
  'admin_id',
  'requester_admin_id',
  'applied_by_admin_id',
  'created_by_admin_id',
  'peer_decisions',
  'final_decisions',
  'reason',
  'reason_code',
  'reason_text',
  'spread_score',
  'spread_score_at_submit',
  'spread_score_locked_until',
  'public_notice_id',
  'review_context',
  'authorization',
  'admin_auth_credentials_json',
  'admin_token',
  'opaque_token',
  'token_sha256',
  'token_digest',
  'admin_secret',
  'production_secret',
  'option_id',
  'selected_option_id',
  'selected_option_index',
  'user_id',
  'voter_id',
  'public_user_identity',
  'session_id',
  'device_id',
  'request_identity',
  'trace_id',
  'apm_trace_id',
  'ip_address',
  'vote_token',
  'reference_answer_token',
  'poll_vote_tokens',
  'poll_reference_answer_tokens',
  'shard_id',
  'option_vote_counters',
  'poll_option_vote_counters',
  'title',
  'body',
] as const;

export function assertNoAdminReviewDeniedKeys(
  value: unknown,
  deniedKeys: readonly string[] = ADMIN_REVIEW_DENIED_KEYS,
): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      assertNoAdminReviewDeniedKeys(item, deniedKeys);
    }
    return;
  }
  if (typeof value !== 'object' || value === null) {
    return;
  }
  for (const [key, item] of Object.entries(value)) {
    expect(deniedKeys).not.toContain(key);
    assertNoAdminReviewDeniedKeys(item, deniedKeys);
  }
}

export function expectOnlyKeys(
  value: Record<string, unknown>,
  allowedKeys: readonly string[],
): void {
  expect(Object.keys(value).sort()).toEqual([...allowedKeys].sort());
}
