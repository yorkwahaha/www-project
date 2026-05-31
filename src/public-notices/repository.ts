import type { Pool } from 'pg';
import { SUSPENDED_CORRECTION_NOTICE_TYPE } from '../admin/public-notice-content.js';
import type { PublicNoticeRow } from './types.js';

export type PublicNoticeRepository = {
  listVisibleNoticesByPollId(pollId: string): Promise<PublicNoticeRow[]>;
};

export function createPgPublicNoticeRepository(pool: Pool): PublicNoticeRepository {
  return {
    async listVisibleNoticesByPollId(pollId) {
      const result = await pool.query<PublicNoticeRow>(
        `SELECT
           notice.id,
           notice.poll_id,
           notice.notice_type,
           notice.title,
           notice.body,
           notice.created_at
         FROM public_notices AS notice
         INNER JOIN polls AS poll ON poll.id = notice.poll_id
         WHERE notice.poll_id = $1
           AND notice.notice_type = $2
           AND poll.status IN ('active', 'closed')
         ORDER BY notice.created_at ASC, notice.id ASC`,
        [pollId, SUSPENDED_CORRECTION_NOTICE_TYPE],
      );
      return result.rows;
    },
  };
}
