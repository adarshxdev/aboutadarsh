import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    setupFiles: ['./test/setup.ts'],
    // Each file gets fresh modules, so env set per file is honoured by env.ts.
    isolate: true,
  },
})
