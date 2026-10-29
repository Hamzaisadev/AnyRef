import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    fileParallelism: false,
    projects: [
      {
        test: {
          name: 'unit',
          include: ['tests/unit/**/*.test.ts', 'tests/fuzz/**/*.test.ts'],
          environment: 'node',
          globals: true,
        },
        resolve: {
          alias: {
            '@': path.resolve(__dirname, './src'),
            'server-only': path.resolve(__dirname, './tests/mocks/server-only.ts'),
          },
        },
      },
      {
        test: {
          name: 'integration',
          include: ['tests/integration/**/*.test.ts'],
          environment: 'node',
          globals: true,
          testTimeout: 30000,
          hookTimeout: 30000,
        },
        resolve: {
          alias: {
            '@': path.resolve(__dirname, './src'),
            'server-only': path.resolve(__dirname, './tests/mocks/server-only.ts'),
          },
        },
      },
    ],
  },
});
