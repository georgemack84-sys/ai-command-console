'use client';

import { useState } from 'react';

import { ApplicationShell } from '@/shell/components/application-shell';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Field,
  Input,
} from './index';

import type { Meta, StoryObj } from '@storybook/react';

const meta = {
  title: 'Components/Overlays',
  parameters: { layout: 'centered' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function BasicDialogSpecimen() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Project settings</DialogTitle>
          <DialogDescription>
            Update the display name for this synthetic project.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <Field
            label="Project name"
            description="Visible to workspace members."
          >
            <Input defaultValue="Proprium" />
          </Field>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button>Save changes</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const DialogBasic: Story = { render: () => <BasicDialogSpecimen /> };

export const DialogLongContent: Story = {
  render: () => (
    <Dialog defaultOpen>
      <DialogContent size="large">
        <DialogHeader>
          <DialogTitle>Long dialog content</DialogTitle>
          <DialogDescription>
            The surface remains bounded by the viewport and scrolls internally.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          {Array.from({ length: 24 }, (_, index) => (
            <p key={index}>Review item {index + 1} before continuing.</p>
          ))}
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Close review</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  parameters: { viewport: { defaultViewport: 'compact' } },
};

export const AlertDialogDestructive: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="danger">Delete project</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <DialogHeader>
          <AlertDialogTitle>Delete this project?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the synthetic project and cannot be undone.
          </AlertDialogDescription>
        </DialogHeader>
        <DialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="secondary">Cancel</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant="danger">Delete project</Button>
          </AlertDialogAction>
        </DialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
};

function DropdownSpecimen() {
  const [selection, setSelection] = useState('No action selected');
  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary">Project actions</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onSelect={() => setSelection('Rename selected')}>
            Rename project
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setSelection('Duplicate selected')}>
            Duplicate project with a deliberately long destination label
          </DropdownMenuItem>
          <DropdownMenuItem disabled>Archive unavailable</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="danger"
            onSelect={() => setSelection('Delete selected')}
          >
            Delete project
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <p role="status">{selection}</p>
    </div>
  );
}

export const DropdownActions: Story = { render: () => <DropdownSpecimen /> };

export const NestedConfirmation: Story = {
  render: () => (
    <AlertDialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary">More actions</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Duplicate project</DropdownMenuItem>
          <AlertDialogTrigger asChild>
            <DropdownMenuItem variant="danger">Delete project</DropdownMenuItem>
          </AlertDialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialogContent>
        <DialogHeader>
          <AlertDialogTitle>Delete nested example?</AlertDialogTitle>
          <AlertDialogDescription>
            The menu closes before this topmost confirmation receives focus.
          </AlertDialogDescription>
        </DialogHeader>
        <DialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="secondary">Cancel</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant="danger">Delete example</Button>
          </AlertDialogAction>
        </DialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
};

export const OverlayInShell: Story = {
  render: () => (
    <ApplicationShell headerTitle="Overlay integration">
      <section>
        <h1>Overlay layering</h1>
        <p>The dialog portals above the sticky header and sidebar.</p>
        <BasicDialogSpecimen />
      </section>
    </ApplicationShell>
  ),
  parameters: {
    layout: 'fullscreen',
    nextjs: { navigation: { pathname: '/dashboard' } },
  },
};
