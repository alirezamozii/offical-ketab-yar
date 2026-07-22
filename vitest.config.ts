/**
 * vitest.config.ts
 * ---------------------------------------------------------------
 * Vitest configuration for the Ketab-Yar test suite.
 *
 * Design notes:
 *  - `environment: 'jsdom'` so any component-rendering test (the project
 *    will accumulate them over time) has a real DOM. Pure-logic tests are
 *    unaffected.
 *  - Path alias `@/*` → `src/*` mirrors tsconfig.json so tests can import
 *    `@/lib/typography` exactly like the production code.
 *  - `setupFiles: ['src/test/setup.ts']` runs once per worker before any
 *    test file: installs jest-dom matchers, mocks `next/navigation`,
 *    `next-auth/react`, `IntersectionObserver`, `matchMedia`, and `@/lib/db`
 *    so unit tests don't touch the SQLite database.
 *  - `globals: true` so `describe/it/expect` work without imports — matches
 *    the convention in the existing test files.
 *  - `coverage` is configured but not enforced in CI yet — `bun run test`
 *    runs `vitest run` (single pass, no watch).
 *
 * Owner: Tests + Monitoring (R2-I).
 */
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules/**', '.next/**', 'dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/lib/**/*.ts'],
      exclude: ['src/lib/**/__tests__/**', 'src/lib/**/*.d.ts'],
    },
  },
})
