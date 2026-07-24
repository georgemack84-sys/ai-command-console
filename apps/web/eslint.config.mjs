import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  globalIgnores([
    '.next/**',
    'node_modules/**',
    'coverage/**',
    'storybook-static/**',
    'dist/**',
    'out/**',
  ]),
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/config/environment.ts', 'src/test/**'],
    rules: {
      'no-debugger': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-restricted-properties': [
        'error',
        {
          object: 'process',
          property: 'env',
          message:
            'Use the validated configuration layer instead of process.env.',
        },
      ],
    },
  },
]);
