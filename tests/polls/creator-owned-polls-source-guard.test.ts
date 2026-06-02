import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('creator-owned poll list source guard', () => {
  it('uses a bounded deterministic polls-only query without option or counter joins', async () => {
    const source = await readFile(
      join(process.cwd(), 'src/polls/repository.ts'),
      'utf8',
    );
    const start = source.indexOf('async function listCreatorOwnedPolls(');
    const end = source.indexOf(
      'async function listPublicLifecycleSchedulerCandidateIds(',
      start,
    );
    const ownedList = source.slice(start, end);

    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    expect(ownedList).toContain('FROM polls');
    expect(ownedList).toContain("status NOT IN ('deleted', 'suspended', 'correction_pending')");
    expect(ownedList).toContain('archived_at IS NULL');
    expect(ownedList).toContain('ORDER BY created_at DESC, id ASC');
    expect(ownedList).toContain('LIMIT $2');
    expect(ownedList).not.toMatch(/\bJOIN\b/i);
    for (const forbidden of [
      'poll_options',
      'poll_option_vote_counters',
      'poll_vote_tokens',
      'poll_reference_answer_tokens',
    ]) {
      expect(ownedList).not.toContain(forbidden);
    }
  });
});
