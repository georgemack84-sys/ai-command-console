import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiRequest } from '@/lib/api/api-client';

import { BackendConnectivity } from './backend-connectivity';

vi.mock('@/lib/api/api-client', () => ({ apiRequest: vi.fn() }));

const apiRequestMock = vi.mocked(apiRequest);

afterEach(() => vi.resetAllMocks());

describe('BackendConnectivity', () => {
  it('reports an available backend after a healthy liveness response', async () => {
    apiRequestMock.mockResolvedValue(true);

    render(<BackendConnectivity />);

    expect(screen.getByText('Backend connectivity: Checking…')).toBeVisible();
    await waitFor(() =>
      expect(screen.getByText('Backend connectivity: Available')).toBeVisible(),
    );
    expect(apiRequestMock).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/api/v1/health/live' }),
    );
  });

  it('reports an unavailable backend when the liveness request fails', async () => {
    apiRequestMock.mockRejectedValue(new Error('offline'));

    render(<BackendConnectivity />);

    await waitFor(() =>
      expect(
        screen.getByText('Backend connectivity: Unavailable'),
      ).toBeVisible(),
    );
  });
});
