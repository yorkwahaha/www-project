import { pathToFileURL } from 'node:url';
import { closePool, getPool } from './db/client.js';
import { createPublicLifecycleSchedulerService } from './polls/lifecycle-scheduler-service.js';
import { createPgPollRepository } from './polls/repository.js';
import { runLifecycleSchedulerCommand } from './polls/lifecycle-scheduler-runner.js';

export async function main(args: string[] = process.argv.slice(2)): Promise<number> {
  try {
    const scheduler = createPublicLifecycleSchedulerService(
      createPgPollRepository(getPool()),
    );
    return await runLifecycleSchedulerCommand(args, {
      scheduler,
      writeSummary: (message) => console.log(message),
      writeError: (message) => console.error(message),
    });
  } finally {
    await closePool();
  }
}

const isDirectRun =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  main()
    .then((exitCode) => {
      process.exitCode = exitCode;
    })
    .catch(() => {
      console.error('lifecycle-scheduler: fatal error');
      process.exitCode = 1;
    });
}
