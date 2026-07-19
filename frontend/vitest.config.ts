import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    // Scope to src/ so Vitest doesn't also try to run the Playwright specs under e2e/.
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
