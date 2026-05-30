import { assertIntegrationDatabaseUrl } from './pg-integration.js';

export default function setup(): void {
  try {
    assertIntegrationDatabaseUrl();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(message);
    process.exit(1);
  }
}
