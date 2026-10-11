import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  completePasswordReset,
  requestPasswordReset,
} from '@/lib/auth/auth-service';

import { PasswordResetForm } from './password-reset-form';

const search = vi.fn<() => URLSearchParams>();
vi.mock('next/navigation', () => ({ useSearchParams: () => search() }));
vi.mock('@/lib/auth/auth-service', () => ({
  completePasswordReset: vi.fn(),
  requestPasswordReset: vi.fn(),
}));

describe('PasswordResetForm', () => {
  it('confirms a well-formed request without exposing eligibility', async () => {
    search.mockReturnValue(new URLSearchParams());
    vi.mocked(requestPasswordReset).mockResolvedValue();
    render(<PasswordResetForm />);

    fireEvent.change(screen.getByLabelText('Recovery email *'), {
      target: { value: 'alex@example.test' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }));

    await waitFor(() =>
      expect(requestPasswordReset).toHaveBeenCalledWith('alex@example.test'),
    );
    expect(
      await screen.findByText(
        'If this address can be used, we sent a password-reset link.',
      ),
    ).toBeVisible();
  });

  it('uses a reset-link token only for completion and does not auto sign in', async () => {
    search.mockReturnValue(new URLSearchParams('token=opaque-reset-token'));
    vi.mocked(completePasswordReset).mockResolvedValue();
    render(<PasswordResetForm />);

    fireEvent.change(screen.getByLabelText('New password *'), {
      target: { value: 'replacement-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Reset password' }));

    await waitFor(() =>
      expect(completePasswordReset).toHaveBeenCalledWith(
        'opaque-reset-token',
        'replacement-password',
      ),
    );
    expect(
      await screen.findByText(
        'Your password has been reset. Sign in with your new password.',
      ),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: 'Back to sign in' })).toHaveAttribute(
      'href',
      '/login',
    );
  });
});
