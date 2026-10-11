import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  beginRecoveryContactVerification,
  completeRecoveryContactVerification,
  getRecoveryContact,
} from '@/lib/auth/auth-service';

import { RecoveryContactForm } from './recovery-contact-form';

vi.mock('@/lib/auth/auth-service', () => ({
  beginRecoveryContactVerification: vi.fn(),
  completeRecoveryContactVerification: vi.fn(),
  getRecoveryContact: vi.fn(),
}));

describe('RecoveryContactForm', () => {
  it('requests verification with the current-password proof and keeps only masked state', async () => {
    vi.mocked(getRecoveryContact).mockResolvedValue({
      maskedEmail: null,
      isVerified: false,
      verificationPending: false,
    });
    vi.mocked(beginRecoveryContactVerification).mockResolvedValue();
    render(<RecoveryContactForm />);

    await waitFor(() => expect(getRecoveryContact).toHaveBeenCalled());
    fireEvent.change(screen.getByLabelText('Recovery email *'), {
      target: { value: 'alex@example.test' },
    });
    fireEvent.change(screen.getByLabelText('Current password *'), {
      target: { value: 'current-password' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Send verification code' }),
    );

    await waitFor(() =>
      expect(beginRecoveryContactVerification).toHaveBeenCalledWith(
        'alex@example.test',
        'current-password',
      ),
    );
    expect(
      await screen.findByText(
        'If this address can be used, we sent a verification code.',
      ),
    ).toBeVisible();
    expect(screen.queryByText('alex@example.test')).not.toBeInTheDocument();
  });

  it('verifies a pending code and refreshes the masked contact state', async () => {
    vi.mocked(getRecoveryContact)
      .mockResolvedValueOnce({
        maskedEmail: 'a***@EXAMPLE.TEST',
        isVerified: false,
        verificationPending: true,
      })
      .mockResolvedValueOnce({
        maskedEmail: 'a***@EXAMPLE.TEST',
        isVerified: true,
        verificationPending: false,
      });
    vi.mocked(completeRecoveryContactVerification).mockResolvedValue();
    render(<RecoveryContactForm />);

    expect(
      await screen.findByText('Verification pending: a***@EXAMPLE.TEST'),
    ).toBeVisible();
    fireEvent.change(screen.getByLabelText('Verification code *'), {
      target: { value: 'opaque-code' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Verify recovery contact' }),
    );

    await waitFor(() =>
      expect(completeRecoveryContactVerification).toHaveBeenCalledWith(
        'opaque-code',
      ),
    );
    expect(await screen.findByText('Recovery contact verified.')).toBeVisible();
    expect(
      await screen.findByText('Verified contact: a***@EXAMPLE.TEST'),
    ).toBeVisible();
  });
});
