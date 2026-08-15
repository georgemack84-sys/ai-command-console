import '../src/styles/index.css';
import { breakpoints } from '../src/config/breakpoints';
import { StorybookProviders } from '../src/providers/storybook-providers';

import type { Preview } from '@storybook/react';

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Theme preference',
      toolbar: { icon: 'paintbrush', items: ['light', 'dark', 'system'] },
    },
  },
  initialGlobals: { theme: 'system' },
  parameters: {
    nextjs: { appDirectory: true },
    viewport: {
      viewports: Object.fromEntries(
        (['compact', 'small', 'medium', 'large', 'wide'] as const).map(
          (name) => [
            name,
            {
              name,
              styles: {
                width: `${Math.max(320, breakpoints[name])}px`,
                height: '900px',
              },
            },
          ],
        ),
      ),
    },
  },
  decorators: [
    (Story, context) => {
      const preference = context.globals.theme as 'light' | 'dark' | 'system';
      if (typeof window !== 'undefined')
        localStorage.setItem('proprium.theme.preference', preference);
      return (
        <StorybookProviders key={preference}>
          <Story />
        </StorybookProviders>
      );
    },
  ],
};
export default preview;
