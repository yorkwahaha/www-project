import { pathToFileURL } from 'node:url';
import { createPhase0App } from './app.js';

/**
 * Phase 0 entry: minimal boot only. No poll, vote, or governance APIs.
 */
export function main(): { status: string; phase: number } {
  const app = createPhase0App();
  return app.health();
}

const isDirectRun =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  const health = main();
  console.log(JSON.stringify(health));
}
