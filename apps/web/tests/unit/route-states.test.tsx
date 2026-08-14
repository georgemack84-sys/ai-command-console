import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  RouteErrorState,
  RouteLoadingState,
  RouteNotFoundState,
} from '@/ui/route-states';

describe('route-state patterns', () => {
  it('announces one loading status while keeping skeletons decorative', () => {
    const { container } = render(<RouteLoadingState blocks={2} />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading page…');
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
    expect(container.querySelectorAll('.ui-skeleton')).toHaveLength(6);
    expect(
      container.querySelectorAll('.ui-skeleton[aria-hidden="true"]'),
    ).toHaveLength(6);
    expect(document.activeElement).toBe(document.body);
  });

  it('renders safe error copy, focuses the route context, and retries once', () => {
    const retry = vi.fn();
    render(<RouteErrorState onRetry={retry} />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Something went wrong' }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/password=fake-secret/i)).not.toBeInTheDocument();
    expect(document.activeElement).toBe(
      screen.getByRole('heading', { level: 1, name: 'Something went wrong' }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('link', { name: 'Return home' })).toHaveAttribute(
      'href',
      '/',
    );
  });

  it('keeps not-found distinct from empty state and exposes recovery navigation', () => {
    render(<RouteNotFoundState recoveryHref="/dashboard" />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Page not found' }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/no records|empty/i)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Return home' })).toHaveAttribute(
      'href',
      '/dashboard',
    );
    expect(document.activeElement).toBe(
      screen.getByRole('heading', { level: 1, name: 'Page not found' }),
    );
  });
});
