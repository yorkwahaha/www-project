import { SUSPENDED_CORRECTION_NOTICE_TYPE } from '../admin/public-notice-content.js';
import { isPublicDirectReadable } from '../polls/public-visibility.js';
import type { PollRow } from '../polls/types.js';
import type { PublicNoticeRepository } from './repository.js';
import type { PublicNoticeRow } from './types.js';

export function createInMemoryPublicNoticeRepository(
  polls: ReadonlyMap<string, PollRow> = new Map(),
  notices: readonly unknown[] = [],
): PublicNoticeRepository {
  return {
    async listVisibleNoticesByPollId(pollId) {
      const poll = polls.get(pollId);
      if (!poll || !isPublicDirectReadable(poll)) {
        return [];
      }
      return notices
        .filter(isPublicNoticeRow)
        .filter(
          (notice) =>
            notice.poll_id === pollId &&
            notice.notice_type === SUSPENDED_CORRECTION_NOTICE_TYPE,
        )
        .sort(
          (a, b) =>
            a.created_at.getTime() - b.created_at.getTime() ||
            a.id.localeCompare(b.id),
        )
        .map(toPublicNoticeRow);
    },
  };
}

function isPublicNoticeRow(value: unknown): value is PublicNoticeRow {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  return (
    'id' in value &&
    typeof value.id === 'string' &&
    'poll_id' in value &&
    typeof value.poll_id === 'string' &&
    'notice_type' in value &&
    typeof value.notice_type === 'string' &&
    'title' in value &&
    typeof value.title === 'string' &&
    'body' in value &&
    typeof value.body === 'string' &&
    'created_at' in value &&
    value.created_at instanceof Date
  );
}

function toPublicNoticeRow(notice: PublicNoticeRow): PublicNoticeRow {
  return {
    id: notice.id,
    poll_id: notice.poll_id,
    notice_type: notice.notice_type,
    title: notice.title,
    body: notice.body,
    created_at: notice.created_at,
  };
}
