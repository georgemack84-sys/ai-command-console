import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/ui/components';

function Example() {
  return (
    <Dialog>
      <DialogTrigger>Open dialog</DialogTrigger>
      <DialogContent>
        <DialogTitle>Example dialog</DialogTitle>
        <DialogClose>Close dialog</DialogClose>
      </DialogContent>
    </Dialog>
  );
}

describe('Dialog', () => {
  afterEach(() => {
    cleanup();
    document.getElementById('proprium-overlay-root')?.remove();
  });

  it('opens in the canonical overlay root and restores focus after Escape', async () => {
    const overlayRoot = document.createElement('div');
    overlayRoot.id = 'proprium-overlay-root';
    document.body.append(overlayRoot);
    render(<Example />);
    const trigger = screen.getByRole('button', { name: 'Open dialog' });
    trigger.focus();
    fireEvent.click(trigger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(overlayRoot.querySelector('[role="dialog"]')).toBeTruthy();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });
});
