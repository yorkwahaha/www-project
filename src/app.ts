import { getPool } from './db/client.js';
import { createHttpServer } from './http/server.js';
import { createPgPollRepository } from './polls/repository.js';
import { createPollService } from './polls/service.js';
import type { PollService } from './polls/service.js';

export type WwwApp = {
  health(): { status: string; phase: number };
  startHttpServer(port?: number): ReturnType<typeof createHttpServer>;
};

export function createApp(): WwwApp {
  return {
    health() {
      return { status: 'ok', phase: 2 };
    },
    startHttpServer(port = Number(process.env.PORT ?? 3000)) {
      const pollService = createPollService(createPgPollRepository(getPool()));
      const server = createHttpServer({ pollService });
      server.listen(port);
      return server;
    },
  };
}

export function createAppWithPollService(pollService: PollService): WwwApp {
  return {
    health() {
      return { status: 'ok', phase: 2 };
    },
    startHttpServer(port = Number(process.env.PORT ?? 3000)) {
      const server = createHttpServer({ pollService });
      server.listen(port);
      return server;
    },
  };
}
