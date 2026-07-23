import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/ui/components';

function Example({ onSelect }: { onSelect: (item: string) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>Actions</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onSelect={() => onSelect('edit')}>
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem disabled onSelect={() => onSelect('delete')}>
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

describe('DropdownMenu', () => {
  afterEach(() => {
    cleanup();
    document.getElementById('proprium-overlay-root')?.remove();
  });

  it('renders in the canonical overlay root and restores focus after Escape', async () => {
    const onSelect = vi.fn();
    const overlayRoot = document.createElement('div');
    overlayRoot.id = 'proprium-overlay-root';
    document.body.append(overlayRoot);
    render(<Example onSelect={onSelect} />);

    const trigger = screen.getByRole('button', { name: 'Actions' });
    trigger.focus();
    fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false });

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(overlayRoot.querySelector('[role="menu"]')).toBeTruthy();

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() =>
      expect(screen.queryByRole('menu')).not.toBeInTheDocument(),
    );
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it('selects enabled items and prevents disabled-item selection', () => {
    const onSelect = vi.fn();
    const overlayRoot = document.createElement('div');
    overlayRoot.id = 'proprium-overlay-root';
    document.body.append(overlayRoot);
    render(<Example onSelect={onSelect} />);

    fireEvent.pointerDown(screen.getByRole('button', { name: 'Actions' }), {
      button: 0,
      ctrlKey: false,
    });
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));
    expect(onSelect).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('menuitem', { name: 'Edit' }));
    expect(onSelect).toHaveBeenCalledWith('edit');
  });
});
