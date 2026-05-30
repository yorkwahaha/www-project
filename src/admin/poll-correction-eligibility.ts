import type { PollStatus } from '../polls/types.js';

export function isPollEligibleForCorrectionRequest(status: PollStatus): boolean {
  return status === 'active' || status === 'closed';
}

export function isPollEligibleForSuspendedCorrectionRequest(status: PollStatus): boolean {
  return status === 'suspended';
}

export function isPollEligibleForSuspendedCorrectionApply(status: PollStatus): boolean {
  return status === 'correction_pending';
}
