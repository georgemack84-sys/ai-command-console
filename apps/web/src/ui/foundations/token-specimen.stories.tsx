import type { Meta, StoryObj } from '@storybook/react';

function TokenSpecimen() {
  return (
    <main>
      <h1>Token specimen</h1>
      <p style={{ color: 'var(--text-secondary)' }}>
        Semantic text and surface tokens.
      </p>
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-4)',
          marginTop: 'var(--space-6)',
        }}
      >
        <button
          style={{
            background: 'var(--action-primary-background)',
            color: 'var(--action-primary-foreground)',
            border: 0,
            borderRadius: 'var(--radius-md)',
            minHeight: 'var(--control-height-standard)',
            padding: '0 var(--space-4)',
          }}
        >
          Primary
        </button>
        <span
          style={{
            background: 'var(--feedback-success-background)',
            color: 'var(--feedback-success-foreground)',
            padding: 'var(--space-2)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          Success
        </span>
      </div>
    </main>
  );
}
export default {
  title: 'Foundations/Token specimen',
  component: TokenSpecimen,
} satisfies Meta<typeof TokenSpecimen>;
export const Default: StoryObj<typeof TokenSpecimen> = {};
