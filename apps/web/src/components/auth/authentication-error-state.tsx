'use client';
import { useAuthentication } from '@/lib/auth/auth-context';
import { ErrorState } from '@/ui/components/primitives';
export function AuthenticationErrorState() {
  const { refreshAuthentication } = useAuthentication();
  return <ErrorState onRetry={() => void refreshAuthentication()} />;
}
