import {
  Button,
  Card,
  EmptyState,
  Field,
  IconButton,
  Input,
  Skeleton,
  Spinner,
  Textarea,
} from './index';

import type { Meta, StoryObj } from '@storybook/react';

function PrimitiveSpecimen() {
  return (
    <main style={{ display: 'grid', gap: 'var(--space-5)', maxWidth: 640 }}>
      <section>
        <h1>Core components</h1>
        <div
          style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}
        >
          <Button>Primary action</Button>
          <Button variant="secondary">Secondary action</Button>
          <Button variant="tertiary">Tertiary action</Button>
          <Button variant="danger">Destructive action</Button>
          <Button loading loadingLabel="Saving changes">
            Save changes
          </Button>
          <IconButton icon="+" label="Add item" />
        </div>
      </section>
      <Card>
        <Field
          label="Project name"
          description="Use a short, recognizable name."
          required
        >
          <Input placeholder="Proprium" />
        </Field>
        <Field label="Description" error="A description is required.">
          <Textarea placeholder="Describe the project" />
        </Field>
      </Card>
      <section>
        <h2>Loading</h2>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
          }}
        >
          <Spinner label="Loading projects" />
          <Skeleton shape="text" />
          <Skeleton shape="circle" />
        </div>
      </section>
      <EmptyState
        title="No projects yet"
        description="Create a project to start organizing your work."
        primaryAction={<Button>Create project</Button>}
      />
    </main>
  );
}

export default {
  title: 'Components/Core',
  component: PrimitiveSpecimen,
} satisfies Meta<typeof PrimitiveSpecimen>;

export const Default: StoryObj<typeof PrimitiveSpecimen> = {};
