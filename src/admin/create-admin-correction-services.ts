import type { Pool } from 'pg';
import type { AdminCorrectionServices } from '../http/admin-routes.js';
import { createCorrectionAuditReadService } from './correction-audit-read-service.js';
import { createPgCorrectionAuditReadRepository } from './correction-audit-read-repository.js';
import { createCorrectionApplyService } from './correction-apply-service.js';
import { createPgCorrectionApplyRepository } from './correction-apply-repository.js';
import { createCorrectionService } from './correction-service.js';
import { createPgCorrectionRepository } from './correction-repository.js';
import { createCorrectionDecisionService } from './correction-decision-service.js';
import { createPgCorrectionDecisionRepository } from './correction-decision-repository.js';
import { createSuspendedCorrectionApplyService } from './suspended-correction-apply-service.js';
import { createPgSuspendedCorrectionRepository } from './suspended-correction-repository.js';
import { createSuspendedCorrectionService } from './suspended-correction-service.js';

export type CreateAdminCorrectionServicesOptions = {
  now?: () => Date;
};

/** Wire all Phase 6B admin governance services from a single PostgreSQL pool. */
export function createAdminCorrectionServices(
  pool: Pool,
  options: CreateAdminCorrectionServicesOptions = {},
): AdminCorrectionServices {
  const serviceOptions = options.now ? { now: options.now } : {};
  const correctionRepo = createPgCorrectionRepository(pool);
  const suspendedRepo = createPgSuspendedCorrectionRepository(pool, correctionRepo);
  const decisionRepo = createPgCorrectionDecisionRepository(pool);
  const applyRepo = createPgCorrectionApplyRepository(pool);
  const auditReadRepo = createPgCorrectionAuditReadRepository(pool);

  return {
    auditReadService: createCorrectionAuditReadService(auditReadRepo),
    correctionService: createCorrectionService(correctionRepo, serviceOptions),
    decisionService: createCorrectionDecisionService(decisionRepo, serviceOptions),
    applyService: createCorrectionApplyService(applyRepo, serviceOptions),
    suspendedCorrectionService: createSuspendedCorrectionService(
      suspendedRepo,
      serviceOptions,
    ),
    suspendedApplyService: createSuspendedCorrectionApplyService(
      suspendedRepo,
      serviceOptions,
    ),
  };
}
