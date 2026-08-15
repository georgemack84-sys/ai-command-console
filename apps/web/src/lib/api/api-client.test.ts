import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  apiRequest,
  emptyResponse,
  registerAuthenticationFailureHandler,
} from './api-client';
import { type ApiError } from './api-error';

afterEach(() => vi.unstubAllGlobals());
describe('apiRequest', () => {
  it('adds CSRF before a session exists and accepts a 204 login', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(
      apiRequest({
        path: '/api/v1/auth/login',
        method: 'POST',
        body: { username: 'u', password: 'p' },
        parse: () => emptyResponse,
      }),
    ).resolves.toBe(emptyResponse);
    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(new Headers(options.headers).get('X-Proprium-CSRF')).toBe('1');
    expect(options.credentials).toBe('include');
  });
  it('classifies authentication and authorization responses centrally', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 401 })),
    );
    await expect(
      apiRequest({ path: '/api/v1/auth/me', parse: (value) => value }),
    ).rejects.toMatchObject({
      kind: 'authentication',
      status: 401,
    } satisfies Partial<ApiError>);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 403 })),
    );
    await expect(
      apiRequest({ path: '/api/v1/auth/me', parse: (value) => value }),
    ).rejects.toMatchObject({
      kind: 'authorization',
      status: 403,
    } satisfies Partial<ApiError>);
  });
  it('notifies the authentication boundary when a request receives 401', async () => {
    const handler = vi.fn();
    const unregister = registerAuthenticationFailureHandler(handler);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 401 })),
    );
    await expect(
      apiRequest({ path: '/api/v1/auth/me', parse: (value) => value }),
    ).rejects.toMatchObject({ kind: 'authentication' });
    expect(handler).toHaveBeenCalledTimes(1);
    unregister();
  });
  it('does not replay a failed state-changing request after a 401', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 401 }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(
      apiRequest({
        path: '/api/v1/auth/logout',
        method: 'POST',
        parse: () => emptyResponse,
      }),
    ).rejects.toMatchObject({ kind: 'authentication' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
