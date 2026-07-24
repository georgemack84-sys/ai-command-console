import type { StorybookConfig } from '@storybook/nextjs-vite';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Storybook is built outside Next's environment loader. Supply only the
// committed browser-safe test defaults when callers have not set a value.
const testEnvironment = resolve(
  fileURLToPath(new URL('../.env.test', import.meta.url)),
);
if (existsSync(testEnvironment)) {
  for (const line of readFileSync(testEnvironment, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && process.env[match[1]] === undefined)
      process.env[match[1]] = match[2];
  }
}

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-a11y'],
  framework: '@storybook/nextjs-vite',
};
export default config;
