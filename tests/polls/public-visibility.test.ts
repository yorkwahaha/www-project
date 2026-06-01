import { describe, expect, it } from 'vitest';
import {
  isParticipationAllowed,
  isPublicAggregateResultsReadable,
  isPublicDirectReadable,
  isPublicFeedEligible,
  isPublicHiddenPoll,
  isPublicResultsReadable,
} from '../../src/polls/public-visibility.js';
import type { PollRow } from '../../src/polls/types.js';

function poll(overrides: Partial<PollRow> = {}): PollRow {
  const now = new Date('2026-06-01T12:00:00.000Z');
  return {
    id: '11111111-1111-4111-8111-111111111111',
    creator_id: '22222222-2222-4222-8222-222222222222',
    title: 'Test',
    description: '',
    category: 'general',
    status: 'active',
    public_lifecycle_state: 'collecting',
    eligible_rule_id: null,
    published_at: now,
    archived_at: null,
    closes_at: new Date('2026-12-31T12:00:00.000Z'),
    deleted_at: null,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

describe('public visibility helpers', () => {
  it('marks governance and draft states as hidden', () => {
    for (const status of [
      'draft',
      'deleted',
      'suspended',
      'correction_pending',
    ] as const) {
      expect(isPublicHiddenPoll(poll({ status }))).toBe(true);
      expect(isPublicDirectReadable(poll({ status }))).toBe(false);
    }
  });

  it('allows direct and shell results read for active, closed, and archived active polls', () => {
    const active = poll({ status: 'active' });
    const closed = poll({ status: 'closed' });
    const archived = poll({
      status: 'active',
      archived_at: new Date('2026-06-02T00:00:00.000Z'),
    });

    expect(isPublicDirectReadable(active)).toBe(true);
    expect(isPublicResultsReadable(active)).toBe(true);
    expect(isPublicDirectReadable(closed)).toBe(true);
    expect(isPublicResultsReadable(closed)).toBe(true);
    expect(isPublicDirectReadable(archived)).toBe(true);
    expect(isPublicResultsReadable(archived)).toBe(true);
  });

  it('allows aggregate results only for explicit revealed lifecycle states', () => {
    for (const public_lifecycle_state of ['revealed', 'locked', 'post_lock'] as const) {
      expect(isPublicAggregateResultsReadable(poll({ public_lifecycle_state }))).toBe(true);
    }

    for (const public_lifecycle_state of [
      'draft',
      'collecting',
      'cancelled',
      'unpublished',
    ] as const) {
      expect(isPublicAggregateResultsReadable(poll({ public_lifecycle_state }))).toBe(
        false,
      );
    }
    expect(
      isPublicAggregateResultsReadable(
        poll({ status: 'closed', public_lifecycle_state: 'draft' }),
      ),
    ).toBe(false);
    expect(
      isPublicAggregateResultsReadable(
        poll({ status: 'suspended', public_lifecycle_state: 'revealed' }),
      ),
    ).toBe(false);
  });

  it('excludes archived polls from feed eligibility only', () => {
    const now = new Date('2026-06-01T12:00:00.000Z');
    const active = poll();
    const archived = poll({
      archived_at: new Date('2026-06-02T00:00:00.000Z'),
    });

    expect(isPublicFeedEligible(active, now)).toBe(true);
    expect(isPublicFeedEligible(archived, now)).toBe(false);
    expect(isPublicFeedEligible(poll({ status: 'closed' }), now)).toBe(false);
  });

  it('excludes active polls with expired closes_at from feed eligibility', () => {
    const now = new Date('2026-06-01T12:00:00.000Z');
    const open = poll({ closes_at: new Date('2026-12-31T12:00:00.000Z') });
    const expired = poll({ closes_at: new Date('2026-01-01T00:00:00.000Z') });

    expect(isPublicFeedEligible(open, now)).toBe(true);
    expect(isPublicFeedEligible(expired, now)).toBe(false);
    expect(isPublicDirectReadable(expired)).toBe(true);
    expect(isPublicResultsReadable(expired)).toBe(true);
  });

  it('allows participation only for unarchived active polls before closes_at', () => {
    const open = poll();
    const archived = poll({
      archived_at: new Date('2026-06-02T00:00:00.000Z'),
    });
    const closed = poll({ status: 'closed' });
    const expired = poll({
      closes_at: new Date('2020-01-01T00:00:00.000Z'),
    });

    expect(isParticipationAllowed(open)).toBe(true);
    expect(isParticipationAllowed(archived)).toBe(false);
    expect(isParticipationAllowed(closed)).toBe(false);
    expect(
      isParticipationAllowed(expired, new Date('2026-06-01T12:00:00.000Z')),
    ).toBe(false);
  });
});
