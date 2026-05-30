import type { PoolClient } from 'pg';
import type { InMemoryCorrectionRepository } from './in-memory-correction-repository.js';

/** Restore poll after a suspended-path correction request is rejected. No-op for active/closed polls. */
export async function restorePollToSuspendedIfCorrectionPending(
  client: PoolClient,
  pollId: string,
  updatedAt: Date,
): Promise<void> {
  await client.query(
    `UPDATE polls
     SET status = 'suspended', updated_at = $2
     WHERE id = $1 AND status = 'correction_pending'`,
    [pollId, updatedAt],
  );
}

export function restorePollToSuspendedIfCorrectionPendingInMemory(
  base: InMemoryCorrectionRepository,
  pollId: string,
  updatedAt: Date,
): void {
  const poll = base.polls.get(pollId);
  if (!poll || poll.status !== 'correction_pending') {
    return;
  }
  poll.status = 'suspended';
  poll.updated_at = updatedAt;
  base.polls.set(pollId, poll);
}
