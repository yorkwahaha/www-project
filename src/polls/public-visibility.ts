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

function isPollOpenByCloseTime(poll: PollRow, now: Date): boolean {
  return poll.closes_at.getTime() > now.getTime();
}

export function isPublicFeedEligible(
  poll: PollRow,
  now: Date = new Date(),
): boolean {
  return (
    poll.status === 'active' &&
    poll.public_lifecycle_state === 'collecting' &&
    poll.published_at !== null &&
    poll.archived_at === null &&
    isPollOpenByCloseTime(poll, now)
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

export function isPublicAggregateResultsReadable(poll: PollRow): boolean {
  return (
    isPublicResultsReadable(poll) &&
    (
      poll.public_lifecycle_state === 'revealed' ||
      poll.public_lifecycle_state === 'locked' ||
      poll.public_lifecycle_state === 'post_lock'
    )
  );
}

/**
 * Phase 303 — coarse eligibility for the public home mixed feed (`GET /home/feed`).
 * A poll qualifies if it is either collecting-feed-eligible (rendered as a
 * collecting card) or publicly aggregate-readable (rendered as a revealed card).
 * The service still re-checks each gate per poll before emitting an item, so
 * this is only a pre-filter — never a visibility decision on its own.
 */
export function isPublicHomeFeedEligible(
  poll: PollRow,
  now: Date = new Date(),
): boolean {
  return isPublicFeedEligible(poll, now) || isPublicAggregateResultsReadable(poll);
}

export function isParticipationAllowed(
  poll: PollRow,
  now: Date = new Date(),
): boolean {
  if (poll.status !== 'active') {
    return false;
  }
  if (poll.public_lifecycle_state !== 'collecting') {
    return false;
  }
  if (poll.archived_at !== null) {
    return false;
  }
  if (!isPollOpenByCloseTime(poll, now)) {
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
  if (poll.public_lifecycle_state !== 'collecting') {
    return 'Poll is not collecting responses';
  }
  if (poll.archived_at !== null) {
    return 'Poll is archived';
  }
  if (poll.closes_at.getTime() <= now.getTime()) {
    return 'Poll is no longer accepting responses';
  }
  return 'Poll is not accepting responses';
}
