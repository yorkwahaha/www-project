import type { PollStatus } from '../polls/types.js';

export function isPollEligibleForCorrectionRequest(status: PollStatus): boolean {
  return status === 'active' || status === 'closed';
}
