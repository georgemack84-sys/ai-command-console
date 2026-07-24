import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Permission } from '@/generated/permission-catalog';
import { apiRequest } from '@/lib/api/api-client';
import { useAuthentication } from './auth-context';
import { AuthenticationProvider } from './auth-provider';

const authService = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  endSession: vi.fn(),
}));
vi.mock('./auth-service', () => authService);

const user = {
  id: 'user-1',
  username: 'operator',
  displayName: 'Operator',
  roles: [],
  permissions: new Set([Permission.AuthenticatedAccess]),
};
function Probe() {
  const { state, refreshAuthentication } = useAuthentication();
  return (
    <>
      <output>{state.status}</output>
      <button onClick={() => void refreshAuthentication()}>Refresh</button>
    </>
  );
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe('AuthenticationProvider invalidation', () => {
  beforeEach(() => {
    authService.getCurrentUser.mockReset();
    authService.endSession.mockReset();
  });
  it('keeps a stale refresh result from restoring access after a confirmed 401', async () => {
    const stale = deferred<typeof user>();
    authService.getCurrentUser
      .mockResolvedValueOnce(user)
      .mockReturnValueOnce(stale.promise);
    render(
      <AuthenticationProvider>
        <Probe />
      </AuthenticationProvider>,
    );
    await waitFor(() =>
      expect(screen.getByText('authenticated')).toBeVisible(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    await waitFor(() => expect(screen.getByText('loading')).toBeVisible());
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 401 })),
    );
    await expect(
      apiRequest({ path: '/api/v1/auth/me', parse: (value) => value }),
    ).rejects.toMatchObject({ kind: 'authentication' });
    await waitFor(() =>
      expect(screen.getByText('unauthenticated')).toBeVisible(),
    );
    stale.resolve(user);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.getByText('unauthenticated')).toBeVisible();
  });
  it('treats concurrent 401 responses as one invalidation and preserves identity on 403', async () => {
    authService.getCurrentUser.mockResolvedValue(user);
    render(
      <AuthenticationProvider>
        <Probe />
      </AuthenticationProvider>,
    );
    await waitFor(() =>
      expect(screen.getByText('authenticated')).toBeVisible(),
    );
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(new Response(null, { status: 403 }))
        .mockResolvedValueOnce(new Response(null, { status: 401 }))
        .mockResolvedValueOnce(new Response(null, { status: 401 })),
    );
    await expect(
      apiRequest({ path: '/api/v1/auth/me', parse: (value) => value }),
    ).rejects.toMatchObject({ kind: 'authorization' });
    expect(screen.getByText('authenticated')).toBeVisible();
    await Promise.all([
      apiRequest({ path: '/api/v1/auth/me', parse: (value) => value }).catch(
        () => undefined,
      ),
      apiRequest({ path: '/api/v1/auth/me', parse: (value) => value }).catch(
        () => undefined,
      ),
    ]);
    await waitFor(() =>
      expect(screen.getByText('unauthenticated')).toBeVisible(),
    );
    expect(authService.getCurrentUser).toHaveBeenCalledTimes(1);
  });
});
