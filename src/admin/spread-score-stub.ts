const HOURS_24_MS = 24 * 60 * 60 * 1000;
const DAYS_7_MS = 7 * 24 * 60 * 60 * 1000;

export type SpreadScoreStubFields = {
  spreadScoreAtSubmit: number;
  requiresDualAdmin: boolean;
  spreadScoreLockedUntil: Date;
  validUntil: Date;
};

/** MVP stub: fixed score and dual-admin until real Spread Score inputs exist (Phase 6B.4+). */
export function buildSpreadScoreStubFields(submittedAt: Date): SpreadScoreStubFields {
  return {
    spreadScoreAtSubmit: 0,
    requiresDualAdmin: true,
    spreadScoreLockedUntil: new Date(submittedAt.getTime() + HOURS_24_MS),
    validUntil: new Date(submittedAt.getTime() + DAYS_7_MS),
  };
}
