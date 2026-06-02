import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import type {
  PublicLifecycleSchedulerBatchResult,
  PublicLifecycleSchedulerService,
} from '../../src/polls/lifecycle-scheduler-service.js';
import { runLifecycleSchedulerCommand } from '../../src/polls/lifecycle-scheduler-runner.js';

const pollId = '11111111-1111-4111-8111-111111111111';

function runner(result: PublicLifecycleSchedulerBatchResult) {
  const writeSummary = vi.fn();
  const writeError = vi.fn();
  const runDuePublicLifecycleAdvancementBatch = vi.fn(async () => result);
  const scheduler: PublicLifecycleSchedulerService = {
    runDuePublicLifecycleAdvancementBatch,
  };
  return {
    execute: (args: string[] = []) =>
      runLifecycleSchedulerCommand(args, { scheduler, writeSummary, writeError }),
    runDuePublicLifecycleAdvancementBatch,
    writeSummary,
    writeError,
  };
}

describe('lifecycle scheduler runner', () => {
  it('runs a default no-op batch and prints a safe operational summary', async () => {
    const command = runner({ candidate_count: 0, advanced: [], failed: [] });

    await expect(command.execute()).resolves.toBe(0);
    expect(command.runDuePublicLifecycleAdvancementBatch).toHaveBeenCalledWith(
      undefined,
    );
    expect(command.writeSummary).toHaveBeenCalledWith(
      'lifecycle-scheduler: {"candidate_count":0,"advanced_count":0,"locked_count":0,"post_lock_count":0,"failed_count":0,"failed_by_code":{}}',
    );
    expect(command.writeError).not.toHaveBeenCalled();
  });

  it('accepts the bounded maximum limit', async () => {
    const command = runner({ candidate_count: 0, advanced: [], failed: [] });

    await expect(command.execute(['--limit', '100'])).resolves.toBe(0);
    expect(command.runDuePublicLifecycleAdvancementBatch).toHaveBeenCalledWith(100);
  });

  it.each([
    ['--limit', '101'],
    ['--limit', '0'],
    ['--limit', '1.5'],
    ['--limit'],
    ['--unknown', '1'],
  ])('rejects invalid arguments without running a batch: %j', async (flag, value) => {
    const command = runner({ candidate_count: 0, advanced: [], failed: [] });
    const args = value === undefined ? [flag] : [flag, value];

    await expect(command.execute(args)).resolves.toBe(1);
    expect(command.runDuePublicLifecycleAdvancementBatch).not.toHaveBeenCalled();
    expect(command.writeSummary).not.toHaveBeenCalled();
    expect(command.writeError).toHaveBeenCalledWith(
      'lifecycle-scheduler: usage: scheduler:lifecycle -- --limit <1..100>',
    );
  });

  it('reports malformed-row failures without logging poll identifiers', async () => {
    const command = runner({
      candidate_count: 2,
      advanced: [{ poll_id: pollId, public_lifecycle_state: 'locked' }],
      failed: [
        { poll_id: pollId, error_code: 'LIFECYCLE_CONFLICT' },
      ],
    });

    await expect(command.execute()).resolves.toBe(2);
    const summary = command.writeSummary.mock.calls[0]![0];
    expect(summary).toContain('"candidate_count":2');
    expect(summary).toContain('"locked_count":1');
    expect(summary).toContain('"failed_count":1');
    expect(summary).toContain('"LIFECYCLE_CONFLICT":1');
    expect(summary).not.toContain(pollId);
    expect(summary).not.toMatch(/option_id|user_id|timestamp|request|trace/i);
  });

  it('uses a generic error message for unexpected failures', async () => {
    const writeSummary = vi.fn();
    const writeError = vi.fn();
    const scheduler: PublicLifecycleSchedulerService = {
      runDuePublicLifecycleAdvancementBatch: vi.fn(async () => {
        throw new Error(`sensitive ${pollId}`);
      }),
    };

    await expect(
      runLifecycleSchedulerCommand([], { scheduler, writeSummary, writeError }),
    ).resolves.toBe(1);
    expect(writeSummary).not.toHaveBeenCalled();
    expect(writeError).toHaveBeenCalledWith('lifecycle-scheduler: run failed');
    expect(writeError.mock.calls[0]![0]).not.toContain(pollId);
  });

  it('is not imported by normal HTTP application startup', async () => {
    const app = await readFile(join(process.cwd(), 'src/app.ts'), 'utf8');
    const server = await readFile(join(process.cwd(), 'src/http/server.ts'), 'utf8');
    const packageJson = JSON.parse(
      await readFile(join(process.cwd(), 'package.json'), 'utf8'),
    ) as { scripts: Record<string, string> };

    expect(app).not.toContain('lifecycle-scheduler');
    expect(server).not.toContain('lifecycle-scheduler');
    expect(packageJson.scripts['scheduler:lifecycle']).toBe(
      'node dist/lifecycle-scheduler.js',
    );
  });
});
