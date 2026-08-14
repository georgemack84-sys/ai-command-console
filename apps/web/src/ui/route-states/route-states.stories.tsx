import { RouteLoadingState } from './route-loading-state';
import { RouteErrorState, RouteNotFoundState } from './route-terminal-states';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Patterns/Route states',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = {
  render: () => <RouteLoadingState />,
};

export const LongLoading: Story = {
  render: () => <RouteLoadingState blocks={6} label="Loading workspace…" />,
};

export const RecoverableError: Story = {
  render: () => <RouteErrorState onRetry={() => undefined} />,
};

export const ErrorWithLongCopy: Story = {
  render: () => (
    <RouteErrorState
      onRetry={() => undefined}
      description="We couldn't finish loading this page. The workspace remains available, and you can retry this route or return to a safe location without exposing any internal diagnostic information, response bodies, or exception details."
    />
  ),
};

export const NotFound: Story = {
  render: () => <RouteNotFoundState />,
};

export const NotFoundWithLongCopy: Story = {
  render: () => (
    <RouteNotFoundState description="The page or resource represented by this deliberately long location does not exist, may have moved, or is no longer available at the requested address." />
  ),
};
