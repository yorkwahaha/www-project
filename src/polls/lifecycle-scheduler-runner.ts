import {
  MAX_PUBLIC_LIFECYCLE_SCHEDULER_BATCH_LIMIT,
  type PublicLifecycleSchedulerBatchResult,
  type PublicLifecycleSchedulerService,
} from './lifecycle-scheduler-service.js';

export type LifecycleSchedulerRunnerDependencies = {
  scheduler: PublicLifecycleSchedulerService;
  writeSummary(message: string): void;
  writeError(message: string): void;
};

export async function runLifecycleSchedulerCommand(
  args: string[],
  dependencies: LifecycleSchedulerRunnerDependencies,
): Promise<number> {
  let limit: number | undefined;
  try {
    limit = parseLimit(args);
  } catch {
    dependencies.writeError(
      `lifecycle-scheduler: usage: scheduler:lifecycle -- --limit <1..${MAX_PUBLIC_LIFECYCLE_SCHEDULER_BATCH_LIMIT}>`,
    );
    return 1;
  }

  let result: PublicLifecycleSchedulerBatchResult;
  try {
    result =
      await dependencies.scheduler.runDuePublicLifecycleAdvancementBatch(limit);
  } catch {
    dependencies.writeError('lifecycle-scheduler: run failed');
    return 1;
  }

  dependencies.writeSummary(formatSafeSummary(result));
  return result.failed.length === 0 ? 0 : 2;
}

function parseLimit(args: string[]): number | undefined {
  if (args.length === 0) {
    return undefined;
  }
  if (args.length !== 2 || args[0] !== '--limit') {
    throw new Error('Invalid lifecycle scheduler arguments');
  }
  const limit = Number(args[1]);
  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > MAX_PUBLIC_LIFECYCLE_SCHEDULER_BATCH_LIMIT
  ) {
    throw new Error('Invalid lifecycle scheduler batch limit');
  }
  return limit;
}

function formatSafeSummary(result: PublicLifecycleSchedulerBatchResult): string {
  const failedByCode: Record<string, number> = {};
  for (const failure of result.failed) {
    failedByCode[failure.error_code] = (failedByCode[failure.error_code] ?? 0) + 1;
  }
  const summary = {
    candidate_count: result.candidate_count,
    advanced_count: result.advanced.length,
    locked_count: result.advanced.filter(
      (poll) => poll.public_lifecycle_state === 'locked',
    ).length,
    post_lock_count: result.advanced.filter(
      (poll) => poll.public_lifecycle_state === 'post_lock',
    ).length,
    failed_count: result.failed.length,
    failed_by_code: Object.fromEntries(
      Object.entries(failedByCode).sort(([left], [right]) =>
        left.localeCompare(right),
      ),
    ),
  };
  return `lifecycle-scheduler: ${JSON.stringify(summary)}`;
}
