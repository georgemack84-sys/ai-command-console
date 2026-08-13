'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuthentication } from '@/lib/auth/auth-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/ui/components/overlays';
export function UserMenu() {
  const { state, logout } = useAuthentication();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  if (state.status !== 'authenticated') return null;
  const signOut = async () => {
    if (pending) return;
    setPending(true);
    try {
      await logout();
      router.replace('/login');
    } finally {
      setPending(false);
    }
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="ui-button" aria-label="Open user menu">
        {state.user.displayName}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <p>{state.user.username}</p>
        <DropdownMenuItem asChild>
          <Link href="/settings">Settings</Link>
        </DropdownMenuItem>
        <DropdownMenuItem disabled={pending} onSelect={() => void signOut()}>
          {pending ? 'Signing out…' : 'Sign out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
