import type { Meta, StoryObj } from '@storybook/react';

function FocusSpecimen() {
  return (
    <main>
      <h1>Focus specimen</h1>
      <p>Use keyboard navigation to inspect production focus-visible tokens.</p>
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-3)',
          marginTop: 'var(--space-4)',
        }}
      >
        <button>Focusable button</button>
        <a href="#focus-target">Focusable link</a>
        <input aria-label="Focusable input" />
      </div>
    </main>
  );
}

export default {
  title: 'Foundations/Focus specimen',
  component: FocusSpecimen,
} satisfies Meta<typeof FocusSpecimen>;
export const Default: StoryObj<typeof FocusSpecimen> = {};
