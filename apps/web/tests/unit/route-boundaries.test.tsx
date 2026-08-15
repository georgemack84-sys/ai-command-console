import { fireEvent, render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import ProtectedError from '@/app/(protected)/error';
import ProtectedLoading from '@/app/(protected)/loading';
import ProtectedNotFound from '@/app/(protected)/not-found';
import RootError from '@/app/error';
import RootLoading from '@/app/loading';
import RootNotFound from '@/app/not-found';

describe('Next.js route boundaries', () => {
  it('keeps protected route states free of duplicate main landmarks', () => {
    for (const Boundary of [ProtectedLoading, ProtectedNotFound]) {
      const { container, unmount } = render(createElement(Boundary));
      expect(container.querySelector('main')).toBeNull();
      unmount();
    }
  });

  it('gives standalone root states their own main landmark', () => {
    for (const Boundary of [RootLoading, RootNotFound]) {
      const { unmount } = render(createElement(Boundary));
      expect(screen.getByRole('main')).toBeInTheDocument();
      unmount();
    }
  });

  it('passes reset through protected and root error boundaries without exposing errors', () => {
    const syntheticError = new Error('database password=fake-secret');

    for (const Boundary of [ProtectedError, RootError]) {
      const reset = vi.fn();
      const { unmount } = render(
        createElement(Boundary, { error: syntheticError, reset }),
      );
      expect(screen.queryByText(/fake-secret/i)).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
      expect(reset).toHaveBeenCalledTimes(1);
      unmount();
    }
  });
});
