'use client';

import type { Meta, StoryObj } from '@storybook/react';
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
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './index';

function OverlaySpecimen() {
  return (
    <main style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
      <Dialog>
        <DialogTrigger asChild>
          <Button>Open dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Project settings</DialogTitle>
          <DialogDescription>
            Update the settings for this project.
          </DialogDescription>
          <DialogClose asChild>
            <Button variant="secondary">Close</Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="danger">Delete project</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Delete this project?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone.
          </AlertDialogDescription>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <AlertDialogCancel asChild>
              <Button variant="secondary">Cancel</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="danger">Delete</Button>
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary">Actions</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Rename</DropdownMenuItem>
          <DropdownMenuItem>Duplicate</DropdownMenuItem>
          <DropdownMenuItem disabled>Archive</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </main>
  );
}

export default {
  title: 'Components/Overlays',
  component: OverlaySpecimen,
} satisfies Meta<typeof OverlaySpecimen>;

export const Default: StoryObj<typeof OverlaySpecimen> = {};
