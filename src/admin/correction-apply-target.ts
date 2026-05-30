import type { PoolClient } from 'pg';
import { CorrectionValidationError } from './errors.js';
import type { CorrectionRequestRow } from './types.js';

export function assertApplyTargetShape(request: CorrectionRequestRow): void {
  if (request.correction_target_field === 'option_text') {
    if (!request.correction_target_id) {
      throw new CorrectionValidationError(
        'correction_target_id is required for option_text corrections',
      );
    }
    return;
  }
  if (request.correction_target_id !== null) {
    throw new CorrectionValidationError(
      'correction_target_id must not be set for title or description corrections',
    );
  }
}

export async function applyTargetTextUpdate(
  client: PoolClient,
  request: CorrectionRequestRow,
  appliedAt: Date,
): Promise<number> {
  const field = request.correction_target_field;
  if (field === 'title') {
    const result = await client.query(
      `UPDATE polls
       SET title = $2, updated_at = $3
       WHERE id = $1 AND title = $4`,
      [request.poll_id, request.proposed_text, appliedAt, request.original_text],
    );
    return result.rowCount ?? 0;
  }
  if (field === 'description') {
    const result = await client.query(
      `UPDATE polls
       SET description = $2, updated_at = $3
       WHERE id = $1 AND description = $4`,
      [request.poll_id, request.proposed_text, appliedAt, request.original_text],
    );
    return result.rowCount ?? 0;
  }
  const result = await client.query(
    `UPDATE poll_options
     SET option_text = $3, updated_at = $4
     WHERE id = $1 AND poll_id = $2 AND option_text = $5`,
    [
      request.correction_target_id,
      request.poll_id,
      request.proposed_text,
      appliedAt,
      request.original_text,
    ],
  );
  return result.rowCount ?? 0;
}
