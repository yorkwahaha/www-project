import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('lifecycle transition source guard', () => {
  it('keeps lifecycle writers counter-free and join-free', async () => {
    const source = await readFile(
      join(process.cwd(), 'src/polls/repository.ts'),
      'utf8',
    );
    const start = source.indexOf('async function cancelPoll(');
    const end = source.indexOf('async function optionBelongsToPoll(', start);
    const lifecycleWriters = source.slice(start, end);

    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    expect(lifecycleWriters).not.toMatch(/\bJOIN\b/i);
    expect(lifecycleWriters).not.toContain('poll_option_vote_counters');
    expect(lifecycleWriters).not.toContain('listVoteAggregatesByPollId');
  });

  it('keeps scheduler candidate discovery counter-free and join-free', async () => {
    const source = await readFile(
      join(process.cwd(), 'src/polls/repository.ts'),
      'utf8',
    );
    const start = source.indexOf(
      'async function listPublicLifecycleSchedulerCandidateIds(',
    );
    const end = source.indexOf('async function softDeletePoll(', start);
    const schedulerDiscovery = source.slice(start, end);

    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    expect(schedulerDiscovery).not.toMatch(/\bJOIN\b/i);
    expect(schedulerDiscovery).not.toContain('poll_option_vote_counters');
    expect(schedulerDiscovery).not.toContain('listVoteAggregatesByPollId');
  });
});
