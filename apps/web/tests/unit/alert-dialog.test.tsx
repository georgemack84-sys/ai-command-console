import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/ui/components';

function Example({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger>Remove item</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogTitle>Confirm removal</AlertDialogTitle>
        <AlertDialogDescription>
          Removing this item cannot be undone.
        </AlertDialogDescription>
        <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm}>Remove</AlertDialogAction>
      </AlertDialogContent>
    </AlertDialog>
  );
}
describe('AlertDialog', () => {
  afterEach(() => {
    cleanup();
    document.getElementById('proprium-overlay-root')?.remove();
  });

  it('does not confirm on Escape and closes through cancellation', async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const overlayRoot = document.createElement('div');
    overlayRoot.id = 'proprium-overlay-root';
    document.body.append(overlayRoot);
    render(<Example onConfirm={onConfirm} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove item' }));
    expect(
      screen.getByRole('alertdialog', { name: 'Confirm removal' }),
    ).toHaveAccessibleDescription('Removing this item cannot be undone.');
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
    );
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('cancels without confirming and restores focus to the trigger', async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const overlayRoot = document.createElement('div');
    overlayRoot.id = 'proprium-overlay-root';
    document.body.append(overlayRoot);
    render(<Example onConfirm={onConfirm} onCancel={onCancel} />);

    const trigger = screen.getByRole('button', { name: 'Remove item' });
    trigger.focus();
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
    );
    expect(onCancel).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it('invokes the consumer confirmation exactly once and closes', async () => {
    const confirm = vi.fn();
    const overlayRoot = document.createElement('div');
    overlayRoot.id = 'proprium-overlay-root';
    document.body.append(overlayRoot);
    render(
      <AlertDialog defaultOpen>
        <AlertDialogContent>
          <AlertDialogTitle>Confirm</AlertDialogTitle>
          <AlertDialogAction onClick={confirm}>Remove</AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>,
    );
    const action = screen.getByRole('button', { name: 'Remove' });
    fireEvent.click(action);
    expect(confirm).toHaveBeenCalledOnce();
    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
    );
  });
});
