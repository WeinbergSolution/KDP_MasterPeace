import { defineConfig } from 'vitest/config';

// Integration config: runs ONLY the real-Postgres integration specs. Used by
// the `test-integration` target (npm run test:integration:postgres).
export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/libs/projects-prisma-integration',
  test: {
    name: 'projects-prisma-integration',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['src/**/*.integration.spec.{ts,mts,cts}'],
    hookTimeout: 240000,
    testTimeout: 60000,
    reporters: ['default'],
  },
}));
