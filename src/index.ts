import { pathToFileURL } from 'node:url';
import { createApp } from './app.js';

export function main(): { status: string; phase: number } {
  const app = createApp();
  const port = Number(process.env.PORT ?? 3000);
  app.startHttpServer(port);
  console.log(`WWW Project listening on port ${port}`);
  return app.health();
}

const isDirectRun =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  main();
}
