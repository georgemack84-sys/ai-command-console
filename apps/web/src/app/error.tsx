'use client';

import { RouteErrorState } from '@/ui/route-states';

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="route-state-standalone">
      <RouteErrorState onRetry={reset} />
    </main>
  );
}
