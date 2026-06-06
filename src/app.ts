import { createUserAuthResolverFromEnv } from './auth/user-auth-resolver.js';
import { createProductionCredentialVerifierFromEnv } from './auth/production-credential-verifier.js';
import { createAdminCorrectionServices } from './admin/create-admin-correction-services.js';
import { createCreatorSessionConfigFromEnv } from './creator-sessions/config.js';
import { createPgCreatorSessionRepository } from './creator-sessions/repository.js';
import { createCreatorSessionService } from './creator-sessions/service.js';
import { getPool } from './db/client.js';
import { createAdminAuthFromEnv } from './http/admin-auth.js';
import { createHttpServer } from './http/server.js';
import { getHealthStatus, type HealthStatus } from './milestone.js';
import { createPgPollRepository } from './polls/repository.js';
import { createPollService } from './polls/service.js';
import type { PollService } from './polls/service.js';
import { createPgPublicNoticeRepository } from './public-notices/repository.js';
import { createPublicNoticeService } from './public-notices/service.js';
import { createLoginSessionConfigFromEnv } from './http/login-session-routes.js';
import { createPgUserSessionRepository } from './user-sessions/repository.js';

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
      const trustedCredentialVerifier = createProductionCredentialVerifierFromEnv();
      const userSessionRepository = createPgUserSessionRepository(pool);
      const pollRepository = createPgPollRepository(pool);
      const pollService = createPollService(pollRepository);
      const publicNoticeService = createPublicNoticeService(
        createPgPublicNoticeRepository(pool),
      );
      const creatorSessionConfig = createCreatorSessionConfigFromEnv();
      const server = createHttpServer({
        pollService,
        userAuthResolver: createUserAuthResolverFromEnv(process.env, {
          userSessionRepository,
        }),
        adminCorrection: createAdminCorrectionServices(pool),
        adminAuth: createAdminAuthFromEnv(),
        publicNoticeService,
        loginSession: trustedCredentialVerifier
          ? {
              repository: userSessionRepository,
              trustedCredentialVerifier,
              config: createLoginSessionConfigFromEnv(),
            }
          : undefined,
        registration: trustedCredentialVerifier
          ? {
              repository: pollRepository,
              trustedCredentialVerifier,
              config: createLoginSessionConfigFromEnv(),
            }
          : undefined,
        creatorSession: {
          config: creatorSessionConfig,
          service: createCreatorSessionService(
            createPgCreatorSessionRepository(pool),
            creatorSessionConfig,
          ),
        },
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
