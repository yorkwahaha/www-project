import type { CorrectionApplyRepository } from './correction-apply-repository.js';
import { AdminForbiddenError } from './errors.js';
import type { ApplyCorrectionRequestResult } from './types.js';

export type CorrectionApplyService = {
  applyCorrectionRequest(
    requestId: string,
    appliedByAdminId: string,
  ): Promise<ApplyCorrectionRequestResult>;
};

export type CreateCorrectionApplyServiceOptions = {
  now?: () => Date;
};

export function createCorrectionApplyService(
  repository: CorrectionApplyRepository,
  options: CreateCorrectionApplyServiceOptions = {},
): CorrectionApplyService {
  const now = options.now ?? (() => new Date());

  return {
    async applyCorrectionRequest(requestId, appliedByAdminId) {
      const admin = await repository.findActiveAdminByUserId(appliedByAdminId);
      if (!admin) {
        throw new AdminForbiddenError();
      }

      return repository.applyCorrectionRequestAtomic({
        requestId,
        appliedByAdminId,
        appliedAt: now(),
      });
    },
  };
}
