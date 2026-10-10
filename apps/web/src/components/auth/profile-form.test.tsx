import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AuthenticationContext } from '@/lib/auth/auth-context';
import { updateCurrentUserProfile } from '@/lib/auth/auth-service';

import { ProfileForm } from './profile-form';

vi.mock('@/lib/auth/auth-service', () => ({
  updateCurrentUserProfile: vi.fn(),
}));

describe('ProfileForm', () => {
  it('updates the display name and refreshes authoritative authentication', async () => {
    vi.mocked(updateCurrentUserProfile).mockResolvedValue({
      id: 'user-1',
      username: 'alex',
      displayName: 'Alex Example',
      roles: [],
      permissions: new Set(),
    });
    const refreshAuthentication = vi.fn(async () => undefined);
    render(
      <AuthenticationContext.Provider
        value={{
          state: {
            status: 'authenticated',
            user: {
              id: 'user-1',
              username: 'alex',
              displayName: 'Alex',
              roles: [],
              permissions: new Set(),
            },
          },
          refreshAuthentication,
          completeLogin: async () => undefined,
          logout: async () => undefined,
        }}
      >
        <ProfileForm />
      </AuthenticationContext.Provider>,
    );
    fireEvent.change(screen.getByLabelText('Display name *'), {
      target: { value: 'Alex Example' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save profile' }));
    await waitFor(() =>
      expect(updateCurrentUserProfile).toHaveBeenCalledWith('Alex Example'),
    );
    expect(refreshAuthentication).toHaveBeenCalled();
    expect(await screen.findByText('Profile saved.')).toBeVisible();
  });
});
