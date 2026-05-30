/**
 * Phase 0 application shell. Feature APIs are added in later phases.
 */
export function createPhase0App() {
  return {
    health(): { status: string; phase: number } {
      return { status: 'ok', phase: 0 };
    },
  };
}
