import type { PollRow } from './types.js';

export function isPublicHiddenPoll(poll: PollRow | null | undefined): boolean {
  if (!poll) {
    return true;
  }
  return (
    poll.status === 'draft' ||
    poll.status === 'deleted' ||
    poll.status === 'suspended' ||
    poll.status === 'correction_pending'
  );
}

export function isPublicFeedEligible(poll: PollRow): boolean {
  return (
    poll.status === 'active' &&
    poll.published_at !== null &&
    poll.archived_at === null
  );
}

export function isPublicDirectReadable(poll: PollRow): boolean {
  if (isPublicHiddenPoll(poll)) {
    return false;
  }
  return poll.status === 'active' || poll.status === 'closed';
}

export function isPublicResultsReadable(poll: PollRow): boolean {
  return isPublicDirectReadable(poll);
}

export function isParticipationAllowed(
  poll: PollRow,
  now: Date = new Date(),
): boolean {
  if (poll.status !== 'active') {
    return false;
  }
  if (poll.archived_at !== null) {
    return false;
  }
  if (poll.closes_at.getTime() <= now.getTime()) {
    return false;
  }
  return true;
}

export function participationRejectionMessage(
  poll: PollRow,
  now: Date = new Date(),
): string {
  if (poll.status === 'closed') {
    return 'Poll is closed';
  }
  if (poll.archived_at !== null) {
    return 'Poll is archived';
  }
  if (poll.closes_at.getTime() <= now.getTime()) {
    return 'Poll is no longer accepting responses';
  }
  return 'Poll is not accepting responses';
}
