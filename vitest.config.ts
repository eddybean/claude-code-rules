import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['src/__tests__/**/*.test.ts'],
    clearMocks: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'src/cli.ts',
        'src/__tests__/**',
        'src/i18n/en.ts',
        'src/i18n/ja.ts',
        'src/types.ts',
      ],
      reporter: ['text', 'lcov'],
    },
  },
});
