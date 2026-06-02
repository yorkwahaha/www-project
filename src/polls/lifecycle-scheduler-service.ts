import { PollError } from './errors.js';
import type { PollRepository } from './repository.js';
import type { PublicLifecycleState } from './types.js';

export const DEFAULT_PUBLIC_LIFECYCLE_SCHEDULER_BATCH_LIMIT = 100;
export const MAX_PUBLIC_LIFECYCLE_SCHEDULER_BATCH_LIMIT = 100;

type SchedulerAdvancedState = Extract<
  PublicLifecycleState,
  'locked' | 'post_lock'
>;

export type PublicLifecycleSchedulerBatchResult = {
  candidate_count: number;
  advanced: Array<{
    poll_id: string;
    public_lifecycle_state: SchedulerAdvancedState;
  }>;
  failed: Array<{
    poll_id: string;
    error_code: string;
  }>;
};

export type PublicLifecycleSchedulerService = {
  runDuePublicLifecycleAdvancementBatch(
    limit?: number,
  ): Promise<PublicLifecycleSchedulerBatchResult>;
};

export function createPublicLifecycleSchedulerService(
  repository: PollRepository,
): PublicLifecycleSchedulerService {
  return {
    async runDuePublicLifecycleAdvancementBatch(
      limit = DEFAULT_PUBLIC_LIFECYCLE_SCHEDULER_BATCH_LIMIT,
    ) {
      assertValidBatchLimit(limit);
      const candidateIds =
        await repository.listPublicLifecycleSchedulerCandidateIds(limit);
      const result: PublicLifecycleSchedulerBatchResult = {
        candidate_count: candidateIds.length,
        advanced: [],
        failed: [],
      };
      for (const pollId of candidateIds) {
        try {
          const poll = await repository.advancePublicLifecycle(pollId);
          result.advanced.push({
            poll_id: poll.id,
            public_lifecycle_state: poll.public_lifecycle_state as SchedulerAdvancedState,
          });
        } catch (err) {
          if (!(err instanceof PollError)) {
            throw err;
          }
          result.failed.push({
            poll_id: pollId,
            error_code: err.code,
          });
        }
      }
      return result;
    },
  };
}

function assertValidBatchLimit(limit: number): void {
  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > MAX_PUBLIC_LIFECYCLE_SCHEDULER_BATCH_LIMIT
  ) {
    throw new RangeError(
      `Lifecycle scheduler batch limit must be an integer from 1 to ${MAX_PUBLIC_LIFECYCLE_SCHEDULER_BATCH_LIMIT}`,
    );
  }
}
