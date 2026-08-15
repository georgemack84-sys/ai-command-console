'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuthentication } from '@/lib/auth/auth-context';
import { Button, EmptyState } from '@/ui/components/primitives';

export function ShellUnauthorizedState() {
  const { logout } = useAuthentication();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const signOut = async () => {
    if (pending) return;
    setPending(true);
    await logout();
    router.replace('/login');
  };
  return (
    <main className="auth-resolution">
      <EmptyState
        title="Access unavailable"
        description="Your account does not have access to this application."
        action={
          <Button
            loading={pending}
            loadingLabel="Signing out"
            onClick={() => void signOut()}
          >
            Sign out
          </Button>
        }
      />
    </main>
  );
}
