import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  EmptyState,
  ErrorState,
  Field,
  IconButton,
  Input,
  LoadingState,
  Skeleton,
  Spinner,
  Textarea,
  UnavailableState,
} from './index';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Components/Core primitives',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const specimen = {
  display: 'grid',
  gap: 'var(--space-5)',
  maxWidth: 720,
} as const;

export const Actions: Story = {
  render: () => (
    <main style={specimen}>
      <h1>Actions</h1>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <Button>Primary action</Button>
        <Button variant="secondary">Secondary action</Button>
        <Button variant="outline">Outline action</Button>
        <Button variant="ghost">Ghost action</Button>
        <Button variant="danger">Destructive action</Button>
        <Button disabled>Disabled action</Button>
        <Button loading loadingLabel="Saving changes">
          Save changes
        </Button>
        <IconButton icon="+" label="Add item" />
      </div>
      <Button size="large">
        A deliberately longer action label that remains usable when space
        narrows
      </Button>
    </main>
  ),
};

export const Forms: Story = {
  render: () => (
    <main style={specimen}>
      <h1>Form controls</h1>
      <Field
        label="Project name"
        description="Use a short, recognizable name that teammates can distinguish."
        required
      >
        <Input placeholder="Proprium" autoComplete="organization" />
      </Field>
      <Field
        label="Description"
        description="Explain the outcome this project is intended to support."
        error="A description is required before the project can be created."
      >
        <Textarea rows={4} placeholder="Describe the project" />
      </Field>
      <Field label="Unavailable field">
        <Input
          disabled
          value="This value cannot currently be changed"
          readOnly
        />
      </Field>
    </main>
  ),
};

export const Cards: Story = {
  render: () => (
    <main style={specimen}>
      <h1>Cards</h1>
      <Card variant="elevated">
        <CardHeader>
          <CardTitle>
            Reusable content grouping with a long descriptive title
          </CardTitle>
          <CardDescription>
            Card title styling does not assign a heading level; consumers retain
            semantic control.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            Cards group related content without owning application behavior.
          </p>
        </CardContent>
        <CardFooter>
          <Button>Continue</Button>
          <Button variant="ghost">Cancel</Button>
        </CardFooter>
      </Card>
    </main>
  ),
};

export const Loading: Story = {
  render: () => (
    <main style={specimen}>
      <h1>Loading</h1>
      <LoadingState label="Loading projects…" />
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}
      >
        <Spinner size="small" />
        <Spinner label="Synchronizing" />
        <Spinner size="large" />
      </div>
      <Skeleton shape="text" />
      <Skeleton />
      <Skeleton shape="circle" />
    </main>
  ),
};

export const States: Story = {
  render: () => (
    <main style={specimen}>
      <h1>Reusable states</h1>
      <EmptyState
        title="No projects yet"
        description="Create a project to start organizing your work."
        action={<Button>Create project</Button>}
      />
      <ErrorState
        description="The project list could not be loaded. Your existing data has not been changed."
        onRetry={() => undefined}
      />
      <UnavailableState description="Project creation is temporarily paused while maintenance completes." />
    </main>
  ),
};
