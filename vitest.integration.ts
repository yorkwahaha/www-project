import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/integration/**/*.pg.test.ts'],
    fileParallelism: false,
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    testTimeout: 30_000,
    hookTimeout: 60_000,
    globalSetup: ['./tests/helpers/pg-integration-global-setup.ts'],
  },
});
