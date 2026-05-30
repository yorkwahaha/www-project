/** Delivery milestone label (Phase 0–5B). Not spec §32 Phase 5 completion. */
export const DELIVERY_MILESTONE = 'phase-0-5b' as const;

export type HealthStatus = {
  status: 'ok';
  milestone: typeof DELIVERY_MILESTONE;
};

export function getHealthStatus(): HealthStatus {
  return { status: 'ok', milestone: DELIVERY_MILESTONE };
}
