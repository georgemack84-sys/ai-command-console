import type { Meta, StoryObj } from '@storybook/react';
import { breakpoints } from '@/config/breakpoints';
function ResponsiveSpecimen() {
  return (
    <main>
      <h1>Responsive specimen</h1>
      <p>Canonical medium breakpoint: {breakpoints.medium}px</p>
    </main>
  );
}
export default {
  title: 'Foundations/Responsive specimen',
  component: ResponsiveSpecimen,
} satisfies Meta<typeof ResponsiveSpecimen>;
export const Default: StoryObj<typeof ResponsiveSpecimen> = {};
