import type { Meta, StoryObj } from '@storybook/react';
import { Alert, ErrorState, UnavailableState } from './index';

function FeedbackSpecimen() {
  return (
    <main style={{ display: 'grid', gap: 'var(--space-4)', maxWidth: 640 }}>
      <h1>Feedback states</h1>
      <Alert title="Heads up">
        A configuration change will take effect after refresh.
      </Alert>
      <Alert variant="success" title="Saved">
        Your preferences have been updated.
      </Alert>
      <Alert variant="warning" title="Connection is slow">
        Some results may take longer to appear.
      </Alert>
      <Alert variant="error" title="Unable to save">
        Check your connection and try again.
      </Alert>
      <ErrorState onRetry={() => undefined} />
      <UnavailableState onRetry={() => undefined} />
    </main>
  );
}

export default {
  title: 'Components/Feedback',
  component: FeedbackSpecimen,
} satisfies Meta<typeof FeedbackSpecimen>;

export const Default: StoryObj<typeof FeedbackSpecimen> = {};
