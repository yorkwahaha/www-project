import { createAdminCorrectionServices } from './admin/create-admin-correction-services.js';
import { getPool } from './db/client.js';
import { createHttpServer } from './http/server.js';
import { getHealthStatus, type HealthStatus } from './milestone.js';
import { createPgPollRepository } from './polls/repository.js';
import { createPollService } from './polls/service.js';
import type { PollService } from './polls/service.js';

export type WwwApp = {
  health(): HealthStatus;
  startHttpServer(port?: number): ReturnType<typeof createHttpServer>;
};

export function createApp(): WwwApp {
  return {
    health() {
      return getHealthStatus();
    },
    startHttpServer(port = Number(process.env.PORT ?? 3000)) {
      const pool = getPool();
      const pollService = createPollService(createPgPollRepository(pool));
      const server = createHttpServer({
        pollService,
        adminCorrection: createAdminCorrectionServices(pool),
      });
      server.listen(port);
      return server;
    },
  };
}

export function createAppWithPollService(pollService: PollService): WwwApp {
  return {
    health() {
      return getHealthStatus();
    },
    startHttpServer(port = Number(process.env.PORT ?? 3000)) {
      const server = createHttpServer({ pollService });
      server.listen(port);
      return server;
    },
  };
}
