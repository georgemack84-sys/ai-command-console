'use client';

import { RouteErrorState } from '@/ui/route-states';

export default function ProtectedError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteErrorState onRetry={reset} recoveryHref="/dashboard" />;
}
