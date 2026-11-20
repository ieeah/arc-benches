import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ['src/engine/**/*.ts'],
    ignores: ['src/engine/**/*.test.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'react', message: 'src/engine must remain framework-agnostic (no React).' },
            { name: 'react-dom', message: 'src/engine must remain framework-agnostic (no React DOM).' },
            { name: 'zustand', message: 'src/engine must not depend on Zustand.' },
            { name: '@/store', message: 'src/engine must not depend on @/store.' },
            { name: '@/i18n', message: 'src/engine must not depend on @/i18n.' },
          ],
          patterns: [
            { group: ['@/store/*'], message: 'src/engine must not depend on @/store/*.' },
            { group: ['@/components/*'], message: 'src/engine must not depend on @/components/*.' },
            { group: ['@/pages/*'], message: 'src/engine must not depend on @/pages/*.' },
            { group: ['@/i18n/*'], message: 'src/engine must not depend on @/i18n/*.' },
          ],
        },
      ],
    },
  },
])
