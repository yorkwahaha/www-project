import type { PublicNoticeRepository } from './repository.js';
import type { PublicNoticeList } from './types.js';

export type PublicNoticeService = {
  listVisibleNoticesByPollId(pollId: string): Promise<PublicNoticeList>;
};

export function createPublicNoticeService(
  repository: PublicNoticeRepository,
): PublicNoticeService {
  return {
    async listVisibleNoticesByPollId(pollId) {
      const rows = await repository.listVisibleNoticesByPollId(pollId);
      return {
        notices: rows.map((row) => ({
          notice_id: row.id,
          poll_id: row.poll_id,
          notice_type: row.notice_type,
          title: row.title,
          body: row.body,
          created_at: row.created_at.toISOString(),
        })),
      };
    },
  };
}
