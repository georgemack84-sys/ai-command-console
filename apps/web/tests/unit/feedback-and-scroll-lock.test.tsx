import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  Alert,
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  Skeleton,
  Spinner,
  UnavailableState,
} from '@/ui/components';
import { acquireScrollLock } from '@/ui/components/scroll-lock';

describe('feedback components', () => {
  it('uses assertive semantics only for errors', () => {
    render(
      <>
        <Alert variant="info">Information</Alert>
        <Alert variant="error">Failure</Alert>
      </>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Information');
    expect(screen.getByRole('alert')).toHaveTextContent('Failure');
  });
  it('renders safe retry states without exception details', () => {
    render(
      <>
        <ErrorState />
        <UnavailableState />
      </>,
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.queryByText(/stack|sql|token/i)).not.toBeInTheDocument();
  });
  it('distinguishes decorative loading visuals from announced status', () => {
    render(
      <>
        <Spinner data-testid="decorative-spinner" />
        <Skeleton data-testid="skeleton" />
        <LoadingState label="Loading projects" />
      </>,
    );
    expect(screen.getByTestId('decorative-spinner')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    expect(screen.getByTestId('skeleton')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    expect(screen.getByRole('status')).toHaveTextContent('Loading projects');
  });
  it('composes state actions without owning navigation or retry behavior', () => {
    render(
      <EmptyState
        title="No projects"
        description="Create the first project."
        action={<Button>Create project</Button>}
      />,
    );
    expect(
      screen.getByRole('region', { name: 'No projects' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Create project' }),
    ).toBeInTheDocument();
  });
});

describe('scroll lock', () => {
  it('restores scrolling only after every lock is released', () => {
    document.body.style.overflow = 'scroll';
    const first = acquireScrollLock();
    const second = acquireScrollLock();
    expect(document.body.style.overflow).toBe('hidden');
    first();
    expect(document.body.style.overflow).toBe('hidden');
    second();
    expect(document.body.style.overflow).toBe('scroll');
  });
});
