import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Alert, ErrorState, UnavailableState } from '@/ui/components';
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
