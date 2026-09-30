'use client';

import { useEffect, useState } from 'react';

import { apiRequest } from '@/lib/api/api-client';

type ConnectivityStatus = 'checking' | 'available' | 'unavailable';

function isHealthy(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    'status' in value &&
    value.status === 'healthy'
  );
}

export function BackendConnectivity() {
  const [status, setStatus] = useState<ConnectivityStatus>('checking');

  useEffect(() => {
    const controller = new AbortController();
    void apiRequest({
      path: '/api/v1/health/live',
      signal: controller.signal,
      parse: (value) => isHealthy(value),
    })
      .then((healthy) => setStatus(healthy ? 'available' : 'unavailable'))
      .catch(() => {
        if (!controller.signal.aborted) setStatus('unavailable');
      });
    return () => controller.abort();
  }, []);

  const label = {
    checking: 'Checking…',
    available: 'Available',
    unavailable: 'Unavailable',
  }[status];

  return <p>Backend connectivity: {label}</p>;
}
