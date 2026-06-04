import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Official Vote source guard', () => {
  it('uses backend crypto.randomInt and no SQL random for shard selection', async () => {
    const service = await readFile(join(process.cwd(), 'src/polls/service.ts'), 'utf8');
    const repository = await readFile(join(process.cwd(), 'src/polls/repository.ts'), 'utf8');

    expect(service).toContain("import { randomInt } from 'node:crypto'");
    expect(service).toContain('randomInt(0, SHARD_COUNT)');
    expect(repository).toContain('const shardId = selectShardId();');
    expect(repository.toLowerCase()).not.toMatch(/\brandom\s*\(/);
  });

  it('checks profile eligibility before option resolution, token write, and counter increment', async () => {
    const repository = await readFile(join(process.cwd(), 'src/polls/repository.ts'), 'utf8');
    const transactionStart = repository.indexOf('async function castOfficialVote(');
    const transactionEnd = repository.indexOf('async function resolveOfficialVoteOptionIdWithClient');
    const transactionBody = repository.slice(transactionStart, transactionEnd);
    const eligibilityRuleLookup = transactionBody.indexOf('findPollEligibilityRuleWithClient');
    const eligibilityCheck = transactionBody.indexOf('isProfileEligibleForOfficialVote');
    const optionResolution = transactionBody.indexOf('resolveOfficialVoteOptionIdWithClient');
    const tokenWrite = transactionBody.indexOf('insertVoteToken');
    const counterIncrement = transactionBody.indexOf('incrementVoteCounter');

    expect(transactionStart).toBeGreaterThan(-1);
    expect(transactionEnd).toBeGreaterThan(transactionStart);
    expect(eligibilityRuleLookup).toBeGreaterThan(-1);
    expect(eligibilityCheck).toBeGreaterThan(eligibilityRuleLookup);
    expect(eligibilityCheck).toBeLessThan(optionResolution);
    expect(eligibilityCheck).toBeLessThan(tokenWrite);
    expect(eligibilityCheck).toBeLessThan(counterIncrement);
  });
});
