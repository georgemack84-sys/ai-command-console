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
  AlertDialogConfirm,
  AlertDialogContent,
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

  it('prevents duplicate confirmation and exposes a safe retry after failure', async () => {
    const confirm = vi
      .fn()
      .mockRejectedValueOnce(new Error('private detail'))
      .mockResolvedValueOnce(undefined);
    const overlayRoot = document.createElement('div');
    overlayRoot.id = 'proprium-overlay-root';
    document.body.append(overlayRoot);
    render(
      <AlertDialog defaultOpen>
        <AlertDialogContent>
          <AlertDialogTitle>Confirm</AlertDialogTitle>
          <AlertDialogConfirm onConfirm={confirm}>Remove</AlertDialogConfirm>
        </AlertDialogContent>
      </AlertDialog>,
    );
    const action = screen.getByRole('button', { name: 'Remove' });
    fireEvent.click(action);
    fireEvent.click(action);
    await screen.findByRole('alert');
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('alert')).not.toHaveTextContent('private detail');
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    await waitFor(() => expect(confirm).toHaveBeenCalledTimes(2));
  });
});
