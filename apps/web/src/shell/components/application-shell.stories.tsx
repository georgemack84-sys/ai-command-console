import { Button } from '@/ui/components';

import { ApplicationShell } from './application-shell';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Shell/Application shell',
  component: ApplicationShell,
  parameters: {
    layout: 'fullscreen',
    nextjs: { navigation: { pathname: '/dashboard' } },
  },
} satisfies Meta<typeof ApplicationShell>;

export default meta;
type Story = StoryObj<typeof meta>;

const workspace = (
  <section>
    <h1>Workspace overview</h1>
    <p>
      Shell-owned regions remain stable while product content composes inside
      the main landmark.
    </p>
  </section>
);

const commonArgs = {
  children: workspace,
  headerActions: <Button size="small">Create</Button>,
  accountSlot: <Button variant="ghost">Account</Button>,
};

export const Expanded: Story = { args: commonArgs };

export const Collapsed: Story = {
  args: { ...commonArgs, defaultSidebarState: 'collapsed' },
};

export const Mobile: Story = {
  args: commonArgs,
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};

export const MobileDrawerOpen: Story = {
  args: { ...commonArgs, defaultMobileNavigationOpen: true },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};

export const LongNavigation: Story = {
  args: {
    ...commonArgs,
    headerTitle:
      'A deliberately long workspace title that remains readable when space narrows',
    navigation: Array.from({ length: 12 }, (_, index) => ({
      id: `destination-${index + 1}`,
      label: `Destination ${index + 1} with a descriptive label`,
      href: `/destination-${index + 1}`,
      indicator: String(index + 1).padStart(2, '0'),
    })),
    children: (
      <section>
        <h1>Long-content resilience</h1>
        {Array.from({ length: 24 }, (_, index) => (
          <p key={index}>Workspace content row {index + 1}</p>
        ))}
      </section>
    ),
  },
};
