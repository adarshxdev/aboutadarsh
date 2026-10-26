import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import globals from 'globals'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

/**
 * One lint config for the monorepo: Next's rules (React, hooks, a11y, Core Web
 * Vitals) for apps/web, typescript-eslint for the API and shared package.
 */
const scope = (configs, files) => configs.map((c) => ({ ...c, files }))

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/next-env.d.ts',
      'test-results/**',
      'playwright-report/**',
    ],
  },

  // Web: Next.js
  ...scope([...nextVitals, ...nextTs], ['apps/web/**/*.{ts,tsx,js,mjs}']),
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    settings: { next: { rootDir: 'apps/web' } },
  },

  // API + shared: Node, TypeScript
  ...scope(
    [js.configs.recommended, ...tseslint.configs.recommended],
    ['apps/api/**/*.{ts,mjs}', 'packages/**/*.ts', 'e2e/**/*.ts', '*.{mjs,ts}'],
  ),
  {
    files: ['apps/api/**/*.{ts,mjs}', 'packages/**/*.ts', 'e2e/**/*.ts', '*.{mjs,ts}'],
    languageOptions: { globals: globals.node },
  },

  // React Three Fiber mutates three.js objects imperatively each frame by
  // design; the React Compiler purity/immutability rules don't apply there.
  {
    files: ['apps/web/src/components/immersive/stage/**'],
    rules: { 'react-hooks/immutability': 'off', 'react-hooks/purity': 'off' },
  },
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    rules: {
      // Kept visible as warnings: the remaining cases are deliberate one-shot syncs.
      'react-hooks/set-state-in-effect': 'warn',
      // pages/ doesn't exist (App Router only).
      '@next/next/no-html-link-for-pages': 'off',
    },
  },

  // Everyone
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
)
