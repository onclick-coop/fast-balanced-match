import { defineConfig } from 'vite-plus'

export default defineConfig({
  pack: { entry: ['src/balanced.ts'], format: ['esm', 'cjs'], dts: true, platform: 'neutral' },
  test: {
    include: ['src/**/*.test.ts'],
    reporters: ['default', ['junit', { outputFile: 'coverage/junit.xml' }]],
    coverage: { provider: 'istanbul', include: ['src/**'], reporter: ['text-summary', 'lcov'] },
  },
  fmt: {
    printWidth: 240,
    semi: false,
    singleQuote: true,
    ignorePatterns: ['package.json', 'pnpm-lock.yaml'],
  },
  lint: {
    plugins: ['typescript', 'unicorn', 'oxc'],
    categories: { perf: 'error' },
    rules: {
      curly: ['error', 'multi-line'],
      'typescript/explicit-function-return-type': 'error',
      'typescript/explicit-module-boundary-types': 'error',
      'typescript/no-explicit-any': 'error',
      'typescript/no-non-null-assertion': 'error',
    },
    ignorePatterns: ['coverage/**'],
  },
})
