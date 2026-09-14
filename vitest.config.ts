import { defineConfig } from 'vitest/config';

// Standalone Vitest config — intentionally does NOT extend vite.config.ts so the
// TanStack Start / React plugins don't load under the edge-runtime test env.
// convex-test requires the edge-runtime environment and to be inlined.
export default defineConfig({
  test: {
    environment: 'edge-runtime',
    server: { deps: { inline: ['convex-test'] } },
    include: ['convex/**/*.test.ts', 'src/**/*.test.{ts,tsx}'],
  },
});
