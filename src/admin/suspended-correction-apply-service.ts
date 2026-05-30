import { AdminForbiddenError } from './errors.js';
import type { SuspendedCorrectionRepository } from './suspended-correction-repository.js';
import type { ApplySuspendedCorrectionRequestResult } from './types.js';

export type SuspendedCorrectionApplyService = {
  applySuspendedCorrectionRequest(
    requestId: string,
    appliedByAdminId: string,
  ): Promise<ApplySuspendedCorrectionRequestResult>;
};

export type CreateSuspendedCorrectionApplyServiceOptions = {
  now?: () => Date;
};

export function createSuspendedCorrectionApplyService(
  repository: SuspendedCorrectionRepository,
  options: CreateSuspendedCorrectionApplyServiceOptions = {},
): SuspendedCorrectionApplyService {
  const now = options.now ?? (() => new Date());

  return {
    async applySuspendedCorrectionRequest(requestId, appliedByAdminId) {
      const admin = await repository.findActiveAdminByUserId(appliedByAdminId);
      if (!admin) {
        throw new AdminForbiddenError();
      }

      return repository.applySuspendedCorrectionRequestAtomic({
        requestId,
        appliedByAdminId,
        appliedAt: now(),
      });
    },
  };
}
